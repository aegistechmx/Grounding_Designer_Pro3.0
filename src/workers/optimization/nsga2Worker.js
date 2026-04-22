// src/workers/optimization/nsga2Worker.js
// Worker para optimización NSGA-II (no bloquea UI)

/* eslint-disable no-restricted-globals */

self.addEventListener('message', (e) => {
  const { type, data, id } = e.data;
  
  switch (type) {
    case 'RUN_OPTIMIZATION':
      runOptimization(data, id);
      break;
    case 'EVALUATE_POPULATION':
      evaluatePopulation(data, id);
      break;
    default:
      self.postMessage({ type: 'ERROR', error: `Unknown task: ${type}`, id });
  }
});

/**
 * Ejecuta optimización NSGA-II completa
 */
function runOptimization(data, id) {
  const {
    params,
    populationSize = 100,
    generations = 50,
    crossoverProb = 0.9,
    mutationProb = 0.1
  } = data;
  
  try {
    const startTime = performance.now();
    
    // Inicializar población
    let population = initializePopulation(params, populationSize);
    
    let bestSolution = null;
    let bestFitness = Infinity;
    
    for (let gen = 0; gen < generations; gen++) {
      // Evaluar población
      const evaluated = evaluatePopulationBatch(population, params);
      
      // Ordenamiento no dominado
      const { fronts, ranks } = nonDominatedSort(evaluated);
      
      // Calcular crowding distance
      for (const front of fronts) {
        crowdingDistance(front);
      }
      
      // Selección
      const newPopulation = selection(evaluated, populationSize);
      
      // Cruzamiento y mutación
      const offspring = generateOffspring(newPopulation, crossoverProb, mutationProb);
      
      // Combinar y truncar
      population = truncate([...newPopulation, ...offspring], populationSize);
      
      // Actualizar mejor solución
      const currentBest = population.find(ind => ind.cost < bestFitness);
      if (currentBest && currentBest.cost < bestFitness) {
        bestFitness = currentBest.cost;
        bestSolution = currentBest;
      }
      
      // Reportar progreso
      self.postMessage({
        type: 'OPTIMIZATION_PROGRESS',
        progress: gen / generations,
        generation: gen,
        bestCost: bestFitness,
        id
      });
    }
    
    const endTime = performance.now();
    
    self.postMessage({
      type: 'OPTIMIZATION_COMPLETE',
      results: {
        bestSolution,
        population,
        generations,
        executionTime: endTime - startTime
      },
      id
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message,
      id
    });
  }
}

/**
 * Inicializa población aleatoria
 */
function initializePopulation(params, size) {
  const population = [];
  
  for (let i = 0; i < size; i++) {
    population.push({
      nx: randomInt(4, 20),
      ny: randomInt(4, 20),
      numRods: randomInt(4, 40),
      rodLength: randomFloat(2, 5),
      cost: Infinity,
      safetyScore: 0
    });
  }
  
  return population;
}

/**
 * Evalúa lote de población
 */
function evaluatePopulationBatch(population, params) {
  return population.map(individual => evaluateIndividual(individual, params));
}

/**
 * Evalúa un individuo individual
 */
function evaluateIndividual(individual, params) {
  const { soilResistivity, area, faultCurrent, divisionFactor, faultDuration } = params;
  
  const gridLength = Math.sqrt(area);
  const gridWidth = Math.sqrt(area);
  const totalConductorLength = 2 * (gridLength + gridWidth) * Math.max(individual.nx, individual.ny);
  const totalRodLength = individual.numRods * individual.rodLength;
  const LT = totalConductorLength + totalRodLength;
  
  // Resistencia
  const Rg = soilResistivity * (1/LT + 1/Math.sqrt(20 * area)) * 
             (1 + 1/(1 + 0.5 * Math.sqrt(20 / area)));
  
  // Costo
  const cost = 12 * totalConductorLength + 25 * individual.numRods + 8 * individual.rodLength * individual.numRods;
  
  // Seguridad
  const Ig = faultCurrent * divisionFactor;
  const GPR = Ig * Rg;
  const Em = GPR * 0.18;
  const Etouch70 = 921; // Valor típico
  const safe = Em <= Etouch70;
  
  return {
    ...individual,
    Rg,
    cost,
    safetyScore: safe ? 100 : 0,
    complies: safe
  };
}

/**
 * Ordenamiento no dominado
 */
function nonDominatedSort(population) {
  const n = population.length;
  const dominationCount = new Array(n).fill(0);
  const dominatedIndices = Array.from({ length: n }, () => []);
  const fronts = [];
  const ranks = new Array(n).fill(0);
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      
      const cost1 = population[i].cost;
      const cost2 = population[j].cost;
      const safe1 = population[i].complies ? 1 : 0;
      const safe2 = population[j].complies ? 1 : 0;
      
      if (cost1 <= cost2 && safe1 >= safe2 && (cost1 < cost2 || safe1 > safe2)) {
        dominatedIndices[i].push(j);
      } else if (cost2 <= cost1 && safe2 >= safe1 && (cost2 < cost1 || safe2 > safe1)) {
        dominationCount[i]++;
      }
    }
  }
  
  const firstFront = [];
  for (let i = 0; i < n; i++) {
    if (dominationCount[i] === 0) {
      firstFront.push(population[i]);
      ranks[i] = 0;
    }
  }
  fronts.push(firstFront);
  
  let frontIndex = 0;
  let currentFront = firstFront.map(ind => population.indexOf(ind));
  
  while (currentFront.length > 0) {
    const nextFront = [];
    for (const i of currentFront) {
      for (const j of dominatedIndices[i]) {
        dominationCount[j]--;
        if (dominationCount[j] === 0) {
          nextFront.push(population[j]);
          ranks[j] = frontIndex + 1;
        }
      }
    }
    frontIndex++;
    if (nextFront.length > 0) fronts.push(nextFront);
    currentFront = nextFront.map(ind => population.indexOf(ind));
  }
  
  return { fronts, ranks };
}

/**
 * Calcula crowding distance
 */
function crowdingDistance(front) {
  if (front.length < 3) return;
  
  for (const ind of front) {
    ind.crowdingDistance = 0;
  }
  
  front.sort((a, b) => a.cost - b.cost);
  front[0].crowdingDistance = Infinity;
  front[front.length - 1].crowdingDistance = Infinity;
  
  const range = front[front.length - 1].cost - front[0].cost;
  if (range === 0) return;
  
  for (let i = 1; i < front.length - 1; i++) {
    front[i].crowdingDistance += (front[i + 1].cost - front[i - 1].cost) / range;
  }
}

/**
 * Selección por torneo
 */
function selection(population, size) {
  const selected = [];
  
  while (selected.length < size) {
    const a = population[Math.floor(Math.random() * population.length)];
    const b = population[Math.floor(Math.random() * population.length)];
    
    if (a.crowdingDistance > b.crowdingDistance) {
      selected.push({ ...a });
    } else {
      selected.push({ ...b });
    }
  }
  
  return selected;
}

/**
 * Genera descendencia
 */
function generateOffspring(population, crossoverProb, mutationProb) {
  const offspring = [];
  
  for (let i = 0; i < population.length; i += 2) {
    let child1 = { ...population[i] };
    let child2 = population[i + 1] ? { ...population[i + 1] } : { ...population[i] };
    
    if (Math.random() < crossoverProb && population[i + 1]) {
      const temp = { ...child1 };
      child1 = { ...child2 };
      child2 = { ...temp };
    }
    
    if (Math.random() < mutationProb) {
      child1 = mutate(child1);
      child2 = mutate(child2);
    }
    
    offspring.push(child1, child2);
  }
  
  return offspring;
}

/**
 * Mutación
 */
function mutate(individual) {
  return {
    ...individual,
    nx: Math.max(4, Math.min(20, individual.nx + Math.floor((Math.random() - 0.5) * 4))),
    ny: Math.max(4, Math.min(20, individual.ny + Math.floor((Math.random() - 0.5) * 4))),
    numRods: Math.max(4, Math.min(40, individual.numRods + Math.floor((Math.random() - 0.5) * 10))),
    rodLength: Math.max(2, Math.min(5, individual.rodLength + (Math.random() - 0.5) * 0.8))
  };
}

/**
 * Trunca población al tamaño deseado
 */
function truncate(population, size) {
  population.sort((a, b) => a.cost - b.cost);
  return population.slice(0, size);
}

/**
 * Evalúa población (handler de mensaje)
 */
function evaluatePopulation(data, id) {
  try {
    const { population, params } = data;
    const evaluated = evaluatePopulationBatch(population, params);
    self.postMessage({ type: 'POPULATION_EVALUATED', results: { evaluated }, id });
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message, id });
  }
}

// Utilidades
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

export default {};
