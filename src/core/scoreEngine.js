/**
 * Smart Score Engine
 * Converts all grounding system results into a single professional score
 */

/**
 * Calculate comprehensive safety score (0-100) with weighted scoring
 * @param {Object} calculations - Calculation results
 * @returns {Object} Score object with value, color, and breakdown
 */
export function calculateSmartScore(calculations) {
  let score = 100;
  const breakdown = {
    resistance: { weight: 10, score: 10, impact: '' },
    gpr: { weight: 20, score: 20, impact: '' },
    touchVoltage: { weight: 35, score: 35, impact: '' },
    stepVoltage: { weight: 35, score: 35, impact: '' }
  };

  const Rg = calculations.Rg || calculations.resistance || 0;
  const GPR = calculations.GPR || calculations.gpr || 0;
  const Em = calculations.Em || calculations.touchVoltage || 0;
  const Es = calculations.Es || calculations.stepVoltage || 0;
  const Etouch70 = calculations.Etouch70 || calculations.touchLimit70 || 0;
  const Estep70 = calculations.Estep70 || calculations.stepLimit70 || 0;

  // Resistance score (0-10 points) - lower weight as it's less critical than safety
  if (Rg > 5) {
    const penalty = Math.min(10, (Rg - 5) * 2);
    breakdown.resistance.score = Math.max(0, 10 - penalty);
    breakdown.resistance.impact = `Rg de ${isFinite(Rg) ? Rg.toFixed(2) : 'N/A'} Ω excede el límite de 5 Ω`;
  } else if (Rg > 3) {
    breakdown.resistance.score = 8;
    breakdown.resistance.impact = 'Rg aceptable pero mejorable';
  } else {
    breakdown.resistance.score = 10;
    breakdown.resistance.impact = 'Rg óptimo';
  }

  // GPR score (0-20 points) - important for external risks
  if (GPR > 3000) {
    const penalty = Math.min(20, (GPR - 3000) / 200);
    breakdown.gpr.score = Math.max(0, 20 - penalty);
    breakdown.gpr.impact = `GPR elevado (${isFinite(GPR) ? GPR.toFixed(0) : 'N/A'} V) - riesgo de transferencia de potencial`;
  } else if (GPR > 2000) {
    breakdown.gpr.score = 15;
    breakdown.gpr.impact = 'GPR moderado - monitorear estructuras externas';
  } else {
    breakdown.gpr.score = 20;
    breakdown.gpr.impact = 'GPR dentro de rango seguro';
  }

  // Touch voltage score (0-35 points) - highest weight for safety
  if (Etouch70 > 0) {
    const touchRatio = Em / Math.max(1, Etouch70);
    if (touchRatio > 1) {
      const penalty = Math.min(35, (touchRatio - 1) * 50);
      breakdown.touchVoltage.score = Math.max(0, 35 - penalty);
      breakdown.touchVoltage.impact = `Tensión de contacto excede límite (${isFinite(touchRatio * 100) ? (touchRatio * 100).toFixed(0) : 'N/A'}%)`;
    } else if (touchRatio > 0.8) {
      breakdown.touchVoltage.score = 25;
      breakdown.touchVoltage.impact = 'Tensión de contacto cerca del límite';
    } else if (touchRatio > 0.5) {
      breakdown.touchVoltage.score = 30;
      breakdown.touchVoltage.impact = 'Tensión de contacto aceptable';
    } else {
      breakdown.touchVoltage.score = 35;
      breakdown.touchVoltage.impact = 'Tensión de contacto óptima';
    }
  } else {
    breakdown.touchVoltage.score = 35;
    breakdown.touchVoltage.impact = 'Sin datos de límite';
  }

  // Step voltage score (0-35 points) - highest weight for safety
  if (Estep70 > 0) {
    const stepRatio = Es / Math.max(1, Estep70);
    if (stepRatio > 1) {
      const penalty = Math.min(35, (stepRatio - 1) * 50);
      breakdown.stepVoltage.score = Math.max(0, 35 - penalty);
      breakdown.stepVoltage.impact = `Tensión de paso excede límite (${isFinite(stepRatio * 100) ? (stepRatio * 100).toFixed(0) : 'N/A'}%)`;
    } else if (stepRatio > 0.8) {
      breakdown.stepVoltage.score = 25;
      breakdown.stepVoltage.impact = 'Tensión de paso cerca del límite';
    } else if (stepRatio > 0.5) {
      breakdown.stepVoltage.score = 30;
      breakdown.stepVoltage.impact = 'Tensión de paso aceptable';
    } else {
      breakdown.stepVoltage.score = 35;
      breakdown.stepVoltage.impact = 'Tensión de paso óptima';
    }
  } else {
    breakdown.stepVoltage.score = 35;
    breakdown.stepVoltage.impact = 'Sin datos de límite';
  }

  // Calculate total score
  score = Object.values(breakdown).reduce((sum, item) => sum + item.score, 0);

  return {
    score: Math.max(0, Math.min(100, score)),
    color: getScoreColor(score),
    status: getScoreStatus(score),
    breakdown
  };
}

/**
 * Get color based on score
 * @param {number} score - Score value (0-100)
 * @returns {string} Color name or RGB array
 */
export function getScoreColor(score) {
  if (score >= 85) return 'green';
  if (score >= 60) return 'orange';
  return 'red';
}

/**
 * Get RGB color array based on score
 * @param {number} score - Score value (0-100)
 * @returns {Array} RGB color array
 */
export function getScoreColorRGB(score) {
  if (score >= 85) return [34, 197, 94]; // green
  if (score >= 60) return [234, 179, 8]; // orange
  return [239, 68, 68]; // red
}

/**
 * Get status text based on score
 * @param {number} score - Score value (0-100)
 * @returns {string} Status text
 */
export function getScoreStatus(score) {
  if (score >= 85) return 'Excelente';
  if (score >= 60) return 'Aceptable';
  if (score >= 40) return 'Requiere Mejora';
  return 'Crítico';
}

/**
 * Get recommendations based on score breakdown
 * @param {Object} scoreResult - Result from calculateSmartScore
 * @returns {Array} Recommendations array
 */
export function getScoreRecommendations(scoreResult) {
  const recommendations = [];
  const { breakdown } = scoreResult;

  if (breakdown.resistance.score < 15) {
    recommendations.push({
      priority: 'high',
      type: 'resistance',
      message: 'Considerar aumentar área de malla o agregar electrodos verticales para reducir resistencia'
    });
  }

  if (breakdown.gpr.score < 15) {
    recommendations.push({
      priority: 'high',
      type: 'gpr',
      message: 'Evaluar potencial transferido hacia estructuras externas y considerar blindaje'
    });
  }

  if (breakdown.touchVoltage.score < 20) {
    recommendations.push({
      priority: 'high',
      type: 'touch',
      message: 'Aumentar espaciamiento de conductores o agregar capa superficial de alta resistividad'
    });
  }

  if (breakdown.stepVoltage.score < 20) {
    recommendations.push({
      priority: 'medium',
      type: 'step',
      message: 'Mejorar distribución de conductores o agregar gravilla en superficie'
    });
  }

  return recommendations;
}

export default {
  calculateSmartScore,
  getScoreColor,
  getScoreColorRGB,
  getScoreStatus,
  getScoreRecommendations
};
