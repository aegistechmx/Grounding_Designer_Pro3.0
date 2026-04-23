/**
 * AI Service
 * Handles AI recommendations, optimization, and cost reduction
 */

class AIService {
  /**
   * Generate smart recommendations based on calculation results
   */
  generateSmartRecommendations(results) {
    const recommendations = [];
    
    const { Rg, Em, Es, Etouch70, Estep70, complies } = results;
    
    // Touch voltage recommendations
    if (!results.touchSafe70 && Em > Etouch70) {
      const excess = Em - Etouch70;
      recommendations.push({
        priority: 'CRITICAL',
        title: 'Reduce Touch Voltage',
        action: 'Increase burial depth or add ground conductors',
        value: `${excess.toFixed(0)} V excess`,
        impact: 'Improves personnel safety compliance'
      });
    }
    
    // Step voltage recommendations
    if (!results.stepSafe70 && Es > Estep70) {
      const excess = Es - Estep70;
      recommendations.push({
        priority: 'CRITICAL',
        title: 'Reduce Step Voltage',
        action: 'Add surface layer material or increase grid coverage',
        value: `${excess.toFixed(0)} V excess`,
        impact: 'Improves personnel safety compliance'
      });
    }
    
    // Grid resistance recommendations
    if (Rg > 5) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Reduce Grid Resistance',
        action: 'Add ground rods or increase conductor size',
        value: `${Rg.toFixed(2)} Ω (target: < 5 Ω)`,
        impact: 'Improves GPR distribution and fault clearing'
      });
    }
    
    // Cost optimization recommendations
    if (complies) {
      recommendations.push({
        priority: 'LOW',
        title: 'Optimize Cost',
        action: 'Reduce conductor count while maintaining compliance',
        value: 'Potential 15-20% cost reduction',
        impact: 'Reduces material costs'
      });
    }
    
    return recommendations;
  }

  /**
   * Optimize grid design using AI
   */
  async optimizeDesign(params, results, constraints = {}) {
    const { maxCost, targetRg, priority = 'safety' } = constraints;
    
    const optimizations = [];
    
    // Safety-first optimization
    if (priority === 'safety' && !results.complies) {
      if (!results.touchSafe70) {
        optimizations.push({
          parameter: 'burialDepth',
          currentValue: params.burialDepth,
          suggestedValue: params.burialDepth + 0.2,
          reason: 'Reduce touch voltage'
        });
      }
      
      if (!results.stepSafe70) {
        optimizations.push({
          parameter: 'surfaceLayerResistivity',
          currentValue: params.surfaceLayerResistivity || 0,
          suggestedValue: 3000,
          reason: 'Reduce step voltage with surface layer'
        });
      }
    }
    
    // Cost optimization
    if (priority === 'cost' && results.complies) {
      optimizations.push({
        parameter: 'numParallel',
        currentValue: params.numParallel,
        suggestedValue: Math.max(params.numParallel - 1, 4),
        reason: 'Reduce conductor count while maintaining compliance'
      });
      
      optimizations.push({
        parameter: 'numRods',
        currentValue: params.numRods,
        suggestedValue: Math.max(params.numRods - 2, 0),
        reason: 'Reduce rod count while maintaining compliance'
      });
    }
    
    return {
      optimizations,
      estimatedCost: this.estimateCost(params, optimizations),
      expectedImprovement: this.calculateImprovement(params, results, optimizations)
    };
  }

  /**
   * Estimate cost of design
   */
  estimateCost(params, optimizations = []) {
    let totalConductor = (params.numParallel * params.gridLength) + (params.numParallelY * params.gridWidth);
    let totalRods = params.numRods;
    
    // Apply optimizations
    optimizations.forEach(opt => {
      if (opt.parameter === 'numParallel') {
        totalConductor = (opt.suggestedValue * params.gridLength) + (params.numParallelY * params.gridWidth);
      }
      if (opt.parameter === 'numRods') {
        totalRods = opt.suggestedValue;
      }
    });
    
    const conductorCost = totalConductor * 12; // $12 per meter
    const rodCost = totalRods * 25; // $25 per rod
    
    return conductorCost + rodCost;
  }

  /**
   * Calculate expected improvement
   */
  calculateImprovement(params, results, optimizations) {
    let improvement = 0;
    
    optimizations.forEach(opt => {
      if (opt.parameter === 'burialDepth') {
        improvement += 0.1; // 10% improvement in touch voltage
      }
      if (opt.parameter === 'surfaceLayerResistivity') {
        improvement += 0.15; // 15% improvement in step voltage
      }
      if (opt.parameter === 'numParallel' || opt.parameter === 'numRods') {
        improvement += 0.05; // 5% cost reduction
      }
    });
    
    return Math.min(improvement, 1.0);
  }

  /**
   * Predict maintenance needs
   */
  predictMaintenance(params, results, history = []) {
    const predictions = [];
    
    // Corrosion prediction based on soil resistivity
    if (params.soilResistivity > 1000) {
      predictions.push({
        type: 'corrosion',
        severity: 'HIGH',
        recommendation: 'Use corrosion-resistant conductors (copper-clad steel)',
        timeline: '5-10 years'
      });
    }
    
    // Thermal stress prediction
    if (results.GPR > 5000) {
      predictions.push({
        type: 'thermal',
        severity: 'MEDIUM',
        recommendation: 'Monitor conductor connections regularly',
        timeline: '2-3 years'
      });
    }
    
    // Grid degradation prediction
    if (history.length > 5) {
      const lastRg = history[history.length - 1].results.Rg;
      const firstRg = history[0].results.Rg;
      const degradation = (lastRg - firstRg) / firstRg;
      
      if (degradation > 0.1) {
        predictions.push({
          type: 'degradation',
          severity: 'MEDIUM',
          recommendation: 'Schedule grid resistance testing annually',
          timeline: '1-2 years'
        });
      }
    }
    
    return predictions;
  }
}

module.exports = new AIService();
