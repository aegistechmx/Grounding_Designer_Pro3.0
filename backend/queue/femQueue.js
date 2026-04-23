/**
 * BullMQ FEM Queue Setup
 * Distributed job queue for FEM simulations
 * Grounding Designer Pro - Professional Engineering Simulation
 */

const { Queue } = require('bullmq');

// Redis connection configuration
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined
};

/**
 * FEM Simulation Queue
 */
const femQueue = new Queue('fem-simulation', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      count: 100,
      age: 3600 // Keep completed jobs for 1 hour
    },
    removeOnFail: {
      count: 500,
      age: 7200 // Keep failed jobs for 2 hours
    }
  }
});

/**
 * PDF Generation Queue
 */
const pdfQueue = new Queue('pdf-generation', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: {
      count: 50,
      age: 1800
    },
    removeOnFail: {
      count: 100,
      age: 3600
    }
  }
});

/**
 * DXF Export Queue
 */
const dxfQueue = new Queue('dxf-export', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: {
      count: 50,
      age: 1800
    },
    removeOnFail: {
      count: 100,
      age: 3600
    }
  }
});

/**
 * Check if queue is available
 * @returns {Promise<boolean>}
 */
async function isQueueAvailable(queue) {
  try {
    await queue.getJobCounts();
    return true;
  } catch (error) {
    console.error('Queue not available:', error.message);
    return false;
  }
}

/**
 * Add FEM simulation job to queue
 * @param {Object} data - Simulation data
 * @param {Object} options - Job options
 * @returns {Promise<Object>} Job
 */
async function addFEMJob(data, options = {}) {
  return await femQueue.add('run-simulation', data, {
    priority: options.priority || 10,
    ...options
  });
}

/**
 * Add PDF generation job to queue
 * @param {Object} data - PDF generation data
 * @param {Object} options - Job options
 * @returns {Promise<Object>} Job
 */
async function addPDFJob(data, options = {}) {
  return await pdfQueue.add('generate-pdf', data, {
    priority: options.priority || 5,
    ...options
  });
}

/**
 * Add DXF export job to queue
 * @param {Object} data - DXF export data
 * @param {Object} options - Job options
 * @returns {Promise<Object>} Job
 */
async function addDXFJob(data, options = {}) {
  return await dxfQueue.add('export-dxf', data, {
    priority: options.priority || 5,
    ...options
  });
}

/**
 * Get job status
 * @param {string} jobId - Job ID
 * @param {Queue} queue - Queue instance
 * @returns {Promise<Object>} Job status
 */
async function getJobStatus(jobId, queue) {
  try {
    const job = await queue.getJob(jobId);
    
    if (!job) {
      return { status: 'not_found' };
    }

    const state = await job.getState();
    const progress = job.progress;

    if (state === 'completed') {
      const result = await job.returnvalue;
      return {
        status: 'completed',
        result,
        progress: 100
      };
    }

    if (state === 'failed') {
      const failedReason = job.failedReason;
      return {
        status: 'failed',
        error: failedReason,
        progress
      };
    }

    return {
      status: state,
      progress
    };
  } catch (error) {
    console.error('Error getting job status:', error);
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Clean up queues on shutdown
 */
async function closeQueues() {
  await Promise.all([
    femQueue.close(),
    pdfQueue.close(),
    dxfQueue.close()
  ]);
}

module.exports = {
  femQueue,
  pdfQueue,
  dxfQueue,
  isQueueAvailable,
  addFEMJob,
  addPDFJob,
  addDXFJob,
  getJobStatus,
  closeQueues
};
