import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { drawCover, drawHeader, drawFooter } from './pdfLayout';
import { addProjectInfo, addResultsTable, addConclusion, drawResults, drawInputData, drawCompliance, drawRecommendations } from './pdfSections';
import { generateHeatmapWithContours, addHeatmap } from './pdfCharts';

/**
 * PDF Engine - Único punto de entrada para generación de PDFs
 * Grounding Designer Pro - Corporate PDF Generation (Modular Architecture)
 * ETAP-style with equipotential contour lines
 */

/**
 * Generate corporate PDF with ETAP-style heatmap and contours
 * @param {Object} data - Data for PDF generation
 * @param {Object} data.results - Calculation results
 * @param {Object} data.params - Project parameters
 * @param {Array} data.data - Grid data for heatmap
 * @param {Array} data.recommendations - AI-generated recommendations
 * @returns {Promise<string>} - File path of generated PDF
 */
export async function generateCorporatePDF({ results, params, data, recommendations = [] }) {
  const doc = new PDFDocument({ size: 'A4' });

  const outputsDir = path.join(process.cwd(), 'outputs');
  if (!fs.existsSync(outputsDir)) {
    fs.mkdirSync(outputsDir, { recursive: true });
  }

  const filePath = path.join(outputsDir, `report-${Date.now()}.pdf`);
  doc.pipe(fs.createWriteStream(filePath));

  // ===== 1. COVER PAGE =====
  drawCover(doc, params);

  // ===== 2. INPUT DATA SECTION =====
  drawInputData(doc, params);

  // ===== 3. RESULTS SECTION =====
  drawResults(doc, results);

  // ===== 4. HEATMAP WITH EQUIPOTENTIAL CONTOURS (ETAP-style) =====
  if (data && data.length > 0) {
    doc.addPage();
    doc.fontSize(16).text('Distribución de Potencial', 50, 50);

    const heatmapImage = generateHeatmapWithContours(data, 800, 500, params);
    doc.image(heatmapImage, 50, 100, {
      width: 500
    });
  }

  // ===== 5. COMPLIANCE SECTION =====
  drawCompliance(doc, results);

  // ===== 6. RECOMMENDATIONS SECTION =====
  drawRecommendations(doc, recommendations);

  // ===== 7. CONCLUSION =====
  doc.addPage();
  addConclusion(doc, results);

  doc.end();

  return filePath;
}

/**
 * Legacy jsPDF-based generation (for backward compatibility)
 */
export const generateCorporatePDFLegacy = ({ calculations, params, heatmapImage }) => {
  const jsPDF = require('jspdf');
  const doc = new jsPDF('p', 'mm', 'a4');

  // ===== HEADER CORPORATIVO =====
  drawHeader(doc, 'Grounding System Report');

  // ===== INFORMACIÓN DEL PROYECTO =====
  addProjectInfo(doc, params);

  // ===== RESULTADOS DE INGENIERÍA =====
  addResultsTable(doc, calculations);

  // ===== HEATMAP =====
  addHeatmap(doc, heatmapImage);

  // ===== CONCLUSIÓN =====
  addConclusion(doc, calculations);

  // ===== FOOTER =====
  drawFooter(doc, 1);

  // ===== GUARDAR =====
  doc.save(`Grounding_Report_${Date.now()}.pdf`);
};

/**
 * Función unificada de entrada
 * @param {Object} data - Datos para generar PDF
 * @returns {Promise<string>} - File path of generated PDF
 */
export const generatePDF = async (data) => {
  try {
    return await generateCorporatePDF(data);
  } catch (error) {
    console.error('PDFKit generation failed, falling back to jsPDF:', error);
    return generateCorporatePDFLegacy(data);
  }
};
