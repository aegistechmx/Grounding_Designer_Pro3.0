/**
 * IDW Interpolation Utilities for Original Interface
 * Inverse Distance Weighting with engineering constraints
 */

/**
 * IDW Interpolation function
 * @param {number} x - X coordinate in world space
 * @param {number} y - Y coordinate in world space
 * @param {Array} nodes - Array of node objects with x, y coordinates
 * @param {Array} values - Array of voltage values corresponding to nodes
 * @param {number} power - Interpolation power (1 = smooth, 4 = sharp)
 * @returns {number} Interpolated value
 */
export function interpolateIDW(x, y, nodes, values, power = 2) {
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < nodes.length; i++) {
    const dx = x - nodes[i].x;
    const dy = y - nodes[i].y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    
    // Engineering constraint: avoid unrealistic interpolation near nodes
    if (distance < 0.5) {
      return values[i];
    }
    
    const weight = 1 / Math.pow(distance, power);
    numerator += weight * values[i];
    denominator += weight;
  }
  
  return numerator / denominator;
}

/**
 * Check if point is within grid bounds
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Array} nodes - Array of node objects
 * @returns {boolean} True if within bounds
 */
export function isWithinGridBounds(x, y, nodes) {
  const xCoords = nodes.map(n => n.x);
  const yCoords = nodes.map(n => n.y);
  
  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);
  
  return x >= minX && x <= maxX && y >= minY && y <= maxY;
}
