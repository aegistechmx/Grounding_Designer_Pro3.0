/**
 * Modelo de Reporte Profesional
 * Estructura estándar para informes técnicos de puesta a tierra
 */

export function buildFullReport({ params, calculations, recommendations = [] }) {
  // Validación de entrada
  if (!params || typeof params !== 'object') {
    console.warn('Invalid params provided to buildFullReport');
    params = {};
  }
  
  if (!calculations || typeof calculations !== 'object') {
    console.warn('Invalid calculations provided to buildFullReport');
    calculations = {};
  }

  // Cálculo de margen de seguridad
  const safetyMargin = calculations.Etouch70 && calculations.Em
    ? ((calculations.Etouch70 - calculations.Em) / calculations.Etouch70 * 100)
    : 0;

  return {
    metadata: {
      project: params.projectName || "Sistema de Puesta a Tierra",
      location: params.projectLocation || "No especificado",
      engineer: params.engineerName || "Ing. Especialista",
      client: params.clientName || "No especificado",
      date: new Date(),
      reportId: generateReportId(),
      version: "1.0"
    },
    input: {
      transformer: {
        kva: params.transformerKVA || 0,
        primaryVoltage: params.primaryVoltage || 0,
        secondaryVoltage: params.secondaryVoltage || 0,
        impedance: params.transformerImpedance || 5
      },
      soil: {
        resistivity: params.soilResistivity || 100,
        surfaceLayer: params.surfaceLayer || 10000,
        surfaceDepth: params.surfaceDepth || 0.2
      },
      grid: {
        length: params.gridLength || 0,
        width: params.gridWidth || 0,
        depth: params.gridDepth || 0.6,
        numParallel: params.numParallel || 8,
        numParallelY: params.numParallelY || 8,
        numRods: params.numRods || 0,
        rodLength: params.rodLength || 3
      },
      fault: {
        duration: params.faultDuration || 0.5,
        currentDivisionFactor: params.currentDivisionFactor || 0.6
      }
    },
    results: {
      resistance: calculations.Rg || 0,
      gpr: calculations.GPR || 0,
      touchVoltage: calculations.Em || 0,
      stepVoltage: calculations.Es || 0,
      touchLimit70: calculations.Etouch70 || 0,
      stepLimit70: calculations.Estep70 || 0,
      touchLimit50: calculations.Etouch50 || 0,
      stepLimit50: calculations.Estep50 || 0,
      faultCurrent: calculations.faultCurrent || 0,
      gridCurrent: calculations.Ig || 0,
      gridArea: calculations.gridArea || 0,
      totalConductor: calculations.totalConductor || 0,
      totalRodLength: calculations.totalRodLength || 0,
      complies: calculations.complies === true,
      touchSafe70: calculations.touchSafe70 === true,
      stepSafe70: calculations.stepSafe70 === true,
      touchSafe50: calculations.touchSafe50 === true,
      stepSafe50: calculations.stepSafe50 === true
    },
    safety: {
      complies: calculations.complies === true,
      margin: safetyMargin,
      marginTouch: calculations.Etouch70 && calculations.Em
        ? ((calculations.Etouch70 - calculations.Em) / calculations.Etouch70 * 100)
        : 0,
      marginStep: calculations.Estep70 && calculations.Es
        ? ((calculations.Estep70 - calculations.Es) / calculations.Estep70 * 100)
        : 0
    },
    recommendations: Array.isArray(recommendations) ? recommendations : [],
    normative: {
      ieee80: {
        complies: calculations.complies === true,
        touchVoltage: calculations.Em <= calculations.Etouch70,
        stepVoltage: calculations.Es <= calculations.Estep70
      },
      cfe: {
        complies: (calculations.Rg || 0) <= 5,
        resistance: calculations.Rg || 0
      }
    }
  };
}

function generateReportId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RPT-${timestamp}-${random}`;
}

export default { buildFullReport };
