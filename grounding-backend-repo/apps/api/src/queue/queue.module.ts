import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

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
  exports: [BullModule],
})
export class QueueModule {}
