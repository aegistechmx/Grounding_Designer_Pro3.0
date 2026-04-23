/**
 * Plan Middleware
 * Feature gating based on user plan (Free, Pro, Enterprise)
 */

const pricingService = require('../services/pricing.service');
const { getPool } = require('../database/pool');

/**
 * Require Pro plan
 */
const requirePro = async (req, res, next) => {
  try {
    const userPlan = req.user.plan || 'free';

    if (userPlan !== 'pro' && userPlan !== 'enterprise') {
      return res.status(403).json({
        success: false,
        error: 'Pro plan required',
        message: 'This feature requires a Pro or Enterprise subscription',
        upgradeUrl: '/pricing'
      });
    }

    next();
  } catch (error) {
    console.error('Plan middleware error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Require Enterprise plan
 */
const requireEnterprise = async (req, res, next) => {
  try {
    const userPlan = req.user.plan || 'free';

    if (userPlan !== 'enterprise') {
      return res.status(403).json({
        success: false,
        error: 'Enterprise plan required',
        message: 'This feature requires an Enterprise subscription',
        upgradeUrl: '/pricing'
      });
    }

    next();
  } catch (error) {
    console.error('Plan middleware error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Check plan limit for specific action
 */
const checkPlanLimit = (action) => {
  return async (req, res, next) => {
    try {
      const userPlan = req.user.plan || 'free';
      const userId = req.user.userId;

      const pool = getPool();

      const usageResult = await pool.query(
        'SELECT * FROM usage_tracking WHERE user_id = $1 ORDER BY period_start DESC LIMIT 1',
        [userId]
      );

      const usageData = usageResult.rows[0] || {};
      const currentUsage = usageData[`${action}_count`] || 0;

      // Check limit
      const check = pricingService.checkLimit(userPlan, action, currentUsage);

      if (!check.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Plan limit exceeded',
          message: `You have reached your ${action} limit for this billing period`,
          remaining: check.remaining,
          limit: check.limit,
          upgradeUrl: '/pricing'
        });
      }

      // Add usage info to request
      req.usage = {
        current: currentUsage,
        remaining: check.remaining,
        limit: check.limit
      };

      next();
    } catch (error) {
      console.error('Plan limit check error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };
};

/**
 * Check if user can use FEM simulation
 */
const canUseFEM = async (req, res, next) => {
  try {
    const userPlan = req.user.plan || 'free';

    if (userPlan === 'free') {
      return res.status(403).json({
        success: false,
        error: 'FEM simulation not available',
        message: 'FEM simulation requires a Pro or Enterprise subscription',
        upgradeUrl: '/pricing'
      });
    }

    const pool = getPool();

    const usageResult = await pool.query(
      'SELECT fem_simulation_count FROM usage_tracking WHERE user_id = $1 ORDER BY period_start DESC LIMIT 1',
      [req.user.userId]
    );

    const currentUsage = usageResult.rows[0]?.fem_simulation_count || 0;
    const check = pricingService.checkLimit(userPlan, 'femSimulations', currentUsage);

    if (!check.allowed) {
      return res.status(429).json({
        success: false,
        error: 'FEM simulation limit exceeded',
        message: 'You have reached your FEM simulation limit for this billing period',
        upgradeUrl: '/pricing'
      });
    }

    next();
  } catch (error) {
    console.error('FEM check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Check if user can use AI optimization
 */
const canUseAI = async (req, res, next) => {
  try {
    const userPlan = req.user.plan || 'free';

    const pool = getPool();

    const usageResult = await pool.query(
      'SELECT ai_optimization_count FROM usage_tracking WHERE user_id = $1 ORDER BY period_start DESC LIMIT 1',
      [req.user.userId]
    );

    const currentUsage = usageResult.rows[0]?.ai_optimization_count || 0;
    const check = pricingService.checkLimit(userPlan, 'aiOptimizations', currentUsage);

    if (!check.allowed) {
      return res.status(429).json({
        success: false,
        error: 'AI optimization limit exceeded',
        message: 'You have reached your AI optimization limit for this billing period',
        upgradeUrl: '/pricing'
      });
    }

    next();
  } catch (error) {
    console.error('AI check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  requirePro,
  requireEnterprise,
  checkPlanLimit,
  canUseFEM,
  canUseAI
};
