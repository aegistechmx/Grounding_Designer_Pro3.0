/**
 * Engineering Tolerance System - Professional numerical accuracy management
 * Defines acceptable tolerances for different calculation types
 */

class EngineeringTolerance {
  
  // IEEE 80 recommended tolerances
  static IEEE80_TOLERANCES = {
    // Voltage calculations (most critical)
    stepVoltage: {
      absolute: 5,      // ±5V absolute tolerance
      relative: 0.05,   // ±5% relative tolerance
      confidence: 0.95  // 95% confidence level
    },
    touchVoltage: {
      absolute: 10,     // ±10V absolute tolerance  
      relative: 0.05,   // ±5% relative tolerance
      confidence: 0.95
    },
    gpr: {
      absolute: 20,     // ±20V absolute tolerance
      relative: 0.03,   // ±3% relative tolerance
      confidence: 0.90
    },
    
    // Resistance calculations
    gridResistance: {
      absolute: 0.5,    // ±0.5× absolute tolerance
      relative: 0.10,  // ±10% relative tolerance
      confidence: 0.90
    },
    soilResistivity: {
      absolute: 5,     // ±5×m absolute tolerance
      relative: 0.15,  // ±15% relative tolerance (soil measurements are less precise)
      confidence: 0.85
    },
    
    // Current calculations
    faultCurrent: {
      absolute: 50,    // ±50A absolute tolerance
      relative: 0.02,  // ±2% relative tolerance
      confidence: 0.95
    },
    gridCurrent: {
      absolute: 25,    // ±25A absolute tolerance
      relative: 0.05,  // ±5% relative tolerance
      confidence: 0.90
    },
    
    // Geometric factors
    geometricFactor: {
      absolute: 0.01,  // ±0.01 absolute tolerance
      relative: 0.10,  // ±10% relative tolerance
      confidence: 0.85
    },
    
    // Safety margins
    safetyMargin: {
      absolute: 2,     // ±2% absolute tolerance
      relative: 0.10,  // ±10% relative tolerance
      confidence: 0.90
    }
  };

  /**
   * Check if value is within tolerance
   */
  static isWithinTolerance(calculated, expected, toleranceType) {
    const tolerance = this.IEEE80_TOLERANCES[toleranceType];
    
    if (!tolerance) {
      throw new Error(`Unknown tolerance type: ${toleranceType}`);
    }

    // Check absolute tolerance
    const absoluteDiff = Math.abs(calculated - expected);
    const withinAbsolute = absoluteDiff <= tolerance.absolute;

    // Check relative tolerance
    const relativeDiff = Math.abs((calculated - expected) / expected);
    const withinRelative = relativeDiff <= tolerance.relative;

    // Both must be satisfied
    const withinTolerance = withinAbsolute && withinRelative;

    return {
      withinTolerance,
      absoluteDiff,
      relativeDiff: relativeDiff * 100, // Convert to percentage
      absoluteLimit: tolerance.absolute,
      relativeLimit: tolerance.relative * 100, // Convert to percentage
      confidence: tolerance.confidence,
      passed: withinTolerance
    };
  }

  /**
   * Validate complete calculation results against expected values
   */
  static validateResults(calculated, expected, toleranceConfig = null) {
    const results = {};
    const config = toleranceConfig || this.IEEE80_TOLERANCES;

    for (const [key, expectedValue] of Object.entries(expected)) {
      if (typeof expectedValue === 'number' && calculated[key] !== undefined) {
        const tolerance = config[key];
        
        if (tolerance) {
          results[key] = this.isWithinTolerance(calculated[key], expectedValue, key);
        } else {
          // Use default tolerance for unknown types
          results[key] = this.isWithinTolerance(
            calculated[key], 
            expectedValue, 
            'gridResistance' // Default to resistance tolerance
          );
        }
      }
    }

    // Overall assessment
    const passedTests = Object.values(results).filter(r => r.passed).length;
    const totalTests = Object.keys(results).length;
    const overallPass = passedTests === totalTests;

    return {
      results,
      overall: {
        passed: overallPass,
        passRate: (passedTests / totalTests) * 100,
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests
      },
      summary: this.generateSummary(results)
    };
  }

  /**
   * Generate summary of tolerance validation
   */
  static generateSummary(results) {
    const passed = Object.values(results).filter(r => r.passed).length;
    const total = Object.keys(results).length;
    
    if (passed === total) {
      return 'All calculations within IEEE 80 tolerance limits';
    } else if (passed >= total * 0.8) {
      return 'Most calculations within tolerance limits';
    } else if (passed >= total * 0.5) {
      return 'Significant deviations from expected values';
    } else {
      return 'Major calculation errors detected';
    }
  }

  /**
   * Calculate uncertainty based on tolerance and confidence
   */
  static calculateUncertainty(value, toleranceType) {
    const tolerance = this.IEEE80_TOLERANCES[toleranceType];
    
    if (!tolerance) {
      throw new Error(`Unknown tolerance type: ${toleranceType}`);
    }

    // Use larger of absolute or relative tolerance
    const absoluteUncertainty = tolerance.absolute;
    const relativeUncertainty = value * tolerance.relative;
    const uncertainty = Math.max(absoluteUncertainty, relativeUncertainty);

    return {
      value,
      uncertainty,
      lowerBound: value - uncertainty,
      upperBound: value + uncertainty,
      confidence: tolerance.confidence,
      relativeUncertainty: (uncertainty / value) * 100
    };
  }

  /**
   * Apply tolerance to calculation result
   */
  static applyTolerance(value, toleranceType) {
    const uncertainty = this.calculateUncertainty(value, toleranceType);
    
    return {
      nominal: value,
      ...uncertainty,
      formatted: `${value.toFixed(2)} ± ${uncertainty.uncertainty.toFixed(2)} (${uncertainty.relativeUncertainty.toFixed(1)}%)`,
      withinEngineeringLimits: uncertainty.relativeUncertainty <= 15 // 15% is typical engineering limit
    };
  }

  /**
   * Compare two calculations for consistency
   */
  static compareCalculations(calc1, calc2, toleranceType) {
    const diff = Math.abs(calc1 - calc2);
    const avg = (calc1 + calc2) / 2;
    const relativeDiff = (diff / avg) * 100;
    
    const tolerance = this.IEEE80_TOLERANCES[toleranceType];
    const tolerancePercent = tolerance.relative * 100;

    return {
      calc1,
      calc2,
      difference: diff,
      relativeDifference: relativeDiff,
      toleranceLimit: tolerancePercent,
      consistent: relativeDiff <= tolerancePercent,
      assessment: relativeDiff <= tolerancePercent * 0.5 ? 'Excellent consistency' :
                  relativeDiff <= tolerancePercent ? 'Acceptable consistency' :
                  'Poor consistency - review calculations'
    };
  }

  /**
   * Get tolerance requirements for documentation
   */
  static getToleranceDocumentation() {
    return {
      standard: 'IEEE 80-2013 Recommended Practices',
      confidence: '95% confidence level for critical calculations',
      methodology: 'Combined absolute and relative tolerance criteria',
      notes: [
        'Voltage calculations have tighter tolerances due to safety implications',
        'Soil resistivity tolerances are wider due to measurement uncertainty',
        'All tolerances assume proper input validation and unit consistency',
        'Tolerances may be adjusted based on specific application requirements'
      ],
      disclaimer: 'These tolerances are for engineering calculations. Actual field conditions may vary.'
    };
  }

  /**
   * Validate calculation chain for cumulative error
   */
  static validateCalculationChain(chainResults, expectedFinal) {
    // Calculate cumulative uncertainty through the chain
    let cumulativeUncertainty = 0;
    let confidenceLevel = 1.0;

    for (const result of chainResults) {
      // Simplified uncertainty propagation (root sum of squares)
      const relativeUncertainty = result.uncertainty / result.value;
      cumulativeUncertainty += Math.pow(relativeUncertainty, 2);
      confidenceLevel *= result.confidence;
    }

    cumulativeUncertainty = Math.sqrt(cumulativeUncertainty);
    confidenceLevel = Math.pow(confidenceLevel, 1 / chainResults.length);

    const finalResult = chainResults[chainResults.length - 1];
    const finalUncertainty = finalResult.value * cumulativeUncertainty;

    return {
      finalValue: finalResult.value,
      cumulativeUncertainty: finalUncertainty,
      confidenceLevel,
      withinExpected: Math.abs(finalResult.value - expectedFinal) <= finalUncertainty,
      assessment: confidenceLevel >= 0.85 ? 'High confidence calculation' :
                  confidenceLevel >= 0.70 ? 'Moderate confidence' :
                  'Low confidence - review methodology'
    };
  }
}

export default EngineeringTolerance;
