// src/engine/autodesign/objective/ObjectiveFunction.js
// Función objetivo multi-objetivo para optimización

export class ObjectiveFunction {
  constructor(weights = null) {
    this.weights = weights || {
      cost: 0.4,
      safety: 0.4,
      resistance: 0.2
    };
  }

  /**
   * Calcula fitness de un diseño
   */
  evaluate(design, simulation, compliance) {
    // Objetivo 1: Minimizar costo
    const costScore = this.evaluateCost(design, simulation);
    
    // Objetivo 2: Maximizar seguridad
    const safetyScore = this.evaluateSafety(simulation, compliance);
    
    // Objetivo 3: Minimizar resistencia
    const resistanceScore = this.evaluateResistance(simulation);
    
    // Penalización por incumplimiento normativo
    const penalty = this.computePenalty(compliance);
    
    // Fitness ponderado
    const fitness = 
      this.weights.cost * (1 - costScore) +
      this.weights.safety * safetyScore +
      this.weights.resistance * (1 - resistanceScore) -
      penalty;
    
    return {
      fitness: Math.max(0, Math.min(1, fitness)),
      cost: costScore,
      safety: safetyScore,
      resistance: resistanceScore,
      penalty,
      meetsStandards: compliance.globalCompliant
    };
  }

  /**
   * Evalúa costo del diseño
   */
  evaluateCost(design, simulation) {
    // Costo de conductores
    const conductorLength = 2 * (design.gridLength + design.gridWidth) * 
                           Math.max(design.numParallelX, design.numParallelY);
    const conductorCost = conductorLength * (design.conductorMaterial === 'copper' ? 12 : 8);
    
    // Costo de varillas
    const rodCost = design.numRods * 25 + design.rodLength * design.numRods * 8;
    
    // Costo de excavación
    const area = design.gridLength * design.gridWidth;
    const excavationCost = area * design.gridDepth * 15;
    
    // Costo de capa superficial
    const surfaceCost = area * design.surfaceDepth * 45;
    
    const totalCost = conductorCost + rodCost + excavationCost + surfaceCost;
    
    // Normalizar (costo típico entre 5000 y 50000)
    return Math.min(1, totalCost / 50000);
  }

  /**
   * Evalúa seguridad del diseño
   */
  evaluateSafety(simulation, compliance) {
    let safetyScore = 0;
    let totalChecks = 0;
    
    // Verificar tensiones de contacto
    if (simulation.touchVoltage) {
      const touchMargin = Math.min(1, simulation.touchVoltage.limit / 
                                   Math.max(simulation.touchVoltage.value, 1));
      safetyScore += touchMargin;
      totalChecks++;
    }
    
    // Verificar tensiones de paso
    if (simulation.stepVoltage) {
      const stepMargin = Math.min(1, simulation.stepVoltage.limit / 
                                  Math.max(simulation.stepVoltage.value, 1));
      safetyScore += stepMargin;
      totalChecks++;
    }
    
    // Verificar cumplimiento normativo
    if (compliance) {
      safetyScore += compliance.globalCompliant ? 1 : 0.5;
      totalChecks++;
    }
    
    return safetyScore / totalChecks;
  }

  /**
   * Evalúa resistencia de malla
   */
  evaluateResistance(simulation) {
    const Rg = simulation.groundResistance || 10;
    // Resistencia ideal < 5 Ω
    return Math.min(1, 5 / Rg);
  }

  /**
   * Calcula penalización por incumplimiento
   */
  computePenalty(compliance) {
    if (!compliance) return 0.5;
    
    let penalty = 0;
    
    if (!compliance.globalCompliant) penalty += 0.3;
    
    if (compliance.standards?.IEEE80 && !compliance.standards.IEEE80.compliant) {
      penalty += 0.2;
    }
    
    if (compliance.standards?.NOM001 && !compliance.standards.NOM001.compliant) {
      penalty += 0.25;
    }
    
    if (compliance.standards?.CFE && !compliance.standards.CFE.compliant) {
      penalty += 0.25;
    }
    
    return Math.min(0.8, penalty);
  }
}

export default ObjectiveFunction;
