/**
 * Motor de Optimización Avanzada
 * Algoritmos para optimizar automáticamente el diseño de la malla
 */

import { runGroundingCalculation } from './groundingEngine';

// Configuración del algoritmo genético
const GA_CONFIG = {
  populationSize: 50,
  generations: 30,
  mutationRate: 0.1,
  crossoverRate: 0.7,
  elitismCount: 5
};

// Rangos de parámetros para optimización
const PARAM_RANGES = {
  numParallel: { min: 4, max: 20, step: 1, type: 'integer' },
  numParallelY: { min: 4, max: 20, step: 1, type: 'integer' },
  numRods: { min: 4, max: 60, step: 2, type: 'integer' },
  rodLength: { min: 2, max: 4, step: 0.5, type: 'float' },
  gridDepth: { min: 0.5, max: 1.5, step: 0.1, type: 'float' },
  currentDivisionFactor: { min: 0.12, max: 0.35, step: 0.01, type: 'float' },
  surfaceLayer: { min: 3000, max: 15000, step: 1000, type: 'integer' },
  surfaceDepth: { min: 0.1, max: 0.3, step: 0.02, type: 'float' }
};

// Generar individuo aleatorio
const generateRandomIndividual = (baseParams) => {
  const individual = { ...baseParams };
  
  for (const [param, range] of Object.entries(PARAM_RANGES)) {
    if (range.type === 'integer') {
      const steps = Math.floor((range.max - range.min) / range.step);
      const randomStep = Math.floor(Math.random() * (steps + 1));
      individual[param] = range.min + randomStep * range.step;
    } else {
      const randomValue = range.min + Math.random() * (range.max - range.min);
      individual[param] = Math.round(randomValue / range.step) * range.step;
    }
  }
  
  return individual;
};

// Calcular fitness de un individuo
const calculateFitness = (params, weights) => {
  const results = runGroundingCalculation(params);
  
  if (!results) return -Infinity;
  
  // Métricas de fitness
  let score = 0;
  
  // Cumplimiento normativo (peso más alto)
  if (results.complies) {
    score += weights.compliance || 100;
  } else {
    // Penalización por no cumplir
    score -= 50;
  }
  
  // Seguridad (margen de tensión de contacto)
  const Etouch70 = Math.max(1, results.Etouch70 || 1);
  const Em = results.Em || 0;
  const touchMargin = Etouch70 > 0 
    ? ((Etouch70 - Em) / Math.max(1, Etouch70) * 100)
    : 0;
  score += Math.min(50, Math.max(0, touchMargin)) * (weights.safety || 0.5);
  
  // Resistencia de malla
  const Rg = results.Rg || 0;
  const rgScore = Rg <= 2 ? 30 : Rg <= 5 ? 20 : 10;
  score += rgScore * (weights.resistance || 0.3);
  
  // Eficiencia (uso de materiales)
  const conductorCount = (params.numParallel || 4) * (params.numParallelY || 4);
  const rodCount = params.numRods || 4;
  const efficiencyScore = Math.max(0, 50 - (conductorCount + rodCount) / 2);
  score += efficiencyScore * (weights.efficiency || 0.2);
  
  return score;
};

// Cruce de dos individuos
const crossover = (parent1, parent2) => {
  const child = {};
  const crossoverPoint = Math.random();
  
  for (const param of Object.keys(PARAM_RANGES)) {
    if (Math.random() < crossoverPoint) {
      child[param] = parent1[param];
    } else {
      child[param] = parent2[param];
    }
  }
  
  return child;
};

// Mutación de un individuo
const mutate = (individual) => {
  const mutated = { ...individual };
  
  for (const [param, range] of Object.entries(PARAM_RANGES)) {
    if (Math.random() < GA_CONFIG.mutationRate) {
      if (range.type === 'integer') {
        const steps = Math.floor((range.max - range.min) / range.step);
        const randomStep = Math.floor(Math.random() * (steps + 1));
        mutated[param] = range.min + randomStep * range.step;
      } else {
        const randomValue = range.min + Math.random() * (range.max - range.min);
        mutated[param] = Math.round(randomValue / range.step) * range.step;
      }
    }
  }
  
  return mutated;
};

// Selección por torneo
const tournamentSelection = (population, scores, tournamentSize = 3) => {
  if (!population || population.length === 0 || !scores || scores.length === 0) {
    return null;
  }
  
  let best = null;
  let bestScore = -Infinity;
  
  for (let i = 0; i < tournamentSize; i++) {
    const idx = Math.floor(Math.random() * population.length);
    if (scores[idx] > bestScore) {
      bestScore = scores[idx];
      best = population[idx];
    }
  }
  
  return best;
};

// Algoritmo genético principal
export const optimizeGridGenetic = async (baseParams, weights = {}, onProgress) => {
  if (!baseParams) baseParams = {};
  
  const startTime = Date.now();
  let population = [];
  let bestIndividual = null;
  let bestScore = -Infinity;
  let history = [];
  
  // Inicializar población
  for (let i = 0; i < GA_CONFIG.populationSize; i++) {
    population.push(generateRandomIndividual(baseParams));
  }
  
  // Evolución por generaciones
  for (let gen = 0; gen < GA_CONFIG.generations; gen++) {
    // Calcular fitness
    const scores = population.map(ind => calculateFitness(ind, weights));
    
    // Encontrar mejor individuo
    for (let i = 0; i < population.length; i++) {
      if (scores[i] > bestScore) {
        bestScore = scores[i];
        bestIndividual = { ...population[i] };
      }
    }
    
    // Guardar historial
    history.push({
      generation: gen + 1,
      bestScore,
      bestParams: { ...bestIndividual }
    });
    
    // Reportar progreso
    if (onProgress) {
      onProgress({
        generation: gen + 1,
        totalGenerations: GA_CONFIG.generations,
        bestScore,
        bestParams: bestIndividual
      });
    }
    
    // Crear nueva generación
    const newPopulation = [];
    
    // Elitismo
    const sorted = population
      .map((ind, idx) => ({ ind, score: scores[idx] }))
      .sort((a, b) => b.score - a.score);
    
    for (let i = 0; i < GA_CONFIG.elitismCount; i++) {
      newPopulation.push({ ...sorted[i].ind });
    }
    
    // Generar descendencia
    while (newPopulation.length < GA_CONFIG.populationSize) {
      const parent1 = tournamentSelection(population, scores);
      const parent2 = tournamentSelection(population, scores);
      
      let child;
      if (Math.random() < GA_CONFIG.crossoverRate) {
        child = crossover(parent1, parent2);
      } else {
        child = { ...parent1 };
      }
      
      child = mutate(child);
      newPopulation.push(child);
    }
    
    population = newPopulation;
  }
  
  // Calcular resultados finales
  const finalResults = runGroundingCalculation(bestIndividual);
  
  return {
    success: true,
    bestParams: bestIndividual,
    bestResults: finalResults,
    bestScore,
    history,
    executionTime: Date.now() - startTime,
    generations: GA_CONFIG.generations,
    populationSize: GA_CONFIG.populationSize
  };
};

// Optimización heurística rápida
export const quickOptimize = (baseParams, strategy = 'balanced') => {
  if (!baseParams) baseParams = {};
  
  const strategies = {
    safety: {
      numParallel: 20,
      numParallelY: 20,
      numRods: 50,
      rodLength: 3.5,
      gridDepth: 0.8,
      currentDivisionFactor: 0.15,
      surfaceLayer: 12000,
      surfaceDepth: 0.25
    },
    balanced: {
      numParallel: 14,
      numParallelY: 14,
      numRods: 30,
      rodLength: 3,
      gridDepth: 0.6,
      currentDivisionFactor: 0.2,
      surfaceLayer: 10000,
      surfaceDepth: 0.2
    },
    cost: {
      numParallel: 8,
      numParallelY: 8,
      numRods: 15,
      rodLength: 2.5,
      gridDepth: 0.5,
      currentDivisionFactor: 0.25,
      surfaceLayer: 5000,
      surfaceDepth: 0.15
    }
  };
  
  const target = strategies[strategy] || strategies.balanced;
  const optimizedParams = { ...baseParams, ...target };
  const results = runGroundingCalculation(optimizedParams);
  
  const baseRg = baseParams.Rg || 0;
  const baseEm = baseParams.Em || 0;
  const baseEs = baseParams.Es || 0;
  
  return {
    success: true,
    strategy,
    params: optimizedParams,
    results,
    improvements: {
      Rg: baseRg > 0 ? ((baseRg - (results.Rg || 0)) / Math.max(1, baseRg) * 100).toFixed(1) : '0',
      Em: baseEm > 0 ? ((baseEm - (results.Em || 0)) / Math.max(1, baseEm) * 100).toFixed(1) : '0',
      Es: baseEs > 0 ? ((baseEs - (results.Es || 0)) / Math.max(1, baseEs) * 100).toFixed(1) : '0'
    }
  };
};

// Análisis de Pareto (múltiples objetivos)
export const paretoOptimize = (baseParams, iterations = 100) => {
  if (!baseParams) baseParams = {};
  
  const solutions = [];
  
  for (let i = 0; i < iterations; i++) {
    const candidate = generateRandomIndividual(baseParams);
    const results = runGroundingCalculation(candidate);
    
    if (results) {
      const Etouch70 = Math.max(1, results.Etouch70 || 1);
      const Em = results.Em || 0;
      
      solutions.push({
        params: candidate,
        results,
        objectives: {
          safety: results.touchSafe70 ? 100 - (Em / Math.max(1, Etouch70) * 100) : 0,
          cost: 100 - (candidate.numParallel * candidate.numParallelY + candidate.numRods) / 2,
          compliance: results.complies ? 100 : 0
        }
      });
    }
  }
  
  // Encontrar frente de Pareto (soluciones no dominadas)
  const paretoFront = solutions.filter(solution => {
    return !solutions.some(other => 
      other !== solution &&
      other.objectives.safety >= solution.objectives.safety &&
      other.objectives.cost >= solution.objectives.cost &&
      other.objectives.compliance >= solution.objectives.compliance &&
      (other.objectives.safety > solution.objectives.safety ||
       other.objectives.cost > solution.objectives.cost ||
       other.objectives.compliance > solution.objectives.compliance)
    );
  });
  
  return {
    success: true,
    paretoFront,
    totalSolutions: solutions.length,
    paretoCount: paretoFront.length
  };
};

export default {
  optimizeGridGenetic,
  quickOptimize,
  paretoOptimize,
  GA_CONFIG,
  PARAM_RANGES
};