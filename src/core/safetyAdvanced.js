/**
 * Seguridad avanzada IEEE 80
 * Con X/R, tiempo de despeje y capa superficial
 */

import { effectiveFaultCurrent } from './fault';

// ============================================
// 1. TENSIÓN DE CONTACTO PERMISIBLE
// ============================================

export const allowableTouchVoltage = ({ rho, t, Cs = 1, bodyWeight = 70 }) => {
  const ρ = Math.max(1, rho);
  const duration = Math.max(0.01, t);
  
  // Factor corporal según IEEE 80
  const bodyFactor = bodyWeight === 70 ? 0.157 : 0.116;
  
  // Con capa superficial
  const Vtouch = (1000 + 1.5 * Cs * ρ) * (bodyFactor / Math.sqrt(duration));
  
  return Math.max(50, Math.min(5000, Vtouch));
};

// ============================================
// 2. TENSIÓN DE PASO PERMISIBLE
// ============================================

export const allowableStepVoltage = ({ rho, t, Cs = 1, bodyWeight = 70 }) => {
  const ρ = Math.max(1, rho);
  const duration = Math.max(0.01, t);
  
  // Factor corporal según IEEE 80
  const bodyFactor = bodyWeight === 70 ? 0.157 : 0.116;
  
  // Con capa superficial
  const Vstep = (1000 + 6.0 * Cs * ρ) * (bodyFactor / Math.sqrt(duration));
  
  return Math.max(150, Math.min(15000, Vstep));
};

// ============================================
// 3. EVALUACIÓN COMPLETA DE SEGURIDAD
// ============================================

export const evaluateSafety = ({
  If,           // Corriente de falla simétrica (A)
  X_R,          // Relación X/R
  t,            // Tiempo de despeje (s)
  Rg,           // Resistencia de malla (Ω)
  rho,          // Resistividad del suelo (Ω·m)
  Cs = 1,       // Factor de capa superficial
  bodyWeight = 70
}) => {
  // Corriente efectiva con decremento DC
  const { Ieff, dcFactor } = effectiveFaultCurrent({ If, X_R, t });
  
  // Tensiones calculadas
  const Vtouch = Ieff * Rg;
  const Vstep = Vtouch * 0.6; // Aproximación: tensión de paso ≈ 60% de contacto
  
  // Tensiones permisibles
  const VtouchAllow = allowableTouchVoltage({ rho, t, Cs, bodyWeight });
  const VstepAllow = allowableStepVoltage({ rho, t, Cs, bodyWeight });
  
  // Validaciones
  const safeTouch = Vtouch < VtouchAllow;
  const safeStep = Vstep < VstepAllow;
  const complies = safeTouch && safeStep;
  
  // Márgenes de seguridad
  const touchMargin = ((VtouchAllow - Vtouch) / VtouchAllow * 100).toFixed(1);
  const stepMargin = ((VstepAllow - Vstep) / VstepAllow * 100).toFixed(1);
  
  return {
    Ieff,
    dcFactor,
    Vtouch,
    Vstep,
    VtouchAllow,
    VstepAllow,
    safeTouch,
    safeStep,
    complies,
    touchMargin,
    stepMargin,
    status: complies ? 'APROBADO' : 'NO APROBADO'
  };
};

// ============================================
// 4. EVALUACIÓN CON MÚLTIPLES PESOS CORPORALES
// ============================================

export const evaluateSafetyMultiWeight = (params) => {
  const weights = [50, 70];
  
  const results = {};
  let compliesAll = true;
  
  for (const weight of weights) {
    const result = evaluateSafety({ ...params, bodyWeight: weight });
    results[`${weight}kg`] = result;
    if (!result.complies) compliesAll = false;
  }
  
  return {
    ...results,
    compliesAll
  };
};

export default {
  allowableTouchVoltage,
  allowableStepVoltage,
  evaluateSafety,
  evaluateSafetyMultiWeight
};
