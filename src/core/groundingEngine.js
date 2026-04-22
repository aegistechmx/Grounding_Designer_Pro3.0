/**
 * Motor de Cálculos de Puesta a Tierra - PRO
 * Basado en IEEE Std 80-2013 (versión mejorada)
 * Integración: Suelo multicapa, Corriente transitoria, Optimizador, Reportes
 */

import { getEffectiveResistivity, apparentResistivity2Layer } from './soilModel';
import { effectiveFaultCurrent, analyzeTransient } from './transient';
import { optimizeGrid, optimizeGridGuided, compareDesigns } from './optimizer';
import { generateReport, generateQuickReport, exportReportJSON, downloadReportJSON, generateExecutiveSummary, generateTextReport } from './report';

// =========================
// CONSTANTES
// =========================
const THERMAL_CONSTANTS = {
  COPPER_SOFT: { k: 7.0, maxTemp: 250 },
  COPPER_HARD: { k: 7.0, maxTemp: 250 },
  ALUMINUM: { k: 4.5, maxTemp: 200 }
};

// =========================
// UTILIDADES
// =========================
const safe = (v, d = 0) => {
  const n = parseFloat(v);
  return isNaN(n) ? d : n;
};

// =========================
// FACTOR Cs
// =========================
const calculateCs = (ρ, ρs, hs) => {
  ρ = safe(ρ, 100);
  ρs = Math.min(safe(ρs, 3000), 3000);
  hs = safe(hs, 0.1);

  return 1 - (0.09 * (1 - ρ / ρs)) / (2 * hs + 0.09);
};

// =========================
// TENSIONES PERMISIBLES
// =========================
const calculatePermissible = (Cs, ρs, t) => {
  ρs = Math.min(safe(ρs, 3000), 3000);
  t = Math.max(0.1, safe(t, 0.5));

  const k70 = 0.157 / Math.sqrt(t);
  const k50 = 0.116 / Math.sqrt(t);

  return {
    Etouch70: (1000 + 1.5 * Cs * ρs) * k70,
    Estep70: (1000 + 6 * Cs * ρs) * k70,
    Etouch50: (1000 + 1.5 * Cs * ρs) * k50,
    Estep50: (1000 + 6 * Cs * ρs) * k50
  };
};

// =========================
// DECREMENT FACTOR (IEEE)
// =========================
const decrementFactor = (X_R = 10, t = 0.5) => {
  return Math.sqrt(1 + X_R ** 2) / (1 + X_R ** 2 * Math.exp(-2 * t));
};

// =========================
// CORRIENTE DE FALLA
// =========================
const calculateFault = (p) => {
  const kVA = safe(p.transformerKVA, 75);
  const V = safe(p.secondaryVoltage, 220);
  const Z = Math.max(0.1, safe(p.transformerImpedance, 5));
  const Sf = Math.min(0.8, Math.max(0.1, safe(p.currentDivisionFactor, 0.3)));

  const In = (kVA * 1000) / (Math.sqrt(3) * V);
  const If = In / (Z / 100);

  const Df = decrementFactor(p.X_R || 10, p.faultDuration || 0.5);

  const Ig = If * Sf * Df;

  return { If, Ig, In, Sf, Df };
};

// =========================
// GEOMETRÍA CORRECTA
// =========================
const calculateGeometry = (p) => {
  const L = safe(p.gridLength, 30);
  const W = safe(p.gridWidth, 16);
  const nx = safe(p.numParallel, 8);
  const ny = safe(p.numParallelY, 8);
  const h = safe(p.gridDepth, 0.6);
  const d = safe(p.conductorDiameter, 0.01);

  const A = L * W;
  const perimeter = 2 * (L + W);

  // 🔥 CORRECTO
  const totalGridLength = nx * W + ny * L;

  const rods = safe(p.numRods, 8);
  const rodLength = safe(p.rodLength, 3);
  const totalRodLength = rods * rodLength;

  const LT = totalGridLength + totalRodLength;

  const Dx = L / (nx - 1);
  const Dy = W / (ny - 1);
  const D = Math.sqrt(Dx * Dy);

  let n = (2 * totalGridLength / perimeter) * Math.sqrt(perimeter / (4 * Math.sqrt(A)));
  n = Math.max(1, n);

  const Ki = 0.644 + 0.148 * n;
  const Kh = Math.sqrt(1 + h);

  // Km robusto
  const term1 = (D * D) / (16 * h * d);
  const term2 = ((D + 2 * h) ** 2) / (8 * D * d);
  const term3 = h / (4 * d);
  const term4 = Math.log(8 / (Math.PI * (2 * n - 1)));

  const inside = Math.max(0.0001, term1 + term2 - term3);

  let Km = (1 / (2 * Math.PI)) * (Math.log(inside) + term4);
  Km = Math.max(0.05, Math.min(0.8, Km)) * Kh;

  let Ks = (1 / Math.PI) * (1 / (2 * h) + 1 / (D + h) + (1 / D));
  Ks = Math.max(0.2, Math.min(1.2, Ks));

  return { A, perimeter, totalGridLength, totalRodLength, LT, Ki, Km, Ks, D };
};

// =========================
// RESISTENCIA
// =========================
const calculateRg = (ρ, LT, A, h) => {
  ρ = safe(ρ, 100);
  LT = Math.max(1, safe(LT, 100));
  A = Math.max(1, safe(A, 100));

  return ρ * (1 / LT + 1 / Math.sqrt(20 * A));
};

// =========================
// TENSIONES
// =========================
const calculateVoltages = (ρ, Km, Ki, Ig, LT, Ks, Lg, Lr) => {
  const Em = (ρ * Km * Ki * Ig) / LT;
  const Es = (ρ * Ks * Ki * Ig) / (0.75 * Lg + 0.85 * Lr);

  return { Em, Es };
};

// =========================
// GRID VISUAL
// =========================
const generateGrid = (GPR, gridLength, gridWidth, soilResistivity, size = 100) => {
  const grid = [];
  const L = safe(gridLength, 30);
  const W = safe(gridWidth, 16);
  const ρ = safe(soilResistivity, 100);
  
  // Decay factor based on grid dimensions and soil resistivity
  const decayFactor = Math.sqrt(ρ) * 0.3;
  const centerX = size / 2;
  const centerY = size / 2;

  for (let y = 0; y < size; y++) {
    grid[y] = [];
    for (let x = 0; x < size; x++) {
      // Convert to physical coordinates (-15 to 15 range)
      const physX = (x / size) * L - L / 2;
      const physY = (y / size) * W - W / 2;
      
      // Distance from center in physical space
      const r = Math.hypot(physX, physY);
      
      // Edge effect: higher voltage at edges
      const edgeFactor = Math.exp(-r / (L * 0.4));
      const centerFactor = Math.exp(-r / decayFactor);
      
      // Combine: center dominated by GPR, edges have higher gradients
      grid[y][x] = GPR * (centerFactor * 0.7 + edgeFactor * 0.3);
    }
  }

  return grid;
};

// =========================
// FUNCIÓN PRINCIPAL (CON PIPELINE INTEGRADO)
// =========================
export const runGroundingCalculation = (p) => {
  try {
    // 1) Suelo multicapa: obtener resistividad efectiva
    const effectiveResistivity = getEffectiveResistivity(p.soilModel || { rho: p.soilResistivity });
    const soilResistivity = effectiveResistivity;

    // 2) Corriente de falla con DC offset
    const currents = calculateFault(p);
    const IgEff = effectiveFaultCurrent(
      currents.Ig,
      p.XR || 10,
      p.faultDuration || 0.5,
      p.frequency || 60
    );

    const Cs = calculateCs(soilResistivity, p.surfaceLayer, p.surfaceDepth);
    const permissible = calculatePermissible(Cs, p.surfaceLayer, p.faultDuration);

    const geo = calculateGeometry(p);
    const Rg = calculateRg(soilResistivity, geo.LT, geo.A, p.gridDepth);

    const GPR = Math.min(Rg * IgEff, 50000);

    const { Em, Es } = calculateVoltages(
      soilResistivity,
      geo.Km,
      geo.Ki,
      IgEff,
      geo.LT,
      geo.Ks,
      geo.totalGridLength,
      geo.totalRodLength
    );

    // SEGURIDAD
    const touchSafe = Em <= permissible.Etouch70;
    const stepSafe = Es <= permissible.Estep70;

    const risk =
      Em > permissible.Etouch70 ? 'HIGH' :
      Em > permissible.Etouch50 ? 'MEDIUM' :
      'LOW';

    const safetyScore =
      (touchSafe ? 50 : 0) +
      (stepSafe ? 30 : 0);

    return {
      Rg,
      GPR,
      Em,
      Es,
      risk,
      safetyScore,
      touchSafe,
      stepSafe,
      permissible,
      effectiveResistivity,
      effectiveFaultCurrent: IgEff,
      touchSafe70: touchSafe,
      stepSafe70: stepSafe,
      Etouch70: permissible.Etouch70,
      Estep70: permissible.Estep70,
      Etouch50: permissible.Etouch50,
      Estep50: permissible.Estep50,
      ...currents,
      ...geo,
      discreteGrid: generateGrid(GPR, p.gridLength, p.gridWidth, soilResistivity),
      analyticalGrid: generateGrid(GPR * 0.9, p.gridLength, p.gridWidth, soilResistivity)
    };

  } catch (e) {
    console.error(e);
    return null;
  }
};

// =========================
// RECOMENDACIONES
// =========================
export const generateRecommendations = (results) => {
  const recs = [];
  if (!results) return recs;

  if (results.Rg > 5) {
    recs.push("Alta resistencia de malla → agregar varillas o mejorar suelo");
  }
  if (!results.touchSafe) {
    recs.push("Riesgo de contacto → reducir espaciamiento o aumentar conductores");
  }
  if (!results.stepSafe) {
    recs.push("Riesgo de paso → mejorar capa superficial o añadir conductores");
  }
  if (recs.length === 0) {
    recs.push("✓ Diseño cumple IEEE 80");
  }

  return recs;
};

// =========================
// PIPELINE COMPLETO
// =========================
export const runCompletePipeline = (params, options = {}) => {
  const startTime = Date.now();

  // 1) Ejecutar cálculo principal con suelo multicapa y corriente transitoria
  const results = runGroundingCalculation(params);

  if (!results) {
    return {
      success: false,
      error: 'Error en cálculo principal'
    };
  }

  // 2) Generar recomendaciones
  const recommendations = generateRecommendations(results);

  // 3) Optimizar diseño (si se solicita)
  let optimizedDesign = null;
  if (options.optimize !== false) {
    try {
      const optimizationResult = options.guidedOptimization
        ? optimizeGridGuided(params, options.optimizationOptions)
        : optimizeGrid(params, options.optimizationOptions);

      optimizedDesign = optimizationResult;
    } catch (error) {
      console.warn('Error en optimización:', error.message);
    }
  }

  // 4) Generar reporte profesional
  const report = generateReport(results, recommendations, params);

  // 5) Análisis transitorio detallado (si se solicita)
  let transientAnalysis = null;
  if (options.transientAnalysis !== false) {
    try {
      transientAnalysis = analyzeTransient({
        Ik: params.faultCurrent,
        XR: params.XR || 10,
        t: params.faultDuration || 0.5,
        frequency: params.frequency || 60
      });
    } catch (error) {
      console.warn('Error en análisis transitorio:', error.message);
    }
  }

  const calculationTime = Date.now() - startTime;

  return {
    success: true,
    results,
    recommendations,
    optimizedDesign,
    report,
    transientAnalysis,
    quickReport: generateQuickReport(results),
    metadata: {
      calculationTime,
      timestamp: new Date().toISOString(),
      pipelineVersion: '1.0'
    }
  };
};

export default {
  runGroundingCalculation,
  generateRecommendations,
  runCompletePipeline,
  // Exportar módulos integrados
  soilModel: {
    getEffectiveResistivity,
    apparentResistivity2Layer
  },
  transient: {
    effectiveFaultCurrent,
    decrementFactor,
    analyzeTransient
  },
  optimizer: {
    optimizeGrid,
    optimizeGridGuided,
    compareDesigns
  },
  report: {
    generateReport,
    generateQuickReport,
    exportReportJSON,
    downloadReportJSON,
    generateExecutiveSummary,
    generateTextReport
  }
};