/**
 * FEM Simulation Engine for Real Grounding Analysis
 * Simplified Finite Element Method for voltage distribution calculation
 */

/**
 * Node object for FEM mesh
 * @typedef {Object} Node
 * @property {number} id - Node identifier
 * @property {number} x - X coordinate in meters
 * @property {number} y - Y coordinate in meters
 * @property {number} z - Z coordinate (depth) in meters
 * @property {number} voltage - Node voltage in volts
 * @property {boolean} isConductor - True if node is on a conductor
 * @property {Array<number>} connections - Connected node IDs
 */

/**
 * Element object for FEM mesh
 * @typedef {Object} Element
 * @property {number} id - Element identifier
 * @property {Array<number>} nodes - Node IDs forming the element
 * @property {number} resistivity - Soil resistivity in ohm-meters
 * @property {Object} properties - Additional element properties
 */

/**
 * FEM mesh configuration
 * @typedef {Object} FEMMesh
 * @property {Array<Node>} nodes - Array of nodes
 * @property {Array<Element>} elements - Array of elements
 * @property {Object} bounds - Mesh bounds
 * @property {number} bounds.minX - Minimum X coordinate
 * @property {number} bounds.maxX - Maximum X coordinate
 * @property {number} bounds.minY - Minimum Y coordinate
 * @property {number} bounds.maxY - Maximum Y coordinate
 * @property {Object} properties - Mesh properties
 */

/**
 * Generate FEM mesh from vector grid
 * @param {Object} vectorGrid - Vector grid configuration
 * @param {Object} params - Design parameters
 * @param {number} resolution - Mesh resolution in meters (default: 0.5)
 * @returns {FEMMesh} FEM mesh configuration
 */
export function generateFEMMesh(vectorGrid, params, resolution = 0.5) {
  const nodes = [];
  const elements = [];
  let nodeId = 0;
  let elementId = 0;
  
  const { bounds } = vectorGrid;
  const soilResistivity = params.resistivity || 100;
  
  // Generate nodes
  const numX = Math.ceil((bounds.maxX - bounds.minX) / resolution) + 1;
  const numY = Math.ceil((bounds.maxY - bounds.minY) / resolution) + 1;
  
  for (let i = 0; i < numX; i++) {
    for (let j = 0; j < numY; j++) {
      const x = bounds.minX + i * resolution;
      const y = bounds.minY + j * resolution;
      
      // Check if node is on a conductor
      const isConductor = isPointOnConductor(x, y, vectorGrid.conductors, 0.1);
      
      nodes.push({
        id: nodeId++,
        x,
        y,
        z: params.gridDepth || 0.6,
        voltage: 0,
        isConductor,
        connections: []
      });
    }
  }
  
  // Generate triangular elements
  for (let i = 0; i < numX - 1; i++) {
    for (let j = 0; j < numY - 1; j++) {
      const n1 = i * numY + j;
      const n2 = (i + 1) * numY + j;
      const n3 = (i + 1) * numY + (j + 1);
      const n4 = i * numY + (j + 1);
      
      // Create two triangular elements
      elements.push({
        id: elementId++,
        nodes: [n1, n2, n3],
        resistivity: soilResistivity,
        properties: { type: 'triangle' }
      });
      
      elements.push({
        id: elementId++,
        nodes: [n1, n3, n4],
        resistivity: soilResistivity,
        properties: { type: 'triangle' }
      });
    }
  }
  
  // Build node connections
  elements.forEach(element => {
    const [n1, n2, n3] = element.nodes;
    
    nodes[n1].connections.push(n2, n3);
    nodes[n2].connections.push(n1, n3);
    nodes[n3].connections.push(n1, n2);
  });
  
  // Remove duplicate connections
  nodes.forEach(node => {
    node.connections = [...new Set(node.connections)];
  });
  
  return {
    nodes,
    elements,
    bounds,
    properties: {
      resolution,
      numNodes: nodes.length,
      numElements: elements.length,
      soilResistivity
    }
  };
}

/**
 * Check if a point is on a conductor
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Array<Object>} conductors - Array of conductors
 * @param {number} tolerance - Tolerance in meters
 * @returns {boolean} True if point is on conductor
 */
function isPointOnConductor(x, y, conductors, tolerance) {
  return conductors.some(conductor => {
    const dist = pointToLineDistance(x, y, conductor.x1, conductor.y1, conductor.x2, conductor.y2);
    return dist <= tolerance;
  });
}

/**
 * Calculate distance from point to line segment
 * @param {number} px - Point X
 * @param {number} py - Point Y
 * @param {number} x1 - Line start X
 * @param {number} y1 - Line start Y
 * @param {number} x2 - Line end X
 * @param {number} y2 - Line end Y
 * @returns {number} Distance
 */
function pointToLineDistance(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }
  
  let xx, yy;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = px - xx;
  const dy = py - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Build resistance matrix for FEM analysis
 * @param {FEMMesh} mesh - FEM mesh
 * @param {Object} params - Design parameters
 * @returns {Object} Resistance matrix and vector
 */
export function buildResistanceMatrix(mesh, params) {
  const numNodes = mesh.nodes.length;
  const matrix = Array(numNodes).fill(null).map(() => Array(numNodes).fill(0));
  const vector = Array(numNodes).fill(0);
  
  const soilResistivity = params.resistivity || 100;
  const gridDepth = params.gridDepth || 0.6;
  
  // Build conductance matrix (inverse of resistance)
  mesh.elements.forEach(element => {
    const [n1, n2, n3] = element.nodes;
    const resistivity = element.resistivity;
    
    // Calculate element conductance using simplified FEM
    const conductance = calculateElementConductance(element, resistivity, gridDepth);
    
    // Add to matrix (simplified lumped model)
    matrix[n1][n1] += conductance;
    matrix[n2][n2] += conductance;
    matrix[n3][n3] += conductance;
    
    matrix[n1][n2] -= conductance / 2;
    matrix[n2][n1] -= conductance / 2;
    matrix[n1][n3] -= conductance / 2;
    matrix[n3][n1] -= conductance / 2;
    matrix[n2][n3] -= conductance / 2;
    matrix[n3][n2] -= conductance / 2;
  });
  
  // Apply boundary conditions
  mesh.nodes.forEach((node, index) => {
    if (node.isConductor) {
      // Conductor nodes have fixed voltage (GPR)
      matrix[index] = Array(numNodes).fill(0);
      matrix[index][index] = 1;
      vector[index] = 1; // Will be multiplied by GPR later
    }
  });
  
  return { matrix, vector };
}

/**
 * Calculate element conductance
 * @param {Element} element - FEM element
 * @param {number} resistivity - Soil resistivity
 * @param {number} depth - Grid depth
 * @returns {number} Element conductance
 */
function calculateElementConductance(element, resistivity, depth) {
  // Simplified conductance calculation
  const [n1, n2, n3] = element.nodes;
  
  // Calculate element area (simplified)
  const area = 0.5; // m² (simplified triangular element)
  
  // Calculate average edge length
  const edgeLength = Math.sqrt(area) * 2;
  
  // Conductance = (1/resistivity) * (area/length) * depth
  const conductance = (1 / resistivity) * (area / edgeLength) * depth;
  
  return conductance;
}

/**
 * Solve FEM system using simplified method
 * @param {Object} matrixSystem - Resistance matrix and vector
 * @param {number} gpr - Ground potential rise in volts
 * @returns {Array<number>} Node voltages
 */
export function solveFEMSystem(matrixSystem, gpr) {
  const { matrix, vector } = matrixSystem;
  const numNodes = matrix.length;
  
  // Apply GPR to conductor nodes
  const modifiedVector = vector.map(v => v * gpr);
  
  // Solve using simplified iterative method (Gauss-Seidel)
  const voltages = Array(numNodes).fill(0);
  const maxIterations = 1000;
  const tolerance = 1e-6;
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let maxChange = 0;
    
    for (let i = 0; i < numNodes; i++) {
      if (matrix[i][i] === 1) {
        // Fixed voltage node (conductor)
        voltages[i] = gpr;
      } else {
        let sum = modifiedVector[i];
        
        for (let j = 0; j < numNodes; j++) {
          if (i !== j) {
            sum -= matrix[i][j] * voltages[j];
          }
        }
        
        const newVoltage = sum / matrix[i][i];
        const change = Math.abs(newVoltage - voltages[i]);
        maxChange = Math.max(maxChange, change);
        
        voltages[i] = newVoltage;
      }
    }
    
    if (maxChange < tolerance) {
      break;
    }
  }
  
  // Update mesh nodes with voltages
  return voltages;
}

/**
 * Calculate voltage at any point using interpolation
 * @param {FEMMesh} mesh - FEM mesh with solved voltages
 * @param {number} x - X coordinate in meters
 * @param {number} y - Y coordinate in meters
 * @returns {number} Voltage at point
 */
export function getVoltageAtPoint(mesh, x, y) {
  // Find containing element
  const element = findContainingElement(mesh, x, y);
  
  if (!element) {
    // Point is outside mesh, return nearest node voltage
    return getNearestNodeVoltage(mesh, x, y);
  }
  
  // Barycentric interpolation
  const [n1, n2, n3] = element.nodes;
  const node1 = mesh.nodes[n1];
  const node2 = mesh.nodes[n2];
  const node3 = mesh.nodes[n3];
  
  const v1 = node1.voltage;
  const v2 = node2.voltage;
  const v3 = node3.voltage;
  
  // Calculate barycentric coordinates
  const coords = getBarycentricCoordinates(x, y, node1, node2, node3);
  
  // Interpolate voltage
  return v1 * coords.w1 + v2 * coords.w2 + v3 * coords.w3;
}

/**
 * Find element containing a point
 * @param {FEMMesh} mesh - FEM mesh
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {Element|null} Containing element or null
 */
function findContainingElement(mesh, x, y) {
  return mesh.elements.find(element => {
    const [n1, n2, n3] = element.nodes;
    const node1 = mesh.nodes[n1];
    const node2 = mesh.nodes[n2];
    const node3 = mesh.nodes[n3];
    
    return isPointInTriangle(x, y, node1, node2, node3);
  });
}

/**
 * Check if point is inside triangle
 * @param {number} px - Point X
 * @param {number} py - Point Y
 * @param {Node} p1 - Triangle vertex 1
 * @param {Node} p2 - Triangle vertex 2
 * @param {Node} p3 - Triangle vertex 3
 * @returns {boolean} True if point is inside triangle
 */
function isPointInTriangle(px, py, p1, p2, p3) {
  const area = 0.5 * (-p2.y * p3.x + p1.y * (-p2.x + p3.x) + p1.x * (p2.y - p3.y) + p2.x * p3.y);
  const s = 1 / (2 * area) * (p1.y * p3.x - p1.x * p3.y + (p3.y - p1.y) * px + (p1.x - p3.x) * py);
  const t = 1 / (2 * area) * (p1.x * p2.y - p1.y * p2.x + (p1.y - p2.y) * px + (p2.x - p1.x) * py);
  
  return s > 0 && t > 0 && 1 - s - t > 0;
}

/**
 * Get barycentric coordinates of point in triangle
 * @param {number} x - Point X
 * @param {number} y - Point Y
 * @param {Node} p1 - Triangle vertex 1
 * @param {Node} p2 - Triangle vertex 2
 * @param {Node} p3 - Triangle vertex 3
 * @returns {Object} Barycentric coordinates {w1, w2, w3}
 */
function getBarycentricCoordinates(x, y, p1, p2, p3) {
  const denom = (p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y);
  
  const w1 = ((p2.y - p3.y) * (x - p3.x) + (p3.x - p2.x) * (y - p3.y)) / denom;
  const w2 = ((p3.y - p1.y) * (x - p3.x) + (p1.x - p3.x) * (y - p3.y)) / denom;
  const w3 = 1 - w1 - w2;
  
  return { w1, w2, w3 };
}

/**
 * Get voltage of nearest node
 * @param {FEMMesh} mesh - FEM mesh
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {number} Nearest node voltage
 */
function getNearestNodeVoltage(mesh, x, y) {
  let minDist = Infinity;
  let nearestVoltage = 0;
  
  mesh.nodes.forEach(node => {
    const dist = Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2));
    if (dist < minDist) {
      minDist = dist;
      nearestVoltage = node.voltage;
    }
  });
  
  return nearestVoltage;
}

/**
 * Calculate touch voltage at a point
 * @param {FEMMesh} mesh - FEM mesh with solved voltages
 * @param {number} x - X coordinate in meters
 * @param {number} y - Y coordinate in meters
 * @param {number} surfaceResistivity - Surface layer resistivity
 * @returns {number} Touch voltage in volts
 */
export function calculateTouchVoltage(mesh, x, y, surfaceResistivity = 10000) {
  const gridVoltage = getVoltageAtPoint(mesh, x, y);
  const bodyResistance = 1000; // 1000 ohm body resistance
  
  // Simplified touch voltage calculation
  const touchVoltage = gridVoltage * (bodyResistance / (bodyResistance + surfaceResistivity));
  
  return touchVoltage;
}

/**
 * Calculate step voltage between two points
 * @param {FEMMesh} mesh - FEM mesh with solved voltages
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @param {number} stepDistance - Step distance in meters (default: 1)
 * @returns {number} Step voltage in volts
 */
export function calculateStepVoltage(mesh, x1, y1, x2, y2, stepDistance = 1) {
  const v1 = getVoltageAtPoint(mesh, x1, y1);
  const v2 = getVoltageAtPoint(mesh, x2, y2);
  
  // Ensure points are at correct distance
  const actualDistance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const scaleFactor = stepDistance / actualDistance;
  
  return Math.abs(v2 - v1) * scaleFactor;
}

/**
 * Run complete FEM simulation
 * @param {Object} vectorGrid - Vector grid configuration
 * @param {Object} params - Design parameters
 * @param {number} gpr - Ground potential rise
 * @param {number} resolution - Mesh resolution
 * @returns {Object} Simulation results
 */
export function runFEMSimulation(vectorGrid, params, gpr, resolution = 0.5) {
  // Generate mesh
  const mesh = generateFEMMesh(vectorGrid, params, resolution);
  
  // Build resistance matrix
  const matrixSystem = buildResistanceMatrix(mesh, params);
  
  // Solve system
  const voltages = solveFEMSystem(matrixSystem, gpr);
  
  // Update mesh with voltages
  mesh.nodes.forEach((node, index) => {
    node.voltage = voltages[index];
  });
  
  // Calculate maximum touch and step voltages
  const maxTouchVoltage = calculateMaximumTouchVoltage(mesh, params);
  const maxStepVoltage = calculateMaximumStepVoltage(mesh, params);
  
  return {
    mesh,
    voltages,
    maxTouchVoltage,
    maxStepVoltage,
    properties: {
      resolution,
      numNodes: mesh.nodes.length,
      numElements: mesh.elements.length,
      gpr
    }
  };
}

/**
 * Calculate maximum touch voltage
 * @param {FEMMesh} mesh - FEM mesh
 * @param {Object} params - Design parameters
 * @returns {number} Maximum touch voltage
 */
function calculateMaximumTouchVoltage(mesh, params) {
  let maxVoltage = 0;
  const surfaceResistivity = params.surfaceResistivity || 10000;
  
  // Sample points around conductors
  mesh.nodes.forEach(node => {
    if (!node.isConductor) {
      const touchVoltage = calculateTouchVoltage(mesh, node.x, node.y, surfaceResistivity);
      maxVoltage = Math.max(maxVoltage, touchVoltage);
    }
  });
  
  return maxVoltage;
}

/**
 * Calculate maximum step voltage
 * @param {FEMMesh} mesh - FEM mesh
 * @param {Object} params - Design parameters
 * @returns {number} Maximum step voltage
 */
function calculateMaximumStepVoltage(mesh, params) {
  let maxVoltage = 0;
  const stepDistance = 1; // 1 meter step
  
  // Sample points around conductors
  mesh.nodes.forEach(node => {
    if (!node.isConductor) {
      // Check voltages at 1m distance in different directions
      const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
      ];
      
      directions.forEach(dir => {
        const x2 = node.x + dir.x * stepDistance;
        const y2 = node.y + dir.y * stepDistance;
        
        const stepVoltage = calculateStepVoltage(mesh, node.x, node.y, x2, y2, stepDistance);
        maxVoltage = Math.max(maxVoltage, stepVoltage);
      });
    }
  });
  
  return maxVoltage;
}

export default {
  generateFEMMesh,
  buildResistanceMatrix,
  solveFEMSystem,
  getVoltageAtPoint,
  calculateTouchVoltage,
  calculateStepVoltage,
  runFEMSimulation
};
