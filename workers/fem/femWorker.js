// workers/fem/femWorker.js
// Worker de simulación FEM escalable

const { Worker } = require('bullmq');
const Redis = require('ioredis');
const logger = require('../../backend/services/logger.service');

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

// Import engines
const { FEMEngine } = require('../../src/engine/fem/core/FEMEngine.js');
const { ComplianceEngine } = require('../../src/engine/standards/ComplianceEngine.js');

const femWorker = new Worker('fem-simulations', async (job) => {
  const { projectId, projectData, userId } = job.data;
  
  logger.info(`Iniciando simulación FEM para proyecto ${projectId}`);
  
  try {
    // Configurar engine
    const femEngine = new FEMEngine({
      verbose: false,
      solverType: 'cg',
      tolerance: 1e-6,
      maxIterations: 1000
    });
    
    const complianceEngine = new ComplianceEngine({
      standards: ['NOM-001', 'CFE', 'IEEE80']
    });
    
    // Ejecutar simulación
    const simulation = await femEngine.solve(projectData);
    const compliance = complianceEngine.validate(simulation, projectData);
    
    const results = {
      projectId,
      simulation,
      compliance,
      completedAt: new Date().toISOString(),
      executionTime: simulation?.totalTime || 0
    };
    
    logger.info(`Simulación completada para proyecto ${projectId} en ${simulation?.totalTime || 0}ms`);
    
    // Actualizar proyecto en DB
    await updateProjectResults(projectId, results);
    
    return results;
  } catch (error) {
    logger.error(`Error en simulación FEM: ${error.message}`);
    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: 5, // Procesar 5 simulaciones simultáneas
});

logger.info('✅ FEM Worker iniciado y escuchando');

// Helper function to update project results
async function updateProjectResults(projectId, results) {
  const Project = require('../../backend/models/Project');
  const project = await Project.findById(projectId);
  if (project) {
    await project.update({
      simulationResults: results,
      simulationStatus: 'completed'
    });
  }
}
