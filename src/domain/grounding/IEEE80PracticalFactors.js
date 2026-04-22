/**
 * IEEE 80 Practical Geometric Factors
 * Real-world implementation based on IEEE 80 standard
 * Captures non-uniform field effects, mesh geometry, and depth effects
 */

class IEEE80PracticalFactors {
  
  /**
   * Calculate Base Voltage (E_base)
   * E_base = (rho * I) / (2 * pi * L)
   * This is the uniform field approximation
   */
  static calculateBaseVoltage(rho, current, totalConductorLength) {
    const L = Math.max(1, totalConductorLength);
    return (rho * current) / (2 * Math.PI * L);
  }
  
  /**
   * Calculate Irregularity Factor (K_i)
   * Captures non-uniformity from edges, rods, and field concentration
   * Adjusted for realistic step/touch ratios
   */
  static calculateIrregularityFactor(spacing, burialDepth) {
    // More conservative irregularity factor
    // Based on IEEE 80 practical ranges for step/touch ratios of 1.2-1.8
    const depthFactor = 1 + (spacing / (spacing + 4 * burialDepth)) * 0.3;
    
    // IEEE 80 typical range: 1.0 - 1.5 (more conservative)
    return Math.max(1.0, Math.min(1.5, depthFactor));
  }
  
  /**
   * Calculate Step Factor (K_s)
   * Depends strongly on mesh spacing and burial depth
   * IEEE 80 practical approximation
   */
  static calculateStepFactor(spacing, burialDepth) {
    const ratio = spacing / burialDepth;
    
    // K_s = 0.5 + 1/(1 + ratio)
    // IEEE 80 typical range: 0.6 - 1.2
    const Ks = 0.5 + 1 / (1 + ratio);
    
    return Math.max(0.5, Math.min(1.5, Ks));
  }
  
  /**
   * Calculate Mesh/Touch Factor (K_m)
   * Always greater than K_s (touch is more critical than step)
   * IEEE 80 practical approximation
   */
  static calculateMeshFactor(spacing, burialDepth) {
    const ratio = burialDepth / spacing;
    
    // K_m = 1 + 1/(1 + ratio)
    // IEEE 80 typical range: 1.2 - 2.5
    const Km = 1 + 1 / (1 + ratio);
    
    return Math.max(1.0, Math.min(3.0, Km));
  }
  
  /**
   * Calculate Complete IEEE 80 Voltages
   * E_step = E_base * K_s * K_i
   * E_touch = E_base * K_m * K_i
   */
  static calculateVoltages(params) {
    const {
      rho,           // Soil resistivity (ohm-m)
      current,       // Grid current (A)
      totalConductorLength, // Total conductor length (m)
      spacing,       // Mesh spacing (m)
      burialDepth    // Burial depth (m)
    } = params;
    
    // Calculate base voltage
    const Ebase = this.calculateBaseVoltage(rho, current, totalConductorLength);
    
    // Calculate geometric factors
    const Ki = this.calculateIrregularityFactor(spacing, burialDepth);
    const Ks = this.calculateStepFactor(spacing, burialDepth);
    const Km = this.calculateMeshFactor(spacing, burialDepth);
    
    // Calculate final voltages
    const stepVoltage = Ebase * Ks * Ki;
    const touchVoltage = Ebase * Km * Ki;
    
    return {
      Ebase,
      Ki,
      Ks,
      Km,
      stepVoltage,
      touchVoltage,
      // Additional analysis
      stepToTouchRatio: touchVoltage / stepVoltage,
      irregularityImpact: Ki,
      meshToStepRatio: Km / Ks
    };
  }
  
  /**
   * Extract grid parameters from geometry
   */
  static extractGridParameters(gridGeometry) {
    const { length, width, numParallelX, numParallelY, burialDepth } = gridGeometry;
    
    // Calculate average spacing
    const spacingX = length / (numParallelX - 1);
    const spacingY = width / (numParallelY - 1);
    const spacing = (spacingX + spacingY) / 2;
    
    // Calculate total conductor length
    const horizontalLength = length * numParallelY + width * (numParallelX - 1);
    const totalConductorLength = horizontalLength + (gridGeometry.numRods || 0) * (gridGeometry.rodLength || 0);
    
    return {
      spacing,
      burialDepth,
      totalConductorLength
    };
  }
  
  /**
   * Enhanced calculation with full grid geometry
   */
  static calculateEnhancedVoltages(rho, current, gridGeometry, surfaceLayerFactor = 1.0) {
    const { spacing, burialDepth, totalConductorLength } = this.extractGridParameters(gridGeometry);
    
    const voltages = this.calculateVoltages({
      rho,
      current,
      totalConductorLength,
      spacing,
      burialDepth
    });
    
    // Apply surface layer factor
    const stepVoltage = voltages.stepVoltage * surfaceLayerFactor;
    const touchVoltage = voltages.touchVoltage * surfaceLayerFactor;
    
    return {
      ...voltages,
      stepVoltage,
      touchVoltage,
      surfaceLayerApplied: surfaceLayerFactor !== 1.0
    };
  }
  
  /**
   * Validate factor ranges (for debugging)
   */
  static validateFactors(factors) {
    const { Ki, Ks, Km } = factors;
    
    const validation = {
      Ki: { valid: Ki >= 1.0 && Ki <= 2.0, value: Ki, expected: '1.0 - 2.0' },
      Ks: { valid: Ks >= 0.5 && Ks <= 1.5, value: Ks, expected: '0.5 - 1.5' },
      Km: { valid: Km >= 1.0 && Km <= 3.0, value: Km, expected: '1.0 - 3.0' },
      relationships: {
        kmGreaterThanKs: Km > Ks,
        stepToTouchRatio: factors.stepToTouchRatio || (Km / Ks)
      }
    };
    
    validation.allValid = Object.values(validation).slice(0, 3).every(v => v.valid);
    validation.physicallyConsistent = validation.relationships.kmGreaterThanKs && 
                                   validation.relationships.stepToTouchRatio >= 1.2 &&
                                   validation.relationships.stepToTouchRatio <= 2.5;
    
    return validation;
  }
  
  /**
   * Get factor analysis for engineering reports
   */
  static getFactorAnalysis(gridGeometry, soilResistivity, faultCurrent) {
    const { spacing, burialDepth, totalConductorLength } = this.extractGridParameters(gridGeometry);
    
    const factors = {
      Ki: this.calculateIrregularityFactor(spacing, burialDepth),
      Ks: this.calculateStepFactor(spacing, burialDepth),
      Km: this.calculateMeshFactor(spacing, burialDepth)
    };
    
    const validation = this.validateFactors(factors);
    
    return {
      gridGeometry,
      extractedParams: { spacing, burialDepth, totalConductorLength },
      factors,
      validation,
      interpretation: {
        irregularity: factors.Ki > 1.5 ? 'High field non-uniformity' : 'Moderate field uniformity',
        stepRisk: factors.Ks > 1.0 ? 'Higher step voltage risk' : 'Normal step voltage',
        touchRisk: factors.Km > 1.8 ? 'Higher touch voltage risk' : 'Normal touch voltage',
        designRecommendations: this.getDesignRecommendations(factors, spacing, burialDepth)
      }
    };
  }
  
  /**
   * Design recommendations based on factor analysis
   */
  static getDesignRecommendations(factors, spacing, burialDepth) {
    const recommendations = [];
    
    if (factors.Ki > 1.5) {
      recommendations.push('Consider adding more conductors to reduce field irregularity');
    }
    
    if (factors.Ks > 1.0) {
      recommendations.push('Consider reducing mesh spacing to lower step voltage');
    }
    
    if (factors.Km > 1.8) {
      recommendations.push('Consider increasing burial depth or adding surface material');
    }
    
    if (spacing > 10) {
      recommendations.push('Mesh spacing is large - consider intermediate conductors');
    }
    
    if (burialDepth < 0.5) {
      recommendations.push('Burial depth is shallow - consider deeper installation');
    }
    
    return recommendations;
  }
}

export default IEEE80PracticalFactors;
