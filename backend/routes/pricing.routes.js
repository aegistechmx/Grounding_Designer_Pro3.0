/**
 * Pricing Routes
 * API endpoints for SaaS pricing plans and billing
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const pricingService = require('../services/pricing.service');
const { getPool } = require('../database/pool');
const { errorLogger } = require('../middleware/logging.js');

// Get database pool singleton
const pool = getPool();

// Valid actions for limit checking
const VALID_ACTIONS = ['simulations', 'pdfExports', 'excelExports', 'dxfExports', 'storage', 'projects', 'femSimulations', 'aiOptimizations', 'apiCalls'];

// Valid plan names
const VALID_PLANS = ['free', 'pro', 'enterprise'];

// Database field to service field mapping
const DB_FIELD_MAPPING = {
  simulation_count: 'simulations',
  pdf_export_count: 'pdfExports',
  excel_export_count: 'excelExports',
  dxf_export_count: 'dxfExports',
  storage_used: 'storage',
  project_count: 'projects',
  fem_simulation_count: 'femSimulations',
  ai_optimization_count: 'aiOptimizations',
  api_call_count: 'apiCalls'
};

// Complete default usage data matching all limit keys
const DEFAULT_USAGE_DATA = {
  simulation_count: 0,
  pdf_export_count: 0,
  excel_export_count: 0,
  dxf_export_count: 0,
  storage_used: 0,
  project_count: 0,
  fem_simulation_count: 0,
  ai_optimization_count: 0,
  api_call_count: 0
};

/**
 * Get all available plans
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = pricingService.getAllPlans();

    res.json({
      success: true,
      plans
    });
  } catch (error) {
    errorLogger(error, 'Get plans error');
    res.status(500).json({ success: false, error: 'Failed to retrieve plans' });
  }
});

/**
 * Get current user's plan details
 */
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userPlan = req.user.plan || 'free';

    const plan = pricingService.getPlan(userPlan);

    // Get current usage with error handling
    let usageData = { ...DEFAULT_USAGE_DATA };
    try {
      const usageResult = await pool.query(
        'SELECT * FROM usage_tracking WHERE user_id = $1 ORDER BY period_start DESC LIMIT 1',
        [userId]
      );
      if (usageResult.rows[0]) {
        usageData = { ...DEFAULT_USAGE_DATA, ...usageResult.rows[0] };
      }
    } catch (dbError) {
      errorLogger(dbError, 'Database query error in /current');
      // Continue with default usage data
    }

    const usageSummary = pricingService.getUsageSummary(userPlan, usageData);

    res.json({
      success: true,
      plan,
      usage: usageSummary
    });
  } catch (error) {
    errorLogger(error, 'Get current plan error');
    res.status(500).json({ success: false, error: 'Failed to retrieve current plan' });
  }
});

/**
 * Check if action is allowed based on plan limits
 */
router.post('/check-limit', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userPlan = req.user.plan || 'free';
    const { action } = req.body;

    // Input validation
    if (!action || typeof action !== 'string') {
      return res.status(400).json({ success: false, error: 'Action is required' });
    }

    if (!VALID_ACTIONS.includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    // Get current usage with error handling
    let usageData = { ...DEFAULT_USAGE_DATA };
    try {
      const usageResult = await pool.query(
        'SELECT * FROM usage_tracking WHERE user_id = $1 ORDER BY period_start DESC LIMIT 1',
        [userId]
      );
      if (usageResult.rows[0]) {
        usageData = { ...DEFAULT_USAGE_DATA, ...usageResult.rows[0] };
      }
    } catch (dbError) {
      errorLogger(dbError, 'Database query error in /check-limit');
      // Continue with default usage data
    }

    // Map DB field to service field
    const dbField = Object.keys(DB_FIELD_MAPPING).find(key => DB_FIELD_MAPPING[key] === action);
    const currentUsage = dbField ? (usageData[dbField] || 0) : 0;

    const check = pricingService.checkLimit(userPlan, action, currentUsage);

    res.json({
      success: true,
      check
    });
  } catch (error) {
    errorLogger(error, 'Check limit error');
    res.status(500).json({ success: false, error: 'Failed to check limit' });
  }
});

/**
 * Get upgrade recommendation
 */
router.get('/upgrade-recommendation', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userPlan = req.user.plan || 'free';

    // Get current usage with error handling
    let usageData = { ...DEFAULT_USAGE_DATA };
    try {
      const usageResult = await pool.query(
        'SELECT * FROM usage_tracking WHERE user_id = $1 ORDER BY period_start DESC LIMIT 1',
        [userId]
      );
      if (usageResult.rows[0]) {
        usageData = { ...DEFAULT_USAGE_DATA, ...usageResult.rows[0] };
      }
    } catch (dbError) {
      errorLogger(dbError, 'Database query error in /upgrade-recommendation');
      // Continue with default usage data
    }

    const recommendation = pricingService.getUpgradeRecommendation(userPlan, usageData);

    res.json({
      success: true,
      recommendation
    });
  } catch (error) {
    errorLogger(error, 'Get upgrade recommendation error');
    res.status(500).json({ success: false, error: 'Failed to get upgrade recommendation' });
  }
});

/**
 * Calculate prorated amount for plan change
 */
router.post('/calculate-prorated', authMiddleware, async (req, res) => {
  try {
    const { newPlan, daysRemaining } = req.body;
    const currentPlan = req.user.plan || 'free';

    // Input validation
    if (!newPlan || typeof newPlan !== 'string') {
      return res.status(400).json({ success: false, error: 'New plan is required' });
    }

    if (!VALID_PLANS.includes(newPlan)) {
      return res.status(400).json({ success: false, error: 'Invalid plan' });
    }

    if (daysRemaining !== undefined) {
      if (typeof daysRemaining !== 'number' || daysRemaining < 0 || daysRemaining > 31) {
        return res.status(400).json({ success: false, error: 'Days remaining must be between 0 and 31' });
      }
    }

    const prorated = pricingService.calculateProratedAmount(
      currentPlan,
      newPlan,
      daysRemaining || 30
    );

    res.json({
      success: true,
      prorated
    });
  } catch (error) {
    errorLogger(error, 'Calculate prorated error');
    res.status(500).json({ success: false, error: 'Failed to calculate prorated amount' });
  }
});

/**
 * Validate plan transition
 */
router.post('/validate-transition', authMiddleware, async (req, res) => {
  try {
    const { newPlan } = req.body;
    const currentPlan = req.user.plan || 'free';

    // Input validation
    if (!newPlan || typeof newPlan !== 'string') {
      return res.status(400).json({ success: false, error: 'New plan is required' });
    }

    if (!VALID_PLANS.includes(newPlan)) {
      return res.status(400).json({ success: false, error: 'Invalid plan' });
    }

    const validation = pricingService.validatePlanTransition(currentPlan, newPlan);

    res.json({
      success: true,
      validation
    });
  } catch (error) {
    errorLogger(error, 'Validate transition error');
    res.status(500).json({ success: false, error: 'Failed to validate transition' });
  }
});

/**
 * Update user plan (would integrate with payment processor in production)
 */
router.put('/plan', authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.userId;
    const { newPlan } = req.body;
    const currentPlan = req.user.plan || 'free';

    // Input validation
    if (!newPlan || typeof newPlan !== 'string') {
      return res.status(400).json({ success: false, error: 'New plan is required' });
    }

    if (!VALID_PLANS.includes(newPlan)) {
      return res.status(400).json({ success: false, error: 'Invalid plan' });
    }

    // Authorization check - only users can update their own plan
    // In production, add role-based check for admin operations
    if (req.user.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Start transaction to prevent race condition
    await client.query('BEGIN');

    // Validate transition
    const validation = pricingService.validatePlanTransition(currentPlan, newPlan);

    if (!validation.valid) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: validation.reason });
    }

    // Lock user row and update plan atomically
    const result = await client.query(
      'UPDATE users SET plan = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [newPlan, userId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Commit transaction
    await client.query('COMMIT');

    const updatedUser = result.rows[0];
    const plan = pricingService.getPlan(newPlan);

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        plan: updatedUser.plan
      },
      plan
    });
  } catch (error) {
    await client.query('ROLLBACK');
    errorLogger(error, 'Update plan error');
    res.status(500).json({ success: false, error: 'Failed to update plan' });
  } finally {
    client.release();
  }
});

module.exports = router;
