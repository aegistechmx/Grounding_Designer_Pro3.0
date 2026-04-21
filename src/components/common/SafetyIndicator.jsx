import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export const SafetyIndicator = ({ safe, label, darkMode }) => {
  return (
    <div className={`flex items-center gap-2 p-2 rounded transition-all duration-200 ${
      safe 
        ? 'bg-green-100 dark:bg-green-900/30' 
        : 'bg-red-100 dark:bg-red-900/30'
    }`}>
      {safe 
        ? <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
        : <XCircle className="text-red-600 dark:text-red-400" size={20} />
      }
      <span className={`text-sm font-medium ${
        safe 
          ? 'text-green-800 dark:text-green-300' 
          : 'text-red-800 dark:text-red-300'
      }`}>
        {label}
      </span>
    </div>
  );
};