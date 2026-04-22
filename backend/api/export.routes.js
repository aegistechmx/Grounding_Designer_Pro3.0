// backend/api/export.routes.js
// Rutas para exportación de datos

const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Exportar proyecto a JSON
router.get('/project/:projectId/json', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const Project = require('../models/Project');
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    // Verificar que el usuario tenga acceso
    if (project.userId !== req.userId) {
      return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
    }
    
    res.json({
      project: project.toJSON(),
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al exportar proyecto:', error);
    res.status(500).json({ error: 'Error al exportar proyecto' });
  }
});

// Exportar múltiples proyectos
router.get('/projects/json', authenticate, async (req, res) => {
  try {
    const Project = require('../models/Project');
    
    const projects = await Project.findByUser(req.userId);
    
    res.json({
      projects: projects.map(p => p.toJSON()),
      exportedAt: new Date().toISOString(),
      count: projects.length
    });
  } catch (error) {
    console.error('Error al exportar proyectos:', error);
    res.status(500).json({ error: 'Error al exportar proyectos' });
  }
});

module.exports = router;
