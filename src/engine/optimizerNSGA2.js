/**
 * Optimizador multiobjetivo NSGA-II para sistemas de puesta a tierra
 * Minimiza costo y resistencia, maximizando seguridad IEEE 80
 */

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
// 2. RESTRICCIONES IEEE 80 (VERSIÓN CORREGIDA)
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
  
  // Obtener valores del diseño
  const nx = design.nx || design.numParallel || 8;
  const ny = design.ny || design.numParallelY || 8;
  const numRods = design.numRods || 16;
  const rodLength = design.rodLength || 3;
  
  // Calcular geometría
  const gridLength = Math.sqrt(area);
  const gridWidth = Math.sqrt(area);
  
  // Longitud total de conductores (fórmula IEEE 80)
  const conductorLengthX = gridLength * (ny + 1);
  const conductorLengthY = gridWidth * (nx + 1);
  const totalConductorLength = conductorLengthX + conductorLengthY;
  
  // Longitud total de varillas
  const totalRodLength = numRods * rodLength;
  const LT = totalConductorLength + totalRodLength;
  
  // FÓRMULA CORRECTA DE RESISTENCIA (IEEE 80)
  const Rg = soilResistivity * (1/LT + 1/Math.sqrt(20 * area)) * 
             (1 + 1/(1 + burialDepth * Math.sqrt(20 / area)));
  
  // Corriente de malla
  const Ig = faultCurrent * X_R;
  const GPR = Ig * Rg;
  
  // Factor de capa superficial (Cs)
  const Cs = 1 - (0.09 * (1 - soilResistivity / surfaceResistivity)) / 
             (2 * surfaceDepth + 0.09);
  
  // Tensiones tolerables según IEEE 80 (70 kg)
  const ts = faultDuration;
  const Etouch70 = (1000 + 1.5 * Cs * surfaceResistivity) * (0.157 / Math.sqrt(ts));
  const Estep70 = (1000 + 6 * Cs * surfaceResistivity) * (0.157 / Math.sqrt(ts));
  
  // Factor de malla Km (simplificado)
  const D = Math.sqrt(area);
  const d = 0.01024; // diámetro conductor 2/0 AWG
  const h = burialDepth;
  const Km = (1 / (2 * Math.PI)) * (
    Math.log((D * D) / (16 * h * d)) + 
    ((D + 2 * h) * (D + 2 * h)) / (16 * h * d) -
    (h / (4 * d)) * Math.log((4 * Math.PI * (nx + ny)) / (Math.PI * nx * ny))
  );
  
  const Ki = 0.644 + 0.148 * Math.max(nx, ny);
  const Em = (soilResistivity * Ig * Km * Ki) / LT;
  const Es = (soilResistivity * Ig * 0.3 * Ki) / LT;
  
  // Verificaciones
  const touchOk = Em <= Etouch70;
  const stepOk = Es <= Estep70;
  const feasible = touchOk && stepOk;
  
  // Penalización
  let penalty = 0;
  if (!touchOk) penalty += 1000 * (Em / Etouch70);
  if (!stepOk) penalty += 1000 * (Es / Estep70);
  
  return {
    feasible,
    Rg,
    Em,
    Es,
    Etouch70,
    Estep70,
    touchOk,
    stepOk,
    penalty,
    GPR,
    Ig
  };
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
  numRods: Math.max(4, Math.min(40, design.numRods + Math.floor((Math.random() - 0.5) * 10))),
  rodLength: Math.max(2, Math.min(5, design.rodLength + (Math.random() - 0.5) * 0.8))
});

export const crossover = (a, b) => ({
  nx: Math.round((a.nx + b.nx) / 2),
  ny: Math.round((a.ny + b.ny) / 2),
  numRods: Math.round((a.numRods + b.numRods) / 2),
  rodLength: (a.rodLength + b.rodLength) / 2
});

// ============================================
// 5. DOMINANCIA DE PARETO
// ============================================

export const nonDominatedSort = (population) => {
  if (!population || !Array.isArray(population) || population.length === 0) {
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
      const feasible1 = p1.constraints?.feasible ? 1 : 0;
      const feasible2 = p2.constraints?.feasible ? 1 : 0;
      
      const dominates = (cost1 <= cost2 && feasible1 >= feasible2) && (cost1 < cost2 || feasible1 > feasible2);
      
      if (dominates) {
        dominatedIndices[i].push(j);
      } else {
        const dominatedBy = (cost2 <= cost1 && feasible2 >= feasible1) && (cost2 < cost1 || feasible2 > feasible1);
        if (dominatedBy) dominationCount[i]++;
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
    for (let i = 0; i < n; i++) currentFrontIndices.push(i);
  }
  
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
      fronts.push(currentIndices.map(i => population[i]));
    }
  }
  
  return { fronts, ranks };
};

export const crowdingDistance = (front) => {
  if (!front || !Array.isArray(front) || front.length === 0) return;
  
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
// 6. OPTIMIZACIÓN RÁPIDA (CORREGIDA)
// ============================================

export const quickOptimize = (params) => {
  const designs = [];
  
  // Configuraciones a probar
  const configs = [
    { nx: 6, ny: 6, numRods: 12, rodLength: 3 },
    { nx: 8, ny: 8, numRods: 16, rodLength: 3 },
    { nx: 10, ny: 10, numRods: 20, rodLength: 3 },
    { nx: 12, ny: 12, numRods: 24, rodLength: 3 },
    { nx: 8, ny: 8, numRods: 20, rodLength: 3.5 },
    { nx: 10, ny: 10, numRods: 24, rodLength: 3.5 },
    { nx: 12, ny: 8, numRods: 18, rodLength: 3 },
    { nx: 14, ny: 10, numRods: 22, rodLength: 3 },
    { nx: 10, ny: 8, numRods: 16, rodLength: 3 },
    { nx: 8, ny: 6, numRods: 14, rodLength: 3 }
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
  
  // Filtrar soluciones factibles
  const feasible = designs.filter(d => d.constraints.feasible);
  feasible.sort((a, b) => a.cost - b.cost);
  
  if (feasible.length === 0) {
    // Ordenar por resistencia (menor es mejor)
    const sortedByResistance = [...designs].sort((a, b) => a.resistance - b.resistance);
    return {
      bestSolution: sortedByResistance[0] || null,
      alternatives: sortedByResistance.slice(1, 4),
      allDesigns: designs,
      noFeasibleSolution: true
    };
  }
  
  return {
    bestSolution: feasible[0],
    alternatives: feasible.slice(1, 4),
    allDesigns: designs,
    noFeasibleSolution: false
  };
};

// ============================================
// 7. OPTIMIZADOR PRINCIPAL
// ============================================

export const optimizeGrounding = (params, options = {}) => {
  const { populationSize = 50, generations = 30, mutationRate = 0.1, crossoverRate = 0.8 } = options;
  
  if (!params) {
    return { bestSolution: null, feasibleSolutions: [], message: 'Parámetros inválidos' };
  }
  
  let population = [];
  for (let i = 0; i < populationSize; i++) {
    population.push(randomDesign(params));
  }
  
  let bestSolution = null;
  
  for (let gen = 0; gen < generations; gen++) {
    const evaluated = population.map(design => {
      const constraintsResult = constraints(design, params);
      const totalLength = 2 * (Math.sqrt(params.area) + Math.sqrt(params.area)) * Math.max(design.nx, design.ny);
      const cost = costFunction({
        totalLength,
        numRods: design.numRods,
        rodLength: design.rodLength,
        area: params.area
      });
      
      return {
        ...design,
        cost: cost.total,
        resistance: constraintsResult.Rg,
        safetyScore: constraintsResult.feasible ? 100 : 0,
        constraints: constraintsResult,
        costDetails: cost
      };
    });
    
    const { fronts } = nonDominatedSort(evaluated);
    for (const front of fronts) crowdingDistance(front);
    
    const newPopulation = [];
    for (const front of fronts) {
      front.sort((a, b) => b.crowdingDistance - a.crowdingDistance);
      for (const individual of front) {
        if (newPopulation.length < populationSize) newPopulation.push(individual);
        else break;
      }
      if (newPopulation.length >= populationSize) break;
    }
    
    const feasibleSolutions = evaluated.filter(e => e.constraints.feasible);
    if (feasibleSolutions.length > 0) {
      const bestFeasible = feasibleSolutions.reduce((best, curr) => curr.cost < best.cost ? curr : best, feasibleSolutions[0]);
      if (!bestSolution || bestFeasible.cost < bestSolution.cost) {
        bestSolution = bestFeasible;
      }
    }
    
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
      
      population = nextPopulation;
    }
  }
  
  const feasibleSolutions = population.filter(ind => ind.constraints?.feasible);
  
  return {
    bestSolution: bestSolution || (feasibleSolutions.length > 0 ? feasibleSolutions[0] : population[0]),
    feasibleSolutions,
    allSolutions: population,
    noFeasibleSolution: feasibleSolutions.length === 0,
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