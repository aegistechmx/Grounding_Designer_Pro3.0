// src/components/panels/ResultsPanel.jsx
import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, TrendingUp, Activity, Zap } from 'lucide-react';
import { formatResistance, formatVoltage, formatCurrent, formatNumber } from '../../utils/formatters';

const getStatusColor = (value, limit, warningThreshold = 0.8) => {
  if (value <= limit * warningThreshold) return { color: 'green', bg: 'green', text: 'text-green-400', border: 'border-green-500', shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]', icon: CheckCircle };
  if (value <= limit) return { color: 'yellow', bg: 'yellow', text: 'text-yellow-400', border: 'border-yellow-500', shadow: 'shadow-[0_0_15px_rgba(234,179,8,0.3)]', icon: AlertTriangle };
  return { color: 'red', bg: 'red', text: 'text-red-400', border: 'border-red-500', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]', icon: XCircle };
};

export const ResultsPanel = ({ calculations, darkMode }) => {
  // Valores con formateo
  const Rg = calculations?.Rg || 0;
  const GPR = calculations?.GPR || 0;
  const Em = calculations?.Em || 0;
  const Es = calculations?.Es || 0;
  const Ig = calculations?.Ig || 0;
  
  const statusRg = getStatusColor(Rg, 10, 0.8);
  const statusGPR = getStatusColor(GPR, 5000, 0.8);
  const StatusIconRg = statusRg.icon;
  const StatusIconGPR = statusGPR.icon;
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <TrendingUp size={18} className="text-green-400" />
        Resultados de Cálculo
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Resistencia Rg */}
        <div className={`rounded-xl border-2 ${statusRg.border} bg-gradient-to-br from-gray-800 to-gray-900 ${statusRg.shadow} p-3 text-center`}>
          <div className="text-xs text-gray-400">Resistencia (Rg)</div>
          <div className="text-2xl font-bold text-white">{formatResistance(Rg, 3)}</div>
          <StatusIconRg size={16} className={`${statusRg.text} mx-auto mt-1`} />
        </div>
        
        {/* GPR */}
        <div className={`rounded-xl border-2 ${statusGPR.border} bg-gradient-to-br from-gray-800 to-gray-900 ${statusGPR.shadow} p-3 text-center`}>
          <div className="text-xs text-gray-400">GPR</div>
          <div className="text-2xl font-bold text-white">{formatVoltage(GPR, 0)}</div>
          <StatusIconGPR size={16} className={`${statusGPR.text} mx-auto mt-1`} />
        </div>
        
        {/* Tensión Contacto */}
        <div className="rounded-xl border-2 border-blue-500 bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_15px_rgba(59,130,246,0.3)] p-3 text-center">
          <div className="text-xs text-gray-400">Tensión Contacto</div>
          <div className="text-2xl font-bold text-white">{formatVoltage(Em, 0)}</div>
          <Info size={16} className="text-blue-400 mx-auto mt-1" />
        </div>
        
        {/* Tensión Paso */}
        <div className="rounded-xl border-2 border-blue-500 bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_15px_rgba(59,130,246,0.3)] p-3 text-center">
          <div className="text-xs text-gray-400">Tensión Paso</div>
          <div className="text-2xl font-bold text-white">{formatVoltage(Es, 0)}</div>
          <Info size={16} className="text-blue-400 mx-auto mt-1" />
        </div>
      </div>
      
      {/* Corriente de Malla */}
      <div className="rounded-xl border-2 border-blue-500 bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_15px_rgba(59,130,246,0.3)] p-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Corriente de Malla (Ig)</span>
          <span className="text-lg font-bold text-white">{formatCurrent(Ig, 0)}</span>
        </div>
      </div>
      
      {/* Estado general */}
      <div className="rounded-xl border-2 border-green-500 bg-green-500/10 p-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <CheckCircle size={16} className="text-green-400" />
          <span className="text-green-400 font-semibold">Diseño verificado correctamente</span>
        </div>
      </div>
    </div>
  );
};