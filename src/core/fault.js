/**
 * Cálculo avanzado de corriente de falla
 * Con factor X/R y tiempo de despeje
 */

// ============================================
// 1. CONSTANTE DE TIEMPO (τ)
// ============================================

export const timeConstant = (X_R, freq = 60) => {
  const XR = Math.max(0.1, X_R);
  const f = Math.max(1, freq);
  return XR / (2 * Math.PI * f);
};

// ============================================
// 2. CORRIENTE EFECTIVA CON DECREMENTO DC
// ============================================

export const effectiveFaultCurrent = ({ If, X_R, t }) => {
  const I = Math.max(1, If);
  const XR = Math.max(0.1, X_R);
  const duration = Math.max(0.01, t);
  
  const tau = timeConstant(XR);
  const dcFactor = Math.sqrt((1 + Math.exp(-2 * duration / tau)) / 2);
  
  const Ieff = I * dcFactor;
  
  return {
    Ieff,
    dcFactor,
    tau,
    formula: `Ieff = If × √((1 + e^(-2t/τ))/2)` 
  };
};

// ============================================
// 3. CORRIENTE DE FALLA ASIMÉTRICA
// ============================================

export const asymmetricFaultCurrent = ({ If, X_R }) => {
  const XR = Math.max(0.1, X_R);
  const crestFactor = Math.sqrt(1 + (1 / (XR * XR)));
  const Iasym = If * crestFactor;
  
  return {
    Iasym,
    crestFactor
  };
};

// ============================================
// 4. CORRIENTE DE FALLA COMPLETA
// ============================================

export const calculateFaultCurrents = ({
  transformerKVA = 75,
  secondaryVoltage = 220,
  impedance = 5,
  X_R = 5,
  faultDuration = 0.35,
  currentDivisionFactor = 0.2
}) => {
  // Corriente nominal
  const In = (transformerKVA * 1000) / (Math.sqrt(3) * secondaryVoltage);
  
  // Corriente de falla simétrica
  const If = In / (impedance / 100);
  
  // Corriente efectiva (con decremento DC)
  const { Ieff, dcFactor, tau } = effectiveFaultCurrent({
    If,
    X_R,
    t: faultDuration
  });
  
  // Corriente en la malla
  const Sf = Math.min(0.8, Math.max(0.1, currentDivisionFactor));
  const Ig = Ieff * Sf;
  
  return {
    nominalCurrent: In,
    faultCurrentSym: If,
    faultCurrentEff: Ieff,
    gridCurrent: Ig,
    dcFactor,
    tau,
    Sf,
    X_R,
    faultDuration
  };
};

export default {
  timeConstant,
  effectiveFaultCurrent,
  asymmetricFaultCurrent,
  calculateFaultCurrents
};
