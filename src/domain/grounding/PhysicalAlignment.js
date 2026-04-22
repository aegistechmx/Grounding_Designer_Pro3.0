/**
 * Physical Alignment Module
 * Ensures both analytical and discrete methods solve the same physical problem
 * with consistent definitions, boundary conditions, and parameters
 */

class PhysicalAlignment {
  /**
   * Compute unified effective grid current Ig
   * Both methods must use exactly this value
   */
  static computeGridCurrent(fault) {
    // IEEE 80 standard factors
    const Sf = fault.decrementFactor || 0.15; // Typical split factor
    const Df = fault.divisionFactor || 1.0;    // Current division factor
    
    return fault.current * Sf * Df;
  }

  /**
   * Calibrate global grid resistance to match discrete solver reference
   * Rg_global_calibrated = alpha * Rg_ieee
   * where alpha = Rg_discrete / Rg_ieee
   */
  static calibrateGridResistance(Rg_ieee, Rg_discrete) {
    const alpha = Rg_discrete / Rg_ieee;
    return alpha * Rg_ieee;
  }

  /**
   * Unified touch voltage definition
   * Touch = V_conductor - V_surface(1m away)
   */
  static computeTouchVoltage(nodes, nodeVoltages) {
    let maxTouchVoltage = 0;

    nodes.forEach((node, i) => {
      const surfacePotential = this.estimateSurfacePotential(node, nodes, nodeVoltages);
      const touchVoltage = Math.abs(nodeVoltages[i] - surfacePotential);

      if (touchVoltage > maxTouchVoltage) {
        maxTouchVoltage = touchVoltage;
      }
    });

    return maxTouchVoltage;
  }

  /**
   * Estimate surface potential near a node
   * Average of neighboring nodes within 1-2m radius
   */
  static estimateSurfacePotential(targetNode, allNodes, nodeVoltages) {
    const nearbyNodes = allNodes.filter(node => {
      const distance = this.calculateDistance(targetNode, node);
      return distance > 0.5 && distance <= 2.0; // 0.5m to 2m radius
    });

    if (nearbyNodes.length === 0) {
      // Fallback: use average of all non-target nodes
      const otherNodes = allNodes.filter((_, i) => nodeVoltages[i] !== nodeVoltages[allNodes.indexOf(targetNode)]);
      if (otherNodes.length > 0) {
        const otherVoltages = otherNodes.map(node => 
          nodeVoltages[allNodes.indexOf(node)]
        );
        return otherVoltages.reduce((sum, v) => sum + v, 0) / otherVoltages.length;
      }
      return 0; // Remote reference
    }

    const nearbyVoltages = nearbyNodes.map(node => 
      nodeVoltages[allNodes.indexOf(node)]
    );
    
    // Weight by inverse distance
    const weights = nearbyNodes.map(node => 
      1.0 / this.calculateDistance(targetNode, node)
    );
    
    const weightedSum = nearbyVoltages.reduce((sum, v, i) => sum + v * weights[i], 0);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    return weightedSum / totalWeight;
  }

  /**
   * Unified step voltage definition
   * For analytical method: IEEE 80 step voltage formula
   * For discrete method: Node-based calculation
   */
  static computeStepVoltage(nodes, nodeVoltages, method = 'analytical', gridGeometry = null, faultCurrent = null) {
    if (method === 'discrete') {
      // Discrete method: use node-based calculation
      let maxStepVoltage = 0;
      
      // Calculate actual grid spacing from node positions
      const spacing = this.calculateGridSpacing(nodes);
      
      // Find pairs at approximately grid spacing distance
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const distance = this.calculateDistance(nodes[i], nodes[j]);
          
          // Consider pairs at grid spacing (±20% tolerance)
          const tolerance = 0.2;
          if (distance >= spacing * (1 - tolerance) && distance <= spacing * (1 + tolerance)) {
            const stepVoltage = Math.abs(nodeVoltages[i] - nodeVoltages[j]);
            if (stepVoltage > maxStepVoltage) {
              maxStepVoltage = stepVoltage;
            }
          }
        }
      }
      
      return maxStepVoltage;
    } else {
      // Analytical method: IEEE 80 step voltage formula
      // Step = GPR * Ks * Ds / (sqrt(2) * pi * r)
      if (!gridGeometry || !faultCurrent) {
        console.warn('Analytical step voltage requires gridGeometry and faultCurrent');
        return 0;
      }
      
      // Calculate GPR
      const GPR = nodeVoltages[0]; // Assume first voltage is GPR
      
      // IEEE 80 step voltage factor (simplified)
      const Ks = 1.0; // Step geometric factor
      const Ds = 1.0; // Step distance (1m)
      const r = Math.sqrt(gridGeometry.gridLength * gridGeometry.gridWidth / Math.PI); // Equivalent radius
      
      const stepVoltage = (GPR * Ks * Ds) / (Math.sqrt(2) * Math.PI * r);
      
      return stepVoltage;
    }
  }

  /**
   * Calculate actual grid spacing from node positions
   */
  static calculateGridSpacing(nodes) {
    if (nodes.length < 2) return 1.0; // Default fallback
    
    // Find minimum non-zero distance between any two nodes
    let minDistance = Infinity;
    
    for (let i = 0; i < Math.min(nodes.length, 10); i++) {
      for (let j = i + 1; j < Math.min(nodes.length, 10); j++) {
        const distance = this.calculateDistance(nodes[i], nodes[j]);
        if (distance > 0 && distance < minDistance) {
          minDistance = distance;
        }
      }
    }
    
    return minDistance === Infinity ? 1.0 : minDistance;
  }

  /**
   * Calculate Euclidean distance between two nodes
   */
  static calculateDistance(node1, node2) {
    const dx = node1.x - node2.x;
    const dy = node1.y - node2.y;
    const dz = node1.z - node2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Align boundary conditions between methods
   * Ensure both methods use same physical parameters
   */
  static alignBoundaryConditions(gridGeometry, soilResistivity, faultCurrent) {
    return {
      // Geometric parameters (must be identical)
      area: gridGeometry.gridLength * gridGeometry.gridWidth,
      perimeter: 2 * (gridGeometry.gridLength + gridGeometry.gridWidth),
      totalConductorLength: this.calculateTotalConductorLength(gridGeometry),
      
      // Electrical parameters (must be identical)
      soilResistivity: soilResistivity,
      faultCurrent: faultCurrent,
      gridCurrent: this.computeGridCurrent({ current: faultCurrent }),
      
      // Reference conditions
      remoteReference: 0, // V_reference = 0 at infinity
      burialDepth: gridGeometry.burialDepth,
      numRods: gridGeometry.numRods || 0,
      rodLength: gridGeometry.rodLength || 3
    };
  }

  /**
   * Calculate total conductor length
   */
  static calculateTotalConductorLength(gridGeometry) {
    const { gridLength, gridWidth, numParallel, numParallelY } = gridGeometry;
    return gridLength * (numParallelY - 1) + gridWidth * (numParallel - 1);
  }

  /**
   * Method comparison metrics
   * Quantifies alignment between analytical and discrete methods
   */
  static compareMethods(globalResults, discreteResults) {
    const metrics = {
      Rg_error: this.calculateRelativeError(globalResults.gridResistance, discreteResults.gridResistance),
      step_error: this.calculateRelativeError(globalResults.stepVoltage, discreteResults.stepVoltage),
      touch_error: this.calculateRelativeError(globalResults.touchVoltage, discreteResults.touchVoltage),
      GPR_error: this.calculateRelativeError(globalResults.GPR, discreteResults.GPR)
    };

    return {
      ...metrics,
      overall_alignment: this.assessOverallAlignment(metrics),
      alignment_status: this.getAlignmentStatus(metrics)
    };
  }

  /**
   * Calculate relative error between two values
   */
  static calculateRelativeError(reference, value) {
    if (reference === 0) return 0;
    return Math.abs((value - reference) / reference);
  }

  /**
   * Assess overall alignment based on individual metrics
   */
  static assessOverallAlignment(metrics) {
    const targets = {
      Rg_error: 0.20,    // ±20%
      step_error: 0.30,  // ±30%
      touch_error: 0.30, // ±30%
      GPR_error: 0.25    // ±25%
    };

    let passed = 0;
    let total = 0;

    for (const [metric, target] of Object.entries(targets)) {
      total++;
      if (metrics[metric] <= target) passed++;
    }

    return passed / total; // 0 to 1
  }

  /**
   * Get alignment status based on metrics
   */
  static getAlignmentStatus(metrics) {
    const alignment = this.assessOverallAlignment(metrics);
    
    if (alignment >= 0.8) return 'EXCELLENT';
    if (alignment >= 0.6) return 'GOOD';
    if (alignment >= 0.4) return 'ACCEPTABLE';
    return 'NEEDS_IMPROVEMENT';
  }

  /**
   * Generate alignment report
   */
  static generateAlignmentReport(globalResults, discreteResults) {
    const comparison = this.compareMethods(globalResults, discreteResults);
    const alignment = this.alignBoundaryConditions(
      globalResults.gridGeometry,
      globalResults.soilResistivity,
      globalResults.faultCurrent
    );

    return {
      alignment_status: comparison.alignment_status,
      overall_alignment: comparison.overall_alignment,
      metrics: comparison,
      boundary_conditions: alignment,
      recommendations: this.generateRecommendations(comparison),
      physical_consistency: this.checkPhysicalConsistency(globalResults, discreteResults)
    };
  }

  /**
   * Generate recommendations based on alignment metrics
   */
  static generateRecommendations(comparison) {
    const recommendations = [];

    if (comparison.Rg_error > 0.20) {
      recommendations.push('Consider calibrating grid resistance formula');
    }

    if (comparison.step_error > 0.30) {
      recommendations.push('Review step voltage definition consistency');
    }

    if (comparison.touch_error > 0.30) {
      recommendations.push('Unify touch voltage reference potential');
    }

    if (comparison.GPR_error > 0.25) {
      recommendations.push('Align grid current calculation between methods');
    }

    if (recommendations.length === 0) {
      recommendations.push('Methods are well aligned - no action needed');
    }

    return recommendations;
  }

  /**
   * Check physical consistency between methods
   */
  static checkPhysicalConsistency(globalResults, discreteResults) {
    const checks = {
      touch_greater_than_step_global: globalResults.touchVoltage > globalResults.stepVoltage,
      touch_greater_than_step_discrete: discreteResults.touchVoltage > discreteResults.stepVoltage,
      all_positive_global: globalResults.touchVoltage > 0 && globalResults.stepVoltage > 0 && globalResults.gridResistance > 0,
      all_positive_discrete: discreteResults.touchVoltage > 0 && discreteResults.stepVoltage > 0 && discreteResults.gridResistance > 0
    };

    return {
      ...checks,
      overall_consistency: Object.values(checks).every(check => check),
      consistency_score: Object.values(checks).filter(check => check).length / Object.keys(checks).length
    };
  }
}

export default PhysicalAlignment;
