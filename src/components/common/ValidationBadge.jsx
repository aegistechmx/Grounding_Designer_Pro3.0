// src/components/common/ValidationBadge.jsx
import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { TEXT_COLORS, ACCENT_COLORS, BORDERS, SPACING, TYPOGRAPHY, SHADOWS, TRANSITIONS } from '../../constants/designTokens';

export const ValidationBadge = ({ status, label, size = 'md', showLabel = true }) => {
  const config = {
    success: {
      icon: CheckCircle,
      color: ACCENT_COLORS.green,
      bg: 'bg-green-500/20',
      border: 'border-green-500',
      shadow: SHADOWS.success,
      label: 'Aprobado'
    },
    warning: {
      icon: AlertTriangle,
      color: ACCENT_COLORS.yellow,
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500',
      shadow: SHADOWS.warning,
      label: 'Precaución'
    },
    error: {
      icon: XCircle,
      color: ACCENT_COLORS.red,
      bg: 'bg-red-500/20',
      border: 'border-red-500',
      shadow: SHADOWS.error,
      label: 'No cumple'
    },
    info: {
      icon: Info,
      color: ACCENT_COLORS.blue,
      bg: 'bg-blue-500/20',
      border: 'border-blue-500',
      shadow: SHADOWS.glow.blue,
      label: 'Información'
    }
  };
  
  const { icon: Icon, color, bg, border, shadow, label: defaultLabel } = config[status] || config.info;
  const displayLabel = label || defaultLabel;
  
  const sizeConfig = {
    sm: { 
      padding: `${SPACING.xs} ${SPACING.sm}`,
      fontSize: TYPOGRAPHY.fontSize.xs,
      iconSize: 12,
      gap: SPACING.xs
    },
    md: { 
      padding: `${SPACING.xs} ${SPACING.md}`,
      fontSize: TYPOGRAPHY.fontSize.sm,
      iconSize: 16,
      gap: SPACING.xs
    },
    lg: { 
      padding: `${SPACING.sm} ${SPACING.lg}`,
      fontSize: TYPOGRAPHY.fontSize.base,
      iconSize: 20,
      gap: SPACING.sm
    }
  };
  
  const currentSize = sizeConfig[size] || sizeConfig.md;
  
  return (
    <div 
      className="inline-flex items-center rounded-full border transition-all duration-300"
      style={{
        backgroundColor: bg,
        borderColor: border,
        boxShadow: shadow,
        padding: currentSize.padding,
        gap: currentSize.gap,
        transition: TRANSITIONS.normal
      }}
    >
      <Icon size={currentSize.iconSize} style={{ color }} />
      {showLabel && (
        <span 
          className="font-medium"
          style={{ 
            color,
            fontSize: currentSize.fontSize,
            fontWeight: TYPOGRAPHY.fontWeight.medium
          }}
        >
          {displayLabel}
        </span>
      )}
    </div>
  );
};
