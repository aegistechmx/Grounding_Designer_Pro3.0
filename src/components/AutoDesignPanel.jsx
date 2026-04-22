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
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
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
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg border border-green-500">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <CheckCircle className="text-green-600" />
              Diseño Óptimo Encontrado
            </h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Conductores:</span>
                <span className="ml-2 font-bold">{result.design.numParallelX} x {result.design.numParallelY}</span>
              </div>
              <div>
                <span className="text-gray-500">Varillas:</span>
                <span className="ml-2 font-bold">{result.design.numRods} x {formatDistance(result.design.rodLength, 0)}</span>
              </div>
              <div>
                <span className="text-gray-500">Dimensiones:</span>
                <span className="ml-2 font-bold">{formatDistance(result.design.gridLength, 0)} x {formatDistance(result.design.gridWidth, 0)}</span>
              </div>
              <div>
                <span className="text-gray-500">Costo estimado:</span>
                <span className="ml-2 font-bold text-green-600">{formatNumber(result.report.cost.total, 0)} MXN</span>
              </div>
            </div>
            
            <button
              onClick={applyDesign}
              className="mt-3 w-full bg-green-600 hover:bg-green-700 py-2 rounded font-semibold"
            >
              Aplicar este diseño
            </button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            Optimización completada en {formatNumber(result.executionTime / 1000, 1)} segundos
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoDesignPanel;
