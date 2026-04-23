/**
 * FeatureGate Component
 * ETAP-style UI blocking for gated features
 * Frontend UX only - real security is in backend middleware
 */

import React from 'react';
import { Lock, Crown } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';

export const FeatureGate = ({ feature, children, fallback = null, showUpgrade = true }) => {
  const { hasFeature, plan } = usePermissions();

  if (hasFeature(feature)) {
    return children;
  }

  // Custom fallback provided
  if (fallback) {
    return fallback;
  }

  // Default ETAP-style blocking UI
  return (
    <div className="relative group">
      {/* Blurred blocked content */}
      <div className="opacity-40 pointer-events-none blur-[1px] grayscale">
        {children}
      </div>

      {/* Overlay - ETAP style */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black/85 backdrop-blur-sm rounded-lg p-6 text-center border border-yellow-500/50 shadow-2xl max-w-xs">
          {plan === 'enterprise' ? (
            <Crown className="mx-auto mb-3 text-yellow-400" size={24} />
          ) : (
            <Lock className="mx-auto mb-3 text-yellow-400" size={24} />
          )}
          
          <p className="text-sm text-white font-semibold mb-1">
            {plan === 'enterprise' ? 'Enterprise Feature' : 'Pro Feature'}
          </p>
          <p className="text-xs text-gray-300 mb-4">
            Upgrade required to access
          </p>
          
          {showUpgrade && (
            <button
              className="px-4 py-2 text-sm bg-yellow-500 text-black rounded font-bold hover:bg-yellow-400 transition-colors w-full"
              onClick={() => window.location.href = '/pricing'}
            >
              Upgrade Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * ProBadge - Shows "Pro" badge on features
 */
export const ProBadge = ({ className = '' }) => {
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30 ${className}`}>
      <Crown size={12} className="mr-1" />
      PRO
    </span>
  );
};

/**
 * EnterpriseBadge - Shows "Enterprise" badge on features
 */
export const EnterpriseBadge = ({ className = '' }) => {
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold bg-purple-500/20 text-purple-400 rounded border border-purple-500/30 ${className}`}>
      <Crown size={12} className="mr-1" />
      ENTERPRISE
    </span>
  );
};

/**
 * FeatureLock - Simple lock icon for locked features
 */
export const FeatureLock = ({ size = 16, className = '' }) => {
  return (
    <Lock size={size} className={`text-yellow-400 ${className}`} />
  );
};
