import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('simulation')
@UseGuards(JwtAuthGuard)
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Post('run/:projectId')
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  async runSimulation(@Param('projectId') projectId: string, @Req() req) {
    return this.simulationService.runFEMSimulation(projectId, req.user.id);
  }

  @Get('status/:simulationId')
  async getStatus(@Param('simulationId') simulationId: string) {
    return this.simulationService.getSimulationStatus(simulationId);
  }

  @Post('ai/:projectId')
  async runAIDesign(@Param('projectId') projectId: string) {
    return this.simulationService.runAIDesign(projectId);
  }

  @Post('optimize/:projectId')
  async runOptimization(@Param('projectId') projectId: string) {
    return this.simulationService.runOptimization(projectId);
  }
}
