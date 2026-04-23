/**
 * usePermissions Hook
 * Frontend permission checking for SaaS features
 * Note: This is UX only - real security is in backend middleware
 */

import { PLAN_FEATURES, PLANS } from '../constants/plans';

export const usePermissions = () => {
  // Get user from store or localStorage
  const getUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
    return null;
  };

  const user = getUser();
  const plan = user?.plan || PLANS.FREE;

  const hasFeature = (feature) => {
    const allowed = PLAN_FEATURES[plan] || [];
    return allowed.includes(feature);
  };

  const canUsePDFPro = () => hasFeature('pdf_pro');
  const canUseFEM = () => hasFeature('fem_simulation');
  const canExportCAD = () => hasFeature('export_cad');
  const canUseBatch = () => hasFeature('batch_reports');
  const canUseAI = () => hasFeature('ai_optimization');
  const canCollaborate = () => hasFeature('realtime_collaboration');
  const hasAPIAccess = () => hasFeature('api_access');

  return {
    plan,
    hasFeature,
    isFree: plan === PLANS.FREE,
    isPro: plan === PLANS.PRO || plan === PLANS.ENTERPRISE,
    isEnterprise: plan === PLANS.ENTERPRISE,
    // Feature-specific helpers
    canUsePDFPro,
    canUseFEM,
    canExportCAD,
    canUseBatch,
    canUseAI,
    canCollaborate,
    hasAPIAccess
  };
};
