const { body, validationResult } = require('express-validator');

// Input validation schemas
module.exports.validateCalculationInput = [
  // Soil parameters
  body('soil.soilResistivity')
    .isFloat({ min: 1, max: 10000 })
    .withMessage('Soil resistivity must be between 1 and 10000 ohm-meters'),
  
  body('soil.surfaceLayerResistivity')
    .optional()
    .isFloat({ min: 0, max: 50000 })
    .withMessage('Surface layer resistivity must be between 0 and 50000 ohm-meters'),
  
  body('soil.surfaceLayerThickness')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Surface layer thickness must be between 0 and 10 meters'),
  
  // Grid parameters
  body('grid.gridLength')
    .isFloat({ min: 1, max: 1000 })
    .withMessage('Grid length must be between 1 and 1000 meters'),
  
  body('grid.gridWidth')
    .isFloat({ min: 1, max: 1000 })
    .withMessage('Grid width must be between 1 and 1000 meters'),
  
  body('grid.numParallel')
    .isInt({ min: 1, max: 100 })
    .withMessage('Number of parallel conductors must be between 1 and 100'),
  
  body('grid.numParallelY')
    .isInt({ min: 1, max: 100 })
    .withMessage('Number of parallel conductors in Y direction must be between 1 and 100'),
  
  body('grid.conductorDiameter')
    .isFloat({ min: 0.001, max: 0.1 })
    .withMessage('Conductor diameter must be between 0.001 and 0.1 meters'),
  
  body('grid.burialDepth')
    .isFloat({ min: 0.1, max: 10 })
    .withMessage('Burial depth must be between 0.1 and 10 meters'),
  
  body('grid.numRods')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Number of rods must be between 0 and 100'),
  
  body('grid.rodLength')
    .optional()
    .isFloat({ min: 0.5, max: 50 })
    .withMessage('Rod length must be between 0.5 and 50 meters'),
  
  body('grid.rodDiameter')
    .optional()
    .isFloat({ min: 0.01, max: 0.1 })
    .withMessage('Rod diameter must be between 0.01 and 0.1 meters'),
  
  // Fault parameters
  body('fault.faultCurrent')
    .isFloat({ min: 100, max: 100000 })
    .withMessage('Fault current must be between 100 and 100000 amperes'),
  
  body('fault.faultDuration')
    .optional()
    .isFloat({ min: 0.1, max: 10 })
    .withMessage('Fault duration must be between 0.1 and 10 seconds'),
  
  body('fault.decrementFactor')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Decrement factor must be between 0 and 1'),
  
  body('fault.divisionFactor')
    .optional()
    .isFloat({ min: 0.1, max: 1 })
    .withMessage('Division factor must be between 0.1 and 1'),
  
  // Options (optional)
  body('options.method')
    .optional()
    .isIn(['analytical', 'discrete', 'both'])
    .withMessage('Method must be analytical, discrete, or both'),
  
  body('options.validation')
    .optional()
    .isIn(['none', 'basic', 'strong'])
    .withMessage('Validation level must be none, basic, or strong')
];

// Validation error handler middleware
module.exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Format validation errors for better user experience
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: formattedErrors,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Sanitize input data
module.exports.sanitizeInput = (req, res, next) => {
  try {
    // Remove any potentially harmful characters
    if (req.body) {
      const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        if (Array.isArray(obj)) {
          return obj.map(sanitizeObject);
        }
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            // Remove script tags and other potentially harmful content
            sanitized[key] = value
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '');
          } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      };
      
      req.body = sanitizeObject(req.body);
    }
    
    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    res.status(400).json({
      success: false,
      error: 'Invalid input format',
      timestamp: new Date().toISOString()
    });
  }
};
