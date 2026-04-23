const ieee80Service = require('./ieee80.service.js');

class GroundingService {
  static async calculateGrounding(input) {
    try {
      // Validate input structure
      const validation = this.validateInput(input);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Use backend IEEE 80 service for calculations
      const params = {
        gridLength: input.grid.gridLength,
        gridWidth: input.grid.gridWidth,
        numParallel: input.grid.numParallel,
        numParallelY: input.grid.numParallelY,
        burialDepth: input.grid.gridDepth || 0.5,
        conductorDiameter: input.grid.conductorDiameter || 0.01,
        rodLength: input.grid.rodLength || 3,
        numRods: input.grid.numRods || 0,
        soilResistivity: input.soil.soilResistivity,
        surfaceLayerResistivity: input.soil.surfaceLayerResistivity || 0,
        surfaceLayerThickness: input.soil.surfaceDepth || 0.1,
        faultCurrent: input.fault.current,
        faultDuration: input.fault.faultDuration || 0.5
      };

      // Perform calculation using IEEE 80 service
      const results = ieee80Service.calculate(params);
      
      // Format results for API response
      return this.formatResults(results, input);
      
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

    // Validate grid parameters with range checks
    if (typeof input.grid.gridLength !== 'number' || input.grid.gridLength <= 0) {
      return { 
        isValid: false, 
        error: 'Grid length must be a positive number' 
      };
    }

    if (typeof input.grid.gridWidth !== 'number' || input.grid.gridWidth <= 0) {
      return { 
        isValid: false, 
        error: 'Grid width must be a positive number' 
      };
    }

    if (typeof input.grid.numParallel !== 'number' || input.grid.numParallel < 1) {
      return { 
        isValid: false, 
        error: 'Number of parallel conductors (X) must be at least 1' 
      };
    }

    if (typeof input.grid.numParallelY !== 'number' || input.grid.numParallelY < 1) {
      return { 
        isValid: false, 
        error: 'Number of parallel conductors (Y) must be at least 1' 
      };
    }

    // Validate fault parameters
    if (typeof input.fault.current !== 'number' || input.fault.current <= 0) {
      return { 
        isValid: false, 
        error: 'Fault current must be a positive number' 
      };
    }

    // Validate optional parameters if provided
    if (input.grid.gridDepth !== undefined && (typeof input.grid.gridDepth !== 'number' || input.grid.gridDepth < 0)) {
      return {
        isValid: false,
        error: 'Grid burial depth must be a non-negative number'
      };
    }

    if (input.grid.conductorDiameter !== undefined && (typeof input.grid.conductorDiameter !== 'number' || input.grid.conductorDiameter <= 0)) {
      return {
        isValid: false,
        error: 'Conductor diameter must be a positive number'
      };
    }

    if (input.grid.rodLength !== undefined && (typeof input.grid.rodLength !== 'number' || input.grid.rodLength <= 0)) {
      return {
        isValid: false,
        error: 'Rod length must be a positive number'
      };
    }

    if (input.grid.numRods !== undefined && (typeof input.grid.numRods !== 'number' || input.grid.numRods < 0)) {
      return {
        isValid: false,
        error: 'Number of rods must be a non-negative number'
      };
    }

    return { isValid: true };
  }

  static formatResults(results, input) {
    return {
      timestamp: new Date().toISOString(),
      input: {
        soil: {
          soilResistivity: input.soil.soilResistivity,
          effectiveResistivity: null // Backend IEEE 80 service doesn't calculate effective resistivity for multi-layer soil
        },
        grid: {
          gridLength: input.grid.gridLength,
          gridWidth: input.grid.gridWidth,
          totalLength: (input.grid.gridLength * input.grid.numParallelY) + (input.grid.gridWidth * input.grid.numParallel)
        },
        fault: {
          current: input.fault.current,
          duration: input.fault.faultDuration || 0.5
        }
      },
      results: {
        gridResistance: results.Rg,
        gpr: results.GPR,
        stepVoltage: results.Es,
        touchVoltage: results.Em
      },
      methods: {
        analytical: {
          resistance: results.Rg,
          gpr: results.GPR,
          step: results.Es,
          touch: results.Em
        },
        discrete: null // Backend doesn't have discrete method
      },
      calibration: null,
      safety: {
        stepVoltageLimit: results.Estep70,
        touchVoltageLimit: results.Etouch70,
        stepVoltageSafe: results.stepSafe70,
        touchVoltageSafe: results.touchSafe70
      }
    };
  }

  static async getHealthStatus() {
    return {
      service: 'GroundingService',
      status: 'OK',
      capabilities: [
        'IEEE 80 analytical method',
        'Safety assessment'
      ],
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new GroundingService();
