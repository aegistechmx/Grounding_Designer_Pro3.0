/**
 * Corrección de resistividad integrada
 * Combina correcciones por temperatura, humedad y estacionalidad
 */

// Coeficiente de temperatura para suelos (α ≈ 0.025 por °C)
const TEMP_COEFFICIENT = 0.025;
const REFERENCE_TEMP = 20;

// Factores de humedad
const HUMIDITY_FACTORS = {
  seco: 1.5,
  normal: 1.0,
  humedo: 0.7
};

// Factores estacionales por región
const SEASONAL_FACTORS = {
  tropical: [1.0, 1.0, 1.0, 1.0, 1.1, 1.2, 1.2, 1.1, 1.0, 1.0, 1.0, 1.0],
  templado: [1.3, 1.4, 1.3, 1.2, 1.1, 1.0, 0.9, 0.9, 1.0, 1.1, 1.2, 1.3],
  frio: [1.8, 1.9, 1.7, 1.4, 1.1, 0.9, 0.8, 0.8, 0.9, 1.1, 1.4, 1.7],
  seco: [1.1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.5, 1.4, 1.3, 1.2, 1.1, 1.1]
};

export const REGION_NAMES = {
  tropical: '🌴 Tropical (Costas, Sureste)',
  templado: '🌿 Templado (Centro de México)',
  frio: '❄️ Frío (Norte, Montañas)',
  seco: '🏜️ Seco (Desierto)'
};

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Corrección por temperatura
 */
export const correctByTemperature = (resistivity, temperature, referenceTemp = REFERENCE_TEMP) => {
  if (!temperature || temperature === undefined) return resistivity;
  const deltaTemp = temperature - referenceTemp;
  const denominator = 1 + TEMP_COEFFICIENT * deltaTemp;
  let corrected = resistivity / denominator;
  corrected = Math.max(resistivity * 0.4, Math.min(resistivity * 2.0, corrected));
  return corrected;
};

/**
 * Corrección por humedad
 */
export const correctByHumidity = (resistivity, humidity) => {
  if (!humidity || humidity === 'normal') return resistivity;
  const factor = HUMIDITY_FACTORS[humidity] || 1.0;
  return resistivity * factor;
};

/**
 * Corrección estacional
 */
export const correctBySeason = (resistivity, month, region) => {
  if (!month || month < 1 || month > 12) return resistivity;
  const factors = SEASONAL_FACTORS[region] || SEASONAL_FACTORS.templado;
  const factor = factors[month - 1] || 1.0;
  return resistivity * factor;
};

/**
 * Aplica todas las correcciones a la resistividad medida
 */
export const applyAllCorrections = (measuredResistivity, params) => {
  const { temperature, humidity, measureMonth, region } = params;
  
  let corrected = measuredResistivity;
  const corrections = [];
  
  // 1. Corrección por temperatura
  if (temperature && temperature !== REFERENCE_TEMP) {
    const tempCorrected = correctByTemperature(measuredResistivity, temperature);
    corrections.push({
      type: '🌡️ Temperatura',
      original: measuredResistivity,
      corrected: tempCorrected,
      factor: measuredResistivity > 0 ? (tempCorrected / measuredResistivity).toFixed(2) : '1.00',
      detail: `${temperature}°C → ${REFERENCE_TEMP}°C`
    });
    corrected = tempCorrected;
  }
  
  // 2. Corrección por humedad
  if (humidity && humidity !== 'normal') {
    const humidityCorrected = correctByHumidity(corrected, humidity);
    corrections.push({
      type: '💧 Humedad',
      original: corrected,
      corrected: humidityCorrected,
      factor: corrected > 0 ? (humidityCorrected / corrected).toFixed(2) : '1.00',
      detail: humidity === 'seco' ? 'Suelo seco (+50%)' : 'Suelo húmedo (-30%)'
    });
    corrected = humidityCorrected;
  }
  
  // 3. Corrección estacional
  if (measureMonth && region) {
    const seasonalCorrected = correctBySeason(corrected, measureMonth, region);
    const factor = seasonalCorrected / corrected;
    if (Math.abs(factor - 1) > 0.05) {
      corrections.push({
        type: '📅 Estacional',
        original: corrected,
        corrected: seasonalCorrected,
        factor: factor.toFixed(2),
        detail: `${MONTH_NAMES[measureMonth - 1]} - ${REGION_NAMES[region]}` 
      });
      corrected = seasonalCorrected;
    }
  }
  
  return {
    measured: measuredResistivity,
    corrected: parseFloat(corrected.toFixed(1)),
    corrections,
    finalFactor: measuredResistivity > 0 ? (corrected / measuredResistivity).toFixed(2) : '1.00'
  };
};

/**
 * Obtiene recomendación estacional para el mes y región
 */
export const getSeasonalRecommendation = (month, region) => {
  const monthName = MONTH_NAMES[month - 1];
  const factor = SEASONAL_FACTORS[region]?.[month - 1] || 1.0;
  
  let recommendation = '';
  if (factor > 1.2) {
    recommendation = `⚠️ ${monthName} es un mes desfavorable para medición (factor ${factor}). La resistividad será más alta de lo normal.`;
  } else if (factor < 0.9) {
    recommendation = `⚠️ ${monthName} es un mes de lluvias (factor ${factor}). La resistividad será más baja de lo normal.`;
  } else {
    recommendation = `✅ ${monthName} es un buen mes para medir resistividad (factor ${factor}). Condiciones estables.`;
  }
  
  return { monthName, factor, recommendation };
};

/**
 * Genera valores de resistividad para diferentes condiciones
 */
export const getResistivityRange = (baseResistivity, region) => {
  const factors = SEASONAL_FACTORS[region] || SEASONAL_FACTORS.templado;
  const minFactor = factors.length > 0 ? Math.min(...factors) : 1;
  const maxFactor = factors.length > 0 ? Math.max(...factors) : 1;
  
  return {
    min: (baseResistivity * minFactor).toFixed(0),
    max: (baseResistivity * maxFactor).toFixed(0),
    average: baseResistivity,
    variation: ((maxFactor - minFactor) * 100).toFixed(0),
    recommendation: (maxFactor - minFactor) > 0.4 
      ? '⚠️ Alta variación estacional. Considerar diseño conservador.'
      : '✅ Baja variación estacional. Diseño confiable.'
  };
};

export default {
  correctByTemperature,
  correctByHumidity,
  correctBySeason,
  applyAllCorrections,
  getSeasonalRecommendation,
  getResistivityRange,
  MONTH_NAMES,
  REGION_NAMES
};
