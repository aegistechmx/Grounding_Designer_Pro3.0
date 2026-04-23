/**
 * FEM Worker - Heavy Simulation Worker
 * Web Worker for running FEM simulations off the main thread
 * Grounding Designer Pro - Professional Engineering Simulation
 */

import { solveFEM } from '../engine/fem/femSolver';
import { generateIsoCurves } from '../engine/post/isoCurves';
import { generateIsoSurfaces } from '../engine/post/isoSurfaces';

/**
 * Worker message handler
 */
self.onmessage = async (e) => {
  const { type, data } = e.data;

  try {
    switch (type) {
      case 'runFEM':
        const femResult = await runFEM(data);
        self.postMessage({ type: 'femComplete', result: femResult });
        break;

      case 'runFullSimulation':
        const simResult = await runFullSimulation(data);
        self.postMessage({ type: 'simulationComplete', result: simResult });
        break;

      case 'generateIsoCurves':
        const curvesResult = generateIsoCurves(data.field, data.levels);
        self.postMessage({ type: 'isoCurvesComplete', result: curvesResult });
        break;

      case 'generateIsoSurfaces':
        const surfacesResult = generateIsoSurfaces(data.volume, data.levels);
        self.postMessage({ type: 'isoSurfacesComplete', result: surfacesResult });
        break;

      default:
        self.postMessage({ type: 'error', error: `Unknown message type: ${type}` });
    }
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
};

/**
 * Run FEM simulation
 */
async function runFEM(data) {
  const { system, config } = data;
  const startTime = performance.now();

  const solution = await solveFEM(system, config);

  const endTime = performance.now();

  return {
    solution,
    executionTime: endTime - startTime,
    timestamp: Date.now()
  };
}

/**
 * Run full simulation pipeline
 */
async function runFullSimulation(data) {
  const { input, config } = data;
  const startTime = performance.now();

  // Step 1: Generate mesh (simplified - would normally use mesh generator)
  const mesh = generateSimpleMesh(input.grid, config.meshResolution);

  // Step 2: Build system
  const system = buildSystem(input, mesh);

  // Step 3: Solve FEM
  const solution = await solveFEM(system, config);

  // Step 4: Post-process
  const levels = generateContourLevels(solution.values);
  const isoCurves = generateIsoCurves(
    { nodes: mesh.nodes, values: solution.values },
    levels
  );

  const endTime = performance.now();

  return {
    mesh,
    solution,
    isoCurves,
    levels,
    executionTime: endTime - startTime,
    timestamp: Date.now()
  };
}

/**
 * Generate simple mesh (placeholder)
 */
function generateSimpleMesh(grid, resolution) {
  const nodes = [];
  const elements = [];

  const nx = resolution;
  const ny = resolution;

  const dx = grid.length / (nx - 1);
  const dy = grid.width / (ny - 1);

  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      nodes.push({
        id: i * ny + j,
        x: i * dx,
        y: j * dy,
        z: 0
      });
    }
  }

  for (let i = 0; i < nx - 1; i++) {
    for (let j = 0; j < ny - 1; j++) {
      const n1 = i * ny + j;
      const n2 = n1 + 1;
      const n3 = n1 + ny;
      const n4 = n3 + 1;

      elements.push({
        id: i * (ny - 1) + j,
        type: 'quad',
        nodes: [n1, n2, n4, n3]
      });
    }
  }

  return { nodes, elements };
}

/**
 * Build physical system
 */
function buildSystem(input, mesh) {
  return {
    nodes: mesh.nodes,
    elements: mesh.elements,
    conductivity: input.conductivity || 0.01,
    boundary: {
      type: 'ground',
      nodes: mesh.nodes.filter((_, idx) => idx === 0 || idx === mesh.nodes.length - 1).map(id => ({
        id,
        potential: 0
      }))
    },
    sources: input.sources || []
  };
}

/**
 * Generate contour levels
 */
function generateContourLevels(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const levels = [];

  const start = Math.floor(min / 100) * 100;
  for (let v = start; v <= max; v += 100) {
    levels.push(v);
  }

  return levels;
}

// Export for testing
export { runFEM, runFullSimulation };
