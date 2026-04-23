/**
 * FEM Worker - Distributed Processing
 * BullMQ worker for FEM simulation jobs
 * Grounding Designer Pro - Professional Engineering Simulation
 */

const { Worker } = require('bullmq');
const { solveSparseFEM } = require('../../src/engine/fem/sparseSolver.js');
const { generateIEEE80Mesh } = require('../../src/engine/mesh/ieeeMesh.js');
const { generateIsoCurves } = require('../../src/engine/post/isoCurves.js');
const { generateIsoSurfaces } = require('../../src/engine/post/isoSurfaces.js');

// Redis connection configuration
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined
};

/**
 * FEM Simulation Worker
 */
const femWorker = new Worker('fem-simulation', async (job) => {
  const { grid, conductivity, boundary, sources, options } = job.data;

  try {
    // Update progress
    await job.updateProgress(10);

    // Step 1: Generate mesh
    const mesh = generateIEEE80Mesh(grid, options?.meshResolution || 70);
    await job.updateProgress(30);

    // Step 2: Build system
    const system = {
      nodes: mesh.nodes,
      elements: mesh.elements,
      conductivity: conductivity || 0.01,
      boundary: boundary || { type: 'ground', nodes: [] },
      sources: sources || []
    };
    await job.updateProgress(40);

    // Step 3: Solve FEM
    const solution = await solveSparseFEM(system, options || {
      tolerance: 1e-6,
      maxIterations: 1000
    });
    await job.updateProgress(80);

    // Step 4: Post-process (optional)
    let isoCurves = null;
    let isoSurfaces = null;

    if (options?.generateCurves) {
      const field = {
        nodes: mesh.nodes,
        values: solution.values
      };
      const levels = generateContourLevels(solution.values);
      isoCurves = generateIsoCurves(field, levels);
      await job.updateProgress(90);
    }

    if (options?.generateSurfaces) {
      const volume = {
        nodes: mesh.nodes,
        values: solution.values
      };
      const levels = generateContourLevels(solution.values);
      isoSurfaces = generateIsoSurfaces(volume, levels);
      await job.updateProgress(95);
    }

    // Complete
    await job.updateProgress(100);

    return {
      solution,
      mesh: {
        nodes: mesh.nodes.length,
        elements: mesh.elements.length,
        metadata: mesh.metadata
      },
      isoCurves,
      isoSurfaces,
      executionTime: Date.now() - job.timestamp
    };
  } catch (error) {
    console.error('FEM Worker error:', error);
    throw error;
  }
}, {
  connection,
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'),
  limiter: {
    max: 10,
    duration: 60000 // Max 10 jobs per minute
  }
});

/**
 * PDF Generation Worker
 */
const pdfWorker = new Worker('pdf-generation', async (job) => {
  const { contours, options } = job.data;

  try {
    await job.updateProgress(20);

    // Import PDF engine
    const { generateETAPReport } = require('../../src/engine/export/pdfVectorEngine.js');
    const PDFDocument = require('pdfkit');

    const doc = new PDFDocument.default({ size: 'A4' });
    
    // Collect PDF data (in production, would save to file)
    const simulation = {
      mesh: { nodes: [], elements: [] },
      solution: { values: [] },
      isoCurves: contours,
      levels: options?.levels || [],
      statistics: options?.statistics || { min: 0, max: 1000, mean: 500, stdDev: 100 }
    };

    await job.updateProgress(50);

    // Generate report
    generateETAPReport(doc, simulation, options);

    await job.updateProgress(100);

    return {
      success: true,
      message: 'PDF generated successfully'
    };
  } catch (error) {
    console.error('PDF Worker error:', error);
    throw error;
  }
}, {
  connection,
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2')
});

/**
 * DXF Export Worker
 */
const dxfWorker = new Worker('dxf-export', async (job) => {
  const { curves, options } = job.data;

  try {
    await job.updateProgress(20);

    // Import DXF exporter
    const { exportContoursDXF } = require('../../src/export/dxfContours.js');

    await job.updateProgress(50);

    // Generate DXF
    const dxf = exportContoursDXF(curves, options);

    await job.updateProgress(100);

    return {
      success: true,
      dxf,
      filename: options?.filename || 'grounding_contours.dxf'
    };
  } catch (error) {
    console.error('DXF Worker error:', error);
    throw error;
  }
}, {
  connection,
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2')
});

/**
 * Helper function to generate contour levels
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

/**
 * Worker event handlers
 */
femWorker.on('completed', (job) => {
  console.log(`FEM Job ${job.id} completed`);
});

femWorker.on('failed', (job, err) => {
  console.error(`FEM Job ${job?.id} failed:`, err.message);
});

pdfWorker.on('completed', (job) => {
  console.log(`PDF Job ${job.id} completed`);
});

pdfWorker.on('failed', (job, err) => {
  console.error(`PDF Job ${job?.id} failed:`, err.message);
});

dxfWorker.on('completed', (job) => {
  console.log(`DXF Job ${job.id} completed`);
});

dxfWorker.on('failed', (job, err) => {
  console.error(`DXF Job ${job?.id} failed:`, err.message);
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('Shutting down workers...');
  await Promise.all([
    femWorker.close(),
    pdfWorker.close(),
    dxfWorker.close()
  ]);
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down workers...');
  await Promise.all([
    femWorker.close(),
    pdfWorker.close(),
    dxfWorker.close()
  ]);
  process.exit(0);
});

console.log('FEM Workers started');
