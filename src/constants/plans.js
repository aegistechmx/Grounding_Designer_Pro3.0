/**
 * Plans and Features Configuration
 * Single source of truth for SaaS feature gating
 */

export const PLANS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
};

export const FEATURES = {
  PDF_PRO: 'pdf_pro',
  FEM_SIMULATION: 'fem_simulation',
  EXPORT_CAD: 'export_cad',
  BATCH_REPORTS: 'batch_reports',
  AI_OPTIMIZATION: 'ai_optimization',
  REALTIME_COLLABORATION: 'realtime_collaboration',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  API_ACCESS: 'api_access',
  CUSTOM_BRANDING: 'custom_branding',
  PRIORITY_SUPPORT: 'priority_support'
};

export const PLAN_FEATURES = {
  free: [
    // Basic features only
  ],
  pro: [
    FEATURES.PDF_PRO,
    FEATURES.FEM_SIMULATION,
    FEATURES.AI_OPTIMIZATION,
    FEATURES.REALTIME_COLLABORATION
  ],
  enterprise: [
    FEATURES.PDF_PRO,
    FEATURES.FEM_SIMULATION,
    FEATURES.EXPORT_CAD,
    FEATURES.BATCH_REPORTS,
    FEATURES.AI_OPTIMIZATION,
    FEATURES.REALTIME_COLLABORATION,
    FEATURES.ADVANCED_ANALYTICS,
    FEATURES.API_ACCESS,
    FEATURES.CUSTOM_BRANDING,
    FEATURES.PRIORITY_SUPPORT
  ]
};

export const PLAN_LIMITS = {
  free: {
    simulations: 10,
    pdfExports: 5,
    excelExports: 10,
    dxfExports: 2,
    projects: 5,
    femSimulations: 0,
    aiOptimizations: 5,
    apiCalls: 100,
    storage: 100 // MB
  },
  pro: {
    simulations: 100,
    pdfExports: 50,
    excelExports: 100,
    dxfExports: 20,
    projects: 50,
    femSimulations: 10,
    aiOptimizations: 50,
    apiCalls: 1000,
    storage: 1024 // 1GB
  },
  enterprise: {
    simulations: -1, // Unlimited
    pdfExports: -1,
    excelExports: -1,
    dxfExports: -1,
    projects: -1,
    femSimulations: -1,
    aiOptimizations: -1,
    apiCalls: -1,
    storage: 10240 // 10GB
  }
};

export const PLAN_PRICING = {
  free: {
    monthly: 0,
    yearly: 0
  },
  pro: {
    monthly: 49,
    yearly: 490 // 2 months free
  },
  enterprise: {
    monthly: 199,
    yearly: 1990 // 2 months free
  }
};

export const PLAN_NAMES = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise'
};
