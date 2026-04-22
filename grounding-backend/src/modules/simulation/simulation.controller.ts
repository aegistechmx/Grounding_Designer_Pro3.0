// src/modules/simulation/simulation.controller.ts
import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('simulation')
@UseGuards(JwtAuthGuard)
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Post('run/:projectId')
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 por hora
  async runSimulation(@Param('projectId') projectId: string, @Req() req) {
    const simulation = await this.simulationService.enqueueFEMSimulation(
      projectId,
      req.user.id,
    );
    
    return {
      simulationId: simulation.id,
      status: simulation.status,
      message: 'Simulación encolada exitosamente',
    };
  }

  @Get('status/:simulationId')
  async getSimulationStatus(@Param('simulationId') simulationId: string) {
    const simulation = await this.simulationService.getSimulationStatus(simulationId);
    
    return {
      id: simulation.id,
      status: simulation.status,
      results: simulation.results,
      error: simulation.errorMessage,
      startedAt: simulation.startedAt,
      completedAt: simulation.completedAt,
    };
  }

  @Get('user/history')
  async getUserSimulations(@Req() req) {
    const [simulations, total] = await this.simulationService.getUserSimulations(
      req.user.id,
      50,
      0,
    );
    
    return { total, simulations };
  }
}
