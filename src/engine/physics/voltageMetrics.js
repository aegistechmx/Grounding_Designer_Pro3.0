/**
 * Voltage Metrics - Physics-based voltage calculations
 * Calculates step and touch voltages from discrete nodal field
 * IEEE 80 compliant definitions without calibration factors
 */

/**
 * Calculate touch voltage from nodal field (physical calculation)
 * Physical definition: Maximum voltage difference between edge node and interior node
 * This represents actual touch voltage from the physical field distribution
 * For well-conducted grids, uses edge-to-interior voltage difference
 * 
 * @param {Array} nodes - Array of node objects with {x, y, voltage}
 * @returns {number} Maximum touch voltage from physical field
 */
export function computeTouchVoltagePhysical(nodes) {
  // Find grid bounds
  const xValues = nodes.map(n => n.x);
  const yValues = nodes.map(n => n.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  
  // Define edge and interior regions
  const margin = 0.1; // 10% margin
  const edgeNodes = nodes.filter(n => 
    n.x <= minX + (maxX - minX) * margin || 
    n.x >= maxX - (maxX - minX) * margin ||
    n.y <= minY + (maxY - minY) * margin ||
    n.y >= maxY - (maxY - minY) * margin
  );
  
  const interiorNodes = nodes.filter(n => 
    n.x > minX + (maxX - minX) * margin && 
    n.x < maxX - (maxX - minX) * margin &&
    n.y > minY + (maxY - minY) * margin &&
    n.y < maxY - (maxY - minY) * margin
  );
  
  if (interiorNodes.length === 0) {
    // Fallback: use average voltage
    const avgVoltage = nodes.reduce((sum, n) => sum + n.voltage, 0) / nodes.length;
    const maxVoltage = Math.max(...nodes.map(n => n.voltage));
    return maxVoltage - avgVoltage;
  }
  
  // Calculate average interior voltage
  const avgInteriorVoltage = interiorNodes.reduce((sum, n) => sum + n.voltage, 0) / interiorNodes.length;
  
  // Touch voltage = max edge voltage - average interior voltage
  const maxEdgeVoltage = Math.max(...edgeNodes.map(n => n.voltage));
  
  return maxEdgeVoltage - avgInteriorVoltage;
}

/**
 * Calculate step voltage from nodal field (physical calculation)
 * Physical definition: Maximum voltage gradient across step distance
 * This represents actual step voltage from the physical field gradient
 * 
 * @param {Array} nodes - Array of node objects with {x, y, voltage}
 * @param {number} stepDistance - Step distance in meters (default: 1m per IEEE 80)
 * @returns {number} Maximum step voltage from physical field
 */
export function computeStepVoltagePhysical(nodes, stepDistance = 1) {
  let maxStep = 0;

  for (let i = 0; i < nodes.length; i++) {
    const n1 = nodes[i];

    for (let j = 0; j < nodes.length; j++) {
      const n2 = nodes[j];

      const dx = n1.x - n2.x;
      const dy = n1.y - n2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= 0) continue;

      // Linear interpolation to step distance
      const dv = Math.abs(n1.voltage - n2.voltage);
      const stepVoltage = dv * (stepDistance / dist);

      if (stepVoltage > maxStep) {
        maxStep = stepVoltage;
      }
    }
  }

  return maxStep;
}

/**
 * Calculate touch voltage from nodal field (IEEE 80 analytical)
 * IEEE 80 definition: Touch = GPR * Km (mesh factor)
 * 
 * @param {Array} nodes - Array of node objects with {x, y, voltage}
 * @param {number} gpr - Ground Potential Rise
 * @param {number} Km - Mesh factor (default: 0.2 for typical grid)
 * @returns {number} Touch voltage using IEEE 80 formula
 */
export function computeTouchVoltageAnalytical(gpr, Km = 0.2) {
  return gpr * Km;
}

/**
 * Calculate step voltage from nodal field (IEEE 80 analytical)
 * IEEE 80 definition: Step = GPR * Ks (step factor)
 * 
 * @param {number} gpr - Ground Potential Rise
 * @param {number} Ks - Step factor (default: 0.09 for typical grid)
 * @returns {number} Step voltage using IEEE 80 formula
 */
export function computeStepVoltageAnalytical(gpr, Ks = 0.09) {
  return gpr * Ks;
}

/**
 * Generate surface potential points from grid nodes
 * Creates a grid of surface points at specified resolution
 * 
 * @param {Array} nodes - Array of node objects with {x, y, voltage}
 * @param {number} resolution - Grid resolution in meters (default: 1m)
 * @returns {Array} 2D array of surface potential points
 */
export function generateSurfaceGrid(nodes, resolution = 1) {
  const xValues = nodes.map(n => n.x);
  const yValues = nodes.map(n => n.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const cols = Math.ceil((maxX - minX) / resolution) + 1;
  const rows = Math.ceil((maxY - minY) / resolution) + 1;

  const surfaceGrid = [];

  for (let i = 0; i < rows; i++) {
    const row = [];
    const y = minY + i * resolution;

    for (let j = 0; j < cols; j++) {
      const x = minX + j * resolution;

      // Interpolate voltage from nearest nodes
      const voltage = interpolateVoltage(x, y, nodes);

      row.push({ x, y, voltage });
    }

    surfaceGrid.push(row);
  }

  return surfaceGrid;
}

/**
 * Interpolate voltage at a point from nearby nodes
 * Uses inverse distance weighting
 * 
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Array} nodes - Array of node objects with {x, y, voltage}
 * @returns {number} Interpolated voltage
 */
function interpolateVoltage(x, y, nodes) {
  let sumWeightedVoltage = 0;
  let sumWeights = 0;

  for (const node of nodes) {
    const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
    if (dist < 0.001) return node.voltage; // Exact match

    const weight = 1 / (dist * dist);
    sumWeightedVoltage += weight * node.voltage;
    sumWeights += weight;
  }

  return sumWeights / sumWeights;
}

/**
 * Generate analytical voltage grid based on IEEE 80 simplified model
 * Creates exponential decay model from GPR for overlay visualization
 * 
 * @param {Object} params - Parameters: { GPR, gridLength, gridWidth, decayFactor }
 * @param {number} resolution - Grid resolution (default: 50)
 * @returns {Array} 2D array of analytical voltage values
 */
export function generateAnalyticalGrid(params, resolution = 50) {
  const { GPR, gridLength, gridWidth, decayFactor = 20 } = params;
  const grid = [];
  
  const centerX = gridLength / 2;
  const centerY = gridWidth / 2;

  for (let y = 0; y < resolution; y++) {
    grid[y] = [];
    for (let x = 0; x < resolution; x++) {
      // Convert grid coordinates to world coordinates
      const worldX = (x / resolution) * gridLength;
      const worldY = (y / resolution) * gridWidth;
      
      // Distance from center (fault location)
      const r = Math.sqrt(
        Math.pow(worldX - centerX, 2) + 
        Math.pow(worldY - centerY, 2)
      );
      
      // Exponential decay model (simplified IEEE 80)
      const voltage = GPR * Math.exp(-r / decayFactor);
      
      grid[y][x] = voltage;
    }
  }

  return grid;
}

/**
 * Find critical points in voltage field
 * Identifies locations of maximum touch and step voltages
 * 
 * @param {Array} surfaceGrid - 2D array of surface potential points with {x, y, voltage}
 * @returns {Object} Critical points with maxTouch and maxStep locations
 */
export function findCriticalPoints(surfaceGrid) {
  let maxTouch = { value: 0, x: 0, y: 0 };
  let maxStep = { value: 0, x: 0, y: 0 };

  for (let i = 0; i < surfaceGrid.length; i++) {
    for (let j = 0; j < surfaceGrid[i].length; j++) {
      const p = surfaceGrid[i][j];

      // TOUCH (reference: remote ground ~ 0)
      const touchVoltage = Math.abs(p.voltage);
      if (touchVoltage > maxTouch.value) {
        maxTouch = { ...p, value: touchVoltage };
      }

      // STEP (gradient with adjacent points)
      const right = surfaceGrid[i]?.[j + 1];
      if (right) {
        const stepVoltage = Math.abs(p.voltage - right.voltage);
        if (stepVoltage > maxStep.value) {
          maxStep = { ...p, value: stepVoltage };
        }
      }

      // Check bottom neighbor for step
      const bottom = surfaceGrid[i + 1]?.[j];
      if (bottom) {
        const stepVoltage = Math.abs(p.voltage - bottom.voltage);
        if (stepVoltage > maxStep.value) {
          maxStep = { ...p, value: stepVoltage };
        }
      }
    }
  }

  return { maxTouch, maxStep };
}

/**
 * Calculate touch voltage with human offset (more realistic)
 * IEEE 80 definition: Voltage between hand contact point and foot position
 * Physical calculation: V(hand) - V(foot at offset distance)
 * Uses linear interpolation when actual node spacing differs from offset distance
 * 
 * @param {Array} nodes - Array of node objects with {x, y, voltage}
 * @param {number} offset - Human hand-to-foot offset in meters (default: 1m)
 * @returns {number} Maximum touch voltage with offset
 */
export function computeTouchVoltageWithOffset(nodes, offset = 1) {
  let maxTouch = 0;

  for (let i = 0; i < nodes.length; i++) {
    const n1 = nodes[i];

    for (let j = 0; j < nodes.length; j++) {
      const n2 = nodes[j];

      const dx = n1.x - n2.x;
      const dy = n1.y - n2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= 0) continue;

      // Linear interpolation: V_touch = V_actual * (offset / actual_distance)
      const dv = Math.abs(n1.voltage - n2.voltage);
      const touchVoltage = dv * (offset / dist);
      
      if (touchVoltage > maxTouch) maxTouch = touchVoltage;
    }
  }

  return maxTouch;
}

/**
 * Calculate electric gradient at a point
 * Physical calculation: E = dV/dx (V/m)
 * 
 * @param {Array} nodes - Array of node objects with {x, y, voltage}
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} delta - Small distance for gradient calculation (default: 0.1m)
 * @returns {Object} Gradient vector {Ex, Ey, magnitude}
 */
export function computeElectricGradient(nodes, x, y, delta = 0.1) {
  // Find nearest nodes for gradient calculation
  const nearbyNodes = nodes.filter(n => {
    const dist = Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2);
    return dist < delta * 5;
  });

  if (nearbyNodes.length < 2) {
    return { Ex: 0, Ey: 0, magnitude: 0 };
  }

  // Simple finite difference gradient
  let Ex = 0, Ey = 0;
  let count = 0;

  for (const node of nearbyNodes) {
    const dx = node.x - x;
    const dy = node.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      Ex += (node.voltage * dx) / (dist * dist);
      Ey += (node.voltage * dy) / (dist * dist);
      count++;
    }
  }

  if (count > 0) {
    Ex /= count;
    Ey /= count;
  }

  const magnitude = Math.sqrt(Ex * Ex + Ey * Ey);

  return { Ex, Ey, magnitude };
}

/**
 * Generate voltage isolines (contour lines)
 * Physical calculation: Extract points at specific voltage levels
 * 
 * @param {Array} nodes - Array of node objects with {x, y, voltage}
 * @param {number} voltageLevel - Voltage level for isoline
 * @param {number} tolerance - Voltage tolerance (default: 5V)
 * @returns {Array} Array of points {x, y} at the voltage level
 */
export function computeVoltageIsoline(nodes, voltageLevel, tolerance = 5) {
  return nodes.filter(n => Math.abs(n.voltage - voltageLevel) < tolerance)
              .map(n => ({ x: n.x, y: n.y }));
}
