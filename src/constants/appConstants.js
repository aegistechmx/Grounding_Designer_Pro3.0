/**
 * Constantes centralizadas de la aplicación
 * Centraliza todos los valores mágicos y configuraciones
 */

// ============================================
// PARÁMETROS POR DEFECTO
// ============================================
export const DEFAULT_PARAMS = {
  // Sistema eléctrico
  transformerKVA: 75,
  primaryVoltage: 13200,
  secondaryVoltage: 220,
  transformerImpedance: 5,
  faultDuration: 0.35,
  currentDivisionFactor: 0.20,
  
  // Suelo
  soilResistivity: 100,
  surfaceLayer: 10000,
  surfaceDepth: 0.2,
  
  // Malla
  gridLength: 30,
  gridWidth: 16,
  gridDepth: 0.6,
  
  // Conductores
  conductorDiameter: 0.01052,
  conductorArea: 67.4,
  conductorGauge: '2/0 AWG',
  materialType: 'COPPER_SOFT',
  
  // Configuración
  numParallel: 15,
  numParallelY: 12,
  numRods: 45,
  rodLength: 3,
  
  // Otros
  projectName: 'Proyecto Default',
  engineerName: '',
  location: '',
  notes: ''
};

// ============================================
// RANGOS DE PARÁMETROS
// ============================================
export const PARAM_RANGES = {
  transformerKVA: { min: 15, max: 10000, unit: 'kVA' },
  primaryVoltage: { min: 120, max: 50000, unit: 'V' },
  secondaryVoltage: { min: 100, max: 1000, unit: 'V' },
  transformerImpedance: { min: 1, max: 15, unit: '%' },
  faultDuration: { min: 0.1, max: 10, unit: 's' },
  currentDivisionFactor: { min: 0.1, max: 0.8, unit: '' },
  soilResistivity: { min: 1, max: 10000, unit: 'Ω·m' },
  surfaceLayer: { min: 100, max: 50000, unit: 'Ω·m' },
  surfaceDepth: { min: 0.01, max: 2, unit: 'm' },
  gridLength: { min: 1, max: 100, unit: 'm' },
  gridWidth: { min: 1, max: 100, unit: 'm' },
  gridDepth: { min: 0.1, max: 5, unit: 'm' },
  conductorDiameter: { min: 0.005, max: 0.05, unit: 'm' },
  conductorArea: { min: 10, max: 1000, unit: 'mm²' },
  numParallel: { min: 2, max: 30, unit: '' },
  numParallelY: { min: 2, max: 30, unit: '' },
  numRods: { min: 0, max: 100, unit: '' },
  rodLength: { min: 0.5, max: 10, unit: 'm' }
};

// ============================================
// CONSTANTES DE MALLA
// ============================================
export const GRID_CONSTANTS = {
  MAX_PARALLEL_CONDUCTORS: 30,
  MAX_RODS: 100,
  MAX_ROD_LENGTH: 10,
  MIN_GRID_DEPTH: 0.1,
  MAX_GRID_DEPTH: 5,
  DEFAULT_GRID_DEPTH: 0.6,
  MIN_SPACING: 0.5,
  MAX_SPACING: 10
};

// ============================================
// CONSTANTES TÉRMICAS
// ============================================
export const THERMAL_CONSTANTS = {
  COPPER_SOFT: { k: 7.0, name: 'Cobre Recocido', maxTemp: 250 },
  COPPER_HARD: { k: 7.0, name: 'Cobre Duro', maxTemp: 250 },
  ALUMINUM: { k: 4.5, name: 'Aluminio', maxTemp: 200 },
  STEEL: { k: 6.0, name: 'Acero', maxTemp: 200 }
};

// ============================================
// CONSTANTES DE UI
// ============================================
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  NOTIFICATION_DURATION: 5000,
  LOADING_TIMEOUT: 300,
  ANIMATION_DURATION: 200,
  TRANSITION_DURATION: 300,
  MAX_HISTORY_SIZE: 50,
  MAX_PROFILES_SIZE: 20
};

// ============================================
// CONSTANTES DE GPR
// ============================================
export const GPR_TARGETS = [
  { value: 15000, label: '15,000 V - Subestación básica' },
  { value: 10000, label: '10,000 V - Subestación estándar' },
  { value: 5000, label: '5,000 V - Con equipos electrónicos' },
  { value: 3000, label: '3,000 V - Con telecomunicaciones' },
  { value: 2000, label: '2,000 V - Hospital/Clínica' },
  { value: 1000, label: '1,000 V - Data center' }
];

// ============================================
// CONSTANTES DE SEGURIDAD
// ============================================
export const SAFETY_CONSTANTS = {
  MAX_SAFE_RESISTANCE: 5,
  MAX_SAFE_GPR_HIGH_RISK: 10000,
  MAX_SAFE_GPR_MODERATE_RISK: 5000,
  MIN_SURFACE_RESISTIVITY: 100,
  MAX_SURFACE_RESISTIVITY: 50000,
  MIN_SURFACE_DEPTH: 0.1,
  MAX_SURFACE_DEPTH: 2
};

// ============================================
// CONSTANTES DE OPTIMIZACIÓN
// ============================================
export const OPTIMIZATION_CONFIGS = [
  { numParallel: 12, numRods: 30, sf: 0.25 },
  { numParallel: 14, numRods: 35, sf: 0.22 },
  { numParallel: 16, numRods: 40, sf: 0.20 },
  { numParallel: 18, numRods: 45, sf: 0.20 },
  { numParallel: 20, numRods: 50, sf: 0.18 }
];

export const OPTIMIZED_GRID_CONFIG = {
  numParallel: 18,
  numRods: 50,
  rodLength: 3,
  gridDepth: 0.6,
  faultDuration: 0.35,
  currentDivisionFactor: 0.20,
  surfaceLayer: 10000,
  surfaceDepth: 0.2
};

// ============================================
// CONSTANTES DE EXPORTACIÓN
// ============================================
export const EXPORT_CONSTANTS = {
  PDF_FILENAME_PREFIX: 'Grounding_Design_Pro_',
  JSON_FILENAME_PREFIX: 'Grounding_',
  EXCEL_FILENAME_PREFIX: 'Grounding_',
  DXF_FILENAME_PREFIX: 'Grounding_Grid_',
  DATE_FORMAT: 'YYYY-MM-DD'
};

// ============================================
// CONSTANTES DE TRANSFORMADOR
// ============================================
export const TRANSFORMER_KVA_OPTIONS = [
  15, 25, 37.5, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 600, 750, 1000, 1500, 2000, 2500, 3000, 5000, 7500, 10000
];

// ============================================
// CONSTANTES DE REGIÓN
// ============================================
export const REGIONS = {
  templado: { name: 'Templado', factor: 1.0 },
  tropical: { name: 'Tropical', factor: 1.2 },
  seco: { name: 'Seco', factor: 0.8 },
  frío: { name: 'Frío', factor: 1.5 }
};

export default {
  DEFAULT_PARAMS,
  PARAM_RANGES,
  GRID_CONSTANTS,
  THERMAL_CONSTANTS,
  UI_CONSTANTS,
  GPR_TARGETS,
  SAFETY_CONSTANTS,
  OPTIMIZATION_CONFIGS,
  OPTIMIZED_GRID_CONFIG,
  EXPORT_CONSTANTS,
  TRANSFORMER_KVA_OPTIONS,
  REGIONS
};
