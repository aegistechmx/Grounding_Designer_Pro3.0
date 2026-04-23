/**
 * Simulation Job Processor
 * Handles FEM simulation jobs in the queue
 */

const { Worker } = require('bullmq');
const Redis = require('ioredis');
const femService = require('../../services/fem.service');

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined
});

/**
 * Process FEM simulation job
 */
async function processFEMJob(job) {
  const { jobId, params } = job.data;
  
  try {
    // Update job progress
    await job.updateProgress(10);
    
    // Process FEM simulation
    const result = await femService.processFEM(jobId);
    
    await job.updateProgress(50);
    
    // Generate heatmap
    const heatmapService = require('../../services/heatmap.service');
    const heatmap = heatmapService.generateHeatmap(result.discreteGrid, {
      width: 600,
      height: 400
    });
    
    await job.updateProgress(80);
    
    // Calculate statistics
    const stats = heatmapService.calculateStatistics(result.discreteGrid);
    
    await job.updateProgress(100);
    
    return {
      success: true,
      result,
      heatmap,
      statistics: stats
    };
  } catch (error) {
    console.error('FEM job processing error:', error);
    throw error;
  }
}

/**
 * Create simulation worker
 */
function createSimulationWorker() {
  const worker = new Worker('simulation', async (job) => {
    if (job.name === 'fem') {
      return await processFEMJob(job);
    }
    throw new Error(`Unknown job type: ${job.name}`);
  }, {
    connection,
    concurrency: 2 // Process 2 jobs concurrently
  });
  
  worker.on('completed', (job) => {
    console.log(`Simulation job ${job.id} completed`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`Simulation job ${job?.id} failed:`, err.message);
  });
  
  return worker;
}

module.exports = {
  createSimulationWorker,
  processFEMJob
};
