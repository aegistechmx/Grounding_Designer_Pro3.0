/**
 * Fault Model - Professional calculation engine for fault current and voltage calculations
 * Implements IEEE 80 standard fault calculations with full traceability
 * 
 * CONSOLIDATED: Uses IEEE80Formulas as single source of truth for IEEE 80 factors
 */

import IEEE80Formulas from './IEEE80Formulas.js';

class FaultModel {
  constructor(input) {
    this.traceability = []; // Initialize traceability first
    this.input = this.validateInput(input);
  }

  /**
   * Validate and normalize input parameters
   */
  validateInput(input) {
    const required = ['faultCurrent'];
    const missing = required.filter(key => input[key] === undefined || input[key] === null);
    
    if (missing.length > 0) {
      throw new Error(`Missing required input: ${missing.join(', ')}`);
    }

    const validated = {
      faultCurrent: this.validatePositiveNumber(input.faultCurrent, 'faultCurrent'),
      faultDuration: this.validatePositiveNumber(input.faultDuration || 0.5, 'faultDuration'),
      systemVoltage: this.validatePositiveNumber(input.systemVoltage || 13800, 'systemVoltage'),
      divisionFactor: this.validatePositiveNumber(input.divisionFactor || 0.15, 'divisionFactor'),
      bodyResistance: this.validatePositiveNumber(input.bodyResistance || 1000, 'bodyResistance'),
      bodyWeight: this.validatePositiveNumber(input.bodyWeight || 70, 'bodyWeight'),
      surfaceLayerResistivity: input.surfaceLayerResistivity || null,
      faultType: input.faultType || 'single_line_to_ground' // single_line_to_ground, three_phase, etc.
    };

    this.addTrace('input_validation', validated);
    return validated;
  }

  /**
   * Calculate grid current (Ig)
   */
  calculateGridCurrent() {
    const { faultCurrent, divisionFactor } = this.input;
    const result = faultCurrent * divisionFactor;

    this.addTrace('grid_current', {
      value: result,
      formula: 'Ig = If × Sf',
      inputs: { faultCurrent, divisionFactor }
    });

    return result;
  }

  /**
   * Calculate Ground Potential Rise (GPR)
   */
  calculateGPR(gridResistance) {
    const gridCurrent = this.calculateGridCurrent();
    const result = gridCurrent * gridResistance;

    this.addTrace('gpr', {
      value: result,
      formula: 'GPR = Ig × Rg',
      inputs: { gridCurrent, gridResistance }
    });

    return result;
  }

  /**
   * Calculate step voltage (Es) according to IEEE 80 Equation 15
   */
  calculateStepVoltage(gridResistance, geometricFactor, soilResistivity) {
    const gridCurrent = this.calculateGridCurrent();
    const { Ks } = geometricFactor;
    const totalConductorLength = 100; // This should be passed as parameter
    
    // Use real IEEE 80 formula
    const result = IEEE80Formulas.calculateStepVoltage(
      soilResistivity,
      gridCurrent,
      Ks,
      totalConductorLength
    );

    // Add traceability with real IEEE 80 formula documentation
    const formulaDoc = IEEE80Formulas.getFormulaDocumentation().stepVoltage;

    this.addTrace('step_voltage', {
      value: result,
      formula: formulaDoc.equation,
      reference: formulaDoc.reference,
      inputs: {
        soilResistivity,
        gridCurrent,
        geometricFactor: Ks,
        totalConductorLength
      },
      intermediateSteps: [
        {
          step: 'Grid current calculation',
          value: gridCurrent,
          unit: 'A',
          formula: 'Ig = If × Sf'
        },
        {
          step: 'Step voltage result',
          value: result,
          unit: 'V'
        }
      ]
    });

    return result;
  }

  /**
   * Calculate touch voltage (Em) according to IEEE 80 Equation 14
   */
  calculateTouchVoltage(gridResistance, geometricFactor, soilResistivity) {
    const gridCurrent = this.calculateGridCurrent();
    const { Km } = geometricFactor;
    const totalConductorLength = 100; // This should be passed as parameter
    
    // Use real IEEE 80 formula
    const result = IEEE80Formulas.calculateTouchVoltage(
      soilResistivity,
      gridCurrent,
      Km,
      totalConductorLength
    );

    // Add traceability with real IEEE 80 formula documentation
    const formulaDoc = IEEE80Formulas.getFormulaDocumentation().touchVoltage;

    this.addTrace('touch_voltage', {
      value: result,
      formula: formulaDoc.equation,
      reference: formulaDoc.reference,
      inputs: {
        soilResistivity,
        gridCurrent,
        geometricFactor: Km,
        totalConductorLength
      },
      intermediateSteps: [
        {
          step: 'Grid current calculation',
          value: gridCurrent,
          unit: 'A',
          formula: 'Ig = If × Sf'
        },
        {
          step: 'Touch voltage result',
          value: result,
          unit: 'V'
        }
      ]
    });

    return result;
  }

  /**
   * Calculate transferred voltage
   */
  calculateTransferredVoltage(gpr, transferFactor = 0.1) {
    const result = gpr * transferFactor;

    this.addTrace('transferred_voltage', {
      value: result,
      formula: 'Et = GPR × transfer_factor',
      inputs: { gpr, transferFactor }
    });

    return result;
  }

  /**
   * Calculate permissible touch voltage (IEEE 80)
   */
  calculatePermissibleTouchVoltage(faultDuration, bodyWeight, surfaceLayerResistivity = null) {
    const { bodyResistance } = this.input;
    
    // IEEE 70 formula for body current limit
    const bodyCurrentLimit = (0.116 / Math.sqrt(faultDuration)) * Math.sqrt(bodyWeight / 70);
    
    // Calculate permissible voltage
    let permissibleVoltage = bodyCurrentLimit * bodyResistance;
    
    // Apply surface layer factor if available
    if (surfaceLayerResistivity && surfaceLayerResistivity > 0) {
      const Cs = this.calculateSurfaceLayerFactor(surfaceLayerResistivity);
      permissibleVoltage *= Cs;
    }

    this.addTrace('permissible_touch_voltage', {
      value: permissibleVoltage,
      formula: 'Et70 = Ib × Rb × Cs',
      inputs: {
        faultDuration,
        bodyWeight,
        bodyResistance,
        bodyCurrentLimit,
        surfaceLayerResistivity,
        permissibleVoltage
      }
    });

    return permissibleVoltage;
  }

  /**
   * Calculate permissible step voltage (IEEE 80)
   */
  calculatePermissibleStepVoltage(faultDuration, bodyWeight, surfaceLayerResistivity = null) {
    const { bodyResistance } = this.input;
    
    // IEEE 70 formula for body current limit (step voltage uses different factor)
    const bodyCurrentLimit = (0.157 / Math.sqrt(faultDuration)) * Math.sqrt(bodyWeight / 70);
    
    // Calculate permissible voltage
    let permissibleVoltage = bodyCurrentLimit * bodyResistance;
    
    // Apply surface layer factor if available
    if (surfaceLayerResistivity && surfaceLayerResistivity > 0) {
      const Cs = this.calculateSurfaceLayerFactor(surfaceLayerResistivity);
      permissibleVoltage *= Cs;
    }

    this.addTrace('permissible_step_voltage', {
      value: permissibleVoltage,
      formula: 'Es70 = Ib × Rb × Cs',
      inputs: {
        faultDuration,
        bodyWeight,
        bodyResistance,
        bodyCurrentLimit,
        surfaceLayerResistivity,
        permissibleVoltage
      }
    });

    return permissibleVoltage;
  }

  /**
   * Calculate surface layer factor (Cs)
   */
  calculateSurfaceLayerFactor(surfaceLayerResistivity) {
    // Simplified surface layer factor calculation
    const baseResistivity = 100; // Assume base soil resistivity
    const K = (surfaceLayerResistivity - baseResistivity) / (surfaceLayerResistivity + baseResistivity);
    const h = 0.1; // Assume 100mm surface layer thickness
    const result = 1 - (0.09 * (1 - K) / (2 * h + 1));

    this.addTrace('surface_layer_factor', {
      value: result,
      formula: 'Cs = 1 - (0.09 × (1 - K) / (2h + 1))',
      inputs: {
        surfaceLayerResistivity,
        baseResistivity,
        K,
        h
      }
    });

    return Math.max(0.5, Math.min(2.0, result));
  }

  /**
   * Calculate safety margins
   */
  calculateSafetyMargins(calculatedTouch, calculatedStep, permissibleTouch, permissibleStep) {
    const touchMargin = ((permissibleTouch - calculatedTouch) / permissibleTouch) * 100;
    const stepMargin = ((permissibleStep - calculatedStep) / permissibleStep) * 100;

    const result = {
      touchMargin: Math.max(0, touchMargin),
      stepMargin: Math.max(0, stepMargin),
      touchSafe: calculatedTouch <= permissibleTouch,
      stepSafe: calculatedStep <= permissibleStep
    };

    this.addTrace('safety_margins', {
      value: result,
      formula: 'Margin = ((V_perm - V_calc) / V_perm) × 100%',
      inputs: {
        calculatedTouch,
        calculatedStep,
        permissibleTouch,
        permissibleStep,
        touchMargin,
        stepMargin
      }
    });

    return result;
  }

  /**
   * Calculate fault current distribution
   */
  calculateFaultDistribution(gridResistance, soilResistivity) {
    const { faultCurrent, divisionFactor } = this.input;
    const gridCurrent = this.calculateGridCurrent();
    
    // Simplified fault current distribution
    const earthReturnCurrent = faultCurrent * (1 - divisionFactor);
    const gridReturnCurrent = gridCurrent;
    
    const result = {
      totalFault: faultCurrent,
      earthReturn: earthReturnCurrent,
      gridReturn: gridReturnCurrent,
      divisionFactor
    };

    this.addTrace('fault_distribution', {
      value: result,
      formula: 'I_earth = If × (1 - Sf), I_grid = If × Sf',
      inputs: {
        faultCurrent,
        divisionFactor,
        earthReturnCurrent,
        gridReturnCurrent
      }
    });

    return result;
  }

  /**
   * Calculate thermal stress on conductors
   */
  calculateThermalStress(conductorSize, faultDuration) {
    // Simplified thermal stress calculation
    const awgToMm2 = {
      '4/0': 107.16,
      '3/0': 85.01,
      '2/0': 67.43,
      '1/0': 53.49,
      '1': 42.41,
      '2': 33.63,
      '3': 26.67,
      '4': 21.15
    };

    const crossSection = awgToMm2[conductorSize] || 42.41;
    const gridCurrent = this.calculateGridCurrent();
    const currentDensity = gridCurrent / crossSection;
    
    // Simplified thermal stress indicator
    const thermalStress = currentDensity * Math.sqrt(faultDuration);

    const result = {
      currentDensity,
      thermalStress,
      acceptable: thermalStress < 1000 // Simplified threshold
    };

    this.addTrace('thermal_stress', {
      value: result,
      formula: 'Thermal_stress = (Ig / A) × ×t',
      inputs: {
        conductorSize,
        crossSection,
        gridCurrent,
        faultDuration,
        currentDensity,
        thermalStress
      }
    });

    return result;
  }

  /**
   * Add traceability entry for debugging and auditing
   */
  addTrace(calculation, data) {
    this.traceability.push({
      timestamp: new Date().toISOString(),
      calculation,
      ...data
    });
  }

  /**
   * Get full traceability log
   */
  getTraceability() {
    return this.traceability;
  }

  /**
   * Utility: validate positive number
   */
  validatePositiveNumber(value, name) {
    if (typeof value !== 'number' || value <= 0) {
      throw new Error(`${name} must be a positive number, got: ${value}`);
    }
    return value;
  }

  /**
   * Get complete fault analysis using IEEE80Formulas (single source of truth)
   */
  analyze(gridResistance, geometricFactor, soilResistivity, surfaceLayerResistivity = null, gridGeometry = null) {
    const gridCurrent = this.calculateGridCurrent();
    const gpr = this.calculateGPR(gridResistance);
    
    // Calculate surface layer factor using IEEE80Formulas
    const surfaceLayerFactor = surfaceLayerResistivity ? 
      IEEE80Formulas.calculateSurfaceLayerFactor(
        soilResistivity,
        surfaceLayerResistivity,
        0.1 // Assume 100mm surface layer thickness
      ) : 1.0;
    
    // Calculate geometric factors using IEEE80Formulas
    let Ks, Km;
    if (gridGeometry) {
      const { length, width, numParallelX, numParallelY, gridDepth } = gridGeometry;
      Ks = IEEE80Formulas.calculateStepGeometricFactor(length, width, numParallelX, numParallelY, gridDepth);
      Km = IEEE80Formulas.calculateTouchGeometricFactor(length, width, numParallelX, numParallelY, gridDepth);
    } else if (geometricFactor) {
      Ks = geometricFactor.Ks;
      Km = geometricFactor.Km;
    } else {
      // Default factors if no geometry provided
      Ks = 1.0;
      Km = 1.5;
    }
    
    // Calculate total conductor length
    const totalConductorLength = gridGeometry ? 
      (gridGeometry.length * gridGeometry.numParallelY + gridGeometry.width * (gridGeometry.numParallelX - 1)) : 100;
    
    // Calculate voltages using IEEE80Formulas
    const stepVoltage = IEEE80Formulas.calculateStepVoltage(
      soilResistivity,
      gridCurrent,
      Ks,
      totalConductorLength,
      surfaceLayerFactor
    );
    
    const touchVoltage = IEEE80Formulas.calculateTouchVoltage(
      soilResistivity,
      gridCurrent,
      Km,
      totalConductorLength,
      surfaceLayerFactor
    );
    
    // Factor analysis
    const factorAnalysis = {
      Ks,
      Km,
      surfaceLayerFactor,
      stepToTouchRatio: touchVoltage / stepVoltage
    };
    
    this.addTrace('ieee80_formulas', {
      formula: 'E = (rho × Ig × K × Cs) / L',
      inputs: {
        soilResistivity,
        gridCurrent,
        Ks,
        Km,
        totalConductorLength,
        surfaceLayerFactor
      },
      result: {
        stepVoltage,
        touchVoltage
      }
    });
    
    const transferredVoltage = this.calculateTransferredVoltage(gpr);
    
    // Use IEEE80Formulas for permissible voltages
    const permissibleTouch = IEEE80Formulas.calculatePermissibleTouchVoltage(
      this.input.bodyWeight,
      this.input.faultDuration,
      surfaceLayerFactor,
      surfaceLayerResistivity || soilResistivity
    );
    const permissibleStep = IEEE80Formulas.calculatePermissibleStepVoltage(
      this.input.bodyWeight,
      this.input.faultDuration,
      surfaceLayerFactor,
      surfaceLayerResistivity || soilResistivity
    );
    
    const safetyMargins = this.calculateSafetyMargins(
      touchVoltage, 
      stepVoltage, 
      permissibleTouch, 
      permissibleStep
    );
    
    const faultDistribution = this.calculateFaultDistribution(gridResistance, soilResistivity);

    return {
      gridCurrent,
      gpr,
      stepVoltage,
      touchVoltage,
      transferredVoltage,
      permissibleTouch,
      permissibleStep,
      safetyMargins,
      faultDistribution,
      factorAnalysis,
      traceability: this.getTraceability()
    };
  }
}

export default FaultModel;
