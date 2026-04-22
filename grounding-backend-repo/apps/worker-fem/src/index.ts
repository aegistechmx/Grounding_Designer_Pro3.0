import { Worker } from 'bullmq';
import { FemEngine } from '@engine/fem';
import { ComplianceEngine } from '@compliance';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const femEngine = new FemEngine();
const complianceEngine = new ComplianceEngine();

const worker = new Worker('fem', async (job) => {
  const { simulationId, projectId, projectData } = job.data;
  
  console.log(`🔹 Procesando simulación ${simulationId}`);
  
  try {
    // 1. Ejecutar FEM
    const simulationResult = await femEngine.solve(projectData);
    
    // 2. Validar cumplimiento
    const compliance = complianceEngine.validate(simulationResult, projectData);
    
    // 3. Combinar resultados
    const results = {
      ...simulationResult,
      compliance,
      timestamp: new Date().toISOString(),
    };
    
    // 4. Guardar en DB
    await prisma.simulation.update({
      where: { id: simulationId },
      data: {
        status: 'completed',
        results,
        completedAt: new Date(),
      },
    });
    
    // 5. Actualizar proyecto
    await prisma.project.update({
      where: { id: projectId },
      data: {
        simulationResults: results,
        complianceStatus: compliance,
        status: compliance.globalCompliant ? 'compliant' : 'non_compliant',
      },
    });
    
    console.log(`✅ Simulación ${simulationId} completada`);
    
    return results;
  } catch (error) {
    console.error(`❌ Error en simulación ${simulationId}:`, error);
    
    await prisma.simulation.update({
      where: { id: simulationId },
      data: {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date(),
      },
    });
    
    throw error;
  }
}, {
  connection: { host: process.env.REDIS_HOST || 'redis', port: 6379 },
  concurrency: 5,
});

console.log('🚀 FEM Worker iniciado');
