/**
 * Report Service
 * Handles PDF, Excel, and DXF report generation
 * Heavy computation - should run in worker/job queue
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class ReportService {
  /**
   * Generate PDF report (heavy task)
   * Returns job ID for async processing
   */
  async generatePDF(reportData) {
    const jobId = `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save report data to file for worker to process
    const dataPath = path.join(__dirname, '../jobs/reports', `${jobId}.json`);
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, JSON.stringify(reportData));
    
    return {
      jobId,
      status: 'pending',
      message: 'PDF generation queued for processing'
    };
  }

  /**
   * Generate Excel report
   */
  async generateExcel(reportData) {
    const jobId = `excel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save report data to file for worker to process
    const dataPath = path.join(__dirname, '../jobs/reports', `${jobId}.json`);
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, JSON.stringify(reportData));
    
    return {
      jobId,
      status: 'pending',
      message: 'Excel generation queued for processing'
    };
  }

  /**
   * Generate DXF export
   */
  async generateDXF(reportData) {
    const jobId = `dxf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save report data to file for worker to process
    const dataPath = path.join(__dirname, '../jobs/reports', `${jobId}.json`);
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, JSON.stringify(reportData));
    
    return {
      jobId,
      status: 'pending',
      message: 'DXF generation queued for processing'
    };
  }

  /**
   * Batch generate multiple reports (ZIP)
   */
  async batchGenerate(reportData) {
    const jobId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save report data to file for worker to process
    const dataPath = path.join(__dirname, '../jobs/reports', `${jobId}.json`);
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, JSON.stringify(reportData));
    
    return {
      jobId,
      status: 'pending',
      message: 'Batch report generation queued for processing'
    };
  }

  /**
   * Process PDF generation (called by worker)
   */
  async processPDF(jobId) {
    const dataPath = path.join(__dirname, '../jobs/reports', `${jobId}.json`);
    
    try {
      const reportData = JSON.parse(await fs.readFile(dataPath, 'utf8'));
      
      // Save heatmap image
      if (reportData.heatmap) {
        const base64Data = reportData.heatmap.replace(/^data:image\/png;base64,/, "");
        const heatmapPath = path.join(__dirname, '../jobs/reports', `${jobId}_heatmap.png`);
        await fs.writeFile(heatmapPath, base64Data, "base64");
        reportData.heatmapPath = heatmapPath;
      }
      
      // Run Python PDF generator
      const pythonScript = path.join(__dirname, '../workers/reports/generate_pdf.py');
      
      return new Promise((resolve, reject) => {
        exec(`python "${pythonScript}" "${dataPath}"`, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            const pdfPath = path.join(__dirname, '../jobs/reports/results', `${jobId}.pdf`);
            resolve({ pdfPath, jobId });
          }
        });
      });
    } catch (error) {
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  /**
   * Process Excel generation (called by worker)
   */
  async processExcel(jobId) {
    const dataPath = path.join(__dirname, '../jobs/reports', `${jobId}.json`);
    
    try {
      const reportData = JSON.parse(await fs.readFile(dataPath, 'utf8'));
      
      // Run Python Excel generator
      const pythonScript = path.join(__dirname, '../workers/reports/generate_excel.py');
      
      return new Promise((resolve, reject) => {
        exec(`python "${pythonScript}" "${dataPath}"`, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            const excelPath = path.join(__dirname, '../jobs/reports/results', `${jobId}.xlsx`);
            resolve({ excelPath, jobId });
          }
        });
      });
    } catch (error) {
      throw new Error(`Excel processing failed: ${error.message}`);
    }
  }

  /**
   * Get report job status
   */
  async getJobStatus(jobId) {
    const dataPath = path.join(__dirname, '../jobs/reports', `${jobId}.json`);
    const resultPath = path.join(__dirname, '../jobs/reports/results', `${jobId}.pdf`);
    
    try {
      await fs.access(resultPath);
      return {
        status: 'completed',
        jobId,
        resultPath
      };
    } catch {
      try {
        await fs.access(dataPath);
        return {
          status: 'processing',
          jobId
        };
      } catch {
        return {
          status: 'not_found',
          jobId
        };
      }
    }
  }

  /**
   * Download generated report
   */
  async downloadReport(jobId, format = 'pdf') {
    const resultPath = path.join(__dirname, '../jobs/reports/results', `${jobId}.${format}`);
    
    try {
      const data = await fs.readFile(resultPath);
      return data;
    } catch (error) {
      throw new Error(`Report not found: ${error.message}`);
    }
  }
}

module.exports = new ReportService();
