/**
 * Motor de Narrativa Automática
 * Genera conclusiones técnicas automáticas en lenguaje de ingeniería
 */

export function generateNarrative(report) {
  const { results, safety, input, normative } = report;
  const conclusions = [];
  const warnings = [];
  const recommendations = [];

  // Análisis de cumplimiento
  if (results.complies) {
    conclusions.push(
      "El sistema de puesta a tierra cumple con los criterios de seguridad establecidos en IEEE Std 80-2013 para personas de 70 kg."
    );
    conclusions.push(
      "Todas las tensiones calculadas (contacto y paso) se encuentran dentro de los límites permisibles."
    );
  } else {
    conclusions.push(
      "El sistema NO cumple con los criterios de seguridad de IEEE Std 80-2013 y requiere rediseño."
    );
    warnings.push(
      "Se identificaron tensiones que exceden los límites permisibles, representando un riesgo para la seguridad."
    );
  }

  // Análisis de resistencia
  if (results.resistance <= 2) {
    conclusions.push(
      `La resistencia de malla (${results.resistance.toFixed(2)} Ω) es excelente, muy por debajo del límite recomendado de 5 Ω.`
    );
  } else if (results.resistance <= 5) {
    conclusions.push(
      `La resistencia de malla (${results.resistance.toFixed(2)} Ω) es adecuada para disipación de corriente según CFE 01J00-01.`
    );
  } else {
    warnings.push(
      `La resistencia de malla (${results.resistance.toFixed(2)} Ω) excede el límite de 5 Ω recomendado por CFE 01J00-01.`
    );
    recommendations.push(
      "Considere aumentar el número de conductores o varillas para reducir la resistencia."
    );
  }

  // Análisis de margen de seguridad
  if (safety.margin > 80) {
    conclusions.push(
      "El sistema presenta un margen de seguridad alto, lo cual garantiza operación confiable y tolerancia a variaciones."
    );
  } else if (safety.margin > 50) {
    conclusions.push(
      "El sistema presenta un margen de seguridad aceptable, adecuado para operación normal."
    );
  } else if (safety.margin > 20) {
    warnings.push(
      `El margen de seguridad es bajo (${safety.margin.toFixed(1)}%), lo que requiere monitoreo y mantenimiento periódico.`
    );
  } else {
    warnings.push(
      "El margen de seguridad es críticamente bajo. Se recomienda rediseñar el sistema."
    );
  }

  // Análisis de GPR
  if (results.gpr < 5000) {
    conclusions.push(
      `La elevación de potencial de tierra (GPR = ${results.gpr.toFixed(0)} V) es baja, minimizando riesgos de transferencia de potencial.`
    );
  } else if (results.gpr < 10000) {
    conclusions.push(
      `La elevación de potencial de tierra (GPR = ${results.gpr.toFixed(0)} V) es moderada. Se recomienda verificar equipotencialización.`
    );
  } else {
    warnings.push(
      `La elevación de potencial de tierra (GPR = ${results.gpr.toFixed(0)} V) es alta. Se requieren medidas adicionales de protección.`
    );
    recommendations.push(
      "Implemente sistema de equipotencialización completo para todos los equipos metálicos."
    );
  }

  // Análisis de capa superficial
  if (input.soil.surfaceLayer >= 10000 && input.soil.surfaceDepth >= 0.15) {
    conclusions.push(
      "La capa superficial de grava cumple con los requisitos de resistividad y espesor para mitigar tensiones de paso."
    );
  } else {
    warnings.push(
      "La capa superficial no cumple con los requisitos mínimos recomendados."
    );
    recommendations.push(
      "Aumente el espesor de la capa de grava a mínimo 0.15 m con resistividad ≥ 10,000 Ω·m."
    );
  }

  // Recomendaciones generales
  recommendations.push(
    "Se recomienda validar condiciones reales mediante pruebas de campo (método Wenner) antes de la construcción."
  );
  recommendations.push(
    "Realice pruebas de resistencia de malla post-construcción y compare con valores de diseño."
  );
  recommendations.push(
    "Mantenga un programa de mantenimiento y monitoreo periódico según NOM-022-STPS-2015."
  );
  recommendations.push(
    "Documente todas las modificaciones y mantenga actualizados los planos as-built."
  );

  return {
    conclusions,
    warnings,
    recommendations,
    summary: generateSummary(conclusions, warnings, recommendations)
  };
}

function generateSummary(conclusions, warnings, recommendations) {
  if (warnings.length === 0) {
    return "El diseño cumple con todos los requisitos normativos y presenta márgenes de seguridad adecuados.";
  } else if (warnings.length <= 2) {
    return "El diseño cumple con requisitos básicos pero requiere atención en áreas específicas.";
  } else {
    return "El diseño requiere mejoras significativas para alcanzar el cumplimiento normativo completo.";
  }
}

export default { generateNarrative };
