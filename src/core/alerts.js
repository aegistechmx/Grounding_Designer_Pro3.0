/**
 * Intelligent Alerts Engine
 * Generates contextual alerts based on grounding system results
 */

/**
 * Generate intelligent alerts based on calculations
 * @param {Object} calculations - Calculation results
 * @param {Object} params - Design parameters
 * @returns {Array} Array of alert objects
 */
export function generateAlerts(calculations, params) {
  const alerts = [];
  
  const Rg = calculations.Rg || calculations.resistance || 0;
  const GPR = calculations.GPR || calculations.gpr || 0;
  const Em = calculations.Em || calculations.touchVoltage || 0;
  const Es = calculations.Es || calculations.stepVoltage || 0;
  const Etouch70 = calculations.Etouch70 || calculations.touchLimit70 || 0;
  const Estep70 = calculations.Estep70 || calculations.stepLimit70 || 0;
  const faultCurrent = calculations.gridCurrent || calculations.If || 0;
  const soilResistivity = params.resistivity || params.rho || 0;

  // GPR Alert
  if (GPR > 3000) {
    alerts.push({
      type: 'critical',
      icon: '⚠️',
      title: 'GPR Elevado',
      message: `GPR de ${GPR.toFixed(0)} V excede umbral seguro (3000 V)`,
      impact: 'Riesgo de transferencia de potencial hacia estructuras externas',
      recommendation: 'Evaluar blindaje de estructuras y cables conectados a la malla'
    });
  } else if (GPR > 2000) {
    alerts.push({
      type: 'warning',
      icon: '⚡',
      title: 'GPR Moderado',
      message: `GPR de ${GPR.toFixed(0)} V requiere monitoreo`,
      impact: 'Posible afectación a equipos sensibles',
      recommendation: 'Verificar coordinación de aislamiento de equipos'
    });
  }

  // Resistance Alert
  if (Rg > 5) {
    alerts.push({
      type: 'critical',
      icon: '❌',
      title: 'Resistencia Excesiva',
      message: `Rg de ${Rg.toFixed(2)} Ω excede límite IEEE 80 (5 Ω)`,
      impact: 'Sistema no cumple con normatividad',
      recommendation: 'Aumentar área de malla o agregar electrodos verticales'
    });
  } else if (Rg > 3) {
    alerts.push({
      type: 'info',
      icon: '💡',
      title: 'Resistencia Mejorable',
      message: `Rg de ${Rg.toFixed(2)} Ω puede optimizarse`,
      impact: 'Oportunidad de mejora en diseño',
      recommendation: 'Considerar ampliación de malla para mayor margen de seguridad'
    });
  }

  // Touch Voltage Alert
  if (Etouch70 > 0) {
    const touchRatio = Em / Etouch70;
    if (touchRatio > 1) {
      alerts.push({
        type: 'critical',
        icon: '🚨',
        title: 'Tensión de Contacto Crítica',
        message: `Em de ${Em.toFixed(1)} V excede límite de ${Etouch70.toFixed(1)} V`,
        impact: 'Riesgo directo a seguridad de personas',
        recommendation: 'Aumentar espaciamiento de conductores o agregar capa superficial'
      });
    } else if (touchRatio > 0.8) {
      alerts.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Tensión de Contacto Alta',
        message: `Em de ${Em.toFixed(1)} V cerca del límite`,
        impact: 'Margen de seguridad reducido',
        recommendation: 'Monitorear condiciones de superficie y capa de grava'
      });
    }
  }

  // Step Voltage Alert
  if (Estep70 > 0) {
    const stepRatio = Es / Estep70;
    if (stepRatio > 1) {
      alerts.push({
        type: 'critical',
        icon: '🚨',
        title: 'Tensión de Paso Crítica',
        message: `Es de ${Es.toFixed(1)} V excede límite de ${Estep70.toFixed(1)} V`,
        impact: 'Riesgo de electrocución por paso',
        recommendation: 'Mejorar distribución de conductores y agregar material superficial'
      });
    } else if (stepRatio > 0.8) {
      alerts.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Tensión de Paso Alta',
        message: `Es de ${Es.toFixed(1)} V cerca del límite`,
        impact: 'Margen de seguridad reducido',
        recommendation: 'Verificar espesor de capa de grava y resistividad superficial'
      });
    }
  }

  // Soil Resistivity Alert
  if (soilResistivity > 3000) {
    alerts.push({
      type: 'info',
      icon: '🌍',
      title: 'Resistividad Alta',
      message: `Resistividad del suelo de ${soilResistivity.toFixed(0)} Ω·m`,
      impact: 'Diseño desafiante por condiciones de terreno',
      recommendation: 'Validar medición in-situ, considerar tratamiento químico'
    });
  } else if (soilResistivity < 50) {
    alerts.push({
      type: 'info',
      icon: '💧',
      title: 'Resistividad Baja',
      message: `Resistividad del suelo de ${soilResistivity.toFixed(0)} Ω·m`,
      impact: 'Posible presencia de agua o conductividad alta',
      recommendation: 'Verificar condiciones de drenaje y estación del año'
    });
  }

  // Fault Current Alert
  if (faultCurrent > 20000) {
    alerts.push({
      type: 'warning',
      icon: '⚡',
      title: 'Corriente de Falla Alta',
      message: `Corriente de falla de ${(faultCurrent / 1000).toFixed(1)} kA`,
      impact: 'Elevada energía inyectada a la malla',
      recommendation: 'Verificar capacidad térmica de conductores'
    });
  }

  // Grid Depth Alert
  const gridDepth = params.gridDepth || params.depth || 0.5;
  if (gridDepth < 0.3) {
    alerts.push({
      type: 'info',
      icon: '📏',
      title: 'Profundidad de Malla Baja',
      message: `Profundidad de ${gridDepth.toFixed(2)} m puede afectar seguridad`,
      impact: 'Menor efectividad de capa superficial',
      recommendation: 'Considerar aumentar profundidad a 0.5-0.8 m'
    });
  }

  // Conductor Spacing Alert
  const spacing = params.spacing || 10;
  if (spacing > 15) {
    alerts.push({
      type: 'info',
      icon: '📐',
      title: 'Espaciamiento Amplio',
      message: `Espaciamiento de ${spacing.toFixed(1)} m entre conductores`,
      impact: 'Puede aumentar tensiones de paso y contacto',
      recommendation: 'Reducir espaciamiento o agregar conductores adicionales'
    });
  }

  return alerts;
}

/**
 * Get alert priority score
 * @param {Array} alerts - Array of alert objects
 * @returns {Object} Priority summary
 */
export function getAlertPrioritySummary(alerts) {
  const summary = {
    critical: 0,
    warning: 0,
    info: 0,
    total: alerts.length
  };

  alerts.forEach(alert => {
    if (alert.type === 'critical') summary.critical++;
    else if (alert.type === 'warning') summary.warning++;
    else if (alert.type === 'info') summary.info++;
  });

  return summary;
}

/**
 * Get overall alert status
 * @param {Object} summary - Alert priority summary
 * @returns {string} Overall status
 */
export function getOverallAlertStatus(summary) {
  if (summary.critical > 0) return 'critical';
  if (summary.warning > 0) return 'warning';
  if (summary.info > 0) return 'info';
  return 'ok';
}

/**
 * Get global status for the system
 * @param {Object} calculations - Calculation results
 * @returns {Object} Global status object
 */
export function getGlobalStatus(calculations) {
  const GPR = calculations.GPR || calculations.gpr || 0;
  const complies = calculations.complies || false;

  if (GPR > 3000) {
    return {
      status: 'ADVERTENCIA',
      color: 'orange',
      colorRGB: [234, 179, 8],
      msg: 'GPR elevado puede generar riesgos fuera de la malla'
    };
  }

  if (!complies) {
    return {
      status: 'CRÍTICO',
      color: 'red',
      colorRGB: [239, 68, 68],
      msg: 'No cumple IEEE 80'
    };
  }

  return {
    status: 'SEGURO',
    color: 'green',
    colorRGB: [34, 197, 94],
    msg: 'Diseño dentro de límites seguros'
  };
}

/**
 * Get priority alert (most critical issue)
 * @param {Object} calculations - Calculation results
 * @returns {string|null} Priority alert message
 */
export function getPriorityAlert(calculations) {
  const GPR = calculations.GPR || calculations.gpr || 0;
  const Rg = calculations.Rg || calculations.resistance || 0;
  const Em = calculations.Em || calculations.touchVoltage || 0;
  const Es = calculations.Es || calculations.stepVoltage || 0;
  const Etouch70 = calculations.Etouch70 || calculations.touchLimit70 || 0;
  const Estep70 = calculations.Estep70 || calculations.stepLimit70 || 0;

  if (GPR > 3000) {
    return '⚠️ GPR elevado: evaluar transferencia de potencial a estructuras externas';
  }

  if (!calculations.complies) {
    return '🚨 El diseño no cumple con IEEE 80 - requiere modificaciones';
  }

  if (Etouch70 > 0 && Em > Etouch70) {
    return '⚠️ Tensión de contacto excede límite seguro';
  }

  if (Estep70 > 0 && Es > Estep70) {
    return '⚠️ Tensión de paso excede límite seguro';
  }

  if (Rg > 5) {
    return '💡 Resistencia mejorable con mayor área de malla';
  }

  return null;
}

export default {
  generateAlerts,
  getAlertPrioritySummary,
  getOverallAlertStatus,
  getGlobalStatus,
  getPriorityAlert
};
