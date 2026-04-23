const express = require('express');
const ieee80Service = require('../services/ieee80.service.js');
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

    // Map input to IEEE 80 service parameters
    const params = {
      gridLength: req.body.grid.gridLength,
      gridWidth: req.body.grid.gridWidth,
      numParallel: req.body.grid.numParallel,
      numParallelY: req.body.grid.numParallelY,
      burialDepth: req.body.grid.gridDepth || 0.5,
      conductorDiameter: req.body.grid.conductorDiameter || 0.01,
      rodLength: req.body.grid.rodLength || 3,
      numRods: req.body.grid.numRods || 0,
      soilResistivity: req.body.soil.soilResistivity,
      surfaceLayerResistivity: req.body.soil.surfaceLayerResistivity || 0,
      surfaceLayerThickness: req.body.soil.surfaceDepth || 0.1,
      faultCurrent: req.body.fault.current,
      faultDuration: req.body.fault.faultDuration || 0.5
    };

    // Perform calculation using IEEE 80 service
    const results = ieee80Service.calculate(params);
    
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
