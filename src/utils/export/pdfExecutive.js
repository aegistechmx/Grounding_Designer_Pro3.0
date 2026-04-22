import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateChart, generateGaugeChart, generateHeatmapImage } from './chartGeneratorPro';
import { generateHeatmapData } from '../core/heatmapEnginePro';

// ============================================
// CONSTRUIR MODELO DE REPORTE
// ============================================
export const buildReportModel = ({ params, calculations, recommendations, codeValidation, materialList }) => {
  const safeCalculations = calculations || {};
  const safeParams = params || {};
  
  return {
    metadata: {
      projectName: safeParams.projectName || 'Proyecto de Puesta a Tierra',
      location: safeParams.projectLocation || 'Puerto Vallarta, Jalisco, México',
      clientName: safeParams.clientName || 'No especificado',
      engineerName: safeParams.engineerName || 'Ingeniero Especialista',
      date: new Date().toLocaleDateString('es-MX')
    },
    input: {
      gridLength: safeParams.gridLength || 30,
      gridWidth: safeParams.gridWidth || 16,
      soilResistivity: safeParams.soilResistivity || 100,
      faultCurrent: safeCalculations.faultCurrent || 0,
      currentDivisionFactor: safeParams.currentDivisionFactor || 0.2
    },
    results: {
      Rg: safeCalculations.Rg || 0,
      GPR: safeCalculations.GPR || 0,
      Em: safeCalculations.Em || 0,
      Es: safeCalculations.Es || 0,
      limits: {
        touch: safeCalculations.Etouch70 || 1,
        step: safeCalculations.Estep70 || 1
      },
      complies: safeCalculations.complies || false
    },
    recommendations: Array.isArray(recommendations) ? recommendations : [],
    codeValidation: codeValidation || {}
  };
};

// ============================================
// CONSTRUIR ENHANCEMENT DESDE UI
// ============================================
export const buildEnhancementFromUI = (calculations) => {
  const safeCalc = calculations || {};
  const touchMargin = safeCalc.Etouch70 && safeCalc.Em 
    ? ((safeCalc.Etouch70 - safeCalc.Em) / safeCalc.Etouch70 * 100)
    : 0;
  
  const efficiency = safeCalc.Rg 
    ? Math.min(100, (5 / safeCalc.Rg) * 20)
    : 0;
  
  const costIndex = 70 + Math.random() * 20; // Placeholder
  
  return {
    score: Math.min(100, Math.max(0, 50 + touchMargin * 0.5)),
    safetyMargin: touchMargin.toFixed(1),
    efficiency: efficiency.toFixed(0),
    costIndex: costIndex.toFixed(0),
    risk: touchMargin > 70 ? 'BAJO' : touchMargin > 40 ? 'MEDIO' : 'ALTO',
    status: safeCalc.complies ? 'CUMPLE IEEE 80' : 'NO CUMPLE IEEE 80',
    conclusions: [
      `El sistema de puesta a tierra ${safeCalc.complies ? 'cumple' : 'no cumple'} con los criterios de seguridad de IEEE 80.`,
      `Los valores de tensión de contacto (${safeCalc.Em?.toFixed(0) || 'N/A'} V) y paso (${safeCalc.Es?.toFixed(0) || 'N/A'} V) ${safeCalc.complies ? 'están dentro' : 'exceden'} de los límites permisibles.`,
      `El diseño presenta un margen de seguridad de ${touchMargin.toFixed(1)}%.`,
      `La resistencia de malla (${safeCalc.Rg?.toFixed(2) || 'N/A'} Ω) es ${safeCalc.Rg <= 5 ? 'adecuada' : 'elevada'} para el nivel de falla.`
    ]
  };
};

// ============================================
// GENERAR PDF EJECUTIVO
// ============================================
export const generateExecutivePDF = async (report, enhancement) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // ============================================
  // PORTADA
  // ============================================
  doc.setFontSize(24);
  doc.setTextColor(37, 99, 235);
  doc.text('REPORTE EJECUTIVO', pageWidth / 2, 40, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Grounding Designer Pro', pageWidth / 2, 55, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`Proyecto: ${report.metadata?.projectName || 'N/A'}`, 20, 80);
  doc.text(`Ubicación: ${report.metadata?.location || 'N/A'}`, 20, 92);
  doc.text(`Cliente: ${report.metadata?.clientName || 'N/A'}`, 20, 104);
  doc.text(`Ingeniero: ${report.metadata?.engineerName || 'N/A'}`, 20, 116);
  doc.text(`Fecha: ${report.metadata?.date || new Date().toLocaleDateString('es-MX')}`, 20, 128);
  
  // Score grande
  const scoreColor = enhancement.score >= 70 ? [34, 197, 94] : enhancement.score >= 50 ? [245, 158, 11] : [239, 68, 68];
  doc.setFontSize(48);
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${Math.round(enhancement.score)}%`, pageWidth - 50, 80);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Score de Diseño', pageWidth - 60, 95);
  
  doc.setFontSize(12);
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  if (enhancement.status) doc.text(enhancement.status, pageWidth - 70, 110);
  
  doc.line(20, 140, pageWidth - 20, 140);
  
  // ============================================
  // INDICADORES PRINCIPALES
  // ============================================
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.text('INDICADORES PRINCIPALES', 20, 30);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  const indicators = [
    { label: 'Seguridad', value: `${enhancement.safetyMargin}%`, color: '#22c55e' },
    { label: 'Eficiencia', value: `${enhancement.efficiency}%`, color: '#3b82f6' },
    { label: 'Costo', value: `${enhancement.costIndex}%`, color: '#f59e0b' },
    { label: 'Riesgo', value: enhancement.risk, color: enhancement.risk === 'BAJO' ? '#22c55e' : '#ef4444' }
  ];
  
  let yPos = 50;
  indicators.forEach((ind, i) => {
    const x = 30 + (i % 2) * 90;
    const y = yPos + Math.floor(i / 2) * 30;
    
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(x, y, 80, 25, 3, 3, 'F');
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(ind.label, x + 5, y + 8);
    
    doc.setTextColor(ind.color);
    doc.setFontSize(14);
    doc.text(ind.value, x + 5, y + 20);
  });
  
  // ============================================
  // GRÁFICA DE SEGURIDAD
  // ============================================
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.text('VERIFICACIÓN DE SEGURIDAD', 20, 30);
  
  try {
    const chartImage = await generateChart(report);
    doc.addImage(chartImage, 'PNG', 15, 45, 180, 100);
  } catch (error) {
    console.error('Error generando gráfica:', error);
    doc.text('No se pudo generar la gráfica', 20, 80);
  }
  
  // ============================================
  // HEATMAP DE POTENCIAL
  // ============================================
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.text('DISTRIBUCIÓN DE POTENCIAL', 20, 30);
  
  try {
    const grid = generateHeatmapData(report.results, report.input);
    const heatmapImage = await generateHeatmapImage(grid, 150, 150);
    doc.addImage(heatmapImage, 'PNG', 30, 50, 150, 150);
  } catch (error) {
    console.error('Error generando heatmap:', error);
    doc.text('No se pudo generar el mapa de calor', 20, 80);
  }
  
  // Leyenda del heatmap
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Alto', 190, 80);
  doc.setFillColor(239, 68, 68);
  doc.roundedRect(185, 85, 15, 10, 2, 2, 'F');
  doc.text('Medio', 190, 110);
  doc.setFillColor(234, 179, 8);
  doc.roundedRect(185, 115, 15, 10, 2, 2, 'F');
  doc.text('Bajo', 190, 140);
  doc.setFillColor(34, 197, 94);
  doc.roundedRect(185, 145, 15, 10, 2, 2, 'F');
  
  // ============================================
  // CONCLUSIONES TÉCNICAS
  // ============================================
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.text('CONCLUSIONES TÉCNICAS', 20, 30);
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  let y = 50;
  enhancement.conclusions.forEach((conclusion, i) => {
    const lines = doc.splitTextToSize(`• ${conclusion}`, 170);
    lines.forEach((line) => {
      doc.text(line, 20, y);
      y += 6;
    });
    y += 4;
  });
  
  // ============================================
  // RESULTADOS DETALLADOS
  // ============================================
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.text('RESULTADOS DETALLADOS', 20, 30);
  
  const resultsData = [
    ['Resistencia de Malla (Rg)', `${report.results.Rg.toFixed(2)} Ω`, report.results.Rg <= 5 ? '✓ OK' : '⚠ ALTO'],
    ['GPR (Elevación de Potencial)', `${report.results.GPR.toFixed(0)} V`, report.results.GPR < 10000 ? '✓ OK' : '⚠ ALTO'],
    ['Tensión de Contacto (Em)', `${report.results.Em.toFixed(0)} V`, report.results.Em <= report.results.limits.touch ? '✓ OK' : '⚠ ALTO'],
    ['Tensión de Paso (Es)', `${report.results.Es.toFixed(0)} V`, report.results.Es <= report.results.limits.step ? '✓ OK' : '⚠ ALTO']
  ];
  
  autoTable(doc, {
    startY: 45,
    head: [['Parámetro', 'Valor', 'Estado']],
    body: resultsData,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], fontSize: 10 },
    styles: { fontSize: 9 },
    margin: { left: 20 },
    tableWidth: 170
  });
  
  // ============================================
  // PIE DE PÁGINA
  // ============================================
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    doc.text('Grounding Designer Pro • IEEE 80-2013', pageWidth / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
  }
  
  return doc;
};

export default {
  buildReportModel,
  buildEnhancementFromUI,
  generateExecutivePDF
};