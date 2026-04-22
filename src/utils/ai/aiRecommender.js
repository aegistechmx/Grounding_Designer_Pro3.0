/**
 * AI Recommender - Sistema de recomendaciones inteligentes
 * Basado en análisis de parámetros y resultados de cálculos IEEE 80
 */

/**
 * Analiza el diseño y genera recomendaciones inteligentes
 * @param {Object} params - Parámetros del proyecto
 * @param {Object} calculations - Resultados de cálculos
 * @returns {Object} Recomendaciones con niveles de confianza
 */
export const AIRecommender = (params, calculations) => {
  const recommendations = [];
  const confidence = {};
  const warnings = [];
  const successes = [];

  // ============================================
  // Validación de parámetros
  // ============================================
  const gridLength = params?.gridLength || 0;
  const gridWidth = params?.gridWidth || 0;
  const numParallel = params?.numParallel || 1;
  const numRods = params?.numRods || 0;
  const currentDivisionFactor = params?.currentDivisionFactor || 0.3;
  const transformerKVA = params?.transformerKVA || 75;
  const surfaceLayer = params?.surfaceLayer || 3000;
  const surfaceDepth = params?.surfaceDepth || 0.1;
  const gridDepth = params?.gridDepth || 0.6;
  const rodLength = params?.rodLength || 3;
  const faultDuration = params?.faultDuration || 0.5;
  const soilResistivity = params?.soilResistivity || 100;

  // ============================================
  // Análisis de resultados de cálculos
  // ============================================
  const rg = calculations?.Rg || 0;
  const gpr = calculations?.GPR || 0;
  const em = calculations?.Em || 0;
  const es = calculations?.Es || 0;
  const etouch70 = calculations?.Etouch70 || 1;
  const estep70 = calculations?.Estep70 || 1;
  const complies = calculations?.complies || false;
  const touchSafe = calculations?.touchSafe70 || false;
  const stepSafe = calculations?.stepSafe70 || false;

  // ============================================
  // 1. Análisis de geometría de la malla
  // ============================================
  const area = gridLength * gridWidth;
  const spacing = numParallel > 0 && area > 0
    ? Math.sqrt(area / numParallel)
    : Infinity;
    
  if (spacing > 4) {
    recommendations.push({
      type: 'geometry',
      suggestion: 'Espaciamiento entre conductores excesivo',
      action: `Aumentar conductores paralelos de ${numParallel} a ${Math.ceil(numParallel * 1.5)}`,
      impact: 'Alto',
      confidence: 0.85,
      detail: `Espaciamiento actual: ${spacing.toFixed(2)}m > 4m recomendado`
    });
    confidence.spacing = 0.85;
  } else if (spacing > 3) {
    recommendations.push({
      type: 'geometry',
      suggestion: 'Espaciamiento de conductores mejorable',
      action: `Considerar aumentar conductores de ${numParallel} a ${Math.ceil(numParallel * 1.2)}`,
      impact: 'Medio',
      confidence: 0.70,
      detail: `Espaciamiento actual: ${spacing.toFixed(2)}m`
    });
    confidence.spacing = 0.70;
  } else if (spacing < 1.5) {
    successes.push('Espaciamiento de conductores óptimo (densidad adecuada)');
  }

  // ============================================
  // 2. Análisis de varillas
  // ============================================
  const perimeter = 2 * (gridLength + gridWidth);
  const rodsPerMeter = perimeter > 0 ? numRods / perimeter : 0;
  const recommendedRods = Math.ceil(perimeter * 0.6); // Una varilla cada ~1.7m en perímetro
  
  if (rodsPerMeter < 0.4) {
    recommendations.push({
      type: 'rods',
      suggestion: 'Varillas insuficientes en perímetro',
      action: `Agregar ${Math.max(0, recommendedRods - numRods)} varillas adicionales (mínimo ${recommendedRods} total)`,
      impact: 'Medio',
      confidence: 0.80,
      detail: `Varillas por metro: ${rodsPerMeter.toFixed(2)} < 0.4`
    });
    confidence.rods = 0.80;
  } else if (rodsPerMeter < 0.6) {
    recommendations.push({
      type: 'rods',
      suggestion: 'Varillas aceptables pero mejorables',
      action: `Agregar ${Math.ceil((perimeter * 0.6) - numRods)} varillas para mejor distribución`,
      impact: 'Bajo',
      confidence: 0.60,
      detail: `Varillas por metro: ${rodsPerMeter.toFixed(2)}`
    });
    confidence.rods = 0.60;
  } else {
    successes.push('Distribución de varillas adecuada en perímetro');
  }

  // ============================================
  // 3. Análisis de factor Sf
  // ============================================
  if (currentDivisionFactor > 0.35 && transformerKVA < 150) {
    recommendations.push({
      type: 'sf',
      suggestion: 'Factor Sf significativamente sobreestimado',
      action: `Reducir Sf de ${currentDivisionFactor.toFixed(2)} a 0.20 (reducción GPR ~40%)`,
      impact: 'Muy Alto',
      confidence: 0.95,
      detail: `Para transformadores de ${transformerKVA} kVA, Sf típico es 0.15-0.25`
    });
    confidence.sf = 0.95;
  } else if (currentDivisionFactor > 0.28 && transformerKVA < 100) {
    recommendations.push({
      type: 'sf',
      suggestion: 'Factor Sf ligeramente alto',
      action: `Reducir Sf de ${currentDivisionFactor.toFixed(2)} a 0.22`,
      impact: 'Alto',
      confidence: 0.85,
      detail: `Valor recomendado: 0.20-0.25 para este tamaño de transformador`
    });
    confidence.sf = 0.85;
  } else if (currentDivisionFactor < 0.15 && transformerKVA > 200) {
    warnings.push('Factor Sf posiblemente subestimado. Verificar condiciones reales.');
  }

  // ============================================
  // 4. Análisis de capa superficial
  // ============================================
  if (surfaceLayer < 3000) {
    recommendations.push({
      type: 'surface',
      suggestion: 'Resistividad de capa superficial baja',
      action: 'Instalar capa de grava de 10,000 Ω·m con espesor mínimo 0.15m',
      impact: 'Muy Alto',
      confidence: 0.90,
      detail: `Aumentará límite de tensión de contacto de ${etouch70.toFixed(0)} V a ~3800 V`
    });
    confidence.surface = 0.90;
  } else if (surfaceLayer < 5000) {
    recommendations.push({
      type: 'surface',
      suggestion: 'Mejorar capa superficial',
      action: 'Aumentar resistividad a 10,000 Ω·m o espesor a 0.20m',
      impact: 'Alto',
      confidence: 0.80,
      detail: `Capa actual: ${surfaceLayer} Ω·m / ${surfaceDepth}m`
    });
    confidence.surface = 0.80;
  } else if (surfaceLayer >= 10000 && surfaceDepth >= 0.15) {
    successes.push('Capa superficial óptima (alta resistividad, espesor adecuado)');
  }

  // ============================================
  // 5. Análisis de profundidad de malla
  // ============================================
  if (gridDepth < 0.5) {
    recommendations.push({
      type: 'depth',
      suggestion: 'Malla muy superficial',
      action: `Aumentar profundidad de ${gridDepth}m a mínimo 0.6m`,
      impact: 'Medio',
      confidence: 0.75,
      detail: 'Mayor profundidad mejora disipación de corriente'
    });
    confidence.depth = 0.75;
  } else if (gridDepth >= 0.8) {
    successes.push('Profundidad de malla adecuada para protección');
  }

  // ============================================
  // 6. Análisis de resultados de seguridad
  // ============================================
  const touchMargin = ((etouch70 - em) / etouch70 * 100) || 0;
  const stepMargin = ((estep70 - es) / estep70 * 100) || 0;

  if (!touchSafe) {
    recommendations.push({
      type: 'safety',
      suggestion: 'Tensión de contacto excede límite seguro',
      action: 'Reducir espaciamiento entre conductores, agregar varillas o mejorar capa superficial',
      impact: 'Crítico',
      confidence: 0.98,
      detail: `Em = ${em.toFixed(0)} V > Etouch = ${etouch70.toFixed(0)} V (margen: ${touchMargin.toFixed(0)}%)`
    });
    confidence.safety = 0.98;
  } else if (touchMargin < 30) {
    recommendations.push({
      type: 'safety',
      suggestion: 'Margen de seguridad de contacto reducido',
      action: 'Considerar mejoras para aumentar margen de seguridad',
      impact: 'Alto',
      confidence: 0.85,
      detail: `Margen actual: ${touchMargin.toFixed(0)}% (recomendado >50%)`
    });
    confidence.safety = 0.85;
  }

  if (!stepSafe) {
    recommendations.push({
      type: 'safety',
      suggestion: 'Tensión de paso excede límite seguro',
      action: 'Agregar conductor perimetral adicional o mejorar capa superficial',
      impact: 'Crítico',
      confidence: 0.98,
      detail: `Es = ${es.toFixed(0)} V > Estep = ${estep70.toFixed(0)} V`
    });
    confidence.step = 0.98;
  } else if (stepMargin < 30) {
    recommendations.push({
      type: 'safety',
      suggestion: 'Margen de seguridad de paso reducido',
      action: 'Verificar condiciones de operación y considerar mejoras',
      impact: 'Medio',
      confidence: 0.75,
      detail: `Margen actual: ${stepMargin.toFixed(0)}%`
    });
    confidence.step = 0.75;
  }

  // ============================================
  // 7. Análisis de GPR
  // ============================================
  if (gpr > 10000) {
    recommendations.push({
      type: 'gpr',
      suggestion: 'GPR extremadamente alto',
      action: 'Reducir Sf, aumentar conductores o agregar varillas',
      impact: 'Crítico',
      confidence: 0.95,
      detail: `GPR = ${gpr.toFixed(0)} V > 10000 V (riesgo para equipos electrónicos)`
    });
    confidence.gpr = 0.95;
  } else if (gpr > 5000) {
    recommendations.push({
      type: 'gpr',
      suggestion: 'GPR elevado',
      action: 'Reducir Sf de 0.38 a 0.20 para reducir GPR ~40%',
      impact: 'Alto',
      confidence: 0.90,
      detail: `GPR = ${gpr.toFixed(0)} V > 5000 V (riesgo moderado)`
    });
    confidence.gpr = 0.90;
  }

  // ============================================
  // 8. Análisis de resistencia de malla
  // ============================================
  if (rg > 5) {
    recommendations.push({
      type: 'resistance',
      suggestion: 'Resistencia de malla alta',
      action: 'Agregar más varillas o tratar el suelo con bentonita',
      impact: 'Alto',
      confidence: 0.85,
      detail: `Rg = ${rg.toFixed(2)} Ω > 5 Ω recomendado`
    });
    confidence.resistance = 0.85;
  } else if (rg > 2) {
    successes.push(`Resistencia de malla aceptable (${rg.toFixed(2)} Ω < 5 Ω)`);
  } else {
    successes.push(`Resistencia de malla excelente (${rg.toFixed(2)} Ω < 2 Ω)`);
  }

  // ============================================
  // 9. Análisis de relación Largo/Ancho
  // ============================================
  const aspectRatio = Math.max(gridLength, gridWidth) / Math.min(gridLength, gridWidth);
  if (aspectRatio > 2) {
    recommendations.push({
      type: 'geometry',
      suggestion: 'Malla muy alargada (aspecto > 2:1)',
      action: 'Considerar rediseñar para forma más cuadrada si es posible',
      impact: 'Bajo',
      confidence: 0.60,
      detail: `Relación L/W = ${aspectRatio.toFixed(1)}:1`
    });
    confidence.aspect = 0.60;
  }

  // ============================================
  // 10. Análisis de tiempo de falla
  // ============================================
  if (faultDuration > 0.5) {
    recommendations.push({
      type: 'protection',
      suggestion: 'Tiempo de despeje de falla elevado',
      action: 'Revisar coordinación de protecciones para reducir tiempo',
      impact: 'Alto',
      confidence: 0.80,
      detail: `Tiempo actual: ${faultDuration}s > 0.5s recomendado`
    });
    confidence.protection = 0.80;
  }

  // ============================================
  // Cálculo de confianza general
  // ============================================
  const confidenceValues = Object.values(confidence);
  const avgConfidence = confidenceValues.length > 0
    ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
    : 0;

  // ============================================
  // Resumen ejecutivo
  // ============================================
  const summary = {
    status: complies ? 'APROBADO' : 'NO APROBADO',
    totalRecommendations: recommendations.length,
    criticalIssues: recommendations.filter(r => r.impact === 'Crítico').length,
    highPriority: recommendations.filter(r => r.impact === 'Muy Alto' || r.impact === 'Alto').length,
    improvements: successes.length,
    overallScore: complies ? Math.min(100, 60 + (touchMargin + stepMargin) / 2) : Math.max(0, (touchMargin + stepMargin) / 2)
  };

  return {
    recommendations,
    successes,
    warnings,
    confidence: avgConfidence,
    summary,
    priority: recommendations.sort((a, b) => {
      const impactOrder = { 'Crítico': 4, 'Muy Alto': 3, 'Alto': 2, 'Medio': 1, 'Bajo': 0 };
      return (impactOrder[b.impact] || 0) - (impactOrder[a.impact] || 0);
    })
  };
};

export default AIRecommender;