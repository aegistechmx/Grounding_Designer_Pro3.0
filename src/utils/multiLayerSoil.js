/**
 * Modelo de suelo multicapa para cálculos más precisos
 * Basado en método de imágenes de IEEE 80 y Sunde
 * 
 * Suelos reales tienen estratificación: capa superficial, capas intermedias, capa profunda
 */

/**
 * Calcula resistividad equivalente ponderada por profundidad
 * @param {Array} layers - Capas del suelo [{ resistivity, thickness }]
 * @returns {number} Resistividad equivalente
 */
export const calculateEquivalentResistivity = (layers) => {
  // Validar entrada
  if (!layers || layers.length === 0) return 100;
  if (layers.length === 1) return layers[0].resistivity;
  
  // Método de resistividad equivalente ponderada por profundidad
  let totalWeight = 0;
  let weightedSum = 0;
  let currentDepth = 0;
  
  for (const layer of layers) {
    const thickness = layer.thickness || 2;
    // Peso exponencial: capas más profundas tienen menor influencia
    const weight = Math.exp(-currentDepth / 3);
    weightedSum += layer.resistivity * weight;
    totalWeight += weight;
    currentDepth += thickness;
  }
  
  const equivalent = weightedSum / totalWeight;
  return parseFloat(equivalent.toFixed(1));
};

/**
 * Calcula factor de reflexión entre dos capas
 * @param {number} ρ1 - Resistividad capa superior (Ω·m)
 * @param {number} ρ2 - Resistividad capa inferior (Ω·m)
 * @returns {number} Factor de reflexión (entre -1 y 1)
 */
export const calculateReflectionFactor = (ρ1, ρ2) => {
  if (ρ1 <= 0 || ρ2 <= 0) return 0;
  const k = (ρ2 - ρ1) / (ρ2 + ρ1);
  // Limitar a rango válido
  return Math.max(-0.99, Math.min(0.99, k));
};

/**
 * Calcula resistividad aparente para modelo de dos capas
 * @param {number} ρ1 - Resistividad capa superior (Ω·m)
 * @param {number} ρ2 - Resistividad capa inferior (Ω·m)
 * @param {number} h - Espesor de la primera capa (m)
 * @param {number} depth - Profundidad de investigación (m)
 * @returns {number} Resistividad aparente
 */
export const calculateTwoLayerSoil = (ρ1, ρ2, h, depth) => {
  if (!ρ1 || ρ1 <= 0) return 100;
  if (depth <= 0) return ρ1;
  
  const k = calculateReflectionFactor(ρ1, ρ2);
  let sum = 0;
  
  // Sumar términos de la serie (hasta 20 para mejor precisión)
  for (let n = 1; n <= 20; n++) {
    const term = Math.pow(k, n) / Math.sqrt(1 + Math.pow(2 * n * h / depth, 2));
    sum += term;
  }
  
  let resistivity = ρ1 * (1 + 4 * sum);
  // Limitar a rangos razonables
  resistivity = Math.max(Math.min(ρ1, ρ2) * 0.5, Math.min(resistivity, Math.max(ρ1, ρ2) * 2));
  
  return parseFloat(resistivity.toFixed(1));
};

/**
 * Calcula resistividad para modelo de tres capas
 * @param {Object} layers - Capas { ρ1, ρ2, ρ3, h1, h2 }
 * @param {number} depth - Profundidad de investigación (m)
 * @returns {number} Resistividad aparente
 */
export const calculateThreeLayerSoil = (layers, depth) => {
  const { ρ1, ρ2, ρ3, h1, h2 } = layers;
  
  if (!ρ1 || ρ1 <= 0) return 100;
  if (depth <= h1) return ρ1;
  if (depth <= h1 + h2) {
    // En segunda capa
    return calculateTwoLayerSoil(ρ1, ρ2, h1, depth);
  }
  
  // Método aproximado para tres capas
  const k12 = calculateReflectionFactor(ρ1, ρ2);
  const k23 = calculateReflectionFactor(ρ2, ρ3);
  
  let sum = 0;
  for (let n = 1; n <= 15; n++) {
    const term1 = Math.pow(k12, n) / Math.sqrt(1 + Math.pow(2 * n * h1 / depth, 2));
    const term2 = Math.pow(k23, n) / Math.sqrt(1 + Math.pow(2 * n * (h1 + h2) / depth, 2));
    sum += term1 + term2;
  }
  
  let resistivity = ρ1 * (1 + 4 * sum);
  resistivity = Math.max(Math.min(ρ1, ρ2, ρ3) * 0.3, Math.min(resistivity, Math.max(ρ1, ρ2, ρ3) * 3));
  
  return parseFloat(resistivity.toFixed(1));
};

/**
 * Recomienda número de capas basado en mediciones de Wenner
 * @param {Array} measurements - Mediciones [{ spacing, resistivity }]
 * @returns {Object} Recomendación de capas
 */
export const recommendLayersFromMeasurements = (measurements) => {
  if (!measurements || measurements.length < 2) {
    return { layers: 1, message: 'Datos insuficientes, usar modelo homogéneo', confidence: 0 };
  }
  
  // Calcular variaciones entre mediciones
  const variations = [];
  for (let i = 1; i < measurements.length; i++) {
    const variation = Math.abs(measurements[i].resistivity - measurements[i-1].resistivity) / measurements[i-1].resistivity;
    variations.push(variation);
  }
  
  const avgVariation = variations.length > 0 ? variations.reduce((a, b) => a + b, 0) / variations.length : 0;
  const maxVariation = variations.length > 0 ? Math.max(...variations) : 0;
  
  // Detectar tendencia (aumento o disminución)
  let trend = 'estable';
  let increases = 0;
  let decreases = 0;
  
  for (let i = 1; i < measurements.length; i++) {
    if (measurements[i].resistivity > measurements[i-1].resistivity) increases++;
    else decreases++;
  }
  
  if (increases > decreases) trend = 'aumento';
  else if (decreases > increases) trend = 'disminucion';
  
  let layers = 1;
  let message = '';
  let confidence = 0;
  let interpretation = '';
  
  if (avgVariation < 0.15) {
    layers = 1;
    message = 'Suelo homogéneo, usar resistividad promedio';
    interpretation = 'La resistividad es constante con la profundidad';
    confidence = 0.85;
  } else if (avgVariation < 0.35) {
    layers = 2;
    message = 'Suelo de dos capas, usar modelo bicapa';
    interpretation = trend === 'aumento' 
      ? 'Capa superficial más conductiva que la profunda' 
      : 'Capa superficial más resistiva que la profunda';
    confidence = 0.75;
  } else {
    layers = 3;
    message = 'Suelo multicapa (3+ capas), usar modelo detallado';
    interpretation = 'Existen múltiples estratos con diferentes resistividades';
    confidence = 0.65;
  }
  
  // Recomendar espaciamientos para mejor caracterización
  let recommendation = '';
  if (layers >= 2 && measurements.length < 4) {
    recommendation = 'Se recomiendan mediciones adicionales con separaciones a=1,2,4,8,16m';
  }
  
  return {
    layers,
    message,
    interpretation,
    confidence: (confidence * 100).toFixed(0),
    avgVariation: (avgVariation * 100).toFixed(1),
    maxVariation: (maxVariation * 100).toFixed(1),
    trend,
    recommendation,
    suggestedSpacings: layers === 1 ? [1, 2, 4] : layers === 2 ? [1, 2, 4, 8] : [1, 2, 4, 8, 16]
  };
};

/**
 * Calcula resistividades aparentes para diferentes espaciamientos
 * @param {Object} model - Modelo de suelo { type, params }
 * @param {Array} spacings - Espaciamientos a probar (m)
 * @returns {Array} Resistividades calculadas
 */
export const calculateApparentResistivities = (model, spacings = [1, 2, 4, 8, 16]) => {
  const results = [];
  
  for (const a of spacings) {
    let resistivity;
    
    if (model.type === 'homogeneous') {
      resistivity = model.ρ;
    } else if (model.type === 'two-layer') {
      resistivity = calculateTwoLayerSoil(model.ρ1, model.ρ2, model.h, a);
    } else if (model.type === 'three-layer') {
      resistivity = calculateThreeLayerSoil(model, a);
    } else {
      resistivity = 100;
    }
    
    results.push({ spacing: a, resistivity: parseFloat(resistivity.toFixed(1)) });
  }
  
  return results;
};

/**
 * Interpola resistividad para una profundidad específica
 * @param {Array} measurements - Mediciones de Wenner
 * @param {number} depth - Profundidad deseada (m)
 * @returns {number} Resistividad interpolada
 */
export const interpolateResistivity = (measurements, depth) => {
  if (!measurements || measurements.length === 0) return 100;
  if (depth <= measurements[0].spacing) return measurements[0].resistivity;
  if (depth >= measurements[measurements.length - 1].spacing) {
    return measurements[measurements.length - 1].resistivity;
  }
  
  // Buscar intervalo
  for (let i = 1; i < measurements.length; i++) {
    if (depth <= measurements[i].spacing) {
      const t = (depth - measurements[i-1].spacing) / (measurements[i].spacing - measurements[i-1].spacing);
      const resistivity = measurements[i-1].resistivity + t * (measurements[i].resistivity - measurements[i-1].resistivity);
      return parseFloat(resistivity.toFixed(1));
    }
  }
  
  return 100;
};

/**
 * Genera modelo de suelo optimizado basado en mediciones
 * @param {Array} measurements - Mediciones de Wenner
 * @returns {Object} Modelo optimizado
 */
export const optimizeSoilModel = (measurements) => {
  const layers = recommendLayersFromMeasurements(measurements);
  
  let model = {
    type: 'homogeneous',
    ρ: 100,
    description: ''
  };
  
  if (layers.layers === 1) {
    const avgResistivity = measurements.length > 0 ? measurements.reduce((sum, m) => sum + m.resistivity, 0) / measurements.length : 100;
    model = {
      type: 'homogeneous',
      ρ: parseFloat(avgResistivity.toFixed(1)),
      description: 'Suelo homogéneo'
    };
  } else if (layers.layers === 2) {
    // Estimación simplificada de dos capas
    const ρ1 = measurements[0]?.resistivity || 100;
    const ρ2 = measurements[measurements.length - 1]?.resistivity || 100;
    const h = measurements[1]?.spacing || 2;
    
    model = {
      type: 'two-layer',
      ρ1,
      ρ2,
      h,
      description: `Dos capas: ${ρ1} Ω·m / ${ρ2} Ω·m a ${h}m`
    };
  } else {
    model = {
      type: 'three-layer',
      ρ1: measurements[0]?.resistivity || 100,
      ρ2: measurements[Math.floor(measurements.length / 2)]?.resistivity || 100,
      ρ3: measurements[measurements.length - 1]?.resistivity || 100,
      h1: measurements[1]?.spacing || 2,
      h2: measurements[2]?.spacing || 4,
      description: 'Suelo de tres capas'
    };
  }
  
  return model;
};

export default {
  calculateEquivalentResistivity,
  calculateReflectionFactor,
  calculateTwoLayerSoil,
  calculateThreeLayerSoil,
  recommendLayersFromMeasurements,
  calculateApparentResistivities,
  interpolateResistivity,
  optimizeSoilModel
};