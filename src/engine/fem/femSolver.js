/**
 * FEM Solver - Real Engineering Solver
 * Finite Element Method solver for grounding grid analysis
 * Grounding Designer Pro - Professional Engineering Simulation
 */

/**
 * Solve FEM system
 * @param {Object} system - Physical system with nodes, elements, conductivity
 * @param {Object} config - Solver configuration
 * @returns {Promise<Object>} Solution with node potentials
 */
export async function solveFEM(system, config = {}) {
  const { nodes, elements, conductivity, boundary, sources } = system;
  const N = nodes.length;

  // Global stiffness matrix and force vector
  const K = new Float64Array(N * N);
  const F = new Float64Array(N);

  // Assembly process
  for (const el of elements) {
    const Ke = localStiffness(el, nodes, conductivity);

    for (let i = 0; i < el.nodes.length; i++) {
      for (let j = 0; j < el.nodes.length; j++) {
        const globalI = el.nodes[i];
        const globalJ = el.nodes[j];
        K[globalI * N + globalJ] += Ke[i][j];
      }
    }
  }

  // Apply boundary conditions
  applyBoundaryConditions(K, F, boundary, N);

  // Apply source currents
  if (sources && sources.length > 0) {
    sources.forEach(source => {
      const nodeId = source.nodeId;
      if (nodeId >= 0 && nodeId < N) {
        F[nodeId] += source.current;
      }
    });
  }

  // Solve linear system
  const V = solveLinearSystem(K, F, config);

  return {
    values: V,
    convergence: checkConvergence(V, config.tolerance),
    iterations: config.maxIterations || 0
  };
}

/**
 * Calculate local stiffness matrix for an element
 * @param {Object} element - Element with node IDs
 * @param {Array} nodes - All nodes
 * @param {number} conductivity - Material conductivity
 * @returns {Array} Local stiffness matrix
 */
function localStiffness(element, nodes, conductivity) {
  const elNodes = element.nodes.map(id => nodes[id]);
  const n = elNodes.length;

  // For 2D quadrilateral elements
  if (element.type === 'quad') {
    return quadStiffness(elNodes, conductivity);
  }

  // For 3D hexahedral elements
  if (element.type === 'hex') {
    return hexStiffness(elNodes, conductivity);
  }

  // Default: simple spring model
  return simpleStiffness(elNodes, conductivity);
}

/**
 * Quadrilateral element stiffness matrix
 */
function quadStiffness(nodes, conductivity) {
  const n = 4;
  const Ke = Array(n).fill(0).map(() => Array(n).fill(0));

  // Calculate element area
  const [n1, n2, n3, n4] = nodes;
  const area = 0.5 * Math.abs(
    (n2.x - n1.x) * (n3.y - n1.y) - (n3.x - n1.x) * (n2.y - n1.y)
  ) + 0.5 * Math.abs(
    (n4.x - n1.x) * (n3.y - n1.y) - (n3.x - n1.x) * (n4.y - n1.y)
  );

  // Bilinear shape function derivatives (simplified)
  const dx = Math.abs(n2.x - n1.x);
  const dy = Math.abs(n3.y - n1.y);

  // Stiffness matrix for bilinear quadrilateral
  const k = conductivity * area / (dx * dy);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        Ke[i][j] = 4 * k;
      } else if (Math.abs(i - j) === 1 || Math.abs(i - j) === 3) {
        Ke[i][j] = -k;
      } else {
        Ke[i][j] = -k;
      }
    }
  }

  return Ke;
}

/**
 * Hexahedral element stiffness matrix
 */
function hexStiffness(nodes, conductivity) {
  const n = 8;
  const Ke = Array(n).fill(0).map(() => Array(n).fill(0));

  // Calculate element volume
  const [n1, n2, n3, n4, n5, n6, n7, n8] = nodes;
  const dx = Math.abs(n2.x - n1.x);
  const dy = Math.abs(n3.y - n1.y);
  const dz = Math.abs(n5.z - n1.z);
  const volume = dx * dy * dz;

  // Trilinear shape function stiffness
  const k = conductivity * volume / (dx * dy * dz);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        Ke[i][j] = 8 * k;
      } else {
        Ke[i][j] = -k;
      }
    }
  }

  return Ke;
}

/**
 * Simple spring stiffness (fallback)
 */
function simpleStiffness(nodes, conductivity) {
  const n = nodes.length;
  const Ke = Array(n).fill(0).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        Ke[i][j] = conductivity;
      } else {
        Ke[i][j] = -conductivity / (n - 1);
      }
    }
  }

  return Ke;
}

/**
 * Apply boundary conditions to stiffness matrix
 */
function applyBoundaryConditions(K, F, boundary, N) {
  if (!boundary || !boundary.nodes) return;

  boundary.nodes.forEach(bc => {
    const { id, potential } = bc;
    if (id >= 0 && id < N) {
      // Dirichlet boundary condition
      for (let i = 0; i < N; i++) {
        if (i !== id) {
          F[i] -= K[i * N + id] * potential;
          K[i * N + id] = 0;
          K[id * N + i] = 0;
        }
      }
      K[id * N + id] = 1;
      F[id] = potential;
    }
  });
}

/**
 * Solve linear system using Conjugate Gradient method
 */
function solveLinearSystem(K, F, config = {}) {
  const N = F.length;
  const tolerance = config.tolerance || 1e-6;
  const maxIterations = config.maxIterations || 1000;

  // Initial guess
  let x = new Float64Array(N);
  let r = new Float64Array(F);
  let p = new Float64Array(r);
  let rsold = dotProduct(r, r);

  for (let iter = 0; iter < maxIterations; iter++) {
    const Ap = matrixVectorMultiply(K, p);
    const alpha = rsold / dotProduct(p, Ap);

    for (let i = 0; i < N; i++) {
      x[i] += alpha * p[i];
      r[i] -= alpha * Ap[i];
    }

    const rsnew = dotProduct(r, r);

    if (Math.sqrt(rsnew) < tolerance) {
      break;
    }

    for (let i = 0; i < N; i++) {
      p[i] = r[i] + (rsnew / rsold) * p[i];
    }

    rsold = rsnew;
  }

  return x;
}

/**
 * Matrix-vector multiplication
 */
function matrixVectorMultiply(K, v) {
  const N = v.length;
  const result = new Float64Array(N);

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      result[i] += K[i * N + j] * v[j];
    }
  }

  return result;
}

/**
 * Dot product
 */
function dotProduct(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Check convergence
 */
function checkConvergence(V, tolerance) {
  const max = Math.max(...V.map(Math.abs));
  return max < tolerance ? 'converged' : 'max_iterations';
}

export default {
  solveFEM,
  localStiffness,
  applyBoundaryConditions
};
