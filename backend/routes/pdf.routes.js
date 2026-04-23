const express = require('express');
const { pdfQueue, isAvailable } = require('../jobs/queue.js');
const { calculationRateLimiter } = require('../middleware/security.js');
const { generateVectorPDF } = require('../services/etapPDF.service.js');

const router = express.Router();

/**
 * POST /api/pdf/generate
 * Generate professional engineering PDF report using job queue
 */
router.post('/generate', calculationRateLimiter, async (req, res) => {
  try {
    // Check if queue is available
    if (!isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'PDF generation service is currently unavailable'
      });
    }

    const { calculations, params, heatmapImage, projectName, clientName, engineer } = req.body;

    // Validate required fields
    if (!calculations || !params) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: calculations and params are required'
      });
    }

    // Add job to queue
    const job = await pdfQueue.add('generate-pdf', {
      calculations,
      params,
      heatmapImage,
      projectName: projectName || 'Project',
      clientName: clientName || 'Client',
      engineer: engineer || 'Engineer'
    });

    res.json({
      success: true,
      jobId: job.id
    });
  } catch (error) {
    console.error('Error adding PDF job to queue:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to queue PDF generation'
    });
  }
});

/**
 * GET /api/pdf/status/:id
 * Get status of PDF generation job
 */
router.get('/status/:id', async (req, res) => {
  try {
    const job = await pdfQueue.getJob(req.params.id);

    if (!job) {
      return res.json({ status: 'not_found' });
    }

    const state = await job.getState();

    if (state === 'completed') {
      const result = await job.returnvalue;
      return res.json({
        status: 'completed',
        downloadUrl: result.downloadUrl
      });
    }

    res.json({ status: state });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get job status'
    });
  }
});

/**
 * POST /api/pdf/vector
 * Generate vector PDF with ETAP-style contours (direct, no queue)
 */
router.post('/vector', calculationRateLimiter, async (req, res) => {
  try {
    const { contours, options } = req.body;

    // Validate required fields
    if (!contours || !Array.isArray(contours)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: contours array is required'
      });
    }

    // Generate vector PDF
    const pdfBuffer = await generateVectorPDF(contours, options);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="grounding-analysis-vector.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating vector PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate vector PDF'
    });
  }
});

module.exports = router;
