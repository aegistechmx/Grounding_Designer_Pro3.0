import React, { useState } from 'react';
import { quickOptimize, constraints, costFunction } from '../engine/optimizerNSGA2';
import { Target, DollarSign, Shield, Zap, CheckCircle, XCircle, Loader } from 'lucide-react';

const GroundingOptimizer = ({ params, darkMode, onApplyDesign }) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [selectedStrategy, setSelectedStrategy] = useState('balanced');

  const strategies = [
    { id: 'balanced', name: 'Equilibrado', description: 'Balance entre costo y seguridad', icon: <Target size={18} /> },
    { id: 'cost', name: 'Mínimo Costo', description: 'Prioriza el menor costo posible', icon: <DollarSign size={18} /> },
    { id: 'safety', name: 'Máxima Seguridad', description: 'Prioriza cumplimiento IEEE 80', icon: <Shield size={18} /> },
    { id: 'quick', name: 'Rápido', description: 'Prueba configuraciones comunes', icon: <Zap size={18} /> }
  ];

  const runOptimization = async () => {
    setIsOptimizing(true);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 90));
    }, 200);
    
    try {
      const area = (params.gridLength || 12.5) * (params.gridWidth || 8);
      
      const baseParams = {
        area: area,
        soilResistivity: params.soilResistivity || 100,
        burialDepth: params.gridDepth || 0.5,
        faultCurrent: params.faultCurrent || 1771,
        X_R: params.currentDivisionFactor || 0.15,
        faultDuration: params.faultDuration || 0.5,
        surfaceResistivity: params.surfaceLayer || 3000,
        surfaceDepth: params.surfaceDepth || 0.1,
        nx: params.numParallel || 8,
        ny: params.numParallelY || 8,
        numRods: params.numRods || 16,
        rodLength: params.rodLength || 3
      };
      
      let result;
      
      // Configuraciones según la estrategia seleccionada
      if (selectedStrategy === 'quick') {
        result = quickOptimize(baseParams);
      } 
      else if (selectedStrategy === 'cost') {
        // Mínimo Costo - prioriza configuraciones con menos conductores
        const costConfigs = [
          { nx: 6, ny: 6, numRods: 12, rodLength: 3 },
          { nx: 8, ny: 8, numRods: 14, rodLength: 3 },
          { nx: 8, ny: 8, numRods: 16, rodLength: 3 },
          { nx: 10, ny: 10, numRods: 16, rodLength: 3 },
          { nx: 10, ny: 10, numRods: 18, rodLength: 3 }
        ];
        result = evaluateConfigs(costConfigs, baseParams);
        result.strategy = 'Mínimo Costo';
      }
      else if (selectedStrategy === 'safety') {
        // Máxima Seguridad - prioriza más conductores y varillas
        const safetyConfigs = [
          { nx: 12, ny: 12, numRods: 24, rodLength: 3.5 },
          { nx: 14, ny: 14, numRods: 28, rodLength: 3.5 },
          { nx: 12, ny: 12, numRods: 30, rodLength: 3 },
          { nx: 16, ny: 16, numRods: 32, rodLength: 3 },
          { nx: 10, ny: 10, numRods: 24, rodLength: 3.5 }
        ];
        result = evaluateConfigs(safetyConfigs, baseParams);
        result.strategy = 'Máxima Seguridad';
      }
      else {
        // Equilibrado (balanced) - balance entre costo y seguridad
        const balancedConfigs = [
          { nx: 8, ny: 8, numRods: 16, rodLength: 3 },
          { nx: 10, ny: 10, numRods: 20, rodLength: 3 },
          { nx: 10, ny: 10, numRods: 22, rodLength: 3.5 },
          { nx: 12, ny: 12, numRods: 20, rodLength: 3 },
          { nx: 8, ny: 8, numRods: 20, rodLength: 3.5 }
        ];
        result = evaluateConfigs(balancedConfigs, baseParams);
        result.strategy = 'Equilibrado';
      }
      
      setOptimizationResult(result);
      setProgress(100);
      
    } catch (error) {
      console.error('Error en optimización:', error);
    } finally {
      clearInterval(progressInterval);
      setIsOptimizing(false);
    }
  };

  const applyDesign = () => {
    console.log('applyDesign llamado', optimizationResult?.bestSolution);
    
    if (optimizationResult?.bestSolution && onApplyDesign) {
      // Mapear correctamente los nombres de propiedades
      const designToApply = {
        numParallel: optimizationResult.bestSolution.numParallel || optimizationResult.bestSolution.nx || optimizationResult.bestSolution.numParallelX || 8,
        numParallelY: optimizationResult.bestSolution.numParallelY || optimizationResult.bestSolution.ny || 8,
        numRods: optimizationResult.bestSolution.numRods || 16,
        rodLength: optimizationResult.bestSolution.rodLength || 3.5
      };
      
      console.log('Aplicando diseño:', designToApply);
      onApplyDesign(designToApply);
      setOptimizationResult(null);
    } else {
      console.log('No se puede aplicar: bestSolution o onApplyDesign faltan', {
        hasBestSolution: !!optimizationResult?.bestSolution,
        hasOnApplyDesign: !!onApplyDesign
      });
    }
  };

  // Función auxiliar para evaluar configuraciones
  const evaluateConfigs = (configs, params) => {
    const designs = [];
    
    for (const config of configs) {
      const constraintsResult = constraints(config, params);
      const totalLength = 2 * (Math.sqrt(params.area) + Math.sqrt(params.area)) * Math.max(config.nx, config.ny);
      const cost = costFunction({
        totalLength,
        numRods: config.numRods,
        rodLength: config.rodLength,
        area: params.area
      });
      
      designs.push({
        numParallel: config.nx,
        numParallelY: config.ny,
        numRods: config.numRods,
        rodLength: config.rodLength,
        cost: cost.total,
        resistance: constraintsResult.Rg,
        constraints: constraintsResult,
        costDetails: cost
      });
    }
    
    const feasible = designs.filter(d => d.constraints.feasible);
    
    if (feasible.length === 0) {
      const sortedByResistance = [...designs].sort((a, b) => a.resistance - b.resistance);
      return {
        bestSolution: sortedByResistance[0],
        alternatives: sortedByResistance.slice(1, 3),
        noFeasibleSolution: true
      };
    }
    
    // Ordenar por costo (menor a mayor)
    feasible.sort((a, b) => a.cost - b.cost);
    
    return {
      bestSolution: feasible[0],
      alternatives: feasible.slice(1, 3),
      noFeasibleSolution: false
    };
  };

  return (
    <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Target className="text-blue-500" /> Optimizador Automático
        </h3>
        <div className="flex gap-2">
          {strategies.map(strategy => (
            <button
              key={strategy.id}
              onClick={() => setSelectedStrategy(strategy.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                selectedStrategy === strategy.id
                  ? 'bg-blue-600 text-white'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {strategy.icon}
              {strategy.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Descripción de la estrategia */}
      <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <p className="text-sm">{strategies.find(s => s.id === selectedStrategy)?.description}</p>
      </div>
      
      {/* Botón de optimización */}
      <button
        onClick={runOptimization}
        disabled={isOptimizing}
        className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
          isOptimizing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
        }`}
      >
        {isOptimizing ? (
          <>
            <Loader size={20} className="animate-spin" />
            Optimizando... {progress}%
          </>
        ) : (
          <>
            <Zap size={20} />
            Ejecutar Optimización Automática
          </>
        )}
      </button>
      
      {/* Barra de progreso */}
      {isOptimizing && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-center mt-2 text-gray-500">
            Generación {Math.floor(progress / 100 * 80)} de 80
          </p>
        </div>
      )}
      
      {/* Resultados */}
      {optimizationResult && !isOptimizing && (
        <div className="mt-6 space-y-4">
          {/* Advertencia si no hay solución factible */}
          {optimizationResult.noFeasibleSolution && (
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'} border border-yellow-500`}>
              <div className="flex items-start gap-2">
                <XCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-yellow-800">No se encontró solución que cumpla IEEE 80</div>
                  <div className="text-xs text-yellow-700 mt-1">
                    Se muestra la mejor opción disponible. Aumente el área de malla, agregue más conductores o varillas para cumplir con la norma.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mejor solución */}
          <div className={`p-4 rounded-lg ${optimizationResult.noFeasibleSolution ? (darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50') : (darkMode ? 'bg-green-900/30' : 'bg-green-50')} border-2 ${optimizationResult.noFeasibleSolution ? 'border-yellow-500' : 'border-green-500'}`}>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              {optimizationResult.noFeasibleSolution ? (
                <XCircle size={18} className="text-yellow-600" />
              ) : (
                <CheckCircle size={18} className="text-green-600" />
              )}
              {optimizationResult.noFeasibleSolution ? 'Mejor Opción Disponible' : 'Mejor Diseño Encontrado'}
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
                <div className="text-xs text-gray-500">Conductores X</div>
                <div className="text-xl font-bold">
                  {optimizationResult.bestSolution?.numParallel || 
                   optimizationResult.bestSolution?.nx || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Conductores Y</div>
                <div className="text-xl font-bold">
                  {optimizationResult.bestSolution?.numParallelY || 
                   optimizationResult.bestSolution?.ny || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Varillas</div>
                <div className="text-xl font-bold">{optimizationResult.bestSolution?.numRods || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Longitud Varilla</div>
                <div className="text-xl font-bold">{optimizationResult.bestSolution?.rodLength?.toFixed(1) || 'N/A'} m</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="text-xs text-gray-500">Resistencia (Rg)</div>
                <div className="text-lg font-bold">{optimizationResult.bestSolution?.resistance?.toFixed(2) || 'N/A'} Ω</div>
              </div>
              <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="text-xs text-gray-500">Costo Estimado</div>
                <div className="text-lg font-bold text-green-600">
                  ${(optimizationResult.bestSolution?.cost || 0).toLocaleString()} MXN
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={applyDesign}
                disabled={!optimizationResult.bestSolution}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  !optimizationResult.bestSolution
                    ? 'bg-gray-400 cursor-not-allowed'
                    : optimizationResult.noFeasibleSolution
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Aplicar este diseño
              </button>
              <button
                onClick={() => setOptimizationResult(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
              >
                Descartar
              </button>
            </div>
          </div>
          
          {/* Estado de cumplimiento */}
          <div className={`p-3 rounded-lg ${optimizationResult.bestSolution?.constraints?.feasible ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            <div className="flex items-center gap-2">
              {optimizationResult.bestSolution?.constraints?.feasible ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <XCircle size={20} className="text-red-600" />
              )}
              <span className="font-semibold">
                {optimizationResult.bestSolution?.constraints?.feasible 
                  ? '✓ El diseño CUMPLE con IEEE 80' 
                  : '✗ El diseño NO cumple con IEEE 80'}
              </span>
            </div>
          </div>
          
          {/* Métricas de seguridad */}
          {optimizationResult.bestSolution?.constraints && (
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h4 className="font-semibold mb-2 text-sm">Verificación de Seguridad</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Tensión de Contacto:</span>
                  <span className={optimizationResult.bestSolution.constraints.touchOk ? 'text-green-600' : 'text-red-600'}>
                    {optimizationResult.bestSolution.constraints.Em?.toFixed(0)} V / 
                    {optimizationResult.bestSolution.constraints.VtouchAllow?.toFixed(0)} V
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tensión de Paso:</span>
                  <span className={optimizationResult.bestSolution.constraints.stepOk ? 'text-green-600' : 'text-red-600'}>
                    {optimizationResult.bestSolution.constraints.Es?.toFixed(0)} V / 
                    {optimizationResult.bestSolution.constraints.VstepAllow?.toFixed(0)} V
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Detalles de costo */}
          {optimizationResult.bestSolution?.costDetails && (
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h4 className="font-semibold mb-2 text-sm flex items-center gap-1">
                <DollarSign size={14} /> Desglose de Costos
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Conductor:</span>
                  <span>${optimizationResult.bestSolution.costDetails.conductorCost?.toLocaleString()} MXN</span>
                </div>
                <div className="flex justify-between">
                  <span>Varillas:</span>
                  <span>${optimizationResult.bestSolution.costDetails.rodCost?.toLocaleString()} MXN</span>
                </div>
                <div className="flex justify-between">
                  <span>Excavación:</span>
                  <span>${optimizationResult.bestSolution.costDetails.excavationCost?.toLocaleString()} MXN</span>
                </div>
                <div className="flex justify-between">
                  <span>Soldaduras:</span>
                  <span>${optimizationResult.bestSolution.costDetails.solderingCost?.toLocaleString()} MXN</span>
                </div>
                <div className="border-t pt-1 mt-1 flex justify-between font-bold">
                  <span>TOTAL:</span>
                  <span className="text-green-600">${optimizationResult.bestSolution.cost?.toLocaleString()} MXN</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Estadísticas de la optimización */}
          {optimizationResult.history && (
            <div className="text-xs text-gray-500 text-center">
              Evaluadas {optimizationResult.totalGenerations} generaciones | 
              Población: {optimizationResult.history[optimizationResult.history.length - 1]?.populationSize || 0} individuos
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroundingOptimizer;
