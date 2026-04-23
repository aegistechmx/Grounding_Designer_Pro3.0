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

const defaultSoilProfile: SoilProfile = {
  resistivity: 100,
  surfaceResistivity: 3000,
  surfaceDepth: 0.1,
  moisture: 0.25,
};

const defaultGridDesign: GridDesign = {
  length: 12.5,
  width: 8,
  depth: 0.6,
  nx: 8,
  ny: 8,
  rodLength: 3,
  numRods: 16,
  conductorMaterial: 'copper',
  conductorSize: '4/0',
};

export const projectsService = {
  async getAll(): Promise<Project[]> {
    const response = await api.get('/projects');
    return (response.data.projects || response.data || []).map(normalizeProject);
  },

  async getById(id: string): Promise<Project> {
    const response = await api.get(`/projects/${id}`);
    return normalizeProject(response.data.project || response.data);
  },

  async create(data: Partial<Project>): Promise<Project> {
    const payload = serializeProjectPayload(data);
    const response = await api.post('/projects', payload);
    return normalizeProject(response.data.project || response.data);
  },

  async update(id: string, data: Partial<Project>): Promise<Project> {
    const payload = serializeProjectPayload(data);
    const response = await api.put(`/projects/${id}`, payload);
    return normalizeProject(response.data.project || response.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  async runSimulation(id: string): Promise<{ simulationId: string; status: string }> {
    const response = await api.post('/simulation/fem', { projectId: id });
    return {
      simulationId: response.data.jobId,
      status: response.data.status,
    };
  },

  async getSimulationStatus(simulationId: string): Promise<any> {
    const response = await api.get(`/simulation/jobs/${simulationId}`);
    const status = response.data.status || response.data;

    return {
      ...status,
      progress: typeof status.progress === 'number'
        ? (status.progress > 1 ? status.progress / 100 : status.progress)
        : 0,
      results: status.result?.result || status.results || null,
      error: status.failedReason || status.error || null,
    };
  },
};

function normalizeProject(project: any): Project {
  const metadata = extractMetadata(project?.description);
  const soilProfile = metadata.soilProfile || defaultSoilProfile;
  const gridDesign = metadata.gridDesign || defaultGridDesign;
  const voltageLevel = metadata.voltageLevel || 13200;
  const complianceStatus = metadata.complianceStatus || null;
  const status = metadata.status || (project?.is_active ? 'active' : 'draft');

  return {
    id: project.id,
    name: project.name || 'Proyecto sin nombre',
    description: metadata.description || project.description || '',
    voltageLevel,
    soilProfile,
    gridDesign,
    simulationResults: metadata.simulationResults,
    complianceStatus,
    status,
    createdAt: project.createdAt || project.created_at || new Date().toISOString(),
    updatedAt: project.updatedAt || project.updated_at || project.created_at || new Date().toISOString(),
  };
}

function serializeProjectPayload(data: Partial<Project>) {
  const metadata = {
    description: data.description || '',
    voltageLevel: data.voltageLevel || 13200,
    soilProfile: data.soilProfile || defaultSoilProfile,
    gridDesign: data.gridDesign || defaultGridDesign,
    simulationResults: data.simulationResults,
    complianceStatus: data.complianceStatus,
    status: data.status || 'active',
  };

  return {
    name: data.name,
    description: `[PROJECT_META]${JSON.stringify(metadata)}`,
    location: 'N/A',
    clientName: 'N/A',
  };
}

function extractMetadata(description: string | undefined) {
  if (!description) {
    return {};
  }

  const prefix = '[PROJECT_META]';
  if (!description.startsWith(prefix)) {
    return { description };
  }

  try {
    const parsed = JSON.parse(description.slice(prefix.length));
    return parsed && typeof parsed === 'object' ? parsed : { description };
  } catch {
    return { description };
  }
}
