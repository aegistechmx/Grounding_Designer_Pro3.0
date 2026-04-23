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

/**
 * Draw engineering results section (ETAP-style)
 * @param {PDFDocument} doc - PDFKit document
 * @param {Object} results - Calculation results
 */
export function drawResults(doc, results) {
  doc.addPage();

  doc.fontSize(18).text('Resultados de Diseño', 50, 50);

  doc.fontSize(12)
    .text(`Rg: ${results.Rg?.toFixed(3) || 'N/A'} Ω`, 50, 100)
    .text(`GPR: ${results.GPR?.toFixed(0) || 'N/A'} V`, 50, 120)
    .text(`Touch Voltage: ${results.Em?.toFixed(0) || 'N/A'} V`, 50, 140)
    .text(`Step Voltage: ${results.Es?.toFixed(0) || 'N/A'} V`, 50, 160);
}

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
