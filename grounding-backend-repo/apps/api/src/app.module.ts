import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SimulationModule } from './modules/simulation/simulation.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      },
    }),
    PrismaModule,
    ProjectsModule,
    SimulationModule,
    ComplianceModule,
    AuthModule,
    BillingModule,
    QueueModule,
  ],
})
export class AppModule {}
