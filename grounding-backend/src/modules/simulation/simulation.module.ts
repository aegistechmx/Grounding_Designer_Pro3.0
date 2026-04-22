// src/modules/simulation/simulation.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { SimulationService } from './simulation.service';
import { SimulationController } from './simulation.controller';
import { Simulation } from '../../database/entities/simulation.entity';
import { Project } from '../../database/entities/project.entity';
import { FEMWorker } from '../../workers/fem.worker';
import { ComplianceModule } from '../compliance/compliance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Simulation, Project]),
    BullModule.registerQueue({
      name: 'fem',
    }),
    ComplianceModule,
  ],
  controllers: [SimulationController],
  providers: [SimulationService, FEMWorker],
  exports: [SimulationService],
})
export class SimulationModule {}
