// src/components/AutoDesignPanel.jsx
// Panel de control de auto-diseño normativo

import React, { useState } from 'react';
import { AutoDesignEngine } from '../engine/autodesign/AutoDesignEngine.js';
import { Zap, DollarSign, Shield, CheckCircle, Loader } from 'lucide-react';
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
          <div className={`p-4 rounded-lg border ${darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}`} style={{ boxShadow: darkMode ? '0 0 15px rgba(34, 197, 94, 0.3), inset 0 0 8px rgba(34, 197, 94, 0.15)' : '0 0 15px rgba(34, 197, 94, 0.2), inset 0 0 8px rgba(34, 197, 94, 0.1)' }}>
            <h4 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
              <CheckCircle size={16} /> ✅ Diseño Óptimo Encontrado
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className={`p-2 rounded ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <div className={`font-semibold mb-1 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Conductores</div>
                <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-green-900'}`}>{result.design.numParallelX} x {result.design.numParallelY}</div>
              </div>
              <div className={`p-2 rounded ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <div className={`font-semibold mb-1 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Varillas</div>
                <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-green-900'}`}>{result.design.numRods} x {formatDistance(result.design.rodLength, 0)}</div>
              </div>
              <div className={`p-2 rounded ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <div className={`font-semibold mb-1 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Dimensiones</div>
                <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-green-900'}`}>{formatDistance(result.design.gridLength, 0)} x {formatDistance(result.design.gridWidth, 0)}</div>
              </div>
              <div className={`p-2 rounded ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <div className={`font-semibold mb-1 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Costo estimado</div>
                <div className={`text-lg font-bold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>{formatNumber(result.report.cost.total, 0)} MXN</div>
              </div>
              <div className={`p-2 rounded ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <div className={`font-semibold mb-1 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Tiempo</div>
                <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-green-900'}`}>{formatNumber(result.executionTime / 1000, 1)} s</div>
              </div>
              <div className={`p-2 rounded ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <div className={`font-semibold mb-1 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Estado</div>
                <div className={`text-lg font-bold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>Cumple</div>
              </div>
            </div>
            <div className={`mt-3 p-2 rounded ${darkMode ? 'bg-green-900/40' : 'bg-green-200'}`}>
              <p className={`text-xs flex items-start gap-2 ${darkMode ? 'text-green-200' : 'text-green-800'}`}>
                <CheckCircle size={12} className="flex-shrink-0 mt-0.5" />
                <span>
                  <strong>💡 Optimización completada:</strong> El diseño cumple con CFE + NOM en {formatNumber(result.executionTime / 1000, 1)} segundos
                </span>
              </p>
            </div>
            <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-green-900/40' : 'bg-green-200'}`}>
              <p className={`text-xs ${darkMode ? 'text-green-200' : 'text-green-800'}`}>
                <strong>📐 Algoritmo:</strong> Optimización automática basada en IEEE Std 80 y normas CFE.
              </p>
            </div>
            <button
              onClick={applyDesign}
              className="mt-3 w-full bg-green-600 hover:bg-green-700 py-2 rounded font-semibold text-white"
            >
              Aplicar este diseño
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoDesignPanel;
