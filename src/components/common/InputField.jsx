import React, { useState } from 'react';
import { Edit2, Check, Brain, AlertTriangle, Info, Zap, X } from 'lucide-react';

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
      bg: 'bg-white/5',
      border: 'border-white/20',
      hover: 'hover:bg-white/10',
      icon: <Edit2 size={14} className="text-gray-300" />,
      label: '✏️ Entrada manual',
      textColor: 'text-gray-300',
      badgeBg: 'bg-white/10',
      glow: 'shadow-[0_0_10px_rgba(255,255,255,0.1)]'
    },
    auto: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500',
      hover: 'hover:bg-orange-500/20',
      icon: <Zap size={14} className="text-orange-400" />,
      label: '⚡ Calculado automático',
      textColor: 'text-orange-400',
      badgeBg: 'bg-orange-500/20',
      glow: 'shadow-[0_0_10px_rgba(249,115,22,0.2)]'
    },
    ai: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500',
      hover: 'hover:bg-blue-500/20',
      icon: <Brain size={14} className="text-blue-400" />,
      label: '🧠 Recomendado por IA',
      textColor: 'text-blue-400',
      badgeBg: 'bg-blue-500/20',
      glow: 'shadow-[0_0_10px_rgba(59,130,246,0.2)]'
    },
    validated: {
      bg: 'bg-green-500/10',
      border: 'border-green-500',
      hover: 'hover:bg-green-500/20',
      icon: <Check size={14} className="text-green-400" />,
      label: '✅ Validado por norma',
      textColor: 'text-green-400',
      badgeBg: 'bg-green-500/20',
      glow: 'shadow-[0_0_10px_rgba(34,197,94,0.2)]'
    },
    warning: {
      bg: 'bg-red-500/10',
      border: 'border-red-500',
      hover: 'hover:bg-red-500/20',
      icon: <AlertTriangle size={14} className="text-red-400" />,
      label: '⚠️ Alerta - Requiere atención',
      textColor: 'text-red-400',
      badgeBg: 'bg-red-500/20',
      glow: 'shadow-[0_0_10px_rgba(239,68,68,0.2)]'
    }
  };
  
  const config = typeConfig[type];
  
  const handleClick = () => {
    if (type === 'manual' && !disabled) {
      setIsEditing(true);
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
    <div className={`rounded-lg border-2 ${config.border} ${config.bg} ${config.glow} p-3 transition-all duration-300 ${config.hover}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5">
          {config.icon}
          <label className="text-sm font-medium text-gray-200">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
        </div>
        <div className={`text-[10px] font-medium ${config.textColor} px-2 py-0.5 rounded-full ${config.badgeBg}`}>
          {config.label}
        </div>
      </div>
      
      {description && (
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      )}
      
      {isEditing && type === 'manual' ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localValue}
            onChange={(e) => setLocalValue(parseFloat(e.target.value))}
            onKeyDown={handleKeyDown}
            step={step || 1}
            min={min}
            max={max}
            placeholder={placeholder}
            className="w-full p-2 bg-gray-700 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-yellow-500"
            autoFocus
          />
          <button onClick={handleSave} className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
            <Check size={16} className="text-white" />
          </button>
          <button onClick={handleCancel} className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
            <X size={16} className="text-white" />
          </button>
        </div>
      ) : (
        <div 
          onClick={handleClick}
          className={`w-full p-2 rounded-lg text-center font-mono text-lg transition-all ${
            type === 'manual' && !disabled 
              ? 'cursor-pointer hover:bg-gray-700/50' 
              : 'cursor-default'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <span className="text-white">
            {displayValue} {unit && <span className="text-sm text-gray-400">{unit}</span>}
          </span>
        </div>
      )}
    </div>
  );
};