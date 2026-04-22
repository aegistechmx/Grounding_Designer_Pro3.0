import React, { useState } from 'react';
import { Edit2, Check, Brain, AlertTriangle, Info, Zap, X } from 'lucide-react';
import { TEXT_COLORS, ACCENT_COLORS, BORDERS, SPACING, TYPOGRAPHY, SHADOWS, TRANSITIONS } from '../../constants/designTokens';

export const InputField = ({ 
  label, 
  value, 
  onChange, 
  type = 'manual',  // 'manual', 'auto', 'ai', 'validated', 'warning'
  unit = '', 
  min, 
  max, 
  step,
  placeholder,
  required = false,
  disabled = false,
  description = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  
  const typeConfig = {
    manual: {
      bg: 'bg-gray-800',
      border: 'border-blue-500',
      hover: 'hover:bg-gray-700',
      icon: <Edit2 size={14} style={{ color: TEXT_COLORS.muted }} />,
      label: '✏️ Entrada manual',
      textColor: TEXT_COLORS.muted,
      badgeBg: 'bg-blue-500/20',
      glow: SHADOWS.glow.blue
    },
    auto: {
      bg: 'bg-gray-800',
      border: 'border-orange-500',
      hover: 'hover:bg-gray-700',
      icon: <Zap size={14} style={{ color: ACCENT_COLORS.orange }} />,
      label: '⚡ Calculado automático',
      textColor: ACCENT_COLORS.orange,
      badgeBg: 'bg-orange-500/20',
      glow: SHADOWS.glow.orange
    },
    ai: {
      bg: 'bg-gray-800',
      border: 'border-blue-500',
      hover: 'hover:bg-gray-700',
      icon: <Brain size={14} style={{ color: ACCENT_COLORS.blue }} />,
      label: '🧠 Recomendado por IA',
      textColor: ACCENT_COLORS.blue,
      badgeBg: 'bg-blue-500/20',
      glow: SHADOWS.glow.blue
    },
    validated: {
      bg: 'bg-gray-800',
      border: 'border-green-500',
      hover: 'hover:bg-gray-700',
      icon: <Check size={14} style={{ color: ACCENT_COLORS.green }} />,
      label: '✅ Validado por norma',
      textColor: ACCENT_COLORS.green,
      badgeBg: 'bg-green-500/20',
      glow: SHADOWS.success
    },
    warning: {
      bg: 'bg-gray-800',
      border: 'border-red-500',
      hover: 'hover:bg-gray-700',
      icon: <AlertTriangle size={14} style={{ color: ACCENT_COLORS.red }} />,
      label: '⚠️ Alerta - Requiere atención',
      textColor: ACCENT_COLORS.red,
      badgeBg: 'bg-red-500/20',
      glow: SHADOWS.error
    }
  };
  
  const config = typeConfig[type];
  
  const handleClick = () => {
    if (type === 'manual' && !disabled) {
      setIsEditing(true);
    }
  };

  const handleInputChange = (e) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      setLocalValue(newValue);
    }
  };
  
  const handleSave = () => {
    setIsEditing(false);
    if (onChange) {
      onChange(localValue);
    }
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setLocalValue(value);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };
  
  const displayValue = typeof value === 'number' && !isNaN(value) && isFinite(value)
    ? value.toLocaleString('es-MX', { minimumFractionDigits: value % 1 !== 0 ? 2 : 0 })
    : value;
  
  return (
    <div 
      className={`rounded-lg border-2 ${config.border} ${config.bg} p-3 transition-all duration-300 ${config.hover}`}
      style={{
        borderRadius: BORDERS.radius.md,
        padding: SPACING.sm,
        transition: TRANSITIONS.normal,
        boxShadow: config.glow
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5">
          {config.icon}
          <label className="text-sm font-medium" style={{ color: TEXT_COLORS.secondary }}>
            {label}
            {required && <span style={{ color: TEXT_COLORS.error }} className="ml-1">*</span>}
          </label>
        </div>
        <div 
          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ 
            color: config.textColor, 
            backgroundColor: config.badgeBg 
          }}
        >
          {config.label}
        </div>
      </div>
      
      {description && (
        <p className="text-xs mb-2" style={{ color: TEXT_COLORS.light }}>{description}</p>
      )}

      {type === 'manual' && !disabled ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            step={step || 1}
            min={min}
            max={max}
            placeholder={placeholder}
            className="w-full p-2 bg-gray-700 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              color: TEXT_COLORS.primary,
              fontSize: TYPOGRAPHY.fontSize.base,
              borderRadius: BORDERS.radius.sm
            }}
          />
        </div>
      ) : (
        <div
          onClick={handleClick}
          className={`w-full p-2 rounded-lg text-center font-mono text-lg transition-all ${
            type === 'manual' && !disabled
              ? 'cursor-pointer hover:bg-gray-700'
              : 'cursor-default'
          } ${disabled ? 'opacity-50' : ''}`}
          style={{
            color: TEXT_COLORS.primary,
            fontSize: TYPOGRAPHY.fontSize.lg,
            borderRadius: BORDERS.radius.sm
          }}
        >
          <span>
            {displayValue} {unit && <span className="text-sm" style={{ color: TEXT_COLORS.muted }}>{unit}</span>}
          </span>
        </div>
      )}
    </div>
  );
};