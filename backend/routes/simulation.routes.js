/**
 * Simulation Routes
 * API endpoints for IEEE 80 and FEM simulations
 */

import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/auth.js';
import requireFeature from '../middleware/requireFeature.js';
import ieee80Service from '../services/ieee80.service.js';
import femService from '../services/fem.service.js';
import heatmapService from '../services/heatmap.service.js';
import aiService from '../services/ai.service.js';
import { addJob, getJobStatus } from '../jobs/queue.js';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'grounding_saas',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

/**
 * Run IEEE 80 simulation (synchronous, fast)
 */
router.post('/ieee80', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const params = req.body;
    
    // Calculate results
    const results = ieee80Service.calculate(params);
    
    // Generate recommendations
    const recommendations = aiService.generateSmartRecommendations(results);
    
    res.json({
      success: true,
      results,
      recommendations,
      method: 'ieee80'
    });
  } catch (error) {
    console.error('IEEE 80 simulation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Run FEM simulation (asynchronous, heavy)
 */
router.post('/fem', authMiddleware, requireFeature('fem_simulation'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const params = req.body;
    const projectId = req.body.projectId;
    
    // Check plan limits
    const auth = require('../services/auth.service');
    const usageResult = await pool.query(
      'SELECT * FROM usage_tracking WHERE user_id = $1',
      [userId]
    );
    
    const usage = usageResult.rows[0] || { simulation_count: 0, pdf_export_count: 0, excel_export_count: 0, storage_used: 0 };
    const planCheck = auth.checkPlanLimits(req.user.plan, usage);
    
    if (!planCheck.allowed) {
      return res.status(403).json({ success: false, error: planCheck.reason });
    }
    
    // Queue FEM job
    const job = await addJob('fem', {
      params,
      userId,
      projectId
    });
    
    res.json({
      success: true,
      jobId: job.jobId,
      status: 'pending',
      message: 'FEM simulation queued for processing'
    });
  } catch (error) {
    console.error('FEM simulation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get simulation job status
 */
router.get('/jobs/:jobId', authMiddleware, async (req, res) => {
  try {
    const jobId = req.params.jobId;
    
    const status = await getJobStatus('fem', jobId);
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Get job status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get simulation result by ID
 */
router.get('/results/:resultId', authMiddleware, async (req, res) => {
  try {
    const resultId = req.params.resultId;
    
    const result = await pool.query(
      `SELECT r.*, s.params, s.method, s.created_at 
       FROM results r
       JOIN simulations s ON r.simulation_id = s.id
       WHERE r.id = $1`,
      [resultId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Result not found' });
    }
    
    res.json({
      success: true,
      result: result.rows[0]
    });
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Run sensitivity analysis
 */
router.post('/sensitivity', authMiddleware, async (req, res) => {
  try {
    const params = req.body;
    
    // Run base simulation
    const baseResults = ieee80Service.calculate(params);
    
    // Test variations
    const variations = [
      { parameter: 'soilResistivity', variation: 0.8, name: 'Low Resistivity' },
      { parameter: 'soilResistivity', variation: 1.2, name: 'High Resistivity' },
      { parameter: 'faultCurrent', variation: 0.8, name: 'Low Fault Current' },
      { parameter: 'faultCurrent', variation: 1.2, name: 'High Fault Current' },
      { parameter: 'burialDepth', variation: 1.5, name: 'Deep Burial' }
    ];
    
    const sensitivityResults = variations.map(variation => {
      const testParams = { ...params };
      testParams[variation.parameter] = params[variation.parameter] * variation.variation;
      const results = ieee80Service.calculate(testParams);
      
      return {
        name: variation.name,
        parameter: variation.parameter,
        variation: variation.variation,
        Rg: results.Rg,
        Em: results.Em,
        Es: results.Es,
        complies: results.complies
      };
    });
    
    res.json({
      success: true,
      baseResults,
      sensitivityResults
    });
  } catch (error) {
    console.error('Sensitivity analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Run optimization
 */
router.post('/optimize', authMiddleware, async (req, res) => {
  try {
    const params = req.body.params;
    const results = req.body.results;
    const options = req.body.options || {};
    
    const optimization = await aiService.optimizeDesign(params, results, options);
    
    res.json({
      success: true,
      optimization
    });
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get heatmap data
 */
router.get('/heatmap/:resultId', authMiddleware, async (req, res) => {
  try {
    const resultId = req.params.resultId;
    
    const result = await pool.query(
      'SELECT discrete_grid FROM results WHERE id = $1',
      [resultId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Result not found' });
    }
    
    const discreteGrid = result.rows[0].discrete_grid;
    
    if (!discreteGrid) {
      return res.status(400).json({ success: false, error: 'No discrete grid data available' });
    }
    
    const heatmap = heatmapService.generateHeatmap(discreteGrid, {
      width: 600,
      height: 400,
      darkMode: req.query.darkMode === 'true'
    });
    
    res.json({
      success: true,
      heatmap
    });
  } catch (error) {
    console.error('Get heatmap error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Batch run multiple simulations
 */
router.post('/batch', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { simulations } = req.body;
    
    // Check plan limits
    const auth = require('../services/auth.service');
    const usageResult = await pool.query(
      'SELECT * FROM usage_tracking WHERE user_id = $1',
      [userId]
    );
    
    const usage = usageResult.rows[0] || { simulation_count: 0, pdf_export_count: 0, excel_export_count: 0, storage_used: 0 };
    const planCheck = auth.checkPlanLimits(req.user.plan, usage);
    
    if (!planCheck.allowed) {
      return res.status(403).json({ success: false, error: planCheck.reason });
    }
    
    // Queue batch job
    const job = await addJob('simulation', {
      simulations,
      userId
    }, {
      priority: 1 // Lower priority for batch jobs
    });
    
    res.json({
      success: true,
      jobId: job.jobId,
      status: 'pending',
      message: 'Batch simulation queued for processing'
    });
  } catch (error) {
    console.error('Batch simulation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
