/**
 * Simulation Job Processor
 * Handles FEM simulation jobs in the queue
 */

const { Worker } = require('bullmq');
const Redis = require('ioredis');
const fs = require('fs/promises');
const path = require('path');
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
  const { params } = job.data;
  const jobId = String(job.id);
  
  try {
    const paramsPath = path.join(__dirname, '../../jobs/fem', `${jobId}.json`);
    await fs.mkdir(path.dirname(paramsPath), { recursive: true });
    await fs.writeFile(paramsPath, JSON.stringify(params));

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
  const worker = new Worker('fem', async (job) => {
    if (job.name !== 'fem') {
      throw new Error(`Unknown job type: ${job.name}`);
    }

    return await processFEMJob(job);
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
