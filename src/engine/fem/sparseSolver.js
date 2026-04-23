/**
 * Sparse FEM Solver - Optimized for Large Systems
 * Sparse matrix representation with Conjugate Gradient solver
 * Grounding Designer Pro - Professional Engineering Simulation
 */

/**
 * Create sparse matrix using Map for efficient storage
 * @param {number} n - Matrix dimension
 * @returns {Object} Sparse matrix structure
 */
export function createSparseMatrix(n) {
  return {
    n,
    values: new Map() // key: "i,j"
  };
}

/**
 * Add value to sparse matrix
 * @param {Object} K - Sparse matrix
 * @param {number} i - Row index
 * @param {number} j - Column index
 * @param {number} value - Value to add
 */
export function addToSparse(K, i, j, value) {
  const key = `${i},${j}`;
  K.values.set(key, (K.values.get(key) || 0) + value);
}

/**
 * Multiply sparse matrix by vector
 * @param {Object} K - Sparse matrix
 * @param {Float64Array} x - Vector
 * @returns {Float64Array} Result vector
 */
export function multiplySparse(K, x) {
  const result = new Float64Array(K.n);

  for (const [key, val] of K.values.entries()) {
    const [i, j] = key.split(',').map(Number);
    result[i] += val * x[j];
  }

  return result;
}

/**
 * Conjugate Gradient Solver for sparse systems
 * @param {Object} K - Sparse stiffness matrix
 * @param {Float64Array} b - Force vector
 * @param {number} tol - Tolerance
 * @param {number} maxIter - Maximum iterations
 * @returns {Float64Array} Solution vector
 */
export function solveCG(K, b, tol = 1e-6, maxIter = 1000) {
  const n = b.length;
  let x = new Float64Array(n);
  let r = b.slice();
  let p = r.slice();

  let rsold = dot(r, r);

  for (let i = 0; i < maxIter; i++) {
    const Ap = multiplySparse(K, p);
    const alpha = rsold / dot(p, Ap);

    for (let j = 0; j < n; j++) {
      x[j] += alpha * p[j];
      r[j] -= alpha * Ap[j];
    }

    const rsnew = dot(r, r);
    if (Math.sqrt(rsnew) < tol) break;

    for (let j = 0; j < n; j++) {
      p[j] = r[j] + (rsnew / rsold) * p[j];
    }

    rsold = rsnew;
  }

  return x;
}

/**
 * Dot product of two vectors
 * @param {Float64Array} a - First vector
 * @param {Float64Array} b - Second vector
 * @returns {number} Dot product
 */
function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/**
 * Convert dense matrix to sparse
 * @param {Float64Array} dense - Dense matrix (row-major)
 * @param {number} n - Matrix dimension
 * @returns {Object} Sparse matrix
 */
export function denseToSparse(dense, n) {
  const K = createSparseMatrix(n);
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const value = dense[i * n + j];
      if (Math.abs(value) > 1e-10) {
        addToSparse(K, i, j, value);
      }
    }
  }
  
  return K;
}

/**
 * Convert sparse matrix to dense (for debugging)
 * @param {Object} K - Sparse matrix
 * @returns {Float64Array} Dense matrix
 */
export function sparseToDense(K) {
  const dense = new Float64Array(K.n * K.n);
  
  for (const [key, val] of K.values.entries()) {
    const [i, j] = key.split(',').map(Number);
    dense[i * K.n + j] = val;
  }
  
  return dense;
}

/**
 * Apply boundary conditions to sparse matrix
 * @param {Object} K - Sparse stiffness matrix
 * @param {Float64Array} b - Force vector
 * @param {Array} boundary - Boundary conditions
 */
export function applySparseBoundaryConditions(K, b, boundary) {
  if (!boundary || !boundary.nodes) return;

  boundary.nodes.forEach(bc => {
    const { id, potential } = bc;
    if (id >= 0 && id < K.n) {
      // Get all keys involving this node
      const keysToRemove = [];
      const keysToSet = [];
      
      for (const key of K.values.keys()) {
        const [i, j] = key.split(',').map(Number);
        if (i === id || j === id) {
          if (i === id && j === id) {
            keysToSet.push(key);
          } else {
            keysToRemove.push(key);
          }
        }
      }
      
      // Remove off-diagonal entries
      keysToRemove.forEach(key => {
        const [i, j] = key.split(',').map(Number);
        if (i !== id) {
          b[i] -= K.values.get(key) * potential;
        }
        K.values.delete(key);
      });
      
      // Set diagonal to 1
      keysToSet.forEach(key => {
        K.values.set(key, 1);
      });
      
      b[id] = potential;
    }
  });
}

/**
 * Solve sparse FEM system
 * @param {Object} system - Physical system
 * @param {Object} config - Solver configuration
 * @returns {Promise<Object>} Solution
 */
export async function solveSparseFEM(system, config = {}) {
  const { nodes, elements, conductivity, boundary, sources } = system;
  const N = nodes.length;

  // Create sparse stiffness matrix
  const K = createSparseMatrix(N);
  const F = new Float64Array(N);

  // Assembly process with sparse storage
  for (const el of elements) {
    const Ke = localStiffness(el, nodes, conductivity);

    for (let i = 0; i < el.nodes.length; i++) {
      for (let j = 0; j < el.nodes.length; j++) {
        const globalI = el.nodes[i];
        const globalJ = el.nodes[j];
        addToSparse(K, globalI, globalJ, Ke[i][j]);
      }
    }
  }

  // Apply boundary conditions
  applySparseBoundaryConditions(K, F, boundary);

  // Apply source currents
  if (sources && sources.length > 0) {
    sources.forEach(source => {
      const nodeId = source.nodeId;
      if (nodeId >= 0 && nodeId < N) {
        F[nodeId] += source.current;
      }
    });
  }

  // Solve using Conjugate Gradient
  const V = solveCG(K, F, config.tolerance, config.maxIterations);

  return {
    values: V,
    convergence: checkConvergence(V, config.tolerance),
    iterations: config.maxIterations || 0,
    sparseMatrixSize: K.values.size
  };
}

/**
 * Local stiffness matrix (same as before)
 */
function localStiffness(element, nodes, conductivity) {
  const elNodes = element.nodes.map(id => nodes[id]);
  const n = elNodes.length;

  if (element.type === 'quad') {
    return quadStiffness(elNodes, conductivity);
  }

  if (element.type === 'hex') {
    return hexStiffness(elNodes, conductivity);
  }

  return simpleStiffness(elNodes, conductivity);
}

function quadStiffness(nodes, conductivity) {
  const n = 4;
  const Ke = Array(n).fill(0).map(() => Array(n).fill(0));

  const [n1, n2, n3, n4] = nodes;
  const area = 0.5 * Math.abs(
    (n2.x - n1.x) * (n3.y - n1.y) - (n3.x - n1.x) * (n2.y - n1.y)
  ) + 0.5 * Math.abs(
    (n4.x - n1.x) * (n3.y - n1.y) - (n3.x - n1.x) * (n4.y - n1.y)
  );

  const dx = Math.abs(n2.x - n1.x);
  const dy = Math.abs(n3.y - n1.y);
  const k = conductivity * area / (dx * dy);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        Ke[i][j] = 4 * k;
      } else {
        Ke[i][j] = -k;
      }
    }
  }

  return Ke;
}

function hexStiffness(nodes, conductivity) {
  const n = 8;
  const Ke = Array(n).fill(0).map(() => Array(n).fill(0));

  const [n1, n2, n3, n4, n5, n6, n7, n8] = nodes;
  const dx = Math.abs(n2.x - n1.x);
  const dy = Math.abs(n3.y - n1.y);
  const dz = Math.abs(n5.z - n1.z);
  const volume = dx * dy * dz;
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

function checkConvergence(V, tolerance) {
  const max = Math.max(...V.map(Math.abs));
  return max < tolerance ? 'converged' : 'max_iterations';
}

export default {
  createSparseMatrix,
  addToSparse,
  multiplySparse,
  solveCG,
  denseToSparse,
  sparseToDense,
  applySparseBoundaryConditions,
  solveSparseFEM
};
