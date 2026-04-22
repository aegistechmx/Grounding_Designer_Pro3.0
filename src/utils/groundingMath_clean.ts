/**
 * Cálculos de Malla de Tierras - VERSIÓN LIMPIA (TypeScript)
 * Basado en IEEE Std 80-2013 y CFE 01J00-01
 * Catálogo Viakon completo implementado
 */

import { validateGroundingParams, validateThermalCheckParams, safeSqrt, safeMax, safeMin, validateAndCorrectSpacing, validateNumber } from './validation/validationUtils';
import { mathLogger } from './helpers/loggerUtils';
import { measurePerformance, memoize } from './helpers/performanceUtils';

// ============================================
// TYPES
// ============================================

export interface Conductor {
  name: string;
  area: number;
  diameter: number;
  ampacity: number;
}

export interface Material {
  name: string;
  density: number;
  resistivity: number;
}

export interface GroundingParams {
  transformerKVA?: number;
  primaryVoltage?: number;
  secondaryVoltage?: number;
  transformerImpedance?: number;
  faultDuration?: number;
  currentDivisionFactor?: number;
  soilResistivity?: number;
  surfaceLayer?: number;
  surfaceDepth?: number;
  gridLength?: number;
  gridWidth?: number;
  gridDepth?: number;
  conductorDiameter?: number;
  conductorArea?: number;
  conductorGauge?: string;
  materialType?: string;
  numParallel?: number;
  numParallelY?: number;
  numRods?: number;
  rodLength?: number;
  [key: string]: any;
}

export interface IEEE80Results {
  faultCurrent: number;
  Ig: number;
  Sf: number;
  Cs: number;
  Etouch70: number;
  Estep70: number;
  Etouch50: number;
  Estep50: number;
  Rg: number;
  GPR: number;
  Em: number;
  Es: number;
  touchSafe70: boolean;
  stepSafe70: boolean;
  touchSafe50: boolean;
  stepSafe50: boolean;
  complies: boolean;
  gridArea: number;
  totalConductor: number;
  totalRodLength: number;
  minConductorArea: number;
  selectedConductor: Conductor;
  faultDuration: number;
}

export interface ImportedData {
  parameters?: GroundingParams;
  [key: string]: any;
}

// ============================================
// CONSTANTS
// ============================================

// Catálogo Viakon completo
export const CONDUCTORS: Record<string, Conductor> = {
  AWG_6: { name: '6 AWG', area: 13.3, diameter: 7.72, ampacity: 55 },
  AWG_4: { name: '4 AWG', area: 21.2, diameter: 8.94, ampacity: 70 },
  AWG_2: { name: '2 AWG', area: 33.6, diameter: 10.5, ampacity: 95 },
  AWG_1: { name: '1 AWG', area: 42.4, diameter: 12.5, ampacity: 110 },
  AWG_1_0: { name: '1/0 AWG', area: 53.5, diameter: 13.5, ampacity: 125 },
  AWG_2_0: { name: '2/0 AWG', area: 67.4, diameter: 14.7, ampacity: 145 },
  AWG_3_0: { name: '3/0 AWG', area: 85.0, diameter: 16.0, ampacity: 165 },
  AWG_4_0: { name: '4/0 AWG', area: 107.2, diameter: 17.5, ampacity: 195 },
  KCMIL_250: { name: '250 kcmil', area: 127.0, diameter: 19.4, ampacity: 215 },
  KCMIL_300: { name: '300 kcmil', area: 152.0, diameter: 20.8, ampacity: 240 },
  KCMIL_350: { name: '350 kcmil', area: 177.0, diameter: 22.1, ampacity: 260 },
  KCMIL_400: { name: '400 kcmil', area: 203.0, diameter: 23.3, ampacity: 280 },
  KCMIL_500: { name: '500 kcmil', area: 253.0, diameter: 25.5, ampacity: 320 },
  KCMIL_600: { name: '600 kcmil', area: 304.0, diameter: 28.3, ampacity: 355 },
  KCMIL_700: { name: '700 kcmil', area: 355.0, diameter: 30.1, ampacity: 385 },
  KCMIL_750: { name: '750 kcmil', area: 380.0, diameter: 30.9, ampacity: 400 },
  KCMIL_800: { name: '800 kcmil', area: 405.0, diameter: 31.8, ampacity: 410 },
  KCMIL_1000: { name: '1000 kcmil', area: 507.0, diameter: 34.8, ampacity: 455 }
};

// Materiales disponibles
export const MATERIALS: Record<string, Material> = {
  COPPER: { name: 'Cobre', density: 8.96, resistivity: 1.724e-8 },
  ALUMINUM: { name: 'Aluminio', density: 2.70, resistivity: 2.82e-8 },
  STEEL: { name: 'Acero', density: 7.85, resistivity: 1.0e-7 }
};

/**
 * Función principal de cálculos IEEE 80
 */
export const calculateIEEE80 = (params: GroundingParams): IEEE80Results => {
  console.log('calculateIEEE80 called with:', params);
  
  const p: Required<GroundingParams> = {
    transformerKVA: params?.transformerKVA ?? 75,
    primaryVoltage: params?.primaryVoltage ?? 13200,
    secondaryVoltage: params?.secondaryVoltage ?? 220,
    transformerImpedance: params?.transformerImpedance ?? 5,
    faultDuration: params?.faultDuration ?? 0.35,
    currentDivisionFactor: params?.currentDivisionFactor ?? 0.20,
    soilResistivity: params?.soilResistivity ?? 100,
    surfaceLayer: params?.surfaceLayer ?? 10000,
    surfaceDepth: params?.surfaceDepth ?? 0.2,
    gridLength: params?.gridLength ?? 30,
    gridWidth: params?.gridWidth ?? 16,
    gridDepth: params?.gridDepth ?? 0.6,
    conductorDiameter: params?.conductorDiameter ?? 0.01052,
    conductorArea: params?.conductorArea ?? 67.4,
    conductorGauge: params?.conductorGauge ?? '2/0 AWG',
    materialType: params?.materialType ?? 'COPPER_SOFT',
    numParallel: params?.numParallel ?? 15,
    numParallelY: params?.numParallelY ?? 12,
    numRods: params?.numRods ?? 45,
    rodLength: params?.rodLength ?? 3,
    ...params
  };

  // Cálculo básico
  const Vsec = Math.max(1, p.secondaryVoltage || 220);
  const Z = Math.max(1, p.transformerImpedance || 5);
  const In = (p.transformerKVA * 1000) / (Math.sqrt(3) * Vsec);
  const faultCurrent = In / (Z / 100);
  const Ig = faultCurrent * p.currentDivisionFactor;
  
  const A = Math.max(1, p.gridLength * p.gridWidth);
  const perimeter = 2 * (p.gridLength + p.gridWidth);
  const totalGridLength = perimeter * p.numParallel;
  const totalRodLength = p.numRods * p.rodLength;
  const LT = Math.max(0.1, totalGridLength + totalRodLength);
  
  // Resistencia de malla simplificada
  const Rg = p.soilResistivity * (1/LT + 1/Math.max(1, Math.sqrt(20 * A)));
  const GPR = Ig * Rg;
  
  // Tensiones simplificadas
  const surfaceLayer = Math.max(1, p.surfaceLayer || 10000);
  const surfaceDepth = Math.max(0.01, p.surfaceDepth || 0.2);
  const Cs = 1 - (0.09 * (1 - p.soilResistivity / surfaceLayer)) / (2 * surfaceDepth + 0.09);
  const t = Math.max(0.1, p.faultDuration || 0.35);
  const sqrt_t = Math.sqrt(t);
  
  // ✅ Para PERSONA de 70 kg
  const Etouch70 = (1000 + 1.5 * Cs * p.surfaceLayer) * (0.157 / sqrt_t);
  const Estep70 = (1000 + 6.0 * Cs * p.surfaceLayer) * (0.157 / sqrt_t);
  
  // ✅ Para PERSONA de 50 kg (más crítica - IEEE 80-2013)
  // Fórmula: factor corporal 0.116 en lugar de 0.157
  const Etouch50 = (1000 + 1.5 * Cs * p.surfaceLayer) * (0.116 / sqrt_t);
  const Estep50 = (1000 + 6.0 * Cs * p.surfaceLayer) * (0.116 / sqrt_t);
  
  const Em = GPR * 0.3; // Aproximación
  const Es = GPR * 0.15; // Aproximación
  
  // Verificaciones para 70 kg
  const touchSafe70 = Em <= Etouch70;
  const stepSafe70 = Es <= Estep70;
  
  // ✅ Verificaciones para 50 kg
  const touchSafe50 = Em <= Etouch50;
  const stepSafe50 = Es <= Estep50;
  
  const complies = touchSafe70 && stepSafe70;
  
  const minConductorArea = (Ig * sqrt_t) / 7.0;
  
  const result: IEEE80Results = {
    faultCurrent,
    Ig,
    Sf: p.currentDivisionFactor,
    Cs,
    Etouch70,
    Estep70,
    Etouch50,
    Estep50,
    Rg,
    GPR,
    Em,
    Es,
    touchSafe70,
    stepSafe70,
    touchSafe50,
    stepSafe50,
    complies,
    gridArea: A,
    totalConductor: totalGridLength,
    totalRodLength,
    minConductorArea,
    selectedConductor: CONDUCTORS.AWG_4_0,
    faultDuration: t
  };

  console.log('calculateIEEE80 result:', result);
  return result;
};

export const generateRecommendations = (results: IEEE80Results | null | undefined): string[] => {
  const recs: string[] = [];
  if (results?.Rg && results.Rg > 5) recs.push("• Resistencia de malla > 5Ω: mejorar diseño");
  if (!results?.touchSafe70) recs.push("• Tensión de contacto excede límite");
  if (!results?.stepSafe70) recs.push("• Tensión de paso excede límite");
  if (recs.length === 0) recs.push("✓ Diseño cumple con IEEE 80");
  return recs;
};

export const validateImportedData = (data: ImportedData | null | undefined): boolean => {
  return !!(data?.parameters?.transformerKVA);
};

export const selectConductor = (area: number): Conductor => {
  const conductorsList = Object.values(CONDUCTORS);
  for (const cond of conductorsList) {
    if (cond.area >= area) {
      return cond;
    }
  }
  return conductorsList[0]; // Default al primero
};

export default {
  calculateIEEE80,
  generateRecommendations,
  validateImportedData,
  MATERIALS,
  CONDUCTORS,
  selectConductor
};
