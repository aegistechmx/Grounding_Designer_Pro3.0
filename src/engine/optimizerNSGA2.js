/**
 * Optimizador multiobjetivo NSGA-II para sistemas de puesta a tierra
 * Minimiza costo y resistencia, maximizando seguridad IEEE 80
 */

import { calcAdvancedGridResistance } from '../core/advancedGrid';
import { evaluateSafety } from '../core/safetyAdvanced';

// ============================================
// 1. FUNCIÓN OBJETIVO (COSTO REAL)
// ============================================

export const costFunction = ({
  totalLength,
  numRods,
  rodLength,
  costConductor = 12,
  costRod = 25,
  costRodMeter = 8,
  costExcavation = 5,
  costSoldering = 15,
  area
}) => {
  const conductorCost = costConductor * totalLength;
  const rodCost = costRod * numRods + costRodMeter * rodLength * numRods;
  const excavationCost = costExcavation * area * 0.6;
  const solderingCost = costSoldering * (numRods * 2 + Math.sqrt(totalLength) * 2);
  const totalCost = conductorCost + rodCost + excavationCost + solderingCost;
  
  return { total: totalCost, conductorCost, rodCost, excavationCost, solderingCost };
};

// ============================================
// 2. RESTRICCIONES IEEE 80
// ============================================

export const constraints = (design, params) => {
  const {
    soilResistivity = 100,
    area = 100,
    burialDepth = 0.5,
    faultCurrent = 1771,
    X_R = 0.15,
    faultDuration = 0.5,
    surfaceResistivity = 3000,
    surfaceDepth = 0.1
  } = params;
  
  const nx = design.nx || design.numParallel || 8;
  const ny = design.ny || design.numParallelY || 8;
  const gridLength = Math.sqrt(area);
  const gridWidth = Math.sqrt(area);
  const totalLength = 2 * (gridLength + gridWidth) * Math.max(nx, ny);
  const numRods = design.numRods || 10;
  const rodLength = design.rodLength || 3;
  
  const RgResult = calcAdvancedGridResistance({
    soilResistivity,
    totalLength,
    nx,
    ny,
    burialDepth,
    area,
    numRods,
    rodLength
  });
  
  const Rg = RgResult?.Rg || soilResistivity * (1/totalLength + 1/Math.sqrt(20*area));
  
  const Cs = 1 - (0.09 * (1 - soilResistivity / surfaceResistivity)) / (2 * surfaceDepth + 0.09);
  
  const safety = evaluateSafety({
    If: faultCurrent,
    X_R,
    t: faultDuration,
    Rg,
    rho: soilResistivity,
    Cs: Cs,
    bodyWeight: 70
  });
  
  const Ieff = safety?.Ieff || faultCurrent * X_R;
  const Km = 0.5;
  const Ki = 0.7;
  const Em = Ieff * Rg * Km * Ki;
  const Es = Ieff * Rg * 0.3 * Ki;
  const VtouchAllow = safety?.VtouchAllow || 921;
  const VstepAllow = safety?.VstepAllow || 3020;
  
  const touchOk = Em <= VtouchAllow;
  const stepOk = Es <= VstepAllow;
  const feasible = touchOk && stepOk;
  
  let penalty = 0;
  if (!touchOk) penalty += 1000 * (Em / VtouchAllow);
  if (!stepOk) penalty += 1000 * (Es / VstepAllow);
  
  return { feasible, Rg, Em, Es, VtouchAllow, VstepAllow, touchOk, stepOk, penalty, safety };
};

// ============================================
// 3. GENERACIÓN DE POBLACIÓN INICIAL
// ============================================

export const randomDesign = (params) => {
  const baseNx = params.nx || params.numParallel || 8;
  const baseNy = params.ny || params.numParallelY || 8;
  
  return {
    nx: Math.max(4, Math.min(20, baseNx + Math.floor(Math.random() * 6) - 3)),
    ny: Math.max(4, Math.min(20, baseNy + Math.floor(Math.random() * 6) - 3)),
    numRods: Math.max(4, Math.min(40, (params.numRods || 10) + Math.floor(Math.random() * 20) - 10)),
    rodLength: Math.max(2, Math.min(5, (params.rodLength || 3) + (Math.random() - 0.5) * 1.5))
  };
};

// ============================================
// 4. OPERADORES GENÉTICOS
// ============================================

export const mutate = (design) => ({
  nx: Math.max(4, Math.min(20, design.nx + Math.floor((Math.random() - 0.5) * 4))),
  ny: Math.max(4, Math.min(20, design.ny + Math.floor((Math.random() - 0.5) * 4))),
  numRods: Math.max(0, Math.min(50, design.numRods + Math.floor((Math.random() - 0.5) * 10))),
  rodLength: Math.max(2, Math.min(5, design.rodLength + (Math.random() - 0.5) * 0.8))
});

export const crossover = (a, b) => ({
  nx: Math.round((a.nx + b.nx) / 2),
  ny: Math.round((a.ny + b.ny) / 2),
  numRods: Math.round((a.numRods + b.numRods) / 2),
  rodLength: (a.rodLength + b.rodLength) / 2
});

// ============================================
// 5. DOMINANCIA DE PARETO (CORREGIDA)
// ============================================

export const nonDominatedSort = (population) => {
  if (!population || !Array.isArray(population) || population.length === 0) {
    console.warn('nonDominatedSort: población vacía o inválida');
    return { fronts: [[]], ranks: [] };
  }
  
  const n = population.length;
  const dominationCount = new Array(n).fill(0);
  const dominatedIndices = Array.from({ length: n }, () => []);
  const fronts = [];
  const ranks = new Array(n).fill(0);
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      
      const p1 = population[i];
      const p2 = population[j];
      if (!p1 || !p2) continue;
      
      const cost1 = p1.cost !== undefined ? p1.cost : Infinity;
      const cost2 = p2.cost !== undefined ? p2.cost : Infinity;
      const safety1 = p1.constraints?.feasible ? 1 : 0;
      const safety2 = p2.constraints?.feasible ? 1 : 0;
      
      const dominates = (cost1 <= cost2 && safety1 >= safety2) && (cost1 < cost2 || safety1 > safety2);
      
      if (dominates) {
        dominatedIndices[i].push(j);
      } else {
        const dominatedBy = (cost2 <= cost1 && safety2 >= safety1) && (cost2 < cost1 || safety2 > safety1);
        if (dominatedBy) {
          dominationCount[i]++;
        }
      }
    }
  }
  
  let currentFrontIndices = [];
  for (let i = 0; i < n; i++) {
    if (dominationCount[i] === 0) {
      currentFrontIndices.push(i);
      ranks[i] = 0;
    }
  }
  
  if (currentFrontIndices.length === 0 && n > 0) {
    for (let i = 0; i < n; i++) {
      currentFrontIndices.push(i);
      ranks[i] = 0;
    }
  }
  
  // Convertir índices a objetos
  const firstFrontObjects = currentFrontIndices.map(i => population[i]);
  fronts.push(firstFrontObjects);
  
  let frontIndex = 0;
  let currentIndices = [...currentFrontIndices];
  
  while (currentIndices.length > 0) {
    const nextIndices = [];
    for (const i of currentIndices) {
      for (const j of dominatedIndices[i]) {
        dominationCount[j]--;
        if (dominationCount[j] === 0) {
          ranks[j] = frontIndex + 1;
          nextIndices.push(j);
        }
      }
    }
    frontIndex++;
    currentIndices = nextIndices;
    if (currentIndices.length > 0) {
      const frontObjects = currentIndices.map(i => population[i]);
      fronts.push(frontObjects);
    }
  }
  
  return { fronts, ranks };
};

export const crowdingDistance = (front) => {
  if (!front || !Array.isArray(front) || front.length === 0) {
    return;
  }
  
  if (front.length > 0 && typeof front[0] === 'number') {
    console.warn('crowdingDistance: front contiene números, no objetos');
    return;
  }
  
  const objectives = ['cost', 'resistance'];
  
  for (const individual of front) {
    if (individual && typeof individual === 'object') {
      individual.crowdingDistance = 0;
    }
  }
  
  for (const obj of objectives) {
    const validFront = front.filter(ind => ind && typeof ind === 'object' && ind[obj] !== undefined);
    if (validFront.length < 2) continue;
    
    validFront.sort((a, b) => a[obj] - b[obj]);
    
    validFront[0].crowdingDistance = Infinity;
    validFront[validFront.length - 1].crowdingDistance = Infinity;
    
    const range = validFront[validFront.length - 1][obj] - validFront[0][obj];
    if (range === 0) continue;
    
    for (let i = 1; i < validFront.length - 1; i++) {
      validFront[i].crowdingDistance += (validFront[i + 1][obj] - validFront[i - 1][obj]) / range;
    }
  }
};

// ============================================
// 6. OPTIMIZACIÓN RÁPIDA (DETERMINISTA)
// ============================================

export const quickOptimize = (params) => {
  const designs = [];
  
  const configs = [
    { nx: 6, ny: 6, numRods: 8, rodLength: 3 },
    { nx: 8, ny: 8, numRods: 12, rodLength: 3 },
    { nx: 10, ny: 10, numRods: 16, rodLength: 3 },
    { nx: 12, ny: 12, numRods: 20, rodLength: 3 },
    { nx: 8, ny: 8, numRods: 16, rodLength: 3.5 },
    { nx: 10, ny: 8, numRods: 14, rodLength: 3 }
  ];
  
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
  feasible.sort((a, b) => a.cost - b.cost);
  
  if (feasible.length === 0) {
    const allSorted = [...designs].sort((a, b) => 
      (a.cost + (a.constraints.penalty || 0)) - (b.cost + (b.constraints.penalty || 0))
    );
    return {
      bestSolution: allSorted[0] || null,
      alternatives: allSorted.slice(1, 4),
      allDesigns: designs,
      noFeasibleSolution: true
    };
  }
  
  return {
    bestSolution: feasible[0] || null,
    alternatives: feasible.slice(1, 4),
    allDesigns: designs,
    noFeasibleSolution: false
  };
};

// ============================================
// 7. OPTIMIZADOR PRINCIPAL NSGA-II
// ============================================

export const optimizeGrounding = (params, options = {}) => {
  const { populationSize = 50, generations = 30, mutationRate = 0.1, crossoverRate = 0.8 } = options;
  
  if (!params) {
    console.error('optimizeGrounding: params es requerido');
    return { bestSolution: null, feasibleSolutions: [], message: 'Parámetros inválidos' };
  }
  
  let population = [];
  for (let i = 0; i < populationSize; i++) {
    population.push(randomDesign(params));
  }
  
  let bestSolution = null;
  let bestCost = Infinity;
  let history = [];
  
  for (let gen = 0; gen < generations; gen++) {
    const evaluated = population.map(design => {
      const constraintsResult = constraints(design, params);
      const totalLength = 2 * (Math.sqrt(params.area) + Math.sqrt(params.area)) * Math.max(design.nx, design.ny);
      const cost = costFunction({ totalLength, numRods: design.numRods, rodLength: design.rodLength, area: params.area });
      
      let costValue = cost.total;
      let resistanceValue = constraintsResult.Rg;
      
      if (!constraintsResult.feasible) {
        costValue += constraintsResult.penalty;
        resistanceValue += constraintsResult.penalty / 100;
      }
      
      return {
        ...design,
        cost: costValue,
        resistance: resistanceValue,
        safetyScore: constraintsResult.feasible ? 100 - (constraintsResult.penalty / 100) : 0,
        constraints: constraintsResult,
        costDetails: cost
      };
    });
    
    const { fronts } = nonDominatedSort(evaluated);
    
    // Calcular crowding distance solo para frentes válidos
    for (const front of fronts) {
      if (front && front.length > 0 && typeof front[0] === 'object') {
        crowdingDistance(front);
      }
    }
    
    const newPopulation = [];
    for (const front of fronts) {
      if (!front || front.length === 0) continue;
      front.sort((a, b) => (b.crowdingDistance || 0) - (a.crowdingDistance || 0));
      for (const individual of front) {
        if (newPopulation.length < populationSize) {
          newPopulation.push(individual);
        } else {
          break;
        }
      }
      if (newPopulation.length >= populationSize) break;
    }
    
    const bestInGen = evaluated.reduce((best, curr) => 
      curr.constraints.feasible && curr.cost < best.cost ? curr : best, 
      { cost: Infinity }
    );
    
    if (bestInGen.cost < bestCost && bestInGen.constraints?.feasible) {
      bestCost = bestInGen.cost;
      bestSolution = bestInGen;
    }
    
    history.push({ generation: gen + 1, bestCost, bestResistance: bestSolution?.resistance });
    
    if (gen < generations - 1 && newPopulation.length > 0) {
      const nextPopulation = [];
      const eliteCount = Math.floor(populationSize * 0.1);
      for (let i = 0; i < eliteCount && i < newPopulation.length; i++) {
        nextPopulation.push(newPopulation[i]);
      }
      
      while (nextPopulation.length < populationSize) {
        const parent1 = newPopulation[Math.floor(Math.random() * newPopulation.length)];
        const parent2 = newPopulation[Math.floor(Math.random() * newPopulation.length)];
        let child = Math.random() < crossoverRate ? crossover(parent1, parent2) : { ...parent1 };
        if (Math.random() < mutationRate) child = mutate(child);
        nextPopulation.push(child);
      }
      
      if (nextPopulation.length === 0) {
        nextPopulation.push(...population);
      }
      population = nextPopulation;
    }
  }
  
  const feasibleSolutions = population.filter(ind => ind.constraints?.feasible);
  if (feasibleSolutions.length > 0) {
    bestSolution = feasibleSolutions.reduce((best, curr) => curr.cost < best.cost ? curr : best, feasibleSolutions[0]);
  } else if (population.length > 0) {
    bestSolution = population.reduce((best, curr) => curr.cost < best.cost ? curr : best, population[0]);
  }
  
  return {
    bestSolution,
    feasibleSolutions,
    allSolutions: population,
    noFeasibleSolution: feasibleSolutions.length === 0,
    history,
    totalGenerations: generations
  };
};

export default {
  costFunction,
  constraints,
  randomDesign,
  mutate,
  crossover,
  nonDominatedSort,
  crowdingDistance,
  optimizeGrounding,
  quickOptimize
};