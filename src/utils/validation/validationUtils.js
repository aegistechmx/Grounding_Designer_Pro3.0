/**
 * Utilidades de validación para funciones matemáticas y datos de entrada
 */

/**
 * Valida que un valor sea un número válido y esté dentro de un rango
 * @param {any} value - Valor a validar
 * @param {number} min - Valor mínimo permitido
 * @param {number} max - Valor máximo permitido
 * @param {string} paramName - Nombre del parámetro para mensajes de error
 * @returns {Object} Objeto con isValid, value y error
 */
export const validateNumber = (value, min = -Infinity, max = Infinity, paramName = 'valor') => {
  // Verificar que sea un número
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return {
      isValid: false,
      value: min > 0 ? min : 0,
      error: `${paramName} debe ser un número válido`
    };
  }

  // Verificar rango
  if (value < min || value > max) {
    const clampedValue = Math.max(min, Math.min(max, value));
    return {
      isValid: false,
      value: clampedValue,
      error: `${paramName} (${value}) debe estar entre ${min} y ${max}. Ajustado a ${clampedValue}`
    };
  }

  return {
    isValid: true,
    value: value,
    error: null
  };
};

/**
 * Valida parámetros para cálculos de malla de tierra
 * @param {Object} params - Objeto con parámetros a validar
 * @returns {Object} Objeto con isValid, validatedParams y errors
 */
export const validateGroundingParams = (params) => {
  if (!params || typeof params !== 'object') {
    return {
      isValid: false,
      validatedParams: {},
      errors: ['Parámetros deben ser un objeto válido']
    };
  }

  const errors = [];
  const validatedParams = {};

  // Validaciones de parámetros críticos
  const criticalParams = {
    transformerKVA: { min: 1, max: 10000, required: true },
    primaryVoltage: { min: 120, max: 50000, required: true },
    secondaryVoltage: { min: 100, max: 1000, required: true },
    transformerImpedance: { min: 1, max: 15, required: true },
    faultDuration: { min: 0.1, max: 10, required: true },
    soilResistivity: { min: 1, max: 10000, required: true },
    surfaceLayer: { min: 100, max: 50000, required: false },
    surfaceDepth: { min: 0.01, max: 2, required: false },
    gridLength: { min: 1, max: 100, required: true },
    gridWidth: { min: 1, max: 100, required: true },
    gridDepth: { min: 0.1, max: 5, required: true },
    numParallel: { min: 2, max: 20, required: true },
    rodLength: { min: 0.5, max: 10, required: true },
    numRods: { min: 0, max: 100, required: true },
    currentDivisionFactor: { min: 0.1, max: 0.8, required: true },
    conductorDiameter: { min: 0.001, max: 0.1, required: true }
  };

  // Validar cada parámetro
  for (const [key, config] of Object.entries(criticalParams)) {
    const value = params[key];
    
    if (config.required && (value === undefined || value === null)) {
      errors.push(`${key} es requerido`);
      validatedParams[key] = config.min;
      continue;
    }

    if (value !== undefined && value !== null) {
      const validation = validateNumber(value, config.min, config.max, key);
      validatedParams[key] = validation.value;
      
      if (!validation.isValid) {
        errors.push(validation.error);
      }
    } else if (config.required) {
      validatedParams[key] = config.min;
      errors.push(`${key} es requerido, usando valor por defecto ${config.min}`);
    }
  }

  // Validaciones adicionales
  if (validatedParams.gridLength <= 0 || validatedParams.gridWidth <= 0) {
    errors.push('Las dimensiones de la malla deben ser mayores que cero');
  }

  if (validatedParams.numParallel < 2) {
    validatedParams.numParallel = 2;
    errors.push('Número de conductores paralelos mínimo es 2');
  }

  return {
    isValid: errors.length === 0,
    validatedParams,
    errors
  };
};

/**
 * Valida parámetros para verificación térmica de conductor
 * @param {number} faultCurrent - Corriente de falla
 * @param {number} faultDuration - Duración de falla
 * @param {number} currentArea - Área del conductor
 * @param {string} material - Material del conductor
 * @returns {Object} Objeto con isValid, validatedParams y errors
 */
export const validateThermalCheckParams = (faultCurrent, faultDuration, currentArea, material) => {
  const errors = [];
  const validatedParams = {};

  // Validar corriente de falla
  const currentValidation = validateNumber(faultCurrent, 0, 100000, 'corriente de falla');
  validatedParams.faultCurrent = currentValidation.value;
  if (!currentValidation.isValid) {
    errors.push(currentValidation.error);
  }

  // Validar duración de falla
  const durationValidation = validateNumber(faultDuration, 0.1, 10, 'duración de falla');
  validatedParams.faultDuration = durationValidation.value;
  if (!durationValidation.isValid) {
    errors.push(durationValidation.error);
  }

  // Validar área del conductor
  const areaValidation = validateNumber(currentArea, 0.1, 10000, 'área del conductor');
  validatedParams.currentArea = areaValidation.value;
  if (!areaValidation.isValid) {
    errors.push(areaValidation.error);
  }

  // Validar material
  const validMaterials = ['COPPER_SOFT', 'COPPER_HARD', 'ALUMINUM'];
  if (!validMaterials.includes(material)) {
    validatedParams.material = 'COPPER_SOFT';
    errors.push(`Material ${material} no válido, usando COPPER_SOFT`);
  } else {
    validatedParams.material = material;
  }

  return {
    isValid: errors.length === 0,
    validatedParams,
    errors
  };
};

/**
 * Valida que un objeto de cálculos tenga los campos necesarios
 * @param {Object} calculations - Objeto de cálculos
 * @returns {boolean} True si es válido
 */
export const validateCalculations = (calculations) => {
  if (!calculations || typeof calculations !== 'object') {
    return false;
  }

  const requiredFields = [
    'Rg', 'Em', 'Es', 'GPR', 'gridArea', 'totalLength',
    'Km', 'Ks', 'Ki', 'Cs', 'Etouch70', 'Estep70'
  ];

  for (const field of requiredFields) {
    if (!(field in calculations) || calculations[field] === null || calculations[field] === undefined) {
      return false;
    }
  }

  return true;
};

/**
 * Función segura para calcular raíz cuadrada con validación
 * @param {number} value - Valor a calcular
 * @param {number} defaultValue - Valor por defecto si es inválido
 * @returns {number} Resultado de la raíz cuadrada o defaultValue
 */
export const safeSqrt = (value, defaultValue = 0) => {
  const validation = validateNumber(value, 0, Infinity, 'valor para raíz cuadrada');
  if (!validation.isValid) {
    return defaultValue;
  }
  return Math.sqrt(validation.value);
};

/**
 * Función segura para Math.max con validación
 * @param {...number} values - Valores a comparar
 * @returns {number} Valor máximo válido
 */
export const safeMax = (...values) => {
  const validValues = values.filter(v => 
    typeof v === 'number' && 
    !isNaN(v) && 
    isFinite(v)
  );
  
  if (validValues.length === 0) {
    return 0;
  }
  
  return validValues.length > 0 ? Math.max(...validValues) : 0;
};

/**
 * Función segura para Math.min con validación
 * @param {...number} values - Valores a comparar
 * @returns {number} Valor mínimo válido
 */
export const safeMin = (...values) => {
  const validValues = values.filter(v => 
    typeof v === 'number' && 
    !isNaN(v) && 
    isFinite(v)
  );
  
  if (validValues.length === 0) {
    return 0;
  }
  
  return Math.min(...validValues);
};

/**
 * Valida y corrige espaciamiento de malla
 * @param {number} gridLength - Longitud de malla
 * @param {number} gridWidth - Ancho de malla
 * @param {number} numParallel - Número de conductores paralelos
 * @param {number} numParallelY - Número de conductores perpendiculares
 * @returns {Object} Espaciamientos corregidos
 */
export const validateAndCorrectSpacing = (gridLength, gridWidth, numParallel, numParallelY) => {
  const spacingX = numParallel > 1 ? gridWidth / (numParallel - 1) : gridWidth;
  const spacingY = numParallelY > 1 ? gridLength / (numParallelY - 1) : gridLength;
  
  // Validar espaciamientos mínimos y máximos
  const minSpacing = 0.5; // 0.5m mínimo
  const maxSpacing = 10;   // 10m máximo
  
  const correctedSpacingX = Math.max(minSpacing, Math.min(maxSpacing, spacingX));
  const correctedSpacingY = Math.max(minSpacing, Math.min(maxSpacing, spacingY));
  
  return {
    spacingX: correctedSpacingX,
    spacingY: correctedSpacingY,
    corrected: correctedSpacingX !== spacingX || correctedSpacingY !== spacingY
  };
};
