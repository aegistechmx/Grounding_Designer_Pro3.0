// src/components/panels/IEEEPersonPanel.jsx
import React from 'react';
import { Users, CheckCircle, XCircle } from 'lucide-react';

export const IEEEPersonPanel = ({ person, touchValue, touchLimit, stepValue, stepLimit, darkMode }) => {
  const touchSafe = touchValue <= touchLimit;
  const stepSafe = stepValue <= stepLimit;
  
  return (
    <div className="bg-gray-700/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users size={16} className="text-blue-400" />
        <h4 className="font-semibold text-white">Persona {person} kg</h4>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Tensión de Contacto:</span>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-lg font-bold ${touchSafe ? 'text-green-400' : 'text-red-400'}`}>
              {isFinite(touchValue) ? touchValue.toFixed(0) : 'N/A'} V
            </span>
            <span className="text-gray-500">&lt;</span>
            <span className="text-gray-400">{isFinite(touchLimit) ? touchLimit.toFixed(0) : 'N/A'} V</span>
            {touchSafe ? <CheckCircle size={16} className="text-green-400" /> : <XCircle size={16} className="text-red-400" />}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Tensión de Paso:</span>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-lg font-bold ${stepSafe ? 'text-green-400' : 'text-red-400'}`}>
              {isFinite(stepValue) ? stepValue.toFixed(0) : 'N/A'} V
            </span>
            <span className="text-gray-500">&lt;</span>
            <span className="text-gray-400">{isFinite(stepLimit) ? stepLimit.toFixed(0) : 'N/A'} V</span>
            {stepSafe ? <CheckCircle size={16} className="text-green-400" /> : <XCircle size={16} className="text-red-400" />}
          </div>
        </div>
        
        <div className="w-full bg-gray-600 rounded-full h-1.5">
          <div className={`h-1.5 rounded-full ${touchSafe ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min((touchValue / Math.max(1, touchLimit)) * 100, 100)}%` }} />
        </div>
      </div>
    </div>
  );
};

export default IEEEPersonPanel;
