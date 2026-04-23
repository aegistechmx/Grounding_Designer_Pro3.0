/**
 * Pricing Service
 * Handles SaaS pricing plans, limits, and billing
 */

class PricingService {
  constructor() {
    this.plans = {
      free: {
        name: 'Free',
        price: 0,
        billing: 'monthly',
        limits: {
          simulations: 10,
          pdfExports: 5,
          excelExports: 10,
          dxfExports: 2,
          storage: 100 * 1024 * 1024, // 100MB
          projects: 5,
          femSimulations: 0, // Not available in free
          aiOptimizations: 5,
          apiCalls: 100
        },
        features: [
          'IEEE 80 calculations',
          'Basic heatmap generation',
          'PDF reports (limited)',
          'Excel exports (limited)',
          'Project versioning',
          'Email support'
        ]
      },
      pro: {
        name: 'Pro',
        price: 49,
        billing: 'monthly',
        limits: {
          simulations: 100,
          pdfExports: 50,
          excelExports: 100,
          dxfExports: 20,
          storage: 1 * 1024 * 1024 * 1024, // 1GB
          projects: 50,
          femSimulations: 10,
          aiOptimizations: 50,
          apiCalls: 1000
        },
        features: [
          'All Free features',
          'FEM simulations (limited)',
          'Advanced AI optimization',
          'DXF exports',
          'Batch reports',
          'Priority support',
          'Custom branding'
        ]
      },
      enterprise: {
        name: 'Enterprise',
        price: 199,
        billing: 'monthly',
        limits: {
          simulations: -1, // Unlimited
          pdfExports: -1,
          excelExports: -1,
          dxfExports: -1,
          storage: 10 * 1024 * 1024 * 1024, // 10GB
          projects: -1,
          femSimulations: -1,
          aiOptimizations: -1,
          apiCalls: -1
        },
        features: [
          'All Pro features',
          'Unlimited everything',
          'Dedicated support',
          'SLA guarantee',
          'Custom integrations',
          'Team collaboration',
          'Advanced analytics',
          'White-label options'
        ]
      }
    };
  }

  /**
   * Get plan details
   */
  getPlan(planName) {
    return this.plans[planName] || this.plans.free;
  }

  /**
   * Get all plans
   */
  getAllPlans() {
    return Object.values(this.plans);
  }

  /**
   * Check if user can perform action based on plan limits
   */
  checkLimit(userPlan, action, currentUsage = 0) {
    const plan = this.getPlan(userPlan);
    const limit = plan.limits[action];

    // Unlimited
    if (limit === -1) {
      return { allowed: true, remaining: -1 };
    }

    const remaining = limit - currentUsage;
    const allowed = remaining > 0;

    return {
      allowed,
      remaining,
      limit,
      current: currentUsage
    };
  }

  /**
   * Calculate usage percentage
   */
  calculateUsagePercentage(userPlan, action, currentUsage) {
    const plan = this.getPlan(userPlan);
    const limit = plan.limits[action];

    if (limit === -1) return 0;

    return Math.min((currentUsage / limit) * 100, 100);
  }

  /**
   * Get usage summary for user
   */
  getUsageSummary(userPlan, usageData) {
    const plan = this.getPlan(userPlan);
    const summary = {};

    Object.keys(plan.limits).forEach(key => {
      const current = usageData[key] || 0;
      const limit = plan.limits[key];
      const percentage = limit === -1 ? 0 : (current / limit) * 100;

      summary[key] = {
        current,
        limit,
        remaining: limit === -1 ? -1 : Math.max(0, limit - current),
        percentage: Math.min(percentage, 100),
        unlimited: limit === -1
      };
    });

    return summary;
  }

  /**
   * Get upgrade recommendation
   */
  getUpgradeRecommendation(userPlan, usageData) {
    const currentPlan = this.getPlan(userPlan);
    const plans = Object.keys(this.plans);
    const currentIndex = plans.indexOf(userPlan);

    if (currentIndex === plans.length - 1) {
      return null; // Already on highest plan
    }

    const reasons = [];

    Object.keys(currentPlan.limits).forEach(key => {
      const currentUsage = usageData[key] || 0;
      const currentLimit = currentPlan.limits[key];

      if (currentLimit !== -1 && currentUsage >= currentLimit * 0.8) {
        reasons.push({
          feature: key,
          current: currentUsage,
          limit: currentLimit
        });
      }
    });

    if (reasons.length === 0) {
      return null;
    }

    // Check all higher plans and recommend the cheapest one that meets needs
    const higherPlans = plans.slice(currentIndex + 1);
    let recommendedPlan = null;
    let minPrice = Infinity;

    for (const planName of higherPlans) {
      const plan = this.plans[planName];
      let meetsNeeds = true;

      // Check if this plan meets all the reasons for upgrade
      for (const reason of reasons) {
        const planLimit = plan.limits[reason.feature];
        if (planLimit !== -1 && planLimit <= reason.current) {
          meetsNeeds = false;
          break;
        }
      }

      if (meetsNeeds && plan.price < minPrice) {
        minPrice = plan.price;
        recommendedPlan = planName;
      }
    }

    if (!recommendedPlan) {
      // If no plan meets needs, recommend the highest plan
      recommendedPlan = higherPlans[higherPlans.length - 1];
    }

    const nextPlan = this.plans[recommendedPlan];

    return {
      currentPlan: userPlan,
      recommendedPlan,
      reasons,
      priceIncrease: nextPlan.price - currentPlan.price,
      newFeatures: nextPlan.features.filter(f => !currentPlan.features.includes(f))
    };
  }

  /**
   * Calculate prorated amount for plan upgrade
   */
  calculateProratedAmount(currentPlan, newPlan, daysRemainingInMonth) {
    const current = this.getPlan(currentPlan);
    const next = this.getPlan(newPlan);

    // Get actual days in current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const priceDifference = next.price - current.price;
    const proratedAmount = (priceDifference / daysInMonth) * daysRemainingInMonth;

    return {
      priceDifference,
      proratedAmount,
      daysRemaining: daysRemainingInMonth,
      daysInMonth
    };
  }

  /**
   * Validate plan transition
   */
  validatePlanTransition(currentPlan, newPlan) {
    const plans = Object.keys(this.plans);
    const currentIndex = plans.indexOf(currentPlan);
    const newIndex = plans.indexOf(newPlan);

    if (newIndex === -1) {
      return { valid: false, reason: 'Invalid plan' };
    }

    if (newIndex < currentIndex) {
      // Downgrade - check if user exceeds new limits
      return { valid: true, downgrade: true };
    }

    return { valid: true, upgrade: true };
  }
}

module.exports = new PricingService();
