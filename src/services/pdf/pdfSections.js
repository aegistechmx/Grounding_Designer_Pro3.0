/**
 * PDF Sections - Secciones del Reporte
 * Grounding Designer Pro - Engineering Report Sections
 */

import { COLORS } from './pdfLayout';

export const addProjectInfo = (doc, params) => {
  doc.moveDown();

  doc.fontSize(14).fillColor(COLORS.primary)
     .text('Project Information');

  doc.fontSize(10).fillColor(COLORS.text);

  doc.text(`Project: ${params.projectName || 'N/A'}`);
  doc.text(`Client: ${params.clientName || 'N/A'}`);
  doc.text(`Engineer: ${params.engineer || 'N/A'}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
};

export const addResultsTable = (doc, results) => {
  doc.moveDown();

  doc.fontSize(14).fillColor(COLORS.primary)
     .text('Engineering Results');

  doc.fontSize(10).fillColor(COLORS.text);

  doc.text(`Grid Resistance (Rg): ${results.Rg || 'N/A'} Ω`);
  doc.text(`GPR: ${results.GPR || 'N/A'} V`);
  doc.text(`Touch Voltage (Em): ${results.Em || 'N/A'} V`);
  doc.text(`Step Voltage (Es): ${results.Es || 'N/A'} V`);
  doc.text(`Touch Voltage 70kg: ${results.Etouch70 || 'N/A'} V`);
  doc.text(`Step Voltage 70kg: ${results.Estep70 || 'N/A'} V`);
};

export const addConclusion = (doc, results) => {
  doc.moveDown();

  const status = results.complies ? 'SAFE' : 'NOT SAFE';

  doc.fontSize(14)
     .fillColor(results.complies ? COLORS.success : COLORS.danger)
     .text(`Conclusion: ${status}`);

  doc.fontSize(10).fillColor(COLORS.text);

  if (results.complies) {
    doc.text('The grounding system design complies with IEEE Std 80 requirements.');
  } else {
    doc.text('The grounding system design does NOT comply with IEEE Std 80 requirements.');
    doc.text('Additional measures are required to ensure personnel safety.');
  }
};
