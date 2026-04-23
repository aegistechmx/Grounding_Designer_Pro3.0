/**
 * Report Job Processor
 * Handles PDF, Excel, and DXF generation jobs in the queue
 * Integrates with storage service for cloud upload
 * Sends email notifications when jobs complete
 */

const { Worker } = require('bullmq');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const storageService = require('../../services/storage.service');
const emailService = require('../../services/notification/email.service');
const pdfChartsService = require('../../services/pdfCharts.service');

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined
});

// Ensure outputs directory exists
const outputsDir = path.join(__dirname, '../../outputs');
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
}

/**
 * Process PDF generation job with pdfkit
 */
async function processPDFJob(job) {
  const { calculations, params, heatmapData, projectName, clientName, engineer } = job.data;

  try {
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
    const pdfBuffer = fs.readFileSync(filePath);
    const uploadResult = await storageService.uploadPDF(job.id, pdfBuffer, {
      projectName,
      clientName,
      engineer,
      jobId: job.id
    });

    // Send email notification
    if (job.data.userEmail) {
      try {
        await emailService.sendPDFReady({
          to: job.data.userEmail,
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
 */
function createPDFWorker() {
  const worker = new Worker('pdf', async (job) => {
    if (job.name === 'generate-pdf') {
      return await processPDFJob(job);
    }
    throw new Error(`Unknown job type: ${job.name}`);
  }, {
    connection,
    concurrency: 2 // Process 2 PDF jobs concurrently
  });

  worker.on('completed', (job) => {
    console.log(`PDF job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`PDF job ${job?.id} failed:`, err.message);
  });

  return worker;
}

/**
 * Create report worker (legacy)
 */
function createReportWorker() {
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
    connection,
    concurrency: 3 // Process 3 report jobs concurrently
  });

  worker.on('completed', (job) => {
    console.log(`Report job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Report job ${job?.id} failed:`, err.message);
  });

  return worker;
}

module.exports = {
  createPDFWorker,
  createReportWorker,
  processPDFJob,
  processExcelJob,
  processBatchJob
};
