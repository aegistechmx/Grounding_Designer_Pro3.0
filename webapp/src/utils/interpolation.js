/**
 * Inverse Distance Weighting (IDW) Interpolation
 * Creates smooth continuous field from discrete nodal data
 */

export function interpolateIDW(x, y, nodes, values, power = 2) {
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < nodes.length; i++) {
    const dx = x - nodes[i].x;
    const dy = y - nodes[i].y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001; // Avoid division by zero
    
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

/**
 * Create interpolated grid data for smooth visualization
 */
export function createInterpolatedGrid(nodes, values, resolution = 80, power = 2) {
  const grid = [];
  const cellSize = 50 / resolution; // Assuming 50x50m grid
  
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const x = (i / resolution) * 50;
      const y = (j / resolution) * 50;
      
      // Only interpolate within grid bounds
      if (isWithinGridBounds(x, y, nodes)) {
        const value = interpolateIDW(x, y, nodes, values, power);
        grid.push({
          x: i,
          y: j,
          value,
          worldX: x,
          worldY: y
        });
      }
    }
  }
  
  return grid;
}
