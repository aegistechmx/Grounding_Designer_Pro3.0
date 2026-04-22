/**
 * Modelo de Suelo Multicapa - IEEE 80
 * Convierte modelo de 2 capas a resistividad aparente equivalente
 */

/**
 * Calcula resistividad aparente para modelo de 2 capas
 * Basado en aproximación de Sunde (práctica para ingeniería)
 * 
 * @param {number} rho1 - Resistividad capa superior (Ω·m)
 * @param {number} rho2 - Resistividad capa inferior (Ω·m)
 * @param {number} h - Espesor capa superior (m)
 * @param {number} a - Espaciamiento Wenner (m)
 * @returns {number} Resistividad aparente equivalente (Ω·m)
 */
export const apparentResistivity2Layer = (rho1, rho2, h, a) => {
  // Validación de entradas
  if (!rho1 || rho1 <= 0) rho1 = 100;
  if (!rho2 || rho2 <= 0) rho2 = rho1;
  if (!h || h <= 0) h = 0.1;
  if (!a || a <= 0) a = 1;

  // Modelo simplificado tipo Sunde (aproximación práctica)
  const k = (rho2 - rho1) / (rho2 + rho1);
  const expTerm = Math.exp(-2 * h / a);
  
  // Evitar división por cero
  const denominator = 1 - k * expTerm;
  if (Math.abs(denominator) < 0.001) {
    return rho1; // Fallback a resistividad simple
  }
  
  return rho1 * (1 + k * expTerm) / denominator;
};

/**
 * Obtiene resistividad efectiva del suelo
 * Si no hay datos multicapa, devuelve resistividad simple
 * 
 * @param {object} soil - Objeto de modelo de suelo
 * @param {number} soil.rho - Resistividad simple (Ω·m)
 * @param {boolean} soil.multilayer - Indica si es modelo multicapa
 * @param {number} soil.rho1 - Resistividad capa superior (Ω·m)
 * @param {number} soil.rho2 - Resistividad capa inferior (Ω·m)
 * @param {number} soil.h - Espesor capa superior (m)
 * @param {number} soil.a - Espaciamiento Wenner (m)
 * @returns {number} Resistividad efectiva (Ω·m)
 */
export const getEffectiveResistivity = (soil) => {
  if (!soil) return 100;
  
  // Si no es multicapa, usar resistividad simple
  if (!soil.multilayer) {
    return soil.rho || 100;
  }

  // Calcular resistividad aparente para modelo de 2 capas
  const { rho1, rho2, h, a } = soil;
  return apparentResistivity2Layer(rho1, rho2, h, a);
};

/**
 * Calcula factor de reflexión K para modelo de 2 capas
 * 
 * @param {number} rho1 - Resistividad capa superior (Ω·m)
 * @param {number} rho2 - Resistividad capa inferior (Ω·m)
 * @returns {number} Factor de reflexión K (dimensionless)
 */
export const calculateReflectionFactor = (rho1, rho2) => {
  if (!rho1 || !rho2 || rho1 + rho2 === 0) return 0;
  return (rho2 - rho1) / (rho2 + rho1);
};

/**
 * Interpola resistividad aparente para múltiples espaciamientos
 * Útil para curvas de resistividad
 * 
 * @param {object} soil - Objeto de modelo de suelo
 * @param {number[]} spacings - Array de espaciamientos (m)
 * @returns {object} Objeto con espaciamiento -> resistividad aparente
 */
export const generateApparentResistivityCurve = (soil, spacings = [1, 2, 5, 10, 20, 50]) => {
  if (!soil || !soil.multilayer) {
    // Si no es multicapa, resistividad constante
    const rho = soil?.rho || 100;
    return spacings.reduce((acc, a) => {
      acc[a] = rho;
      return acc;
    }, {});
  }

  const { rho1, rho2, h } = soil;
  return spacings.reduce((acc, a) => {
    acc[a] = apparentResistivity2Layer(rho1, rho2, h, a);
    return acc;
  }, {});
};

/**
 * Valida parámetros del modelo de suelo
 * 
 * @param {object} soil - Objeto de modelo de suelo
 * @returns {object} Objeto con validación y errores
 */
export const validateSoilModel = (soil) => {
  const errors = [];
  const warnings = [];

  if (!soil) {
    return { valid: false, errors: ['Modelo de suelo no proporcionado'], warnings };
  }

  if (soil.multilayer) {
    if (!soil.rho1 || soil.rho1 <= 0) {
      errors.push('Resistividad capa superior (rho1) debe ser positiva');
    }
    if (!soil.rho2 || soil.rho2 <= 0) {
      errors.push('Resistividad capa inferior (rho2) debe ser positiva');
    }
    if (!soil.h || soil.h <= 0) {
      errors.push('Espesor capa superior (h) debe ser positivo');
    }
    if (!soil.a || soil.a <= 0) {
      errors.push('Espaciamiento Wenner (a) debe ser positivo');
    }
    
    // Advertencias
    if (soil.h > 10) {
      warnings.push('Espesor de capa superior > 10m es inusual para aplicaciones típicas');
    }
    if (soil.rho1 > 10000 || soil.rho2 > 10000) {
      warnings.push('Resistividades > 10000 Ω·m son extremadamente altas');
    }
  } else {
    if (!soil.rho || soil.rho <= 0) {
      errors.push('Resistividad del suelo (rho) debe ser positiva');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};
