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
  costConductor = 12,    // $/m (cobre 4/0 AWG)
  costRod = 25,          // $/unidad (varilla 3m)
  costRodMeter = 8,      // $/m adicional por varilla
  costExcavation = 5,    // $/m³
  costSoldering = 15,    // $/conexión
  area
}) => {
  // Costo de conductor
  const conductorCost = costConductor * totalLength;
  
  // Costo de varillas
  const rodCost = costRod * numRods + costRodMeter * rodLength * numRods;
  
  // Costo de excavación (aproximado)
  const excavationCost = costExcavation * area * 0.6;
  
  // Costo de soldaduras (2 por nodo aprox)
  const solderingCost = costSoldering * (numRods * 2 + Math.sqrt(totalLength) * 2);
  
  const totalCost = conductorCost + rodCost + excavationCost + solderingCost;
  
  return {
    total: totalCost,
    conductorCost,
    rodCost,
    excavationCost,
    solderingCost
  };
};

// ============================================
// 2. RESTRICCIONES IEEE 80
// ============================================

export const constraints = (design, params) => {
  const {
    soilResistivity,
    area,
    burialDepth,
    faultCurrent,
    X_R,
    faultDuration,
    surfaceResistivity,
    surfaceDepth
  } = params;
  
  // Calcular geometría
  const nx = design.nx || 8;
  const ny = design.ny || 8;
  const gridLength = Math.sqrt(area);
  const gridWidth = Math.sqrt(area);
  const totalLength = 2 * (gridLength + gridWidth) * Math.max(nx, ny);
  
  // Resistencia de malla
  const RgResult = calcAdvancedGridResistance({
    soilResistivity,
    totalLength,
    nx,
    ny,
    burialDepth,
    area,
    numRods: design.numRods,
    rodLength: design.rodLength
  });
  
  const Rg = RgResult.Rg;
  
  // Evaluación de seguridad
  const safety = evaluateSafety({
    If: faultCurrent,
    X_R,
    t: faultDuration,
    Rg,
    rho: soilResistivity,
    Cs: 1,
    bodyWeight: 70
  });
  
  // Calcular tensiones con factores geométricos
  const Km = 0.5; // Factor de malla aproximado
  const Ki = 0.7; // Factor de irregularidad
  const Ieff = safety.Ieff;
  
  const Em = Ieff * Rg * Km * Ki;
  const Es = Ieff * Rg * 0.3 * Ki;
  
  const touchOk = Em <= safety.VtouchAllow;
  const stepOk = Es <= safety.VstepAllow;
  const feasible = touchOk && stepOk;
  
  // Penalización para NSGA-II
  let penalty = 0;
  if (!touchOk) penalty += 1000 * (Em / safety.VtouchAllow);
  if (!stepOk) penalty += 1000 * (Es / safety.VstepAllow);
  
  return {
    feasible,
    Rg,
    Em,
    Es,
    VtouchAllow: safety.VtouchAllow,
    VstepAllow: safety.VstepAllow,
    touchOk,
    stepOk,
    penalty,
    safety
  };
};

// ============================================
// 3. GENERACIÓN DE POBLACIÓN INICIAL
// ============================================

export const randomDesign = (params) => {
  const baseNx = params.nx || 8;
  const baseNy = params.ny || 8;
  
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

export const mutate = (design) => {
  return {
    nx: Math.max(4, Math.min(20, design.nx + Math.floor((Math.random() - 0.5) * 4))),
    ny: Math.max(4, Math.min(20, design.ny + Math.floor((Math.random() - 0.5) * 4))),
    numRods: Math.max(0, Math.min(50, design.numRods + Math.floor((Math.random() - 0.5) * 10))),
    rodLength: Math.max(2, Math.min(5, design.rodLength + (Math.random() - 0.5) * 0.8))
  };
};

export const crossover = (a, b) => {
  return {
    nx: Math.round((a.nx + b.nx) / 2),
    ny: Math.round((a.ny + b.ny) / 2),
    numRods: Math.round((a.numRods + b.numRods) / 2),
    rodLength: (a.rodLength + b.rodLength) / 2
  };
};

// ============================================
// 5. DOMINANCIA DE PARETO
// ============================================

export const dominates = (a, b) => {
  // a domina a b si es mejor o igual en todos los objetivos
  // y estrictamente mejor en al menos uno
  const objectivesA = [a.cost, a.resistance];
  const objectivesB = [b.cost, b.resistance];
  
  let betterInAny = false;
  for (let i = 0; i < objectivesA.length; i++) {
    if (objectivesA[i] > objectivesB[i]) return false;
    if (objectivesA[i] < objectivesB[i]) betterInAny = true;
  }
  return betterInAny;
};

// optimizerNSGA2.js - Función nonDominatedSort corregida
export function nonDominatedSort(population) {
    // Validación: asegurar que population existe y es un array
    if (!population || !Array.isArray(population) || population.length === 0) {
        console.warn('nonDominatedSort: población vacía o inválida', population);
        return { fronts: [[]], ranks: new Array(population?.length || 0).fill(0) };
    }
    
    const n = population.length;
    const dominationCount = new Array(n).fill(0);
    const dominatedIndices = Array.from({ length: n }, () => []);
    const fronts = [];
    const ranks = new Array(n).fill(0);
    
    // Calcular dominancia
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (i === j) continue;
            
            const p1 = population[i];
            const p2 = population[j];
            
            // Verificar que los objetos tienen las propiedades necesarias
            if (!p1 || !p2) continue;
            
            // Comparar objetivos (costo y seguridad)
            const cost1 = p1.cost || Infinity;
            const cost2 = p2.cost || Infinity;
            const safety1 = p1.safetyScore || -Infinity;
            const safety2 = p2.safetyScore || -Infinity;
            
            const dominates = (cost1 <= cost2 && safety1 >= safety2) && 
                             (cost1 < cost2 || safety1 > safety2);
            
            if (dominates) {
                dominatedIndices[i].push(j);
            } else {
                const dominatedBy = (cost2 <= cost1 && safety2 >= safety1) && 
                                    (cost2 < cost1 || safety2 > safety1);
                if (dominatedBy) {
                    dominationCount[i]++;
                }
            }
        }
    }
    
    // Primer frente (no dominados)
    let currentFront = [];
    for (let i = 0; i < n; i++) {
        if (dominationCount[i] === 0) {
            currentFront.push(i);
            ranks[i] = 0;
        }
    }
    
    if (currentFront.length === 0) {
        // Si no hay soluciones no dominadas, todas están en el primer frente
        for (let i = 0; i < n; i++) {
            currentFront.push(i);
            ranks[i] = 0;
        }
    }
    fronts.push(currentFront);
    
    // Construir frentes siguientes
    let frontIndex = 0;
    while (fronts[frontIndex] && fronts[frontIndex].length > 0) {
        const nextFront = [];
        for (const i of fronts[frontIndex]) {
            for (const j of dominatedIndices[i]) {
                dominationCount[j]--;
                if (dominationCount[j] === 0) {
                    ranks[j] = frontIndex + 1;
                    nextFront.push(j);
                }
            }
        }
        frontIndex++;
        if (nextFront.length > 0) {
            fronts.push(nextFront);
        }
    }
    
    return { fronts, ranks };
}

export const crowdingDistance = (front) => {
  const objectives = ['cost', 'resistance'];
  
  for (const individual of front) {
    individual.crowdingDistance = 0;
  }
  
  for (const obj of objectives) {
    front.sort((a, b) => a[obj] - b[obj]);
    
    front[0].crowdingDistance = Infinity;
    front[front.length - 1].crowdingDistance = Infinity;
    
    const range = front[front.length - 1][obj] - front[0][obj];
    if (range === 0) continue;
    
    for (let i = 1; i < front.length - 1; i++) {
      front[i].crowdingDistance += (front[i + 1][obj] - front[i - 1][obj]) / range;
    }
  }
};

// ============================================
// 6. OPTIMIZADOR PRINCIPAL NSGA-II
// ============================================

// optimizerNSGA2.js - Función optimizeGrounding corregida (inicio)
export const optimizeGrounding = (params, options = {}) => {
    const {
        populationSize = 50,
        generations = 30,
        crossoverProb = 0.9,
        mutationProb = 0.1
    } = options;
    
    // Validar parámetros de entrada
    if (!params) {
        console.error('optimizeGrounding: params es requerido');
        return { bestSolution: null, feasibleSolutions: [], message: 'Parámetros inválidos' };
    }
    
    // Inicializar población con valores válidos
    let population = [];
    for (let i = 0; i < populationSize; i++) {
        population.push(randomDesign(params));
    }
    
    // Validar que la población no esté vacía
    if (!population || population.length === 0) {
        console.error('optimizeGrounding: población inicial vacía');
        // Crear población por defecto
        population = [createDefaultDesign(params)];
    }
    
    let bestSolution = null;
    let bestCost = Infinity;
    let history = [];
    
    for (let gen = 0; gen < generations; gen++) {
        // Evaluar población
        const evaluated = population.map(design => {
            const constraintsResult = constraints(design, params);
            const totalLength = 2 * (Math.sqrt(params.area) + Math.sqrt(params.area)) * Math.max(design.nx, design.ny);
            const cost = costFunction({
                totalLength,
                numRods: design.numRods,
                rodLength: design.rodLength,
                area: params.area
            });
            
            // Fitness: minimizar costo y resistencia
            let costValue = cost.total;
            let resistanceValue = constraintsResult.Rg;
            
            // Aplicar penalización si no es factible
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
        
        // Ordenamiento no dominado (con validación)
        const { fronts, ranks } = nonDominatedSort(evaluated);
        
        // Calcular crowding distance
        for (const front of fronts) {
            crowdingDistance(front);
        }
        
        // Selección de nueva población
        const newPopulation = [];
        for (const front of fronts) {
            front.sort((a, b) => b.crowdingDistance - a.crowdingDistance);
            for (const individual of front) {
                if (newPopulation.length < populationSize) {
                    newPopulation.push(individual);
                } else {
                    break;
                }
            }
            if (newPopulation.length >= populationSize) break;
        }
        
        // Mejor solución de la generación
        const bestInGen = evaluated.reduce((best, curr) => 
            curr.constraints.feasible && curr.cost < best.cost ? curr : best, 
            { cost: Infinity }
        );
        
        if (bestInGen.cost < bestCost && bestInGen.constraints.feasible) {
            bestCost = bestInGen.cost;
            bestSolution = bestInGen;
        }
        
        history.push({
            generation: gen + 1,
            bestCost,
            bestResistance: bestSolution?.resistance,
            feasibleCount: evaluated.filter(e => e.constraints.feasible).length,
            populationSize: newPopulation.length
        });
        
        // Crear siguiente generación
        if (gen < generations - 1) {
            const nextPopulation = [];
            
            // Elitismo: mantener los mejores
            const eliteCount = Math.floor(populationSize * 0.1);
            for (let i = 0; i < eliteCount && i < newPopulation.length; i++) {
                nextPopulation.push(newPopulation[i]);
            }
            
            // Generar descendencia
            while (nextPopulation.length < populationSize) {
                let parent1 = newPopulation[Math.floor(Math.random() * newPopulation.length)];
                let parent2 = newPopulation[Math.floor(Math.random() * newPopulation.length)];
                
                let child;
                if (Math.random() < crossoverProb) {
                    child = crossover(parent1, parent2);
                } else {
                    child = { ...parent1 };
                }
                
                if (Math.random() < mutationProb) {
                    child = mutate(child);
                }
                
                nextPopulation.push(child);
            }
            
            // Asegurar que la nueva población no esté vacía
            if (nextPopulation.length === 0) {
                nextPopulation = [...population];
            }
            
            population = nextPopulation;
        }
    }
    
    // Encontrar mejor solución
    const feasibleSolutions = population.filter(ind => ind.constraints.feasible);
    if (feasibleSolutions.length > 0) {
        bestSolution = feasibleSolutions.reduce((best, curr) => 
            curr.cost < best.cost ? curr : best, feasibleSolutions[0]);
    } else if (population.length > 0) {
        bestSolution = population.reduce((best, curr) => 
            curr.cost < best.cost ? curr : best, population[0]);
    }
    
    return {
        bestSolution: bestSolution,
        feasibleSolutions: feasibleSolutions,
        allSolutions: population,
        noFeasibleSolution: feasibleSolutions.length === 0,
        history,
        totalGenerations: generations
    };
};

// ============================================
// 7. OPTIMIZACIÓN RÁPIDA (DETERMINISTA)
// ============================================

export const quickOptimize = (params) => {
  const designs = [];
  
  // Probar combinaciones comunes
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
      ...config,
      cost: cost.total,
      resistance: constraintsResult.Rg,
      constraints: constraintsResult,
      costDetails: cost
    });
  }
  
  // Filtrar factibles y ordenar por costo
  const feasible = designs.filter(d => d.constraints.feasible);
  feasible.sort((a, b) => a.cost - b.cost);
  
  // Si no hay soluciones factibles, devolver la mejor no factible (menor penalización)
  if (feasible.length === 0) {
    const allSorted = [...designs].sort((a, b) => (a.cost + a.constraints.penalty) - (b.cost + b.constraints.penalty));
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
