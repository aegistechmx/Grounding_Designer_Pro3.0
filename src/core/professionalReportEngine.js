/**
 * Professional CFE Report Engine
 * Generates formal engineering reports with CFE structure and professional tone
 */

/**
 * Generate professional executive summary
 * @param {Object} params - Design parameters
 * @param {Object} calculations - Calculation results
 * @returns {string} Executive summary
 */
export function generateExecutiveSummary(params, calculations) {
  const projectName = params.projectName || 'Instalación Eléctrica';
  const location = params.location || 'Puerto Vallarta, Jalisco';
  const Rg = calculations.Rg || calculations.resistance || 0;
  const GPR = calculations.GPR || calculations.gpr || 0;
  const Em = calculations.Em || calculations.touchVoltage || 0;
  const Es = calculations.Es || calculations.stepVoltage || 0;
  const complies = calculations.complies || false;

  let summary = `El presente estudio corresponde al diseño del sistema de puesta a tierra para una instalación eléctrica en ${location}.\n\n`;
  
  summary += `El sistema fue evaluado conforme a los criterios de seguridad establecidos en IEEE Std 80-2013 y CFE 01J00-01.\n\n`;
  
  summary += `Los resultados indican que el diseño `;
  
  if (complies) {
    summary += `cumple con los límites permisibles de tensiones de paso y contacto, garantizando la seguridad del personal ante condiciones de falla.\n\n`;
    
    if (GPR > 3000) {
      summary += `No obstante, se identificó una elevación de potencial (GPR) de ${GPR.toFixed(0)} V, considerada moderadamente alta, por lo que se recomienda una evaluación complementaria de posibles transferencias de potencial hacia estructuras externas.`;
    } else {
      summary += `La elevación de potencial (GPR) de ${GPR.toFixed(0)} V se encuentra dentro de rangos aceptables para el sistema.`;
    }
  } else {
    summary += `requiere modificaciones para cumplir con los límites de seguridad establecidos por IEEE Std 80-2013. Se deben implementar las recomendaciones técnicas detalladas en este reporte.`;
  }
  
  return summary;
}

/**
 * Generate system description
 * @param {Object} params - Design parameters
 * @param {Object} calculations - Calculation results
 * @returns {string} System description
 */
export function generateSystemDescription(params, calculations) {
  const transformerPower = params.transformerPower || params.power || 150;
  const primaryVoltage = params.primaryVoltage || 13.2;
  const secondaryVoltage = params.secondaryVoltage || 220;
  const faultCurrent = calculations.gridCurrent || calculations.If || 0;
  const faultDuration = params.faultDuration || 0.35;
  const gridLength = params.length || 14;
  const gridWidth = params.width || 14;
  const gridDepth = params.gridDepth || params.depth || 0.6;
  const numRods = params.numRods || 6;
  const rodLength = params.rodLength || 3;

  let description = `El sistema eléctrico analizado corresponde a un transformador de ${transformerPower} kVA, con tensión primaria de ${primaryVoltage} kV y secundaria de ${secondaryVoltage} V.\n\n`;
  
  description += `La corriente de falla calculada es de ${faultCurrent.toFixed(0)} A con una duración de ${faultDuration} s.\n\n`;
  
  description += `El sistema de puesta a tierra consiste en una malla rectangular de ${gridLength} m × ${gridWidth} m, conformada por conductores de cobre enterrados a una profundidad de ${gridDepth} m`;
  
  if (numRods > 0) {
    description += `, complementada con ${numRods} electrodos verticales de ${rodLength} m de longitud.`;
  } else {
    description += `.`;
  }
  
  return description;
}

/**
 * Generate soil characteristics
 * @param {Object} params - Design parameters
 * @returns {string} Soil characteristics
 */
export function generateSoilCharacteristics(params) {
  const resistivity = params.resistivity || params.rho || 100;
  const surfaceResistivity = params.surfaceResistivity || params.rho_s || 10000;
  const surfaceThickness = params.surfaceThickness || 0.2;

  let characteristics = `El análisis considera una resistividad del suelo de ${resistivity.toFixed(0)} `;
  
  if (resistivity < 100) {
    characteristics += `Baja`;
  } else if (resistivity < 500) {
    characteristics += `Moderada`;
  } else if (resistivity < 1000) {
    characteristics += `Media`;
  } else {
    characteristics += `Alta`;
  }
  
  characteristics += ` y una capa superficial de `;
  
  if (surfaceResistivity > 5000) {
    characteristics += `grava con resistividad de ${surfaceResistivity.toFixed(0)} `;
  } else {
    characteristics += `material con resistividad de ${surfaceResistivity.toFixed(0)} `;
  }
  
  characteristics += `y espesor de ${surfaceThickness.toFixed(1)} m.\n\n`;
  
  characteristics += `Este recubrimiento incrementa la resistividad de contacto, reduciendo el riesgo para el personal.`;
  
  return characteristics;
}

/**
 * Generate results section
 * @param {Object} calculations - Calculation results
 * @returns {string} Results section
 */
export function generateResults(calculations) {
  const Rg = calculations.Rg || calculations.resistance || 0;
  const GPR = calculations.GPR || calculations.gpr || 0;
  const Em = calculations.Em || calculations.touchVoltage || 0;
  const Es = calculations.Es || calculations.stepVoltage || 0;
  const Etouch70 = calculations.Etouch70 || calculations.touchLimit70 || 0;
  const Estep70 = calculations.Estep70 || calculations.stepLimit70 || 0;
  const complies = calculations.complies || false;

  let results = `La resistencia de puesta a tierra obtenida es de ${Rg.toFixed(2)} `;
  
  if (Rg < 1) {
    results += `muy baja`;
  } else if (Rg < 3) {
    results += `excelente`;
  } else if (Rg < 5) {
    results += `adecuada`;
  } else if (Rg < 10) {
    results += `elevada`;
  } else {
    results += `muy elevada`;
  }
  
  results += `, valor considerado `;
  
  if (Rg <= 5) {
    results += `adecuado para sistemas de media tensión.`;
  } else {
    results += `inadecuado para sistemas de media tensión.`;
  }
  
  results += `\n\nLa elevación de potencial del sistema (GPR) alcanza ${GPR.toFixed(0)} V bajo condiciones de falla.\n\n`;
  
  results += `Las tensiones de contacto y paso calculadas son:\n\n`;
  results += `- Contacto: ${Em.toFixed(1)} V\n`;
  results += `- Paso: ${Es.toFixed(1)} V\n\n`;
  
  if (Etouch70 > 0 && Estep70 > 0) {
    results += `Ambos valores se encuentran `;
    
    const touchRatio = Em / Etouch70;
    const stepRatio = Es / Estep70;
    
    if (touchRatio < 0.7 && stepRatio < 0.7) {
      results += `significativamente por debajo`;
    } else if (touchRatio < 0.9 && stepRatio < 0.9) {
      results += `por debajo`;
    } else {
      results += `cerca`;
    }
    
    results += ` de los límites permisibles establecidos por IEEE 80, tanto para personas de 50 kg como de 70 kg.`;
  } else {
    results += `Los límites permisibles no pudieron ser calculados debido a falta de datos de configuración.`;
  }
  
  return results;
}

/**
 * Generate critical analysis
 * @param {Object} calculations - Calculation results
 * @returns {string} Critical analysis
 */
export function generateCriticalAnalysis(calculations) {
  const GPR = calculations.GPR || calculations.gpr || 0;
  const complies = calculations.complies || false;
  const Rg = calculations.Rg || calculations.resistance || 0;

  let analysis = '';
  
  if (complies && GPR > 3000) {
    analysis = `Si bien el sistema cumple con los criterios de seguridad, el nivel de GPR obtenido (${GPR.toFixed(0)} V) puede generar diferencias de potencial importantes entre la malla y puntos remotos.\n\n`;
    analysis += `Esto implica un posible riesgo de transferencia de potencial hacia estructuras metálicas, sistemas de comunicación o neutros conectados.\n\n`;
    analysis += `Se recomienda evaluar:\n`;
    analysis += `- Interconexión con otras mallas\n`;
    analysis += `- Equipos sensibles conectados a tierra\n`;
    analysis += `- Distancias a cercas o estructuras externas`;
  } else if (!complies) {
    analysis = `El diseño no cumple con los criterios de seguridad IEEE 80, lo que representa riesgos directos para el personal.\n\n`;
    analysis += `Se deben implementar las siguientes medidas correctivas:\n`;
    analysis += `- Aumentar área de malla o agregar electrodos verticales\n`;
    analysis += `- Mejorar capa superficial de alta resistividad\n`;
    analysis += `- Optimizar espaciamiento de conductores`;
  } else {
    analysis = `El sistema cumple con todos los criterios de seguridad establecidos por IEEE 80.\n\n`;
    analysis += `El diseño presenta características adecuadas de seguridad y puede implementarse sin modificaciones adicionales.`;
  }
  
  return analysis;
}

/**
 * Generate sensitivity analysis
 * @param {Array} sensitivityData - Sensitivity analysis data
 * @returns {string} Sensitivity analysis
 */
export function generateSensitivityAnalysis(sensitivityData) {
  if (!sensitivityData || sensitivityData.length === 0) {
    return 'No se dispone de datos de análisis de sensibilidad para el diseño actual.';
  }

  // Find most critical parameter
  const critical = sensitivityData.reduce((max, item) => {
    const impact = item.impact || item.value || 0;
    const maxImpact = max.impact || max.value || 0;
    return impact > maxImpact ? item : max;
  }, sensitivityData[0]);

  const criticalImpact = (critical.value || critical.impact || 0) * 100;
  const criticalName = critical.name || critical.parameter || 'Desconocido';

  let analysis = `El análisis de sensibilidad muestra que la ${criticalName.toLowerCase()} es el parámetro de mayor impacto en el diseño (${criticalImpact.toFixed(0)}%).\n\n`;
  
  if (criticalName.toLowerCase().includes('resistiv')) {
    analysis += `Esto resalta la importancia de realizar mediciones en campo mediante el método Wenner de cuatro puntas, ya que variaciones en este parámetro pueden modificar significativamente los resultados.`;
  } else if (criticalName.toLowerCase().includes('área') || criticalName.toLowerCase().includes('malla')) {
    analysis += `La geometría de la malla tiene un impacto significativo en el diseño. Se recomienda optimizar la relación área-efectividad para mejorar el rendimiento del sistema.`;
  } else if (criticalName.toLowerCase().includes('corrient')) {
    analysis += `La corriente de falla es fundamental para el diseño. Se debe coordinar con ingeniería de potencia para confirmar los valores de cortocircuito del sistema.`;
  } else {
    analysis += `Este parámetro requiere especial atención durante el diseño y validación del sistema.`;
  }
  
  // Find least impactful parameter
  const least = sensitivityData.reduce((min, item) => {
    const impact = item.impact || item.value || 0;
    const minImpact = min.impact || min.value || 0;
    return impact < minImpact ? item : min;
  }, sensitivityData[0]);

  const leastImpact = (least.value || least.impact || 0) * 100;
  const leastName = least.name || least.parameter || 'Desconocido';

  if (leastImpact < 10) {
    analysis += `\n\nLa ${leastName.toLowerCase()} presenta impacto despreciable en el diseño (${leastImpact.toFixed(0)}%).`;
  }
  
  return analysis;
}

/**
 * Generate technical conclusion
 * @param {Object} calculations - Calculation results
 * @param {Object} params - Design parameters
 * @returns {string} Technical conclusion
 */
export function generateTechnicalConclusion(calculations, params) {
  const complies = calculations.complies || false;
  const GPR = calculations.GPR || calculations.gpr || 0;
  const Rg = calculations.Rg || calculations.resistance || 0;

  let conclusion = `El sistema de puesta a tierra diseñado `;
  
  if (complies) {
    conclusion += `cumple con los requisitos de seguridad establecidos por la normativa vigente.\n\n`;
    conclusion += `El diseño garantiza niveles seguros de tensión de paso y contacto, asegurando la protección del personal.\n\n`;
    
    if (GPR > 3000) {
      conclusion += `Sin embargo, debido al nivel de GPR obtenido (${GPR.toFixed(0)} V), se recomienda una evaluación adicional para descartar riesgos de potencial transferido.\n\n`;
    }
    
    conclusion += `El sistema puede considerarse apto para su implementación, sujeto a validación en sitio.`;
  } else {
    conclusion += `requiere modificaciones para cumplir con los requisitos de seguridad establecidos por la normativa vigente.\n\n`;
    conclusion += `Se deben implementar las recomendaciones técnicas antes de proceder con la instalación.\n\n`;
    conclusion += `Una vez implementadas las mejoras, se deberá realizar una nueva evaluación técnica.`;
  }
  
  return conclusion;
}

/**
 * Generate professional recommendations
 * @param {Object} calculations - Calculation results
 * @param {Object} params - Design parameters
 * @returns {Array} Recommendations array
 */
export function generateProfessionalRecommendations(calculations, params) {
  const recommendations = [];
  const GPR = calculations.GPR || calculations.gpr || 0;
  const complies = calculations.complies || false;
  const Rg = calculations.Rg || calculations.resistance || 0;

  // Always include measurement recommendations
  recommendations.push({
    priority: 1,
    category: 'Medición',
    recommendation: 'Realizar medición de resistividad del suelo en sitio (método Wenner)'
  });
  
  recommendations.push({
    priority: 2,
    category: 'Pruebas',
    recommendation: 'Ejecutar prueba de resistencia de puesta a tierra (caída de potencial)'
  });
  
  recommendations.push({
    priority: 3,
    category: 'Instalación',
    recommendation: 'Verificar continuidad de conexiones'
  });

  // Add specific recommendations based on results
  if (GPR > 3000) {
    recommendations.push({
      priority: 4,
      category: 'Evaluación',
      recommendation: 'Evaluar posibles rutas de transferencia de potencial'
    });
    
    recommendations.push({
      priority: 5,
      category: 'Mejora',
      recommendation: 'Considerar ampliación de malla en caso de interferencias externas'
    });
  }
  
  if (!complies) {
    recommendations.push({
      priority: 4,
      category: 'Corrección',
      recommendation: 'Implementar mejoras para cumplir con IEEE 80'
    });
  }
  
  if (Rg > 5) {
    recommendations.push({
      priority: 5,
      category: 'Optimización',
      recommendation: 'Evaluar aumento de área de malla o electrodos adicionales'
    });
  }

  return recommendations;
}

/**
 * Generate professional certificate
 * @param {Object} params - Design parameters
 * @param {Object} calculations - Calculation results
 * @returns {string} Certificate text
 */
export function generateProfessionalCertificate(params, calculations) {
  const projectName = params.projectName || 'Instalación Eléctrica';
  const complies = calculations.complies || false;
  const date = new Date().toLocaleDateString('es-MX');

  let certificate = `El presente documento certifica que el diseño del sistema de puesta a tierra para ${projectName} ha sido desarrollado conforme a los lineamientos de IEEE Std 80-2013 y CFE 01J00-01.\n\n`;
  
  certificate += `El diseño `;
  
  if (complies) {
    certificate += `cumple con los criterios de seguridad eléctrica establecidos para instalaciones de media tensión.`;
  } else {
    certificate += `requiere modificaciones para cumplir con los criterios de seguridad eléctrica establecidos para instalaciones de media tensión.`;
  }
  
  certificate += `\n\nFecha de emisión: ${date}\n\n`;
  certificate += `Ingeniero Responsable\n`;
  certificate += `Firma Digital`;
  
  return certificate;
}

export default {
  generateExecutiveSummary,
  generateSystemDescription,
  generateSoilCharacteristics,
  generateResults,
  generateCriticalAnalysis,
  generateSensitivityAnalysis,
  generateTechnicalConclusion,
  generateProfessionalRecommendations,
  generateProfessionalCertificate
};
