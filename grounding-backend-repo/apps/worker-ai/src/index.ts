import { Worker } from 'bullmq';
import { AIDesigner } from '@ai/designer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const aiDesigner = new AIDesigner();

const worker = new Worker('ai', async (job) => {
  const { projectId, projectData } = job.data;
  
  console.log(`🧠 Ejecutando diseño IA para proyecto ${projectId}`);
  
  try {
    const design = await aiDesigner.generateDesign(projectData);
    
    await prisma.project.update({
      where: { id: projectId },
      data: {
        gridDesign: design.grid,
      },
    });
    
    console.log(`✅ Diseño IA completado para proyecto ${projectId}`);
    
    return design;
  } catch (error) {
    console.error(`❌ Error en diseño IA para proyecto ${projectId}:`, error);
    throw error;
  }
}, {
  connection: { host: process.env.REDIS_HOST || 'redis', port: 6379 },
  concurrency: 3,
});

console.log('🚀 AI Worker iniciado');
