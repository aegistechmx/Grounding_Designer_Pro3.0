import { Worker } from 'bullmq';
import { NSGA2Optimizer } from '@optimization';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const optimizer = new NSGA2Optimizer();

const worker = new Worker('optimization', async (job) => {
  const { projectId, projectData } = job.data;
  
  console.log(`⚡ Ejecutando optimización NSGA-II para proyecto ${projectId}`);
  
  try {
    const optimized = await optimizer.optimize(projectData);
    
    await prisma.project.update({
      where: { id: projectId },
      data: {
        gridDesign: optimized.grid,
      },
    });
    
    console.log(`✅ Optimización completada para proyecto ${projectId}`);
    
    return optimized;
  } catch (error) {
    console.error(`❌ Error en optimización para proyecto ${projectId}:`, error);
    throw error;
  }
}, {
  connection: { host: process.env.REDIS_HOST || 'redis', port: 6379 },
  concurrency: 2,
});

console.log('🚀 Optimizer Worker iniciado');
