// src/components/panels/EfficiencyIndicators.jsx
import React from 'react';
import { TrendingDown, Activity, Zap, Battery } from 'lucide-react';

export const EfficiencyIndicators = ({ params, darkMode }) => {
  const area = (params?.gridLength || 12.5) * (params?.gridWidth || 8);
  const totalConductor = 2 * ((params?.gridLength || 12.5) + (params?.gridWidth || 8)) * (params?.numParallel || 8);
  const config = `${params?.numParallel || 8}×${params?.numParallelY || 8}`;
  
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
        <TrendingDown size={16} className="text-blue-400" />
        Indicadores de Eficiencia
      </h4>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Activity size={12} className="text-blue-400" />
            <span className="text-xs text-gray-400">Área de malla</span>
          </div>
          <div className="text-xl font-bold text-white">{isFinite(area) ? area.toFixed(0) : 'N/A'} m²</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap size={12} className="text-yellow-400" />
            <span className="text-xs text-gray-400">Conductor total</span>
          </div>
          <div className="text-xl font-bold text-white">{isFinite(totalConductor) ? totalConductor.toFixed(0) : 'N/A'} m</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Battery size={12} className="text-green-400" />
            <span className="text-xs text-gray-400">Varillas</span>
          </div>
          <div className="text-xl font-bold text-white">{params?.numRods || 16}</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown size={12} className="text-blue-400" />
            <span className="text-xs text-gray-400">Configuración</span>
          </div>
          <div className="text-xl font-bold text-white">{config}</div>
        </div>
      </div>
    </div>
  );
};

export default EfficiencyIndicators;
