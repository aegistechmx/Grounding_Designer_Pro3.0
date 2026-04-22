import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SimulationService } from './simulation.service';
import { SimulationController } from './simulation.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'fem',
    }),
    BullModule.registerQueue({
      name: 'ai',
    }),
    BullModule.registerQueue({
      name: 'optimization',
    }),
  ],
  controllers: [SimulationController],
  providers: [SimulationService],
  exports: [SimulationService],
})
export class SimulationModule {}
