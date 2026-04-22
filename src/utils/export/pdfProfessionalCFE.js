/**
 * Professional CFE PDF Generator
 * Creates formal engineering reports with CFE structure and professional layout
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  generateExecutiveSummary,
  generateSystemDescription,
  generateSoilCharacteristics,
  generateResults,
  generateCriticalAnalysis,
  generateSensitivityAnalysis,
  generateTechnicalConclusion,
  generateProfessionalRecommendations,
  generateProfessionalCertificate
} from '../core/professionalReportEngine';
import { loadLogoAsBase64 } from './pdfExportWithLogo';

/**
 * Generate professional CFE PDF
 * @param {Object} params - Design parameters
 * @param {Object} calculations - Calculation results
 * @param {Array} sensitivityData - Sensitivity analysis data
 * @param {string} logoBase64 - Optional logo in base64
 * @returns {Promise<jsPDF>} PDF document
 */
export async function generateProfessionalCFEPDF(params, calculations, sensitivityData = [], logoBase64 = null) {
  // Load logo
  const logo = logoBase64 || await loadLogoAsBase64();
  
  // Create PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;
  
  // Helper functions
  const checkPageBreak = (requiredSpace = 30) => {
    if (yPos + requiredSpace > pageHeight - 30) {
      doc.addPage();
      yPos = 20;
    }
  };
  
  const addText = (text, fontSize = 11, fontStyle = 'normal', color = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont(undefined, fontStyle);
    doc.setTextColor(...color);
    
    const lines = doc.splitTextToSize(text, pageWidth - 40);
    lines.forEach(line => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = 20;
      }
      if (line) doc.text(line, 20, yPos);
      yPos += fontSize * 0.5 + 2;
    });
    yPos += 5;
  };
  
  const addSectionTitle = (title, number) => {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(37, 99, 235);
    if (title && number !== undefined) doc.text(number + '. ' + title, 20, yPos);
    yPos += 12;
    
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 8;
  };
  
  // ============================================
  // COVER PAGE
  // ============================================
  
  // Header with logo
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 20, 20, 40, 30);
    } catch (error) {
      console.error('Error al agregar el logo:', error);
    }
  }
  
  // Title
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('ESTUDIO DE PUESTA A TIERRA', pageWidth / 2, 60, { align: 'center' });
  
  doc.setFontSize(18);
  doc.text('FORMATO CFE 01J00-01', pageWidth / 2, 75, { align: 'center' });
  
  // Project info
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  
  const projectName = params.projectName || 'Instalación Eléctrica';
  const location = params.location || 'Puerto Vallarta, Jalisco';
  const date = new Date().toLocaleDateString('es-MX');
  
  doc.text('Proyecto: ' + projectName, pageWidth / 2, 110, { align: 'center' });
  doc.text('Ubicación: ' + location, pageWidth / 2, 125, { align: 'center' });
  doc.text('Fecha: ' + date, pageWidth / 2, 140, { align: 'center' });
  
  // Professional info
  doc.setFontSize(10);
  doc.text('Elaborado conforme a:', pageWidth / 2, 170, { align: 'center' });
  doc.text('IEEE Std 80-2013', pageWidth / 2, 180, { align: 'center' });
  doc.text('CFE 01J00-01', pageWidth / 2, 190, { align: 'center' });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Documento Confidencial - Uso Profesional', pageWidth / 2, pageHeight - 20, { align: 'center' });
  
  // Add new page for content
  doc.addPage();
  yPos = 20;
  
  // ============================================
  // 1. RESUMEN EJECUTIVO
  // ============================================
  
  addSectionTitle('RESUMEN EJECUTIVO', 1);
  
  const executiveSummary = generateExecutiveSummary(params, calculations);
  addText(executiveSummary);
  
  // ============================================
  // 2. DESCRIPCIÓN DEL SISTEMA
  // ============================================
  
  addSectionTitle('DESCRIPCIÓN DEL SISTEMA', 2);
  
  const systemDescription = generateSystemDescription(params, calculations);
  addText(systemDescription);
  
  // ============================================
  // 3. CARACTERÍSTICAS DEL SUELO
  // ============================================
  
  addSectionTitle('CARACTERÍSTICAS DEL SUELO', 3);
  
  const soilCharacteristics = generateSoilCharacteristics(params);
  addText(soilCharacteristics);
  
  // ============================================
  // 4. RESULTADOS
  // ============================================
  
  addSectionTitle('RESULTADOS', 4);
  
  const results = generateResults(calculations);
  addText(results);
  
  // Add detailed results table
  checkPageBreak(60);
  
  const resultsData = [
    ['Parámetro', 'Valor Calculado', 'Límite IEEE 80', 'Estado'],
    ['Resistencia de Puesta a Tierra', `${(calculations.Rg || 0).toFixed(3)} `, '5.0 ', (calculations.Rg || 0) <= 5 ? 'CUMPLE' : 'NO CUMPLE'],
    ['Elevación de Potencial (GPR)', `${(calculations.GPR || 0).toFixed(0)} V`, '5000 V', (calculations.GPR || 0) <= 5000 ? 'CUMPLE' : 'NO CUMPLE'],
    ['Tensión de Contacto', `${(calculations.Em || 0).toFixed(1)} V`, `${(calculations.Etouch70 || 0).toFixed(1)} V`, (calculations.Em || 0) <= (calculations.Etouch70 || 0) ? 'CUMPLE' : 'NO CUMPLE'],
    ['Tensión de Paso', `${(calculations.Es || 0).toFixed(1)} V`, `${(calculations.Estep70 || 0).toFixed(1)} V`, (calculations.Es || 0) <= (calculations.Estep70 || 0) ? 'CUMPLE' : 'NO CUMPLE']
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: resultsData[0],
    body: resultsData.slice(1),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold' },
      3: { 
        textColor: (row) => row[3] === 'CUMPLE' ? [34, 197, 94] : [239, 68, 68],
        fontStyle: 'bold'
      }
    },
    margin: { left: 20, right: 20 },
    tableWidth: pageWidth - 40
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // ============================================
  // 5. ANÁLISIS CRÍTICO
  // ============================================
  
  addSectionTitle('ANÁLISIS CRÍTICO', 5);
  
  const criticalAnalysis = generateCriticalAnalysis(calculations);
  addText(criticalAnalysis);
  
  // ============================================
  // 6. ANÁLISIS DE SENSIBILIDAD
  // ============================================
  
  addSectionTitle('ANÁLISIS DE SENSIBILIDAD', 6);
  
  const sensitivityAnalysis = generateSensitivityAnalysis(sensitivityData);
  addText(sensitivityAnalysis);
  
  // Add sensitivity table if data available
  if (sensitivityData && sensitivityData.length > 0) {
    checkPageBreak(60);
    
    const sensitivityTableData = [
      ['Parámetro', 'Impacto (%)', 'Categoría'],
      ...sensitivityData.map(item => [
        item.name || item.parameter || 'Desconocido',
        `${((item.value || item.impact || 0) * 100).toFixed(1)}%`,
        getParameterCategory(item.name || item.parameter || '')
      ])
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: sensitivityTableData[0] || {},
      body: sensitivityTableData.slice(1),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center' }
      },
      margin: { left: 20, right: 20 },
      tableWidth: pageWidth - 40
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
  }
  
  // ============================================
  // 7. CONCLUSIÓN TÉCNICA
  // ============================================
  
  addSectionTitle('CONCLUSIÓN TÉCNICA', 7);
  
  const technicalConclusion = generateTechnicalConclusion(calculations, params);
  addText(technicalConclusion);
  
  // ============================================
  // 8. RECOMENDACIONES
  // ============================================
  
  addSectionTitle('RECOMENDACIONES', 8);
  
  const recommendations = generateProfessionalRecommendations(calculations, params);
  
  recommendations.forEach((rec, index) => {
    checkPageBreak(20);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text((index + 1) + '. ' + rec.recommendation, 25, yPos);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('[' + rec.category + ' - Prioridad ' + rec.priority + ']', 25, yPos + 5);
    doc.setTextColor(0, 0, 0);
    yPos += 15;
  });
  
  // ============================================
  // 9. CERTIFICADO
  // ============================================
  
  checkPageBreak(80);
  addSectionTitle('CERTIFICADO', 9);
  
  const certificate = generateProfessionalCertificate(params, calculations);
  addText(certificate);
  
  // Add signature area
  checkPageBreak(60);
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Firma del Ingeniero Responsable:', 20, yPos);
  
  // Signature line
  yPos += 20;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 100, yPos);
  
  // Date and digital signature
  yPos += 10;
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Fecha: ' + new Date().toLocaleDateString('es-MX'), 20, yPos);
  
  yPos += 8;
  doc.text('Firma Digital: [HASH_GENERATED]', 20, yPos);
  
  // ============================================
  // FOOTER ON ALL PAGES
  // ============================================
  
  const totalPages = doc.internal.pages.length - 1;
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Page number
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Página ' + i + ' de ' + totalPages, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);
    
    // Document info
    doc.text('CFE 01J00-01 - IEEE Std 80-2013', 20, pageHeight - 10);
    doc.text('Documento Profesional', pageWidth - 60, pageHeight - 10);
  }
  
  return doc;
}

/**
 * Get parameter category for display
 * @param {string} paramName - Parameter name
 * @returns {string} Category
 */
function getParameterCategory(paramName) {
  const lowerName = paramName.toLowerCase();
  
  if (lowerName.includes('resistiv')) return 'Suelo';
  if (lowerName.includes('corrient')) return 'Sistema';
  if (lowerName.includes('área') || lowerName.includes('malla')) return 'Geometría';
  if (lowerName.includes('profundidad')) return 'Geometría';
  if (lowerName.includes('duración') || lowerName.includes('tiempo')) return 'Sistema';
  
  return 'General';
}

/**
 * Convenience function to export professional CFE PDF
 * @param {Object} params - Design parameters
 * @param {Object} calculations - Calculation results
 * @param {Array} sensitivityData - Sensitivity analysis data
 * @param {string} filename - Optional filename
 */
export async function exportProfessionalCFEPDF(params, calculations, sensitivityData = [], filename = null) {
  const doc = await generateProfessionalCFEPDF(params, calculations, sensitivityData);
  const defaultFilename = 'Informe_Profesional_CFE_' + (params.projectName || 'Proyecto') + '_' + new Date().toISOString().split('T')[0] + '.pdf';
  doc.save(filename || defaultFilename);
  return doc;
}

export default {
  generateProfessionalCFEPDF,
  exportProfessionalCFEPDF
};
