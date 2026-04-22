/**
 * Calcula la corriente de falla automáticamente según:
 * - Capacidad del transformador (kVA)
 * - Voltaje secundario (V)
 * - Impedancia del transformador (%Z)
 * - Tipo de transformador (Delta/Estrella)
 */

export const calculateFaultCurrent = (transformerKVA, secondaryVoltage, impedance, connectionType = 'DYn11', options = {}) => {
  // Validar parámetros para evitar división por cero
  if (!secondaryVoltage || secondaryVoltage <= 0) {
    secondaryVoltage = 480; // Valor por defecto
  }
  if (!impedance || impedance <= 0) {
    impedance = 5; // Valor por defecto
  }
  
  // 1. Corriente nominal del transformador
  const In = (transformerKVA * 1000) / (Math.sqrt(3) * secondaryVoltage);
  
  // 2. Corriente de cortocircuito simétrica
  const Icc = (In * 100) / impedance;
  
  // 3. Factor de asimetría (según tiempo de despeje)
  const asymmetryFactor = options.asymmetryFactor || (options.fastClearing ? 1.25 : 1.1);
  const IccAsym = Icc * asymmetryFactor;
  
  // 4. Factor de contribución de motores (típico 1.05-1.2)
  const motorContribution = options.motorContribution || 1.05;
  const totalFault = IccAsym * motorContribution;
  
  // 5. Factor de seguridad adicional
  const safetyFactor = options.safetyFactor || 1.0;
  const finalFault = totalFault * safetyFactor;
  
  return {
    nominalCurrent: In,
    symmetricalIcc: Icc,
    asymmetricalIcc: IccAsym,
    totalFaultCurrent: totalFault,
    recommendedValue: Math.ceil(finalFault / 100) * 100, // Redondear a centenas
    connectionType,
    parameters: {
      asymmetryFactor,
      motorContribution,
      safetyFactor
    }
  };
};

/**
 * Calcula la corriente de malla (Ig) considerando factor de división
 */
export const calculateIg = (faultCurrent, divisionFactor) => {
  return faultCurrent * divisionFactor;
};

/**
 * Valida los parámetros del transformador
 */
export const validateTransformerParams = (kVA, voltage, impedance) => {
  const errors = [];
  const warnings = [];
  
  // Validación de kVA
  if (!kVA || kVA < 15) {
    errors.push('Capacidad del transformador debe ser al menos 15 kVA');
  } else if (kVA > 5000) {
    warnings.push('Capacidad del transformador muy alta (>5000 kVA)');
  }
  
  // Validación de voltaje
  if (!voltage || voltage < 120) {
    errors.push('Voltaje secundario debe ser al menos 120 V');
  } else if (voltage > 34500) {
    warnings.push('Voltaje secundario muy alto (>34500 V)');
  }
  
  // Validación de impedancia
  if (!impedance || impedance < 2) {
    errors.push('Impedancia del transformador debe ser al menos 2%');
  } else if (impedance > 8) {
    warnings.push('Impedancia del transformador muy alta (>8%)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Calcula el factor de X/R para el transformador
 */
export const calculateXR = (impedance, kVA) => {
  // Aproximación típica: X/R varía entre 5-25 dependiendo del tamaño
  const baseXR = 5 + (kVA / 500) * 15;
  return Math.min(Math.max(baseXR, 5), 25);
};

/**
 * Calcula la corriente de falla según tipo de conexión
 */
export const calculateFaultByConnectionType = (kVA, voltage, impedance, connectionType) => {
  const baseResult = calculateFaultCurrent(kVA, voltage, impedance, connectionType);
  
  // Ajustes según tipo de conexión
  let multiplier = 1.0;
  
  switch (connectionType) {
    case 'DYn11': // Delta-Estrella con neutro aterrizado
      multiplier = 1.0;
      break;
    case 'Yyn0': // Estrella-Estrella
      multiplier = 0.87;
      break;
    case 'Dd0': // Delta-Delta
      multiplier = 0.95;
      break;
    case 'YNyn0': // Estrella-Estrella con neutro aterrizado
      multiplier = 1.0;
      break;
    default:
      multiplier = 1.0;
  }
  
  return {
    ...baseResult,
    totalFaultCurrent: baseResult.totalFaultCurrent * multiplier,
    recommendedValue: Math.ceil((baseResult.totalFaultCurrent * multiplier) / 100) * 100,
    connectionMultiplier: multiplier
  };
};

/**
 * Valores típicos según capacidad de transformador
 */
export const getTypicalFaultCurrent = (transformerKVA, secondaryVoltage = 480) => {
  // Valores típicos según experiencia
  const typicalValues = {
    75: { 220: 450, 440: 225, 480: 200 },
    112.5: { 220: 680, 440: 340, 480: 300 },
    150: { 220: 900, 440: 450, 480: 400 },
    225: { 220: 1350, 440: 680, 480: 600 },
    300: { 220: 1800, 440: 900, 480: 800 },
    500: { 220: 3000, 440: 1500, 480: 1350 },
    750: { 220: 4500, 440: 2250, 480: 2000 },
    1000: { 220: 6000, 440: 3000, 480: 2700 },
    1500: { 220: 9000, 440: 4500, 480: 4000 },
    2000: { 220: 12000, 440: 6000, 480: 5400 },
    2500: { 220: 15000, 440: 7500, 480: 6800 }
  };
  
  const byKVA = typicalValues[transformerKVA];
  if (byKVA && byKVA[secondaryVoltage]) {
    return byKVA[secondaryVoltage];
  }
  
  // Si no hay valor típico, calcular aproximado
  return Math.round((transformerKVA * 1000) / (Math.sqrt(3) * secondaryVoltage) * 5);
};

export default { calculateFaultCurrent, calculateIg, getTypicalFaultCurrent };
