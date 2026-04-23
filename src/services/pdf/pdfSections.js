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

/**
 * Draw Input Data section
 * @param {PDFDocument} doc - PDFKit document
 * @param {Object} params - Input parameters
 */
export function drawInputData(doc, params) {
  doc.addPage();

  doc.fontSize(18).text('Input Data', 50, 50);

  doc.fontSize(12).fillColor('#000000');

  // Grid parameters
  doc.fontSize(14).fillColor(COLORS.primary).text('Grid Parameters', 50, 100);
  doc.fontSize(11).fillColor('#000000')
    .text(`Grid Length: ${params.gridLength || 'N/A'} m`, 50, 120)
    .text(`Grid Width: ${params.gridWidth || 'N/A'} m`, 50, 135)
    .text(`Grid Depth: ${params.gridDepth || 'N/A'} m`, 50, 150)
    .text(`Conductors X: ${params.numParallel || 'N/A'}`, 50, 165)
    .text(`Conductors Y: ${params.numParallelY || 'N/A'}`, 50, 180)
    .text(`Number of Rods: ${params.numRods || 'N/A'}`, 50, 195)
    .text(`Rod Length: ${params.rodLength || 'N/A'} m`, 50, 210);

  // Soil parameters
  doc.fontSize(14).fillColor(COLORS.primary).text('Soil Parameters', 50, 240);
  doc.fontSize(11).fillColor('#000000')
    .text(`Soil Resistivity: ${params.soilResistivity || 'N/A'} Ω·m`, 50, 260)
    .text(`Surface Layer Resistivity: ${params.surfaceLayer || 'N/A'} Ω·m`, 50, 275)
    .text(`Surface Layer Depth: ${params.surfaceDepth || 'N/A'} m`, 50, 290);

  // Fault parameters
  doc.fontSize(14).fillColor(COLORS.primary).text('Fault Parameters', 50, 320);
  doc.fontSize(11).fillColor('#000000')
    .text(`Fault Current: ${params.faultCurrent || 'N/A'} A`, 50, 340)
    .text(`Fault Duration: ${params.faultDuration || 'N/A'} s`, 50, 355)
    .text(`Current Division Factor: ${params.currentDivisionFactor || 'N/A'}`, 50, 370);
}

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

/**
 * Draw Compliance section
 * @param {PDFDocument} doc - PDFKit document
 * @param {Object} results - Calculation results
 */
export function drawCompliance(doc, results) {
  doc.addPage();

  doc.fontSize(18).text('Compliance Analysis', 50, 50);

  doc.fontSize(12).fillColor('#000000');

  // Touch voltage compliance
  const touchComplies = results.Em <= results.Etouch70;
  doc.fontSize(14).fillColor(touchComplies ? COLORS.success : COLORS.danger)
    .text(`Touch Voltage: ${touchComplies ? 'COMPLIES' : 'DOES NOT COMPLY'}`, 50, 100);
  doc.fontSize(11).fillColor('#000000')
    .text(`Calculated: ${results.Em?.toFixed(0) || 'N/A'} V`, 50, 120)
    .text(`Limit (70kg): ${results.Etouch70?.toFixed(0) || 'N/A'} V`, 50, 135);

  // Step voltage compliance
  const stepComplies = results.Es <= results.Estep70;
  doc.fontSize(14).fillColor(stepComplies ? COLORS.success : COLORS.danger)
    .text(`Step Voltage: ${stepComplies ? 'COMPLIES' : 'DOES NOT COMPLY'}`, 50, 170);
  doc.fontSize(11).fillColor('#000000')
    .text(`Calculated: ${results.Es?.toFixed(0) || 'N/A'} V`, 50, 190)
    .text(`Limit (70kg): ${results.Estep70?.toFixed(0) || 'N/A'} V`, 50, 205);

  // Overall compliance
  const overallComplies = touchComplies && stepComplies;
  doc.fontSize(16).fillColor(overallComplies ? COLORS.success : COLORS.danger)
    .text(`Overall: ${overallComplies ? 'COMPLIES WITH IEEE 80' : 'DOES NOT COMPLY WITH IEEE 80'}`, 50, 250);
}

/**
 * Draw Recommendations section
 * @param {PDFDocument} doc - PDFKit document
 * @param {Array} recommendations - AI-generated recommendations
 */
export function drawRecommendations(doc, recommendations = []) {
  doc.addPage();

  doc.fontSize(18).text('Recommendations', 50, 50);

  if (recommendations.length === 0) {
    doc.fontSize(12).fillColor('#000000')
      .text('No specific recommendations at this time.', 50, 100);
    return;
  }

  doc.fontSize(11).fillColor('#000000');

  recommendations.forEach((rec, index) => {
    const y = 100 + (index * 60);
    
    doc.fontSize(12).fillColor(COLORS.primary)
      .text(`${index + 1}. ${rec.title || 'Recommendation'}`, 50, y);
    
    doc.fontSize(10).fillColor('#000000')
      .text(rec.description || '', 50, y + 20);
    
    if (rec.priority) {
      doc.fontSize(9).fillColor(rec.priority === 'high' ? COLORS.danger : COLORS.accent)
        .text(`Priority: ${rec.priority.toUpperCase()}`, 50, y + 40);
    }
  });
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
