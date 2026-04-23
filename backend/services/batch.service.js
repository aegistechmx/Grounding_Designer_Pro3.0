/**
 * Batch Export Service
 * Handles multi-export functionality (ZIP generation)
 */

const archiver = require('archiver');
const fs = require('fs').promises;
const path = require('path');
const storageService = require('./storage.service');

class BatchService {
  /**
   * Create ZIP file from multiple files
   */
  async createZip(files, zipName) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(process.cwd(), 'jobs', 'reports', 'results', zipName);
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        resolve({
          success: true,
          path: outputPath,
          size: archive.pointer()
        });
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Add files to archive
      files.forEach(file => {
        if (file.buffer) {
          archive.append(file.buffer, { name: file.name });
        } else if (file.path) {
          archive.file(file.path, { name: file.name });
        }
      });

      archive.finalize();
    });
  }

  /**
   * Generate batch reports for a project
   */
  async generateProjectReports(projectId, reportTypes = ['pdf', 'excel']) {
    const files = [];
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'grounding_saas',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    });

    try {
      // Get project simulations
      const simulationsResult = await pool.query(
        'SELECT * FROM simulations WHERE project_id = $1 ORDER BY version_number DESC',
        [projectId]
      );

      for (const simulation of simulationsResult.rows) {
        if (reportTypes.includes('pdf')) {
          // Generate PDF
          const pdfBuffer = await this.generatePDF(simulation);
          files.push({
            name: `simulation_${simulation.version_number}.pdf`,
            buffer: pdfBuffer
          });
        }

        if (reportTypes.includes('excel')) {
          // Generate Excel
          const excelBuffer = await this.generateExcel(simulation);
          files.push({
            name: `simulation_${simulation.version_number}.xlsx`,
            buffer: excelBuffer
          });
        }
      }

      // Create ZIP
      const zipName = `project_${projectId}_reports.zip`;
      const zipResult = await this.createZip(files, zipName);

      // Upload to storage
      const zipBuffer = await fs.readFile(zipResult.path);
      const uploadResult = await storageService.uploadBatch(projectId, zipBuffer, {
        projectId,
        reportTypes: reportTypes.join(','),
        fileCount: files.length
      });

      // Clean up local file
      await fs.unlink(zipResult.path);

      return {
        success: true,
        zipKey: uploadResult.key,
        url: uploadResult.url,
        fileCount: files.length,
        size: zipResult.size
      };
    } catch (error) {
      console.error('Batch generation error:', error);
      throw new Error(`Failed to generate batch reports: ${error.message}`);
    }
  }

  /**
   * Generate PDF for simulation
   */
  async generatePDF(simulation) {
    // This would call the report service to generate PDF
    // For now, return a placeholder
    const reportService = require('./report.service');
    const result = await reportService.processPDF(simulation.id);
    const pdfBuffer = await fs.readFile(result.pdfPath);
    return pdfBuffer;
  }

  /**
   * Generate Excel for simulation
   */
  async generateExcel(simulation) {
    // This would call the report service to generate Excel
    // For now, return a placeholder
    const reportService = require('./report.service');
    const result = await reportService.processExcel(simulation.id);
    const excelBuffer = await fs.readFile(result.excelPath);
    return excelBuffer;
  }

  /**
   * Generate comparison report between versions
   */
  async generateComparisonReport(projectId, version1, version2) {
    const versionService = require('./version.service');
    const comparison = await versionService.compareVersions(projectId, version1, version2);

    // Create comparison data files
    const files = [
      {
        name: 'comparison.json',
        buffer: Buffer.from(JSON.stringify(comparison, null, 2))
      },
      {
        name: 'version1.json',
        buffer: Buffer.from(JSON.stringify(comparison.version1, null, 2))
      },
      {
        name: 'version2.json',
        buffer: Buffer.from(JSON.stringify(comparison.version2, null, 2))
      }
    ];

    // Create ZIP
    const zipName = `comparison_${projectId}_v${version1}_v${version2}.zip`;
    const zipResult = await this.createZip(files, zipName);

    // Upload to storage
    const zipBuffer = await fs.readFile(zipResult.path);
    const uploadResult = await storageService.uploadBatch(
      `comparison_${projectId}`,
      zipBuffer,
      { projectId, version1, version2 }
    );

    // Clean up local file
    await fs.unlink(zipResult.path);

    return {
      success: true,
      zipKey: uploadResult.key,
      url: uploadResult.url,
      comparison
    };
  }

  /**
   * Export all project data
   */
  async exportProjectData(projectId) {
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'grounding_saas',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    });

    try {
      // Get project data
      const projectResult = await pool.query(
        'SELECT * FROM projects WHERE id = $1',
        [projectId]
      );

      // Get simulations
      const simulationsResult = await pool.query(
        'SELECT * FROM simulations WHERE project_id = $1',
        [projectId]
      );

      // Get versions
      const versionsResult = await pool.query(
        `SELECT pv.*, s.params, s.results 
         FROM project_versions pv
         JOIN simulations s ON pv.simulation_id = s.id
         WHERE pv.project_id = $1`,
        [projectId]
      );

      // Create export files
      const files = [
        {
          name: 'project.json',
          buffer: Buffer.from(JSON.stringify(projectResult.rows[0], null, 2))
        },
        {
          name: 'simulations.json',
          buffer: Buffer.from(JSON.stringify(simulationsResult.rows, null, 2))
        },
        {
          name: 'versions.json',
          buffer: Buffer.from(JSON.stringify(versionsResult.rows, null, 2))
        }
      ];

      // Create ZIP
      const zipName = `project_export_${projectId}.zip`;
      const zipResult = await this.createZip(files, zipName);

      // Upload to storage
      const zipBuffer = await fs.readFile(zipResult.path);
      const uploadResult = await storageService.uploadBatch(
        `export_${projectId}`,
        zipBuffer,
        { projectId, exportType: 'full' }
      );

      // Clean up local file
      await fs.unlink(zipResult.path);

      return {
        success: true,
        zipKey: uploadResult.key,
        url: uploadResult.url
      };
    } catch (error) {
      console.error('Project export error:', error);
      throw new Error(`Failed to export project data: ${error.message}`);
    }
  }
}

module.exports = new BatchService();
