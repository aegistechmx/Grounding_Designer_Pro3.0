// backend/api/simulation.routes.js
// Rutas para simulaciones FEM

const express = require('express');
const { Queue } = require('bullmq');
const Redis = require('ioredis');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

redisConnection.on('error', (err) => {
  console.error('Redis connection error in simulation.routes:', err);
});

const femQueue = new Queue('fem-simulations', { connection: redisConnection });

// Iniciar simulación FEM
router.post('/start', authenticate, async (req, res) => {
  try {
    const { projectId, projectData } = req.body;
    
    if (!projectId || !projectData) {
      return res.status(400).json({ error: 'projectId y projectData son requeridos' });
    }
    
    // Agregar trabajo a la cola
    const job = await femQueue.add('simulate', {
      projectId,
      projectData,
      userId: req.userId
    });
    
    res.json({
      message: 'Simulación iniciada',
      jobId: job.id,
      status: 'queued'
    });
  } catch (error) {
    console.error('Error al iniciar simulación:', error);
    res.status(500).json({ error: 'Error al iniciar simulación' });
  }
});

// Obtener estado de simulación
router.get('/status/:jobId', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await femQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }
    
    const state = await job.getState();
    const progress = job.progress;
    
    res.json({
      jobId,
      state,
      progress,
      data: job.data
    });
  } catch (error) {
    console.error('Error al obtener estado:', error);
    res.status(500).json({ error: 'Error al obtener estado de simulación' });
  }
});

// Cancelar simulación
router.post('/cancel/:jobId', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await femQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }
    
    await job.remove();
    
    res.json({ message: 'Simulación cancelada' });
  } catch (error) {
    console.error('Error al cancelar simulación:', error);
    res.status(500).json({ error: 'Error al cancelar simulación' });
  }
});

module.exports = router;
