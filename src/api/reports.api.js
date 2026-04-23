/**
 * Reports API for Grounding Designer Pro SaaS
 * Handles all report generation and export API calls
 */

import api from './client';

export const reportsApi = {
  // Generate PDF report (heavy task - returns job ID)
  generatePDF: async (reportData) => {
    const response = await api.post('/api/reports/pdf', reportData);
    return response.data; // Returns { jobId: '...' }
  },

  // Generate Excel report
  generateExcel: async (reportData) => {
    const response = await api.post('/api/reports/excel', reportData, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Generate DXF export
  generateDXF: async (reportData) => {
    const response = await api.post('/api/reports/dxf', reportData, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Batch generate multiple reports (ZIP)
  batchGenerate: async (reportData) => {
    const response = await api.post('/api/reports/batch', reportData);
    return response.data; // Returns { jobId: '...' }
  },

  // Get report job status
  getJobStatus: async (jobId) => {
    const response = await api.get(`/api/reports/jobs/${jobId}`);
    return response.data;
  },

  // Download generated report
  download: async (reportId) => {
    const response = await api.get(`/api/reports/${reportId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get report metadata
  getMetadata: async (reportId) => {
    const response = await api.get(`/api/reports/${reportId}`);
    return response.data;
  },

  // List all reports for a project
  listByProject: async (projectId) => {
    const response = await api.get(`/api/projects/${projectId}/reports`);
    return response.data;
  }
};

export default reportsApi;
