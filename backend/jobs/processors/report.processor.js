/**
 * Report Job Processor
 * Handles PDF, Excel, and DXF generation jobs in the queue
 * Integrates with storage service for cloud upload
 * Sends email notifications when jobs complete
 */

const { Worker } = require('bullmq');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const storageService = require('../../services/storage.service');
const emailService = require('../../services/notification/email.service');
const pdfChartsService = require('../../services/pdfCharts.service');
const queueManager = require('../queue.js');

// Ensure outputs directory exists
const outputsDir = path.join(__dirname, '../../outputs');
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
}

// Track worker instances for cleanup
let pdfWorker = null;
let reportWorker = null;

/**
 * Process PDF generation job with pdfkit
 */
async function processPDFJob(job) {
  const { calculations, params, heatmapData, projectName, clientName, engineer, userEmail } = job.data;

  try {
    // Validate heatmap data structure
    if (heatmapData && heatmapData.length > 0) {
      for (let i = 0; i < heatmapData.length; i++) {
        const point = heatmapData[i];
        if (!point || typeof point !== 'object') {
          throw new Error(`Heatmap data point at index ${i} is not an object`);
        }
        if (typeof point.x !== 'number' || typeof point.y !== 'number') {
          throw new Error(`Heatmap data point at index ${i} is missing x or y coordinates`);
        }
        if (isNaN(point.x) || isNaN(point.y)) {
          throw new Error(`Heatmap data point at index ${i} has invalid x or y coordinates (NaN)`);
        }
        if (typeof point.potential !== 'number') {
          throw new Error(`Heatmap data point at index ${i} is missing potential value`);
        }
        if (isNaN(point.potential)) {
          throw new Error(`Heatmap data point at index ${i} has invalid potential value (NaN)`);
        }
      }
    }
    await job.updateProgress(10);

    const fileName = `report-${Date.now()}.pdf`;
    const filePath = path.join(outputsDir, fileName);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header corporativo
    doc.fontSize(20).text('GROUNDING DESIGN REPORT', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Proyecto: ${projectName || 'Project'}`);
    doc.text(`Cliente: ${clientName || 'Client'}`);
    doc.text(`Ingeniero: ${engineer || 'Engineer'}`);
    doc.moveDown();

    await job.updateProgress(30);

    // Resultados
    doc.fontSize(14).text('Resultados de Cálculo', { underline: true });
    doc.moveDown();
    doc.fontSize(11).text(`Resistencia de Malla (Rg): ${calculations?.Rg || 'N/A'} Ω`);
    doc.text(`Elevación de Potencial (GPR): ${calculations?.GPR || 'N/A'} V`);
    doc.text(`Tensión de Contacto (Em): ${calculations?.Em || 'N/A'} V`);
    doc.text(`Tensión de Paso (Es): ${calculations?.Es || 'N/A'} V`);
    doc.moveDown();

    await job.updateProgress(50);

    // Parámetros
    doc.fontSize(14).text('Parámetros de Diseño', { underline: true });
    doc.moveDown();
    doc.fontSize(11).text(`Longitud de Malla: ${params?.gridLength || 'N/A'} m`);
    doc.text(`Ancho de Malla: ${params?.gridWidth || 'N/A'} m`);
    doc.text(`Número de Varillas: ${params?.numRods || 'N/A'}`);
    doc.text(`Longitud de Varillas: ${params?.rodLength || 'N/A'} m`);
    doc.moveDown();

    await job.updateProgress(70);

    // Heatmap - Generate ETAP-style chart with contours
    if (heatmapData && heatmapData.length > 0) {
      doc.fontSize(14).text('Distribución de Potencial', { underline: true });
      doc.moveDown();

      try {
        if (pdfChartsService.isAvailable()) {
          const chartImage = pdfChartsService.generateHeatmapChart(heatmapData);
          if (chartImage) {
            doc.image(chartImage, {
              fit: [500, 300],
              align: 'center'
            });
          } else {
            doc.fontSize(10).text('Heatmap generation failed - canvas not available');
          }
        } else {
          doc.fontSize(10).text('Heatmap generation disabled - canvas library not installed');
          doc.fontSize(8).text('Install canvas with: npm install canvas (requires native compilation)');
        }
      } catch (chartError) {
        console.error('Failed to generate heatmap chart:', chartError);
        doc.fontSize(10).text('Error generating heatmap chart');
      }
    }

    await job.updateProgress(90);

    doc.end();

    // Wait for stream to finish
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    await job.updateProgress(100);

    // Upload to storage
    let pdfBuffer;
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('PDF file not found after generation');
      }
      pdfBuffer = fs.readFileSync(filePath);
    } catch (readError) {
      console.error('Failed to read PDF file:', readError);
      throw new Error('PDF generation failed - could not read output file');
    }

    const uploadResult = await storageService.uploadPDF(job.id, pdfBuffer, {
      projectName,
      clientName,
      engineer,
      jobId: job.id
    });

    // Check if upload succeeded
    if (!uploadResult || !uploadResult.success) {
      throw new Error('PDF upload failed: ' + (uploadResult?.error || 'Unknown error'));
    }

    // Send email notification
    if (userEmail) {
      try {
        await emailService.sendPDFReady({
          to: userEmail,
          projectName: projectName || 'Project',
          pdfUrl: uploadResult.url,
          jobId: job.id
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the job if email fails
      }
    }

    return {
      success: true,
      downloadUrl: uploadResult.url,
      fileName,
      storageKey: uploadResult.key
    };
  } catch (error) {
    console.error('PDF job processing error:', error);
    throw error;
  } finally {
    // Clean up PDF file after processing (success or failure)
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Failed to clean up PDF file:', cleanupError);
      }
    }
  }
}

/**
 * Process Excel generation job
 * TODO: Implement Excel generation with xlsx library
 */
async function processExcelJob(job) {
  const { jobId, reportData } = job.data;

  try {
    await job.updateProgress(10);

    // TODO: Implement Excel generation
    // const result = await reportService.processExcel(jobId);

    await job.updateProgress(100);

    return {
      success: false,
      error: 'Excel generation not yet implemented',
      jobId
    };
  } catch (error) {
    console.error('Excel job processing error:', error);
    throw error;
  }
}

/**
 * Process batch report job
 * TODO: Implement batch ZIP generation with archiver
 */
async function processBatchJob(job) {
  const { jobId, reportData } = job.data;

  try {
    await job.updateProgress(10);

    // TODO: Implement batch processing
    // const results = [];
    // const reports = reportData.reports || [];

    await job.updateProgress(100);

    return {
      success: false,
      error: 'Batch generation not yet implemented',
      jobId
    };
  } catch (error) {
    console.error('Batch job processing error:', error);
    throw error;
  }
}

/**
 * Create PDF worker
 * @returns {Worker|null} Returns null if Redis is disabled or not connected
 */
function createPDFWorker() {
  if (!queueManager.isAvailable()) {
    console.warn('PDF worker not created - Redis is disabled or not connected');
    return null;
  }

  // Verify connection is actually connected before creating worker
  if (!queueManager.connection || queueManager.connection.status !== 'ready') {
    console.warn('PDF worker not created - Redis connection not in ready state');
    return null;
  }

  const worker = new Worker('pdf', async (job) => {
    if (job.name === 'generate-pdf') {
      return await processPDFJob(job);
    }
    throw new Error(`Unknown job type: ${job.name}`);
  }, {
    connection: queueManager.connection,
    concurrency: 2 // Process 2 PDF jobs concurrently
  });

  worker.on('completed', (job) => {
    console.log(`PDF job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`PDF job ${job?.id} failed:`, err.message);
  });

  pdfWorker = worker;
  return worker;
}

/**
 * Create report worker (legacy)
 * @returns {Worker|null} Returns null if Redis is disabled or not connected
 */
function createReportWorker() {
  if (!queueManager.isAvailable()) {
    console.warn('Report worker not created - Redis is disabled or not connected');
    return null;
  }

  // Verify connection is actually connected before creating worker
  if (!queueManager.connection || queueManager.connection.status !== 'ready') {
    console.warn('Report worker not created - Redis connection not in ready state');
    return null;
  }

  const worker = new Worker('reports', async (job) => {
    if (job.name === 'pdf') {
      return await processPDFJob(job);
    } else if (job.name === 'excel') {
      return await processExcelJob(job);
    } else if (job.name === 'batch') {
      return await processBatchJob(job);
    }
    throw new Error(`Unknown job type: ${job.name}`);
  }, {
    connection: queueManager.connection,
    concurrency: 3 // Process 3 report jobs concurrently
  });

  worker.on('completed', (job) => {
    console.log(`Report job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Report job ${job?.id} failed:`, err.message);
  });

  reportWorker = worker;
  return worker;
}

/**
 * Close all worker instances
 */
async function closeWorkers() {
  if (pdfWorker) {
    await pdfWorker.close();
    pdfWorker = null;
  }
  if (reportWorker) {
    await reportWorker.close();
    reportWorker = null;
  }
}

module.exports = {
  createPDFWorker,
  createReportWorker,
  closeWorkers,
  processPDFJob,
  processExcelJob,
  processBatchJob
};
