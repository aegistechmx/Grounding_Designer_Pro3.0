import express from 'express';
import { generateFullReport } from '../../src/utils/pdfGenerator.js';
import calculationRateLimiter from '../middleware/security.js';

const router = express.Router();

/**
 * POST /api/pdf/generate
 * Generate professional engineering PDF report
 */
router.post('/generate', calculationRateLimiter, async (req, res) => {
  try {
    const { results, params, recommendations, heatmapImage, history, aiDecisions } = req.body;

    // Validate required fields
    if (!results || !params) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: results and params are required'
      });
    }

    // Generate PDF
    const pdfBuffer = await generateFullReport({
      results,
      params,
      recommendations: recommendations || [],
      heatmapImage: heatmapImage || null,
      history: history || [],
      aiDecisions: aiDecisions || []
    });

    // Return PDF as base64 for client-side download
    const pdfBase64 = pdfBuffer.toString('base64');

    res.json({
      success: true,
      data: {
        pdf: pdfBase64,
        filename: `grounding_report_${params.projectName || 'project'}_${Date.now()}.pdf`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate PDF'
    });
  }
});

/**
 * POST /api/pdf/batch
 * Generate multiple PDFs and return as ZIP
 */
router.post('/batch', calculationRateLimiter, async (req, res) => {
  try {
    const { projects } = req.body;

    if (!projects || !Array.isArray(projects) || projects.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid projects array'
      });
    }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const projectName = project.params?.projectName || `Project_${i + 1}`;
      
      const pdfBuffer = await generateFullReport({
        results: project.results,
        params: project.params,
        recommendations: project.recommendations || [],
        heatmapImage: project.heatmapImage || null,
        history: project.history || [],
        aiDecisions: project.aiDecisions || []
      });

      zip.file(`${projectName}.pdf`, pdfBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipBase64 = zipBuffer.toString('base64');

    res.json({
      success: true,
      data: {
        zip: zipBase64,
        filename: `grounding_batch_pdfs_${Date.now()}.zip`
      }
    });
  } catch (error) {
    console.error('Error generating batch PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate batch PDF'
    });
  }
});

export default router;
