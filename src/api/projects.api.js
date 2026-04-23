/**
 * Projects API for Grounding Designer Pro SaaS
 * Handles all project-related API calls
 */

import api from './client';

export const projectsApi = {
  // Get all projects for current user
  getAll: async () => {
    const response = await api.get('/api/projects');
    return response.data;
  },

  // Get single project by ID
  getById: async (id) => {
    const response = await api.get(`/api/projects/${id}`);
    return response.data;
  },

  // Create new project
  create: async (projectData) => {
    const response = await api.post('/api/projects', projectData);
    return response.data;
  },

  // Update project
  update: async (id, projectData) => {
    const response = await api.put(`/api/projects/${id}`, projectData);
    return response.data;
  },

  // Delete project
  delete: async (id) => {
    const response = await api.delete(`/api/projects/${id}`);
    return response.data;
  },

  // Get project versions
  getVersions: async (projectId) => {
    const response = await api.get(`/api/projects/${projectId}/versions`);
    return response.data;
  },

  // Create new version
  createVersion: async (projectId, versionData) => {
    const response = await api.post(`/api/projects/${projectId}/versions`, versionData);
    return response.data;
  },

  // Compare versions
  compareVersions: async (projectId, version1, version2) => {
    const response = await api.get(`/api/projects/${projectId}/compare`, {
      params: { v1: version1, v2: version2 }
    });
    return response.data;
  }
};

export default projectsApi;
