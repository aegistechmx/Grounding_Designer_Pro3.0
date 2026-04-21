/**
 * PDF Technical Memory Generator
 * Generates professional technical memory PDF with structured sections
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildFullReport } from '../core/reportModel';
import { generateTechnicalMemory } from '../core/technicalMemoryEngine';
import { generateSafetyChart } from './chartGeneratorPro';
import { generateRealisticHeatmap } from '../core/heatmapEnginePro';
import { generateHeatmapImage } from './chartGeneratorPro';
import { generateSignatureData, addDigitalSignatureToPDF } from './digitalSignature';
import { loadLogoAsBase64 } from './pdfExportWithLogo';

/**
 * Generates a complete technical memory PDF
 * @param {Object} params - Project parameters
 * @param {Object} calculations - Calculation results
 * @param {Object} recommendations - Recommendations array
 * @param {string} logoBase64 - Optional logo in base64
 * @returns {Promise<jsPDF>} PDF document
 */
export async function generateTechnicalMemoryPDF(params, calculations, recommendations = [], logoBase64 = null) {
  // Build report model
  const report = buildFullReport({ params, calculations, recommendations });
  
  // Generate technical memory content
  const memory = generateTechnicalMemory(report);
  
  // Generate signature data
  const signatureData = generateSignatureData(
    params,
    calculations,
    params.engineerName || 'Ing. Especialista'
  );
  
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
    if (yPos + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }
  };
  
  const drawSectionTitle = (title) => {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.setFont(undefined, 'bold');
    doc.text(title, 15, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 10;
  };
  
  const safeText = (text, x, y, options = {}) => {
    const safeTextValue = text || '';
    if (safeTextValue && safeTextValue.length > 0) {
      try {
        doc.text(safeTextValue, x, y, options);
      } catch (error) {
        console.warn('Error al agregar texto:', error);
      }
    }
  };
  
  // ============================================
  // COVER PAGE
  // ============================================
  
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 15, 10, 30, 20);
    } catch (error) {
      console.error('Error al agregar el logo:', error);
    }
  }
  
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235);
  safeText('MEMORIA TÉCNICA', pageWidth / 2, yPos, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  safeText('Sistema de Puesta a Tierra', pageWidth / 2, yPos + 8, { align: 'center' });
  safeText('Conforme a IEEE Std 80-2013', pageWidth / 2, yPos + 16, { align: 'center' });
  
  doc.setDrawColor(37, 99, 235);
  doc.line(15, yPos + 23, pageWidth - 15, yPos + 23);
  yPos += 35;
  
  // Project data
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  safeText('DATOS DEL PROYECTO', 15, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(60, 60, 60);
  safeText(`Proyecto: ${report.metadata.project}`, 15, yPos);
  yPos += 7;
  safeText(`Ubicación: ${report.metadata.location}`, 15, yPos);
  yPos += 7;
  safeText(`Cliente: ${report.metadata.client}`, 15, yPos);
  yPos += 7;
  safeText(`Ingeniero: ${report.metadata.engineer}`, 15, yPos);
  yPos += 7;
  safeText(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 15, yPos);
  yPos += 7;
  safeText(`ID Reporte: ${report.metadata.reportId}`, 15, yPos);
  yPos += 15;
  
  // ============================================
  // TECHNICAL MEMORY SECTIONS
  // ============================================
  
  memory.sections.forEach((section, index) => {
    doc.addPage();
    yPos = 20;
    
    drawSectionTitle(section.title);
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.setFont(undefined, 'normal');
    
    // Split content into lines
    const lines = doc.splitTextToSize(section.content, 170);
    
    lines.forEach((line) => {
      checkPageBreak(7);
      safeText(line, 15, yPos);
      yPos += 5;
    });
    
    yPos += 10;
  });
  
  // ============================================
  // ANALYSIS CHARTS
  // ============================================
  
  doc.addPage();
  yPos = 20;
  
  drawSectionTitle('ANÁLISIS GRÁFICO DE SEGURIDAD');
  
  try {
    const chart = await generateChart({
      results: {
        Em: report.results.touchVoltage,
        Es: report.results.stepVoltage,
        limits: {
          touch: report.results.touchLimit70,
          step: report.results.stepLimit70
        }
      }
    });
    doc.addImage(chart, 'PNG', 15, yPos, 180, 100);
    yPos += 110;
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    safeText('Comparación de tensiones calculadas vs límites permisibles IEEE 80', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
  } catch (error) {
    console.error('Error al generar gráfica:', error);
    safeText('Error al generar gráfica de seguridad', 15, yPos);
    yPos += 10;
  }
  
  // ============================================
  // HEATMAP
  // ============================================
  
  doc.addPage();
  yPos = 20;
  
  drawSectionTitle('MAPA DE DISTRIBUCIÓN DE POTENCIAL');
  
  try {
    const grid = generateHeatmapData(calculations, params);
    const heatmap = await generateHeatmapImage(grid, 150, 150);
    doc.addImage(heatmap, 'PNG', 30, yPos, 150, 150);
    yPos += 160;
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    safeText('Distribución espacial de voltajes en la malla de puesta a tierra', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    safeText('Rojo: Alto potencial | Verde: Bajo potencial', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
  } catch (error) {
    console.error('Error al generar heatmap:', error);
    safeText('Error al generar mapa de potencial', 15, yPos);
    yPos += 10;
  }
  
  // ============================================
  // SUMMARY TABLE
  // ============================================
  
  doc.addPage();
  yPos = 20;
  
  drawSectionTitle('RESUMEN DE RESULTADOS');
  
  const summaryData = [
    ['Resistencia (Rg)', `${report.results.resistance.toFixed(4)} Ω`, 'Estado', report.results.resistance <= 5 ? 'CUMPLE' : 'NO CUMPLE'],
    ['GPR', `${report.results.gpr.toFixed(2)} V`, 'Corriente Malla', `${report.results.gridCurrent.toFixed(2)} A`],
    ['Tensión Contacto', `${report.results.touchVoltage.toFixed(2)} V`, 'Límite 70kg', `${report.results.touchLimit70.toFixed(2)} V`],
    ['Tensión Paso', `${report.results.stepVoltage.toFixed(2)} V`, 'Límite 70kg', `${report.results.stepLimit70.toFixed(2)} V`],
    ['Área Malla', `${report.results.gridArea.toFixed(2)} m²`, 'Conductor Total', `${report.results.totalConductor.toFixed(2)} m`],
    ['Cumple IEEE 80', report.results.complies ? 'SÍ' : 'NO', 'Margen Seguridad', `${report.safety.margin.toFixed(1)}%`]
  ];
  
  autoTable(doc, {
    startY: yPos,
    body: summaryData,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 15 },
    tableWidth: 170,
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [0, 0, 0] },
      1: { textColor: [100, 100, 100] },
      2: { fontStyle: 'bold', textColor: [0, 0, 0] },
      3: { textColor: report.results.complies ? [34, 197, 94] : [239, 68, 68] }
    }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // ============================================
  // DIGITAL SIGNATURE
  // ============================================
  
  doc.addPage();
  yPos = 20;
  
  drawSectionTitle('FIRMA DIGITAL');
  
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  safeText('Este documento incluye firma digital para verificar integridad y autenticidad.', 15, yPos);
  yPos += 10;
  safeText('El hash de verificación garantiza que el documento no ha sido alterado.', 15, yPos);
  yPos += 15;
  
  addDigitalSignatureToPDF(doc, signatureData, 15, yPos);
  
  // ============================================
  // FOOTER
  // ============================================
  
  const totalPages = doc.internal.pages.length - 1;
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    safeText(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    doc.setDrawColor(200, 200, 200);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    safeText('Memoria Técnica • IEEE Std 80-2013 & CFE 01J00-01', pageWidth / 2, pageHeight - 6, { align: 'center' });
  }
  
  return doc;
}

/**
 * Convenience function to export technical memory PDF with filename
 * @param {Object} params - Project parameters
 * @param {Object} calculations - Calculation results
 * @param {Object} recommendations - Recommendations array
 * @param {string} filename - Optional filename
 */
export async function exportTechnicalMemoryPDF(params, calculations, recommendations = [], filename = null) {
  const doc = await generateTechnicalMemoryPDF(params, calculations, recommendations);
  const defaultFilename = `Memoria_Tecnica_${params.projectName || 'Proyecto'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename || defaultFilename);
  return doc;
}

export default {
  generateTechnicalMemoryPDF,
  exportTechnicalMemoryPDF
};
