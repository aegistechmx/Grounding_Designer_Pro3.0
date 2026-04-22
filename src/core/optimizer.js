/**
 * Optimizador Automático de Malla - IEEE 80
 * Busca la mejor configuración que cumpla con los requisitos de seguridad
 */

import { runGroundingCalculation } from './groundingEngine';

/**
 * Opciones de optimización
 */
const DEFAULT_OPTIONS = {
  spacings: [3, 4, 5, 6, 8, 10],
  rods: [4, 8, 12, 16, 20, 24],
  maxIterations: 100,
  targetRg: 5, // Resistencia objetivo (Ω)
  weightTouch: 2, // Peso para seguridad de contacto
  weightStep: 2, // Peso para seguridad de paso
  weightResistance: 1, // Peso para resistencia baja
  weightCost: 0.5 // Peso para costo (conductores y varillas)
};

/**
 * Calcula puntaje de diseño
 * Mayor puntaje = mejor diseño
 * 
 * @param {object} results - Resultados del cálculo
 * @param {object} options - Opciones de optimización
 * @returns {number} Puntaje del diseño
 */
const calculateScore = (results, options) => {
  const { targetRg, weightTouch, weightStep, weightResistance, weightCost } = options;
  
  let score = 0;
  
  // Seguridad de contacto (prioridad alta)
  if (results.touchSafe70) {
    score += weightTouch * 10;
  } else {
    score -= weightTouch * 5;
  }
  
  // Seguridad de paso (prioridad alta)
  if (results.stepSafe70) {
    score += weightStep * 10;
  } else {
    score -= weightStep * 5;
  }
  
  // Resistencia de malla (prioridad media)
  const rgPenalty = Math.max(0, results.Rg - targetRg) * weightResistance;
  score -= rgPenalty;
  
  // Bonus por resistencia muy baja
  if (results.Rg < targetRg) {
    score += (targetRg - results.Rg) * weightResistance;
  }
  
  // Costo (prioridad baja - menos conductores = mejor)
  const totalConductors = (results.numParallel || 1) * (results.numParallelY || 1);
  const totalRods = results.numRods || 0;
  const costPenalty = (totalConductors + totalRods) * 0.1 * weightCost;
  score -= costPenalty;
  
  return score;
};

/**
 * Optimiza configuración de malla
 * Busca la mejor combinación de espaciamiento y número de varillas
 * 
 * @param {object} baseParams - Parámetros base del diseño
 * @param {object} userOptions - Opciones personalizadas de optimización
 * @returns {object} Mejor diseño encontrado
 */
export const optimizeGrid = (baseParams, userOptions = {}) => {
  const options = { ...DEFAULT_OPTIONS, ...userOptions };
  const results = [];
  
  const { spacings, rods, maxIterations } = options;
  
  let iterations = 0;
  
  // Búsqueda exhaustiva de combinaciones
  for (const spacing of spacings) {
    for (const numRods of rods) {
      iterations++;
      
      if (iterations > maxIterations) {
        break;
      }
      
      // Calcular número de conductores basado en espaciamiento
      const numParallel = Math.max(2, Math.floor((baseParams.gridLength || 30) / spacing));
      const numParallelY = Math.max(2, Math.floor((baseParams.gridWidth || 30) / spacing));
      
      // Crear parámetros para esta combinación
      const params = {
        ...baseParams,
        numParallel,
        numParallelY,
        numRods
      };
      
      try {
        const res = runGroundingCalculation(params);
        
        if (!res) continue;
        
        const score = calculateScore(res, options);
        
        results.push({
          params,
          results: res,
          score,
          metadata: {
            spacing,
            numRods,
            totalConductors: numParallel * numParallelY,
            iteration: iterations
          }
        });
      } catch (error) {
        // Ignorar errores en cálculos individuales
        console.warn(`Error en iteración ${iterations}:`, error.message);
      }
    }
    
    if (iterations > maxIterations) {
      break;
    }
  }
  
  // Ordenar por puntaje (mayor a menor)
  results.sort((a, b) => b.score - a.score);
  
  // Retornar mejor diseño
  if (results.length === 0) {
    return {
      success: false,
      message: 'No se encontraron configuraciones válidas',
      bestDesign: null,
      allDesigns: []
    };
  }
  
  const bestDesign = results[0];
  
  return {
    success: true,
    message: `Se evaluaron ${results.length} configuraciones`,
    bestDesign: {
      params: bestDesign.params,
      results: bestDesign.results,
      score: bestDesign.score,
      metadata: bestDesign.metadata
    },
    allDesigns: results.slice(0, 10), // Top 10 diseños
    totalIterations: iterations
  };
};

/**
 * Optimización guiada (búsqueda local)
 * Comienza desde un diseño base y mejora iterativamente
 * 
 * @param {object} baseParams - Parámetros base del diseño
 * @param {object} userOptions - Opciones personalizadas
 * @returns {object} Mejor diseño encontrado
 */
export const optimizeGridGuided = (baseParams, userOptions = {}) => {
  const options = { ...DEFAULT_OPTIONS, ...userOptions };
  
  let currentParams = { ...baseParams };
  let bestScore = -Infinity;
  let bestDesign = null;
  let iterations = 0;
  const maxIterations = options.maxIterations || 50;
  
  while (iterations < maxIterations) {
    iterations++;
    
    try {
      const res = runGroundingCalculation(currentParams);
      
      if (!res) continue;
      
      const score = calculateScore(res, options);
      
      if (score > bestScore) {
        bestScore = score;
        bestDesign = {
          params: { ...currentParams },
          results: res,
          score,
          iteration: iterations
        };
      }
      
      // Generar vecinos (variaciones pequeñas)
      const neighbors = generateNeighbors(currentParams, options);
      
      // Encontrar mejor vecino
      let bestNeighbor = null;
      let bestNeighborScore = -Infinity;
      
      for (const neighbor of neighbors) {
        try {
          const neighborRes = runGroundingCalculation(neighbor);
          
          if (!neighborRes) continue;
          
          const neighborScore = calculateScore(neighborRes, options);
          
          if (neighborScore > bestNeighborScore) {
            bestNeighborScore = neighborScore;
            bestNeighbor = neighbor;
          }
        } catch (error) {
          // Ignorar errores
        }
      }
      
      // Mover al mejor vecino si mejora
      if (bestNeighbor && bestNeighborScore > score) {
        currentParams = bestNeighbor;
      } else {
        // Si no mejora, terminar búsqueda local
        break;
      }
    } catch (error) {
      console.warn(`Error en iteración ${iterations}:`, error.message);
      break;
    }
  }
  
  if (!bestDesign) {
    return {
      success: false,
      message: 'No se encontró diseño válido',
      bestDesign: null
    };
  }
  
  return {
    success: true,
    message: `Optimización completada en ${iterations} iteraciones`,
    bestDesign,
    totalIterations: iterations
  };
};

/**
 * Genera vecinos (variaciones) de un diseño
 * 
 * @param {object} params - Parámetros actuales
 * @param {object} options - Opciones de optimización
 * @returns {array} Array de parámetros vecinos
 */
const generateNeighbors = (params, options) => {
  const neighbors = [];
  const { spacings } = options;
  
  // Variar espaciamiento
  const currentSpacing = (params.gridLength || 30) / (params.numParallel || 1);
  const spacingIndex = spacings.indexOf(currentSpacing);
  
  if (spacingIndex > 0) {
    const newSpacing = spacings[spacingIndex - 1];
    neighbors.push({
      ...params,
      numParallel: Math.max(2, Math.floor((params.gridLength || 30) / newSpacing)),
      numParallelY: Math.max(2, Math.floor((params.gridWidth || 30) / newSpacing))
    });
  }
  
  if (spacingIndex < spacings.length - 1) {
    const newSpacing = spacings[spacingIndex + 1];
    neighbors.push({
      ...params,
      numParallel: Math.max(2, Math.floor((params.gridLength || 30) / newSpacing)),
      numParallelY: Math.max(2, Math.floor((params.gridWidth || 30) / newSpacing))
    });
  }
  
  // Variar número de varillas
  if (params.numRods) {
    neighbors.push({
      ...params,
      numRods: Math.max(0, params.numRods - 4)
    });
    
    neighbors.push({
      ...params,
      numRods: params.numRods + 4
    });
  }
  
  return neighbors;
};

/**
 * Compara múltiples diseños
 * 
 * @param {array} designs - Array de diseños a comparar
 * @returns {object} Comparación detallada
 */
export const compareDesigns = (designs) => {
  if (!designs || designs.length === 0) {
    return { error: 'No hay diseños para comparar' };
  }
  
  const comparison = {
    designs: designs.map((d, i) => ({
      index: i,
      params: d.params,
      results: d.results,
      score: d.score
    })),
    rankings: {
      lowestRg: null,
      safestTouch: null,
      safestStep: null,
      lowestCost: null,
      highestScore: null
    }
  };
  
  // Encontrar mejores en cada categoría
  designs.forEach((d, i) => {
    // Menor resistencia
    if (!comparison.rankings.lowestRg || d.results.Rg < comparison.rankings.lowestRg.results.Rg) {
      comparison.rankings.lowestRg = { index: i, ...d };
    }
    
    // Más seguro en contacto
    if (!comparison.rankings.safestTouch || d.results.touchSafe70 > comparison.rankings.safestTouch.results.touchSafe70) {
      comparison.rankings.safestTouch = { index: i, ...d };
    }
    
    // Más seguro en paso
    if (!comparison.rankings.safestStep || d.results.stepSafe70 > comparison.rankings.safestStep.results.stepSafe70) {
      comparison.rankings.safestStep = { index: i, ...d };
    }
    
    // Menor costo
    const cost = (d.params.numParallel * d.params.numParallelY) + d.params.numRods;
    if (!comparison.rankings.lowestCost || cost < comparison.rankings.lowestCost.cost) {
      comparison.rankings.lowestCost = { index: i, ...d, cost };
    }
    
    // Mayor puntaje
    if (!comparison.rankings.highestScore || d.score > comparison.rankings.highestScore.score) {
      comparison.rankings.highestScore = { index: i, ...d };
    }
  });
  
  return comparison;
};
