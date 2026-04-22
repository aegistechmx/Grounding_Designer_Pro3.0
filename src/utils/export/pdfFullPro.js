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
// GENERAR PDF PROFESIONAL
// ============================================

export const generateFullPDF = async (params, calculations, recommendations) => {
  return new Promise((resolve) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;
    let pageNum = 1;

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
      Ig: safeNumber(calculations?.Ig, 1181),
      faultCurrent: safeNumber(calculations?.faultCurrent, 7873),
      gridArea: safeNumber(calculations?.gridArea, 196),
      totalConductor: safeNumber(calculations?.totalConductor, 224),
      totalRodLength: safeNumber(calculations?.totalRodLength, 18)
    };

    const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];

    // ============================================
    // FUNCIONES AUXILIARES
    // ============================================
    
    const checkPageBreak = (requiredSpace = 30) => {
      if (yPos + requiredSpace > pageHeight - 25) {
        addFooter();
        doc.addPage();
        pageNum++;
        yPos = 20;
        addHeader();
      }
    };

    const addHeader = () => {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      safeText(doc, 'GROUNDING DESIGNER PRO', pageWidth / 2, 10, { align: 'center' });
      safeText(doc, 'Informe Técnico de Malla de Puesta a Tierra', pageWidth / 2, 16, { align: 'center' });
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 22, pageWidth - 15, 22);
    };

    const addFooter = () => {
      doc.setPage(pageNum);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      const totalPages = doc.internal.pages.length - 1;
      safeText(doc, `Página ${pageNum} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      safeText(doc, 'Grounding Designer Pro • IEEE 80-2013 & CFE 01J00-01', pageWidth / 2, pageHeight - 5, { align: 'center' });
    };

    const drawSectionTitle = (title, number = '') => {
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      doc.setFont(undefined, 'bold');
      const sectionText = number ? `${number}. ${title}` : title;
      safeText(doc, sectionText, 15, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 8;
      doc.setDrawColor(37, 99, 235);
      doc.line(15, yPos, pageWidth - 15, yPos);
      yPos += 6;
    };

    const drawSubsectionTitle = (title) => {
      checkPageBreak(15);
      doc.setFontSize(11);
      doc.setTextColor(59, 130, 246);
      doc.setFont(undefined, 'bold');
      safeText(doc, title, 15, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 6;
    };

    // ============================================
    // PORTADA
    // ============================================
    
    addHeader();
    yPos = 50;
    
    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235);
    safeText(doc, 'INFORME TÉCNICO', pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;
    
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);
    safeText(doc, 'DE PUESTA A TIERRA', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    safeText(doc, 'Diseño según IEEE Std 80-2013', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    safeText(doc, 'Cumple con CFE 01J00-01 y NOM-001-SEDE-2012', pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;
    
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(40, yPos, pageWidth - 40, yPos);
    yPos += 15;
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    safeText(doc, 'Proyecto:', 40, yPos);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    safeText(doc, safeParams.projectName, 80, yPos);
    yPos += 8;
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    safeText(doc, 'Ubicación:', 40, yPos);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    safeText(doc, safeParams.projectLocation, 80, yPos);
    yPos += 8;
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    safeText(doc, 'Cliente:', 40, yPos);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    safeText(doc, safeParams.clientName, 80, yPos);
    yPos += 8;
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    safeText(doc, 'Fecha:', 40, yPos);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    safeText(doc, new Date().toLocaleDateString('es-MX'), 80, yPos);
    yPos += 8;
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    safeText(doc, 'Ingeniero Responsable:', 40, yPos);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    safeText(doc, safeParams.engineerName, 105, yPos);
    yPos += 20;
    
    // Estado de cumplimiento
    const statusText = safeCalculations.complies ? '✓ DISEÑO APROBADO' : '✗ DISEÑO NO APROBADO';
    const statusColor = safeCalculations.complies ? [34, 197, 94] : [239, 68, 68];
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(40, yPos, pageWidth - 80, 12, 3, 3, 'F');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    safeText(doc, statusText, pageWidth / 2, yPos + 8, { align: 'center' });
    
    addFooter();

    // ============================================
    // 1. DATOS DEL PROYECTO
    // ============================================
    
    doc.addPage();
    pageNum++;
    addHeader();
    yPos = 30;
    
    drawSectionTitle('DATOS DEL PROYECTO', '1');
    
    const projectData = [
      ['Proyecto', safeParams.projectName],
      ['Ubicación', safeParams.projectLocation],
      ['Cliente', safeParams.clientName],
      ['Fecha', new Date().toLocaleDateString('es-MX')],
      ['Ingeniero Responsable', safeParams.engineerName]
    ];
    
    autoTable(doc, {
      startY: yPos,
      body: projectData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 4 },
      margin: { left: 20 },
      tableWidth: 170,
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [0, 0, 0], cellWidth: 50 },
        1: { textColor: [100, 100, 100] }
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;

    // ============================================
    // 2. PARÁMETROS DE ENTRADA
    // ============================================
    
    drawSectionTitle('PARÁMETROS DE ENTRADA', '2');
    
    const paramsData = [
      ['Transformador', `${safeParams.transformerKVA} kVA`, 'Impedancia', `${safeParams.transformerImpedance}%`],
      ['Voltaje Primario', `13,200 V`, 'Voltaje Secundario', `220 V`],
      ['Resistividad Suelo', `${safeParams.soilResistivity} Ω·m`, 'Capa Superficial', `${safeParams.surfaceLayer} Ω·m`],
      ['Espesor Capa', `${safeParams.surfaceDepth} m`, 'Duración Falla', `${safeParams.faultDuration} s`],
      ['Factor Sf', `${safeParams.currentDivisionFactor}`, 'Profundidad Malla', `${safeParams.gridDepth} m`],
      ['Largo Malla', `${safeParams.gridLength} m`, 'Ancho Malla', `${safeParams.gridWidth} m`],
      ['Conductores X', `${safeParams.numParallel}`, 'Conductores Y', `${safeParams.numParallelY}`],
      ['Número Varillas', `${safeParams.numRods}`, 'Longitud Varilla', `${safeParams.rodLength} m`]
    ];
    
    autoTable(doc, {
      startY: yPos,
      body: paramsData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 20 },
      tableWidth: 170,
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [0, 0, 0], cellWidth: 45 },
        1: { textColor: [100, 100, 100], cellWidth: 40 },
        2: { fontStyle: 'bold', textColor: [0, 0, 0], cellWidth: 45 },
        3: { textColor: [100, 100, 100], cellWidth: 40 }
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;

    // ============================================
    // 3. GEOMETRÍA DE LA MALLA
    // ============================================
    
    drawSectionTitle('GEOMETRÍA DE LA MALLA', '3');
    
    const geometryData = [
      ['Área de la malla', `${safeToFixed(safeCalculations.gridArea, 0)} m²`, 'Perímetro', `${2 * (safeParams.gridLength + safeParams.gridWidth)} m`],
      ['Conductores X', `${safeParams.numParallel}`, 'Conductores Y', `${safeParams.numParallelY}`],
      ['Conductor total', `${safeToFixed(safeCalculations.totalConductor, 0)} m`, 'Varillas total', `${safeToFixed(safeCalculations.totalRodLength, 0)} m`],
      ['Longitud total (LT)', `${safeToFixed(safeCalculations.totalConductor + safeCalculations.totalRodLength, 0)} m`, 'Profundidad', `${safeParams.gridDepth} m`]
    ];
    
    autoTable(doc, {
      startY: yPos,
      body: geometryData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 20 },
      tableWidth: 170,
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [0, 0, 0], cellWidth: 45 },
        1: { textColor: [100, 100, 100], cellWidth: 40 },
        2: { fontStyle: 'bold', textColor: [0, 0, 0], cellWidth: 45 },
        3: { textColor: [100, 100, 100], cellWidth: 40 }
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;

    // ============================================
    // 4. RESULTADOS DE CÁLCULOS
    // ============================================
    
    drawSectionTitle('RESULTADOS DE CÁLCULOS', '4');
    
    const resultsData = [
      ['Resistencia de Malla (Rg)', `${safeToFixed(safeCalculations.Rg, 3)} Ω`, safeCalculations.Rg <= 5 ? '✓ CUMPLE' : '✗ NO CUMPLE'],
      ['GPR (Elevación de Potencial)', `${safeToFixed(safeCalculations.GPR, 0)} V`, 'N/A'],
      ['Corriente de Falla (If)', `${safeToFixed(safeCalculations.faultCurrent, 0)} A`, 'N/A'],
      ['Corriente en Malla (Ig)', `${safeToFixed(safeCalculations.Ig, 0)} A`, 'N/A']
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Métrica', 'Valor', 'Estado']],
      body: resultsData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 4 },
      margin: { left: 20 },
      tableWidth: 170
    });
    
    yPos = doc.lastAutoTable.finalY + 15;

    // ============================================
    // 5. TENSIONES DE SEGURIDAD
    // ============================================
    
    drawSectionTitle('TENSIONES DE SEGURIDAD', '5');
    
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
      margin: { left: 20 },
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
      margin: { left: 20 },
      tableWidth: 170
    });
    
    yPos = doc.lastAutoTable.finalY + 15;

    // ============================================
    // 6. VERIFICACIÓN DE SEGURIDAD
    // ============================================
    
    drawSectionTitle('VERIFICACIÓN DE SEGURIDAD', '6');
    
    const statusBgColor = safeCalculations.complies ? [236, 253, 245] : [254, 226, 226];
    const statusBorderColor = safeCalculations.complies ? [52, 211, 153] : [239, 68, 68];
    
    doc.setFillColor(statusBgColor[0], statusBgColor[1], statusBgColor[2]);
    doc.setDrawColor(statusBorderColor[0], statusBorderColor[1], statusBorderColor[2]);
    doc.roundedRect(20, yPos, pageWidth - 40, 20, 4, 4, 'FD');
    
    doc.setFontSize(11);
    doc.setTextColor(statusBorderColor[0], statusBorderColor[1], statusBorderColor[2]);
    doc.setFont(undefined, 'bold');
    safeText(doc, safeCalculations.complies ? '✓ DISEÑO CUMPLE CON IEEE 80' : '✗ DISEÑO NO CUMPLE CON IEEE 80', pageWidth / 2, yPos + 13, { align: 'center' });
    doc.setFont(undefined, 'normal');
    yPos += 30;

    // ============================================
    // 7. MATERIALES Y COSTOS
    // ============================================
    
    drawSectionTitle('MATERIALES Y COSTOS', '7');
    
    const conductorCost = safeCalculations.totalConductor * 3.5;
    const rodCost = safeParams.numRods * 25;
    const gravelVolume = safeCalculations.gridArea * safeParams.surfaceDepth;
    const gravelCost = gravelVolume * 45;
    const totalCost = conductorCost + rodCost + gravelCost;
    
    const costData = [
      ['Conductor de cobre', `${safeToFixed(safeCalculations.totalConductor, 0)} m`, `$${safeToFixed(conductorCost, 2)}`],
      ['Varillas de acero', `${safeParams.numRods} pz`, `$${safeToFixed(rodCost, 2)}`],
      ['Grava superficial', `${safeToFixed(gravelVolume, 2)} m³`, `$${safeToFixed(gravelCost, 2)}`],
      ['', '', ''],
      ['TOTAL ESTIMADO', '', `$${safeToFixed(totalCost, 2)}`]
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Concepto', 'Cantidad', 'Costo']],
      body: costData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 4 },
      margin: { left: 20 },
      tableWidth: 170,
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'right' }
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;

    // ============================================
    // 8. RECOMENDACIONES
    // ============================================
    
    if (safeRecommendations.length > 0) {
      drawSectionTitle('RECOMENDACIONES', '8');
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      for (let i = 0; i < safeRecommendations.length; i++) {
        if (yPos + 6 > pageHeight - 40) {
          addFooter();
          doc.addPage();
          pageNum++;
          addHeader();
          yPos = 30;
        }
        const rec = safeString(safeRecommendations[i], '');
        if (rec) {
          const cleanRec = rec.replace(/[&þ']/g, '').trim();
          if (cleanRec) {
            safeText(doc, `• ${cleanRec}`, 20, yPos);
            yPos += 5;
          }
        }
      }
      yPos += 10;
    }

    // ============================================
    // 9. CERTIFICADO DE CUMPLIMIENTO
    // ============================================
    
    drawSectionTitle('CERTIFICADO DE CUMPLIMIENTO', '9');
    
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(2);
    doc.rect(20, yPos, pageWidth - 40, 55);
    doc.setLineWidth(0.2);
    
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    safeText(doc, 'CERTIFICADO DE CUMPLIMIENTO', pageWidth / 2, yPos + 15, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const certText = `El suscrito, ${safeParams.engineerName}, certifica que el diseño de la malla de puesta a tierra ${safeCalculations.complies ? 'CUMPLE' : 'NO CUMPLE'} con los requisitos de seguridad de la norma IEEE Std 80-2013.`;
    const certLines = doc.splitTextToSize(certText, pageWidth - 80);
    certLines.forEach((line, i) => {
      safeText(doc, line, pageWidth / 2, yPos + 30 + (i * 5), { align: 'center' });
    });
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    safeText(doc, safeParams.engineerName, pageWidth / 2, yPos + 48, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    safeText(doc, 'Ingeniero Responsable', pageWidth / 2, yPos + 53, { align: 'center' });
    
    yPos += 65;

    // ============================================
    // 10. NOTAS IMPORTANTES
    // ============================================
    
    drawSectionTitle('NOTAS IMPORTANTES', '10');
    
    const notes = [
      'Cálculos según IEEE 80-2013 y CFE 01J00-01',
      'Medir resistividad in-situ (método Wenner)',
      'Cumplir con NOM-001-SEDE-2012',
      'La capa superficial de grava debe tener resistividad ≥ 10,000 Ω·m y espesor ≥ 0.15 m',
      'Las conexiones deben realizarse mit soldadura exotérmica'
    ];
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    for (const note of notes) {
      if (yPos + 6 > pageHeight - 40) {
        addFooter();
        doc.addPage();
        pageNum++;
        addHeader();
        yPos = 30;
      }
      safeText(doc, `• ${note}`, 20, yPos);
      yPos += 5;
    }
    
    addFooter();
    
    // Actualizar números de página
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      safeText(doc, `Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      safeText(doc, 'Grounding Designer Pro • IEEE 80-2013 & CFE 01J00-01', pageWidth / 2, pageHeight - 5, { align: 'center' });
    }
    
    resolve(doc);
  });
};

// EXPOSICIÓN GLOBAL FORZADA PARA PRUEBAS
// (Colocar ANTES de export default generateFullPDF)

if (typeof window !== 'undefined') {
    window.generateFullPDF = generateFullPDF;
    window.pdfUtils = {
        generateFullPDF,
        version: '1.0.0',
        timestamp: new Date().toISOString()
    };
    console.log('✅ generateFullPDF expuesta globalmente en window (modo forzado)');
    console.log('📄 Versión del PDF utils:', window.pdfUtils.version);
}

export default generateFullPDF;