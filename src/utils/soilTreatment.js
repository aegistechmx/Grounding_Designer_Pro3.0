/**
 * Recomienda tratamiento de suelo para reducir resistividad
 * Basado en IEEE 80, CFE 01J00-01 y prácticas de campo
 * 
 * La resistividad del suelo puede reducirse mediante:
 * - Tratamientos químicos (sales, bentonita, carbón)
 * - Electrodos químicos
 * - Geocompuestos conductivos
 * - Pozos de tierra profunda
 */

// Opciones de tratamiento expandidas
const TREATMENT_OPTIONS = [
  {
    id: 'bentonita',
    name: 'Bentonita Sódica',
    minReduction: 1.5,
    maxReduction: 3,
    application: 'Espolvorear bentonita sódica alrededor de la malla (20-30 kg/m²)',
    costPerM2: 15,
    effectiveness: 'Media',
    lifespan: '5-10 años',
    maintenance: 'Reaplicar cada 5-7 años',
    icon: '🧪',
    bestFor: 'Suelos arenosos, arcillosos'
  },
  {
    id: 'carbon_bentonita',
    name: 'Carbón Activado + Bentonita',
    minReduction: 2,
    maxReduction: 5,
    application: 'Mezcla 50% carbón activado + 50% bentonita, 30-40 kg/m²',
    costPerM2: 30,
    effectiveness: 'Alta',
    lifespan: '10-15 años',
    maintenance: 'Revisar cada 8-10 años',
    icon: '🪨',
    bestFor: 'Suelos de alta resistividad (>500 Ω·m)'
  },
  {
    id: 'sales_electroliticas',
    name: 'Sales Electrolíticas (ERICO, LENTON)',
    minReduction: 3,
    maxReduction: 10,
    application: 'Instalar electrodos químicos en puntos estratégicos (cada 5-10 m)',
    costPerM2: 80,
    effectiveness: 'Muy alta',
    lifespan: '20-25 años',
    maintenance: 'Monitoreo anual de sales',
    icon: '⚡',
    bestFor: 'Suelos rocosos, muy secos'
  },
  {
    id: 'geocompuesto',
    name: 'Geocompuesto Conductivo',
    minReduction: 2,
    maxReduction: 8,
    application: 'Colocar geotextil conductivo bajo la capa superficial',
    costPerM2: 45,
    effectiveness: 'Alta',
    lifespan: '15-20 años',
    maintenance: 'Inspección cada 10 años',
    icon: '📜',
    bestFor: 'Suelos con problemas de corrosión'
  },
  {
    id: 'pozos_profundos',
    name: 'Pozos de Tierra Profunda',
    minReduction: 4,
    maxReduction: 15,
    application: 'Perforar pozos de 6-15m de profundidad con relleno conductivo',
    costPerM2: 120,
    effectiveness: 'Muy alta',
    lifespan: '25-30 años',
    maintenance: 'Bajo mantenimiento',
    icon: '⛏️',
    bestFor: 'Espacios reducidos, alta resistividad'
  },
  {
    id: 'sulfato_magnesio',
    name: 'Sulfato de Magnesio (Sal de Epsom)',
    minReduction: 2,
    maxReduction: 4,
    application: 'Aplicar solución al 10-15% alrededor de varillas (5-10 L por punto)',
    costPerM2: 25,
    effectiveness: 'Media-Alta',
    lifespan: '3-5 años',
    maintenance: 'Reaplicación frecuente',
    icon: '🧂',
    bestFor: 'Soluciones temporales, suelos arcillosos'
  }
];

/**
 * Recomienda tratamiento de suelo basado en resistividad actual y objetivo
 * @param {number} soilResistivity - Resistividad medida (Ω·m)
 * @param {number} targetResistivity - Resistividad objetivo (Ω·m), default 50
 * @param {number} area - Área de la malla (m²)
 * @returns {object} Recomendación de tratamiento
 */
export const recommendSoilTreatment = (soilResistivity, targetResistivity = 50, area = 100) => {
  // Validar entradas
  if (!soilResistivity || soilResistivity <= 0) {
    return {
      needed: false,
      message: '⚠️ No hay datos de resistividad',
      treatment: 'Ninguno',
      cost: 0,
      error: true
    };
  }
  
  const safeTargetResistivity = Math.max(targetResistivity, 1);
  
  // Si ya está dentro del objetivo
  if (soilResistivity <= safeTargetResistivity) {
    return {
      needed: false,
      message: '✅ Suelo adecuado, no requiere tratamiento',
      treatment: 'Ninguno',
      cost: 0,
      currentResistivity: soilResistivity,
      targetResistivity: safeTargetResistivity,
      reductionNeeded: '1.0'
    };
  }
  
  const reductionNeeded = soilResistivity / safeTargetResistivity;
  
  // Seleccionar el tratamiento más adecuado
  let selectedTreatment = TREATMENT_OPTIONS && TREATMENT_OPTIONS.length > 0 ? TREATMENT_OPTIONS[0] : null;
  if (!selectedTreatment) {
    return {
      needed: false,
      message: '⚠️ No hay opciones de tratamiento disponibles',
      treatment: 'Ninguno',
      cost: 0,
      error: true
    };
  }
  for (const treatment of TREATMENT_OPTIONS) {
    if (reductionNeeded <= treatment.maxReduction) {
      selectedTreatment = treatment;
      break;
    }
  }
  
  // Si se necesita más reducción, usar el más potente
  if (reductionNeeded > selectedTreatment.maxReduction) {
    selectedTreatment = TREATMENT_OPTIONS[TREATMENT_OPTIONS.length - 1];
  }
  
  const totalCost = selectedTreatment.costPerM2 * area;
  const expectedResistivity = selectedTreatment.minReduction > 0 ? soilResistivity / selectedTreatment.minReduction : soilResistivity;
  const reductionPercent = selectedTreatment.minReduction > 0 ? ((1 - 1 / selectedTreatment.minReduction) * 100).toFixed(0) : '0';
  
  // Generar mensaje detallado
  let message = '';
  if (reductionNeeded > 10) {
    message = `🔴 Resistividad extremadamente alta (${soilResistivity} Ω·m). Se requiere tratamiento agresivo con ${selectedTreatment.name}.`;
  } else if (reductionNeeded > 5) {
    message = `⚠️ Resistividad muy alta (${soilResistivity} Ω·m). Se recomienda ${selectedTreatment.name}.`;
  } else {
    message = `⚠️ Se recomienda tratamiento con ${selectedTreatment.name}. Resistividad esperada: ${expectedResistivity.toFixed(0)} Ω·m (${reductionPercent}% de reducción).`;
  }
  
  return {
    needed: true,
    currentResistivity: soilResistivity,
    targetResistivity: safeTargetResistivity,
    reductionNeeded: reductionNeeded.toFixed(1),
    treatment: selectedTreatment.name,
    treatmentId: selectedTreatment.id,
    application: selectedTreatment.application,
    effectiveness: selectedTreatment.effectiveness,
    lifespan: selectedTreatment.lifespan,
    maintenance: selectedTreatment.maintenance,
    bestFor: selectedTreatment.bestFor,
    icon: selectedTreatment.icon,
    costPerM2: selectedTreatment.costPerM2,
    totalCost: totalCost.toFixed(0),
    expectedResistivity: expectedResistivity.toFixed(0),
    reductionPercent: `${reductionPercent}%`,
    message
  };
};

/**
 * Calcula cantidad de bentonita necesaria
 * @param {number} area - Área de la malla (m²)
 * @param {number} depth - Profundidad de aplicación (m), default 0.15
 * @returns {object} Cantidades y costos
 */
export const calculateBentoniteQuantity = (area, depth = 0.15) => {
  if (!area || area <= 0) {
    return {
      volume: 0,
      bentoniteKg: 0,
      bags25kg: 0,
      cost: 0,
      error: true,
      message: 'Área no válida'
    };
  }
  
  const volume = area * depth;
  const bentoniteKg = volume * 25; // 25 kg/m²
  const bags25kg = Math.ceil(bentoniteKg / 25);
  const cost = bags25kg * 20; // $20 por bolsa de 25kg
  const waterNeeded = bentoniteKg * 0.8; // 0.8 L por kg de bentonita
  const mixingTime = Math.ceil(bentoniteKg / 50); // 30 min por cada 50 kg
  
  return {
    volume: volume.toFixed(2),
    bentoniteKg: bentoniteKg.toFixed(0),
    bags25kg,
    cost: cost.toFixed(0),
    waterNeeded: waterNeeded.toFixed(0),
    mixingTime: `${mixingTime} horas`,
    message: `Se requieren ${bags25kg} bolsas de 25kg (${bentoniteKg.toFixed(0)} kg) para tratar ${area} m²`
  };
};

/**
 * Calcula cantidad de carbón activado necesario
 * @param {number} area - Área de la malla (m²)
 * @returns {object} Cantidades y costos
 */
export const calculateCharcoalQuantity = (area) => {
  if (!area || area <= 0) {
    return { error: true, message: 'Área no válida' };
  }
  
  const charcoalKg = area * 15; // 15 kg/m²
  const bentoniteKg = area * 15; // 15 kg/m²
  const totalKg = charcoalKg + bentoniteKg;
  const charcoalBags = Math.ceil(charcoalKg / 25);
  const bentoniteBags = Math.ceil(bentoniteKg / 25);
  const totalCost = (charcoalBags * 25) + (bentoniteBags * 20);
  
  return {
    charcoalKg: charcoalKg.toFixed(0),
    bentoniteKg: bentoniteKg.toFixed(0),
    totalKg: totalKg.toFixed(0),
    charcoalBags: charcoalBags,
    bentoniteBags: bentoniteBags,
    totalCost: totalCost.toFixed(0),
    mixRatio: '50% carbón + 50% bentonita',
    message: `Mezcla de ${charcoalKg.toFixed(0)} kg carbón activado + ${bentoniteKg.toFixed(0)} kg bentonita`
  };
};

/**
 * Compara diferentes opciones de tratamiento
 * @param {number} soilResistivity - Resistividad medida (Ω·m)
 * @param {number} area - Área de la malla (m²)
 * @returns {Array} Comparativa de tratamientos
 */
export const compareTreatments = (soilResistivity, area = 100) => {
  const results = [];
  
  for (const treatment of TREATMENT_OPTIONS) {
    const expectedResistivity = soilResistivity / treatment.minReduction;
    const cost = treatment.costPerM2 * area;
    const reduction = ((1 - 1 / treatment.minReduction) * 100).toFixed(0);
    
    results.push({
      name: treatment.name,
      icon: treatment.icon,
      expectedResistivity: expectedResistivity.toFixed(0),
      reduction: `${reduction}%`,
      cost: cost.toFixed(0),
      effectiveness: treatment.effectiveness,
      lifespan: treatment.lifespan,
      bestFor: treatment.bestFor
    });
  }
  
  // Ordenar por costo (menor a mayor)
  results.sort((a, b) => parseFloat(a.cost) - parseFloat(b.cost));
  
  return results;
};

/**
 * Obtiene recomendación basada en el tipo de suelo
 * @param {string} soilType - Tipo de suelo: 'arenoso', 'arcilloso', 'rocoso', 'limoso'
 * @returns {object} Recomendación específica
 */
export const recommendBySoilType = (soilType) => {
  const recommendations = {
    arenoso: {
      treatment: 'Bentonita o Geocompuesto',
      message: 'Suelo arenoso: Alta permeabilidad, usar bentonita para retener humedad',
      expectedReduction: '40-60%'
    },
    arcilloso: {
      treatment: 'Carbón Activado + Bentonita',
      message: 'Suelo arcilloso: Buena retención, usar carbón para mejorar conductividad',
      expectedReduction: '50-70%'
    },
    rocoso: {
      treatment: 'Sales Electrolíticas o Pozos Profundos',
      message: 'Suelo rocoso: Muy difícil de tratar, considerar electrodos químicos',
      expectedReduction: '30-50%'
    },
    limoso: {
      treatment: 'Bentonita o Sulfato de Magnesio',
      message: 'Suelo limoso: Tratamiento estándar con bentonita es efectivo',
      expectedReduction: '50-65%'
    }
  };
  
  return recommendations[soilType] || recommendations.arcilloso;
};

export default { 
  recommendSoilTreatment, 
  calculateBentoniteQuantity,
  calculateCharcoalQuantity,
  compareTreatments,
  recommendBySoilType,
  TREATMENT_OPTIONS
};