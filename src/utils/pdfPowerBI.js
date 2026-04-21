/**
 * Power BI Style Dashboard PDF Generator (Professional Version)
 * Creates professional dashboard-style PDFs with smart score, alerts, AI analysis, and visualizations
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildFullReport } from '../core/reportModel';
import { drawKPICards, drawLargeKPICards } from './kpiCards';
import { generatePBIBarChart, generateHorizontalChart, generateDoughnutChart, generateLineChart } from './chartPowerBI';
import { getOverallStatus } from './trafficLight';
import { calculateSmartScore, getScoreColorRGB } from '../core/scoreEngine';
import { generateAlerts, getAlertPrioritySummary, getGlobalStatus, getPriorityAlert } from '../core/alerts';
import { generateAIAnalysis } from '../core/aiAnalysis';
import { generateRealGrid } from '../core/realHeatmapEngine';
import { generateHeatmapImage } from './chartGeneratorPro';
import { loadLogoAsBase64 } from './pdfExportWithLogo';

/**
 * Generates a Power BI-style dashboard PDF
 * @param {Object} params - Project parameters
 * @param {Object} calculations - Calculation results
 * @param {Object} recommendations - Recommendations array
 * @param {string} logoBase64 - Optional logo in base64
 * @returns {Promise<jsPDF>} PDF document
 */
export async function generatePowerBIPDF(params, calculations, recommendations = [], logoBase64 = null) {
  // Build report model
  const report = buildFullReport({ params, calculations, recommendations });
  
  // Load logo
  const logo = logoBase64 || await loadLogoAsBase64();
  
  // Calculate smart score
  const scoreResult = calculateSmartScore(calculations);
  
  // Get global status
  const globalStatus = getGlobalStatus(calculations);
  
  // Get priority alert
  const priorityAlert = getPriorityAlert(calculations);
  
  // Generate alerts
  const alerts = generateAlerts(calculations, params);
  const alertSummary = getAlertPrioritySummary(alerts);
  
  // Generate AI analysis
  const aiAnalysis = generateAIAnalysis(calculations, params, scoreResult, alerts);
  
  // Create PDF document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 15;
  
  // Helper functions
  const checkPageBreak = (requiredSpace = 30) => {
    if (yPos + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPos = 15;
    }
  };
  
  const safeText = (text, x, y, options = {}) => {
    const safeTextValue = text || '';
    if (safeTextValue && safeTextValue.length > 0) {
      try {
        // Reemplazar emojis y símbolos Unicode con texto alternativo
        const cleanedText = safeTextValue
          .replace(/🔶/g, '[ALERTA]')
          .replace(/⚠️/g, '[!]')
          .replace(/✅/g, '[OK]')
          .replace(/🧠/g, '[AI]')
          .replace(/🚨/g, '[CRITICO]')
          .replace(/💡/g, '[INFO]')
          .replace(/⚡/g, '[RAYO]')
          .replace(/❌/g, '[X]')
          .replace(/Ω/g, 'Ohm')
          .replace(/©/g, 'Ohm');
        doc.text(cleanedText, x, y, options);
      } catch (error) {
        console.warn('Error al agregar texto:', error);
      }
    }
  };
  
  // ============================================
  // DASHBOARD HEADER
  // ============================================
  
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 10, 5, 25, 20);
    } catch (error) {
      console.error('Error al agregar el logo:', error);
    }
  }
  
  doc.setFontSize(18);
  doc.setTextColor(37, 99, 235);
  doc.setFont(undefined, 'bold');
  safeText('DASHBOARD DE PUESTA A TIERRA', 40, 15);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  safeText(`Proyecto: ${report.metadata.project}`, 40, 22);
  safeText(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 40, 27);
  
  doc.setDrawColor(37, 99, 235);
  doc.line(10, 32, pageWidth - 10, 32);
  yPos = 38;
  
  // ============================================
  // GLOBAL STATUS WARNING (PROMINENT)
  // ============================================
  
  if (globalStatus.status !== 'SEGURO') {
    doc.setFillColor(...globalStatus.colorRGB);
    doc.roundedRect(10, yPos, pageWidth - 20, 18, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    safeText(`[ALERTA] ${globalStatus.status}: ${globalStatus.msg}`, 15, yPos + 11);
    
    yPos += 23;
  }
  
  // ============================================
  // PRIORITY ALERT (IF EXISTS)
  // ============================================
  
  if (priorityAlert) {
    doc.setFillColor(255, 253, 240);
    doc.roundedRect(10, yPos, pageWidth - 20, 14, 2, 2, 'F');
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(1);
    doc.roundedRect(10, yPos, pageWidth - 20, 14, 2, 2, 'S');
    
    doc.setTextColor(234, 179, 8);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    safeText(priorityAlert, 15, yPos + 9);
    
    yPos += 19;
  }
  
  // ============================================
  // GLOBAL SCORE
  // ============================================
  
  const scoreColor = getScoreColorRGB(scoreResult.score);
  doc.setFillColor(...scoreColor);
  doc.roundedRect(10, yPos, pageWidth - 20, 26, 4, 4, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  safeText(`PUNTUACIÓN GLOBAL: ${scoreResult.score.toFixed(1)}%`, 20, yPos + 11);
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  safeText(scoreResult.status, pageWidth - 30, yPos + 11);
  
  yPos += 32;
  
  // ============================================
  // LARGE KPI CARDS (2x2 GRID)
  // ============================================
  
  drawLargeKPICards(doc, report, {
    startY: yPos,
    cardWidth: 90,
    cardHeight: 40,
    cardSpacing: 10,
    cardsPerRow: 2
  });
  
  yPos = 115;
  
  // ============================================
  // ALERTS SECTION
  // ============================================
  
  if (alerts.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.setFont(undefined, 'bold');
    safeText(`[!] ALERTAS (${alertSummary.critical} Críticas, ${alertSummary.warning} Advertencias)`, 10, yPos);
    
    yPos += 8;
    
    // Display top 3 alerts
    const topAlerts = alerts.slice(0, 3);
    topAlerts.forEach((alert, i) => {
      const alertColor = alert.type === 'critical' ? [239, 68, 68] : 
                          alert.type === 'warning' ? [234, 179, 8] : [59, 130, 246];
      
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(10, yPos, pageWidth - 20, 15, 2, 2, 'F');
      doc.setDrawColor(...alertColor);
      doc.setLineWidth(0.5);
      doc.roundedRect(10, yPos, pageWidth - 20, 15, 2, 2, 'S');
      
      doc.setTextColor(...alertColor);
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      safeText(`${alert.title}`, 13, yPos + 6);
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      safeText(alert.message, 13, yPos + 12);
      
      yPos += 17;
    });
  } else {
    doc.setFontSize(11);
    doc.setTextColor(34, 197, 94);
    doc.setFont(undefined, 'bold');
    safeText('[OK] Sin alertas - Sistema óptimo', 10, yPos);
    yPos += 15;
  }
  
  yPos = 150;
  
  // ============================================
  // CHARTS SECTION
  // ============================================
  
  // Bar Chart
  try {
    const barChart = await generatePBIBarChart(report);
    doc.addImage(barChart, 'PNG', 10, yPos, 120, 55);
  } catch (error) {
    console.error('Error al generar gráfica de barras:', error);
  }
  
  // Doughnut Chart
  try {
    const doughnut = await generateDoughnutChart(scoreResult.score);
    doc.addImage(doughnut, 'PNG', 140, yPos, 55, 55);
  } catch (error) {
    console.error('Error al generar gráfica doughnut:', error);
  }
  
  yPos = 210;
  
  // ============================================
  // AI ANALYSIS / CONCLUSION
  // ============================================
  
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.setFont(undefined, 'bold');
  safeText('[AI] ANALISIS INTELIGENTE', 10, yPos);
  
  yPos += 8;
  
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  
  const analysisLines = aiAnalysis.technicalAnalysis ? aiAnalysis.technicalAnalysis.split('\n') : [];
  analysisLines.forEach((line, i) => {
    if (line && line.trim()) {
      safeText(line.substring(0, 180), 10, yPos + (i * 4));
    }
  });
  
  yPos += analysisLines.length * 4 + 5;
  
  // Conclusion
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  safeText('CONCLUSIÓN:', 10, yPos);
  yPos += 4;
  
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  
  const conclusionLines = aiAnalysis.conclusion ? aiAnalysis.conclusion.split('\n') : [];
  conclusionLines.forEach((line, i) => {
    if (line && line.trim()) {
      safeText(line.substring(0, 180), 10, yPos + (i * 4));
    }
  });
  
  yPos = 270;
  
  // ============================================
  // FOOTER
  // ============================================
  
  const totalPages = doc.internal.pages.length - 1;
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);
    
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    safeText(`Dashboard Power BI Profesional • Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    
    doc.setFontSize(6);
    safeText(`Generado: ${new Date().toLocaleString('es-MX')}`, 10, pageHeight - 8);
    safeText(`Puntuación: ${scoreResult.score.toFixed(1)}%`, pageWidth - 30, pageHeight - 8);
  }
  
  return doc;
}

/**
 * Convenience function to export Power BI dashboard PDF
 * @param {Object} params - Project parameters
 * @param {Object} calculations - Calculation results
 * @param {Object} recommendations - Recommendations array
 * @param {string} filename - Optional filename
 */
export async function exportPowerBIPDF(params, calculations, recommendations = [], filename = null) {
  const doc = await generatePowerBIPDF(params, calculations, recommendations);
  const defaultFilename = `Dashboard_PowerBI_${params.projectName || 'Proyecto'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename || defaultFilename);
  return doc;
}

export default {
  generatePowerBIPDF,
  exportPowerBIPDF
};
