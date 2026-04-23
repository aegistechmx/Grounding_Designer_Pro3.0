/**
 * FEM Simulation Service
 * Finite Element Method simulation for detailed voltage distribution
 * Heavy computation - should run in worker/job queue
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class FEMService {
  /**
   * Run FEM simulation (heavy task)
   * Returns job ID for async processing
   */
  async runFEM(params) {
    // This should be called via job queue
    // For now, return a placeholder
    
    const jobId = `fem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save params to file for worker to process
    const paramsPath = path.join(__dirname, '../jobs/fem', `${jobId}.json`);
    await fs.mkdir(path.dirname(paramsPath), { recursive: true });
    await fs.writeFile(paramsPath, JSON.stringify(params));
    
    return {
      jobId,
      status: 'pending',
      message: 'FEM simulation queued for processing'
    };
  }

  /**
   * Process FEM simulation (called by worker)
   */
  async processFEM(jobId) {
    const paramsPath = path.join(__dirname, '../jobs/fem', `${jobId}.json`);
    
    try {
      const params = JSON.parse(await fs.readFile(paramsPath, 'utf8'));
      
      // Run Python FEM solver
      const pythonScript = path.join(__dirname, '../workers/fem/femSolver.py');
      
      return new Promise((resolve, reject) => {
        exec(`python "${pythonScript}" "${paramsPath}"`, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            try {
              const result = JSON.parse(stdout);
              resolve(result);
            } catch (e) {
              reject(e);
            }
          }
        });
      });
    } catch (error) {
      throw new Error(`FEM processing failed: ${error.message}`);
    }
  }

  /**
   * Get FEM simulation result
   */
  async getResult(jobId) {
    const resultPath = path.join(__dirname, '../jobs/fem/results', `${jobId}.json`);
    
    try {
      const result = JSON.parse(await fs.readFile(resultPath, 'utf8'));
      return result;
    } catch (error) {
      throw new Error(`FEM result not found: ${error.message}`);
    }
  }

  /**
   * Get FEM simulation status
   */
  async getStatus(jobId) {
    const paramsPath = path.join(__dirname, '../jobs/fem', `${jobId}.json`);
    const resultPath = path.join(__dirname, '../jobs/fem/results', `${jobId}.json`);
    
    try {
      await fs.access(resultPath);
      return {
        status: 'completed',
        jobId
      };
    } catch {
      try {
        await fs.access(paramsPath);
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
}

module.exports = new FEMService();
