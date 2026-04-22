/**
 * Field Gradient Utility
 * Computes electric field gradient from voltage grid
 * Particles follow J ≈ -∇V (current flows towards lower potential)
 */

/**
 * Compute gradient field from voltage grid
 * Returns vector field with real ∇V in V/m
 * 
 * @param {Array} grid - 2D array of voltage points with {x, y, voltage}
 * @param {number} spacing - Grid spacing in meters (default: 1m)
 * @returns {Array} 2D array of gradient vectors {dirX, dirY, mag}
 */
export function computeGradientField(grid, spacing = 1) {
  if (!grid || grid.length === 0) return [];

  const field = [];
  let maxMagnitude = 0;

  for (let y = 0; y < grid.length; y++) {
    field[y] = [];

    for (let x = 0; x < grid[y].length; x++) {
      const current = grid[y][x];
      
      // Get neighboring voltages (use current if neighbor doesn't exist)
      const left = grid[y]?.[x - 1]?.voltage ?? current.voltage;
      const right = grid[y]?.[x + 1]?.voltage ?? current.voltage;
      const up = grid[y - 1]?.[x]?.voltage ?? current.voltage;
      const down = grid[y + 1]?.[x]?.voltage ?? current.voltage;

      // Compute real gradient (∇V in V/m)
      const dx = (right - left) / (2 * spacing);
      const dy = (down - up) / (2 * spacing);

      // Compute magnitude
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      maxMagnitude = Math.max(maxMagnitude, magnitude);

      // Normalize direction (unit vector)
      const normalizedMag = magnitude + 1e-6; // Avoid division by zero
      const dirX = -dx / normalizedMag;
      const dirY = -dy / normalizedMag;

      // Current flows opposite to gradient (J ≈ -∇V)
      field[y][x] = {
        dirX,
        dirY,
        mag: magnitude
      };
    }
  }

  // Store max magnitude for normalization
  field.maxMagnitude = maxMagnitude;

  return field;
}

/**
 * Normalize gradient field for consistent particle speeds
 * 
 * @param {Array} field - 2D array of velocity vectors
 * @param {number} maxSpeed - Maximum speed for normalization
 * @returns {Array} Normalized field
 */
export function normalizeGradientField(field, maxSpeed = 5) {
  if (!field || field.length === 0) return [];

  const normalized = [];

  for (let y = 0; y < field.length; y++) {
    normalized[y] = [];

    for (let x = 0; x < field[y].length; x++) {
      const v = field[y][x];
      const magnitude = v.magnitude || 0;

      if (magnitude === 0) {
        normalized[y][x] = { vx: 0, vy: 0, magnitude: 0 };
      } else {
        const scale = Math.min(maxSpeed, magnitude) / magnitude;
        normalized[y][x] = {
          vx: v.vx * scale,
          vy: v.vy * scale,
          magnitude: magnitude * scale
        };
      }
    }
  }

  return normalized;
}
