/**
 * Projects Routes
 * API endpoints for project management
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'grounding_saas',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

/**
 * Get all projects for current user
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(
      `SELECT id, name, description, location, client_name, created_at, updated_at, is_active
       FROM projects
       WHERE user_id = $1 AND is_active = true
       ORDER BY updated_at DESC`,
      [userId]
    );
    
    res.json({
      success: true,
      projects: result.rows
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get single project by ID
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const projectId = req.params.id;
    
    const result = await pool.query(
      `SELECT * FROM projects WHERE id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    res.json({
      success: true,
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create new project
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description, location, clientName } = req.body;
    
    const result = await pool.query(
      `INSERT INTO projects (user_id, name, description, location, client_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, name, description, location, clientName]
    );
    
    res.status(201).json({
      success: true,
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Update project
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const projectId = req.params.id;
    const { name, description, location, clientName } = req.body;
    
    const result = await pool.query(
      `UPDATE projects 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           location = COALESCE($3, location),
           client_name = COALESCE($4, client_name),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [name, description, location, clientName, projectId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    res.json({
      success: true,
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Delete project (soft delete)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const projectId = req.params.id;
    
    const result = await pool.query(
      `UPDATE projects 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [projectId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get project versions
 */
router.get('/:id/versions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const projectId = req.params.id;
    
    // Verify project belongs to user
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const versionService = require('../services/version.service');
    const versions = await versionService.getProjectVersions(projectId);
    
    res.json({
      success: true,
      versions
    });
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create new version
 */
router.post('/:id/versions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const projectId = req.params.id;
    const { simulationId, versionName, description } = req.body;
    
    // Verify project belongs to user
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const versionService = require('../services/version.service');
    const version = await versionService.createVersion(projectId, simulationId, {
      versionName,
      description
    });
    
    res.status(201).json({
      success: true,
      version
    });
  } catch (error) {
    console.error('Create version error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Compare versions
 */
router.get('/:id/compare', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const projectId = req.params.id;
    const { v1, v2 } = req.query;
    
    // Verify project belongs to user
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const versionService = require('../services/version.service');
    const comparison = await versionService.compareVersions(projectId, parseInt(v1), parseInt(v2));
    
    res.json({
      success: true,
      comparison
    });
  } catch (error) {
    console.error('Compare versions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
