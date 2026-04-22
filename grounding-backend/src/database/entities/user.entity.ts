// src/database/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Project } from './project.entity';
import { Simulation } from './simulation.entity';

export enum UserRole {
  ENGINEER = 'engineer',
  SENIOR_ENGINEER = 'senior_engineer',
  ADMIN = 'admin',
  COMPANY_OWNER = 'company_owner',
}

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ENGINEER })
  role: UserRole;

  @Column({ type: 'enum', enum: SubscriptionTier, default: SubscriptionTier.FREE })
  subscriptionTier: SubscriptionTier;

  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  stripeSubscriptionId: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Project, project => project.user)
  projects: Project[];

  @OneToMany(() => Simulation, simulation => simulation.user)
  simulations: Simulation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
