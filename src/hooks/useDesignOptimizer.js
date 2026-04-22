import { useState, useCallback } from 'react';
import UnifiedEngine from '../application/UnifiedEngine';

// Design variables to optimize
const designVariables = {
  spacing: 10,        // m
  numRods: 4,
  gridLength: 50,     // m
  gridWidth: 50       // m
};

// Objective function: evaluate design quality
function evaluateDesign(results, design) {
  const { safetyMargins } = results.fault;
  const { resistance } = results.grid;
  
  let score = 0;
  
  // Penalize non-compliance
  if (!safetyMargins.touchSafe) score += 1000;
  if (!safetyMargins.stepSafe) score += 1000;
  
  // Penalize low margin
  score += Math.max(0, 20 - safetyMargins.touchMargin) * 10;
  score += Math.max(0, 20 - safetyMargins.stepMargin) * 10;
  
  // Penalize cost (approximation)
  score += results.grid.totalConductorLength * 0.1;
  score += (design.grid?.numRods || 0) * 5;
  
  return score;
}

// Intelligent mutations (not pure random)
function mutateDesign(input) {
  const newInput = JSON.parse(JSON.stringify(input));
  
  // Ensure grid structure exists
  if (!newInput.grid) {
    newInput.grid = {};
  }
  
  // Adjust spacing (0.8 to 1.2 multiplier)
  newInput.grid.spacing = (newInput.grid.spacing || 10) * (0.8 + Math.random() * 0.4);
  newInput.grid.spacing = Math.max(5, Math.min(20, newInput.grid.spacing));
  
  // Adjust rods (±1)
  newInput.grid.numRods = (newInput.grid.numRods || 4) + Math.floor(Math.random() * 3 - 1);
  newInput.grid.numRods = Math.max(0, newInput.grid.numRods);
  
  return newInput;
}

// Guided mutation using risk heatmap
function guidedMutation(input, dangerZones) {
  const newInput = JSON.parse(JSON.stringify(input));
  
  // Ensure grid structure exists
  if (!newInput.grid) {
    newInput.grid = {};
  }
  
  if (dangerZones && dangerZones.length > 0) {
    // Reduce spacing if there's risk
    newInput.grid.spacing = (newInput.grid.spacing || 10) * 0.9;
    newInput.grid.spacing = Math.max(5, newInput.grid.spacing);
    
    // Add rods
    newInput.grid.numRods = (newInput.grid.numRods || 4) + 1;
  }
  
  return newInput;
}

export const useDesignOptimizer = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [bestScore, setBestScore] = useState(Infinity);
  const [bestDesign, setBestDesign] = useState(null);
  const [optimizationProgress, setOptimizationProgress] = useState([]);
  const [dangerZones, setDangerZones] = useState([]);

  const setDangerZonesData = useCallback((zones) => {
    setDangerZones(zones);
  }, []);

  const optimize = useCallback(async (initialParams, iterations = 50) => {
    setIsOptimizing(true);
    setCurrentIteration(0);
    setBestScore(Infinity);
    setBestDesign(null);
    setOptimizationProgress([]);

    // Ensure initialParams has complete structure
    let best = {
      soil: initialParams.soil || { soilResistivity: 100 },
      grid: initialParams.grid || { gridLength: 50, gridWidth: 50, numParallel: 10, numRods: 4 },
      fault: initialParams.fault || { faultCurrent: 1500, faultDuration: 0.5 }
    };
    
    // Copy grid properties from initialParams if they exist at top level
    if (initialParams.gridLength) best.grid.gridLength = initialParams.gridLength;
    if (initialParams.gridWidth) best.grid.gridWidth = initialParams.gridWidth;
    if (initialParams.numParallel) best.grid.numParallel = initialParams.numParallel;
    if (initialParams.numRods) best.grid.numRods = initialParams.numRods;
    if (initialParams.rodLength) best.grid.rodLength = initialParams.rodLength;
    
    let bestScore = Infinity;

    for (let i = 0; i < iterations; i++) {
      setCurrentIteration(i + 1);
      
      // Hybrid strategy: 50% random, 50% guided
      let candidate;
      if (Math.random() < 0.5) {
        candidate = mutateDesign(best);
      } else {
        candidate = guidedMutation(best, dangerZones);
      }

      // Calculate with candidate design using UnifiedEngine
      const engine = new UnifiedEngine(candidate);
      const results = engine.analyze({
        includeAnalytical: false,  // Use only discrete for optimization speed
        includeValidation: false,  // Skip validation during optimization
        includeSpatialData: false  // Skip spatial data for optimization
      });
      
      const score = evaluateDesign(results.primary, candidate);
      
      // Track progress
      setOptimizationProgress(prev => [...prev, {
        iteration: i + 1,
        score,
        touchMargin: results.primary.fault.safetyMargins.touchMargin,
        stepMargin: results.primary.fault.safetyMargins.stepMargin,
        gridResistance: results.primary.grid.resistance
      }]);

      // Update best if better
      if (score < bestScore) {
        best = candidate;
        bestScore = score;
        setBestDesign(candidate);
        setBestScore(score);
      }

      // Smart stopping condition
      if (
        results.primary.fault.safetyMargins.touchSafe &&
        results.primary.fault.safetyMargins.stepSafe &&
        results.primary.grid.resistance < 5
      ) {
        break;
      }

      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    setIsOptimizing(false);
    return best;
  }, [dangerZones]);

  return {
    isOptimizing,
    currentIteration,
    bestScore,
    bestDesign,
    optimizationProgress,
    optimize,
    setDangerZonesData
  };
};
