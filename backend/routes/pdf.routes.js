import express from 'express';
import { pdfQueue } from '../jobs/queue.js';
import calculationRateLimiter from '../middleware/security.js';

const router = express.Router();

/**
 * POST /api/pdf/generate
 * Generate professional engineering PDF report using job queue
 */
router.post('/generate', calculationRateLimiter, async (req, res) => {
  try {
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

export default router;
