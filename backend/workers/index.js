/**
 * Worker Entry Point
 * Starts the appropriate worker based on WORKER_TYPE environment variable
 */

const { createSimulationWorker } = require('../jobs/processors/simulation.processor');
const { createReportWorker, createPDFWorker } = require('../jobs/processors/report.processor');

const workerType = process.env.WORKER_TYPE || 'simulation';

console.log(`Starting ${workerType} worker...`);

if (workerType === 'simulation') {
  const worker = createSimulationWorker();
  console.log('Simulation worker started successfully');
} else if (workerType === 'report') {
  const worker = createReportWorker();
  console.log('Report worker started successfully');
} else if (workerType === 'pdf') {
  const worker = createPDFWorker();
  console.log('PDF worker started successfully');
} else {
  console.error(`Unknown worker type: ${workerType}`);
  process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Worker received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Worker received SIGINT, shutting down gracefully...');
  process.exit(0);
});
