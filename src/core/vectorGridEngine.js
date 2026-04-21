/**
 * Vector Grid Engine for Real Grounding Grid Design
 * Handles vector-based conductor representation instead of parametric grid
 */

/**
 * Conductor segment object
 * @typedef {Object} ConductorSegment
 * @property {string} id - Unique identifier
 * @property {number} x1 - Start X coordinate in meters
 * @property {number} y1 - Start Y coordinate in meters
 * @property {number} x2 - End X coordinate in meters
 * @property {number} y2 - End Y coordinate in meters
 * @property {number} radius - Conductor radius in meters (default: 0.0079 for 4/0 AWG)
 * @property {string} type - Type of conductor ('horizontal', 'vertical', 'diagonal')
 * @property {Object} properties - Additional properties
 */

/**
 * Ground rod object
 * @typedef {Object} GroundRod
 * @property {string} id - Unique identifier
 * @property {number} x - X coordinate in meters
 * @property {number} y - Y coordinate in meters
 * @property {number} depth - Depth in meters
 * @property {number} length - Rod length in meters
 * @property {number} diameter - Rod diameter in meters
 * @property {Object} properties - Additional properties
 */

/**
 * Vector grid configuration
 * @typedef {Object} VectorGridConfig
 * @property {Array<ConductorSegment>} conductors - Array of conductor segments
 * @property {Array<GroundRod>} rods - Array of ground rods
 * @property {Object} bounds - Grid bounds
 * @property {number} bounds.minX - Minimum X coordinate
 * @property {number} bounds.maxX - Maximum X coordinate
 * @property {number} bounds.minY - Minimum Y coordinate
 * @property {number} bounds.maxY - Maximum Y coordinate
 * @property {Object} properties - Grid properties
 */

/**
 * Create a rectangular grid with vector conductors
 * @param {number} length - Grid length in meters
 * @param {number} width - Grid width in meters
 * @param {number} spacing - Conductor spacing in meters
 * @param {number} conductorRadius - Conductor radius in meters
 * @returns {VectorGridConfig} Vector grid configuration
 */
export function createRectangularGrid(length, width, spacing, conductorRadius = 0.0079) {
  const conductors = [];
  let id = 0;
  
  // Horizontal conductors
  const numHorizontal = Math.floor(width / spacing) + 1;
  for (let i = 0; i < numHorizontal; i++) {
    const y = -width / 2 + i * spacing;
    conductors.push({
      id: `h_${id++}`,
      x1: -length / 2,
      y1: y,
      x2: length / 2,
      y2: y,
      radius: conductorRadius,
      type: 'horizontal',
      properties: {}
    });
  }
  
  // Vertical conductors
  const numVertical = Math.floor(length / spacing) + 1;
  for (let i = 0; i < numVertical; i++) {
    const x = -length / 2 + i * spacing;
    conductors.push({
      id: `v_${id++}`,
      x1: x,
      y1: -width / 2,
      x2: x,
      y2: width / 2,
      radius: conductorRadius,
      type: 'vertical',
      properties: {}
    });
  }
  
  return {
    conductors,
    rods: [],
    bounds: {
      minX: -length / 2,
      maxX: length / 2,
      minY: -width / 2,
      maxY: width / 2
    },
    properties: {
      type: 'rectangular',
      length,
      width,
      spacing,
      conductorRadius
    }
  };
}

/**
 * Add ground rods to a vector grid
 * @param {VectorGridConfig} grid - Vector grid configuration
 * @param {number} numRods - Number of rods to add
 * @param {number} rodLength - Rod length in meters
 * @param {number} rodDiameter - Rod diameter in meters
 * @param {number} rodSpacing - Spacing between rods in meters
 * @returns {VectorGridConfig} Updated grid configuration
 */
export function addGroundRods(grid, numRods, rodLength = 3, rodDiameter = 0.015875, rodSpacing = null) {
  const rods = [];
  const { length, width } = grid.properties;
  
  if (!rodSpacing) {
    rodSpacing = Math.max(length, width) / (numRods + 1);
  }
  
  // Add rods around the perimeter
  let id = 0;
  
  // Top edge
  const topRods = Math.floor(length / rodSpacing);
  for (let i = 0; i < topRods; i++) {
    const x = -length / 2 + (i + 1) * (length / (topRods + 1));
    rods.push({
      id: `rod_${id++}`,
      x,
      y: width / 2,
      depth: rodLength,
      length: rodLength,
      diameter: rodDiameter,
      properties: { location: 'top' }
    });
  }
  
  // Bottom edge
  const bottomRods = Math.floor(length / rodSpacing);
  for (let i = 0; i < bottomRods; i++) {
    const x = -length / 2 + (i + 1) * (length / (bottomRods + 1));
    rods.push({
      id: `rod_${id++}`,
      x,
      y: -width / 2,
      depth: rodLength,
      length: rodLength,
      diameter: rodDiameter,
      properties: { location: 'bottom' }
    });
  }
  
  // Left edge
  const leftRods = Math.floor(width / rodSpacing);
  for (let i = 0; i < leftRods; i++) {
    const y = -width / 2 + (i + 1) * (width / (leftRods + 1));
    rods.push({
      id: `rod_${id++}`,
      x: -length / 2,
      y,
      depth: rodLength,
      length: rodLength,
      diameter: rodDiameter,
      properties: { location: 'left' }
    });
  }
  
  // Right edge
  const rightRods = Math.floor(width / rodSpacing);
  for (let i = 0; i < rightRods; i++) {
    const y = -width / 2 + (i + 1) * (width / (rightRods + 1));
    rods.push({
      id: `rod_${id++}`,
      x: length / 2,
      y,
      depth: rodLength,
      length: rodLength,
      diameter: rodDiameter,
      properties: { location: 'right' }
    });
  }
  
  return {
    ...grid,
    rods
  };
}

/**
 * Create an irregular grid from conductor segments
 * @param {Array<ConductorSegment>} conductors - Array of conductor segments
 * @param {Array<GroundRod>} rods - Array of ground rods
 * @returns {VectorGridConfig} Vector grid configuration
 */
export function createIrregularGrid(conductors, rods = []) {
  // Calculate bounds from conductors
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  conductors.forEach(conductor => {
    minX = Math.min(minX, conductor.x1, conductor.x2);
    maxX = Math.max(maxX, conductor.x1, conductor.x2);
    minY = Math.min(minY, conductor.y1, conductor.y2);
    maxY = Math.max(maxY, conductor.y1, conductor.y2);
  });
  
  return {
    conductors,
    rods,
    bounds: {
      minX,
      maxX,
      minY,
      maxY
    },
    properties: {
      type: 'irregular',
      totalConductors: conductors.length,
      totalRods: rods.length
    }
  };
}

/**
 * Add a conductor segment to the grid
 * @param {VectorGridConfig} grid - Vector grid configuration
 * @param {number} x1 - Start X coordinate
 * @param {number} y1 - Start Y coordinate
 * @param {number} x2 - End X coordinate
 * @param {number} y2 - End Y coordinate
 * @param {number} radius - Conductor radius
 * @param {string} type - Conductor type
 * @returns {VectorGridConfig} Updated grid configuration
 */
export function addConductor(grid, x1, y1, x2, y2, radius = 0.0079, type = 'custom') {
  const newConductor = {
    id: `custom_${Date.now()}`,
    x1,
    y1,
    x2,
    y2,
    radius,
    type,
    properties: {}
  };
  
  const updatedConductors = [...grid.conductors, newConductor];
  
  // Recalculate bounds
  let minX = Math.min(grid.bounds.minX, x1, x2);
  let maxX = Math.max(grid.bounds.maxX, x1, x2);
  let minY = Math.min(grid.bounds.minY, y1, y2);
  let maxY = Math.max(grid.bounds.maxY, y1, y2);
  
  return {
    ...grid,
    conductors: updatedConductors,
    bounds: { minX, maxX, minY, maxY }
  };
}

/**
 * Remove a conductor from the grid
 * @param {VectorGridConfig} grid - Vector grid configuration
 * @param {string} conductorId - ID of conductor to remove
 * @returns {VectorGridConfig} Updated grid configuration
 */
export function removeConductor(grid, conductorId) {
  const updatedConductors = grid.conductors.filter(c => c.id !== conductorId);
  
  // Recalculate bounds
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  updatedConductors.forEach(conductor => {
    minX = Math.min(minX, conductor.x1, conductor.x2);
    maxX = Math.max(maxX, conductor.x1, conductor.x2);
    minY = Math.min(minY, conductor.y1, conductor.y2);
    maxY = Math.max(maxY, conductor.y1, conductor.y2);
  });
  
  return {
    ...grid,
    conductors: updatedConductors,
    bounds: { minX, maxX, minY, maxY }
  };
}

/**
 * Calculate total conductor length
 * @param {VectorGridConfig} grid - Vector grid configuration
 * @returns {number} Total conductor length in meters
 */
export function calculateTotalConductorLength(grid) {
  return grid.conductors.reduce((total, conductor) => {
    const dx = conductor.x2 - conductor.x1;
    const dy = conductor.y2 - conductor.y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    return total + length;
  }, 0);
}

/**
 * Calculate total rod length
 * @param {VectorGridConfig} grid - Vector grid configuration
 * @returns {number} Total rod length in meters
 */
export function calculateTotalRodLength(grid) {
  return grid.rods.reduce((total, rod) => total + rod.length, 0);
}

/**
 * Get conductor intersection points
 * @param {VectorGridConfig} grid - Vector grid configuration
 * @returns {Array<Object>} Array of intersection points
 */
export function getConductorIntersections(grid) {
  const intersections = [];
  const tolerance = 0.001; // 1mm tolerance
  
  for (let i = 0; i < grid.conductors.length; i++) {
    for (let j = i + 1; j < grid.conductors.length; j++) {
      const c1 = grid.conductors[i];
      const c2 = grid.conductors[j];
      
      const intersection = findLineIntersection(
        c1.x1, c1.y1, c1.x2, c1.y2,
        c2.x1, c2.y1, c2.x2, c2.y2,
        tolerance
      );
      
      if (intersection) {
        intersections.push({
          x: intersection.x,
          y: intersection.y,
          conductors: [c1.id, c2.id]
        });
      }
    }
  }
  
  return intersections;
}

/**
 * Find intersection between two line segments
 * @param {number} x1 - Line 1 start X
 * @param {number} y1 - Line 1 start Y
 * @param {number} x2 - Line 1 end X
 * @param {number} y2 - Line 1 end Y
 * @param {number} x3 - Line 2 start X
 * @param {number} y3 - Line 2 start Y
 * @param {number} x4 - Line 2 end X
 * @param {number} y4 - Line 2 end Y
 * @param {number} tolerance - Intersection tolerance
 * @returns {Object|null} Intersection point or null
 */
function findLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4, tolerance) {
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  
  if (Math.abs(denom) < tolerance) {
    return null; // Lines are parallel
  }
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  
  // Check if intersection is within both line segments
  if (t >= -tolerance && t <= 1 + tolerance && u >= -tolerance && u <= 1 + tolerance) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }
  
  return null;
}

/**
 * Convert vector grid to parametric representation for calculations
 * @param {VectorGridConfig} grid - Vector grid configuration
 * @returns {Object} Parametric representation
 */
export function vectorToParametric(grid) {
  const { length, width } = grid.properties;
  
  if (grid.properties.type === 'rectangular') {
    return {
      length,
      width,
      spacing: grid.properties.spacing,
      numConductorsLength: Math.floor(length / grid.properties.spacing) + 1,
      numConductorsWidth: Math.floor(width / grid.properties.spacing) + 1,
      numRods: grid.rods.length,
      rodLength: grid.rods[0]?.length || 3,
      rodDiameter: grid.rods[0]?.diameter || 0.015875
    };
  }
  
  // For irregular grids, calculate equivalent parameters
  const totalLength = calculateTotalConductorLength(grid);
  const area = (grid.bounds.maxX - grid.bounds.minX) * (grid.bounds.maxY - grid.bounds.minY);
  const equivalentSpacing = Math.sqrt(area / grid.conductors.length);
  
  return {
    length: grid.bounds.maxX - grid.bounds.minX,
    width: grid.bounds.maxY - grid.bounds.minY,
    spacing: equivalentSpacing,
    numConductorsLength: Math.floor((grid.bounds.maxX - grid.bounds.minX) / equivalentSpacing) + 1,
    numConductorsWidth: Math.floor((grid.bounds.maxY - grid.bounds.minY) / equivalentSpacing) + 1,
    numRods: grid.rods.length,
    rodLength: grid.rods[0]?.length || 3,
    rodDiameter: grid.rods[0]?.diameter || 0.015875,
    totalConductorLength,
    irregular: true
  };
}

export default {
  createRectangularGrid,
  addGroundRods,
  createIrregularGrid,
  addConductor,
  removeConductor,
  calculateTotalConductorLength,
  calculateTotalRodLength,
  getConductorIntersections,
  vectorToParametric
};
