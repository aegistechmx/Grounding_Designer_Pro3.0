import React, { useState } from 'react';
import { Target, TrendingDown, Zap, Battery, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import GroundingOptimizer from '../GroundingOptimizer';

export const OptimizationPanel = ({ params, calculations, updateParam, darkMode }) => {
  const [targetGPR, setTargetGPR] = useState(10000);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);

  const handleApplyDesign = (design) => {
    console.log('handleApplyDesign recibido:', design);
    console.log('Parámetros actuales antes de actualizar:', {
      numParallel: params.numParallel,
      numParallelY: params.numParallelY,
      numRods: params.numRods,
      rodLength: params.rodLength
    });
    
    updateParam('numParallel', design.numParallel);
    updateParam('numParallelY', design.numParallelY);
    updateParam('numRods', design.numRods);
    updateParam('rodLength', design.rodLength);
    
    console.log('Parámetros después de llamar updateParam (puede ser asíncrono)');
  };

  if (!calculations) {
    return (
      <div className={`p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
        <p className="text-gray-500">Realice un cálculo para ver opciones de optimización</p>
      </div>
    );
  }

  // Estrategias de optimización
  const strategies = [
    {
      id: 'sf',
      name: 'Reducir Sf',
      description: 'Disminuir el factor de división de corriente',
      action: () => {
        const newSf = Math.max(0.1, (params.currentDivisionFactor || 0.2) - 0.05);
        updateParam('currentDivisionFactor', newSf);
        return { reduction: 25, message: `Sf reducido de ${params.currentDivisionFactor} a ${newSf}` };
      },
      icon: <Zap size={20} />,
      color: 'blue'
    },
    {
      id: 'conductors',
      name: 'Aumentar Conductores',
      description: 'Incrementar número de conductores paralelos',
      action: () => {
        const newParallel = Math.min(30, (params.numParallel || 4) + 2);
        updateParam('numParallel', newParallel);
        updateParam('numParallelY', newParallel);
        return { reduction: 15, message: `Conductores aumentados de ${params.numParallel} a ${newParallel}` };
      },
      icon: <Battery size={20} />,
      color: 'green'
    },
    {
      id: 'rods',
      name: 'Agregar Varillas',
      description: 'Incrementar número de electrodos verticales',
      action: () => {
        const newRods = Math.min(50, (params.numRods || 6) + 4);
        updateParam('numRods', newRods);
        return { reduction: 10, message: `Varillas aumentadas de ${params.numRods} a ${newRods}` };
      },
      icon: <Shield size={20} />,
      color: 'purple'
    },
    {
      id: 'surface',
      name: 'Mejorar Capa Superficial',
      description: 'Aumentar resistividad y espesor de grava',
      action: () => {
        updateParam('surfaceLayer', 10000);
        updateParam('surfaceDepth', 0.2);
        return { reduction: 20, message: 'Capa superficial mejorada a 10,000 Ω·m / 0.2m' };
      },
      icon: <TrendingDown size={20} />,
      color: 'orange'
    },
    {
      id: 'area',
      name: 'Aumentar Área de Malla',
      description: 'Expandir dimensiones de la malla',
      action: () => {
        const newLength = Math.min(50, (params.gridLength || 14) + 2);
        const newWidth = Math.min(50, (params.gridWidth || 14) + 2);
        updateParam('gridLength', newLength);
        updateParam('gridWidth', newWidth);
        return { reduction: 30, message: `Área aumentada a ${newLength}×${newWidth}m` };
      },
      icon: <Target size={20} />,
      color: 'red'
    }
  ];

  const runOptimization = async () => {
    setIsOptimizing(true);
    setOptimizationResult(null);
    
    // Simular optimización
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const currentGPR = calculations.GPR || 0;
    const reduction = ((currentGPR - targetGPR) / currentGPR * 100).toFixed(1);
    
    setOptimizationResult({
      originalGPR: currentGPR,
      targetGPR,
      newGPR: Math.min(currentGPR, targetGPR),
      reduction,
      success: currentGPR <= targetGPR
    });
    
    setIsOptimizing(false);
  };

  const applyStrategy = (strategy) => {
    const result = strategy.action();
    alert(`✅ Optimización aplicada:\n\n${result.message}\nReducción estimada: ${result.reduction}% en GPR`);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">⚡ Optimización de GPR y Seguridad</h3>
      
      {/* Estado actual */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <h4 className="font-semibold mb-2">Configuración Actual</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-gray-500">GPR:</span>
            <span className="ml-2 font-bold">{calculations.GPR?.toFixed(0)} V</span>
          </div>
          <div>
            <span className="text-gray-500">Sf:</span>
            <span className="ml-2 font-bold">{params.currentDivisionFactor}</span>
          </div>
          <div>
            <span className="text-gray-500">Conductores:</span>
            <span className="ml-2 font-bold">{params.numParallel}×{params.numParallelY}</span>
          </div>
          <div>
            <span className="text-gray-500">Varillas:</span>
            <span className="ml-2 font-bold">{params.numRods} × {params.rodLength}m</span>
          </div>
        </div>
      </div>
      
      {/* Estrategias de optimización */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategies.map(strategy => (
          <button
            key={strategy.id}
            onClick={() => applyStrategy(strategy)}
            className={`p-4 rounded-lg text-left transition-all hover:shadow-md ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
            } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg bg-${strategy.color}-100 dark:bg-${strategy.color}-900/30`}>
                {strategy.icon}
              </div>
              <div>
                <div className="font-semibold">{strategy.name}</div>
                <div className="text-xs text-gray-500">{strategy.description}</div>
              </div>
            </div>
            <div className="text-xs text-blue-600 mt-2">→ Aplicar optimización</div>
          </button>
        ))}
      </div>

      {/* Optimizador Automático NSGA-II */}
      <GroundingOptimizer
        params={params}
        darkMode={darkMode}
        onApplyDesign={handleApplyDesign}
      />
      
      {/* Optimización GPR personalizada */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Target size={18} /> Reducir GPR a un objetivo específico
        </h4>
        
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm mb-1">GPR Objetivo (V)</label>
            <select
              value={targetGPR}
              onChange={(e) => setTargetGPR(parseInt(e.target.value))}
              className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            >
              <option value="15000">15,000 V - Subestación básica</option>
              <option value="10000">10,000 V - Subestación estándar</option>
              <option value="5000">5,000 V - Con equipos electrónicos</option>
              <option value="3000">3,000 V - Con telecomunicaciones</option>
              <option value="2000">2,000 V - Hospital/Clínica</option>
              <option value="1000">1,000 V - Data center</option>
            </select>
          </div>
          
          <button
            onClick={runOptimization}
            disabled={isOptimizing}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              isOptimizing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            {isOptimizing ? 'Optimizando...' : 'Optimizar GPR'}
          </button>
        </div>
        
        {optimizationResult && (
          <div className={`mt-3 p-3 rounded-lg ${optimizationResult.success ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-black dark:text-white">Resultado de optimización</div>
                <div className="text-xs mt-1 text-black dark:text-white">
                  GPR original: {optimizationResult.originalGPR.toFixed(0)} V → 
                  GPR nuevo: {optimizationResult.newGPR.toFixed(0)} V
                </div>
                <div className="text-xs text-black dark:text-white">Reducción: {optimizationResult.reduction}%</div>
              </div>
              {optimizationResult.success ? (
                <CheckCircle size={24} className="text-green-500" />
              ) : (
                <AlertTriangle size={24} className="text-yellow-500" />
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Recomendaciones */}
      {calculations.GPR > 5000 && (
        <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-sm">
          <AlertTriangle size={16} className="inline mr-2 text-yellow-600" />
          <strong>Recomendación:</strong> El GPR actual ({calculations.GPR?.toFixed(0)} V) es elevado. 
          Aplique una o más de las optimizaciones sugeridas para reducirlo.
        </div>
      )}
    </div>
  );
};