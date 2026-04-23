/**
 * Reports Routes
 * API endpoints for PDF, Excel, and DXF report generation
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const reportService = require('../services/report.service');
const { addJob, getJobStatus } = require('../jobs/queue');
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'grounding_saas',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

/**
 * Generate PDF report (asynchronous)
 */
router.post('/pdf', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const reportData = req.body;
    
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
    
    // Queue PDF generation job
    const job = await addJob('reports', {
      type: 'pdf',
      reportData,
      userId
    });
    
    // Update usage tracking
    if (usageResult.rows.length > 0) {
      await pool.query(
        'UPDATE usage_tracking SET pdf_export_count = pdf_export_count + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
        [userId]
      );
    } else {
      await pool.query(
        'INSERT INTO usage_tracking (user_id, simulation_count, pdf_export_count, excel_export_count, storage_used) VALUES ($1, 0, 1, 0, 0)',
        [userId]
      );
    }
    
    res.json({
      success: true,
      jobId: job.jobId,
      status: 'pending',
      message: 'PDF generation queued for processing'
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Generate Excel report (asynchronous)
 */
router.post('/excel', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const reportData = req.body;
    
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
    
    // Queue Excel generation job
    const job = await addJob('reports', {
      type: 'excel',
      reportData,
      userId
    });
    
    // Update usage tracking
    if (usageResult.rows.length > 0) {
      await pool.query(
        'UPDATE usage_tracking SET excel_export_count = excel_export_count + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
        [userId]
      );
    } else {
      await pool.query(
        'INSERT INTO usage_tracking (user_id, simulation_count, pdf_export_count, excel_export_count, storage_used) VALUES ($1, 0, 0, 1, 0)',
        [userId]
      );
    }
    
    res.json({
      success: true,
      jobId: job.jobId,
      status: 'pending',
      message: 'Excel generation queued for processing'
    });
  } catch (error) {
    console.error('Excel generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Generate DXF export
 */
router.post('/dxf', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const reportData = req.body;
    
    // Queue DXF generation job
    const job = await addJob('reports', {
      type: 'dxf',
      reportData,
      userId
    });
    
    res.json({
      success: true,
      jobId: job.jobId,
      status: 'pending',
      message: 'DXF generation queued for processing'
    });
  } catch (error) {
    console.error('DXF generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Batch generate multiple reports (ZIP)
 */
router.post('/batch', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reports } = req.body;
    
    // Queue batch report job
    const job = await addJob('reports', {
      type: 'batch',
      reports,
      userId
    });
    
    res.json({
      success: true,
      jobId: job.jobId,
      status: 'pending',
      message: 'Batch report generation queued for processing'
    });
  } catch (error) {
    console.error('Batch report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get report job status
 */
router.get('/jobs/:jobId', authMiddleware, async (req, res) => {
  try {
    const jobId = req.params.jobId;
    
    const status = await getJobStatus('reports', jobId);
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Get job status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Download generated report
 */
router.get('/:reportId/download', authMiddleware, async (req, res) => {
  try {
    const reportId = req.params.reportId;
    
    const result = await pool.query(
      'SELECT file_path, file_size, format FROM reports WHERE id = $1',
      [reportId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    
    const report = result.rows[0];
    
    const data = await fs.readFile(report.file_path);
    
    // Set appropriate content type
    const contentTypes = {
      pdf: 'application/pdf',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dxf: 'application/dxf',
      zip: 'application/zip'
    };
    
    res.setHeader('Content-Type', contentTypes[report.format] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="report.${report.format}"`);
    res.setHeader('Content-Length', report.file_size);
    
    res.send(data);
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get report metadata
 */
router.get('/:reportId', authMiddleware, async (req, res) => {
  try {
    const reportId = req.params.reportId;
    
    const result = await pool.query(
      `SELECT id, report_type, format, file_size, status, created_at, completed_at
       FROM reports
       WHERE id = $1`,
      [reportId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    
    res.json({
      success: true,
      report: result.rows[0]
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * List all reports for a project
 */
router.get('/project/:projectId', authMiddleware, async (req, res) => {
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
    
    const result = await pool.query(
      `SELECT id, report_type, format, file_size, status, created_at, completed_at
       FROM reports
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [projectId]
    );
    
    res.json({
      success: true,
      reports: result.rows
    });
  } catch (error) {
    console.error('List reports error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
