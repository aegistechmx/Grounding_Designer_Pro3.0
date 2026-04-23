/**
 * Batch PDF Generator
 * Generates multiple PDFs and packages them
 */

import { generateProPDF } from './pdfPro';
import jsPDF from 'jspdf';

export const generateBatchPDF = async (data) => {
  const { projects = [], reportType = 'pro' } = data;

  if (projects.length === 0) {
    throw new Error('No projects provided for batch generation');
  }

  const results = [];

  for (const project of projects) {
    try {
      const pdf = await generateProPDF({
        ...project,
        type: reportType
      });
      results.push({
        success: true,
        projectName: project.projectName || 'Unnamed',
        pdf
      });
    } catch (error) {
      results.push({
        success: false,
        projectName: project.projectName || 'Unnamed',
        error: error.message
      });
    }
  }

  console.log(`📦 Batch PDF generation complete: ${results.length} projects`);

  return {
    success: true,
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
};
