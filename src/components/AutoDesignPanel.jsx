// src/components/AutoDesignPanel.jsx
// Panel de control de auto-diseño normativo

import React, { useState } from 'react';
import { AutoDesignEngine } from '../engine/autodesign/AutoDesignEngine.js';
import { Zap, DollarSign, Shield, CheckCircle, Loader } from 'lucide-react';
import IEEESection from './common/IEEESection';
import { formatDistance, formatNumber } from '../utils/formatters';

const AutoDesignPanel = ({ onDesignApplied, darkMode }) => {
  const [isDesigning, setIsDesigning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [domain, setDomain] = useState({
    grid: { length: { min: 10, max: 20 }, width: { min: 8, max: 15 }, depth: { min: 0.4, max: 1.0 } },
    soil: { resistivity: 100, moisture: 0.25 },
    fault: { current: 5000, duration: 0.35, divisionFactor: 0.15 },
    voltageLevel: 13200
  });

  const runAutoDesign = async () => {
    setIsDesigning(true);
    setProgress(0);
    
    const engine = new AutoDesignEngine({
      populationSize: 30,
      generations: 20,
      verbose: true,
      weights: { cost: 0.35, safety: 0.45, resistance: 0.2 }
    });
    
    try {
      const result = await engine.design(domain);
      setResult(result);
      
      if (onDesignApplied && result.design) {
        onDesignApplied(result.design);
      }
    } catch (error) {
      console.error('Error en auto-diseño:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsDesigning(false);
      setProgress(100);
    }
  };

  const applyDesign = () => {
    if (result?.design && onDesignApplied) {
      onDesignApplied(result.design);
      alert('✅ Diseño aplicado a la interfaz');
    }
  };

  return (
    <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Zap className="text-blue-500" />
        Auto-Diseño Normativo
        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded ml-2">CFE + NOM-001</span>
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <label className="block text-sm font-medium mb-1">Resistividad suelo (Ω·m)</label>
          <input
            type="number"
            value={domain.soil.resistivity}
            onChange={(e) => setDomain({...domain, soil: {...domain.soil, resistivity: Math.max(1, parseFloat(e.target.value) || 100)}})}
            className="w-full p-2 rounded bg-white dark:bg-gray-600"
          />
        </div>
        
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <label className="block text-sm font-medium mb-1">Corriente de falla (A)</label>
          <input
            type="number"
            value={domain.fault.current}
            onChange={(e) => setDomain({...domain, fault: {...domain.fault, current: Math.max(1, parseFloat(e.target.value) || 5000)}})}
            className="w-full p-2 rounded bg-white dark:bg-gray-600"
          />
        </div>
        
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <label className="block text-sm font-medium mb-1">Tensión sistema (V)</label>
          <input
            type="number"
            value={domain.voltageLevel}
            onChange={(e) => setDomain({...domain, voltageLevel: Math.max(100, parseFloat(e.target.value) || 13200)})}
            className="w-full p-2 rounded bg-white dark:bg-gray-600"
          />
        </div>
      </div>
      
      <button
        onClick={runAutoDesign}
        disabled={isDesigning}
        className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
          isDesigning
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isDesigning ? (
          <>
            <Loader size={20} className="animate-spin" />
            Optimizando diseño... {Math.round(progress)}%
          </>
        ) : (
          <>
            <Zap size={20} />
            Generar Diseño Óptimo (CFE + NOM)
          </>
        )}
      </button>
      
      {result && (
        <div className="mt-6 space-y-4">
          <IEEESection
            title="✅ Diseño Óptimo Encontrado"
            darkMode={darkMode}
            variant="green"
            icon={CheckCircle}
            metrics={[
              { label: "Conductores", value: `${result.design.numParallelX} x ${result.design.numParallelY}` },
              { label: "Varillas", value: `${result.design.numRods} x ${formatDistance(result.design.rodLength, 0)}` },
              { label: "Dimensiones", value: `${formatDistance(result.design.gridLength, 0)} x ${formatDistance(result.design.gridWidth, 0)}` },
              { label: "Costo estimado", value: `${formatNumber(result.report.cost.total, 0)} MXN`, highlight: 'text-green-400' },
              { label: "Tiempo", value: `${formatNumber(result.executionTime / 1000, 1)} s` },
              { label: "Estado", value: "Cumple", highlight: 'text-green-400' }
            ]}
            info={
              <>
                <CheckCircle size={12} className="flex-shrink-0 mt-0.5 text-green-400" />
                <strong>💡 Optimización completada:</strong> El diseño cumple con CFE + NOM en {formatNumber(result.executionTime / 1000, 1)} segundos
              </>
            }
            info2={
              <>
                <strong>📐 Algoritmo:</strong> Optimización automática basada en IEEE Std 80 y normas CFE.
              </>
            }
          />
          <button
            onClick={applyDesign}
            className="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-semibold text-white"
          >
            Aplicar este diseño
          </button>
        </div>
      )}
    </div>
  );
};

export default AutoDesignPanel;
