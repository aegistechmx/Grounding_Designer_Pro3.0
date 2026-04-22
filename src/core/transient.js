/**
 * Corriente Transitoria - IEEE 80
 * Implementa factor DC offset para análisis de corriente de falla
 */

/**
 * Calcula factor de decremento DC
 * Basado en IEEE 80 para componente DC transitoria
 * 
 * @param {number} XR - Relación X/R del sistema
 * @param {number} t - Tiempo de falla (s)
 * @param {number} frequency - Frecuencia del sistema (Hz, default 60)
 * @returns {number} Factor de decremento DC (dimensionless)
 */
export const decrementFactor = (XR, t, frequency = 60) => {
  // Validación de entradas
  XR = Math.max(1, XR || 10); // X/R típico: 10-30
  t = Math.max(0.01, t || 0.5); // Tiempo mínimo 10ms
  
  // Constante de tiempo del circuito
  const tau = XR / (2 * Math.PI * frequency);
  
  // Factor DC decrement simplificado según IEEE 80
  // Considera componente asimétrica de la corriente de falla
  const dcOffset = Math.exp(-2 * t / tau);
  
  // Factor total incluye componente simétrica + asimétrica
  return Math.sqrt(1 + dcOffset);
};

/**
 * Calcula corriente de falla efectiva con DC offset
 * 
 * @param {number} Ik - Corriente de falla simétrica (A)
 * @param {number} XR - Relación X/R del sistema
 * @param {number} t - Tiempo de falla (s)
 * @param {number} frequency - Frecuencia del sistema (Hz, default 60)
 * @returns {number} Corriente de falla efectiva (A)
 */
export const effectiveFaultCurrent = (Ik, XR, t, frequency = 60) => {
  // Validación de entradas
  Ik = Math.max(0, Ik || 1000);
  
  const factor = decrementFactor(XR, t, frequency);
  return Ik * factor;
};

/**
 * Calcula componente DC de la corriente de falla
 * 
 * @param {number} Ik - Corriente de falla simétrica (A)
 * @param {number} XR - Relación X/R del sistema
 * @param {number} t - Tiempo de falla (s)
 * @param {number} frequency - Frecuencia del sistema (Hz, default 60)
 * @returns {number} Componente DC (A)
 */
export const dcComponent = (Ik, XR, t, frequency = 60) => {
  Ik = Math.max(0, Ik || 1000);
  XR = Math.max(1, XR || 10);
  t = Math.max(0.01, t || 0.5);
  
  const tau = XR / (2 * Math.PI * frequency);
  const dcOffset = Math.exp(-t / tau);
  
  return Ik * dcOffset;
};

/**
 * Calcula componente simétrica de la corriente de falla
 * 
 * @param {number} Ik - Corriente de falla simétrica (A)
 * @returns {number} Componente simétrica (A)
 */
export const symmetricalComponent = (Ik) => {
  return Math.max(0, Ik || 1000);
};

/**
 * Calcula relación X/R basada en tipo de equipo
 * Valores típicos según IEEE 80
 * 
 * @param {string} equipmentType - Tipo de equipo
 * @returns {number} Relación X/R típica
 */
export const getTypicalXR = (equipmentType) => {
  const typicalXR = {
    'transformer': 10,
    'generator': 15,
    'motor': 8,
    'cable': 5,
    'bus': 3,
    'default': 10
  };
  
  return typicalXR[equipmentType] || typicalXR.default;
};

/**
 * Calcula energía térmica acumulada durante la falla
 * I²t integral para evaluación térmica
 * 
 * @param {number} Ieff - Corriente efectiva (A)
 * @param {number} t - Tiempo de falla (s)
 * @returns {number} Energía térmica (A²s)
 */
export const thermalEnergy = (Ieff, t) => {
  Ieff = Math.max(0, Ieff || 1000);
  t = Math.max(0.01, t || 0.5);
  
  return Math.pow(Ieff, 2) * t;
};

/**
 * Valida parámetros de análisis transitorio
 * 
 * @param {object} params - Parámetros de análisis
 * @returns {object} Objeto con validación y errores
 */
export const validateTransientParams = (params) => {
  const errors = [];
  const warnings = [];

  if (!params) {
    return { valid: false, errors: ['Parámetros no proporcionados'], warnings };
  }

  if (!params.Ik || params.Ik <= 0) {
    errors.push('Corriente de falla (Ik) debe ser positiva');
  }
  
  if (!params.XR || params.XR < 1) {
    warnings.push('Relación X/R < 1 es inusual, usando valor típico de 10');
  }
  
  if (params.XR > 50) {
    warnings.push('Relación X/R > 50 es extremadamente alta');
  }
  
  if (!params.t || params.t <= 0) {
    errors.push('Tiempo de falla (t) debe ser positivo');
  }
  
  if (params.t > 5) {
    warnings.push('Tiempo de falla > 5s es inusual para aplicaciones típicas');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Análisis completo de corriente transitoria
 * 
 * @param {object} params - Parámetros de análisis
 * @param {number} params.Ik - Corriente de falla simétrica (A)
 * @param {number} params.XR - Relación X/R
 * @param {number} params.t - Tiempo de falla (s)
 * @param {number} params.frequency - Frecuencia (Hz, default 60)
 * @returns {object} Resultados completos del análisis
 */
export const analyzeTransient = (params) => {
  const { Ik, XR, t, frequency = 60 } = params;
  
  const validation = validateTransientParams(params);
  
  if (!validation.valid) {
    return {
      valid: false,
      errors: validation.errors,
      warnings: validation.warnings
    };
  }

  const Ieff = effectiveFaultCurrent(Ik, XR, t, frequency);
  const Idc = dcComponent(Ik, XR, t, frequency);
  const Isym = symmetricalComponent(Ik);
  const factor = decrementFactor(XR, t, frequency);
  const energy = thermalEnergy(Ieff, t);

  return {
    valid: true,
    results: {
      symmetricalCurrent: Isym,
      dcComponent: Idc,
      effectiveCurrent: Ieff,
      decrementFactor: factor,
      thermalEnergy: energy,
      dcPercentage: (Idc / Ieff * 100).toFixed(2)
    },
    warnings: validation.warnings
  };
};
