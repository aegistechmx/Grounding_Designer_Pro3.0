/**
 * PDF Utils - Helpers de Formato
 * Grounding Designer Pro - Utility Functions
 */

export const formatNumber = (num) => {
  return Number(num).toFixed(2);
};

export const formatVoltage = (volts) => {
  return `${formatNumber(volts)} V`;
};

export const formatResistance = (ohms) => {
  return `${formatNumber(ohms)} Ω`;
};

/**
 * Map grid x coordinate to canvas x coordinate
 * @param {number} gridX - Grid x coordinate
 * @param {number} gridWidth - Grid width in meters
 * @param {number} canvasWidth - Canvas width in pixels
 * @returns {number} Canvas x coordinate
 */
export function mapX(gridX, gridWidth, canvasWidth) {
  return (gridX / gridWidth) * canvasWidth;
}

/**
 * Map grid y coordinate to canvas y coordinate
 * @param {number} gridY - Grid y coordinate
 * @param {number} gridHeight - Grid height in meters
 * @param {number} canvasHeight - Canvas height in pixels
 * @returns {number} Canvas y coordinate
 */
export function mapY(gridY, gridHeight, canvasHeight) {
  return (gridY / gridHeight) * canvasHeight;
}

/**
 * Normalize value to 0-1 range
 * @param {number} value - Value to normalize
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Normalized value (0-1)
 */
export function normalize(value, min, max) {
  return (value - min) / (max - min + 1e-6);
}

/**
 * Generate contour levels
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} steps - Number of contour levels
 * @returns {Array} Array of contour level values
 */
export function generateContourLevels(min, max, steps = 10) {
  const levels = [];
  for (let i = 0; i <= steps; i++) {
    levels.push(min + (i / steps) * (max - min));
  }
  return levels;
}

/**
 * Convert grid data to 2D array for contour generation
 * @param {Array} data - Grid data array [{x, y, potential}]
 * @param {number} nx - Number of grid points in x direction
 * @param {number} ny - Number of grid points in y direction
 * @returns {Array} 2D array of potential values
 */
export function gridDataTo2D(data, nx, ny) {
  const grid = new Array(ny).fill(null).map(() => new Array(nx).fill(0));
  
  data.forEach((point, i) => {
    const row = Math.floor(i / nx);
    const col = i % nx;
    if (row < ny && col < nx) {
      grid[row][col] = point.potential || 0;
    }
  });
  
  return grid;
}
