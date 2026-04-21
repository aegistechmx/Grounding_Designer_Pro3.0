/**
 * Motor IEEE 80 completo para validación de seguridad
 */

// ============================================
// 1. TENSIONES CALCULADAS
// ============================================

export const calcTouchVoltage = (If, Rg, Cs = 1, rho = 100, t = 0.35) => {
  const I = Math.max(1, If);
  const R = Math.max(0.01, Rg);
  const factor = Math.min(1, Math.max(0.1, Cs));
  
  // GPR = If * Rg
  const GPR = I * R;
  
  // Em = GPR * factor (típicamente 0.3 para contacto)
  const Em = GPR * 0.3 * factor;
  
  return Em;
};

export const calcStepVoltage = (If, Rg, Cs = 1, rho = 100, t = 0.35) => {
  const I = Math.max(1, If);
  const R = Math.max(0.01, Rg);
  const factor = Math.min(1, Math.max(0.1, Cs));
  
  // GPR = If * Rg
  const GPR = I * R;
  
  // Es = GPR * factor (típicamente 0.15 para paso)
  const Es = GPR * 0.15 * factor;
  
  return Es;
};

// ============================================
// 2. LÍMITES PERMISIBLES (IEEE 80)
// ============================================

export const allowableTouchVoltage = (rho, t, bodyWeight = 70) => {
  const ρ = Math.max(1, rho);
  const duration = Math.max(0.01, t);
  const sqrt_t = Math.sqrt(duration);
  
  // Factor corporal según IEEE 80
  const bodyFactor = bodyWeight === 70 ? 0.157 : 0.116;
  
  // Sin capa superficial (Cs = 1)
  const Etouch = (1000 + 1.5 * ρ) * (bodyFactor / sqrt_t);
  
  return Math.max(50, Math.min(5000, Etouch));
};

export const allowableStepVoltage = (rho, t, bodyWeight = 70) => {
  const ρ = Math.max(1, rho);
  const duration = Math.max(0.01, t);
  const sqrt_t = Math.sqrt(duration);
  
  // Factor corporal según IEEE 80
  const bodyFactor = bodyWeight === 70 ? 0.157 : 0.116;
  
  // Sin capa superficial (Cs = 1)
  const Estep = (1000 + 6.0 * ρ) * (bodyFactor / sqrt_t);
  
  return Math.max(150, Math.min(15000, Estep));
};

// ============================================
// 3. FACTOR DE CAPA SUPERFICIAL (Cs)
// ============================================

export const calcCs = (soilResistivity, surfaceResistivity, surfaceDepth) => {
  const ρ = Math.max(1, soilResistivity);
  const ρs = Math.max(1, surfaceResistivity);
  const hs = Math.max(0.01, surfaceDepth);
  
  let Cs = 1 - (0.09 * (1 - ρ / ρs)) / (2 * hs + 0.09);
  return Math.max(0.5, Math.min(1, Cs));
};

// ============================================
// 4. TENSIONES CON CAPA SUPERFICIAL
// ============================================

export const allowableTouchVoltageWithSurface = (rho, rho_s, hs, t, bodyWeight = 70) => {
  const Cs = calcCs(rho, rho_s, hs);
  const ρs = Math.max(1, rho_s);
  const duration = Math.max(0.01, t);
  const sqrt_t = Math.sqrt(duration);
  
  const bodyFactor = bodyWeight === 70 ? 0.157 : 0.116;
  
  const Etouch = (1000 + 1.5 * Cs * ρs) * (bodyFactor / sqrt_t);
  return Math.max(50, Math.min(5000, Etouch));
};

export const allowableStepVoltageWithSurface = (rho, rho_s, hs, t, bodyWeight = 70) => {
  const Cs = calcCs(rho, rho_s, hs);
  const ρs = Math.max(1, rho_s);
  const duration = Math.max(0.01, t);
  const sqrt_t = Math.sqrt(duration);
  
  const bodyFactor = bodyWeight === 70 ? 0.157 : 0.116;
  
  const Estep = (1000 + 6.0 * Cs * ρs) * (bodyFactor / sqrt_t);
  return Math.max(150, Math.min(15000, Estep));
};

// ============================================
// 5. VALIDACIÓN COMPLETA
// ============================================

export const validateIEEE = (design) => {
  const {
    faultCurrent,
    Rg,
    soilResistivity,
    surfaceResistivity = 3000,
    surfaceDepth = 0.1,
    faultDuration = 0.35,
    bodyWeight = 70
  } = design;
  
  // Tensiones calculadas
  const touchVoltage = calcTouchVoltage(faultCurrent, Rg);
  const stepVoltage = calcStepVoltage(faultCurrent, Rg);
  
  // Tensiones permisibles
  const touchMax = allowableTouchVoltageWithSurface(
    soilResistivity, surfaceResistivity, surfaceDepth, faultDuration, bodyWeight
  );
  const stepMax = allowableStepVoltageWithSurface(
    soilResistivity, surfaceResistivity, surfaceDepth, faultDuration, bodyWeight
  );
  
  const touchOk = touchVoltage < touchMax;
  const stepOk = stepVoltage < stepMax;
  const complies = touchOk && stepOk;
  
  // Márgenes de seguridad
  const touchMargin = ((touchMax - touchVoltage) / touchMax * 100).toFixed(1);
  const stepMargin = ((stepMax - stepVoltage) / stepMax * 100).toFixed(1);
  
  return {
    touchVoltage,
    stepVoltage,
    touchMax,
    stepMax,
    touchOk,
    stepOk,
    complies,
    touchMargin,
    stepMargin,
    Cs: calcCs(soilResistivity, surfaceResistivity, surfaceDepth)
  };
};

// ============================================
// 6. CÁLCULO DE RESISTENCIA DE MALLA
// ============================================

export const calcGridResistance = ({ soilResistivity, area, totalLength, burialDepth = 0.6 }) => {
  const ρ = Math.max(1, soilResistivity);
  const A = Math.max(1, area);
  const L = Math.max(1, totalLength);
  const h = Math.max(0.1, burialDepth);
  
  // Fórmula de Schwarz simplificada
  const sqrtA = Math.sqrt(A);
  const Rg = ρ * (1 / L + 1 / Math.sqrt(20 * A)) * (1 + 1 / (1 + h * Math.sqrt(20 / A)));
  
  return Math.max(0.1, Math.min(50, Rg));
};

export default {
  calcTouchVoltage,
  calcStepVoltage,
  allowableTouchVoltage,
  allowableStepVoltage,
  allowableTouchVoltageWithSurface,
  allowableStepVoltageWithSurface,
  calcCs,
  validateIEEE,
  calcGridResistance
};
