// src/components/common/ValidatedSection.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ValidationBadge } from './ValidationBadge';

export const ValidatedSection = ({ 
  title, 
  icon: Icon, 
  status, 
  children, 
  defaultExpanded = true,
  darkMode 
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  const statusColors = {
    success: 'border-green-500',
    warning: 'border-yellow-500',
    error: 'border-red-500',
    info: 'border-blue-500'
  };
  
  const statusShadows = {
    success: 'shadow-[0_0_15px_rgba(34,197,94,0.2)]',
    warning: 'shadow-[0_0_15px_rgba(234,179,8,0.2)]',
    error: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]',
    info: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]'
  };
  
  return (
    <div className={`rounded-xl border-2 ${statusColors[status]} bg-gradient-to-br from-gray-800 to-gray-900 ${statusShadows[status]} overflow-hidden transition-all duration-300`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex justify-between items-center hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className={`text-${status === 'success' ? 'green' : status === 'warning' ? 'yellow' : status === 'error' ? 'red' : 'blue'}-400`} />}
          <h3 className="font-semibold text-white">{title}</h3>
          <ValidationBadge status={status} size="sm" />
        </div>
        {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/10">
          {children}
        </div>
      )}
    </div>
  );
};
