import React from 'react';
import { Zap, Brain, Check, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const MetricCard = ({ title, value, unit, type = 'auto', trend, trendValue, description }) => {
  const typeConfig = {
    auto: { bg: 'bg-orange-500/10', border: 'border-orange-500', icon: <Zap size={16} className="text-orange-400" />, glow: 'shadow-[0_0_10px_rgba(249,115,22,0.2)]' },
    ai: { bg: 'bg-blue-500/10', border: 'border-blue-500', icon: <Brain size={16} className="text-blue-400" />, glow: 'shadow-[0_0_10px_rgba(59,130,246,0.2)]' },
    validated: { bg: 'bg-green-500/10', border: 'border-green-500', icon: <Check size={16} className="text-green-400" />, glow: 'shadow-[0_0_10px_rgba(34,197,94,0.2)]' },
    warning: { bg: 'bg-red-500/10', border: 'border-red-500', icon: <AlertTriangle size={16} className="text-red-400" />, glow: 'shadow-[0_0_10px_rgba(239,68,68,0.2)]' }
  };
  
  const config = typeConfig[type] || typeConfig.auto;
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-green-400' : 'text-gray-400';
  
  const formattedValue = typeof value === 'number' && !isNaN(value) && isFinite(value)
    ? value.toLocaleString('es-MX', { minimumFractionDigits: value % 1 !== 0 ? 2 : 0 })
    : value;
  
  return (
    <div className={`rounded-xl border-2 ${config.border} ${config.bg} ${config.glow} p-4 transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs text-gray-400 flex items-center gap-1">
            {config.icon}
            {title}
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {formattedValue} <span className="text-sm text-gray-400">{unit}</span>
          </div>
          {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon size={14} />
            <span className="text-xs font-medium">{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};
