// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { User } from './database/entities/user.entity';
import { Project } from './database/entities/project.entity';
import { Simulation } from './database/entities/simulation.entity';
import { SimulationModule } from './modules/simulation/simulation.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { ComplianceModule } from './modules/compliance/compliance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        entities: [User, Project, Simulation],
        synchronize: config.get<string>('nodeEnv') === 'development',
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
        },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    AuthModule,
    SimulationModule,
    ComplianceModule,
    BillingModule,
  ],
})
export class AppModule {}
