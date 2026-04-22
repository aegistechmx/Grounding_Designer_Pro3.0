/**
 * Strong Input Validation - Professional engineering validation
 * Prevents dangerous inputs that could lead to incorrect calculations
 */

class ValidationError extends Error {
  constructor(message, code = 'VALIDATION_ERROR', field = null) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.field = field;
  }
}

class StrongValidation {
  
  /**
   * Validate number with engineering constraints
   */
  static validateNumber(value, field, options = {}) {
    const {
      min = 0,
      max = Infinity,
      required = true,
      unit = null,
      allowZero = false
    } = options;

    // Required check
    if (required && (value === undefined || value === null)) {
      throw new ValidationError(`${field} is required`, 'REQUIRED_FIELD', field);
    }

    // Type check
    if (value !== undefined && value !== null) {
      if (typeof value !== 'number' || isNaN(value)) {
        throw new ValidationError(`${field} must be a number, got ${typeof value}`, 'INVALID_TYPE', field);
      }

      // Range check
      const actualMin = allowZero ? 0 : min;
      if (value < actualMin) {
        throw new ValidationError(`${field} must be >= ${actualMin}, got ${value}`, 'OUT_OF_RANGE', field);
      }

      if (value > max) {
        throw new ValidationError(`${field} must be <= ${max}, got ${value}`, 'OUT_OF_RANGE', field);
      }

      // Unit validation if specified
      if (unit && typeof value === 'object' && value.unit !== unit) {
        throw new ValidationError(`${field} must be in ${unit}, got ${value.unit}`, 'INVALID_UNIT', field);
      }
    }

    return value;
  }

  /**
   * Validate soil parameters with engineering constraints
   */
  static validateSoil(soil) {
    if (!soil || typeof soil !== 'object') {
      throw new ValidationError('Soil parameters must be an object', 'INVALID_SOIL', 'soil');
    }

    // Soil resistivity - critical safety parameter
    this.validateNumber(soil.soilResistivity, 'soil.soilResistivity', {
      min: 0.1,      // Minimum realistic soil resistivity (ohm-m)
      max: 10000,    // Maximum realistic soil resistivity (ohm-m)
      required: true
    });

    // Surface layer resistivity
    if (soil.surfaceLayerResistivity !== undefined) {
      this.validateNumber(soil.surfaceLayerResistivity, 'soil.surfaceLayerResistivity', {
        min: 1,       // Must be higher than base resistivity
        max: 50000,   // Maximum surface resistivity (ohm-m)
        required: false
      });

      // Surface layer resistivity should be higher than base resistivity
      if (soil.surfaceLayerResistivity <= soil.soilResistivity) {
        throw new ValidationError(
          'Surface layer resistivity must be greater than base soil resistivity',
          'INVALID_SURFACE_RESISTIVITY',
          'soil.surfaceLayerResistivity'
        );
      }
    }

    // Surface layer thickness
    if (soil.surfaceLayerThickness !== undefined) {
      this.validateNumber(soil.surfaceLayerThickness, 'soil.surfaceLayerThickness', {
        min: 0.01,    // 1cm minimum
        max: 2.0,     // 2m maximum
        required: false
      });
    }

    // Temperature
    if (soil.temperature !== undefined) {
      this.validateNumber(soil.temperature, 'soil.temperature', {
        min: -40,     // -40°C minimum
        max: 60,      // 60°C maximum
        required: false
      });
    }

    // Humidity
    if (soil.humidity !== undefined) {
      this.validateNumber(soil.humidity, 'soil.humidity', {
        min: 0,       // 0% minimum
        max: 100,     // 100% maximum
        required: false
      });
    }

    // Season validation
    if (soil.season !== undefined) {
      const validSeasons = ['dry', 'normal', 'wet'];
      if (!validSeasons.includes(soil.season)) {
        throw new ValidationError(
          `Season must be one of: ${validSeasons.join(', ')}`,
          'INVALID_SEASON',
          'soil.season'
        );
      }
    }

    return soil;
  }

  /**
   * Validate grid parameters with engineering constraints
   */
  static validateGrid(grid) {
    if (!grid || typeof grid !== 'object') {
      throw new ValidationError('Grid parameters must be an object', 'INVALID_GRID', 'grid');
    }

    // Grid dimensions
    this.validateNumber(grid.gridLength, 'grid.gridLength', {
      min: 1,       // 1m minimum
      max: 1000,    // 1km maximum
      required: true
    });

    this.validateNumber(grid.gridWidth, 'grid.gridWidth', {
      min: 1,       // 1m minimum
      max: 1000,    // 1km maximum
      required: true
    });

    // Grid area validation
    const gridArea = grid.gridLength * grid.gridWidth;
    if (gridArea < 4) { // Minimum 2x2m grid
      throw new ValidationError(
        'Grid area must be at least 4 m² (2m x 2m minimum)',
        'GRID_TOO_SMALL',
        'grid'
      );
    }

    if (gridArea > 100000) { // Maximum 100m x 100m
      throw new ValidationError(
        'Grid area exceeds practical limit (100,000 m²)',
        'GRID_TOO_LARGE',
        'grid'
      );
    }

    // Conductor configuration
    this.validateNumber(grid.numParallel, 'grid.numParallel', {
      min: 2,       // Minimum 2 parallel conductors
      max: 100,     // Maximum 100 parallel conductors
      required: true,
      allowZero: false
    });

    if (grid.numParallelY !== undefined) {
      this.validateNumber(grid.numParallelY, 'grid.numParallelY', {
        min: 2,       // Minimum 2 parallel conductors
        max: 100,     // Maximum 100 parallel conductors
        required: false,
        allowZero: false
      });
    }

    // Rods
    this.validateNumber(grid.numRods, 'grid.numRods', {
      min: 0,       // Can have zero rods
      max: 500,     // Maximum 500 rods
      required: true
    });

    if (grid.rodLength !== undefined) {
      this.validateNumber(grid.rodLength, 'grid.rodLength', {
        min: 0.5,    // 0.5m minimum rod length
        max: 30,     // 30m maximum rod length
        required: false
      });
    }

    // Grid depth
    if (grid.gridDepth !== undefined) {
      this.validateNumber(grid.gridDepth, 'grid.gridDepth', {
        min: 0.1,    // 10cm minimum depth
        max: 5.0,    // 5m maximum depth
        required: false
      });
    }

    // Conductor properties
    if (grid.conductorSize !== undefined) {
      const validSizes = ['4/0', '3/0', '2/0', '1/0', '1', '2', '3', '4', '6', '8'];
      if (!validSizes.includes(grid.conductorSize)) {
        throw new ValidationError(
          `Conductor size must be one of: ${validSizes.join(', ')}`,
          'INVALID_CONDUCTOR_SIZE',
          'grid.conductorSize'
        );
      }
    }

    if (grid.conductorMaterial !== undefined) {
      const validMaterials = ['copper', 'aluminum', 'steel', 'copper-clad-steel'];
      if (!validMaterials.includes(grid.conductorMaterial)) {
        throw new ValidationError(
          `Conductor material must be one of: ${validMaterials.join(', ')}`,
          'INVALID_CONDUCTOR_MATERIAL',
          'grid.conductorMaterial'
        );
      }
    }

    return grid;
  }

  /**
   * Validate fault parameters with engineering constraints
   */
  static validateFault(fault) {
    if (!fault || typeof fault !== 'object') {
      throw new ValidationError('Fault parameters must be an object', 'INVALID_FAULT', 'fault');
    }

    // Fault current - critical safety parameter
    this.validateNumber(fault.faultCurrent, 'fault.faultCurrent', {
      min: 100,      // 100A minimum realistic fault
      max: 100000,   // 100kA maximum realistic fault
      required: true
    });

    // Fault duration
    this.validateNumber(fault.faultDuration, 'fault.faultDuration', {
      min: 0.01,    // 10ms minimum
      max: 10,      // 10s maximum
      required: true
    });

    // System voltage
    if (fault.systemVoltage !== undefined) {
      this.validateNumber(fault.systemVoltage, 'fault.systemVoltage', {
        min: 120,     // 120V minimum
        max: 800000, // 800kV maximum
        required: false
      });
    }

    // Division factor
    if (fault.divisionFactor !== undefined) {
      this.validateNumber(fault.divisionFactor, 'fault.divisionFactor', {
        min: 0.01,    // 1% minimum
        max: 1.0,     // 100% maximum
        required: false
      });
    }

    // Body resistance
    if (fault.bodyResistance !== undefined) {
      this.validateNumber(fault.bodyResistance, 'fault.bodyResistance', {
        min: 500,     // 500× minimum
        max: 5000,    // 5000× maximum
        required: false
      });
    }

    // Body weight
    if (fault.bodyWeight !== undefined) {
      this.validateNumber(fault.bodyWeight, 'fault.bodyWeight', {
        min: 30,      // 30kg minimum
        max: 200,     // 200kg maximum
        required: false
      });
    }

    // Fault type
    if (fault.faultType !== undefined) {
      const validTypes = ['single_line_to_ground', 'three_phase', 'line_to_line', 'double_line_to_ground'];
      if (!validTypes.includes(fault.faultType)) {
        throw new ValidationError(
          `Fault type must be one of: ${validTypes.join(', ')}`,
          'INVALID_FAULT_TYPE',
          'fault.faultType'
        );
      }
    }

    return fault;
  }

  /**
   * Validate complete grounding system input
   */
  static validateGroundingInput(input) {
    if (!input || typeof input !== 'object') {
      throw new ValidationError('Input must be a valid object', 'INVALID_INPUT', 'input');
    }

    // Validate each section
    const validatedSoil = this.validateSoil(input.soil || {});
    const validatedGrid = this.validateGrid(input.grid || {});
    const validatedFault = this.validateFault(input.fault || {});

    // Cross-parameter validation
    this.validateCrossParameters(validatedSoil, validatedGrid, validatedFault);

    return {
      soil: validatedSoil,
      grid: validatedGrid,
      fault: validatedFault,
      options: input.options || {}
    };
  }

  /**
   * Validate cross-parameter consistency
   */
  static validateCrossParameters(soil, grid, fault) {
    // Grid size vs fault current
    const gridArea = grid.gridLength * grid.gridWidth;
    const maxFaultForGridSize = gridArea * 1000; // Rough rule: 1kA per 1000 m²
    
    if (fault.faultCurrent > maxFaultForGridSize) {
      throw new ValidationError(
        `Fault current (${fault.faultCurrent}A) is too high for grid size (${gridArea.toFixed(0)}m²)`,
        'FAULT_GRID_MISMATCH',
        'cross-validation'
      );
    }

    // Soil resistivity vs grid resistance expectations
    const expectedMaxResistance = soil.soilResistivity * 0.1; // Rough rule
    if (soil.soilResistivity > 1000 && grid.numRods < 10) {
      throw new ValidationError(
        'High soil resistivity requires more grounding rods for adequate performance',
        'SOIL_ROD_MISMATCH',
        'cross-validation'
      );
    }

    // Grid depth vs rod length
    if (grid.rodLength && grid.gridDepth && grid.rodLength <= grid.gridDepth) {
      throw new ValidationError(
        'Rod length must be greater than grid depth for effective grounding',
        'ROD_DEPTH_MISMATCH',
        'cross-validation'
      );
    }
  }

  /**
   * Sanitize and normalize input values
   */
  static sanitizeInput(input) {
    const sanitized = JSON.parse(JSON.stringify(input)); // Deep clone

    // Remove potentially harmful properties
    const harmfulKeys = ['__proto__', 'constructor', 'prototype'];
    
    function removeHarmful(obj) {
      if (typeof obj === 'object' && obj !== null) {
        harmfulKeys.forEach(key => delete obj[key]);
        Object.values(obj).forEach(value => {
          if (typeof value === 'object') removeHarmful(value);
        });
      }
    }

    removeHarmful(sanitized);

    // Normalize numeric values
    function normalizeNumbers(obj) {
      if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
            obj[key] = parseFloat(value);
          } else if (typeof value === 'object') {
            normalizeNumbers(value);
          }
        });
      }
    }

    normalizeNumbers(sanitized);

    return sanitized;
  }
}

export { StrongValidation, ValidationError };
export default StrongValidation;
