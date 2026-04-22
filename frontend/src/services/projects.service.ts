// src/services/projects.service.ts
import { api } from './api';

export interface SoilProfile {
  resistivity: number;
  surfaceResistivity: number;
  surfaceDepth: number;
  moisture?: number;
}

export interface GridDesign {
  length: number;
  width: number;
  depth: number;
  nx: number;
  ny: number;
  rodLength: number;
  numRods: number;
  conductorMaterial: 'copper' | 'aluminum';
  conductorSize: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  voltageLevel: number;
  soilProfile: SoilProfile;
  gridDesign: GridDesign;
  simulationResults?: any;
  complianceStatus?: any;
  status: 'draft' | 'active' | 'archived' | 'compliant' | 'non_compliant';
  createdAt: string;
  updatedAt: string;
}

export const projectsService = {
  async getAll(): Promise<Project[]> {
    const response = await api.get('/projects');
    return response.data;
  },

  async getById(id: string): Promise<Project> {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  async create(data: Partial<Project>): Promise<Project> {
    const response = await api.post('/projects', data);
    return response.data;
  },

  async update(id: string, data: Partial<Project>): Promise<Project> {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  async runSimulation(id: string): Promise<{ simulationId: string; status: string }> {
    const response = await api.post(`/simulation/run/${id}`);
    return response.data;
  },

  async getSimulationStatus(simulationId: string): Promise<any> {
    const response = await api.get(`/simulation/status/${simulationId}`);
    return response.data;
  },
};
