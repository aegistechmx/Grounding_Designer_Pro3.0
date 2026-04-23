/**
 * Feature Gating Middleware
 * Backend security for SaaS feature access control
 * This is the REAL security layer - frontend is only UX
 */

const PLAN_FEATURES = {
  free: [],
  pro: ['pdf_pro', 'fem_simulation', 'ai_optimization', 'realtime_collaboration'],
  enterprise: [
    'pdf_pro',
    'fem_simulation',
    'export_cad',
    'batch_reports',
    'ai_optimization',
    'realtime_collaboration',
    'advanced_analytics',
    'api_access',
    'custom_branding',
    'priority_support'
  ]
};

/**
 * Middleware to require specific feature access
 * @param {string} feature - Feature key to check
 */
export default function requireFeature(feature) {
  return (req, res, next) => {
    try {
      const user = req.user; // Comes from auth middleware

      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const userPlan = user.plan || 'free';
      const allowed = PLAN_FEATURES[userPlan] || [];

      if (!allowed.includes(feature)) {
        return res.status(403).json({
          success: false,
          error: 'Feature locked',
          feature,
          currentPlan: userPlan,
          upgradeRequired: true,
          message: `This feature requires a higher plan`,
          upgradeUrl: '/pricing'
        });
      }

      next();
    } catch (err) {
      console.error('Feature check error:', err);
      res.status(500).json({ 
        success: false,
        error: 'Permission check failed',
        message: err.message
      });
    }
  };
}

/**
 * Middleware to require Pro plan or higher
 */
export function requirePro(req, res, next) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized'
      });
    }

    const userPlan = user.plan || 'free';

    if (userPlan !== 'pro' && userPlan !== 'enterprise') {
      return res.status(403).json({
        success: false,
        error: 'Pro plan required',
        currentPlan: userPlan,
        upgradeRequired: true,
        upgradeUrl: '/pricing'
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: 'Permission check failed'
    });
  }
};

/**
 * Middleware to require Enterprise plan
 */
export function requireEnterprise(req, res, next) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized'
      });
    }

    const userPlan = user.plan || 'free';

    if (userPlan !== 'enterprise') {
      return res.status(403).json({
        success: false,
        error: 'Enterprise plan required',
        currentPlan: userPlan,
        upgradeRequired: true,
        upgradeUrl: '/pricing'
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: 'Permission check failed'
    });
  }
};
