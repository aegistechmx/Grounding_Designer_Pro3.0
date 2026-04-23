/**
 * FEM Simulation Service
 * Finite Element Method simulation for detailed voltage distribution
 * Heavy computation - should run in worker/job queue
 * Now integrated with ETAP Engine v2 sparse solver
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs/promises');

// Import ETAP Engine v2 sparse solver
let solveSparseFEM;
try {
  const sparseSolver = require('../../src/engine/fem/sparseSolver.js');
  solveSparseFEM = sparseSolver.solveSparseFEM;
  console.log('[FEM Service] ETAP Engine v2 sparse solver loaded');
} catch (error) {
  console.warn('[FEM Service] ETAP Engine v2 sparse solver not available, using fallback:', error.message);
}

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
   * Now uses ETAP Engine v2 sparse solver if available
   */
  async processFEM(jobId) {
    const paramsPath = path.join(__dirname, '../jobs/fem', `${jobId}.json`);
    
    try {
      const params = JSON.parse(await fs.readFile(paramsPath, 'utf8'));
      
      console.log('[FEM Service] Processing FEM simulation with ETAP Engine v2');
      
      // Try to use ETAP Engine v2 sparse solver
      if (solveSparseFEM) {
        try {
          const { generateIEEE80Mesh } = require('../src/engine/mesh/ieeeMesh.js');
          
          // Generate mesh
          const mesh = generateIEEE80Mesh(params.grid, params.meshResolution || 70);
          console.log('[FEM Service] Mesh generated:', mesh.nodes.length, 'nodes');
          
          // Build system
          const system = {
            nodes: mesh.nodes,
            elements: mesh.elements,
            conductivity: params.conductivity || 0.01,
            boundary: params.boundary || { type: 'ground', nodes: [] },
            sources: params.sources || []
          };
          
          // Solve with sparse solver
          const solution = await solveSparseFEM(system, {
            tolerance: params.tolerance || 1e-6,
            maxIterations: params.maxIterations || 1000
          });
          
          console.log('[FEM Service] Sparse solver completed, convergence:', solution.convergence);
          
          return {
            success: true,
            method: 'etap_sparse',
            solution,
            mesh: {
              nodes: mesh.nodes.length,
              elements: mesh.elements.length
            }
          };
        } catch (sparseError) {
          console.warn('[FEM Service] Sparse solver failed, falling back to Python:', sparseError.message);
        }
      }
      
      // Fallback to Python FEM solver
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
