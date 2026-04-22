// src/modules/simulation/simulation.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Simulation, SimulationStatus } from '../../database/entities/simulation.entity';
import { Project } from '../../database/entities/project.entity';

@Injectable()
export class SimulationService {
  private readonly logger = new Logger(SimulationService.name);

  constructor(
    @InjectQueue('fem') private femQueue: Queue,
    @InjectRepository(Simulation)
    private simulationRepository: Repository<Simulation>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async enqueueFEMSimulation(projectId: string, userId: string): Promise<Simulation> {
    // Crear registro de simulación
    const simulation = this.simulationRepository.create({
      projectId,
      userId,
      status: SimulationStatus.QUEUED,
      startedAt: new Date(),
    });
    
    await this.simulationRepository.save(simulation);
    
    // Agregar a cola BullMQ
    const job = await this.femQueue.add('fem-simulation', {
      simulationId: simulation.id,
      projectId,
      userId,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
    
    this.logger.log(`Simulación ${simulation.id} encolada con job ${job.id}`);
    
    return simulation;
  }

  async getSimulationStatus(simulationId: string): Promise<Simulation> {
    return this.simulationRepository.findOne({
      where: { id: simulationId },
      relations: ['project'],
    });
  }

  async updateSimulationResults(simulationId: string, results: any): Promise<void> {
    await this.simulationRepository.update(simulationId, {
      status: SimulationStatus.COMPLETED,
      results,
      completedAt: new Date(),
    });
    
    // Actualizar proyecto con resultados
    const simulation = await this.simulationRepository.findOne({
      where: { id: simulationId },
    });
    
    if (simulation) {
      await this.projectRepository.update(simulation.projectId, {
        simulationResults: results,
      });
    }
  }

  async markSimulationFailed(simulationId: string, error: string): Promise<void> {
    await this.simulationRepository.update(simulationId, {
      status: SimulationStatus.FAILED,
      errorMessage: error,
      completedAt: new Date(),
    });
  }

  async getUserSimulations(userId: string, limit = 50, offset = 0): Promise<[Simulation[], number]> {
    return this.simulationRepository.findAndCount({
      where: { userId },
      relations: ['project'],
      order: { startedAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
