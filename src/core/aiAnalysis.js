/**
 * AI Analysis Engine
 * Generates automatic technical analysis and recommendations
 */

/**
 * Generate automatic AI analysis from calculations
 * @param {Object} calculations - Calculation results
 * @param {Object} params - Design parameters
 * @param {Object} scoreResult - Score result from score engine
 * @param {Array} alerts - Alerts from alerts engine
 * @returns {Object} Analysis object with summary and recommendations
 */
export function generateAIAnalysis(calculations, params, scoreResult, alerts) {
  const analysis = {
    summary: '',
    safetyStatus: '',
    technicalAnalysis: '',
    recommendations: [],
    conclusion: ''
  };

  const Rg = calculations.Rg || calculations.resistance || 0;
  const GPR = calculations.GPR || calculations.gpr || 0;
  const Em = calculations.Em || calculations.touchVoltage || 0;
  const Es = calculations.Es || calculations.stepVoltage || 0;
  const Etouch70 = calculations.Etouch70 || calculations.touchLimit70 || 0;
  const Estep70 = calculations.Estep70 || calculations.stepLimit70 || 0;
  const complies = calculations.complies || false;

  // Generate safety status - more honest about GPR
  if (complies) {
    if (GPR > 3000) {
      analysis.safetyStatus = 'El diseño cumple con IEEE 80 en tensiones de paso y contacto, sin embargo el GPR elevado puede generar riesgos fuera de la malla.';
    } else {
      analysis.safetyStatus = 'El diseño cumple con los criterios de seguridad IEEE 80, garantizando protección para personas.';
    }
  } else {
    analysis.safetyStatus = 'El diseño requiere modificaciones para alcanzar el cumplimiento normativo IEEE 80.';
  }

  // Generate technical analysis
  analysis.technicalAnalysis += 'ANÁLISIS TÉCNICO DEL SISTEMA\n\n';

  // Resistance analysis
  if (Rg <= 5) {
    analysis.technicalAnalysis += `La resistencia de malla de ${Rg.toFixed(2)} Ω es adecuada para disipación de corriente, cumpliendo con el límite de 5 Ω. `;
  } else {
    analysis.technicalAnalysis += `La resistencia de malla de ${Rg.toFixed(2)} Ω excede el límite de 5 Ω, lo que puede comprometer la efectividad del sistema. `;
  }

  // GPR analysis - more honest
  if (GPR > 3000) {
    analysis.technicalAnalysis += `El GPR elevado (${GPR.toFixed(0)} V) representa un riesgo significativo de transferencia de potencial hacia estructuras externas y sistemas conectados. `;
  } else if (GPR > 2000) {
    analysis.technicalAnalysis += `El GPR de ${GPR.toFixed(0)} V está dentro de rangos aceptables pero requiere monitoreo de estructuras conectadas. `;
  } else {
    analysis.technicalAnalysis += `El GPR de ${GPR.toFixed(0)} V es adecuado para las condiciones del sistema. `;
  }

  // Touch voltage analysis
  if (Etouch70 > 0) {
    const touchRatio = Em / Etouch70;
    if (touchRatio <= 0.7) {
      analysis.technicalAnalysis += `La tensión de contacto de ${Em.toFixed(1)} V presenta un margen de seguridad adecuado (${(touchRatio * 100).toFixed(0)}% del límite). `;
    } else if (touchRatio <= 1) {
      analysis.technicalAnalysis += `La tensión de contacto de ${Em.toFixed(1)} V está cerca del límite, requiriendo atención especial a la capa superficial. `;
    } else {
      analysis.technicalAnalysis += `La tensión de contacto de ${Em.toFixed(1)} V excede el límite, comprometiendo la seguridad de personas. `;
    }
  }

  // Step voltage analysis
  if (Estep70 > 0) {
    const stepRatio = Es / Estep70;
    if (stepRatio <= 0.7) {
      analysis.technicalAnalysis += `La tensión de paso de ${Es.toFixed(1)} V presenta un margen de seguridad adecuado (${(stepRatio * 100).toFixed(0)}% del límite). `;
    } else if (stepRatio <= 1) {
      analysis.technicalAnalysis += `La tensión de paso de ${Es.toFixed(1)} V está cerca del límite, requiriendo verificación del espesor de capa superficial. `;
    } else {
      analysis.technicalAnalysis += `La tensión de paso de ${Es.toFixed(1)} V excede el límite, comprometiendo la seguridad de personas. `;
    }
  }

  // Generate summary based on score
  if (scoreResult) {
    analysis.summary = `EVALUACIÓN GLOBAL\n\n`;
    analysis.summary += `Puntuación del Sistema: ${scoreResult.score.toFixed(1)}% (${scoreResult.status})\n\n`;
    
    if (scoreResult.score >= 85) {
      analysis.summary += 'El diseño presenta características excelentes de seguridad y cumple con todos los criterios normativos.';
    } else if (scoreResult.score >= 60) {
      if (GPR > 3000) {
        analysis.summary += 'El diseño cumple con IEEE 80 pero presenta un GPR elevado que requiere atención especial para riesgos externos.';
      } else {
        analysis.summary += 'El diseño es aceptable pero presenta oportunidades de mejora en algunos parámetros.';
      }
    } else if (scoreResult.score >= 40) {
      analysis.summary += 'El diseño requiere mejoras significativas para alcanzar un nivel de seguridad adecuado.';
    } else {
      analysis.summary += 'El diseño presenta condiciones críticas que requieren atención inmediata.';
    }
  }

  // Generate recommendations
  analysis.recommendations = generateTechnicalRecommendations(calculations, params, scoreResult, alerts);

  // Generate conclusion - more honest
  analysis.conclusion = generateConclusion(calculations, scoreResult, alerts);

  return analysis;
}

/**
 * Generate technical recommendations
 * @param {Object} calculations - Calculation results
 * @param {Object} params - Design parameters
 * @param {Object} scoreResult - Score result
 * @param {Array} alerts - Alerts array
 * @returns {Array} Recommendations array
 */
function generateTechnicalRecommendations(calculations, params, scoreResult, alerts) {
  const recommendations = [];
  const Rg = calculations.Rg || calculations.resistance || 0;
  const GPR = calculations.GPR || calculations.gpr || 0;
  const gridArea = params.length * params.width || 0;
  const rodCount = params.numRods || 0;

  // Resistance recommendations
  if (Rg > 5) {
    recommendations.push({
      priority: 'high',
      category: 'Resistencia',
      recommendation: 'Aumentar área de malla o agregar electrodos verticales para reducir resistencia por debajo de 5 Ω'
    });
  } else if (Rg > 3) {
    recommendations.push({
      priority: 'medium',
      category: 'Resistencia',
      recommendation: 'Considerar ampliación de malla para mayor margen de seguridad'
    });
  }

  // GPR recommendations
  if (GPR > 3000) {
    recommendations.push({
      priority: 'high',
      category: 'GPR',
      recommendation: 'Evaluar potencial transferido hacia estructuras externas y considerar blindaje de equipos'
    });
    recommendations.push({
      priority: 'medium',
      category: 'GPR',
      recommendation: 'Coordinar con ingeniería de potencia para revisar valores de corriente de falla'
    });
  }

  // Grid geometry recommendations
  if (gridArea < 100) {
    recommendations.push({
      priority: 'medium',
      category: 'Geometría',
      recommendation: 'Considerar aumentar área de malla para mejorar disipación de corriente'
    });
  }

  if (rodCount === 0 && Rg > 2) {
    recommendations.push({
      priority: 'medium',
      category: 'Electrodos',
      recommendation: 'Agregar electrodos verticales para mejorar disipación en terrenos de alta resistividad'
    });
  }

  // Surface layer recommendations
  const surfaceResistivity = params.surfaceResistivity || params.rho_s || 0;
  if (surfaceResistivity < 1000) {
    recommendations.push({
      priority: 'medium',
      category: 'Capa Superficial',
      recommendation: 'Aumentar resistividad de capa superficial con gravilla o material aislante'
    });
  }

  // Add alerts as recommendations
  if (alerts && alerts.length > 0) {
    alerts.forEach(alert => {
      if (alert.type === 'critical') {
        recommendations.push({
          priority: 'high',
          category: alert.title,
          recommendation: alert.recommendation
        });
      } else if (alert.type === 'warning') {
        recommendations.push({
          priority: 'medium',
          category: alert.title,
          recommendation: alert.recommendation
        });
      }
    });
  }

  return recommendations;
}

/**
 * Generate conclusion
 * @param {Object} calculations - Calculation results
 * @param {Object} scoreResult - Score result
 * @param {Array} alerts - Alerts array
 * @returns {string} Conclusion text
 */
function generateConclusion(calculations, scoreResult, alerts) {
  let conclusion = 'CONCLUSIÓN\n\n';
  
  const complies = calculations.complies || false;
  const GPR = calculations.GPR || calculations.gpr || 0;
  const Rg = calculations.Rg || calculations.resistance || 0;

  if (complies && GPR < 3000 && Rg <= 5) {
    conclusion += 'El diseño del sistema de puesta a tierra es adecuado y cumple con los criterios de seguridad IEEE 80. ';
    conclusion += 'La resistencia de malla y las tensiones de paso y contacto se encuentran dentro de límites aceptables. ';
    conclusion += 'El sistema puede implementarse sin modificaciones adicionales.';
  } else if (complies && GPR >= 3000) {
    conclusion += 'El sistema cumple con los criterios de seguridad de IEEE 80 en cuanto a tensiones de paso y contacto. ';
    conclusion += `Sin embargo, la elevación de potencial (GPR) es elevada (${GPR.toFixed(0)} V), lo que puede generar riesgos de transferencia de potencial hacia estructuras externas o sistemas conectados. `;
    conclusion += 'Se recomienda evaluar la extensión de la malla o la incorporación de electrodos adicionales.';
  } else if (complies) {
    conclusion += 'El diseño cumple con los criterios de seguridad IEEE 80, sin embargo, se recomienda implementar las mejoras sugeridas para aumentar el margen de seguridad. ';
    conclusion += 'Particularmente, se debe monitorear el GPR y evaluar estructuras externas conectadas a la malla.';
  } else {
    conclusion += 'El diseño requiere modificaciones para alcanzar el cumplimiento normativo. ';
    conclusion += 'Se deben implementar las recomendaciones prioritarias antes de proceder con la instalación. ';
    conclusion += 'Una vez mejorado el diseño, se deberá realizar nueva evaluación técnica.';
  }

  return conclusion;
}

/**
 * Generate executive summary (short version)
 * @param {Object} analysis - Full analysis object
 * @returns {string} Executive summary
 */
export function generateExecutiveSummary(analysis) {
  let summary = '';
  
  summary += analysis.safetyStatus + '\n\n';
  summary += analysis.technicalAnalysis + '\n\n';
  summary += 'RECOMENDACIONES PRIORITARIAS:\n';
  
  const priorityRecs = analysis.recommendations.filter(r => r.priority === 'high').slice(0, 3);
  priorityRecs.forEach((rec, i) => {
    summary += `${i + 1}. ${rec.recommendation}\n`;
  });
  
  return summary;
}

/**
 * Generate client-friendly summary
 * @param {Object} calculations - Calculation results
 * @param {Object} scoreResult - Score result
 * @returns {string} Client-friendly summary
 */
export function generateClientSummary(calculations, scoreResult) {
  let summary = 'RESUMEN PARA CLIENTE\n\n';
  
  const complies = calculations.complies || false;
  
  if (complies) {
    summary += '✅ El sistema de puesta a tierra cumple con todas las normas de seguridad vigentes.\n\n';
  } else {
    summary += '⚠️ El sistema requiere ajustes para cumplir con las normas de seguridad.\n\n';
  }
  
  if (scoreResult) {
    summary += `Calificación del Diseño: ${scoreResult.score.toFixed(0)}% (${scoreResult.status})\n\n`;
  }
  
  summary += 'El diseño ha sido evaluado según IEEE Std 80-2013 para garantizar la seguridad de personas y equipos.';
  
  return summary;
}

export default {
  generateAIAnalysis,
  generateExecutiveSummary,
  generateClientSummary
};
