/**
 * IEEE 80 Mesh Generation
 * Real engineering mesh based on IEEE 80 standard
 * Grounding Designer Pro - Professional Engineering Simulation
 */

/**
 * Generate IEEE 80 compliant mesh from grid
 * @param {Object} grid - Grid definition with dimensions
 * @param {number} resolution - Mesh resolution (number of divisions)
 * @returns {Object} Mesh with nodes and elements
 */
export function generateIEEE80Mesh(grid, resolution = 70) {
  const nodes = [];
  const elements = [];

  // Grid dimensions
  const length = grid.length || 30; // meters
  const width = grid.width || 30;   // meters
  const depth = grid.depth || 0;    // meters (for 3D)

  const nx = resolution;
  const ny = resolution;
  const nz = depth > 0 ? Math.floor(resolution / 2) : 1;

  const dx = length / (nx - 1);
  const dy = width / (ny - 1);
  const dz = depth > 0 ? depth / (nz - 1) : 0;

  // Generate nodes
  for (let k = 0; k < nz; k++) {
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const id = k * nx * ny + i * ny + j;
        nodes.push({
          id,
          x: i * dx,
          y: j * dy,
          z: k * dz,
          type: 'node'
        });
      }
    }
  }

  // Generate elements (quadrilateral for 2D, hexahedral for 3D)
  if (nz === 1) {
    // 2D quadrilateral elements
    for (let i = 0; i < nx - 1; i++) {
      for (let j = 0; j < ny - 1; j++) {
        const n1 = i * ny + j;
        const n2 = n1 + 1;
        const n3 = n1 + ny;
        const n4 = n3 + 1;

        elements.push({
          id: i * (ny - 1) + j,
          type: 'quad',
          nodes: [n1, n2, n4, n3]
        });
      }
    }
  } else {
    // 3D hexahedral elements
    for (let k = 0; k < nz - 1; k++) {
      for (let i = 0; i < nx - 1; i++) {
        for (let j = 0; j < ny - 1; j++) {
          const base = k * nx * ny + i * ny + j;
          const n1 = base;
          const n2 = base + 1;
          const n3 = base + ny;
          const n4 = base + ny + 1;
          const n5 = base + nx * ny;
          const n6 = base + nx * ny + 1;
          const n7 = base + nx * ny + ny;
          const n8 = base + nx * ny + ny + 1;

          elements.push({
            id: k * (nx - 1) * (ny - 1) + i * (ny - 1) + j,
            type: 'hex',
            nodes: [n1, n2, n4, n3, n5, n6, n8, n7]
          });
        }
      }
    }
  }

  return {
    nodes,
    elements,
    metadata: {
      nx,
      ny,
      nz,
      dx,
      dy,
      dz,
      totalNodes: nodes.length,
      totalElements: elements.length
    }
  };
}

/**
 * Refine mesh locally around electrodes
 * @param {Object} mesh - Base mesh
 * @param {Array} electrodes - Electrode positions
 * @param {number} refinementLevel - Refinement factor
 * @returns {Object} Refined mesh
 */
export function refineMeshAroundElectrodes(mesh, electrodes, refinementLevel = 2) {
  // This would implement local mesh refinement
  // For now, return the base mesh
  return mesh;
}

/**
 * Validate mesh quality
 * @param {Object} mesh - Mesh to validate
 * @returns {Object} Validation results
 */
export function validateMesh(mesh) {
  const { nodes, elements } = mesh;
  const issues = [];

  // Check for degenerate elements
  elements.forEach((el, idx) => {
    const elNodes = el.nodes.map(id => nodes[id]);
    const area = calculateElementArea(elNodes, el.type);
    
    if (area < 1e-10) {
      issues.push({
        type: 'degenerate_element',
        elementId: idx,
        area
      });
    }
  });

  // Check for duplicate nodes
  const nodePositions = new Map();
  nodes.forEach((node, idx) => {
    const key = `${node.x.toFixed(6)},${node.y.toFixed(6)},${node.z.toFixed(6)}`;
    if (nodePositions.has(key)) {
      issues.push({
        type: 'duplicate_node',
        nodeId: idx,
        duplicateOf: nodePositions.get(key)
      });
    } else {
      nodePositions.set(key, idx);
    }
  });

  return {
    valid: issues.length === 0,
    issues,
    statistics: {
      totalNodes: nodes.length,
      totalElements: elements.length,
      avgElementArea: calculateAverageElementArea(mesh)
    }
  };
}

/**
 * Calculate element area
 */
function calculateElementArea(nodes, type) {
  if (type === 'quad') {
    // 2D quadrilateral area
    const [n1, n2, n3, n4] = nodes;
    const area1 = 0.5 * Math.abs(
      (n2.x - n1.x) * (n3.y - n1.y) - (n3.x - n1.x) * (n2.y - n1.y)
    );
    const area2 = 0.5 * Math.abs(
      (n4.x - n1.x) * (n3.y - n1.y) - (n3.x - n1.x) * (n4.y - n1.y)
    );
    return area1 + area2;
  }
  return 0;
}

/**
 * Calculate average element area
 */
function calculateAverageElementArea(mesh) {
  const { nodes, elements } = mesh;
  let totalArea = 0;
  
  elements.forEach(el => {
    const elNodes = el.nodes.map(id => nodes[id]);
    totalArea += calculateElementArea(elNodes, el.type);
  });
  
  return totalArea / elements.length;
}

export default {
  generateIEEE80Mesh,
  refineMeshAroundElectrodes,
  validateMesh
};
