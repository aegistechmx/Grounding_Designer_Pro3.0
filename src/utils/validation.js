/**
 * Validation Utilities - Professional input validation for grounding calculations
 * Ensures data integrity and provides meaningful error messages
 */

class ValidationUtils {
  /**
   * Validate positive number
   */
  static validatePositiveNumber(value, name, options = {}) {
    const { min = 0, max = Infinity, required = true } = options;
    
    if (required && (value === undefined || value === null)) {
      throw new ValidationError(`${name} is required`);
    }
    
    if (value !== undefined && value !== null) {
      if (typeof value !== 'number' || isNaN(value)) {
        throw new ValidationError(`${name} must be a number, got: ${typeof value}`);
      }
      
      if (value <= min) {
        throw new ValidationError(`${name} must be greater than ${min}, got: ${value}`);
      }
      
      if (value > max) {
        throw new ValidationError(`${name} must be less than ${max}, got: ${value}`);
      }
    }
    
    return value;
  }

  /**
   * Validate positive integer
   */
  static validatePositiveInteger(value, name, options = {}) {
    const { min = 1, max = Infinity, required = true } = options;
    
    this.validatePositiveNumber(value, name, { min, max, required });
    
    if (value !== undefined && value !== null && !Number.isInteger(value)) {
      throw new ValidationError(`${name} must be an integer, got: ${value}`);
    }
    
    return value;
  }

  /**
   * Validate string
   */
  static validateString(value, name, options = {}) {
    const { minLength = 0, maxLength = Infinity, required = true, allowedValues = [] } = options;
    
    if (required && (value === undefined || value === null)) {
      throw new ValidationError(`${name} is required`);
    }
    
    if (value !== undefined && value !== null) {
      if (typeof value !== 'string') {
        throw new ValidationError(`${name} must be a string, got: ${typeof value}`);
      }
      
      if (value.length < minLength) {
        throw new ValidationError(`${name} must be at least ${minLength} characters, got: ${value.length}`);
      }
      
      if (value.length > maxLength) {
        throw new ValidationError(`${name} must be at most ${maxLength} characters, got: ${value.length}`);
      }
      
      if (allowedValues.length > 0 && !allowedValues.includes(value)) {
        throw new ValidationError(`${name} must be one of: ${allowedValues.join(', ')}, got: ${value}`);
      }
    }
    
    return value;
  }

  /**
   * Validate array
   */
  static validateArray(value, name, options = {}) {
    const { minLength = 0, maxLength = Infinity, required = true } = options;
    
    if (required && (value === undefined || value === null)) {
      throw new ValidationError(`${name} is required`);
    }
    
    if (value !== undefined && value !== null) {
      if (!Array.isArray(value)) {
        throw new ValidationError(`${name} must be an array, got: ${typeof value}`);
      }
      
      if (value.length < minLength) {
        throw new ValidationError(`${name} must have at least ${minLength} items, got: ${value.length}`);
      }
      
      if (value.length > maxLength) {
        throw new ValidationError(`${name} must have at most ${maxLength} items, got: ${value.length}`);
      }
    }
    
    return value;
  }

  /**
   * Validate object
   */
  static validateObject(value, name, options = {}) {
    const { required = true, allowEmpty = false } = options;
    
    if (required && (value === undefined || value === null)) {
      throw new ValidationError(`${name} is required`);
    }
    
    if (value !== undefined && value !== null) {
      if (typeof value !== 'object' || Array.isArray(value)) {
        throw new ValidationError(`${name} must be an object, got: ${typeof value}`);
      }
      
      if (!allowEmpty && Object.keys(value).length === 0) {
        throw new ValidationError(`${name} cannot be empty`);
      }
    }
    
    return value;
  }

  /**
   * Validate email
   */
  static validateEmail(value, name, options = {}) {
    const { required = true } = options;
    
    this.validateString(value, name, { required });
    
    if (value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new ValidationError(`${name} must be a valid email address, got: ${value}`);
      }
    }
    
    return value;
  }

  /**
   * Validate date
   */
  static validateDate(value, name, options = {}) {
    const { required = true } = options;
    
    if (required && (value === undefined || value === null)) {
      throw new ValidationError(`${name} is required`);
    }
    
    if (value !== undefined && value !== null) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new ValidationError(`${name} must be a valid date, got: ${value}`);
      }
    }
    
    return value;
  }

  /**
   * Validate coordinate
   */
  static validateCoordinate(value, name, options = {}) {
    const { min = -90, max = 90, required = true } = options;
    
    this.validatePositiveNumber(value, name, { min, max, required });
    
    return value;
  }

  /**
   * Validate longitude
   */
  static validateLongitude(value, name, options = {}) {
    const { min = -180, max = 180, required = true } = options;
    
    this.validatePositiveNumber(value, name, { min, max, required });
    
    return value;
  }

  /**
   * Validate AWG conductor size
   */
  static validateAWGSize(value, name, options = {}) {
    const { required = true } = options;
    
    const validSizes = ['4/0', '3/0', '2/0', '1/0', '1', '2', '3', '4', '6', '8'];
    
    this.validateString(value, name, { required, allowedValues: validSizes });
    
    return value;
  }

  /**
   * Validate conductor material
   */
  static validateConductorMaterial(value, name, options = {}) {
    const { required = true } = options;
    
    const validMaterials = ['copper', 'aluminum', 'steel', 'copper-clad-steel'];
    
    this.validateString(value, name, { required, allowedValues: validMaterials });
    
    return value;
  }

  /**
   * Validate season
   */
  static validateSeason(value, name, options = {}) {
    const { required = true } = options;
    
    const validSeasons = ['dry', 'normal', 'wet'];
    
    this.validateString(value, name, { required, allowedValues: validSeasons });
    
    return value;
  }

  /**
   * Validate fault type
   */
  static validateFaultType(value, name, options = {}) {
    const { required = true } = options;
    
    const validTypes = ['single_line_to_ground', 'three_phase', 'line_to_line', 'double_line_to_ground'];
    
    this.validateString(value, name, { required, allowedValues: validTypes });
    
    return value;
  }

  /**
   * Validate complete grounding input
   */
  static validateGroundingInput(input) {
    const errors = [];
    const warnings = [];

    try {
      // Validate top-level structure
      this.validateObject(input, 'input', { required: true });

      // Validate soil parameters
      if (input.soil) {
        try {
          this.validatePositiveNumber(input.soil.soilResistivity, 'soilResistivity', { min: 1, max: 10000 });
          this.validatePositiveNumber(input.soil.surfaceLayerThickness, 'surfaceLayerThickness', { min: 0.01, max: 1, required: false });
          this.validatePositiveNumber(input.soil.temperature, 'temperature', { min: -40, max: 60, required: false });
          this.validatePositiveNumber(input.soil.humidity, 'humidity', { min: 0, max: 100, required: false });
          this.validateSeason(input.soil.season, 'season', { required: false });
        } catch (error) {
          errors.push(`Soil validation: ${error.message}`);
        }
      } else {
        errors.push('Soil parameters are required');
      }

      // Validate grid parameters
      if (input.grid) {
        try {
          this.validatePositiveNumber(input.grid.gridLength, 'gridLength', { min: 1, max: 1000 });
          this.validatePositiveNumber(input.grid.gridWidth, 'gridWidth', { min: 1, max: 1000 });
          this.validatePositiveInteger(input.grid.numParallel, 'numParallel', { min: 2, max: 100 });
          this.validatePositiveInteger(input.grid.numParallelY, 'numParallelY', { min: 2, max: 100, required: false });
          this.validatePositiveInteger(input.grid.numRods, 'numRods', { min: 0, max: 500 });
          this.validatePositiveNumber(input.grid.rodLength, 'rodLength', { min: 1, max: 30, required: false });
          this.validatePositiveNumber(input.grid.gridDepth, 'gridDepth', { min: 0.1, max: 5, required: false });
          this.validateAWGSize(input.grid.conductorSize, 'conductorSize', { required: false });
          this.validateConductorMaterial(input.grid.conductorMaterial, 'conductorMaterial', { required: false });
        } catch (error) {
          errors.push(`Grid validation: ${error.message}`);
        }
      } else {
        errors.push('Grid parameters are required');
      }

      // Validate fault parameters
      if (input.fault) {
        try {
          this.validatePositiveNumber(input.fault.faultCurrent, 'faultCurrent', { min: 100, max: 100000 });
          this.validatePositiveNumber(input.fault.faultDuration, 'faultDuration', { min: 0.01, max: 10 });
          this.validatePositiveNumber(input.fault.systemVoltage, 'systemVoltage', { min: 120, max: 500000, required: false });
          this.validatePositiveNumber(input.fault.divisionFactor, 'divisionFactor', { min: 0.01, max: 1, required: false });
          this.validatePositiveNumber(input.fault.bodyResistance, 'bodyResistance', { min: 500, max: 5000, required: false });
          this.validatePositiveNumber(input.fault.bodyWeight, 'bodyWeight', { min: 30, max: 200, required: false });
          this.validateFaultType(input.fault.faultType, 'faultType', { required: false });
        } catch (error) {
          errors.push(`Fault validation: ${error.message}`);
        }
      } else {
        errors.push('Fault parameters are required');
      }

      // Add warnings for unusual values
      if (input.soil?.soilResistivity > 1000) {
        warnings.push('High soil resistivity may require special treatment');
      }
      if (input.grid?.gridLength > 200 || input.grid?.gridWidth > 200) {
        warnings.push('Very large grid may require additional analysis');
      }
      if (input.fault?.faultCurrent > 50000) {
        warnings.push('Very high fault current requires special considerations');
      }

    } catch (error) {
      errors.push(`General validation: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Sanitize input values
   */
  static sanitizeInput(input) {
    if (typeof input !== 'object' || input === null) {
      return input;
    }

    const sanitized = Array.isArray(input) ? [] : {};

    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        const value = input[key];
        
        if (typeof value === 'string') {
          // Remove potentially harmful characters
          sanitized[key] = value.replace(/[<>]/g, '').trim();
        } else if (typeof value === 'number') {
          // Ensure valid numbers
          sanitized[key] = isNaN(value) ? 0 : value;
        } else if (typeof value === 'object' && value !== null) {
          // Recursively sanitize nested objects
          sanitized[key] = this.sanitizeInput(value);
        } else {
          sanitized[key] = value;
        }
      }
    }

    return sanitized;
  }

  /**
   * Validate and sanitize input
   */
  static validateAndSanitize(input) {
    const sanitized = this.sanitizeInput(input);
    const validation = this.validateGroundingInput(sanitized);
    
    return {
      input: sanitized,
      validation
    };
  }
}

/**
 * Custom validation error class
 */
class ValidationError extends Error {
  constructor(message, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

export { ValidationUtils, ValidationError };
