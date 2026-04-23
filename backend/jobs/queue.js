/**
 * Job Queue Manager
 * BullMQ + Redis for handling heavy tasks (FEM, PDF generation, etc.)
 */

const { Queue, Worker, Job } = require('bullmq');
const Redis = require('ioredis');

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null
});

// Create queues
const queues = {
  simulation: new Queue('simulation', { connection }),
  reports: new Queue('reports', { connection }),
  pdf: new Queue('pdf', { connection }),
  heatmap: new Queue('heatmap', { connection }),
  fem: new Queue('fem', { connection }),
  ai: new Queue('ai', { connection })
};

// Export pdfQueue for direct use
const pdfQueue = queues.pdf;

/**
 * Add job to queue
 */
async function addJob(queueName, jobData, options = {}) {
  const queue = queues[queueName];
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }
  
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
}

/**
 * Get job status
 */
async function getJobStatus(queueName, jobId) {
  const queue = queues[queueName];
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }
  
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
}

/**
 * Cancel job
 */
async function cancelJob(queueName, jobId) {
  const queue = queues[queueName];
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }
  
  const job = await queue.getJob(jobId);
  if (job) {
    await job.remove();
    return { success: true, jobId };
  }
  
  return { success: false, jobId };
}

/**
 * Get queue statistics
 */
async function getQueueStats(queueName) {
  const queue = queues[queueName];
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }
  
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
}

/**
 * Close all queues
 */
async function closeQueues() {
  await Promise.all(Object.values(queues).map(queue => queue.close()));
  await connection.quit();
}

module.exports = {
  queues,
  pdfQueue,
  addJob,
  getJobStatus,
  cancelJob,
  getQueueStats,
  closeQueues
};
