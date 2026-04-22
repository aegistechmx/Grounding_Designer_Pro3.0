/**
 * Módulo de validación de seguridad IEEE 80
 */

import {
  allowableTouchVoltage,
  allowableStepVoltage,
  calcTouchVoltage,
  calcStepVoltage,
  calcSurfaceLayerFactor
} from './ieee80';

export const validateTouchSafety = (params) => {
  const {
    faultCurrent,
    Rg,
    soilResistivity,
    surfaceResistivity,
    surfaceDepth,
    faultDuration,
    bodyWeight = 70
  } = params;
  
  // Calcular Cs
  const Cs = calcSurfaceLayerFactor({
    soilResistivity,
    surfaceResistivity,
    surfaceDepth
  });
  
  // Tensión permisible
  const allowable = allowableTouchVoltage({
    bodyWeight,
    surfaceResistivity,
    faultDuration,
    Cs
  });
  
  // Tensión calculada
  const { Em } = calcTouchVoltage({ faultCurrent, Rg });
  
  return {
    calculated: Em,
    allowable,
    safe: Em <= allowable,
    margin: allowable > 0 && isFinite((allowable - Em) / Math.max(1, allowable) * 100) ? ((allowable - Em) / Math.max(1, allowable) * 100).toFixed(1) : '0'
  };
};

export const validateStepSafety = (params) => {
  const {
    faultCurrent,
    Rg,
    soilResistivity,
    surfaceResistivity,
    surfaceDepth,
    faultDuration,
    bodyWeight = 70
  } = params;
  
  // Calcular Cs
  const Cs = calcSurfaceLayerFactor({
    soilResistivity,
    surfaceResistivity,
    surfaceDepth
  });
  
  // Tensión permisible
  const allowable = allowableStepVoltage({
    bodyWeight,
    surfaceResistivity,
    faultDuration,
    Cs
  });
  
  // Tensión calculada
  const { Es } = calcStepVoltage({ faultCurrent, Rg });
  
  return {
    calculated: Es,
    allowable,
    safe: Es <= allowable,
    margin: allowable > 0 && isFinite((allowable - Es) / Math.max(1, allowable) * 100) ? ((allowable - Es) / Math.max(1, allowable) * 100).toFixed(1) : '0'
  };
};

export const validateSystem = (params) => {
  const touch = validateTouchSafety(params);
  const step = validateStepSafety(params);
  
  return {
    touch,
    step,
    complies: touch.safe && step.safe,
    summary: {
      status: (touch.safe && step.safe) ? 'APROBADO' : 'NO APROBADO',
      touchMargin: touch.margin,
      stepMargin: step.margin
    }
  };
};

export default {
  validateTouchSafety,
  validateStepSafety,
  validateSystem
};