// src/workers/simulation/femWorker.js
// Worker para cálculos FEM pesados (no bloquea UI)

/* eslint-disable no-restricted-globals */

// Constantes FEM
const DEFAULT_RESOLUTION = 50;
const CONVERGENCE_TOLERANCE = 1e-6;

self.addEventListener('message', (e) => {
  const { type, data, id } = e.data;
  
  switch (type) {
    case 'RUN_FEM_SIMULATION':
      runFEMSimulation(data, id);
      break;
    case 'CALCULATE_POTENTIAL_MATRIX':
      calculatePotentialMatrix(data, id);
      break;
    case 'SOLVE_LAPLACE':
      solveLaplaceEquation(data, id);
      break;
    default:
      self.postMessage({ 
        type: 'ERROR', 
        error: `Unknown worker task: ${type}`,
        id 
      });
  }
});

/**
 * Ejecuta simulación FEM completa
 */
function runFEMSimulation(data, id) {
  const { grid, soil, fault, resolution = DEFAULT_RESOLUTION } = data;
  
  // Validar datos de entrada
  if (!grid || !soil || !fault) {
    self.postMessage({
      type: 'ERROR',
      error: 'Datos de entrada inválidos: se requieren grid, soil y fault',
      id
    });
    return;
  }
  
  try {
    const startTime = performance.now();
    
    // Crear matriz de potenciales
    const matrix = buildPotentialMatrix(grid, soil, fault, resolution);
    
    // Resolver sistema de ecuaciones
    const potentials = solveLinearSystem(matrix);
    
    // Calcular gradientes (campo eléctrico)
    const gradients = calculateGradients(potentials, resolution);
    
    // Calcular tensiones de paso y contacto
    const stepVoltages = calculateStepVoltages(potentials, resolution);
    const touchVoltages = calculateTouchVoltages(potentials, resolution);
    
    const endTime = performance.now();
    
    self.postMessage({
      type: 'FEM_SIMULATION_COMPLETE',
      results: {
        potentials,
        gradients,
        stepVoltages,
        touchVoltages,
        resolution,
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
 * Construye matriz de potenciales usando método de diferencias finitas
 */
function buildPotentialMatrix(grid, soil, fault, resolution) {
  const N = resolution * resolution;
  const matrix = {
    A: Array(N).fill().map(() => Array(N).fill(0)),
    b: new Array(N).fill(0)
  };
  
  const gridLength = Math.max(1, grid?.length || 30);
  const gridWidth = Math.max(1, grid?.width || 16);
  const dx = gridLength / resolution;
  const dy = gridWidth / resolution;
  
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const idx = i * resolution + j;
      const x = j * dx;
      const y = i * dy;
      
      // Verificar si es conductor (malla)
      const isConductor = isPointOnGrid(x, y, grid);
      
      if (isConductor) {
        // Punto conductor - potencial fijo = GPR
        matrix.A[idx][idx] = 1;
        matrix.b[idx] = fault.current * fault.divisionFactor * calculateRgAtPoint(x, y, grid, soil);
      } else {
        // Ecuación de Laplace: ∇²V = 0
        let neighbors = 0;
        
        if (i > 0) {
          matrix.A[idx][idx - resolution] = -1;
          neighbors++;
        }
        if (i < resolution - 1) {
          matrix.A[idx][idx + resolution] = -1;
          neighbors++;
        }
        if (j > 0) {
          matrix.A[idx][idx - 1] = -1;
          neighbors++;
        }
        if (j < resolution - 1) {
          matrix.A[idx][idx + 1] = -1;
          neighbors++;
        }
        
        matrix.A[idx][idx] = neighbors;
        matrix.b[idx] = 0;
      }
    }
  }
  
  return matrix;
}

/**
 * Resuelve sistema lineal usando método iterativo Gauss-Seidel
 */
function solveLinearSystem(matrix, maxIterations = 10000) {
  const N = matrix.A.length;
  const x = new Array(N).fill(0);
  let converged = false;
  let iterations = 0;
  
  while (!converged && iterations < maxIterations) {
    let maxDiff = 0;
    
    for (let i = 0; i < N; i++) {
      let sum = matrix.b[i];
      
      for (let j = 0; j < N; j++) {
        if (i !== j) {
          sum -= matrix.A[i][j] * x[j];
        }
      }
      
      const newX = Math.abs(matrix.A[i][i]) > 1e-10 ? sum / matrix.A[i][i] : 0;
      const diff = Math.abs(newX - x[i]);
      maxDiff = Math.max(maxDiff, diff);
      x[i] = newX;
    }
    
    iterations++;
    converged = maxDiff < CONVERGENCE_TOLERANCE;
    
    // Reportar progreso cada 1000 iteraciones
    if (iterations % 1000 === 0) {
      self.postMessage({
        type: 'FEM_PROGRESS',
        progress: iterations / maxIterations,
        iterations
      });
    }
  }
  
  return x;
}

/**
 * Calcula gradientes (campo eléctrico) a partir de potenciales
 */
function calculateGradients(potentials, resolution) {
  const gradients = [];
  
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const idx = i * resolution + j;
      
      // Gradiente en X
      const gradX = j < resolution - 1 
        ? potentials[idx + 1] - potentials[idx]
        : 0;
      
      // Gradiente en Y
      const gradY = i < resolution - 1
        ? potentials[idx + resolution] - potentials[idx]
        : 0;
      
      gradients.push({
        x: j, y: i,
        Ex: gradX,
        Ey: gradY,
        magnitude: Math.sqrt(gradX * gradX + gradY * gradY)
      });
    }
  }
  
  return gradients;
}

/**
 * Calcula tensiones de paso
 */
function calculateStepVoltages(potentials, resolution) {
  const stepVoltages = [];
  
  for (let i = 0; i < resolution - 1; i++) {
    for (let j = 0; j < resolution - 1; j++) {
      const idx = i * resolution + j;
      const stepVoltage = Math.abs(potentials[idx] - potentials[idx + resolution]);
      stepVoltages.push({ x: j, y: i, voltage: stepVoltage });
    }
  }
  
  return stepVoltages;
}

/**
 * Calcula tensiones de contacto
 */
function calculateTouchVoltages(potentials, resolution) {
  const touchVoltages = [];
  
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const idx = i * resolution + j;
      // Tensión de contacto ≈ 70-80% de tensión de paso
      const touchVoltage = potentials[idx] * 0.75;
      touchVoltages.push({ x: j, y: i, voltage: touchVoltage });
    }
  }
  
  return touchVoltages;
}

/**
 * Verifica si un punto está sobre la malla conductora
 */
function isPointOnGrid(x, y, grid) {
  const tolerance = grid.conductorSpacing || 0.5;
  const nx = grid.nx || 8;
  const ny = grid.ny || 8;
  const spacingX = grid.length / nx;
  const spacingY = grid.width / ny;
  
  for (let i = 0; i <= nx; i++) {
    const conductorX = i * spacingX;
    if (Math.abs(x - conductorX) < tolerance) return true;
  }
  
  for (let i = 0; i <= ny; i++) {
    const conductorY = i * spacingY;
    if (Math.abs(y - conductorY) < tolerance) return true;
  }
  
  return false;
}

/**
 * Calcula Rg aproximado en un punto
 */
function calculateRgAtPoint(x, y, grid, soil) {
  // Simplificación - retorna Rg promedio
  const totalConductorLength = grid?.totalConductorLength || 0;
  const totalRodLength = grid?.totalRodLength || 0;
  const LT = Math.max(0.1, totalConductorLength + totalRodLength);
  const A = Math.max(1, grid?.area || 1);
  const h = grid?.depth || 0.6;
  const resistivity = soil?.resistivity || 100;
  return resistivity * (1/LT + 1/Math.sqrt(20 * A)) * (1 + 1/(1 + h * Math.sqrt(20 / A)));
}

function calculatePotentialMatrix(data, id) {
  try {
    const { grid, soil, fault, resolution = DEFAULT_RESOLUTION } = data;
    const matrix = buildPotentialMatrix(grid, soil, fault, resolution);
    self.postMessage({ type: 'POTENTIAL_MATRIX_COMPLETE', results: { matrix, resolution }, id });
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message, id });
  }
}

function solveLaplaceEquation(data, id) {
  try {
    const { matrix, maxIterations = 10000 } = data;
    
    // Validar matriz
    if (!matrix || !matrix.A || !matrix.b) {
      self.postMessage({ 
        type: 'ERROR', 
        error: 'Matriz inválida: se requieren matrix.A y matrix.b',
        id 
      });
      return;
    }
    
    const potentials = solveLinearSystem(matrix, maxIterations);
    self.postMessage({ type: 'LAPLACE_SOLVE_COMPLETE', results: { potentials }, id });
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message, id });
  }
}

export default {};
