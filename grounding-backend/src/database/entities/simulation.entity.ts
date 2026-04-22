// src/database/entities/simulation.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Project } from './project.entity';
import { User } from './user.entity';

export enum SimulationStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('simulations')
export class Simulation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, project => project.simulations)
  project: Project;

  @Column()
  projectId: string;

  @ManyToOne(() => User, user => user.simulations)
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: SimulationStatus, default: SimulationStatus.QUEUED })
  status: SimulationStatus;

  @Column({ type: 'jsonb', nullable: true })
  results: any;

  @Column({ type: 'float', nullable: true })
  executionTime: number;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}
