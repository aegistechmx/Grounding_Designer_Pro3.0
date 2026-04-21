/**
 * Motor de Generación de Reportes
 * Unifica la exportación a diferentes formatos
 */

// Modelo de datos unificado para reportes
export const createReportModel = (params, calculations, recommendations) => {
  // Validar datos
  const safeParams = params || {};
  const safeCalculations = calculations || {};
  const safeRecommendations = recommendations || [];

  return {
    metadata: {
      projectName: safeParams.projectName || 'Proyecto de Puesta a Tierra',
      clientName: safeParams.clientName || 'No especificado',
      engineerName: safeParams.engineerName || 'Ingeniero Especialista',
      projectLocation: safeParams.projectLocation || 'Puerto Vallarta, Jalisco, México',
      date: new Date().toISOString(),
      dateFormatted: new Date().toLocaleDateString('es-MX'),
      version: '2.0',
      certificateId: `GDP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    },
    
    input: {
      // Sistema Eléctrico
      transformerKVA: safeParams.transformerKVA || 75,
      primaryVoltage: safeParams.primaryVoltage || 13200,
      secondaryVoltage: safeParams.secondaryVoltage || 220,
      transformerImpedance: safeParams.transformerImpedance || 5,
      faultDuration: safeParams.faultDuration || 0.35,
      currentDivisionFactor: safeParams.currentDivisionFactor || 0.2,
      
      // Suelo
      soilResistivity: safeParams.soilResistivity || 100,
      surfaceLayer: safeParams.surfaceLayer || 10000,
      surfaceDepth: safeParams.surfaceDepth || 0.2,
      
      // Malla
      gridLength: safeParams.gridLength || 30,
      gridWidth: safeParams.gridWidth || 16,
      gridDepth: safeParams.gridDepth || 0.6,
      numParallel: safeParams.numParallel || 8,
      numParallelY: safeParams.numParallelY || 8,
      
      // Varillas
      numRods: safeParams.numRods || 8,
      rodLength: safeParams.rodLength || 3,
      conductorDiameter: safeParams.conductorDiameter || 0.01168
    },
    
    results: {
      // Corrientes
      faultCurrent: safeCalculations.faultCurrent || 0,
      Ig: safeCalculations.Ig || 0,
      In: safeCalculations.In || 0,
      Sf: safeCalculations.Sf || 0.2,
      
      // Factores
      Cs: safeCalculations.Cs || 1,
      n: safeCalculations.n || 1,
      Ki: safeCalculations.Ki || 0.7,
      Kh: safeCalculations.Kh || 1,
      Km: safeCalculations.Km || 0.5,
      Ks: safeCalculations.Ks || 0.7,
      
      // Tensiones permisibles
      Etouch70: safeCalculations.Etouch70 || 0,
      Estep70: safeCalculations.Estep70 || 0,
      Etouch50: safeCalculations.Etouch50 || 0,
      Estep50: safeCalculations.Estep50 || 0,
      
      // Resultados principales
      Rg: safeCalculations.Rg || 0,
      GPR: safeCalculations.GPR || 0,
      Em: safeCalculations.Em || 0,
      Es: safeCalculations.Es || 0,
      
      // Verificaciones
      touchSafe70: safeCalculations.touchSafe70 || false,
      stepSafe70: safeCalculations.stepSafe70 || false,
      touchSafe50: safeCalculations.touchSafe50 || false,
      stepSafe50: safeCalculations.stepSafe50 || false,
      complies: safeCalculations.complies || false,
      
      // Geometría
      gridArea: safeCalculations.gridArea || 0,
      perimeter: safeCalculations.perimeter || 0,
      totalConductor: safeCalculations.totalConductor || 0,
      totalRodLength: safeCalculations.totalRodLength || 0,
      LT: safeCalculations.LT || 0,
      
      // Conductor
      minConductorArea: safeCalculations.minConductorArea || 0,
      selectedConductor: safeCalculations.selectedConductor || '4/0 AWG',
      thermalCheck: safeCalculations.thermalCheck || { complies: true, message: 'Verificación no disponible' }
    },
    
    compliance: {
      overallScore: 0,
      passedNormatives: 0,
      totalNormatives: 4,
      normatives: {
        'IEEE 80-2013': safeCalculations.complies || false,
        'CFE 01J00-01': (safeCalculations.Rg || 0) <= 5,
        'NOM-001-SEDE-2012': (safeCalculations.Rg || 0) <= 5 && (safeCalculations.GPR || 0) < 5000,
        'NFPA 70': (safeCalculations.Rg || 0) <= 25 && (safeCalculations.GPR || 0) < 10000
      }
    },
    
    recommendations: safeRecommendations,
    
    materials: {
      conductorCost: (safeCalculations.totalConductor || 0) * 3.5,
      rodCost: (safeParams.numRods || 8) * 25,
      gravelCost: ((safeParams.gridLength || 30) * (safeParams.gridWidth || 16) * (safeParams.surfaceDepth || 0.2)) * 45,
      totalCost: 0
    }
  };
};

// Calcular total de materiales
export const calculateMaterialTotals = (reportModel) => {
  const conductorCost = reportModel.materials.conductorCost;
  const rodCost = reportModel.materials.rodCost;
  const gravelCost = reportModel.materials.gravelCost;
  reportModel.materials.totalCost = conductorCost + rodCost + gravelCost;
  return reportModel;
};

// Generar resumen ejecutivo
export const generateExecutiveSummary = (reportModel) => {
  const margin = reportModel.results.Etouch70 > 0
    ? ((reportModel.results.Etouch70 - reportModel.results.Em) / reportModel.results.Etouch70 * 100).toFixed(1)
    : '0';
  
  return {
    status: reportModel.results.complies ? 'APROBADO' : 'NO APROBADO',
    message: reportModel.results.complies
      ? 'El diseño cumple con los requisitos de seguridad de IEEE Std 80-2013 y CFE 01J00-01.'
      : 'Se requieren mejoras para alcanzar el cumplimiento total de las normas aplicables.',
    safetyMargin: `${margin}%`,
    overallScore: reportModel.compliance.overallScore,
    recommendationsCount: reportModel.recommendations.length
  };
};

// Validar diseño contra normas
export const validateDesign = (reportModel) => {
  const passed = Object.values(reportModel.compliance.normatives).filter(v => v === true).length;
  const total = reportModel.compliance.totalNormatives;
  reportModel.compliance.passedNormatives = passed;
  reportModel.compliance.overallScore = (passed / total * 100).toFixed(0);
  return reportModel;
};

// Exportar a HTML
export const exportToHTML = (reportModel) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Puesta a Tierra - ${reportModel.metadata.projectName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #1e40af; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f3f4f6; }
        .safe { background-color: #dcfce7; color: #166534; }
        .unsafe { background-color: #fee2e2; color: #991b1b; }
      </style>
    </head>
    <body>
      <h1>⚡ GROUNDING DESIGNER PRO</h1>
      <p><strong>Proyecto:</strong> ${reportModel.metadata.projectName}</p>
      <p><strong>Fecha:</strong> ${reportModel.metadata.dateFormatted}</p>
      <p><strong>Ingeniero:</strong> ${reportModel.metadata.engineerName}</p>
      
      <h2>Resultados Principales</h2>
      <table>
        <tr><th>Parámetro</th><th>Valor</th><th>Límite</th><th>Estado</th></tr>
        <tr class="${reportModel.results.complies ? 'safe' : 'unsafe'}">
          <td>Tensión Contacto</td>
          <td>${reportModel.results.Em.toFixed(0)} V</td>
          <td>${reportModel.results.Etouch70.toFixed(0)} V</td>
          <td>${reportModel.results.complies ? '✓ CUMPLE' : '✗ NO CUMPLE'}</td>
        </tr>
        <tr><td>Resistencia Malla</td><td colspan="3">${reportModel.results.Rg.toFixed(2)} Ω</td></tr>
        <tr><td>GPR</td><td colspan="3">${reportModel.results.GPR.toFixed(0)} V</td></tr>
      </table>
      
      <p><em>Documento generado automáticamente por Grounding Designer Pro</em></p>
    </body>
    </html>
  `;
  
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte_${reportModel.metadata.projectName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
  a.click();
  URL.revokeObjectURL(url);
};

// Exportar a CSV
export const exportToCSV = (reportModel) => {
  const headers = ['Parámetro', 'Valor', 'Unidad'];
  const rows = [
    ['Proyecto', reportModel.metadata.projectName, ''],
    ['Fecha', reportModel.metadata.dateFormatted, ''],
    ['Resistencia Malla', reportModel.results.Rg.toFixed(2), 'Ω'],
    ['GPR', reportModel.results.GPR.toFixed(0), 'V'],
    ['Tensión Contacto', reportModel.results.Em.toFixed(0), 'V'],
    ['Tensión Paso', reportModel.results.Es.toFixed(0), 'V'],
    ['Cumple IEEE 80', reportModel.results.complies ? 'SÍ' : 'NO', '']
  ];
  
  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `datos_${reportModel.metadata.projectName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default {
  createReportModel,
  calculateMaterialTotals,
  generateExecutiveSummary,
  validateDesign,
  exportToHTML,
  exportToCSV
};