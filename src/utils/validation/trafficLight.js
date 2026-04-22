/**
 * Traffic Light Indicators
 * Smart status indicators for KPI cards and compliance
 */

import { theme, getTrafficLightColor, getPercentageColor } from './theme';

/**
 * Get indicator color based on value vs limit
 * @param {number} value - Current value
 * @param {number} limit - Limit value
 * @param {boolean} lowerIsBetter - If true, lower values are better
 * @returns {Array} RGB color array
 */
export function getIndicatorColor(value, limit, lowerIsBetter = true) {
  if (limit === 0) return theme.warning;
  
  const ratio = value / limit;
  
  if (lowerIsBetter) {
    if (ratio < 0.5) return theme.success;
    if (ratio < 0.9) return theme.warning;
    return theme.danger;
  } else {
    // For metrics where higher is better (e.g., safety margin)
    if (ratio > 0.8) return theme.success;
    if (ratio > 0.5) return theme.warning;
    return theme.danger;
  }
}

/**
 * Get status text based on color
 * @param {Array} color - RGB color array
 * @returns {string} Status text
 */
export function getStatusText(color) {
  if (!color || color.length < 3) return 'Desconocido';
  if (color[0] === theme.success[0] && color[1] === theme.success[1] && color[2] === theme.success[2]) {
    return 'Excelente';
  }
  if (color[0] === theme.warning[0] && color[1] === theme.warning[1] && color[2] === theme.warning[2]) {
    return 'Aceptable';
  }
  if (color[0] === theme.danger[0] && color[1] === theme.danger[1] && color[2] === theme.danger[2]) {
    return 'Crítico';
  }
  return 'Desconocido';
}

/**
 * Get status icon based on color
 * @param {Array} color - RGB color array
 * @returns {string} Status icon
 */
export function getStatusIcon(color) {
  if (!color || color.length < 3) return '?';
  if (color[0] === theme.success[0] && color[1] === theme.success[1] && color[2] === theme.success[2]) {
    return '✓';
  }
  if (color[0] === theme.warning[0] && color[1] === theme.warning[1] && color[2] === theme.warning[2]) {
    return '⚠';
  }
  if (color[0] === theme.danger[0] && color[1] === theme.danger[1] && color[2] === theme.danger[2]) {
    return '✗';
  }
  return '?';
}

/**
 * Calculate compliance score (0-100)
 * @param {Object} calculations - Calculation results
 * @returns {number} Compliance score
 */
export function calculateComplianceScore(calculations) {
  let score = 100;
  let factors = 0;
  
  // Resistance factor
  if (calculations.Rg) {
    factors++;
    const rgRatio = calculations.Rg / 5; // 5 Ω limit
    if (rgRatio > 1.5) score -= 40;
    else if (rgRatio > 1.0) score -= 20;
    else if (rgRatio > 0.5) score -= 10;
  }
  
  // Touch voltage factor
  if (calculations.Em && calculations.Etouch70 && calculations.Etouch70 > 0) {
    factors++;
    const touchRatio = calculations.Em / calculations.Etouch70;
    if (touchRatio > 1.2) score -= 30;
    else if (touchRatio > 1.0) score -= 15;
    else if (touchRatio > 0.8) score -= 5;
  }
  
  // Step voltage factor
  if (calculations.Es && calculations.Estep70 && calculations.Estep70 > 0) {
    factors++;
    const stepRatio = calculations.Es / calculations.Estep70;
    if (stepRatio > 1.2) score -= 30;
    else if (stepRatio > 1.0) score -= 15;
    else if (stepRatio > 0.8) score -= 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Get overall status from calculations
 * @param {Object} calculations - Calculation results
 * @returns {Object} Status object with color, text, icon
 */
export function getOverallStatus(calculations) {
  const score = calculateComplianceScore(calculations);
  const color = getPercentageColor(score);
  const text = getStatusText(color);
  const icon = getStatusIcon(color);
  
  return { score, color, text, icon };
}

export default {
  getIndicatorColor,
  getStatusText,
  getStatusIcon,
  calculateComplianceScore,
  getOverallStatus
};
