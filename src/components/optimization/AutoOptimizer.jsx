import React, { useState, useCallback } from 'react';
import { Zap, Settings, Play, RefreshCw, CheckCircle, AlertTriangle, TrendingUp, Target, Sliders, Save } from 'lucide-react';
import { calculateIEEE80 } from '../../utils/groundingMath_clean';

const AutoOptimizer = ({ params, darkMode, onOptimize }) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [targetValues, setTargetValues] = useState({
    targetEm: 400,
    targetEs: 300,
    targetRg: 3.0
  });
  const [optimizationStrategy, setOptimizationStrategy] = useState('balanced');
  const [iterations, setIterations] = useState(50);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const strategies = [
    { key: 'balanced', label: 'Equilibrado', description: 'Balance entre costo y seguridad' },
    { key: 'safety', label: 'Seguridad Máxima', description: 'Prioriza cumplimiento normativo' },
    { key: 'cost', label: 'Costo Mínimo', description: 'Minimiza materiales' },
    { key: 'custom', label: 'Personalizado', description: 'Define tus propios objetivos' }
  ];

  // ============================================
  // FUNCIÓN DE OPTIMIZACIÓN
  // ============================================
  const runOptimization = useCallback(async () => {
    if (!params) {
      console.warn('Parámetros no definidos');
      return;
    }
    
    setIsOptimizing(true);
    
    try {
      const currentResults = calculateIEEE80(params);
      
      // Validar que currentResults existe
      if (!currentResults || !currentResults.Rg) {
        throw new Error('No se pudieron calcular los resultados actuales');
      }
      
      const bestSolutions = [];
      
      const paramRanges = {
        numParallel: { min: 2, max: 20, step: 1 },
        numParallelY: { min: 2, max: 20, step: 1 },
        numRods: { min: 0, max: 80, step: 5 },
        gridLength: { min: 5, max: 50, step: 1 },
        gridWidth: { min: 5, max: 50, step: 1 },
        rodLength: { min: 1, max: 5, step: 0.5 },
        gridDepth: { min: 0.5, max: 2, step: 0.1 },
        currentDivisionFactor: { min: 0.1, max: 0.8, step: 0.01 }
      };

      // Validar que params tiene los valores necesarios
      const safeParams = {
        numParallel: params.numParallel || 4,
        numParallelY: params.numParallelY || 4,
        numRods: params.numRods || 6,
        gridLength: params.gridLength || 14,
        gridWidth: params.gridWidth || 14,
        rodLength: params.rodLength || 3,
        gridDepth: params.gridDepth || 0.6,
        currentDivisionFactor: params.currentDivisionFactor || 0.15,
        ...params
      };

      for (let i = 0; i < iterations; i++) {
        const testParams = { ...safeParams };
        
        // Random variations based on strategy
        if (optimizationStrategy === 'safety' || optimizationStrategy === 'balanced') {
          testParams.numParallel = Math.min(paramRanges.numParallel.max, 
            Math.max(paramRanges.numParallel.min, (testParams.numParallel || 4) + Math.floor(Math.random() * 4)));
          testParams.numParallelY = Math.min(paramRanges.numParallelY.max, 
            Math.max(paramRanges.numParallelY.min, (testParams.numParallelY || 4) + Math.floor(Math.random() * 4)));
          testParams.numRods = Math.min(paramRanges.numRods.max, 
            Math.max(paramRanges.numRods.min, (testParams.numRods || 6) + Math.floor(Math.random() * 10)));
        }
        
        if (optimizationStrategy === 'cost') {
          testParams.numParallel = Math.max(paramRanges.numParallel.min, 
            (testParams.numParallel || 4) - Math.floor(Math.random() * 2));
          testParams.numParallelY = Math.max(paramRanges.numParallelY.min, 
            (testParams.numParallelY || 4) - Math.floor(Math.random() * 2));
          testParams.numRods = Math.max(paramRanges.numRods.min, 
            (testParams.numRods || 6) - Math.floor(Math.random() * 5));
        }

        // Variaciones de dimensiones
        testParams.gridLength = Math.min(paramRanges.gridLength.max, 
          Math.max(paramRanges.gridLength.min, (testParams.gridLength || 14) + (Math.random() - 0.5) * 4));
        testParams.gridWidth = Math.min(paramRanges.gridWidth.max, 
          Math.max(paramRanges.gridWidth.min, (testParams.gridWidth || 14) + (Math.random() - 0.5) * 4));

        const testResults = calculateIEEE80(testParams);
        
        if (!testResults) continue;
        
        // Calculate score based on strategy
        let score = 0;
        const targetEm = targetValues.targetEm || 400;
        const targetEs = targetValues.targetEs || 300;
        
        if (optimizationStrategy === 'safety') {
          // Prioritize compliance
          score += testResults.complies ? 100 : 0;
          if (testResults.Em && targetEm > 0) {
            score += Math.max(0, (1 - testResults.Em / targetEm)) * 50;
          }
          if (testResults.Es && targetEs > 0) {
            score += Math.max(0, (1 - testResults.Es / targetEs)) * 50;
          }
        } else if (optimizationStrategy === 'cost') {
          // Prioritize minimal materials
          score -= (testParams.numParallel || 4) * 5;
          score -= (testParams.numRods || 6) * 2;
          score -= ((testParams.gridLength || 14) * (testParams.gridWidth || 14)) * 0.1;
          if (testResults.complies) score += 100;
        } else {
          // Balanced
          score += testResults.complies ? 50 : 0;
          if (testResults.Em && targetEm > 0) {
            score += Math.max(0, (1 - testResults.Em / targetEm)) * 25;
          }
          if (testResults.Es && targetEs > 0) {
            score += Math.max(0, (1 - testResults.Es / targetEs)) * 25;
          }
          score -= (testParams.numParallel || 4) * 2;
          score -= (testParams.numRods || 6) * 1;
        }

        // Calculate improvements
        const currentEm = currentResults.Em || 1;
        const currentEs = currentResults.Es || 1;
        const currentRg = currentResults.Rg || 1;
        
        bestSolutions.push({
          params: { ...testParams },
          results: testResults,
          score,
          improvement: {
            Em: currentEm !== 0 ? ((currentEm - (testResults.Em || 0)) / currentEm * 100) : 0,
            Es: currentEs !== 0 ? ((currentEs - (testResults.Es || 0)) / currentEs * 100) : 0,
            Rg: currentRg !== 0 ? ((currentRg - (testResults.Rg || 0)) / currentRg * 100) : 0
          }
        });
      }

      // Sort by score
      bestSolutions.sort((a, b) => b.score - a.score);
      
      // Get top 5 solutions
      const topSolutions = bestSolutions.slice(0, 5);
      
      setOptimizationResults({
        current: currentResults,
        best: topSolutions[0],
        alternatives: topSolutions.slice(1),
        totalIterations: iterations,
        strategy: optimizationStrategy
      });
      
      if (onOptimize && topSolutions[0]) {
        onOptimize(topSolutions[0].params);
      }
    } catch (error) {
      console.error('Error en optimización:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [params, optimizationStrategy, iterations, targetValues, onOptimize]);

  const applySolution = (solutionParams) => {
    if (onOptimize) {
      onOptimize(solutionParams);
    }
  };

  // ============================================
  // RENDERIZADO
  // ============================================
  const colors = darkMode ? {
    bg: 'bg-gray-800',
    card: 'bg-gray-700',
    text: 'text-white',
    textSecondary: 'text-gray-300',
    border: 'border-gray-600',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400'
  } : {
    bg: 'bg-white',
    card: 'bg-gray-50',
    text: 'text-gray-800',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  return (
    <div className={`p-4 rounded-lg ${colors.bg} shadow`}>
      <div className="flex justify-between items-center mb-4">
        <h4 className={`font-semibold flex items-center gap-2 ${colors.text}`}>
          <Settings size={18} /> Optimización Automática
        </h4>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <Sliders size={16} />
        </button>
      </div>

      {showAdvanced && (
        <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`text-sm font-semibold mb-1 block ${colors.text}`}>Estrategia</label>
              <select
                value={optimizationStrategy}
                onChange={(e) => setOptimizationStrategy(e.target.value)}
                className={`w-full p-2 rounded text-sm ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'}`}
              >
                {strategies.map(strategy => (
                  <option key={strategy.key} value={strategy.key}>{strategy.label}</option>
                ))}
              </select>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {strategies.find(s => s.key === optimizationStrategy)?.description}
              </p>
            </div>
            <div>
              <label className={`text-sm font-semibold mb-1 block ${colors.text}`}>Iteraciones</label>
              <input
                type="range"
                min="10"
                max="200"
                value={iterations}
                onChange={(e) => setIterations(parseInt(e.target.value))}
                className="w-full"
              />
              <span className={`text-sm ml-2 ${colors.text}`}>{iterations}</span>
            </div>
          </div>
          
          {(optimizationStrategy === 'safety' || optimizationStrategy === 'custom') && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <label className={`text-xs font-semibold mb-1 block ${colors.text}`}>Objetivo Em (V)</label>
                <input
                  type="number"
                  value={targetValues.targetEm}
                  onChange={(e) => setTargetValues({ ...targetValues, targetEm: parseFloat(e.target.value) })}
                  className={`w-full p-2 rounded text-sm ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'}`}
                />
              </div>
              <div>
                <label className={`text-xs font-semibold mb-1 block ${colors.text}`}>Objetivo Es (V)</label>
                <input
                  type="number"
                  value={targetValues.targetEs}
                  onChange={(e) => setTargetValues({ ...targetValues, targetEs: parseFloat(e.target.value) })}
                  className={`w-full p-2 rounded text-sm ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'}`}
                />
              </div>
              <div>
                <label className={`text-xs font-semibold mb-1 block ${colors.text}`}>Objetivo Rg (Ω)</label>
                <input
                  type="number"
                  value={targetValues.targetRg}
                  onChange={(e) => setTargetValues({ ...targetValues, targetRg: parseFloat(e.target.value) })}
                  className={`w-full p-2 rounded text-sm ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'}`}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={runOptimization}
        disabled={isOptimizing}
        className={`w-full p-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
          isOptimizing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isOptimizing ? (
          <>
            <RefreshCw size={16} className="animate-spin" /> Optimizando...
          </>
        ) : (
          <>
            <Play size={16} /> Ejecutar Optimización
          </>
        )}
      </button>

      {optimizationResults && (
        <div className="mt-4 space-y-4">
          {/* Mejor Solución */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'} border-2 border-green-500`}>
            <h5 className={`font-semibold mb-2 flex items-center gap-2 ${colors.text}`}>
              <CheckCircle size={16} className="text-green-600" />
              Mejor Solución Encontrada
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Rg:</span>
                <span className={`ml-1 font-bold ${colors.text}`}>
                  {optimizationResults.best?.results?.Rg?.toFixed(2) || 'N/A'} Ω
                </span>
              </div>
              <div>
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Em:</span>
                <span className={`ml-1 font-bold ${colors.text}`}>
                  {optimizationResults.best?.results?.Em?.toFixed(0) || 'N/A'} V
                </span>
              </div>
              <div>
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Es:</span>
                <span className={`ml-1 font-bold ${colors.text}`}>
                  {optimizationResults.best?.results?.Es?.toFixed(0) || 'N/A'} V
                </span>
              </div>
              <div>
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Cumple:</span>
                <span className={`ml-1 font-bold ${optimizationResults.best?.results?.complies ? 'text-green-600' : 'text-red-600'}`}>
                  {optimizationResults.best?.results?.complies ? 'SÍ' : 'NO'}
                </span>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => applySolution(optimizationResults.best?.params)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                <Target size={14} /> Aplicar Solución
              </button>
              <button
                onClick={() => applySolution(optimizationResults.best?.params)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                <Save size={14} /> Guardar
              </button>
            </div>
          </div>

          {/* Mejoras Estimadas */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h5 className={`font-semibold mb-2 flex items-center gap-2 ${colors.text}`}>
              <TrendingUp size={16} /> Mejoras Estimadas
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Tensión Contacto:</span>
                <span className={`text-sm font-bold ${(optimizationResults.best?.improvement?.Em || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(optimizationResults.best?.improvement?.Em || 0) > 0 ? '↓' : '↑'} {isFinite(Math.abs(optimizationResults.best?.improvement?.Em || 0)) ? Math.abs(optimizationResults.best?.improvement?.Em || 0).toFixed(1) : '0'}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Tensión Paso:</span>
                <span className={`text-sm font-bold ${(optimizationResults.best?.improvement?.Es || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(optimizationResults.best?.improvement?.Es || 0) > 0 ? '↓' : '↑'} {isFinite(Math.abs(optimizationResults.best?.improvement?.Es || 0)) ? Math.abs(optimizationResults.best?.improvement?.Es || 0).toFixed(1) : '0'}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Resistencia Malla:</span>
                <span className={`text-sm font-bold ${(optimizationResults.best?.improvement?.Rg || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(optimizationResults.best?.improvement?.Rg || 0) > 0 ? '↓' : '↑'} {isFinite(Math.abs(optimizationResults.best?.improvement?.Rg || 0)) ? Math.abs(optimizationResults.best?.improvement?.Rg || 0).toFixed(1) : '0'}%
                </span>
              </div>
            </div>
          </div>

          {/* Alternativas */}
          {optimizationResults.alternatives && optimizationResults.alternatives.length > 0 && (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h5 className={`font-semibold mb-2 ${colors.text}`}>Alternativas</h5>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {optimizationResults.alternatives.map((solution, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'} flex items-center justify-between cursor-pointer hover:opacity-80`}
                    onClick={() => applySolution(solution.params)}
                  >
                    <div className="text-sm">
                      <span className={`font-semibold ${colors.text}`}>#{index + 2}</span>
                      <span className={`ml-2 ${colors.text}`}>Rg: {solution.results?.Rg?.toFixed(2) || 'N/A'}Ω</span>
                      <span className={`ml-2 ${colors.text}`}>Em: {solution.results?.Em?.toFixed(0) || 'N/A'}V</span>
                    </div>
                    <span className={`text-xs ${solution.results?.complies ? 'text-green-600' : 'text-red-600'}`}>
                      {solution.results?.complies ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
            Analizadas {optimizationResults.totalIterations || 0} combinaciones con estrategia "{strategies.find(s => s.key === optimizationStrategy)?.label}"
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoOptimizer;