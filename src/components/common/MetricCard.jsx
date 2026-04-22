import React from 'react';
import { TrendingUp, TrendingDown, Minus, Zap, Brain, Check, AlertTriangle, Info } from 'lucide-react';
import { TEXT_COLORS, ACCENT_COLORS, BORDERS, SPACING, TYPOGRAPHY, SHADOWS, TRANSITIONS } from '../../constants/designTokens';

export const MetricCard = ({ 
  title, 
  value, 
  unit = '', 
  type = 'auto',  // 'auto', 'ai', 'validated', 'warning'
  trend = null,   // 'up', 'down', 'neutral'
  trendValue = null,
  icon: Icon = null
}) => {
  const typeConfig = {
    auto: {
      bg: 'bg-gray-800',
      border: 'border-blue-500',
      icon: <Zap size={20} style={{ color: ACCENT_COLORS.orange }} />,
      iconBg: 'bg-orange-500/20',
      glow: SHADOWS.glow.blue,
      textColor: TEXT_COLORS.primary
    },
    ai: {
      bg: 'bg-gray-800',
      border: 'border-blue-500',
      icon: <Brain size={20} style={{ color: ACCENT_COLORS.blue }} />,
      iconBg: 'bg-blue-500/20',
      glow: SHADOWS.glow.blue,
      textColor: TEXT_COLORS.primary
    },
    validated: {
      bg: 'bg-gray-800',
      border: 'border-green-500',
      icon: <Check size={20} style={{ color: ACCENT_COLORS.green }} />,
      iconBg: 'bg-green-500/20',
      glow: SHADOWS.success,
      textColor: TEXT_COLORS.primary,
      pulse: true
    },
    warning: {
      bg: 'bg-gray-800',
      border: 'border-red-500',
      icon: <AlertTriangle size={20} style={{ color: ACCENT_COLORS.red }} />,
      iconBg: 'bg-red-500/20',
      glow: SHADOWS.error,
      textColor: TEXT_COLORS.primary
    }
  };
  
  const config = typeConfig[type] || typeConfig.auto;
  
  const trendIcon = {
    up: <TrendingUp size={14} style={{ color: ACCENT_COLORS.green }} />,
    down: <TrendingDown size={14} style={{ color: ACCENT_COLORS.red }} />,
    neutral: <Minus size={14} style={{ color: TEXT_COLORS.muted }} />
  };
  
  const displayValue = typeof value === 'number' && !isNaN(value) && isFinite(value)
    ? value.toLocaleString('es-MX', { minimumFractionDigits: value % 1 !== 0 ? 2 : 0 })
    : value;
  
  return (
    <div 
      className={`rounded-lg border-2 p-3 transition-all duration-300 ${config.pulse ? 'animate-pulse-slow' : ''}`}
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
        boxShadow: config.glow,
        borderRadius: BORDERS.radius.lg,
        padding: SPACING.md,
        transition: TRANSITIONS.normal,
        animation: config.pulse ? 'pulse 2s ease-in-out infinite' : 'none'
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: config.iconBg }}
        >
          {Icon || config.icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs">
            {trendIcon[trend]}
            {trendValue !== null && (
              <span style={{ color: TEXT_COLORS.muted }}>
                {trendValue > 0 ? '+' : ''}{trendValue}%
              </span>
            )}
          </div>
        )}
      </div>
      
      <div 
        className="text-xs mb-1"
        style={{ 
          color: TEXT_COLORS.secondary,
          fontSize: TYPOGRAPHY.fontSize.xs,
          fontWeight: TYPOGRAPHY.fontWeight.medium
        }}
      >
        {title}
      </div>
      
      <div 
        className="font-bold"
        style={{ 
          color: config.textColor,
          fontSize: TYPOGRAPHY.fontSize.xl,
          fontWeight: TYPOGRAPHY.fontWeight.bold,
          textShadow: config.pulse ? '0 0 10px rgba(34, 197, 94, 0.5)' : 'none'
        }}
      >
        {displayValue} {unit && <span className="text-sm" style={{ color: TEXT_COLORS.muted }}>{unit}</span>}
      </div>
    </div>
  );
};
