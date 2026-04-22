// src/components/common/ValidationBadge.jsx
import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export const ValidationBadge = ({ status, label, size = 'md', showLabel = true }) => {
  const config = {
    success: {
      icon: CheckCircle,
      color: 'text-green-400',
      bg: 'bg-green-500/20',
      border: 'border-green-500',
      shadow: 'shadow-[0_0_10px_rgba(34,197,94,0.3)]',
      label: 'Aprobado'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500',
      shadow: 'shadow-[0_0_10px_rgba(234,179,8,0.3)]',
      label: 'Precaución'
    },
    error: {
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/20',
      border: 'border-red-500',
      shadow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]',
      label: 'No cumple'
    },
    info: {
      icon: Info,
      color: 'text-blue-400',
      bg: 'bg-blue-500/20',
      border: 'border-blue-500',
      shadow: 'shadow-[0_0_10px_rgba(59,130,246,0.3)]',
      label: 'Información'
    }
  };
  
  const { icon: Icon, color, bg, border, shadow, label: defaultLabel } = config[status] || config.info;
  const displayLabel = label || defaultLabel;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2'
  };
  
  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };
  
  return (
    <div className={`inline-flex items-center ${sizeClasses[size]} rounded-full ${bg} ${border} border ${shadow} transition-all duration-300`}>
      <Icon size={iconSizes[size]} className={color} />
      {showLabel && <span className={`font-medium ${color}`}>{displayLabel}</span>}
    </div>
  );
};
