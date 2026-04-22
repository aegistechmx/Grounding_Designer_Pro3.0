import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SimulationService {
  private readonly logger = new Logger(SimulationService.name);

  constructor(
    @InjectQueue('fem') private femQueue: Queue,
    @InjectQueue('ai') private aiQueue: Queue,
    @InjectQueue('optimization') private optQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async runFEMSimulation(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Proyecto no encontrado');
    }

    const simulation = await this.prisma.simulation.create({
      data: {
        projectId,
        userId,
        status: 'queued',
      },
    });

    const job = await this.femQueue.add('fem-simulation', {
      simulationId: simulation.id,
      projectId,
      projectData: project,
    });

    this.logger.log(`Simulación ${simulation.id} encolada con job ${job.id}`);

    return { simulationId: simulation.id, jobId: job.id };
  }

  async getSimulationStatus(simulationId: string) {
    return this.prisma.simulation.findUnique({
      where: { id: simulationId },
      include: { project: true },
    });
  }

  async updateSimulationResult(simulationId: string, results: any) {
    const simulation = await this.prisma.simulation.update({
      where: { id: simulationId },
      data: {
        status: 'completed',
        results,
        completedAt: new Date(),
      },
    });

    // Actualizar compliance del proyecto
    if (results.compliance) {
      await this.prisma.project.update({
        where: { id: simulation.projectId },
        data: {
          complianceStatus: results.compliance,
          status: results.compliance.globalCompliant ? 'compliant' : 'non_compliant',
        },
      });
    }

    return simulation;
  }

  async markSimulationFailed(simulationId: string, error: string) {
    return this.prisma.simulation.update({
      where: { id: simulationId },
      data: {
        status: 'failed',
        errorMessage: error,
        completedAt: new Date(),
      },
    });
  }

  async runAIDesign(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    const job = await this.aiQueue.add('ai-design', {
      projectId,
      projectData: project,
    });

    return { jobId: job.id };
  }

  async runOptimization(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    const job = await this.optQueue.add('optimize', {
      projectId,
      projectData: project,
    });

    return { jobId: job.id };
  }
}
