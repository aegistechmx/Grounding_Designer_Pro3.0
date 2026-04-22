// ai/agents/DesignAgent.js
// Agente de IA para diseño automático de mallas

class DesignAgent {
  constructor(knowledgeBase, learningEngine) {
    this.knowledgeBase = knowledgeBase;
    this.learningEngine = learningEngine;
    this.constraintReasoner = new ConstraintReasoner();
  }

  /**
   * Genera diseño óptimo basado en contexto
   */
  async design(context) {
    const { soil, fault, voltageLevel, constraints } = context;
    
    // 1. Buscar diseños similares en knowledge base
    const similarDesigns = await this.knowledgeBase.findSimilar({
      soilResistivity: soil.resistivity,
      faultCurrent: fault.current,
      voltageLevel
    });
    
    // 2. Aplicar reglas heurísticas
    const heuristicDesign = this.generateHeuristicDesign(context);
    
    // 3. Optimizar con ML si hay datos históricos
    let mlDesign = null;
    if (this.learningEngine.hasModel()) {
      mlDesign = await this.learningEngine.predictOptimalDesign(context);
    }
    
    // 4. Combinar mejores características
    const design = this.combineDesigns([
      similarDesigns[0],
      heuristicDesign,
      mlDesign
    ]);
    
    // 5. Verificar restricciones
    const valid = this.constraintReasoner.validate(design, constraints);
    
    if (!valid) {
      return this.adjustDesign(design, constraints);
    }
    
    return design;
  }

  /**
   * Genera diseño heurístico basado en reglas de ingeniería
   */
  generateHeuristicDesign(context) {
    const { soil, fault, voltageLevel } = context;
    
    // Reglas heurísticas
    let gridSize = 8; // conductores base
    let rodCount = 16; // varillas base
    let rodLength = 3; // metros
    
    if (soil.resistivity > 500) {
      gridSize += 4;
      rodCount += 8;
      rodLength = 3.5;
    }
    
    if (fault.current > 5000) {
      gridSize += 2;
      rodCount += 4;
    }
    
    if (voltageLevel > 23000) {
      gridSize += 2;
      rodCount += 6;
    }
    
    return {
      numParallelX: gridSize,
      numParallelY: gridSize,
      numRods: rodCount,
      rodLength,
      gridDepth: 0.6,
      conductorMaterial: 'copper',
      conductorSize: '4/0',
      surfaceDepth: 0.15,
      surfaceResistivity: 5000
    };
  }

  /**
   * Combina múltiples diseños
   */
  combineDesigns(designs) {
    const validDesigns = designs.filter(d => d);
    if (validDesigns.length === 0) return null;
    
    const combined = {
      numParallelX: this.average(validDesigns.map(d => d.numParallelX)),
      numParallelY: this.average(validDesigns.map(d => d.numParallelY)),
      numRods: this.average(validDesigns.map(d => d.numRods)),
      rodLength: this.average(validDesigns.map(d => d.rodLength)),
      gridDepth: this.average(validDesigns.map(d => d.gridDepth)),
      conductorMaterial: this.majority(validDesigns.map(d => d.conductorMaterial)),
      conductorSize: this.majority(validDesigns.map(d => d.conductorSize))
    };
    
    return combined;
  }

  average(values) {
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }

  majority(values) {
    const counts = {};
    values.forEach(v => counts[v] = (counts[v] || 0) + 1);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  /**
   * Ajusta diseño para cumplir restricciones
   */
  adjustDesign(design, constraints) {
    let adjusted = { ...design };
    
    if (constraints.minConductors && design.numParallelX < constraints.minConductors) {
      adjusted.numParallelX = constraints.minConductors;
      adjusted.numParallelY = constraints.minConductors;
    }
    
    if (constraints.minRods && design.numRods < constraints.minRods) {
      adjusted.numRods = constraints.minRods;
    }
    
    return adjusted;
  }
}

class ConstraintReasoner {
  validate(design, constraints) {
    if (!design) return false;
    
    if (constraints.maxConductors && design.numParallelX > constraints.maxConductors) {
      return false;
    }
    
    if (constraints.maxRods && design.numRods > constraints.maxRods) {
      return false;
    }
    
    if (constraints.minRodLength && design.rodLength < constraints.minRodLength) {
      return false;
    }
    
    return true;
  }
}

module.exports = { DesignAgent, ConstraintReasoner };
