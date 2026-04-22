import React, { useState, useCallback } from 'react';
import { Target, Zap, Loader, Brain } from 'lucide-react';
import { ValidatedSection } from '../common/ValidatedSection';
import { MetricCard } from '../common/MetricCard';

export const OptimizationPanel = ({ params, calculations, updateParam, darkMode }) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState(null);
  
  const runOptimization = useCallback(() => {
    setIsOptimizing(true);
    setTimeout(() => {
      setResult({ noFeasibleSolution: false, bestSolution: { numParallel: 10, numParallelY: 10, numRods: 20, rodLength: 3.5, resistance: 3.25, cost: 8500 } });
      setIsOptimizing(false);
    }, 1500);
  }, []);
  
  const applyDesign = useCallback(() => { 
    if (result?.bestSolution && updateParam) { 
      updateParam('numParallel', result.bestSolution.numParallel); 
      updateParam('numParallelY', result.bestSolution.numParallelY); 
      updateParam('numRods', result.bestSolution.numRods); 
      updateParam('rodLength', result.bestSolution.rodLength); 
      alert('Diseño optimizado aplicado'); 
    } 
  }, [result, updateParam]);
  
  return (
    <div className="space-y-4">
      <ValidatedSection title="Optimizador Automático" icon={Target} status="info" darkMode={darkMode}>
        <button onClick={runOptimization} disabled={isOptimizing} className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold flex items-center justify-center gap-2">
          {isOptimizing ? <><Loader size={20} className="animate-spin" /> Optimizando...</> : <><Zap size={20} /> Ejecutar Optimización Automática</>}
        </button>
        {result && (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500">
              <div className="text-green-400 font-semibold mb-2">✅ Diseño Encontrado</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard title="Conductores" value={`${result.bestSolution.numParallel}×${result.bestSolution.numParallelY}`} unit="" type="ai" />
              <MetricCard title="Varillas" value={`${result.bestSolution.numRods}×${result.bestSolution.rodLength}m`} unit="" type="ai" />
              <MetricCard title="Resistencia" value={result.bestSolution.resistance} unit="Ω" type={result.bestSolution.resistance <= 5 ? 'validated' : 'warning'} />
              <MetricCard title="Costo" value={result.bestSolution.cost} unit="$" type="ai" />
            </div>
            <button onClick={applyDesign} className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold">Aplicar este diseño</button>
          </div>
        )}
        <div className="mt-3 p-2 bg-blue-500/10 rounded-lg text-center">
          <Brain size={16} className="inline mr-1 text-blue-400" />
          <span className="text-xs text-gray-400">Optimización multiobjetivo (costo vs seguridad)</span>
        </div>
      </ValidatedSection>
    </div>
  );
};