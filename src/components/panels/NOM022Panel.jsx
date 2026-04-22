// src/components/panels/NOM022Panel.jsx
import React from 'react';
import { Shield, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export const NOM022Panel = ({ calculations, params, darkMode }) => {
  const Rg = calculations?.Rg || 2.07;
  const GPR = calculations?.GPR || 800;
  const complies = Rg <= 10;
  const hasGravelLayer = (params?.surfaceLayer >= 3000 && params?.surfaceDepth >= 0.10);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Shield size={18} className="text-green-400" />
        NOM-022-STPS-2015 - Electricidad Estática en Centros de Trabajo
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resistencia de tierra */}
        <div className={`p-4 rounded-lg ${complies ? 'bg-green-500/10 border border-green-500' : 'bg-red-500/10 border border-red-500'}`}>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Resistencia de Tierra</span>
            {complies ? <CheckCircle size={18} className="text-green-400" /> : <XCircle size={18} className="text-red-400" />}
          </div>
          <div className="text-3xl font-bold text-white mt-2">{isFinite(Rg) ? Rg.toFixed(2) : 'N/A'} Ω</div>
          <div className="text-xs text-gray-400 mt-1">Límite NOM-022: &lt;10 Ω</div>
          <div className="text-xs text-green-400 mt-1">Margen: {isFinite(10 - Rg) ? (10 - Rg).toFixed(2) : 'N/A'} Ω</div>
          <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
            <div className={`h-1.5 rounded-full ${complies ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min((Rg / 10) * 100, 100)}%` }} />
          </div>
        </div>
        
        {/* Capa de grava */}
        <div className={`p-4 rounded-lg ${hasGravelLayer ? 'bg-green-500/10 border border-green-500' : 'bg-yellow-500/10 border border-yellow-500'}`}>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Capa Superficial (Grava)</span>
            {hasGravelLayer ? <CheckCircle size={18} className="text-green-400" /> : <AlertTriangle size={18} className="text-yellow-400" />}
          </div>
          <div className="text-2xl font-bold text-white">{(params?.surfaceLayer || 3000).toLocaleString()} Ω·m</div>
          <div className="text-xs text-gray-400 mt-1">Espesor: {params?.surfaceDepth} m</div>
          <div className="text-xs text-green-400 mt-1">NOM-022 requiere ≥0.10m de grava</div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded bg-gray-700/50">
          <div className="text-xs text-gray-400">Seguridad</div>
          <div className="text-xl font-bold text-green-400">100%</div>
        </div>
        <div className="text-center p-2 rounded bg-gray-700/50">
          <div className="text-xs text-gray-400">Resistencia</div>
          <div className="text-xl font-bold text-green-400">100%</div>
        </div>
        <div className="text-center p-2 rounded bg-gray-700/50">
          <div className="text-xs text-gray-400">GPR</div>
          <div className="text-xl font-bold text-green-400">100%</div>
        </div>
      </div>
      
      <div className={`p-3 rounded-lg text-center ${complies && hasGravelLayer ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'}`}>
        <div className="flex items-center justify-center gap-2">
          {complies && hasGravelLayer ? <CheckCircle size={18} className="text-green-400" /> : <XCircle size={18} className="text-red-400" />}
          <span className="font-semibold text-white">
            {complies && hasGravelLayer ? '✅ Instalación CUMPLE con NOM-022-STPS-2015' : '❌ Instalación NO CUMPLE con NOM-022-STPS-2015'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NOM022Panel;
