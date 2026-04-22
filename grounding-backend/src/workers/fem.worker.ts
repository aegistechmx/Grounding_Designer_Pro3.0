// src/workers/fem.worker.ts
import { Processor, WorkerHost } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { SimulationService } from '../modules/simulation/simulation.service';
import { ComplianceService } from '../modules/compliance/compliance.service';

@Processor('fem')
export class FEMWorker extends WorkerHost {
  private readonly logger = new Logger(FEMWorker.name);

  constructor(
    private simulationService: SimulationService,
    private complianceService: ComplianceService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { simulationId, projectId, userId } = job.data;
    
    this.logger.log(`Procesando simulación ${simulationId} para proyecto ${projectId}`);
    
    try {
      // 1. Obtener datos del proyecto
      const projectData = await this.getProjectData(projectId);
      
      // 2. Ejecutar simulación FEM (Simulado para este ejemplo)
      // En una implementación real, aquí llamaríamos a FEMEngine
      const simulationResult = {
        Rg: 4.5,
        GPR: 1200,
        touchVoltage: 180,
        stepVoltage: 90,
      };
      
      // 3. Validar cumplimiento normativo
      const compliance = await this.complianceService.validate(simulationResult, projectData);
      
      // 4. Combinar resultados
      const results = {
        ...simulationResult,
        compliance,
        executedAt: new Date().toISOString(),
      };
      
      // 5. Guardar resultados
      await this.simulationService.updateSimulationResults(simulationId, results);
      
      this.logger.log(`Simulación ${simulationId} completada exitosamente`);
      
      return results;
    } catch (error) {
      this.logger.error(`Error en simulación ${simulationId}: ${error.message}`);
      await this.simulationService.markSimulationFailed(simulationId, error.message);
      throw error;
    }
  }

  private async getProjectData(projectId: string): Promise<any> {
    // Aquí iría la lógica para obtener el proyecto de la DB
    // Por ahora retornamos un objeto simulado
    return {
      voltageLevel: 13200,
      faultDuration: 0.5,
      soilProfile: {
        resistivity: 100,
        surfaceResistivity: 3000,
        surfaceDepth: 0.1,
        moisture: 0.25,
      },
    };
  }
}
