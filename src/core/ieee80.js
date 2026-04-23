/**
 * Cálculos IEEE 80-2013 para sistemas de puesta a tierra
 * Resistencia de malla, tensiones de paso y contacto
 */

// ============================================
// 1. RESISTENCIA DE MALLA (Schwarz simplificado + IEEE)
// ============================================

export const calcGridResistance = ({
  soilResistivity,        // ρ (Ω·m)
  gridArea,               // A (m²)
  totalConductorLength,   // Lt (m)
  burialDepth = 0.6,      // h (m)
  numRods = 0,            // Número de varillas
  rodLength = 3           // Longitud de varilla (m)
}) => {
  const ρ = Math.max(1, soilResistivity);
  const A = Math.max(1, gridArea);
  const Lt = Math.max(1, totalConductorLength);
  const h = Math.max(0.1, burialDepth);
  
  // Método de Schwarz simplificado (IEEE 80)
  const sqrtA = Math.sqrt(A);
  const L = Lt;
  
  // Término 1: Resistencia base
  const R1 = ρ / (4 * sqrtA);
  
  // Término 2: Corrección por longitud de conductor
  const R2 = 1 + (1 / (1 + (L / (4 * sqrtA))));
  
  // Resistencia base de la malla
  let Rg = R1 * R2;
  
  // Corrección por varillas (efecto en paralelo)
  if (numRods > 0) {
    const rodResistance = (ρ / (2 * Math.PI * rodLength)) * Math.log(4 * rodLength / 0.0254);
    const totalRodResistance = rodResistance / numRods;
    // Resistencia equivalente en paralelo
    Rg = 1 / ((1 / Rg) + (1 / totalRodResistance));
  }
  
  // Limitar a valores razonables
  return Math.max(0.1, Math.min(50, Rg));
};

// ============================================
// 2. FACTOR DE CAPA SUPERFICIAL (Cs)
// ============================================

export const calcSurfaceLayerFactor = ({
  soilResistivity,
  surfaceResistivity,
  surfaceDepth
}) => {
  const ρ = Math.max(1, soilResistivity);
  const ρs = Math.max(1, surfaceResistivity);
  const hs = Math.max(0.01, surfaceDepth);
  
  let Cs = 1 - (0.09 * (1 - ρ / ρs)) / (2 * hs + 0.09);
  return Math.max(0.5, Math.min(1, Cs));
};

// ============================================
// 3. TENSIÓN DE CONTACTO PERMISIBLE
// ============================================

export const allowableTouchVoltage = ({
  bodyWeight = 70,
  surfaceResistivity = 3000,
  faultDuration = 0.35,
  Cs = 1
}) => {
  const t = Math.max(0.1, faultDuration);
  const sqrt_t = Math.sqrt(t);
  
  // Factor corporal según IEEE 80
  const bodyFactor = bodyWeight === 70 ? 0.157 : 0.116;
  
  let Etouch = (1000 + 1.5 * Cs * surfaceResistivity) * (bodyFactor / sqrt_t);
  return Math.max(50, Math.min(5000, Etouch));
};

// ============================================
// 4. TENSIÓN DE PASO PERMISIBLE
// ============================================

export const allowableStepVoltage = ({
  bodyWeight = 70,
  surfaceResistivity = 3000,
  faultDuration = 0.35,
  Cs = 1
}) => {
  const t = Math.max(0.1, faultDuration);
  const sqrt_t = Math.sqrt(t);
  
  // Factor corporal según IEEE 80
  const bodyFactor = bodyWeight === 70 ? 0.157 : 0.116;
  
  let Estep = (1000 + 6.0 * Cs * surfaceResistivity) * (bodyFactor / sqrt_t);
  return Math.max(150, Math.min(15000, Estep));
};

// ============================================
// 5. TENSIÓN DE CONTACTO CALCULADA
// ============================================

export const calcTouchVoltage = ({ faultCurrent, Rg, factor = 0.3 }) => {
  const If = Math.max(1, faultCurrent);
  const R = Math.max(0.01, Rg);
  
  // GPR = If * Rg
  const GPR = If * R;
  
  // Em = factor * GPR (factor típico 0.3 para malla)
  const Em = GPR * factor;
  
  return {
    GPR,
    Em,
    factor
  };
};

// ============================================
// 6. TENSIÓN DE PASO CALCULADA
// ============================================

export const calcStepVoltage = ({ faultCurrent, Rg, factor = 0.15 }) => {
  const If = Math.max(1, faultCurrent);
  const R = Math.max(0.01, Rg);
  
  // GPR = If * Rg
  const GPR = If * R;
  
  // Es = factor * GPR (factor típico 0.15 para paso)
  const Es = GPR * factor;
  
  return {
    GPR,
    Es,
    factor
  };
};

// ============================================
// 7. VALIDACIÓN COMPLETA IEEE 80
// ============================================

export const validateSystem = ({
  faultCurrent,
  Rg,
  soilResistivity,
  surfaceResistivity,
  surfaceDepth,
  faultDuration,
  bodyWeight = 70
}) => {
  // Calcular Cs
  const Cs = calcSurfaceLayerFactor({
    soilResistivity,
    surfaceResistivity,
    surfaceDepth
  });
  
  // Tensiones permisibles
  const VtouchAllow = allowableTouchVoltage({
    bodyWeight,
    surfaceResistivity,
    faultDuration,
    Cs
  });
  
  const VstepAllow = allowableStepVoltage({
    bodyWeight,
    surfaceResistivity,
    faultDuration,
    Cs
  });
  
  // Tensiones calculadas
  const { GPR, Em } = calcTouchVoltage({ faultCurrent, Rg });
  const { Es } = calcStepVoltage({ faultCurrent, Rg });
  
  // Validaciones
  const touchSafe = Em <= VtouchAllow;
  const stepSafe = Es <= VstepAllow;
  const complies = touchSafe && stepSafe;
  
  // Márgenes de seguridad
  const touchMargin = touchSafe ? VtouchAllow - Em : Em - VtouchAllow;
  const stepMargin = stepSafe ? VstepAllow - Es : Es - VstepAllow;
  
  return {
    GPR,
    Em,
    Es,
    VtouchAllow,
    VstepAllow,
    touchSafe,
    stepSafe,
    complies,
    Cs,
    safetyMarginTouch: touchMargin,
    safetyMarginStep: stepMargin
  };
};

// ============================================
// 8. CORRIENTE DE FALLA
// ============================================

export const calcFaultCurrent = ({
  transformerKVA = 75,
  secondaryVoltage = 220,
  impedance = 5,
  currentDivisionFactor = 0.2
}) => {
  const kVA = Math.max(1, transformerKVA);
  const V = Math.max(100, secondaryVoltage);
  const Z = Math.max(0.1, impedance);
  const Sf = Math.min(0.8, Math.max(0.1, currentDivisionFactor));
  
  const In = (kVA * 1000) / (Math.sqrt(3) * V);
  const faultCurrent = In / (Z / 100);
  const Ig = faultCurrent * Sf;
  
  return {
    nominalCurrent: In,
    faultCurrent,
    gridCurrent: Ig,
    Sf
  };
};

// ============================================
// 9. VERIFICACIÓN TÉRMICA DEL CONDUCTOR
// ============================================

export const calcThermalArea = ({
  faultCurrent,
  faultDuration = 0.35,
  material = 'COPPER'
}) => {
  const I = Math.max(1, faultCurrent);
  const t = Math.max(0.1, faultDuration);
  
  // Constantes térmicas
  const K = material === 'COPPER' ? 7.0 : material === 'ALUMINUM' ? 4.5 : 3.0;
  
  const minArea = (I * Math.sqrt(t)) / K;
  return minArea;
};

// ============================================
// 10. CÁLCULO COMPLETO (integrador)
// ============================================

export const calculateComplete = (params) => {
  if (!params) params = {};
  
  // 1. Geometría básica
  const gridLength = params.gridLength || 30;
  const gridWidth = params.gridWidth || 16;
  const numParallel = params.numParallel || 8;
  const numParallelY = params.numParallelY || 8;
  
  const area = gridLength * gridWidth;
  const perimeter = 2 * (gridLength + gridWidth);
  const totalConductorLength = perimeter * Math.max(numParallel, numParallelY);
  
  // 2. Corriente de falla
  const currents = calcFaultCurrent({
    transformerKVA: params.transformerKVA,
    secondaryVoltage: params.secondaryVoltage,
    impedance: params.transformerImpedance,
    currentDivisionFactor: params.currentDivisionFactor
  });
  
  // 3. Resistencia de malla
  const Rg = calcGridResistance({
    soilResistivity: params.soilResistivity,
    gridArea: area,
    totalConductorLength,
    burialDepth: params.gridDepth,
    numRods: params.numRods,
    rodLength: params.rodLength
  });
  
  // 4. Validación IEEE 80
  const validation = validateSystem({
    faultCurrent: currents.gridCurrent,
    Rg,
    soilResistivity: params.soilResistivity,
    surfaceResistivity: params.surfaceLayer,
    surfaceDepth: params.surfaceDepth,
    faultDuration: params.faultDuration
  });
  
  // 5. Verificación térmica
  const minConductorArea = calcThermalArea({
    faultCurrent: currents.gridCurrent,
    faultDuration: params.faultDuration
  });
  
  return {
    geometry: {
      area,
      perimeter,
      totalConductorLength,
      gridLength,
      gridWidth,
      numParallel,
      numParallelY
    },
    currents,
    Rg,
    validation,
    minConductorArea,
    complies: validation.complies
  };
};

export default {
  calcGridResistance,
  calcSurfaceLayerFactor,
  allowableTouchVoltage,
  allowableStepVoltage,
  calcTouchVoltage,
  calcStepVoltage,
  validateSystem,
  calcFaultCurrent,
  calcThermalArea,
  calculateComplete
};