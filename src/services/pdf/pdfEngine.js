import jsPDF from 'jspdf';
import { drawHeader, drawFooter } from './pdfLayout';
import { addProjectInfo, addResultsTable, addConclusion } from './pdfSections';
import { addHeatmap } from './pdfCharts';

/**
 * PDF Engine - Único punto de entrada para generación de PDFs
 * Grounding Designer Pro - Corporate PDF Generation (Modular Architecture)
 */

export const generateCorporatePDF = ({ calculations, params, heatmapImage }) => {
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
 * @returns {void} - Genera y descarga el PDF
 */
export const generatePDF = async (data) => {
  return generateCorporatePDF(data);
};
