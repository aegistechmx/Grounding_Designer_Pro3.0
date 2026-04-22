/**
 * Reporte Profesional - IEEE 80
 * Genera reporte estructurado exportable en formato JSON
 */

/**
 * Genera reporte completo en formato IEEE 80
 * 
 * @param {object} results - Resultados del cálculo
 * @param {object} recommendations - Recomendaciones del sistema
 * @param {object} params - Parámetros de entrada
 * @returns {object} Reporte estructurado
 */
export const generateReport = (results, recommendations, params) => {
  const now = new Date();
  
  return {
    project: {
      date: now.toISOString(),
      dateFormatted: now.toLocaleDateString('es-MX'),
      standard: 'IEEE Std 80-2013',
      version: '1.0',
      software: 'Grounding Designer Pro'
    },
    inputParameters: {
      grid: {
        length: params?.gridLength,
        width: params?.gridWidth,
        depth: params?.gridDepth,
        numParallelX: params?.numParallel,
        numParallelY: params?.numParallelY,
        spacingX: params?.gridLength / params?.numParallel,
        spacingY: params?.gridWidth / params?.numParallelY
      },
      soil: {
        resistivity: params?.soilResistivity,
        surfaceLayerResistivity: params?.surfaceLayerResistivity,
        surfaceLayerThickness: params?.surfaceLayerThickness,
        multilayer: params?.soilModel?.multilayer || false,
        effectiveResistivity: results?.effectiveResistivity || params?.soilResistivity
      },
      fault: {
        current: params?.faultCurrent,
        duration: params?.faultDuration,
        currentDivisionFactor: params?.currentDivisionFactor,
        XR: params?.XR || 10,
        effectiveCurrent: results?.effectiveFaultCurrent || params?.faultCurrent
      },
      conductor: {
        material: params?.conductorMaterial || 'Copper',
        size: params?.conductorSize || '4/0',
        crossSection: results?.conductorCrossSection
      },
      rods: {
        count: params?.numRods,
        length: params?.rodLength,
        diameter: params?.rodDiameter
      }
    },
    results: {
      groundingResistance: {
        value: results?.Rg,
        unit: 'Ω',
        target: 5,
        compliant: results?.Rg <= 5
      },
      gpr: {
        value: results?.GPR,
        unit: 'V',
        target: 5000,
        compliant: results?.GPR <= 5000
      },
      touchVoltage: {
        calculated: results?.Em,
        permissible: results?.Etouch70,
        unit: 'V',
        safe: results?.touchSafe70,
        margin: results?.Etouch70 - results?.Em
      },
      stepVoltage: {
        calculated: results?.Es,
        permissible: results?.Estep70,
        unit: 'V',
        safe: results?.stepSafe70,
        margin: results?.Estep70 - results?.Es
      },
      meshVoltage: {
        value: results?.Em,
        unit: 'V'
      },
      surfaceLayerFactor: {
        value: results?.Cs,
        unit: 'dimensionless'
      }
    },
    safety: {
      overall: {
        safe: results?.touchSafe70 && results?.stepSafe70,
        touchSafe: results?.touchSafe70,
        stepSafe: results?.stepSafe70
      },
      touchVoltageLimit: {
        bodyWeight70kg: results?.Etouch70,
        bodyWeight50kg: results?.Etouch50
      },
      stepVoltageLimit: {
        bodyWeight70kg: results?.Estep70,
        bodyWeight50kg: results?.Estep50
      }
    },
    conductor: {
      selected: results?.selectedConductor,
      thermal: {
        current: results?.conductorThermalCurrent,
        required: results?.requiredConductorCurrent,
        safe: results?.conductorSafe
      },
      crossSection: results?.conductorCrossSection
    },
    recommendations: recommendations || [],
    compliance: {
      ieee80: {
        overall: results?.touchSafe70 && results?.stepSafe70 && results?.Rg <= 5,
        resistance: results?.Rg <= 5,
        touchVoltage: results?.touchSafe70,
        stepVoltage: results?.stepSafe70
      },
      summary: generateComplianceSummary(results)
    },
    metadata: {
      calculationTime: results?.calculationTime,
      iterations: results?.iterations,
      warnings: results?.warnings || []
    }
  };
};

/**
 * Genera resumen de cumplimiento normativo
 * 
 * @param {object} results - Resultados del cálculo
 * @returns {object} Resumen de cumplimiento
 */
const generateComplianceSummary = (results) => {
  const checks = {
    resistance: results?.Rg <= 5,
    touchVoltage: results?.touchSafe70,
    stepVoltage: results?.stepSafe70,
    gpr: results?.GPR <= 5000,
    conductor: results?.conductorSafe
  };
  
  const passed = Object.values(checks).filter(v => v).length;
  const total = Object.keys(checks).length;
  
  return {
    passed,
    total,
    percentage: (passed / total * 100).toFixed(1),
    checks,
    status: passed === total ? 'COMPLIANT' : passed >= total * 0.7 ? 'PARTIAL' : 'NON_COMPLIANT'
  };
};

/**
 * Exporta reporte a JSON string
 * 
 * @param {object} report - Objeto de reporte
 * @returns {string} JSON string
 */
export const exportReportJSON = (report) => {
  return JSON.stringify(report, null, 2);
};

/**
 * Exporta reporte a archivo JSON
 * 
 * @param {object} report - Objeto de reporte
 * @param {string} filename - Nombre del archivo
 */
export const downloadReportJSON = (report, filename = null) => {
  const json = exportReportJSON(report);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `grounding-report-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Genera resumen ejecutivo del reporte
 * 
 * @param {object} report - Objeto de reporte
 * @returns {string} Resumen en texto plano
 */
export const generateExecutiveSummary = (report) => {
  const { project, results, safety, compliance } = report;
  
  return `
RESUMEN EJECUTIVO - DISEÑO DE PUESTA A TIERRA
============================================

Fecha: ${project.dateFormatted}
Norma: ${project.standard}

RESULTADOS PRINCIPALES
---------------------
Resistencia de Malla: ${results.groundingResistance.value.toFixed(2)} Ω
GPR: ${results.gpr.value.toFixed(0)} V
Tensión de Contacto: ${results.touchVoltage.calculated.toFixed(0)} V (límite: ${results.touchVoltage.permissible.toFixed(0)} V)
Tensión de Paso: ${results.stepVoltage.calculated.toFixed(0)} V (límite: ${results.stepVoltage.permissible.toFixed(0)} V)

SEGURIDAD
---------
Contacto: ${safety.overall.touchSafe ? '✅ SEGURO' : '❌ INSEGURO'}
Paso: ${safety.overall.stepSafe ? '✅ SEGURO' : '❌ INSEGURO'}
Overall: ${safety.overall.safe ? '✅ CUMPLE' : '❌ NO CUMPLE'}

CUMPLIMIENTO NORMATIVO
---------------------
IEEE 80: ${compliance.ieee80.overall ? '✅ CUMPLE' : '❌ NO CUMPLE'}
Resistencia: ${compliance.ieee80.resistance ? '✅' : '❌'}
Tensión Contacto: ${compliance.ieee80.touchVoltage ? '✅' : '❌'}
Tensión Paso: ${compliance.ieee80.stepVoltage ? '✅' : '❌'}

Estado: ${compliance.summary.status}
Porcentaje: ${compliance.summary.percentage}%
  `.trim();
};

/**
 * Genera reporte en formato texto plano
 * 
 * @param {object} report - Objeto de reporte
 * @returns {string} Reporte en texto plano
 */
export const generateTextReport = (report) => {
  const summary = generateExecutiveSummary(report);
  const json = exportReportJSON(report);
  
  return `
${summary}

DATOS COMPLETOS (JSON)
======================
${json}
  `.trim();
};

/**
 * Valida reporte antes de exportar
 * 
 * @param {object} report - Objeto de reporte
 * @returns {object} Validación
 */
export const validateReport = (report) => {
  const errors = [];
  const warnings = [];
  
  if (!report) {
    return { valid: false, errors: ['Reporte no proporcionado'], warnings };
  }
  
  if (!report.project) {
    errors.push('Falta información del proyecto');
  }
  
  if (!report.results) {
    errors.push('Faltan resultados del cálculo');
  }
  
  if (!report.inputParameters) {
    warnings.push('Faltan parámetros de entrada');
  }
  
  if (report.results?.groundingResistance?.value === undefined) {
    errors.push('Falta valor de resistencia de malla');
  }
  
  if (report.results?.gpr?.value === undefined) {
    errors.push('Falta valor de GPR');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Genera reporte simplificado para vista rápida
 * 
 * @param {object} results - Resultados del cálculo
 * @returns {object} Reporte simplificado
 */
export const generateQuickReport = (results) => {
  return {
    resistance: results?.Rg,
    gpr: results?.GPR,
    touchVoltage: results?.Em,
    stepVoltage: results?.Es,
    touchSafe: results?.touchSafe70,
    stepSafe: results?.stepSafe70,
    overallSafe: results?.touchSafe70 && results?.stepSafe70
  };
};
