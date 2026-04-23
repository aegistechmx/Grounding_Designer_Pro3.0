/**
 * Reports Routes
 * API endpoints for PDF, Excel, and DXF report generation
 * Integrated with ETAP Engine v2 export services
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.js');
const requireFeature = require('../middleware/requireFeature.js');
const reportService = require('../services/report.service.js');
const { addJob, getJobStatus } = require('../jobs/queue.js');
const { getPool } = require('../database/pool.js');
const fs = require('fs/promises');
const path = require('path');

// Import ETAP Engine v2 DXF export service
let exportContoursToDXF;
try {
  const dxfService = require('../../src/export/dxfContours.js');
  exportContoursToDXF = dxfService.exportContoursToDXF;
  console.log('[Reports Routes] ETAP Engine v2 DXF export loaded');
} catch (error) {
  console.warn('[Reports Routes] ETAP Engine v2 DXF export not available:', error.message);
}

// Database connection
const pool = getPool();

/**
 * Generate PDF report (asynchronous)
 */
router.post('/pdf', authenticate, requireFeature('pdf_pro'), async (req, res) => {
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
router.post('/excel', authenticate, async (req, res) => {
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
 * Now uses ETAP Engine v2 DXF export service if available
 */
router.post('/dxf', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { contours, levels, options } = req.body;
    
    // Try to use ETAP Engine v2 DXF export directly for immediate response
    if (exportContoursToDXF && contours && levels) {
      console.log('[Reports Routes] Using ETAP Engine v2 DXF export');
      
      try {
        const dxf = exportContoursToDXF(contours, levels, options || {});
        
        // Save DXF to file
        const outputsDir = path.join(process.cwd(), 'outputs');
        await fs.mkdir(outputsDir, { recursive: true });
        
        const filename = `grounding_contours_${Date.now()}.dxf`;
        const filePath = path.join(outputsDir, filename);
        
        await fs.writeFile(filePath, dxf);
        
        // Save to database
        const insertResult = await pool.query(
          `INSERT INTO reports (user_id, project_id, report_type, format, file_path, file_size, status, created_at, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING id`,
          [userId, req.body.projectId || null, 'dxf', 'dxf', filePath, dxf.length, 'completed']
        );
        
        res.json({
          success: true,
          reportId: insertResult.rows[0].id,
          method: 'etap_v2',
          message: 'DXF generated successfully using ETAP Engine v2'
        });
        
        return;
      } catch (dxfError) {
        console.warn('[Reports Routes] ETAP Engine v2 DXF export failed, falling back to queue:', dxfError.message);
      }
    }
    
    // Fallback to queue-based DXF generation
    const job = await addJob('reports', {
      type: 'dxf',
      reportData: req.body,
      userId
    });
    
    res.json({
      success: true,
      jobId: job.jobId,
      status: 'pending',
      method: 'queue',
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
router.post('/batch', authenticate, async (req, res) => {
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
router.get('/jobs/:jobId', authenticate, async (req, res) => {
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
router.get('/:reportId/download', authenticate, async (req, res) => {
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
router.get('/:reportId', authenticate, async (req, res) => {
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
router.get('/project/:projectId', authenticate, async (req, res) => {
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
