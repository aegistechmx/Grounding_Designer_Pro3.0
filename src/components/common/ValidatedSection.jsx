// src/components/common/ValidatedSection.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ValidationBadge } from './ValidationBadge';
import { TEXT_COLORS, ACCENT_COLORS, BORDERS, SPACING, TYPOGRAPHY, SHADOWS, TRANSITIONS, BG_COLORS } from '../../constants/designTokens';

export const ValidatedSection = ({ 
  title, 
  icon: Icon, 
  status, 
  children, 
  defaultExpanded = true,
  darkMode 
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  const statusConfig = {
    success: { 
      border: 'border-green-500', 
      bg: 'bg-gray-800',
      iconColor: ACCENT_COLORS.green,
      shadow: SHADOWS.success
    },
    warning: { 
      border: 'border-yellow-500', 
      bg: 'bg-gray-800',
      iconColor: ACCENT_COLORS.yellow,
      shadow: SHADOWS.warning
    },
    error: { 
      border: 'border-red-500', 
      bg: 'bg-gray-800',
      iconColor: ACCENT_COLORS.red,
      shadow: SHADOWS.error
    },
    info: { 
      border: 'border-blue-500', 
      bg: 'bg-gray-800',
      iconColor: ACCENT_COLORS.blue,
      shadow: SHADOWS.glow.blue
    }
  };
  
  const config = statusConfig[status] || statusConfig.info;
  
  return (
    <div 
      className={`p-4 rounded-lg border ${darkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} overflow-hidden transition-all duration-300`}
      style={{
        boxShadow: darkMode ? '0 0 15px rgba(59, 130, 246, 0.3), inset 0 0 8px rgba(59, 130, 246, 0.15)' : '0 0 15px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.1)'
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex justify-between items-center transition-colors"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className={darkMode ? 'text-blue-300' : 'text-blue-800'} />}
          <h4 className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
            {title}
          </h4>
          <ValidationBadge status={status} size="sm" />
        </div>
        {expanded ? <ChevronUp size={18} className={darkMode ? 'text-blue-300' : 'text-blue-800'} /> : <ChevronDown size={18} className={darkMode ? 'text-blue-300' : 'text-blue-800'} />}
      </button>
      
      {expanded && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  );
};
