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
  if (value === null || value === undefined) return 'N/A';
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

export const loadLogoAsBase64 = async () => {
  try {
    const logoUrl = '/LOGO.png';
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error al cargar el logo:', error);
    return null;
  }
};

export const exportPDFWithLogo = async (params, calculations, recommendations, logoBase64 = null) => {
  const logo = logoBase64 || await loadLogoAsBase64();
  
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
      transformerKVA: safeNumber(params?.transformerKVA, 75),
      primaryVoltage: safeNumber(params?.primaryVoltage, 13200),
      secondaryVoltage: safeNumber(params?.secondaryVoltage, 220),
      transformerImpedance: Math.max(0.1, safeNumber(params?.transformerImpedance, 5)),
      currentDivisionFactor: safeNumber(params?.currentDivisionFactor, 0.2),
      soilResistivity: safeNumber(params?.soilResistivity, 100),
      surfaceLayer: safeNumber(params?.surfaceLayer, 10000),
      surfaceDepth: safeNumber(params?.surfaceDepth, 0.2),
      faultDuration: safeNumber(params?.faultDuration, 0.35),
      gridLength: safeNumber(params?.gridLength, 30),
      gridWidth: safeNumber(params?.gridWidth, 16),
      gridDepth: safeNumber(params?.gridDepth, 0.6),
      numParallel: safeNumber(params?.numParallel, 8),
      numParallelY: safeNumber(params?.numParallelY, 8),
      numRods: safeNumber(params?.numRods, 10),
      rodLength: safeNumber(params?.rodLength, 3),
      conductorDiameter: safeNumber(params?.conductorDiameter, 0.01168)
    };

    const safeCalculations = {
      Rg: safeNumber(calculations?.Rg, 0),
      GPR: safeNumber(calculations?.GPR, 0),
      Em: safeNumber(calculations?.Em, 0),
      Es: safeNumber(calculations?.Es, 0),
      Etouch70: safeNumber(calculations?.Etouch70, 1),
      Estep70: safeNumber(calculations?.Estep70, 1),
      Etouch50: safeNumber(calculations?.Etouch50, 1),
      Estep50: safeNumber(calculations?.Estep50, 1),
      complies: calculations?.complies === true,
      touchSafe70: calculations?.touchSafe70 === true,
      stepSafe70: calculations?.stepSafe70 === true,
      touchSafe50: calculations?.touchSafe50 === true,
      stepSafe50: calculations?.stepSafe50 === true,
      Ig: safeNumber(calculations?.Ig, 0),
      faultCurrent: safeNumber(calculations?.faultCurrent, 0),
      gridArea: safeNumber(calculations?.gridArea, 0),
      totalConductor: safeNumber(calculations?.totalConductor, 0),
      totalRodLength: safeNumber(calculations?.totalRodLength, 0),
      Cs: safeNumber(calculations?.Cs, 1),
      n: safeNumber(calculations?.n, 1),
      Ki: safeNumber(calculations?.Ki, 0.7),
      Kh: safeNumber(calculations?.Kh, 1),
      Km: safeNumber(calculations?.Km, 0.5),
      Ks: safeNumber(calculations?.Ks, 0.7)
    };

    const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];

    // ============================================
    // CÁLCULOS ADICIONALES
    // ============================================
    
    const secondaryVoltage = Math.max(1, safeParams.secondaryVoltage);
    const transformerImpedance = Math.max(0.1, safeParams.transformerImpedance);
    const In = (safeParams.transformerKVA * 1000) / (Math.sqrt(3) * secondaryVoltage);
    const faultCurrent = In / (transformerImpedance / 100);
    const Ig = faultCurrent * safeParams.currentDivisionFactor;
    
    const A = safeParams.gridLength * safeParams.gridWidth;
    const perimeter = 2 * (safeParams.gridLength + safeParams.gridWidth);
    const totalGridLength = perimeter * safeParams.numParallel;
    const totalRodLength = safeParams.numRods * safeParams.rodLength;
    const LT = totalGridLength + totalRodLength;
    
    const conductorCost = totalGridLength * 3.5;
    const rodCost = safeParams.numRods * 25;
    const gravelVolume = A * safeParams.surfaceDepth;
    const gravelCost = gravelVolume * 45;
    const totalCost = conductorCost + rodCost + gravelCost;

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
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      doc.setFont(undefined, 'bold');
      safeText(doc, title, 15, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 10;
    };

    const drawSubsectionTitle = (title) => {
      checkPageBreak(25);
      doc.setFontSize(12);
      doc.setTextColor(59, 130, 246);
      doc.setFont(undefined, 'bold');
      safeText(doc, title, 15, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 8;
    };

    // ============================================
    // ENCABEZADO
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
    safeText(doc, 'GROUNDING DESIGNER PRO', pageWidth / 2, yPos, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    safeText(doc, 'Informe Técnico de Malla de Puesta a Tierra', pageWidth / 2, yPos + 8, { align: 'center' });
    
    doc.setDrawColor(37, 99, 235);
    doc.line(15, yPos + 15, pageWidth - 15, yPos + 15);
    yPos += 30;

    // ============================================
    // 1. DATOS DEL PROYECTO
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
    // 2. PARÁMETROS DE ENTRADA
    // ============================================
    
    drawSectionTitle('2. PARÁMETROS DE ENTRADA');

    const paramsData = [
      ['Transformador', `${safeParams.transformerKVA} kVA`, 'Impedancia', `${safeParams.transformerImpedance}%`],
      ['Voltaje Primario', `${safeParams.primaryVoltage} V`, 'Voltaje Secundario', `${safeParams.secondaryVoltage} V`],
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
    // 3. GEOMETRÍA DE LA MALLA
    // ============================================
    
    drawSectionTitle('3. GEOMETRÍA DE LA MALLA');

    const geometryData = [
      ['Área de la malla', `${safeToFixed(A, 0)} m²`, 'Perímetro', `${safeToFixed(perimeter, 0)} m`],
      ['Conductores X', `${safeParams.numParallel}`, 'Conductores Y', `${safeParams.numParallelY}`],
      ['Conductor total', `${safeToFixed(totalGridLength, 0)} m`, 'Varillas total', `${safeToFixed(totalRodLength, 0)} m`],
      ['Longitud total (LT)', `${safeToFixed(LT, 0)} m`, 'Profundidad', `${safeParams.gridDepth} m`]
    ];

    autoTable(doc, {
      startY: yPos,
      body: geometryData,
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
    // 4. FACTORES GEOMÉTRICOS
    // ============================================
    
    drawSectionTitle('4. FACTORES GEOMÉTRICOS');

    const factorsData = [
      ['Factor de capa superficial (Cs)', safeToFixed(safeCalculations.Cs, 4)],
      ['Factor de irregularidad (Ki)', safeToFixed(safeCalculations.Ki, 3)],
      ['Factor de profundidad (Kh)', safeToFixed(safeCalculations.Kh, 3)],
      ['Factor de malla (Km)', safeToFixed(safeCalculations.Km, 4)],
      ['Factor de paso (Ks)', safeToFixed(safeCalculations.Ks, 4)],
      ['Número efectivo (n)', safeToFixed(safeCalculations.n, 2)]
    ];

    autoTable(doc, {
      startY: yPos,
      body: factorsData,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: 15 },
      tableWidth: 170,
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { textColor: [100, 100, 100] }
      }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // ============================================
    // 5. RESULTADOS DE CÁLCULOS
    // ============================================
    
    drawSectionTitle('5. RESULTADOS DE CÁLCULOS');

    const resultsData = [
      ['Resistencia de Malla (Rg)', `${safeToFixed(safeCalculations.Rg, 3)} Ω`, safeCalculations.Rg <= 5 ? '✓ CUMPLE' : '✗ NO CUMPLE'],
      ['GPR (Elevación de Potencial)', `${safeToFixed(safeCalculations.GPR, 0)} V`, 'N/A'],
      ['Corriente de Falla (If)', `${safeToFixed(faultCurrent, 0)} A`, 'N/A'],
      ['Corriente en Malla (Ig)', `${safeToFixed(safeCalculations.Ig, 0)} A`, 'N/A']
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Métrica', 'Valor', 'Estado']],
      body: resultsData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 4 },
      margin: { left: 15 },
      tableWidth: 170
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // ============================================
    // 6. TENSIONES PERMISIBLES Y CALCULADAS
    // ============================================
    
    drawSectionTitle('6. TENSIONES DE SEGURIDAD');

    // Tensiones para 70kg
    drawSubsectionTitle('Persona 70 kg');

    const voltages70Data = [
      ['Tensión de Contacto (Em)', `${safeToFixed(safeCalculations.Em, 0)} V`, `${safeToFixed(safeCalculations.Etouch70, 0)} V`, safeCalculations.touchSafe70 ? '✓ CUMPLE' : '✗ NO CUMPLE'],
      ['Tensión de Paso (Es)', `${safeToFixed(safeCalculations.Es, 0)} V`, `${safeToFixed(safeCalculations.Estep70, 0)} V`, safeCalculations.stepSafe70 ? '✓ CUMPLE' : '✗ NO CUMPLE']
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Tensión', 'Calculada', 'Límite', 'Estado']],
      body: voltages70Data,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 4 },
      margin: { left: 15 },
      tableWidth: 170
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Tensiones para 50kg
    drawSubsectionTitle('Persona 50 kg');

    const voltages50Data = [
      ['Tensión de Contacto (Em)', `${safeToFixed(safeCalculations.Em, 0)} V`, `${safeToFixed(safeCalculations.Etouch50, 0)} V`, safeCalculations.touchSafe50 ? '✓ CUMPLE' : '✗ NO CUMPLE'],
      ['Tensión de Paso (Es)', `${safeToFixed(safeCalculations.Es, 0)} V`, `${safeToFixed(safeCalculations.Estep50, 0)} V`, safeCalculations.stepSafe50 ? '✓ CUMPLE' : '✗ NO CUMPLE']
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Tensión', 'Calculada', 'Límite', 'Estado']],
      body: voltages50Data,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 4 },
      margin: { left: 15 },
      tableWidth: 170
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // ============================================
    // 7. VERIFICACIÓN DE SEGURIDAD
    // ============================================
    
    drawSectionTitle('7. VERIFICACIÓN DE SEGURIDAD');

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
    // 8. MATERIALES Y COSTOS
    // ============================================
    
    drawSectionTitle('8. MATERIALES Y COSTOS');

    const costData = [
      ['Conductor de cobre', `${safeToFixed(totalGridLength, 0)} m`, `$${safeToFixed(conductorCost, 2)}`],
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
      margin: { left: 15 },
      tableWidth: 170,
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'right' }
      }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // ============================================
    // 9. RECOMENDACIONES
    // ============================================
    
    if (safeRecommendations.length > 0) {
      drawSectionTitle('9. RECOMENDACIONES');
      
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
    // 10. CERTIFICADO DE CUMPLIMIENTO
    // ============================================
    
    drawSectionTitle('10. CERTIFICADO DE CUMPLIMIENTO');

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(2);
    doc.rect(15, yPos, 180, 55);
    doc.setLineWidth(0.2);

    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    safeText(doc, 'CERTIFICADO DE CUMPLIMIENTO', pageWidth / 2, yPos + 15, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const certText = `El suscrito, ${safeParams.engineerName}, certifica que el diseño de la malla de puesta a tierra ${safeCalculations.complies ? 'CUMPLE' : 'NO CUMPLE'} con los requisitos de seguridad de la norma IEEE Std 80-2013.`;
    const certLines = doc.splitTextToSize(certText, 160);
    certLines.forEach((line, i) => {
      safeText(doc, line, pageWidth / 2, yPos + 30 + (i * 5), { align: 'center' });
    });

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    safeText(doc, safeParams.engineerName, pageWidth / 2, yPos + 45, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    safeText(doc, 'Ingeniero Responsable', pageWidth / 2, yPos + 50, { align: 'center' });

    yPos += 65;

    // ============================================
    // 11. NOTAS IMPORTANTES
    // ============================================
    
    drawSectionTitle('11. NOTAS IMPORTANTES');

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const notes = [
      '• Cálculos según IEEE 80-2013 y CFE 01J00-01',
      '• Medir resistividad in-situ (método Wenner)',
      '• Cumplir con NOM-001-SEDE-2012',
      '• La capa superficial de grava debe tener resistividad ≥ 10,000 Ω·m y espesor ≥ 0.15 m',
      '• Las conexiones deben realizarse con soldadura exotérmica'
    ];
    
    notes.forEach((note) => {
      if (yPos + 5 > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      safeText(doc, note, 20, yPos);
      yPos += 5;
    });

    yPos += 10;

    // ============================================
    // PIE DE PÁGINA
    // ============================================
    
    const totalPages = doc.internal.pages.length - 1;
    
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      safeText(doc, `Página ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      
      doc.setDrawColor(200, 200, 200);
      doc.line(15, doc.internal.pageSize.getHeight() - 15, pageWidth - 15, doc.internal.pageSize.getHeight() - 15);
      
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      safeText(doc, 'Grounding Designer Pro • IEEE 80-2013 & CFE 01J00-01', pageWidth / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
    }

    resolve(doc);
  });
};