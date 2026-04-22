/**
 * Corrección de resistividad por temperatura y estacionalidad
 * Basado en IEEE 80 sección 13.4
 * 
 * La resistividad del suelo varía con:
 * - Temperatura: disminuye al aumentar temperatura
 * - Humedad: disminuye al aumentar humedad
 * - Estación: más seca en verano, más húmeda en invierno
 */

/**
 * Corrección por temperatura
 * @param {number} resistivity - Resistividad base (Ω·m)
 * @param {number} temperature - Temperatura actual (°C)
 * @param {number} referenceTemp - Temperatura de referencia (°C), default 20°C
 * @returns {number} Resistividad corregida por temperatura
 */
export const temperatureCorrection = (resistivity, temperature, referenceTemp = 20) => {
  // Validar entradas
  if (!resistivity || resistivity <= 0) return 100;
  if (temperature === undefined || temperature === null) return resistivity;
  
  // Coeficiente de temperatura para suelos típicos (α ≈ 0.025 por °C)
  const alpha = 0.025;
  
  // Fórmula: ρ_T = ρ_20 / (1 + α × (T - 20))
  const deltaTemp = temperature - referenceTemp;
  const denominator = 1 + alpha * deltaTemp;
  
  let corrected = resistivity / denominator;
  
  // Limitar a rangos razonables (no menos del 40% ni más del 200% del valor original)
  corrected = Math.max(resistivity * 0.4, Math.min(resistivity * 2.0, corrected));
  
  return corrected;
};

/**
 * Corrección por humedad
 * @param {number} resistivity - Resistividad base (Ω·m)
 * @param {string} humidity - Nivel de humedad: 'seco', 'normal', 'humedo'
 * @returns {number} Resistividad corregida por humedad
 */
export const humidityCorrection = (resistivity, humidity = 'normal') => {
  const factors = {
    seco: 1.5,      // Suelo seco: resistividad aumenta 50%
    normal: 1.0,    // Suelo normal: sin cambio
    humedo: 0.7     // Suelo húmedo: resistividad disminuye 30%
  };
  
  const factor = factors[humidity] || 1.0;
  return resistivity * factor;
};

/**
 * Factor estacional por mes y región
 * @param {number} month - Mes del año (1-12)
 * @param {string} region - Región: 'tropical', 'templado', 'frio', 'seco', 'mediterraneo'
 * @returns {number} Factor de corrección estacional
 */
export const getSeasonalCorrection = (month, region = 'templado') => {
  // Validar mes
  if (!month || month < 1 || month > 12) return 1.0;
  
  // Factores estacionales por región
  const seasonalFactors = {
    // Regiones cálidas y húmedas
    tropical: [1.0, 1.0, 1.0, 1.0, 1.1, 1.2, 1.2, 1.1, 1.0, 1.0, 1.0, 1.0],
    // Regiones con estaciones definidas (México central)
    templado: [1.3, 1.4, 1.3, 1.2, 1.1, 1.0, 0.9, 0.9, 1.0, 1.1, 1.2, 1.3],
    // Regiones frías (norte)
    frio: [1.8, 1.9, 1.7, 1.4, 1.1, 0.9, 0.8, 0.8, 0.9, 1.1, 1.4, 1.7],
    // Regiones áridas (norte de México)
    seco: [1.1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.5, 1.4, 1.3, 1.2, 1.1, 1.1],
    // Región mediterránea (Baja California)
    mediterraneo: [1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2]
  };
  
  const factors = seasonalFactors[region] || seasonalFactors.templado;
  return factors[month - 1];
};

/**
 * Obtener nombre del mes
 * @param {number} month - Mes (1-12)
 * @returns {string} Nombre del mes
 */
export const getMonthName = (month) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[month - 1] || 'Desconocido';
};

/**
 * Obtener recomendación de temporada para medición
 * @param {number} month - Mes actual
 * @param {string} region - Región
 * @returns {object} Recomendación
 */
export const getSeasonRecommendation = (month, region = 'templado') => {
  const factor = getSeasonalCorrection(month, region);
  const monthName = getMonthName(month);
  
  let recommendation = '';
  let bestMonths = [];
  
  if (region === 'tropical') {
    bestMonths = ['Enero', 'Febrero', 'Marzo', 'Noviembre', 'Diciembre'];
    recommendation = 'Época de secas, condiciones estables para medición';
  } else if (region === 'templado') {
    bestMonths = ['Abril', 'Mayo', 'Junio'];
    recommendation = 'Primavera, condiciones óptimas para medición';
  } else if (region === 'frio') {
    bestMonths = ['Julio', 'Agosto', 'Septiembre'];
    recommendation = 'Verano, evitar mediciones en invierno por congelamiento';
  } else {
    bestMonths = ['Marzo', 'Abril', 'Mayo', 'Octubre', 'Noviembre'];
    recommendation = 'Evitar temporada de lluvias para mediciones base';
  }
  
  const isBestMonth = bestMonths.includes(monthName);
  
  return {
    currentMonth: monthName,
    correctionFactor: factor,
    isBestMonth,
    recommendation: isBestMonth 
      ? `✅ ${monthName} es un buen mes para medir resistividad en región ${region}`
      : `⚠️ ${monthName} no es el mes óptimo. ${recommendation}`,
    bestMonths
  };
};

/**
 * Aplicar todas las correcciones (temperatura + estacional)
 * @param {number} baseResistivity - Resistividad base medida (Ω·m)
 * @param {number} temperature - Temperatura durante la medición (°C)
 * @param {number} month - Mes de la medición (1-12)
 * @param {string} region - Región geográfica
 * @param {string} humidity - Nivel de humedad ('seco', 'normal', 'humedo')
 * @returns {object} Resultados con todas las correcciones
 */
export const applyCorrections = (baseResistivity, temperature, month, region, humidity = 'normal') => {
  if (!baseResistivity || baseResistivity <= 0) {
    return {
      original: 100,
      tempCorrected: 100,
      seasonalCorrected: 100,
      humidityCorrected: 100,
      final: 100,
      corrections: {}
    };
  }
  
  // Aplicar correcciones en orden
  const tempCorrected = temperatureCorrection(baseResistivity, temperature);
  const seasonalFactor = getSeasonalCorrection(month, region);
  const seasonalCorrected = baseResistivity * seasonalFactor;
  const humidityCorrected = humidityCorrection(baseResistivity, humidity);
  
  // Corrección combinada (producto de factores)
  const combinedFactor = seasonalFactor * (humidity === 'seco' ? 1.5 : humidity === 'humedo' ? 0.7 : 1.0);
  const final = baseResistivity * combinedFactor;
  
  // También corregir por temperatura si se aplica
  const finalWithTemp = temperatureCorrection(final, temperature);
  
  return {
    original: baseResistivity,
    tempCorrected: isFinite(tempCorrected) ? parseFloat(tempCorrected.toFixed(1)) : 'N/A',
    seasonalCorrected: isFinite(seasonalCorrected) ? parseFloat(seasonalCorrected.toFixed(1)) : 'N/A',
    humidityCorrected: isFinite(humidityCorrected) ? parseFloat(humidityCorrected.toFixed(1)) : 'N/A',
    final: isFinite(finalWithTemp) ? parseFloat(finalWithTemp.toFixed(1)) : 'N/A',
    corrections: {
      temperature: {
        applied: temperature !== undefined,
        value: temperature,
        factor: baseResistivity > 0 && isFinite(tempCorrected / baseResistivity) ? (tempCorrected / baseResistivity).toFixed(2) : '1.00'
      },
      seasonal: {
        applied: true,
        month: getMonthName(month),
        factor: isFinite(seasonalFactor) ? seasonalFactor.toFixed(2) : 'N/A'
      },
      humidity: {
        applied: humidity !== 'normal',
        level: humidity,
        factor: baseResistivity > 0 && isFinite(humidityCorrected / baseResistivity) ? (humidityCorrected / baseResistivity).toFixed(2) : '1.00'
      }
    }
  };
};

/**
 * Determinar región según ubicación en México
 * @param {string} state - Estado de México
 * @returns {string} Región
 */
export const getRegionByState = (state) => {
  const regions = {
    tropical: ['Campeche', 'Chiapas', 'Quintana Roo', 'Tabasco', 'Veracruz', 'Yucatán'],
    templado: ['Aguascalientes', 'CDMX', 'Estado de México', 'Guanajuato', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Puebla', 'Querétaro', 'Tlaxcala'],
    frio: ['Chihuahua', 'Durango', 'Tlaxcala', 'Zacatecas'],
    seco: ['Baja California', 'Baja California Sur', 'Coahuila', 'Nuevo León', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tamaulipas']
  };
  
  for (const [region, states] of Object.entries(regions)) {
    if (states.includes(state)) return region;
  }
  return 'templado'; // Default
};

export default {
  temperatureCorrection,
  humidityCorrection,
  getSeasonalCorrection,
  getMonthName,
  getSeasonRecommendation,
  applyCorrections,
  getRegionByState
};