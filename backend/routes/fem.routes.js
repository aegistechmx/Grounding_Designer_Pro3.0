/**
 * FEM Simulation API Routes
 * API endpoints for FEM simulation with BullMQ queue integration
 * Grounding Designer Pro - Professional Engineering Simulation
 */

const express = require('express');
const { addFEMJob, getJobStatus, isQueueAvailable } = require('../queue/femQueue.js');
const { calculationRateLimiter } = require('../middleware/security.js');

const router = express.Router();

/**
 * POST /api/fem/simulate
 * Queue FEM simulation job
 */
router.post('/simulate', calculationRateLimiter, async (req, res) => {
  try {
    // Check if queue is available
    const queueAvailable = await isQueueAvailable(require('../queue/femQueue.js').femQueue);
    
    if (!queueAvailable) {
      return res.status(503).json({
        success: false,
        error: 'FEM simulation service is currently unavailable'
      });
    }

    const { grid, conductivity, boundary, sources, options } = req.body;

    // Validate required fields
    if (!grid) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: grid'
      });
    }

    // Add job to queue
    const job = await addFEMJob({
      grid,
      conductivity: conductivity || 0.01,
      boundary: boundary || { type: 'ground', nodes: [] },
      sources: sources || [],
      options: options || {
        meshResolution: 70,
        tolerance: 1e-6,
        maxIterations: 1000
      }
    }, {
      priority: 10
    });

    res.json({
      success: true,
      jobId: job.id,
      status: 'queued'
    });
  } catch (error) {
    console.error('Error queuing FEM simulation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to queue FEM simulation'
    });
  }
});

/**
 * GET /api/fem/status/:jobId
 * Get status of FEM simulation job
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = await getJobStatus(jobId, require('../queue/femQueue.js').femQueue);
    
    res.json(status);
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get job status'
    });
  }
});

/**
 * POST /api/fem/direct
 * Direct FEM simulation (without queue) for small grids
 */
router.post('/direct', calculationRateLimiter, async (req, res) => {
  try {
    const { grid, conductivity, boundary, sources, options } = req.body;

    // Validate required fields
    if (!grid) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: grid'
      });
    }

    // Import solver
    const { solveSparseFEM } = require('../../src/engine/fem/sparseSolver.js');
    const { generateIEEE80Mesh } = require('../../src/engine/mesh/ieeeMesh.js');

    // Generate mesh
    const mesh = generateIEEE80Mesh(grid, options?.meshResolution || 70);

    // Build system
    const system = {
      nodes: mesh.nodes,
      elements: mesh.elements,
      conductivity: conductivity || 0.01,
      boundary: boundary || { type: 'ground', nodes: [] },
      sources: sources || []
    };

    // Solve
    const solution = await solveSparseFEM(system, options || {
      tolerance: 1e-6,
      maxIterations: 1000
    });

    res.json({
      success: true,
      solution,
      mesh: {
        nodes: mesh.nodes.length,
        elements: mesh.elements.length
      }
    });
  } catch (error) {
    console.error('Error in direct FEM simulation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to run FEM simulation'
    });
  }
});

/**
 * POST /api/fem/iso-curves
 * Generate iso-curves from solution
 */
router.post('/iso-curves', calculationRateLimiter, async (req, res) => {
  try {
    const { solution, mesh, levels } = req.body;

    if (!solution || !mesh) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: solution and mesh'
      });
    }

    const { generateIsoCurves } = require('../../src/engine/post/isoCurves.js');

    const field = {
      nodes: mesh.nodes,
      values: solution.values
    };

    const contourLevels = levels || generateContourLevels(solution.values);
    const isoCurves = generateIsoCurves(field, contourLevels);

    res.json({
      success: true,
      isoCurves,
      levels: contourLevels
    });
  } catch (error) {
    console.error('Error generating iso-curves:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate iso-curves'
    });
  }
});

/**
 * POST /api/fem/iso-surfaces
 * Generate 3D iso-surfaces from solution
 */
router.post('/iso-surfaces', calculationRateLimiter, async (req, res) => {
  try {
    const { solution, mesh, levels } = req.body;

    if (!solution || !mesh) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: solution and mesh'
      });
    }

    const { generateIsoSurfaces } = require('../../src/engine/post/isoSurfaces.js');

    const volume = {
      nodes: mesh.nodes,
      values: solution.values
    };

    const contourLevels = levels || generateContourLevels(solution.values);
    const isoSurfaces = generateIsoSurfaces(volume, contourLevels);

    res.json({
      success: true,
      isoSurfaces,
      levels: contourLevels
    });
  } catch (error) {
    console.error('Error generating iso-surfaces:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate iso-surfaces'
    });
  }
});

/**
 * Helper function to generate contour levels
 */
function generateContourLevels(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const levels = [];
  
  const start = Math.floor(min / 100) * 100;
  for (let v = start; v <= max; v += 100) {
    levels.push(v);
  }
  
  return levels;
}

module.exports = router;
