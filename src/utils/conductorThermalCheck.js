/**
 * Catálogo Viakon - Conductores de cobre
 * Basado en la tabla proporcionada
 */
export const CONDUCTORS = {
  AWG_6: { name: '6 AWG', area: 13.3, diameter: 7.72, ampacity: 55 },
  AWG_4: { name: '4 AWG', area: 21.2, diameter: 8.94, ampacity: 70 },
  AWG_2: { name: '2 AWG', area: 33.6, diameter: 10.5, ampacity: 95 },
  AWG_1: { name: '1 AWG', area: 42.4, diameter: 12.5, ampacity: 110 },
  AWG_1_0: { name: '1/0 AWG', area: 53.5, diameter: 13.5, ampacity: 125 },
  AWG_2_0: { name: '2/0 AWG', area: 67.4, diameter: 14.7, ampacity: 145 },
  AWG_3_0: { name: '3/0 AWG', area: 85.0, diameter: 16.0, ampacity: 165 },
  AWG_4_0: { name: '4/0 AWG', area: 107.2, diameter: 17.5, ampacity: 195 },
  KCMIL_250: { name: '250 kcmil', area: 127.0, diameter: 19.4, ampacity: 215 },
  KCMIL_300: { name: '300 kcmil', area: 152.0, diameter: 20.8, ampacity: 240 },
  KCMIL_350: { name: '350 kcmil', area: 177.0, diameter: 22.1, ampacity: 260 },
  KCMIL_400: { name: '400 kcmil', area: 203.0, diameter: 23.3, ampacity: 280 },
  KCMIL_500: { name: '500 kcmil', area: 253.0, diameter: 25.5, ampacity: 320 },
  KCMIL_600: { name: '600 kcmil', area: 304.0, diameter: 28.3, ampacity: 355 },
  KCMIL_700: { name: '700 kcmil', area: 355.0, diameter: 30.1, ampacity: 385 },
  KCMIL_750: { name: '750 kcmil', area: 380.0, diameter: 30.9, ampacity: 400 },
  KCMIL_800: { name: '800 kcmil', area: 405.0, diameter: 31.8, ampacity: 410 },
  KCMIL_1000: { name: '1000 kcmil', area: 507.0, diameter: 34.8, ampacity: 455 }
};

// Constantes térmicas según IEEE 80-2013
const THERMAL_CONSTANTS = {
  COPPER_SOFT: { k: 7.0, name: 'Cobre Recocido', maxTemp: 250 },
  COPPER_HARD: { k: 7.0, name: 'Cobre Duro', maxTemp: 250 },
  ALUMINUM: { k: 4.5, name: 'Aluminio', maxTemp: 200 }
};

/**
 * Calcula el área mínima requerida térmicamente (IEEE 80 ecuación 37)
 */
const calculateMinArea = (faultCurrent, faultDuration, material = 'COPPER_SOFT') => {
  const constData = THERMAL_CONSTANTS[material];
  if (!constData) return null;
  return (faultCurrent * Math.sqrt(Math.max(0.1, faultDuration))) / constData.k;
};

/**
 * Calcula el número de conductores en paralelo necesarios
 */
const calculateParallelConductors = (faultCurrent, conductorAmpacity) => {
  if (!conductorAmpacity || conductorAmpacity <= 0) return 1;
  return Math.ceil(faultCurrent / conductorAmpacity);
};

/**
 * Encuentra el conductor recomendado basado en área mínima
 */
const findRecommendedConductor = (minArea) => {
  const conductorsList = Object.values(CONDUCTORS).sort((a, b) => a.area - b.area);
  for (const cond of conductorsList) {
    if (cond.area >= minArea) {
      return { ...cond, isRecommended: true };
    }
  }
  return {
    name: '> 1000 kcmil',
    area: minArea,
    diameter: Math.sqrt(minArea / Math.PI) * 2 / 1000,
    ampacity: 0,
    isRecommended: true
  };
};

/**
 * Encuentra el conductor actual
 */
const findCurrentConductor = (currentArea) => {
  const conductorsList = Object.values(CONDUCTORS);
  for (const cond of conductorsList) {
    if (Math.abs(cond.area - currentArea) < 5) {
      return { ...cond, isCurrent: true };
    }
  }
  return { name: 'Personalizado', area: currentArea, isCurrent: true };
};

/**
 * ✅ Función principal de verificación térmica
 * @param {number} faultCurrent - Corriente de falla (A)
 * @param {number} faultDuration - Duración de la falla (s)
 * @param {number} currentArea - Área actual del conductor (mm²)
 * @param {string} material - Material ('COPPER_SOFT', 'COPPER_HARD', 'ALUMINUM')
 * @returns {object} Resultado completo de verificación
 */
export const conductorThermalCheck = (faultCurrent, faultDuration, currentArea, material = 'COPPER_SOFT') => {
  // Validar material
  const constData = THERMAL_CONSTANTS[material];
  if (!constData) {
    return {
      complies: false,
      error: 'Material no soportado',
      recommendation: 'Use COPPER_SOFT, COPPER_HARD o ALUMINUM'
    };
  }

  // 1. Verificación térmica (IEEE 80)
  const minRequiredArea = calculateMinArea(faultCurrent, faultDuration, material);
  const thermalComplies = currentArea >= minRequiredArea;
  
  // 2. Encontrar conductores
  const currentConductor = findCurrentConductor(currentArea);
  const recommendedConductor = findRecommendedConductor(minRequiredArea);
  
  // 3. Verificación de ampacity (capacidad de corriente)
  const currentAmpacity = currentConductor.ampacity || 0;
  const ampacityComplies = currentAmpacity >= faultCurrent;
  
  // 4. Cálculo de conductores en paralelo
  let parallelInfo = null;
  if (!ampacityComplies && currentAmpacity > 0) {
    const parallelCount = calculateParallelConductors(faultCurrent, currentAmpacity);
    parallelInfo = {
      requiredCount: parallelCount,
      totalArea: (currentArea * parallelCount)?.toFixed(2) || 'N/A',
      totalAmpacity: (currentAmpacity * parallelCount)?.toFixed(0) || 'N/A',
      recommendation: `Usar ${parallelCount} conductores ${currentConductor.name} en paralelo (${parallelCount} × ${currentArea?.toFixed(1) || 'N/A'} mm² = ${(currentArea * parallelCount)?.toFixed(1) || 'N/A'} mm², ${currentAmpacity * parallelCount} A)` 
    };
  } else if (!ampacityComplies && currentAmpacity === 0) {
    const parallelCount = calculateParallelConductors(faultCurrent, recommendedConductor.ampacity || 195);
    parallelInfo = {
      requiredCount: parallelCount,
      totalArea: (recommendedConductor.area * parallelCount)?.toFixed(2) || 'N/A',
      totalAmpacity: ((recommendedConductor.ampacity || 195) * parallelCount)?.toFixed(0) || 'N/A',
      recommendation: `Usar ${parallelCount} conductores ${recommendedConductor.name} en paralelo` 
    };
  }

  // 5. Determinar cumplimiento general
  // Según IEEE 80-2013, el criterio principal es la verificación térmica (área mínima)
  // La ampacity es conservadora pero no estrictamente necesaria para fallas cortas
  const complies = thermalComplies;
  
  // 6. Determinar severidad
  const severity = complies ? 'success' : 
    (!thermalComplies && !ampacityComplies) ? 'error' : 
    !thermalComplies ? 'error' : 
    !ampacityComplies ? 'info' : 'error';
  
  // 7. Generar mensaje y recomendación
  let message = '';
  let recommendation = '';
  
  if (complies) {
    message = `✅ Conductor adecuado (${currentArea?.toFixed(2) || 'N/A'} mm² ≥ ${minRequiredArea?.toFixed(2) || 'N/A'} mm², ${currentAmpacity} A ≥ ${faultCurrent?.toFixed(0) || 'N/A'} A)`;
    recommendation = `El calibre ${currentConductor.name} es suficiente.`;
  } else if (!thermalComplies && !ampacityComplies) {
    message = `❌ Conductor INSUFICIENTE (área y capacidad de corriente)`;
    recommendation = `⚠️ CAMBIO OBLIGATORIO: Usar calibre ${recommendedConductor.name} (${recommendedConductor.area?.toFixed(1) || 'N/A'} mm², ${recommendedConductor.ampacity} A) o superior.`;
    if (parallelInfo && recommendedConductor.ampacity > 0 && recommendedConductor.ampacity < faultCurrent) {
      recommendation += ` ${parallelInfo.recommendation}`;
    }
  } else if (!thermalComplies) {
    message = `❌ Conductor INSUFICIENTE (área térmica)`;
    recommendation = `⚠️ CAMBIO OBLIGATORIO: Usar calibre ${recommendedConductor.name} (${recommendedConductor.area?.toFixed(1) || 'N/A'} mm²) o superior.`;
  } else if (!ampacityComplies) {
    message = `⚠️ Conductor INSUFICIENTE (capacidad de corriente)`;
    recommendation = parallelInfo ? parallelInfo.recommendation : `Usar conductor de mayor calibre (mínimo ${faultCurrent > 0 ? Math.ceil(faultCurrent / 200) : 1} AWG)`;
  }

  return {
    complies,
    severity,
    thermalComplies,
    ampacityComplies,
    minRequiredArea: minRequiredArea?.toFixed(2) || 'N/A',
    currentArea: currentArea?.toFixed(2) || 'N/A',
    requiredAmpacity: faultCurrent?.toFixed(0) || 'N/A',
    currentAmpacity: currentAmpacity,
    faultCurrent: faultCurrent?.toFixed(0) || 'N/A',
    faultDuration: faultDuration?.toFixed(2) || 'N/A',
    material: constData.name,
    formula: minRequiredArea ? `A = (I × √t) / K = (${faultCurrent?.toFixed(0) || 'N/A'} × √${faultDuration}) / ${constData.k} = ${minRequiredArea.toFixed(2)} mm²` : 'Cálculo no disponible',
    message,
    recommendation,
    currentConductor,
    recommendedConductor,
    parallelInfo,
    needsParallel: !ampacityComplies && currentAmpacity > 0,
    parallelCount: parallelInfo?.requiredCount || 1
  };
};

/**
 * Recomienda automáticamente el calibre óptimo
 */
export const recommendConductor = (faultCurrent, faultDuration, material = 'COPPER_SOFT') => {
  const minRequiredArea = calculateMinArea(faultCurrent, faultDuration, material);
  if (!minRequiredArea) return null;
  
  const conductorsList = Object.values(CONDUCTORS).sort((a, b) => a.area - b.area);
  
  for (const cond of conductorsList) {
    if (cond.area >= minRequiredArea && cond.ampacity >= faultCurrent) {
      return {
        ...cond,
        minRequiredArea: minRequiredArea?.toFixed(2) || 'N/A',
        complies: true,
        needsParallel: false
      };
    }
  }
  
  // Si ningún conductor individual cumple, buscar el mejor y calcular paralelo
  const bestConductor = conductorsList[conductorsList.length - 1];
  const parallelCount = Math.ceil(faultCurrent / (bestConductor.ampacity || 195));
  
  return {
    ...bestConductor,
    minRequiredArea: minRequiredArea?.toFixed(2) || 'N/A',
    complies: false,
    needsParallel: true,
    parallelCount,
    parallelRecommendation: `Usar ${parallelCount} conductores ${bestConductor.name} en paralelo` 
  };
};

export default conductorThermalCheck;