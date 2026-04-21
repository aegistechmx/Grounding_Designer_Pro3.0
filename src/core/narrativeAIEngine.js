/**
 * Dynamic AI Narrative Engine
 * Generates context-aware technical narrative based on actual data
 * Not template-based - reacts to specific values and conditions
 */

export function generateDynamicNarrative(report) {
  const r = report.results;
  const i = report.input;
  const s = report.safety;
  const m = report.metadata;
  
  let narrative = '';
  
  // ============================================
  // RESISTANCE ANALYSIS
  // ============================================
  
  narrative += `El sistema presenta una resistencia de malla de ${r.resistance.toFixed(2)} Ω. `;
  
  if (r.resistance < 1) {
    narrative += 'Este valor es excepcionalmente bajo, indicando una excelente capacidad de disipación de corriente muy superior a los requisitos normativos. ';
  } else if (r.resistance < 2) {
    narrative += 'Este valor indica un excelente desempeño de disipación, muy por debajo del límite recomendado de 5 Ω. ';
  } else if (r.resistance <= 5) {
    narrative += 'Este valor se encuentra dentro del rango aceptable según CFE 01J00-01, proporcionando adecuada disipación de corriente. ';
  } else if (r.resistance <= 10) {
    narrative += 'Este valor excede el límite recomendado de 5 Ω, lo que puede afectar la capacidad de disipación de corriente. ';
  } else {
    narrative += 'Este valor es significativamente alto y requiere intervención inmediata mediante rediseño del sistema. ';
  }
  
  // ============================================
  // GPR ANALYSIS
  // ============================================
  
  narrative += `La elevación de potencial de tierra (GPR) es de ${r.gpr.toFixed(0)} V. `;
  
  if (r.gpr < 1000) {
    narrative += 'La GPR es baja, lo que minimiza riesgos de transferencia de potencial a equipos y estructuras adyacentes. ';
  } else if (r.gpr < 3000) {
    narrative += 'La GPR es moderada, lo que representa un riesgo bajo pero requiere verificación de equipotencialización. ';
  } else if (r.gpr < 5000) {
    narrative += 'La GPR es considerable y requiere medidas adicionales de protección contra transferencia de potencial. ';
  } else {
    narrative += 'La GPR es alta y representa riesgos significativos de transferencia de potencial. Se requieren medidas de mitigación urgentes. ';
  }
  
  // ============================================
  // SAFETY COMPLIANCE
  // ============================================
  
  if (r.complies) {
    narrative += 'El sistema cumple con todos los criterios de seguridad establecidos en IEEE Std 80-2013 para personas de 70 kg. ';
    
    if (safety.margin > 80) {
      narrative += 'El margen de seguridad es superior al 80%, lo que garantiza operación confiable incluso bajo condiciones adversas. ';
    } else if (safety.margin > 50) {
      narrative += 'El margen de seguridad es adecuado para operación normal, pero se recomienda monitoreo periódico. ';
    } else {
      narrative += 'El margen de seguridad es bajo y requiere atención para mantener condiciones seguras de operación. ';
    }
  } else {
    narrative += 'El sistema NO cumple con los criterios de seguridad de IEEE Std 80-2013. ';
    
    if (!r.touchSafe70) {
      narrative += `Las tensiones de contacto (${r.touchVoltage.toFixed(0)} V) exceden el límite permisible de ${r.touchLimit70.toFixed(0)} V. `;
    }
    
    if (!r.stepSafe70) {
      narrative += `Las tensiones de paso (${r.stepVoltage.toFixed(0)} V) exceden el límite permisible de ${r.stepLimit70.toFixed(0)} V. `;
    }
    
    narrative += 'Se requiere rediseño del sistema para alcanzar el cumplimiento normativo. ';
  }
  
  // ============================================
  // SOIL CONDITIONS
  // ============================================
  
  narrative += `Con una resistividad del suelo de ${i.soil.resistivity} Ω·m `;
  
  if (i.soil.resistivity < 50) {
    narrative += '(baja), el sistema opera en condiciones favorables para disipación de corriente. ';
  } else if (i.soil.resistivity <= 200) {
    narrative += '(moderada), el sistema opera en condiciones normales de disipación. ';
  } else if (i.soil.resistivity <= 500) {
    narrative += '(alta), se requieren medidas adicionales para compensar la menor conductividad del suelo. ';
  } else {
    narrative += '(muy alta), el sistema opera en condiciones desfavorables que requieren diseño especializado. ';
  }
  
  // ============================================
  // SURFACE LAYER ANALYSIS
  // ============================================
  
  if (i.soil.surfaceLayer >= 10000 && i.soil.surfaceDepth >= 0.15) {
    narrative += 'La capa superficial de grava cumple con los requisitos de resistividad y espesor, proporcionando adecuada mitigación de tensiones de paso. ';
  } else {
    narrative += 'La capa superficial no cumple con los requisitos mínimos recomendados. Se recomienda aumentar espesor a mínimo 0.15 m con resistividad ≥ 10,000 Ω·m. ';
  }
  
  // ============================================
  // GRID GEOMETRY
  // ============================================
  
  narrative += `La geometría de la malla (${i.grid.length} m × ${i.grid.width} m) `;
  
  const area = i.grid.length * i.grid.width;
  if (area < 200) {
    narrative += 'corresponde a una instalación compacta. ';
  } else if (area < 1000) {
    narrative += 'corresponde a una instalación de tamaño mediano. ';
  } else {
    narrative += 'corresponde a una instalación grande que requiere análisis detallado de distribución de potencial. ';
  }
  
  // ============================================
  // RECOMMENDATIONS (DYNAMIC)
  // ============================================
  
  narrative += '\n\nRECOMENDACIONES:\n\n';
  
  let recommendationsCount = 0;
  
  if (r.resistance > 5) {
    narrative += `• Reducir resistencia de malla mediante aumento de conductores o varillas (actual: ${r.resistance.toFixed(2)} Ω, objetivo: ≤ 5 Ω).\n`;
    recommendationsCount++;
  }
  
  if (!r.touchSafe70) {
    narrative += `• Reducir tensiones de contacto mediante optimización de geometría o mejora de capa superficial (actual: ${r.touchVoltage.toFixed(0)} V, límite: ${r.touchLimit70.toFixed(0)} V).\n`;
    recommendationsCount++;
  }
  
  if (!r.stepSafe70) {
    narrative += `• Reducir tensiones de paso mediante aumento de profundidad de malla o mejora de capa superficial (actual: ${r.stepVoltage.toFixed(0)} V, límite: ${r.stepLimit70.toFixed(0)} V).\n`;
    recommendationsCount++;
  }
  
  if (r.gpr > 5000) {
    narrative += `• Implementar medidas de mitigación para GPR elevado (actual: ${r.gpr.toFixed(0)} V).\n`;
    recommendationsCount++;
  }
  
  if (i.soil.surfaceLayer < 10000 || i.soil.surfaceDepth < 0.15) {
    narrative += '• Mejorar capa superficial con grava de alta resistividad y espesor mínimo 0.15 m.\n';
    recommendationsCount++;
  }
  
  if (recommendationsCount === 0) {
    narrative += '• El diseño cumple con todos los requisitos. Se recomienda mantenimiento periódico y validación mediante pruebas de campo.\n';
  }
  
  // ============================================
  // CONCLUSION (DYNAMIC)
  // ============================================
  
  narrative += '\n\nCONCLUSIÓN:\n\n';
  
  if (r.complies && r.resistance <= 5 && s.margin > 50) {
    narrative += 'El diseño es técnicamente óptimo y cumple con todos los criterios de seguridad. El sistema es apto para implementación inmediata conforme a los parámetros especificados. ';
  } else if (r.complies) {
    narrative += 'El diseño cumple con los criterios de seguridad pero presenta margen de mejora. Se recomienda implementar con validación de campo y monitoreo periódico. ';
  } else {
    narrative += 'El diseño requiere modificaciones para alcanzar el cumplimiento normativo completo. Una vez implementadas las recomendaciones especificadas, se deberá realizar una nueva evaluación. ';
  }
  
  narrative += `Proyecto: ${m.project} | Ingeniero: ${m.engineer} | Fecha: ${new Date(m.date).toLocaleDateString('es-MX')}`;
  
  return narrative;
}

/**
 * Generates a summary of key findings
 * @param {Object} report - Full report object
 * @returns {string} Summary text
 */
export function generateSummary(report) {
  const r = report.results;
  const s = report.safety;
  
  const findings = [];
  
  findings.push({
    category: 'Resistencia',
    value: `${r.resistance.toFixed(2)} Ω`,
    status: r.resistance <= 5 ? 'Aceptable' : 'Excesivo'
  });
  
  findings.push({
    category: 'GPR',
    value: `${r.gpr.toFixed(0)} V`,
    status: r.gpr < 5000 ? 'Aceptable' : 'Alto'
  });
  
  findings.push({
    category: 'Tensión Contacto',
    value: `${r.touchVoltage.toFixed(0)} V`,
    status: r.touchSafe70 ? 'Cumple' : 'No cumple'
  });
  
  findings.push({
    category: 'Tensión Paso',
    value: `${r.stepVoltage.toFixed(0)} V`,
    status: r.stepSafe70 ? 'Cumple' : 'No cumple'
  });
  
  findings.push({
    category: 'Margen Seguridad',
    value: `${s.margin.toFixed(1)}%`,
    status: s.margin > 50 ? 'Adecuado' : 'Bajo'
  });
  
  let summary = 'RESUMEN DE HALLAZGOS:\n\n';
  findings.forEach(f => {
    summary += `• ${f.category}: ${f.value} - ${f.status}\n`;
  });
  
  summary += `\nEstado General: ${r.complies ? 'CUMPLE IEEE 80' : 'NO CUMPLE IEEE 80'}`;
  
  return summary;
}

/**
 * Generates specific recommendations based on issues found
 * @param {Object} report - Full report object
 * @returns {Array} Array of recommendation objects
 */
export function generateSpecificRecommendations(report) {
  const r = report.results;
  const i = report.input;
  const recommendations = [];
  
  // Resistance issues
  if (r.resistance > 5) {
    recommendations.push({
      priority: 'high',
      category: 'Resistencia',
      issue: `Resistencia de malla excesiva (${r.resistance.toFixed(2)} Ω)`,
      action: 'Aumentar número de conductores o varillas para reducir resistencia a ≤ 5 Ω',
      expectedImpact: 'Mejora disipación de corriente y cumplimiento CFE'
    });
  }
  
  // Touch voltage issues
  if (!r.touchSafe70) {
    recommendations.push({
      priority: 'critical',
      category: 'Seguridad',
      issue: `Tensión de contacto excede límite (${r.touchVoltage.toFixed(0)} V vs ${r.touchLimit70.toFixed(0)} V)`,
      action: 'Optimizar geometría de malla o mejorar capa superficial',
      expectedImpact: 'Cumplimiento IEEE 80 para seguridad de personas'
    });
  }
  
  // Step voltage issues
  if (!r.stepSafe70) {
    recommendations.push({
      priority: 'critical',
      category: 'Seguridad',
      issue: `Tensión de paso excede límite (${r.stepVoltage.toFixed(0)} V vs ${r.stepLimit70.toFixed(0)} V)`,
      action: 'Aumentar profundidad de malla o mejorar capa superficial',
      expectedImpact: 'Cumplimiento IEEE 80 para seguridad de personas'
    });
  }
  
  // GPR issues
  if (r.gpr > 5000) {
    recommendations.push({
      priority: 'high',
      category: 'GPR',
      issue: `GPR elevado (${r.gpr.toFixed(0)} V)`,
      action: 'Implementar medidas de equipotencialización y aislamiento',
      expectedImpact: 'Reducción de riesgos de transferencia de potencial'
    });
  }
  
  // Surface layer issues
  if (i.soil.surfaceLayer < 10000 || i.soil.surfaceDepth < 0.15) {
    recommendations.push({
      priority: 'medium',
      category: 'Capa Superficial',
      issue: 'Capa superficial inadecuada',
      action: 'Instalar grava con resistividad ≥ 10,000 Ω·m y espesor ≥ 0.15 m',
      expectedImpact: 'Mitigación de tensiones de paso'
    });
  }
  
  // If no issues
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      category: 'Mantenimiento',
      issue: 'Diseño cumple requisitos',
      action: 'Implementar programa de mantenimiento y validación periódica',
      expectedImpact: 'Mantenimiento de condiciones seguras de operación'
    });
  }
  
  return recommendations;
}

export default {
  generateDynamicNarrative,
  generateSummary,
  generateSpecificRecommendations
};
