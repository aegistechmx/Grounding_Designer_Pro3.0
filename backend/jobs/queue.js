/**
 * Job Queue Manager
 * BullMQ + Redis for handling heavy tasks (FEM, PDF generation, etc.)
 */

const { Queue, Worker, Job } = require('bullmq');
const Redis = require('ioredis');

let connection = null;
let queues = {};

// Only initialize Redis if not in debug mode without Redis
const skipRedis = process.env.SKIP_REDIS === 'true';

if (!skipRedis) {
  try {
    // Redis connection
    connection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    connection.on('error', (err) => {
      console.error('Redis connection error:', err.message);
      if (err.code === 'ECONNREFUSED') {
        console.warn('Redis not available - job queues will be disabled');
        console.warn('Set SKIP_REDIS=true to disable Redis completely');
      }
    });

    // Wait for connection to be established before creating queues
    connection.on('connect', () => {
      console.log('Redis connected - creating job queues');
      
      // Create queues
      queues = {
        simulation: new Queue('simulation', { connection }),
        reports: new Queue('reports', { connection }),
        pdf: new Queue('pdf', { connection }),
        heatmap: new Queue('heatmap', { connection }),
        fem: new Queue('fem', { connection }),
        ai: new Queue('ai', { connection })
      };
    });

    connection.on('close', () => {
      console.warn('Redis connection closed - job queues may be unavailable');
    });

  } catch (error) {
    console.error('Failed to initialize Redis queues:', error.message);
    console.warn('Job queues will be disabled');
  }
} else {
  console.log('Redis skipped - job queues disabled (SKIP_REDIS=true)');
}

// Export pdfQueue for direct use
module.exports.pdfQueue = skipRedis ? null : queues.pdf;

/**
 * Check if queues are available
 */
module.exports.isAvailable = function() {
  return !skipRedis && connection !== null;
};

/**
 * Add job to queue
 */
module.exports.addJob = async function(queueName, jobData, options = {}) {
  if (skipRedis || !queues[queueName]) {
    throw new Error(`Queue ${queueName} not available - Redis is disabled or not connected`);
  }

  const queue = queues[queueName];

  const job = await queue.add(queueName, jobData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 50,
    ...options
  });

  return {
    jobId: job.id,
    status: 'pending',
    queue: queueName
  };
};

/**
 * Get job status
 */
module.exports.getJobStatus = async function(queueName, jobId) {
  if (skipRedis || !queues[queueName]) {
    return { status: 'not_available', error: 'Redis is disabled' };
  }

  const queue = queues[queueName];

  const job = await queue.getJob(jobId);

  if (!job) {
    return { status: 'not_found' };
  }

  const state = await job.getState();

  return {
    jobId,
    status: state,
    progress: job.progress,
    data: job.data,
    result: state === 'completed' ? job.returnvalue : null,
    failedReason: state === 'failed' ? job.failedReason : null
  };
};

/**
 * Cancel job
 */
module.exports.cancelJob = async function(queueName, jobId) {
  if (skipRedis || !queues[queueName]) {
    return { success: false, jobId, error: 'Redis is disabled' };
  }

  const queue = queues[queueName];

  const job = await queue.getJob(jobId);
  if (job) {
    await job.remove();
    return { success: true, jobId };
  }

  return { success: false, jobId };
};

/**
 * Get queue statistics
 */
module.exports.getQueueStats = async function(queueName) {
  if (skipRedis || !queues[queueName]) {
    return { queue: queueName, status: 'not_available', error: 'Redis is disabled' };
  }

  const queue = queues[queueName];

  const waiting = await queue.getWaitingCount();
  const active = await queue.getActiveCount();
  const completed = await queue.getCompletedCount();
  const failed = await queue.getFailedCount();
  const delayed = await queue.getDelayedCount();

  return {
    queue: queueName,
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed
  };
};

/**
 * Close all queues
 */
module.exports.closeQueues = async function() {
  if (skipRedis || !connection) {
    return;
  }
  await Promise.all(Object.values(queues).map(queue => queue.close()));
  await connection.quit();
};

module.exports.queues = queues;
