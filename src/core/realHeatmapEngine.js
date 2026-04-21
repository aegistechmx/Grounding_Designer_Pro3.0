/**
 * Real Heatmap Engine - FEM-based potential distribution
 * Generates realistic heatmap using FemSolver (Laplace equation via Gauss-Seidel)
 */

import { FemSolver } from './femSolver';

export function generateRealGrid(params, calculations) {
  const resolution = 80;
  const iterations = 150;
  
  const GPR = calculations?.GPR || 1000;
  const gridLength = params?.gridLength || 30;
  const gridWidth = params?.gridWidth || 16;
  const numParallel = params?.numParallel || 8;
  const numParallelY = params?.numParallelY || 8;
  const numRods = params?.numRods || 6;
  const rodLength = params?.rodLength || 3;
  
  // Initialize FEM solver
  const solver = new FemSolver(resolution, resolution, iterations);
  solver.initGrid();
  
  // Add sources based on conductor positions
  const conductors = generateConductors(gridLength, gridWidth, numParallel, numParallelY);
  
  // Normalize conductor positions to 0-1 range for solver
  conductors.forEach(c => {
    const nx = c.x / gridLength;
    const ny = c.y / gridWidth;
    const voltage = (c.type === 'intersection') ? 1.0 : 0.8;
    solver.addSource(nx, ny, voltage);
  });
  
  // Add rod sources (grounding rods)
  if (numRods > 0) {
    for (let i = 0; i < numRods; i++) {
      const angle = (i / numRods) * Math.PI * 2;
      const rx = 0.5 + 0.3 * Math.cos(angle);
      const ry = 0.5 + 0.3 * Math.sin(angle);
      solver.addSource(rx, ry, 0.9);
    }
  }
  
  // Solve Laplace equation using Gauss-Seidel
  solver.solve();
  
  // Scale results to actual GPR values
  const maxVal = solver.getMaxValue();
  const scaleFactor = maxVal > 0 ? GPR / maxVal : 1;
  
  const grid = [];
  for (let y = 0; y < resolution; y++) {
    const row = [];
    for (let x = 0; x < resolution; x++) {
      const value = solver.grid[y][x] * scaleFactor;
      row.push(value);
    }
    grid.push(row);
  }
  
  return grid;
}

/**
 * Generates conductor positions based on grid geometry
 * @param {number} length - Grid length in meters
 * @param {number} width - Grid width in meters
 * @param {number} numParallelX - Number of parallel conductors in X direction
 * @param {number} numParallelY - Number of parallel conductors in Y direction
 * @returns {Array} Array of conductor positions
 */
function generateConductors(length, width, numParallelX, numParallelY) {
  const conductors = [];
  
  // Generate horizontal conductors (X direction)
  for (let i = 0; i < numParallelY; i++) {
    const y = (i / (numParallelY - 1 || 1)) * width;
    conductors.push({ x: 0, y: y, type: 'horizontal' });
    conductors.push({ x: length, y: y, type: 'horizontal' });
  }
  
  // Generate vertical conductors (Y direction)
  for (let i = 0; i < numParallelX; i++) {
    const x = (i / (numParallelX - 1 || 1)) * length;
    conductors.push({ x: x, y: 0, type: 'vertical' });
    conductors.push({ x: x, y: width, type: 'vertical' });
  }
  
  // Add internal grid points for more realistic distribution
  for (let i = 1; i < numParallelX; i++) {
    for (let j = 1; j < numParallelY; j++) {
      const x = (i / (numParallelX - 1 || 1)) * length;
      const y = (j / (numParallelY - 1 || 1)) * width;
      conductors.push({ x: x, y: y, type: 'intersection' });
    }
  }
  
  return conductors;
}

/**
 * Gets voltage at a specific point in the grid
 * @param {number} x - X coordinate (0 to 1, normalized)
 * @param {number} y - Y coordinate (0 to 1, normalized)
 * @param {Object} params - Design parameters
 * @param {Object} calculations - Calculation results
 * @param {Array} cachedGrid - Optional cached grid to avoid recomputation
 * @returns {number} Voltage at the specified point
 */
export function getVoltageAtPoint(x, y, params, calculations, cachedGrid = null) {
  const grid = cachedGrid || generateRealGrid(params, calculations);
  const size = grid.length;
  const ix = Math.floor(x * (size - 1));
  const iy = Math.floor(y * (size - 1));
  return grid[Math.min(size - 1, Math.max(0, ix))][Math.min(size - 1, Math.max(0, iy))];
}

/**
 * Generates a heatmap with enhanced resolution
 * @param {Object} params - Design parameters
 * @param {Object} calculations - Calculation results
 * @param {number} resolution - Grid resolution (default: 50)
 * @returns {Array} 2D array of voltage values
 */
export function generateHighResHeatmap(params, calculations, resolution = 50) {
  const grid = [];
  
  const GPR = calculations?.GPR || 1000;
  const gridLength = params?.gridLength || 30;
  const gridWidth = params?.gridWidth || 16;
  const numParallel = params?.numParallel || 8;
  const numParallelY = params?.numParallelY || 8;
  const soilResistivity = params?.soilResistivity || 100;
  
  const conductors = generateConductors(gridLength, gridWidth, numParallel, numParallelY);
  
  for (let i = 0; i < resolution; i++) {
    const row = [];
    for (let j = 0; j < resolution; j++) {
      let V = 0;
      
      const x = (i / (resolution - 1)) * gridLength;
      const y = (j / (resolution - 1)) * gridWidth;
      
      conductors.forEach(c => {
        const dx = x - c.x;
        const dy = y - c.y;
        const distance = Math.sqrt(dx * dx + dy * dy) + 0.5;
        const contribution = GPR / (distance * Math.sqrt(conductors.length));
        V += contribution;
      });
      
      const resistivityFactor = 1 + (soilResistivity - 100) / 500;
      V = V * resistivityFactor;
      
      const centerX = gridLength / 2;
      const centerY = gridWidth / 2;
      const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      const maxDist = Math.sqrt(Math.pow(gridLength / 2, 2) + Math.pow(gridWidth / 2, 2));
      const decayFactor = Math.exp(-distFromCenter / (maxDist * 0.5));
      
      V = V * decayFactor;
      V = Math.max(0, Math.min(GPR, V));
      
      row.push(V);
    }
    grid.push(row);
  }
  
  return grid;
}

/**
 * Calculates voltage statistics for the heatmap
 * @param {Array} grid - 2D voltage grid
 * @returns {Object} Statistics (min, max, average, std)
 */
export function calculateHeatmapStats(grid) {
  const values = grid && grid.length > 0 ? grid.flat() : [];
  
  if (values.length === 0) {
    return { min: 0, max: 0, avg: 0, std: 0 };
  }
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
  const std = Math.sqrt(variance);
  
  return { min, max, avg, std };
}

export default {
  generateRealGrid,
  getVoltageAtPoint,
  generateHighResHeatmap,
  calculateHeatmapStats
};
