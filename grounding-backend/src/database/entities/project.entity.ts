// src/database/entities/project.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Simulation } from './simulation.entity';

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'float', default: 13200 })
  voltageLevel: number;

  @Column({ type: 'jsonb' })
  soilProfile: {
    resistivity: number;
    surfaceResistivity: number;
    surfaceDepth: number;
    moisture?: number;
    layers?: Array<{ depth: number; resistivity: number }>;
  };

  @Column({ type: 'jsonb' })
  gridDesign: {
    length: number;
    width: number;
    depth: number;
    nx: number;
    ny: number;
    rodLength: number;
    numRods: number;
    conductorMaterial: 'copper' | 'aluminum';
    conductorSize: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  simulationResults: {
    Rg: number;
    GPR: number;
    Em: number;
    Es: number;
    touchVoltage?: { value: number; limit: number; safe: boolean };
    stepVoltage?: { value: number; limit: number; safe: boolean };
    voltageField?: number[];
    executionTime?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  complianceStatus: {
    ieee80: { compliant: boolean; violations?: string[] };
    nom001: { compliant: boolean; violations?: string[] };
    cfe: { compliant: boolean; violations?: string[] };
    globalCompliant: boolean;
  };

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.DRAFT })
  status: ProjectStatus;

  @ManyToOne(() => User, user => user.projects)
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => Simulation, simulation => simulation.project)
  simulations: Simulation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
