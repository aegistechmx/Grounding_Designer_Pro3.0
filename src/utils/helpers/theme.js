/**
 * Power BI Style Theme
 * Consistent color palette and styling for professional reports
 */

export const theme = {
  // Primary colors
  primary: [37, 99, 235],       // blue-500
  primaryLight: [96, 165, 250], // blue-400
  primaryDark: [29, 78, 216],   // blue-600
  
  // Status colors
  success: [34, 197, 94],       // green-500
  successLight: [74, 222, 128], // green-400
  successDark: [22, 163, 74],   // green-600
  
  warning: [234, 179, 8],       // yellow-500
  warningLight: [250, 204, 21], // yellow-400
  warningDark: [202, 138, 4],   // yellow-600
  
  danger: [239, 68, 68],        // red-500
  dangerLight: [248, 113, 113], // red-400
  dangerDark: [220, 38, 38],    // red-600
  
  // Neutral colors
  bgCard: [248, 250, 252],      // slate-50
  bgCardDark: [30, 41, 59],     // slate-800
  text: [15, 23, 42],          // slate-900
  textLight: [100, 116, 139],  // slate-500
  textDark: [241, 245, 249],   // slate-100
  
  // Chart colors (Power BI style)
  chartColors: [
    '#3b82f6', // blue
    '#22c55e', // green
    '#eab308', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#ec4899'  // pink
  ]
};

/**
 * Get color based on value ratio (traffic light)
 * @param {number} value - Current value
 * @param {number} limit - Limit value
 * @returns {Array} RGB color array
 */
export function getTrafficLightColor(value, limit) {
  if (limit === 0) return theme.warning;
  const ratio = value / limit;
  
  if (ratio < 0.5) return theme.success;
  if (ratio < 0.9) return theme.warning;
  return theme.danger;
}

/**
 * Get color based on percentage
 * @param {number} percentage - Percentage value (0-100)
 * @returns {Array} RGB color array
 */
export function getPercentageColor(percentage) {
  if (percentage >= 80) return theme.success;
  if (percentage >= 50) return theme.warning;
  return theme.danger;
}

/**
 * Convert RGB array to CSS string
 * @param {Array} rgb - RGB array [r, g, b]
 * @returns {string} CSS color string
 */
export function rgbToCss(rgb) {
  if (!rgb || rgb.length < 3) return 'rgb(0, 0, 0)';
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

/**
 * Convert RGB array to hex string
 * @param {Array} rgb - RGB array [r, g, b]
 * @returns {string} Hex color string
 */
export function rgbToHex(rgb) {
  return '#' + rgb.map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export default {
  theme,
  getTrafficLightColor,
  getPercentageColor,
  rgbToCss,
  rgbToHex
};
