/**
 * Variaciones estacionales de resistividad
 * Basado en IEEE 80 y estudios de campo
 * 
 * La resistividad del suelo varía significativamente con:
 * - Humedad: hasta 70% de reducción en temporada de lluvias
 * - Temperatura: hasta 50% de aumento en temporada de secas
 * - Profundidad: menor variación a mayor profundidad
 */

// Factores estacionales por región y mes (valores más realistas)
const SEASONAL_FACTORS_BY_REGION = {
  tropical: {
    dry: 1.3,      // Época seca (invierno/primavera)
    wet: 0.6,      // Época lluviosa (verano/otoño)
    variation: 0.7,
    months: { dry: [1, 2, 3, 4], wet: [5, 6, 7, 8, 9, 10, 11, 12] }
  },
  templado: {
    dry: 1.4,
    wet: 0.65,
    variation: 0.75,
    months: { dry: [1, 2, 3, 11, 12], wet: [4, 5, 6, 7, 8, 9, 10] }
  },
  frio: {
    dry: 1.6,
    wet: 0.7,
    variation: 0.9,
    months: { dry: [1, 2, 3, 10, 11, 12], wet: [4, 5, 6, 7, 8, 9] }
  },
  seco: {
    dry: 1.5,
    wet: 0.75,
    variation: 0.75,
    months: { dry: [1, 2, 3, 4, 5, 10, 11, 12], wet: [6, 7, 8, 9] }
  }
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Calcula la variación estacional de resistividad
 * @param {number} baseResistivity - Resistividad base (Ω·m)
 * @param {number} depth - Profundidad de la malla (m)
 * @param {string} region - Región geográfica ('tropical', 'templado', 'frio', 'seco')
 * @returns {object} Variación calculada
 */
export const seasonalVariation = (baseResistivity, depth = 0.6, region = 'templado') => {
  // Validar entradas
  if (!baseResistivity || baseResistivity <= 0) {
    return {
      maxIncrease: 0,
      maxDecrease: 0,
      variationPercent: 0,
      recommendation: '⚠️ No hay datos de resistividad',
      error: true
    };
  }
  
  // Obtener factores según región
  const factors = SEASONAL_FACTORS_BY_REGION[region] || SEASONAL_FACTORS_BY_REGION.templado;
  
  // Factor de profundidad: a mayor profundidad, menor variación
  // Fórmula más realista: factor = 1 - 0.15 × ln(depth + 1)
  const depthFactor = Math.max(0.3, 1 - 0.25 * Math.log(depth + 1));
  
  // Variación máxima según región y profundidad
  const maxVariation = factors.variation * depthFactor;
  
  // Resistividades extremas
  const dryResistivity = baseResistivity * (1 + (factors.dry - 1) * depthFactor);
  const wetResistivity = baseResistivity * (1 - (1 - factors.wet) * depthFactor);
  
  return {
    dryResistivity: dryResistivity.toFixed(0),
    wetResistivity: wetResistivity.toFixed(0),
    averageResistivity: baseResistivity,
    variationPercent: baseResistivity > 0 ? ((dryResistivity - wetResistivity) / baseResistivity * 100).toFixed(1) : '0',
    depthFactor: depthFactor.toFixed(2),
    region,
    recommendation: wetResistivity > 0 ? (dryResistivity / wetResistivity) > 2.5 
      ? '⚠️ Alta variación estacional. Considerar diseño conservador usando valor de temporada seca.'
      : (dryResistivity / wetResistivity) > 1.8
      ? '⚠️ Variación estacional significativa. Usar resistividad corregida por temporada.'
      : '✅ Baja variación estacional. Diseño confiable con valor promedio.' : '⚠️ Error: resistividad base inválida',
    safetyMargin: wetResistivity > 0 ? (dryResistivity / wetResistivity).toFixed(1) : '1.0'
  };
};

/**
 * Obtiene resistividad en temporada seca (máximo)
 * @param {number} baseResistivity - Resistividad base (Ω·m)
 * @param {number} depth - Profundidad (m)
 * @param {string} region - Región
 * @returns {number} Resistividad en temporada seca
 */
export const getDrySeasonResistivity = (baseResistivity, depth = 0.6, region = 'templado') => {
  const result = seasonalVariation(baseResistivity, depth, region);
  return parseFloat(result.dryResistivity);
};

/**
 * Obtiene resistividad en temporada lluviosa (mínimo)
 * @param {number} baseResistivity - Resistividad base (Ω·m)
 * @param {number} depth - Profundidad (m)
 * @param {string} region - Región
 * @returns {number} Resistividad en temporada lluviosa
 */
export const getWetSeasonResistivity = (baseResistivity, depth = 0.6, region = 'templado') => {
  const result = seasonalVariation(baseResistivity, depth, region);
  return parseFloat(result.wetResistivity);
};

/**
 * Obtiene factor estacional para un mes específico
 * @param {number} month - Mes (1-12)
 * @param {string} region - Región
 * @returns {number} Factor estacional
 */
export const getMonthlyFactor = (month, region = 'templado') => {
  const factors = SEASONAL_FACTORS_BY_REGION[region] || SEASONAL_FACTORS_BY_REGION.templado;
  const isDrySeason = factors.months.dry.includes(month);
  return isDrySeason ? factors.dry : factors.wet;
};

/**
 * Obtiene resistividad corregida por mes
 * @param {number} baseResistivity - Resistividad base (Ω·m)
 * @param {number} month - Mes (1-12)
 * @param {string} region - Región
 * @param {number} depth - Profundidad (m)
 * @returns {object} Resistividad corregida
 */
export const getResistivityByMonth = (baseResistivity, month, region = 'templado', depth = 0.6) => {
  const monthlyFactor = getMonthlyFactor(month, region);
  const depthFactor = Math.max(0.3, 1 - 0.25 * Math.log(depth + 1));
  const effectiveFactor = 1 + (monthlyFactor - 1) * depthFactor;
  const correctedResistivity = baseResistivity * effectiveFactor;
  
  const isDrySeason = SEASONAL_FACTORS_BY_REGION[region]?.months.dry.includes(month);
  
  return {
    month: MONTH_NAMES[month - 1],
    region,
    baseResistivity,
    correctedResistivity: correctedResistivity.toFixed(0),
    factor: effectiveFactor.toFixed(2),
    season: isDrySeason ? 'Seca' : 'Lluviosa',
    recommendation: isDrySeason 
      ? '⚠️ Temporada seca - resistividad elevada. Usar este valor para diseño conservador.'
      : '✅ Temporada lluviosa - resistividad reducida. Verificar condiciones en secas.'
  };
};

/**
 * Genera tabla de variación estacional por mes
 * @param {number} baseResistivity - Resistividad base (Ω·m)
 * @param {string} region - Región
 * @param {number} depth - Profundidad (m)
 * @returns {Array} Tabla de variación mensual
 */
export const getSeasonalTable = (baseResistivity, region = 'templado', depth = 0.6) => {
  const table = [];
  
  for (let month = 1; month <= 12; month++) {
    const result = getResistivityByMonth(baseResistivity, month, region, depth);
    table.push(result);
  }
  
  return table;
};

/**
 * Obtiene recomendación de temporada para medición
 * @param {string} region - Región
 * @returns {object} Recomendación
 */
export const getMeasurementRecommendation = (region = 'templado') => {
  const factors = SEASONAL_FACTORS_BY_REGION[region] || SEASONAL_FACTORS_BY_REGION.templado;
  
  const bestMonths = factors.months.dry.map(m => MONTH_NAMES[m - 1]);
  const worstMonths = factors.months.wet.map(m => MONTH_NAMES[m - 1]);
  
  return {
    region,
    bestMonths: bestMonths.join(', '),
    worstMonths: worstMonths.join(', '),
    recommendation: `✅ Medir resistividad en temporada seca (${bestMonths.join(', ')}) para obtener valores conservadores.`,
    note: 'El diseño debe considerar la resistividad en condición más desfavorable (temporada seca).'
  };
};

/**
 * Calcula resistividad de diseño (valor conservador)
 * @param {number} measuredResistivity - Resistividad medida (Ω·m)
 * @param {number} month - Mes de medición
 * @param {string} region - Región
 * @param {number} depth - Profundidad (m)
 * @returns {object} Resistividad de diseño
 */
export const getDesignResistivity = (measuredResistivity, month, region = 'templado', depth = 0.6) => {
  const current = getResistivityByMonth(measuredResistivity, month, region, depth);
  const drySeason = getDrySeasonResistivity(measuredResistivity, depth, region);
  
  // Si se midió en temporada lluviosa, aplicar factor de seguridad
  let designResistivity = measuredResistivity;
  let safetyFactor = 1.0;
  let message = '';
  
  if (current.season === 'Lluviosa') {
    safetyFactor = drySeason / measuredResistivity;
    designResistivity = drySeason;
    message = `⚠️ Medición realizada en temporada lluviosa. Se aplica factor de seguridad de ${safetyFactor.toFixed(2)}x para diseño.`;
  } else {
    message = `✅ Medición realizada en temporada seca. Valor adecuado para diseño.`;
  }
  
  return {
    measuredResistivity,
    measurementMonth: current.month,
    measurementSeason: current.season,
    designResistivity: parseFloat(designResistivity.toFixed(0)),
    safetyFactor: parseFloat(safetyFactor.toFixed(2)),
    message,
    recommendation: `Usar ρ = ${designResistivity.toFixed(0)} Ω·m para el diseño de la malla.`
  };
};

export default {
  seasonalVariation,
  getDrySeasonResistivity,
  getWetSeasonResistivity,
  getMonthlyFactor,
  getResistivityByMonth,
  getSeasonalTable,
  getMeasurementRecommendation,
  getDesignResistivity,
  SEASONAL_FACTORS_BY_REGION,
  MONTH_NAMES
};