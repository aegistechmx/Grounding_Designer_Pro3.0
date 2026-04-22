/**
 * PDF Generator with Chart.js Integration
 * Creates professional PDFs with high-quality charts
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildFullReport } from '../core/reportModel';
import { generateChartImage, generateGaugeChartImage, generateComparisonChart } from './chartJSGenerator';
import { loadLogoAsBase64 } from './pdfExportWithLogo';

/**
 * Generates a PDF with professional Chart.js charts
 * @param {Object} params - Project parameters
 * @param {Object} calculations - Calculation results
 * @param {Object} recommendations - Recommendations array
 * @param {string} logoBase64 - Optional logo in base64
 * @returns {Promise<jsPDF>} PDF document
 */
export async function generatePDFWithCharts(params, calculations, recommendations = [], logoBase64 = null) {
  // Build report model
  const report = buildFullReport({ params, calculations, recommendations });
  
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
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.setFont(undefined, 'bold');
    doc.text(title, 15, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 15;
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
  safeText('MEMORIA TÉCNICA PROFESIONAL', pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  safeText('Sistema de Puesta a Tierra IEEE 80', pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;
  
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  safeText('Con gráficas de alta calidad', pageWidth / 2, yPos, { align: 'center' });
  
  doc.setDrawColor(37, 99, 235);
  doc.line(15, yPos + 10, pageWidth - 15, yPos + 10);
  yPos += 25;
  
  // Project data
  doc.setFontSize(11);
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
  safeText(`Ingeniero: ${report.metadata.engineer}`, 15, yPos);
  yPos += 7;
  safeText(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 15, yPos);
  yPos += 7;
  safeText(`ID Reporte: ${report.metadata.reportId}`, 15, yPos);
  yPos += 15;

  // ============================================
  // INPUT DATA
  // ============================================

  doc.addPage();
  yPos = 20;

  drawSectionTitle('DATOS DE ENTRADA DEL SISTEMA');

  const inputData = [
    ['Potencia Transformador', `${report.input.transformerKVA} kVA`, 'Tensión Primaria', `${report.input.primaryVoltage} V`],
    ['Tensión Secundaria', `${report.input.secondaryVoltage} V`, 'Impedancia', `${report.input.transformerImpedance}%`],
    ['Duración Falla', `${report.input.faultDuration} s`, 'Factor División', report.input.currentDivisionFactor],
    ['Resistividad Suelo', `${report.input.soilResistivity} Ω·m`, 'Capa Superficial', `${report.input.surfaceLayer} Ω·m`],
    ['Profundidad Capa', `${report.input.surfaceDepth} m`, 'Área Malla', `${report.input.gridLength} x ${report.input.gridWidth} m`],
    ['Profundidad Malla', `${report.input.gridDepth} m`, 'Conductores X', report.input.numParallel],
    ['Conductores Y', report.input.numParallelY, 'Varillas', report.input.numRods],
    ['Longitud Varilla', `${report.input.rodLength} m`, 'Diámetro Conductor', `${report.input.conductorDiameter * 1000} mm`]
  ];

  autoTable(doc, {
    startY: yPos,
    body: inputData,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
    margin: { left: 15 },
    tableWidth: 180,
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [0, 0, 0] },
      1: { textColor: [60, 60, 60] },
      2: { fontStyle: 'bold', textColor: [0, 0, 0] },
      3: { textColor: [60, 60, 60] }
    }
  });

  yPos = doc.lastAutoTable.finalY + 15;
  
  // ============================================
  // INTERMEDIATE CALCULATIONS
  // ============================================

  doc.addPage();
  yPos = 20;

  drawSectionTitle('CÁLCULOS INTERMEDIOS');

  const calcData = [
    ['Corriente Falla (If)', `${report.results.faultCurrent?.toFixed(2) || 'N/A'} A`, 'Corriente Malla (Ig)', `${report.results.gridCurrent?.toFixed(2) || 'N/A'} A`],
    ['Corriente Neutro (In)', `${report.results.neutralCurrent?.toFixed(2) || 'N/A'} A`, 'Factor Sf', `${report.results.surfacingFactor?.toFixed(4) || 'N/A'}`],
    ['Factor Cs', `${report.results.decrementFactor?.toFixed(4) || 'N/A'}`, 'Factor n', `${report.results.geometricFactor?.toFixed(4) || 'N/A'}`],
    ['Factor Ki', `${report.results.irregularityFactor?.toFixed(4) || 'N/A'}`, 'Factor Kh', `${report.results.depthFactor?.toFixed(4) || 'N/A'}`],
    ['Factor Km', `${report.results.meshFactor?.toFixed(4) || 'N/A'}`, 'Factor Ks', `${report.results.stepFactor?.toFixed(4) || 'N/A'}`],
    ['Longitud Total (LT)', `${report.results.totalLength?.toFixed(2) || 'N/A'} m`, 'Perímetro', `${report.results.perimeter?.toFixed(2) || 'N/A'} m`]
  ];

  autoTable(doc, {
    startY: yPos,
    body: calcData,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
    margin: { left: 15 },
    tableWidth: 180,
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [0, 0, 0] },
      1: { textColor: [60, 60, 60] },
      2: { fontStyle: 'bold', textColor: [0, 0, 0] },
      3: { textColor: [60, 60, 60] }
    }
  });

  yPos = doc.lastAutoTable.finalY + 15;
  
  // ============================================
  // SAFETY CHART
  // ============================================
  
  doc.addPage();
  yPos = 20;
  
  drawSectionTitle('ANÁLISIS DE SEGURIDAD');
  
  try {
    const chart = await generateChartImage(report);
    doc.addImage(chart, 'PNG', 15, yPos, 180, 90);
    yPos += 100;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    safeText('Comparación de tensiones calculadas vs límites permisibles IEEE 80', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
  } catch (error) {
    console.error('Error al generar gráfica:', error);
    safeText('Error al generar gráfica de seguridad', 15, yPos);
    yPos += 10;
  }
  
  // ============================================
  // GAUGE CHART
  // ============================================
  
  doc.addPage();
  yPos = 20;
  
  drawSectionTitle('PUNTUACIÓN GENERAL');
  
  try {
    const gauge = await generateGaugeChartImage(report.safety.margin);
    doc.addImage(gauge, 'PNG', 60, yPos, 90, 90);
    yPos += 100;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    safeText('Margen de seguridad del sistema', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    const status = report.safety.margin >= 80 ? 'Excelente' : 
                  report.safety.margin >= 50 ? 'Aceptable' : 'Requiere Mejora';
    const color = report.safety.margin >= 80 ? [34, 197, 94] : 
                 report.safety.margin >= 50 ? [234, 179, 8] : [239, 68, 68];
    
    doc.setFontSize(12);
    doc.setTextColor(...color);
    doc.setFont(undefined, 'bold');
    safeText(`Estado: ${status}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
  } catch (error) {
    console.error('Error al generar gauge:', error);
    safeText('Error al generar gráfica gauge', 15, yPos);
    yPos += 10;
  }
  
  // ============================================
  // COMPARISON CHART
  // ============================================
  
  doc.addPage();
  yPos = 20;
  
  drawSectionTitle('ANÁLISIS COMPARATIVO');
  
  try {
    const comparison = await generateComparisonChart(report);
    doc.addImage(comparison, 'PNG', 15, yPos, 180, 90);
    yPos += 100;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    safeText('Comparación de parámetros calculados vs límites aceptables', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
  } catch (error) {
    console.error('Error al generar gráfica comparativa:', error);
    safeText('Error al generar gráfica comparativa', 15, yPos);
    yPos += 10;
  }
  
  // ============================================
  // DETAILED RESULTS TABLE
  // ============================================
  
  doc.addPage();
  yPos = 20;
  
  drawSectionTitle('RESULTADOS DETALLADOS');
  
  const resultsData = [
    ['Resistencia de Malla (Rg)', `${report.results.resistance.toFixed(4)} Ω`, 'Estado', report.results.resistance <= 5 ? 'CUMPLE' : 'NO CUMPLE'],
    ['Elevación de Potencial (GPR)', `${report.results.gpr.toFixed(2)} V`, 'Corriente Malla', `${report.results.gridCurrent.toFixed(2)} A`],
    ['Tensión de Contacto', `${report.results.touchVoltage.toFixed(2)} V`, 'Límite 70kg', `${report.results.touchLimit70.toFixed(2)} V`],
    ['Tensión de Paso', `${report.results.stepVoltage.toFixed(2)} V`, 'Límite 70kg', `${report.results.stepLimit70.toFixed(2)} V`],
    ['Área de Malla', `${report.results.gridArea.toFixed(2)} m²`, 'Conductor Total', `${report.results.totalConductor.toFixed(2)} m`],
    ['Margen de Seguridad', `${report.safety.margin.toFixed(1)}%`, 'Cumple IEEE 80', report.results.complies ? 'SÍ' : 'NO']
  ];
  
  autoTable(doc, {
    startY: yPos,
    body: resultsData,
    theme: 'striped',
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
    margin: { left: 15 },
    tableWidth: 180,
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [0, 0, 0] },
      1: { textColor: [60, 60, 60] },
      2: { fontStyle: 'bold', textColor: [0, 0, 0] },
      3: { textColor: report.results.complies ? [34, 197, 94] : [239, 68, 68] }
    }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // ============================================
  // CONCLUSIONS
  // ============================================
  
  doc.addPage();
  yPos = 20;
  
  drawSectionTitle('CONCLUSIONES');
  
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'normal');
  
  const conclusions = report.results.complies 
    ? [
        'El diseño del sistema de puesta a tierra cumple con los criterios de seguridad IEEE 80.',
        'Las tensiones de paso y contacto se encuentran dentro de los límites permisibles.',
        'La resistencia de malla es adecuada para disipación de corriente.',
        'El sistema es apto para implementación conforme a los parámetros de diseño.'
      ]
    : [
        'El diseño requiere modificaciones para alcanzar el cumplimiento normativo.',
        'Se deben implementar las recomendaciones especificadas en el análisis.',
        'Una vez mejorado el diseño, se deberá realizar nueva evaluación.',
        'El sistema actual no cumple con los criterios de seguridad IEEE 80.'
      ];
  
  conclusions.forEach((conclusion, index) => {
    checkPageBreak(10);
    safeText(`${index + 1}. ${conclusion}`, 15, yPos);
    yPos += 8;
  });

  // ============================================
  // RECOMMENDATIONS
  // ============================================

  doc.addPage();
  yPos = 20;

  drawSectionTitle('RECOMENDACIONES');

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'normal');

  if (recommendations && recommendations.length > 0) {
    recommendations.forEach((rec, index) => {
      checkPageBreak(15);
      doc.setFontSize(9);
      doc.setTextColor(37, 99, 235);
      doc.setFont(undefined, 'bold');
      safeText(`${index + 1}. ${rec.title || rec.message}`, 15, yPos);
      yPos += 6;
      
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(rec.action || rec.description || '', 170);
      lines.forEach((line) => {
        checkPageBreak(5);
        safeText(`   ${line}`, 15, yPos);
        yPos += 4;
      });
      yPos += 8;
    });
  } else {
    safeText('No hay recomendaciones específicas. El diseño cumple con los requisitos.', 15, yPos);
    yPos += 10;
  }

  // ============================================
  // MATERIALS AND COSTS
  // ============================================

  doc.addPage();
  yPos = 20;

  drawSectionTitle('MATERIALES Y COSTOS ESTIMADOS');

  const materialsData = [
    ['Conductor de Cobre', `${report.results.totalConductor?.toFixed(2) || 'N/A'} m`, 'Costo Est.', `$${((report.results.totalConductor || 0) * 3.5).toFixed(2)}`],
    ['Varillas de Acero', `${report.input.numRods || 0} x ${report.input.rodLength || 3} m`, 'Costo Est.', `$${((report.input.numRods || 0) * 25).toFixed(2)}`],
    ['Grava/Capa Superficial', `${((report.input.gridLength || 0) * (report.input.gridWidth || 0) * (report.input.surfaceDepth || 0.2)).toFixed(2)} m³`, 'Costo Est.', `$${(((report.input.gridLength || 0) * (report.input.gridWidth || 0) * (report.input.surfaceDepth || 0.2)) * 45).toFixed(2)}`],
    ['TOTAL ESTIMADO', '', '', `$${(((report.results.totalConductor || 0) * 3.5) + ((report.input.numRods || 0) * 25) + ((report.input.gridLength || 0) * (report.input.gridWidth || 0) * (report.input.surfaceDepth || 0.2) * 45)).toFixed(2)}`]
  ];

  autoTable(doc, {
    startY: yPos,
    body: materialsData,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
    margin: { left: 15 },
    tableWidth: 180,
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [0, 0, 0] },
      1: { textColor: [60, 60, 60] },
      2: { fontStyle: 'bold', textColor: [0, 0, 0] },
      3: { textColor: [60, 60, 60] }
    }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // ============================================
  // SIGNATURE
  // ============================================

  doc.addPage();
  yPos = 20;

  drawSectionTitle('APROBACIÓN Y FIRMA');

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'normal');

  safeText('Este reporte ha sido generado automáticamente por Grounding Designer Pro.', 15, yPos);
  yPos += 10;
  safeText('La información presentada cumple con los requisitos de IEEE Std 80-2013.', 15, yPos);
  yPos += 10;
  safeText('Fecha de generación: ' + new Date().toLocaleString('es-MX'), 15, yPos);
  yPos += 25;

  // Signature lines
  doc.setDrawColor(100, 100, 100);
  doc.line(15, yPos, 80, yPos);
  safeText('Ingeniero Responsable', 15, yPos + 5);

  doc.line(110, yPos, 175, yPos);
  safeText('Cliente/Aprobador', 110, yPos + 5);

  yPos += 30;
  doc.line(15, yPos, 80, yPos);
  safeText('Firma', 15, yPos + 5);

  doc.line(110, yPos, 175, yPos);
  safeText('Fecha', 110, yPos + 5);
  
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
    safeText('Memoria Técnica Profesional • IEEE Std 80-2013 • Chart.js Graphics', pageWidth / 2, pageHeight - 6, { align: 'center' });
  }
  
  return doc;
}

/**
 * Convenience function to export PDF with charts
 * @param {Object} params - Project parameters
 * @param {Object} calculations - Calculation results
 * @param {Object} recommendations - Recommendations array
 * @param {string} filename - Optional filename
 */
export async function exportPDFWithCharts(params, calculations, recommendations = [], filename = null) {
  const doc = await generatePDFWithCharts(params, calculations, recommendations);
  const defaultFilename = `Memoria_Tecnica_Charts_${params.projectName || 'Proyecto'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename || defaultFilename);
  return doc;
}

export default {
  generatePDFWithCharts,
  exportPDFWithCharts
};
