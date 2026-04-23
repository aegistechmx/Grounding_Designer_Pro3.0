/**
 * Batch Export Routes
 * API endpoints for multi-export functionality (ZIP generation)
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.js');
const requireFeature = require('../middleware/requireFeature.js');
const batchService = require('../services/batch.service.js');
const storageService = require('../services/storage.service.js');
const { getPool } = require('../database/pool.js');

const pool = getPool();

/**
 * Generate batch reports for a project
 */
router.post('/project/:projectId/reports', authenticate, requireFeature('batch_reports'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const projectId = req.params.projectId;
    const { reportTypes = ['pdf', 'excel'] } = req.body;

    // Verify project belongs to user
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Check plan limits
    const auth = require('../services/auth.service');
    const usageResult = await pool.query(
      'SELECT * FROM usage_tracking WHERE user_id = $1',
      [userId]
    );

    const usage = usageResult.rows[0] || { simulation_count: 0, pdf_export_count: 0, excel_export_count: 0, storage_used: 0 };
    const planCheck = auth.checkPlanLimits(req.user.plan, usage);

    if (!planCheck.allowed) {
      return res.status(403).json({ success: false, error: planCheck.reason });
    }

    // Generate batch reports
    const result = await batchService.generateProjectReports(projectId, reportTypes);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Batch reports error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Generate comparison report between versions
 */
router.post('/project/:projectId/compare', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const projectId = req.params.projectId;
    const { version1, version2 } = req.body;

    // Verify project belongs to user
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Generate comparison report
    const result = await batchService.generateComparisonReport(projectId, version1, version2);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Comparison report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Export all project data
 */
router.post('/project/:projectId/export', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const projectId = req.params.projectId;

    // Verify project belongs to user
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Export project data
    const result = await batchService.exportProjectData(projectId);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Project export error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Download batch export
 */
router.get('/download/:key', authenticate, async (req, res) => {
  try {
    const key = req.params.key;

    // Get file from storage
    const buffer = await storageService.getFile(key);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${key}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error('Download batch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
