import GroundingCalculator from '../src/application/GroundingCalculator.js';

class GroundingService {
  static async calculateGrounding(input) {
    try {
      // Validate input structure
      const validation = this.validateInput(input);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Initialize calculator
      const calculator = new GroundingCalculator(input);
      
      // Perform calculation
      const results = calculator.calculate();
      
      // Format results for API response
      return this.formatResults(results);
      
    } catch (error) {
      throw new Error(`Grounding calculation failed: ${error.message}`);
    }
  }

  static validateInput(input) {
    if (!input) {
      return { isValid: false, error: 'Input is required' };
    }

    if (!input.soil || !input.grid || !input.fault) {
      return { 
        isValid: false, 
        error: 'Input must contain soil, grid, and fault objects' 
      };
    }

    // Validate soil parameters
    if (typeof input.soil.soilResistivity !== 'number' || input.soil.soilResistivity <= 0) {
      return { 
        isValid: false, 
        error: 'Soil resistivity must be a positive number' 
      };
    }

    // Validate grid parameters
    if (!input.grid.gridLength || !input.grid.gridWidth || 
        typeof input.grid.numParallel !== 'number' || 
        typeof input.grid.numParallelY !== 'number') {
      return { 
        isValid: false, 
        error: 'Grid must have valid length, width, and conductor counts' 
      };
    }

    // Validate fault parameters
    if (typeof input.fault.current !== 'number' || input.fault.current <= 0) {
      return { 
        isValid: false, 
        error: 'Fault current must be a positive number' 
      };
    }

    return { isValid: true };
  }

  static formatResults(results) {
    return {
      timestamp: new Date().toISOString(),
      input: {
        soil: results.soilModel ? {
          soilResistivity: results.soilModel.soilResistivity,
          effectiveResistivity: results.soilModel.effectiveResistivity
        } : null,
        grid: results.gridModel ? {
          gridLength: results.gridModel.gridLength,
          gridWidth: results.gridModel.gridWidth,
          totalLength: results.gridModel.totalLength
        } : null,
        fault: results.faultModel ? {
          current: results.faultModel.current,
          duration: results.faultModel.faultDuration
        } : null
      },
      results: {
        gridResistance: results.gridResistance,
        gpr: results.gpr,
        stepVoltage: results.stepVoltage,
        touchVoltage: results.touchVoltage
      },
      methods: {
        analytical: results.analytical ? {
          resistance: results.analytical.gridResistance,
          gpr: results.analytical.gpr,
          step: results.analytical.stepVoltage,
          touch: results.analytical.touchVoltage
        } : null,
        discrete: results.discrete ? {
          resistance: results.discrete.gridResistance,
          gpr: results.discrete.gpr,
          step: results.discrete.stepVoltage,
          touch: results.discrete.touchVoltage,
          // Spatial voltage data for heatmap
          nodes: results.discrete.spatialData?.nodes || [],
          voltages: results.discrete.spatialData?.voltages || []
        } : null
      },
      calibration: results.calibration ? {
        applied: results.calibration.applied,
        factors: results.calibration.factors,
        alignment: results.calibration.alignment
      } : null,
      safety: {
        stepVoltageLimit: 1000, // IEEE 80 typical limit
        touchVoltageLimit: 1000, // IEEE 80 typical limit
        stepVoltageSafe: (results.stepVoltage || 0) <= 1000,
        touchVoltageSafe: (results.touchVoltage || 0) <= 1000
      }
    };
  }

  static async getHealthStatus() {
    return {
      service: 'GroundingService',
      status: 'OK',
      capabilities: [
        'IEEE 80 analytical method',
        'Discrete nodal analysis',
        'Method calibration',
        'Safety assessment'
      ],
      timestamp: new Date().toISOString()
    };
  }
}

export default GroundingService;
