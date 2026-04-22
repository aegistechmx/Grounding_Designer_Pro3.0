// src/engine/fem/FEMAssembler.js
// Ensamblador principal del sistema FEM

import MeshGenerator from './mesh/MeshGenerator.js';
import StiffnessMatrixAssembler from './StiffnessMatrix.js';
import ConjugateGradientSolver from './solvers/ConjugateGradientSolver.js';
import BoundaryConditionManager from './BoundaryConditions.js';
import MultiLayerSoilModel from '../soil/MultiLayerSoilModel.js';

export class FEMAssembler {
  constructor(options = {}) {
    this.resolution = options.resolution || 0.5;
    this.solverTolerance = options.solverTolerance || 1e-8;
    this.maxIterations = options.maxIterations || 1000;
    this.soilModel = options.soilModel || MultiLayerSoilModel.createDefault();
  }

  /**
   * Ejecuta simulación FEM completa
   */
  async runSimulation(project) {
    const startTime = performance.now();
    
    // 1. Generar malla
    console.log('🔹 Generando malla...');
    const meshGenerator = new MeshGenerator(project.grid, this.resolution);
    const { nodes, elements } = meshGenerator.generateStructuredMesh();
    
    console.log(`   Nodos: ${nodes.length}, Elementos: ${elements.length}`);
    
    // 2. Ensamblar matriz de rigidez
    console.log('🔹 Ensamblando matriz de rigidez...');
    const assembler = new StiffnessMatrixAssembler();
    assembler.initialize(nodes.length);
    
    for (const element of elements) {
      const [n1, n2, n3] = element.nodes;
      const conductivity = this.getAverageConductivity(
        nodes[n1], nodes[n2], nodes[n3]
      );
      
      const Ke = assembler.computeElementMatrix(
        nodes[n1], nodes[n2], nodes[n3],
        conductivity
      );
      
      assembler.addToGlobalMatrix(Ke, [n1, n2, n3]);
    }
    
    // 3. Configurar condiciones de borde
    console.log('🔹 Configurando condiciones de borde...');
    const bcManager = new BoundaryConditionManager();
    
    // Tierra infinita en bordes
    const groundNodes = bcManager.identifyInfiniteGroundNodes(nodes, project.grid);
    console.log(`   ${groundNodes.length} nodos de tierra infinita`);
    
    // Punto de inyección de corriente (falla)
    const faultPoint = {
      x: (project.grid?.length || 10) / 2,
      y: (project.grid?.width || 10) / 2
    };
    const Ig = project.scenarios?.[0]?.Ig || 1000;
    bcManager.identifySourceNodes(nodes, faultPoint, Ig);
    
    // Puntos de la malla conductora
    const conductorPoints = this.generateConductorPoints(project.grid);
    bcManager.applyConductorConditions(nodes, conductorPoints, 0);
    
    // 4. Aplicar condiciones al sistema
    const F = new Array(nodes.length).fill(0);
    const modifiedF = bcManager.applyToSystem(assembler.K, F, nodes);
    
    // 5. Resolver sistema
    console.log('🔹 Resolviendo sistema lineal...');
    const solver = new ConjugateGradientSolver({
      maxIterations: this.maxIterations,
      tolerance: this.solverTolerance
    });
    
    const result = solver.solve(assembler.K, modifiedF, nodes.length);
    console.log(`   Convergió en ${result.iterations} iteraciones, error: ${result.residual.toExponential(2)}`);
    
    // 6. Calcular campos derivados
    console.log('🔹 Calculando campos derivados...');
    const voltageField = result.solution;
    const stepVoltageMap = this.computeStepVoltageMap(voltageField, nodes, elements);
    const touchVoltageMap = this.computeTouchVoltageMap(voltageField, nodes);
    
    // 7. Calcular resistencia de malla
    const groundResistance = this.computeGroundResistance(voltageField, Ig);
    
    const endTime = performance.now();
    
    return {
      voltageField,
      nodes,
      elements,
      stepVoltageMap,
      touchVoltageMap,
      groundResistance,
      iterations: result.iterations,
      executionTime: endTime - startTime,
      converged: result.converged
    };
  }

  /**
   * Obtiene conductividad promedio del elemento
   */
  getAverageConductivity(n1, n2, n3) {
    const cx = this.soilModel.getConductivity(n1.x, n1.y);
    const cy = this.soilModel.getConductivity(n2.x, n2.y);
    const cz = this.soilModel.getConductivity(n3.x, n3.y);
    return (cx + cy + cz) / 3;
  }

  /**
   * Genera puntos de la malla conductora
   */
  generateConductorPoints(grid) {
    if (!grid) return [];
    const points = []
    const { length = 10, width = 10, nx = 8, ny = 8 } = grid;
    
    const nxSafe = Math.max(1, nx);
    const nySafe = Math.max(1, ny);
    const dx = length / nxSafe;
    const dy = width / nySafe;
    
    // Líneas horizontales
    for (let i = 0; i <= nxSafe; i++) {
      for (let j = 0; j <= nySafe; j++) {
        points.push({ x: i * dx, y: j * dy });
      }
    }
    
    return points;
  }

  /**
   * Calcula mapa de tensión de paso
   */
  computeStepVoltageMap(voltageField, nodes, elements) {
    const stepVoltages = [];
    
    for (const element of elements) {
      const [n1, n2, n3] = element.nodes;
      const V1 = voltageField[n1];
      const V2 = voltageField[n2];
      const V3 = voltageField[n3];
      
      // Tensión de paso máxima en el elemento
      const maxStep = Math.max(
        Math.abs(V1 - V2),
        Math.abs(V2 - V3),
        Math.abs(V3 - V1)
      );
      
      stepVoltages.push({
        elementId: element.id,
        value: maxStep,
        nodes: [n1, n2, n3]
      });
    }
    
    return stepVoltages;
  }

  /**
   * Calcula mapa de tensión de contacto
   */
  computeTouchVoltageMap(voltageField, nodes) {
    const touchVoltages = [];
    
    for (const node of nodes) {
      // Tensión de contacto ≈ 70% del potencial en superficie
      const touchVoltage = voltageField[node.id] * 0.7;
      touchVoltages.push({
        nodeId: node.id,
        x: node.x,
        y: node.y,
        value: touchVoltage
      });
    }
    
    return touchVoltages;
  }

  /**
   * Calcula resistencia de malla a partir de resultados FEM
   */
  computeGroundResistance(voltageField, injectedCurrent) {
    if (!injectedCurrent || injectedCurrent === 0) return 0;
    if (!voltageField || !Array.isArray(voltageField) || voltageField.length === 0) return 0;
    
    // Potencial máximo (en el punto de inyección)
    const maxPotential = Math.max(...voltageField);
    
    return maxPotential / Math.max(0.1, injectedCurrent);
  }
}

export default FEMAssembler;
