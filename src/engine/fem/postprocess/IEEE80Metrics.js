// src/engine/fem/postprocess/IEEE80Metrics.js
// Cálculo de métricas IEEE 80 industriales

export class IEEE80Metrics {
  constructor(voltageField, mesh, project) {
    this.V = voltageField;
    this.mesh = mesh;
    this.project = project;
  }

  /**
   * Calcula todas las métricas IEEE 80
   */
  compute() {
    return {
      stepVoltage: this.computeStepVoltage(),
      touchVoltage: this.computeTouchVoltage(),
      groundResistance: this.computeGroundResistance(),
      GPR: this.computeGPR(),
      compliance: this.checkCompliance()
    };
  }

  /**
   * Calcula tensión de paso máxima
   */
  computeStepVoltage() {
    let maxStepVoltage = 0;
    let stepLocations = [];
    
    // Recorrer elementos para encontrar diferencia máxima
    for (const element of this.mesh.triangles) {
      const [n1, n2, n3] = element.vertices;
      const idx1 = this.findNodeIndex(n1);
      const idx2 = this.findNodeIndex(n2);
      const idx3 = this.findNodeIndex(n3);
      
      if (idx1 >= 0 && idx2 >= 0) {
        const stepVoltage = Math.abs(this.V[idx1] - this.V[idx2]);
        if (stepVoltage > maxStepVoltage) {
          maxStepVoltage = stepVoltage;
          stepLocations = [{ x: n1.x, y: n1.y }, { x: n2.x, y: n2.y }];
        }
      }
    }
    
    return {
      value: maxStepVoltage,
      location: stepLocations,
      tolerable: this.computeTolerableStepVoltage(),
      safe: maxStepVoltage <= this.computeTolerableStepVoltage()
    };
  }

  /**
   * Calcula tensión de contacto máxima
   */
  computeTouchVoltage() {
    // Tensión de contacto ≈ 70% del potencial en superficie
    let maxTouchVoltage = 0;
    let touchLocation = null;
    
    for (let i = 0; i < this.V.length; i++) {
      const node = this.mesh.nodes[i];
      if (node && !this.isConductorNode(node)) {
        const touchVoltage = this.V[i] * 0.7;
        if (touchVoltage > maxTouchVoltage) {
          maxTouchVoltage = touchVoltage;
          touchLocation = { x: node.x, y: node.y };
        }
      }
    }
    
    return {
      value: maxTouchVoltage,
      location: touchLocation,
      tolerable: this.computeTolerableTouchVoltage(),
      safe: maxTouchVoltage <= this.computeTolerableTouchVoltage()
    };
  }

  /**
   * Calcula resistencia de malla
   */
  computeGroundResistance() {
    const maxPotential = Math.max(...this.V);
    const totalCurrent = this.project.scenarios[0].Ig;
    
    return maxPotential / totalCurrent;
  }

  /**
   * Calcula GPR (Ground Potential Rise)
   */
  computeGPR() {
    return Math.max(...this.V);
  }

  /**
   * Calcula tensión de paso tolerable (IEEE 80)
   */
  computeTolerableStepVoltage() {
    const { soil, scenarios } = this.project;
    const scenario = scenarios[0];
    
    const Cs = 1 - (0.09 * (1 - soil.resistivity / soil.surfaceResistivity)) /
               (2 * soil.surfaceDepth + 0.09);
    
    return (1000 + 6 * Cs * soil.surfaceResistivity) *
           (0.157 / Math.sqrt(scenario.duration));
  }

  /**
   * Calcula tensión de contacto tolerable (IEEE 80)
   */
  computeTolerableTouchVoltage() {
    const { soil, scenarios } = this.project;
    const scenario = scenarios[0];
    
    const Cs = 1 - (0.09 * (1 - soil.resistivity / soil.surfaceResistivity)) /
               (2 * soil.surfaceDepth + 0.09);
    
    return (1000 + 1.5 * Cs * soil.surfaceResistivity) *
           (0.157 / Math.sqrt(scenario.duration));
  }

  /**
   * Verifica cumplimiento IEEE 80
   */
  checkCompliance() {
    const step = this.computeStepVoltage();
    const touch = this.computeTouchVoltage();
    
    return {
      complies: step.safe && touch.safe,
      stepSafe: step.safe,
      touchSafe: touch.safe,
      margin: Math.min(
        (touch.tolerable - touch.value) / touch.tolerable * 100,
        (step.tolerable - step.value) / step.tolerable * 100
      )
    };
  }

  /**
   * Encuentra índice de nodo
   */
  findNodeIndex(node) {
    return this.mesh.nodes.findIndex(n => n.x === node.x && n.y === node.y);
  }

  /**
   * Verifica si es nodo conductor
   */
  isConductorNode(node) {
    const { grid } = this.project;
    const tolerance = 0.1;
    const { length, width, nx, ny } = grid;
    
    const dx = length / nx;
    const dy = width / ny;
    
    for (let i = 0; i <= nx; i++) {
      for (let j = 0; j <= ny; j++) {
        const cx = i * dx;
        const cy = j * dy;
        
        if (Math.abs(node.x - cx) < tolerance && Math.abs(node.y - cy) < tolerance) {
          return true;
        }
      }
    }
    
    return false;
  }
}

export default IEEE80Metrics;
