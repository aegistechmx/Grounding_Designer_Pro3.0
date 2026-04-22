/**
 * IEEE 80 Service - Professional implementation of IEEE 80 standard calculations
 * 
 * DEPRECATED: This service is deprecated as of architectural refactoring
 * All new code should use UnifiedEngine directly
 * 
 * Migration guide:
 * - Use new UnifiedEngine(input).analyze(options) instead of IEEE80Service.calculate(input)
 * - Use UnifiedEngine.getSourceOfTruth() to check which method is being used
 * - See UnifiedEngine documentation for available options
 * 
 * Kept for backward compatibility with existing code
 */

import GroundingCalculator from '../application/GroundingCalculator.js';

class IEEE80Service {
  /**
   * Standard IEEE 80 calculation method
   */
  static calculate(input) {
    const calculator = new GroundingCalculator(input);
    return calculator.calculate();
  }

  /**
   * Quick calculation with default parameters
   */
  static quickCalculate(params) {
    const defaultInput = {
      soil: {
        soilResistivity: params.soilResistivity || 100,
        surfaceLayerResistivity: params.surfaceLayerResistivity || null,
        surfaceLayerThickness: params.surfaceLayerThickness || 0.1,
        temperature: params.temperature || 20,
        humidity: params.humidity || 50,
        season: params.season || 'normal'
      },
      grid: {
        gridLength: params.gridLength || 30,
        gridWidth: params.gridWidth || 16,
        numParallel: params.numParallel || 15,
        numParallelY: params.numParallelY || null,
        numRods: params.numRods || 45,
        rodLength: params.rodLength || 3,
        gridDepth: params.gridDepth || 0.6,
        conductorSize: params.conductorSize || '4/0',
        conductorMaterial: params.conductorMaterial || 'copper'
      },
      fault: {
        faultCurrent: params.faultCurrent || 10000,
        faultDuration: params.faultDuration || 0.5,
        systemVoltage: params.systemVoltage || 13800,
        divisionFactor: params.divisionFactor || 0.15,
        bodyResistance: params.bodyResistance || 1000,
        bodyWeight: params.bodyWeight || 70
      }
    };

    return this.calculate(defaultInput);
  }

  /**
   * Validate input according to IEEE 80 requirements
   */
  static validateInput(input) {
    const errors = [];
    const warnings = [];

    // Soil parameters validation
    if (!input.soil) {
      errors.push('Soil parameters are required');
    } else {
      if (input.soil.soilResistivity <= 0 || input.soil.soilResistivity > 10000) {
        warnings.push('Soil resistivity outside typical range (1-10000 ××m)');
      }
      if (input.soil.temperature < -40 || input.soil.temperature > 60) {
        warnings.push('Temperature outside typical range (-40 to 60°C)');
      }
    }

    // Grid parameters validation
    if (!input.grid) {
      errors.push('Grid parameters are required');
    } else {
      if (input.grid.gridLength <= 0 || input.grid.gridLength > 1000) {
        warnings.push('Grid length outside typical range (1-1000 m)');
      }
      if (input.grid.gridWidth <= 0 || input.grid.gridWidth > 1000) {
        warnings.push('Grid width outside typical range (1-1000 m)');
      }
      if (input.grid.numParallel < 2 || input.grid.numParallel > 100) {
        warnings.push('Number of parallel conductors outside typical range (2-100)');
      }
      if (input.grid.numRods < 0 || input.grid.numRods > 500) {
        warnings.push('Number of rods outside typical range (0-500)');
      }
    }

    // Fault parameters validation
    if (!input.fault) {
      errors.push('Fault parameters are required');
    } else {
      if (input.fault.faultCurrent <= 0 || input.fault.faultCurrent > 100000) {
        warnings.push('Fault current outside typical range (1-100000 A)');
      }
      if (input.fault.faultDuration <= 0 || input.fault.faultDuration > 10) {
        warnings.push('Fault duration outside typical range (0.01-10 s)');
      }
      if (input.fault.divisionFactor <= 0 || input.fault.divisionFactor > 1) {
        warnings.push('Division factor outside typical range (0.01-1.0)');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Calculate design recommendations based on IEEE 80
   */
  static getDesignRecommendations(requirements) {
    const recommendations = {
      grid: {},
      rods: {},
      conductors: {},
      surface: {}
    };

    // Grid recommendations
    if (requirements.area) {
      const optimalSpacing = Math.sqrt(requirements.area / 100); // Rough estimate
      recommendations.grid.spacing = Math.max(3, Math.min(10, optimalSpacing));
      recommendations.grid.conductors = Math.ceil(Math.sqrt(requirements.area) / recommendations.grid.spacing) * 2;
    }

    // Rod recommendations
    if (requirements.resistivity) {
      if (requirements.resistivity > 500) {
        recommendations.rods.quantity = Math.ceil(requirements.area / 50);
        recommendations.rods.length = Math.max(3, requirements.resistivity / 200);
      } else {
        recommendations.rods.quantity = Math.ceil(requirements.area / 100);
        recommendations.rods.length = 3;
      }
    }

    // Conductor recommendations
    if (requirements.faultCurrent) {
      if (requirements.faultCurrent > 20000) {
        recommendations.conductors.size = '3/0';
        recommendations.conductors.material = 'copper';
      } else if (requirements.faultCurrent > 10000) {
        recommendations.conductors.size = '2/0';
        recommendations.conductors.material = 'copper';
      } else {
        recommendations.conductors.size = '1/0';
        recommendations.conductors.material = 'copper';
      }
    }

    // Surface layer recommendations
    if (requirements.safetyMargin && requirements.safetyMargin < 30) {
      recommendations.surface.thickness = 0.1; // 100mm
      recommendations.surface.material = 'gravel';
      recommendations.surface.resistivity = 3000; // ××m
    }

    return recommendations;
  }

  /**
   * Generate standard test cases for validation
   */
  static getTestCases() {
    return [
      {
        name: 'Small Commercial System',
        input: {
          soil: { soilResistivity: 100 },
          grid: { gridLength: 20, gridWidth: 15, numParallel: 8, numRods: 16 },
          fault: { faultCurrent: 5000, faultDuration: 0.5 }
        },
        expected: { gridResistance: 2.5, touchVoltage: 200, stepVoltage: 150 }
      },
      {
        name: 'Medium Industrial System',
        input: {
          soil: { soilResistivity: 300 },
          grid: { gridLength: 40, gridWidth: 30, numParallel: 15, numRods: 30 },
          fault: { faultCurrent: 15000, faultDuration: 1.0 }
        },
        expected: { gridResistance: 5.0, touchVoltage: 400, stepVoltage: 300 }
      },
      {
        name: 'Large Utility System',
        input: {
          soil: { soilResistivity: 500 },
          grid: { gridLength: 100, gridWidth: 80, numParallel: 25, numRods: 50 },
          fault: { faultCurrent: 30000, faultDuration: 1.0 }
        },
        expected: { gridResistance: 8.0, touchVoltage: 600, stepVoltage: 450 }
      }
    ];
  }

  /**
   * Run validation tests
   */
  static runTests() {
    const testCases = this.getTestCases();
    const results = [];

    for (const testCase of testCases) {
      try {
        const result = this.calculate(testCase.input);
        const passed = this.validateTestResult(result, testCase.expected);
        
        results.push({
          name: testCase.name,
          passed,
          result,
          expected: testCase.expected
        });
      } catch (error) {
        results.push({
          name: testCase.name,
          passed: false,
          error: error.message
        });
      }
    }

    return {
      total: testCases.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      results
    };
  }

  /**
   * Validate test result against expected values
   */
  static validateTestResult(result, expected) {
    const tolerance = 0.1; // 10% tolerance

    const checkValue = (actual, expected, name) => {
      if (expected === undefined) return true;
      const diff = Math.abs(actual - expected) / expected;
      return diff <= tolerance;
    };

    return checkValue(result.grid.resistance, expected.gridResistance, 'gridResistance') &&
           checkValue(result.fault.touchVoltage, expected.touchVoltage, 'touchVoltage') &&
           checkValue(result.fault.stepVoltage, expected.stepVoltage, 'stepVoltage');
  }

  /**
   * Export calculation results in IEEE 80 standard format
   */
  static exportIEEE80Format(results) {
    return {
      projectInfo: {
        standard: 'IEEE 80-2013',
        calculationDate: new Date().toISOString(),
        version: '1.0'
      },
      inputParameters: results.input,
      calculationResults: {
        soilAnalysis: results.soil,
        gridAnalysis: results.grid,
        faultAnalysis: results.fault
      },
      compliance: results.compliance,
      recommendations: results.recommendations,
      riskAssessment: results.riskAssessment,
      traceability: results.traceability
    };
  }

  /**
   * Import calculation results from IEEE 80 format
   */
  static importIEEE80Format(data) {
    if (!data.calculationResults) {
      throw new Error('Invalid IEEE 80 format - missing calculation results');
    }

    return {
      input: data.inputParameters,
      soil: data.calculationResults.soilAnalysis,
      grid: data.calculationResults.gridAnalysis,
      fault: data.calculationResults.faultAnalysis,
      compliance: data.compliance,
      recommendations: data.recommendations,
      riskAssessment: data.riskAssessment,
      traceability: data.traceability
    };
  }

  /**
   * Get calculation method documentation
   */
  static getDocumentation() {
    return {
      standard: 'IEEE 80-2013',
      title: 'Guide for Safety in AC Substation Grounding',
      methods: [
        {
          name: 'Grid Resistance',
          formula: 'Rg = × / (L/A + 1/(2×h) + 1/(××A))',
          description: 'Calculation of grounding grid resistance'
        },
        {
          name: 'Touch Voltage',
          formula: 'Em = Ig × Rg × Km',
          description: 'Maximum touch voltage calculation'
        },
        {
          name: 'Step Voltage',
          formula: 'Es = Ig × Rg × Ks',
          description: 'Maximum step voltage calculation'
        },
        {
          name: 'Permissible Touch Voltage',
          formula: 'Et70 = (0.116/×t) × ×(W/70) × Rb × Cs',
          description: 'IEEE 70 permissible touch voltage'
        },
        {
          name: 'Permissible Step Voltage',
          formula: 'Es70 = (0.157/×t) × ×(W/70) × Rb × Cs',
          description: 'IEEE 70 permissible step voltage'
        }
      ],
      references: [
        'IEEE Std 80-2013: Guide for Safety in AC Substation Grounding',
        'IEEE Std 142-2007: Green Book - Grounding of Industrial and Commercial Power Systems',
        'IEEE Std 81-2012: Guide for Measuring Earth Resistivity, Ground Impedance, and Earth Surface Potentials of a Grounding System'
      ]
    };
  }
}

export default IEEE80Service;
