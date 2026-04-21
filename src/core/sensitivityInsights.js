/**
 * Sensitivity Insights Engine
 * Generates engineering insights from sensitivity analysis data
 */

/**
 * Generate insights from sensitivity data
 * @param {Array} sensitivityData - Array of sensitivity analysis results
 * @returns {Object} Insights object with critical and least critical parameters
 */
export function getSensitivityInsights(sensitivityData) {
  if (!sensitivityData || sensitivityData.length === 0) {
    return {
      critical: null,
      least: null,
      analysis: 'Sin datos de sensibilidad'
    };
  }

  // Find most critical parameter (highest impact)
  const critical = sensitivityData.reduce((max, item) => {
    const impact = item.impact || item.value || 0;
    const maxImpact = max.impact || max.value || 0;
    return impact > maxImpact ? item : max;
  }, sensitivityData[0]);

  // Find least critical parameter (lowest impact)
  const least = sensitivityData.reduce((min, item) => {
    const impact = item.impact || item.value || 0;
    const minImpact = min.impact || min.value || 0;
    return impact < minImpact ? item : min;
  }, sensitivityData[0]);

  const criticalName = critical.name || critical.parameter || 'Desconocido';
  const leastName = least.name || least.parameter || 'Desconocido';

  return {
    critical: {
      name: criticalName,
      value: critical.value || critical.impact || 0,
      impact: (critical.value || critical.impact || 0) * 100,
      action: getSensitivityAction(criticalName)
    },
    least: {
      name: leastName,
      value: least.value || least.impact || 0,
      impact: (least.value || least.impact || 0) * 100
    },
    analysis: generateSensitivityAnalysis(critical, least)
  };
}

/**
 * Generate textual analysis from sensitivity data
 * @param {Object} critical - Most critical parameter
 * @param {Object} least - Least critical parameter
 * @returns {string} Textual analysis
 */
export function generateSensitivityAnalysis(critical, least) {
  let analysis = '';

  if (critical && critical.impact > 0.3) {
    analysis += `El parámetro más crítico es ${critical.name} con un impacto del ${(critical.impact).toFixed(0)}%. `;
    
    if (critical.name.toLowerCase().includes('resistiv')) {
      analysis += 'Se recomienda validar la medición in-situ ya que impacta directamente en la seguridad del sistema. ';
    } else if (critical.name.toLowerCase().includes('corrient')) {
      analysis += 'Se sugiere revisar la coordinación con el sistema de potencia. ';
    } else if (critical.name.toLowerCase().includes('duración')) {
      analysis += 'Considerar ajustar la duración de falla según las protecciones del sistema. ';
    }
  }

  if (least && least.impact < 0.1) {
    analysis += `El parámetro ${least.name} tiene un impacto mínimo (${(least.impact).toFixed(0)}%) y no requiere ajustes significativos. `;
  }

  return analysis || 'Sin análisis disponible';
}

/**
 * Get direct action recommendation for a sensitivity parameter
 * @param {string} paramName - Parameter name
 * @returns {string} Action recommendation
 */
export function getSensitivityAction(paramName) {
  const lowerName = paramName.toLowerCase();
  
  if (lowerName.includes('resistiv')) {
    return 'Validar medición Wenner, posible error impacta todo el diseño';
  }
  
  if (lowerName.includes('corrient')) {
    return 'Coordinar con ingeniería de potencia para confirmar valor';
  }
  
  if (lowerName.includes('área') || lowerName.includes('malla')) {
    return 'Evaluar optimización de geometría para mejorar relación costo-beneficio';
  }
  
  if (lowerName.includes('profundidad')) {
    return 'Considerar profundidad de 0.5-0.8 m para mejorar efectividad';
  }
  
  if (lowerName.includes('duración') || lowerName.includes('tiempo')) {
    return 'Verificar ajuste de relés y coordinación de protecciones';
  }
  
  return 'Revisar parámetro con ingeniería especializada';
}

/**
 * Generate engineering recommendations based on sensitivity
 * @param {Object} insights - Insights from getSensitivityInsights
 * @returns {Array} Recommendations array
 */
export function getSensitivityRecommendations(insights) {
  const recommendations = [];

  if (insights.critical && insights.critical.impact > 30) {
    const name = insights.critical.name.toLowerCase();
    
    if (name.includes('resistiv')) {
      recommendations.push({
        priority: 'high',
        parameter: insights.critical.name,
        recommendation: 'Realizar múltiples mediciones de resistividad en diferentes puntos del terreno para validar homogeneidad'
      });
    } else if (name.includes('corrient')) {
      recommendations.push({
        priority: 'medium',
        parameter: insights.critical.name,
        recommendation: 'Coordinar con ingeniería de potencia para confirmar valor de corriente de falla'
      });
    } else if (name.includes('área') || name.includes('malla')) {
      recommendations.push({
        priority: 'high',
        parameter: insights.critical.name,
        recommendation: 'Evaluar optimización de geometría de malla para mejorar relación costo-beneficio'
      });
    } else if (name.includes('profundidad')) {
      recommendations.push({
        priority: 'medium',
        parameter: insights.critical.name,
        recommendation: 'Considerar profundidad de 0.5-0.8 m para mejorar efectividad de capa superficial'
      });
    }
  }

  return recommendations;
}

/**
 * Calculate parameter importance ranking
 * @param {Array} sensitivityData - Sensitivity analysis data
 * @returns {Array} Ranked parameters
 */
export function rankParametersByImportance(sensitivityData) {
  if (!sensitivityData || sensitivityData.length === 0) {
    return [];
  }

  return [...sensitivityData]
    .map(item => ({
      name: item.name || item.parameter || 'Desconocido',
      impact: (item.value || item.impact || 0) * 100,
      category: getParameterCategory(item.name || item.parameter)
    }))
    .sort((a, b) => b.impact - a.impact);
}

/**
 * Get parameter category
 * @param {string} name - Parameter name
 * @returns {string} Category
 */
function getParameterCategory(name) {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('resistiv')) return 'Suelo';
  if (lowerName.includes('corrient')) return 'Sistema';
  if (lowerName.includes('área') || lowerName.includes('malla') || lowerName.includes('conductor')) return 'Geometría';
  if (lowerName.includes('profundidad')) return 'Geometría';
  if (lowerName.includes('duración') || lowerName.includes('tiempo')) return 'Sistema';
  
  return 'General';
}

/**
 * Generate sensitivity summary for dashboard
 * @param {Object} insights - Insights object
 * @returns {Object} Summary for dashboard display
 */
export function getSensitivityDashboardSummary(insights) {
  const summary = {
    criticalParameter: insights.critical ? insights.critical.name : 'N/A',
    criticalImpact: insights.critical ? insights.critical.impact : 0,
    leastParameter: insights.least ? insights.least.name : 'N/A',
    leastImpact: insights.least ? insights.least.impact : 0,
    recommendation: ''
  };

  if (insights.critical && insights.critical.impact > 30) {
    summary.recommendation = `Priorizar ajuste de ${insights.critical.name}`;
  } else if (insights.critical) {
    summary.recommendation = 'Parámetros dentro de rango aceptable';
  }

  return summary;
}

export default {
  getSensitivityInsights,
  generateSensitivityAnalysis,
  getSensitivityRecommendations,
  rankParametersByImportance,
  getSensitivityDashboardSummary
};
