// backend/api/projects.routes.js
// API de proyectos (CRUD + validación)

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Project = require('../models/Project');
const { validateProject } = require('../middleware/validation');
const { Queue } = require('bullmq');
const Redis = require('ioredis');

// Singleton Redis connection and queue
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

redisConnection.on('error', (err) => {
  console.error('Redis connection error in projects.routes:', err);
});

const femQueue = new Queue('fem-simulations', { connection: redisConnection });

// Obtener todos los proyectos del usuario
router.get('/', authenticate, async (req, res) => {
  try {
    const projects = await Project.findByUser(req.user.id);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo proyecto
router.post('/', authenticate, validateProject, async (req, res) => {
  try {
    const project = new Project({
      ...req.body,
      userId: req.user.id,
      createdAt: new Date(),
      status: 'draft'
    });
    
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener proyecto específico
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    if (project.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar proyecto
router.put('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    if (project.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    const updated = await project.update(req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar proyecto
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    if (project.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    await project.delete();
    res.json({ message: 'Proyecto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ejecutar simulación FEM en backend
router.post('/:id/simulate', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    const job = await femQueue.add('simulate', {
      projectId: project.id,
      projectData: project.toJSON(),
      userId: req.user.id
    });
    
    res.json({ 
      jobId: job.id,
      status: 'queued',
      message: 'Simulación encolada'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener estado de simulación
router.get('/:id/simulation-status', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    res.json({ 
      status: project.simulationStatus,
      results: project.simulationResults
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
