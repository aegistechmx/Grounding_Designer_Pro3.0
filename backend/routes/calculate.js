const express = require('express');
const GroundingCalculator = require('../../src/application/GroundingCalculator.js');
const { validateCalculationInput, handleValidationErrors } = require('../middleware/validation.js');
const { calculationRateLimiter } = require('../middleware/security.js');

const router = express.Router();

// POST /api/calculate - Main calculation endpoint
router.post('/', 
  calculationRateLimiter,
  validateCalculationInput,
  handleValidationErrors,
  async (req, res) => {
  try {
    // Input is already validated by middleware

    // Initialize calculator with input parameters
    const calculator = new GroundingCalculator(req.body);
    
    // Perform calculation
    const results = calculator.calculate();
    
    // Return successful response
    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Calculation failed',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/calculate/health - Route health check
router.get('/health', (req, res) => {
  res.json({
    route: 'calculate',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
