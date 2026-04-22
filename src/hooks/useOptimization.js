import { useState, useCallback, useRef, useEffect } from 'react';
import { calculateIEEE80 } from '../utils/groundingMath_clean';

export const useOptimization = (initialParams) => {
  const [params, setParams] = useState(initialParams);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  
  const timeoutRefs = useRef([]);

  const optimizeForCost = useCallback(async (onProgress) => {
    setIsOptimizing(true);
    
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        let bestParams = { ...params };
        let bestCost = Infinity;
        let bestResults = null;
        
        const configs = [
          { numParallel: 8, numRods: 16, name: 'Económica' },
          { numParallel: 10, numRods: 20, name: 'Estándar' },
          { numParallel: 12, numRods: 25, name: 'Mejorada' },
          { numParallel: 15, numRods: 30, name: 'Premium' }
        ];
        
        for (const config of configs) {
          const testParams = { ...params, numParallel: config.numParallel, numRods: config.numRods };
          const results = calculateIEEE80(testParams);
          const conductorCost = testParams.numParallel * 2 * (testParams.gridLength + testParams.gridWidth) * 2.5;
          const rodCost = testParams.numRods * 25;
          const totalCost = conductorCost + rodCost;
          
          if (results.complies && totalCost < bestCost) {
            bestCost = totalCost;
            bestParams = testParams;
            bestResults = results;
          }
        }
        
        setParams(bestParams);
        setOptimizationResults({ type: 'cost', optimizedParams: bestParams, results: bestResults, cost: bestCost });
        setIsOptimizing(false);
        resolve(bestParams);
      }, 1000);
      
      timeoutRefs.current.push(timeoutId);
    });
  }, [params]);

  const optimizeForGPR = useCallback(async (targetGPR = 5000, onProgress) => {
    setIsOptimizing(true);
    setCurrentStep('Iniciando optimización de GPR...');
    setProgress(0);
    
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        let bestParams = { ...params };
        let bestGPR = isFinite(calculateIEEE80(params).GPR) ? calculateIEEE80(params).GPR : Infinity;
        let improvements = [];
        
        const strategies = [
          { name: 'Reducir Sf', action: (p) => ({ ...p, currentDivisionFactor: 0.20 }) },
          { name: 'Aumentar conductores', action: (p) => ({ ...p, numParallel: Math.min(20, p.numParallel + 4) }) },
          { name: 'Agregar varillas', action: (p) => ({ ...p, numRods: Math.min(80, p.numRods + 15) }) },
          { name: 'Mejorar capa superficial', action: (p) => ({ ...p, surfaceLayer: 10000, surfaceDepth: 0.2 }) }
        ];
        
        for (const strategy of strategies) {
          const index = strategies.indexOf(strategy);
          setCurrentStep(strategy.name);
          const testParams = strategy.action({ ...bestParams });
          const results = calculateIEEE80(testParams);
          
          if (results.GPR < bestGPR) {
            bestGPR = results.GPR;
            bestParams = testParams;
            improvements.push(strategy.name);
          }
          
          const progressValue = ((index + 1) / strategies.length);
          setProgress(progressValue);
          if (onProgress) onProgress(progressValue);
          
          if (bestGPR <= targetGPR) break;
        }
        
        setParams(bestParams);
        setOptimizationResults({ 
          type: 'gpr', 
          optimizedParams: bestParams, 
          originalGPR: calculateIEEE80(params).GPR, 
          newGPR: bestGPR, 
          improvements, 
          success: bestGPR <= targetGPR 
        });
        setIsOptimizing(false);
        setCurrentStep('');
        setProgress(0);
        resolve(bestParams);
      }, 1000);
      
      timeoutRefs.current.push(timeoutId);
    });
  }, [params]);

  const optimizeForSafety = useCallback(async () => {
    setIsOptimizing(true);
    
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        let bestParams = { ...params };
        let bestSafetyFactor = 0;
        
        const configs = [
          { numParallel: 15, numRods: 40, surfaceLayer: 10000, surfaceDepth: 0.2 },
          { numParallel: 18, numRods: 50, surfaceLayer: 10000, surfaceDepth: 0.2 },
          { numParallel: 20, numRods: 60, surfaceLayer: 15000, surfaceDepth: 0.25 }
        ];
        
        for (const config of configs) {
          const testParams = { ...params, ...config };
          const results = calculateIEEE80(testParams);
          
          // Evitar división por cero
          const safetyFactor = results.Em && results.Em > 0 
            ? results.Etouch70 / results.Em 
            : 0;
            
          if (safetyFactor > bestSafetyFactor && results.complies) {
            bestSafetyFactor = safetyFactor;
            bestParams = testParams;
          }
        }
        
        setParams(bestParams);
        setOptimizationResults({
          type: 'safety',
          originalParams: params,
          optimizedParams: bestParams,
          safetyFactor: bestSafetyFactor
        });
        
        setIsOptimizing(false);
        resolve(bestParams);
      }, 1000);
      
      timeoutRefs.current.push(timeoutId);
    });
  }, [params]);

  const optimizeBalanced = useCallback(async () => {
    setIsOptimizing(true);
    
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        let bestParams = { ...params };
        let bestScore = Infinity;
        
        const configs = [
          { numParallel: 10, numRods: 25, sf: 0.25, cost: 500 },
          { numParallel: 12, numRods: 30, sf: 0.22, cost: 650 },
          { numParallel: 14, numRods: 35, sf: 0.20, cost: 800 },
          { numParallel: 16, numRods: 40, sf: 0.20, cost: 1000 },
          { numParallel: 18, numRods: 45, sf: 0.18, cost: 1200 }
        ];
        
        for (const config of configs) {
          const testParams = {
            ...params,
            numParallel: config.numParallel,
            numRods: config.numRods,
            currentDivisionFactor: config.sf
          };
          
          const results = calculateIEEE80(testParams);
          
          if (results.complies) {
            const safetyScore = results.Em && results.Em > 0
              ? (results.Etouch70 / results.Em) * 100
              : 0;
            const costScore = (config.cost / 2000) * 100;
            const totalScore = (safetyScore * 0.7) + (costScore * 0.3);
            
            if (totalScore < bestScore) {
              bestScore = totalScore;
              bestParams = testParams;
            }
          }
        }
        
        setParams(bestParams);
        setOptimizationResults({
          type: 'balanced',
          originalParams: params,
          optimizedParams: bestParams,
          score: bestScore
        });
        
        setIsOptimizing(false);
        resolve(bestParams);
      }, 1000);
      
      timeoutRefs.current.push(timeoutId);
    });
  }, [params]);

  const quickOptimize = useCallback(async (strategy = 'sf') => {
    setIsOptimizing(true);
    setCurrentStep(`Optimización rápida: ${strategy}`);
    
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        const optimizedParams = { ...params };
        
        switch (strategy) {
          case 'sf':
            optimizedParams.currentDivisionFactor = Math.max(0.1, optimizedParams.currentDivisionFactor - 0.05);
            break;
          case 'conductors':
            optimizedParams.numParallel = Math.min(20, optimizedParams.numParallel + 2);
            break;
          case 'rods':
            optimizedParams.numRods = Math.min(80, optimizedParams.numRods + 5);
            break;
          case 'surface':
            optimizedParams.surfaceLayer = Math.max(1000, optimizedParams.surfaceLayer + 2000);
            optimizedParams.surfaceDepth = 0.2;
            break;
          default:
            optimizedParams.currentDivisionFactor = Math.max(0.1, optimizedParams.currentDivisionFactor - 0.05);
        }
        
        setParams(optimizedParams);
        setOptimizationResults({
          type: 'quick',
          strategy,
          originalParams: params,
          optimizedParams
        });
        
        setIsOptimizing(false);
        setCurrentStep('');
        resolve(optimizedParams);
      }, 500);
      
      timeoutRefs.current.push(timeoutId);
    });
  }, [params]);

  // Cleanup de todos los timeouts al desmontar
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeoutId => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
      timeoutRefs.current = [];
    };
  }, []);

  return {
    params,
    setParams,
    isOptimizing,
    optimizationResults,
    currentStep,
    progress,
    optimizeForCost,
    optimizeForGPR,
    optimizeForSafety,
    optimizeBalanced,
    quickOptimize
  };
};

export default useOptimization;