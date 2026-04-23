/**
 * Simulation API for Grounding Designer Pro SaaS
 * Handles all simulation-related API calls
 */

import api from './client';

export const simulationApi = {
  // Run IEEE 80 simulation
  runIEEE80: async (simulationData) => {
    const response = await api.post('/api/simulation/ieee80', simulationData);
    return response.data;
  },

  // Run FEM simulation (heavy task - returns job ID)
  runFEM: async (simulationData) => {
    const response = await api.post('/api/simulation/fem', simulationData);
    return response.data; // Returns { jobId: '...' }
  },

  // Get simulation job status
  getJobStatus: async (jobId) => {
    const response = await api.get(`/api/simulation/jobs/${jobId}`);
    return response.data; // Returns { status: 'pending'|'processing'|'completed'|'failed', result: {...} }
  },

  // Get simulation result by ID
  getResult: async (resultId) => {
    const response = await api.get(`/api/simulation/results/${resultId}`);
    return response.data;
  },

  // Run sensitivity analysis
  runSensitivityAnalysis: async (simulationData) => {
    const response = await api.post('/api/simulation/sensitivity', simulationData);
    return response.data;
  },

  // Run optimization
  runOptimization: async (simulationData, options = {}) => {
    const response = await api.post('/api/simulation/optimize', {
      ...simulationData,
      options
    });
    return response.data;
  },

  // Get heatmap data
  getHeatmap: async (resultId) => {
    const response = await api.get(`/api/simulation/heatmap/${resultId}`);
    return response.data;
  },

  // Batch run multiple simulations
  batchRun: async (simulations) => {
    const response = await api.post('/api/simulation/batch', { simulations });
    return response.data; // Returns { jobId: '...' }
  }
};

export default simulationApi;
