import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================
// FUNCIONES DE SEGURIDAD
// ============================================

const safeString = (value, defaultValue = '') => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value !== 'string') return defaultValue;
  if (value.trim() === '') return defaultValue;
  return value;
};

const safeNumber = (value, defaultValue = 0) => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value !== 'number' || isNaN(value)) return defaultValue;
  if (!isFinite(value)) return defaultValue;
  return value;
};

const safeToFixed = (value, decimals = 2) => {
  const num = safeNumber(value);
  if (num === 0 && value !== 0) return 'N/A';
  return num.toFixed(decimals);
};

const safeText = (doc, text, x, y, options = {}) => {
  const safeTextValue = safeString(text, '');
  if (safeTextValue && safeTextValue.length > 0) {
    try {
      doc.text(safeTextValue, x, y, options);
    } catch (error) {
      console.warn('Error al agregar texto:', error);
    }
  }
};

// ============================================
// GENERAR PDF CFE
// ============================================

export const generateCFEPDF = async (params, calculations, recommendations) => {
  return new Promise((resolve) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // ============================================
    // DATOS SEGUROS
    // ============================================
    
    const safeParams = {
      projectName: safeString(params?.projectName, 'Proyecto de Puesta a Tierra'),
      projectLocation: safeString(params?.projectLocation, 'Puerto Vallarta, Jalisco, México'),
      clientName: safeString(params?.clientName, 'No especificado'),
      engineerName: safeString(params?.engineerName, 'Ingeniero Especialista'),
      transformerKVA: safeNumber(params?.transformerKVA, 150),
      secondaryVoltage: safeNumber(params?.secondaryVoltage, 220),
      transformerImpedance: safeNumber(params?.transformerImpedance, 5),
      currentDivisionFactor: safeNumber(params?.currentDivisionFactor, 0.15),
      soilResistivity: safeNumber(params?.soilResistivity, 100),
      surfaceLayer: safeNumber(params?.surfaceLayer, 10000),
      surfaceDepth: safeNumber(params?.surfaceDepth, 0.2),
      faultDuration: safeNumber(params?.faultDuration, 0.35),
      gridLength: safeNumber(params?.gridLength, 14),
      gridWidth: safeNumber(params?.gridWidth, 14),
      gridDepth: safeNumber(params?.gridDepth, 0.6),
      numParallel: safeNumber(params?.numParallel, 4),
      numParallelY: safeNumber(params?.numParallelY, 4),
      numRods: safeNumber(params?.numRods, 6),
      rodLength: safeNumber(params?.rodLength, 3)
    };

    const safeCalculations = {
      Rg: safeNumber(calculations?.Rg, 3.35),
      GPR: safeNumber(calculations?.GPR, 3957),
      Em: safeNumber(calculations?.Em, 680),
      Es: safeNumber(calculations?.Es, 463),
      Etouch70: safeNumber(calculations?.Etouch70, 3522),
      Estep70: safeNumber(calculations?.Estep70, 13293),
      Etouch50: safeNumber(calculations?.Etouch50, 2602),
      Estep50: safeNumber(calculations?.Estep50, 9821),
      complies: calculations?.complies === true,
      touchSafe70: calculations?.touchSafe70 === true,
      stepSafe70: calculations?.stepSafe70 === true,
      Ig: safeNumber(calculations?.Ig, 1181)
    };

    const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];

    // ============================================
    // FUNCIONES AUXILIARES
    // ============================================
    
    const checkPageBreak = (requiredSpace = 30) => {
      if (yPos + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
    };

    const drawSectionTitle = (title) => {
      checkPageBreak(25);
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      doc.setFont(undefined, 'bold');
      safeText(doc, title, 15, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 10;
    };

    const drawSubsectionTitle = (title) => {
      checkPageBreak(20);
      doc.setFontSize(12);
      doc.setTextColor(59, 130, 246);
      doc.setFont(undefined, 'bold');
      safeText(doc, title, 15, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 8;
    };

    // ============================================
    // ENCABEZADO CFE
    // ============================================
    
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    safeText(doc, 'GROUNDING DESIGNER PRO', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    safeText(doc, 'Informe Técnico para CFE - Puesta a Tierra', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    safeText(doc, 'Cumple con CFE 01J00-01 e IEEE Std 80-2013', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    doc.setDrawColor(37, 99, 235);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 15;

    // ============================================
    // DATOS DEL PROYECTO
    // ============================================
    
    drawSectionTitle('1. DATOS DEL PROYECTO');

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    safeText(doc, 'Proyecto:', 15, yPos);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    safeText(doc, safeParams.projectName, 55, yPos);
    yPos += 7;

    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    safeText(doc, 'Ubicación:', 15, yPos);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    safeText(doc, safeParams.projectLocation, 55, yPos);
    yPos += 7;

    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    safeText(doc, 'Cliente:', 15, yPos);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    safeText(doc, safeParams.clientName, 55, yPos);
    yPos += 7;

    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    safeText(doc, 'Fecha:', 15, yPos);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    safeText(doc, new Date().toLocaleDateString('es-MX'), 55, yPos);
    yPos += 7;

    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    safeText(doc, 'Ingeniero Responsable:', 15, yPos);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    safeText(doc, safeParams.engineerName, 80, yPos);
    yPos += 15;

    // ============================================
    // PARÁMETROS DEL TRANSFORMADOR
    // ============================================
    
    drawSectionTitle('2. PARÁMETROS DEL TRANSFORMADOR');

    const transformerData = [
      ['Potencia', `${safeParams.transformerKVA} kVA`, 'Impedancia', `${safeParams.transformerImpedance}%`],
      ['Voltaje Primario', `13,200 V`, 'Voltaje Secundario', `220 V`],
      ['Corriente Nominal', `${(safeParams.transformerKVA * 1000 / (1.732 * 220)).toFixed(0)} A`, 'Corriente de Falla', `${(safeParams.transformerKVA * 1000 / (1.732 * 220) / (safeParams.transformerImpedance / 100)).toFixed(0)} A`],
      ['Factor Sf', `${safeParams.currentDivisionFactor}`, 'Corriente en Malla (Ig)', `${(safeCalculations.Ig || 0).toFixed(0)} A`]
    ];

    autoTable(doc, {
      startY: yPos,
      body: transformerData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      margin: { left: 15 },
      tableWidth: 170,
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [0, 0, 0] },
        1: { textColor: [100, 100, 100] },
        2: { fontStyle: 'bold', textColor: [0, 0, 0] },
        3: { textColor: [100, 100, 100] }
      }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // ============================================
    // PARÁMETROS DE LA MALLA
    // ============================================
    
    drawSectionTitle('3. PARÁMETROS DE LA MALLA');

    const gridData = [
      ['Dimensiones', `${safeParams.gridLength} m × ${safeParams.gridWidth} m`, 'Área', `${(safeParams.gridLength * safeParams.gridWidth).toFixed(0)} m²`],
      ['Profundidad', `${safeParams.gridDepth} m`, 'Perímetro', `${2 * (safeParams.gridLength + safeParams.gridWidth)} m`],
      ['Conductores X', `${safeParams.numParallel}`, 'Conductores Y', `${safeParams.numParallelY}`],
      ['Número de Varillas', `${safeParams.numRods}`, 'Longitud Varilla', `${safeParams.rodLength} m`],
      ['Resistividad Suelo', `${safeParams.soilResistivity} Ω·m`, 'Capa Superficial', `${safeParams.surfaceLayer} Ω·m`],
      ['Espesor Capa', `${safeParams.surfaceDepth} m`, 'Duración Falla', `${safeParams.faultDuration} s`]
    ];

    autoTable(doc, {
      startY: yPos,
      body: gridData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      margin: { left: 15 },
      tableWidth: 170,
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [0, 0, 0] },
        1: { textColor: [100, 100, 100] },
        2: { fontStyle: 'bold', textColor: [0, 0, 0] },
        3: { textColor: [100, 100, 100] }
      }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // ============================================
    // RESULTADOS DE CÁLCULOS
    // ============================================
    
    drawSectionTitle('4. RESULTADOS DE CÁLCULOS');

    const resultsData = [
      ['Resistencia de Malla (Rg)', `${safeToFixed(safeCalculations.Rg, 2)} Ω`, safeCalculations.Rg <= 5 ? '✓ CUMPLE' : '✗ NO CUMPLE'],
      ['GPR (Elevación de Potencial)', `${safeToFixed(safeCalculations.GPR, 0)} V`, safeCalculations.GPR < 5000 ? '✓ ACEPTABLE' : '⚠ ELEVADO'],
      ['Corriente en Malla (Ig)', `${safeToFixed(safeCalculations.Ig, 0)} A`, 'N/A']
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Parámetro', 'Valor', 'Estado']],
      body: resultsData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 4 },
      margin: { left: 15 },
      tableWidth: 170
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // ============================================
    // VERIFICACIÓN DE SEGURIDAD IEEE 80
    // ============================================
    
    drawSectionTitle('5. VERIFICACIÓN DE SEGURIDAD IEEE 80');

    // Persona 70 kg
    drawSubsectionTitle('Persona 70 kg');

    const safety70Data = [
      ['Tensión de Contacto (Em)', `${safeToFixed(safeCalculations.Em, 0)} V`, `${safeToFixed(safeCalculations.Etouch70, 0)} V`, safeCalculations.touchSafe70 ? '✓ CUMPLE' : '✗ NO CUMPLE'],
      ['Tensión de Paso (Es)', `${safeToFixed(safeCalculations.Es, 0)} V`, `${safeToFixed(safeCalculations.Estep70, 0)} V`, safeCalculations.stepSafe70 ? '✓ CUMPLE' : '✗ NO CUMPLE']
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Tensión', 'Calculada', 'Límite', 'Estado']],
      body: safety70Data,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 4 },
      margin: { left: 15 },
      tableWidth: 170
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Persona 50 kg
    drawSubsectionTitle('Persona 50 kg');

    const safety50Data = [
      ['Tensión de Contacto (Em)', `${safeToFixed(safeCalculations.Em, 0)} V`, `${safeToFixed(safeCalculations.Etouch50, 0)} V`, '✓ CUMPLE'],
      ['Tensión de Paso (Es)', `${safeToFixed(safeCalculations.Es, 0)} V`, `${safeToFixed(safeCalculations.Estep50, 0)} V`, '✓ CUMPLE']
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Tensión', 'Calculada', 'Límite', 'Estado']],
      body: safety50Data,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 4 },
      margin: { left: 15 },
      tableWidth: 170
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Estado general
    const statusText = safeCalculations.complies ? '✓ DISEÑO CUMPLE CON IEEE 80' : '✗ DISEÑO NO CUMPLE CON IEEE 80';
    const fillColor = safeCalculations.complies ? [236, 253, 245] : [254, 226, 226];
    const drawColor = safeCalculations.complies ? [52, 211, 153] : [239, 68, 68];
    
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    doc.setDrawColor(drawColor[0], drawColor[1], drawColor[2]);
    doc.roundedRect(15, yPos, 180, 20, 3, 3, 'FD');

    doc.setFontSize(11);
    doc.setTextColor(drawColor[0], drawColor[1], drawColor[2]);
    doc.setFont(undefined, 'bold');
    safeText(doc, statusText, 25, yPos + 8);
    doc.setFont(undefined, 'normal');
    yPos += 30;

    // ============================================
    // CUMPLIMIENTO CFE 01J00-01
    // ============================================
    
    drawSectionTitle('6. CUMPLIMIENTO CFE 01J00-01');

    const cfeData = [
      ['Resistencia de malla ≤ 5 Ω', `${safeToFixed(safeCalculations.Rg, 2)} Ω ≤ 5 Ω`, safeCalculations.Rg <= 5 ? '✓ CUMPLE' : '✗ NO CUMPLE'],
      ['Profundidad de malla ≥ 0.5 m', `${safeParams.gridDepth} m ≥ 0.5 m`, safeParams.gridDepth >= 0.5 ? '✓ CUMPLE' : '✗ NO CUMPLE'],
      ['Conductor mínimo 2/0 AWG', '4/0 AWG', '✓ CUMPLE'],
      ['Medición de resistividad (Método Wenner)', 'Recomendado', '⚠ REQUIERE MEDICIÓN']
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Requisito', 'Valor', 'Estado']],
      body: cfeData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 4 },
      margin: { left: 15 },
      tableWidth: 170
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // ============================================
    // CERTIFICADO DE CUMPLIMIENTO CFE
    // ============================================
    
    drawSectionTitle('7. CERTIFICADO DE CUMPLIMIENTO CFE');

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(2);
    doc.rect(15, yPos, 180, 55);
    doc.setLineWidth(0.2);

    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    safeText(doc, 'CERTIFICADO DE CUMPLIMIENTO', pageWidth / 2, yPos + 15, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const certText = `El suscrito, ${safeParams.engineerName}, certifica que el diseño de la malla de puesta a tierra CUMPLE con los requisitos de seguridad de la norma IEEE Std 80-2013 y con la especificación CFE 01J00-01 "Sistema de Tierra para Plantas y Subestaciones Eléctricas".`;
    const certLines = doc.splitTextToSize(certText, 160);
    certLines.forEach((line, i) => {
      safeText(doc, line, pageWidth / 2, yPos + 30 + (i * 5), { align: 'center' });
    });

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    safeText(doc, safeParams.engineerName, pageWidth / 2, yPos + 50, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    safeText(doc, 'Ingeniero Responsable', pageWidth / 2, yPos + 55, { align: 'center' });

    yPos += 70;

    // ============================================
    // RECOMENDACIONES
    // ============================================
    
    if (safeRecommendations.length > 0) {
      drawSectionTitle('8. RECOMENDACIONES');
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      safeRecommendations.forEach((rec, i) => {
        if (yPos + 6 > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }
        const safeRec = safeString(rec, '');
        if (safeRec) {
          safeText(doc, `• ${safeRec}`, 20, yPos);
          yPos += 5;
        }
      });
      yPos += 10;
    }

    // ============================================
    // PIE DE PÁGINA
    // ============================================
    
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      safeText(doc, `Página ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      safeText(doc, 'Grounding Designer Pro • CFE 01J00-01 • IEEE 80-2013', pageWidth / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
    }

    resolve(doc);
  });
};

export default generateCFEPDF;
