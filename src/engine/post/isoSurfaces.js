/**
 * Iso-Surfaces 3D Post-Processing
 * Generate 3D equipotential surfaces using Marching Cubes
 * Grounding Designer Pro - Professional Engineering Simulation
 */

const EPS = 1e-6;

// Marching Cubes lookup table (simplified - 256 cases)
// For production, use full lookup table
const TRIANGLE_TABLE = [
  [], // Case 0
  [[0,8,3]], // Case 1
  [[0,1,9]], // Case 2
  [[1,8,3],[9,8,1]], // Case 3
  [[1,2,10]], // Case 4
  [[0,8,3],[1,2,10]], // Case 5
  [[9,2,10],[0,2,9]], // Case 6
  [[2,8,3],[2,10,8],[10,9,8]], // Case 7
  [[3,11,2]], // Case 8
  [[0,11,2],[8,11,0]], // Case 9
  [[1,9,0],[2,3,11]], // Case 10
  [[1,11,2],[1,9,11],[9,8,11]], // Case 11
  [[3,10,1],[11,10,3]], // Case 12
  [[0,10,1],[0,8,10],[8,11,10]], // Case 13
  [[3,9,0],[3,11,9],[11,10,9]], // Case 14
  [[9,8,10],[10,8,11]], // Case 15
  // ... (would continue for all 256 cases in full implementation)
];

/**
 * Linear interpolation in 3D
 */
function interp3D(p1, p2, v1, v2, level) {
  if (Math.abs(v2 - v1) < EPS) return p1;
  const t = (level - v1) / (v2 - v1);
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
    z: p1.z + (p2.z - p1.z) * t
  };
}

/**
 * Get vertex from cube edge
 */
function getVertex(edge, cube, level) {
  const { v0, v1, v2, v3, v4, v5, v6, v7 } = cube;
  switch (edge) {
    case 0: return interp3D(v0, v1, v0.value, v1.value, level);
    case 1: return interp3D(v1, v2, v1.value, v2.value, level);
    case 2: return interp3D(v2, v3, v2.value, v3.value, level);
    case 3: return interp3D(v3, v0, v3.value, v0.value, level);
    case 4: return interp3D(v4, v5, v4.value, v5.value, level);
    case 5: return interp3D(v5, v6, v5.value, v6.value, level);
    case 6: return interp3D(v6, v7, v6.value, v7.value, level);
    case 7: return interp3D(v7, v4, v7.value, v4.value, level);
    case 8: return interp3D(v0, v4, v0.value, v4.value, level);
    case 9: return interp3D(v1, v5, v1.value, v5.value, level);
    case 10: return interp3D(v2, v6, v2.value, v6.value, level);
    case 11: return interp3D(v3, v7, v3.value, v7.value, level);
  }
}

/**
 * Marching Cubes algorithm
 */
function marchingCubes(volume, nx, ny, nz, level) {
  const triangles = [];

  for (let i = 0; i < nx - 1; i++) {
    for (let j = 0; j < ny - 1; j++) {
      for (let k = 0; k < nz - 1; k++) {
        const cube = {
          v0: volume[i][j][k],
          v1: volume[i + 1][j][k],
          v2: volume[i + 1][j + 1][k],
          v3: volume[i][j + 1][k],
          v4: volume[i][j][k + 1],
          v5: volume[i + 1][j][k + 1],
          v6: volume[i + 1][j + 1][k + 1],
          v7: volume[i][j + 1][k + 1]
        };

        // Calculate cube index
        let cubeIndex = 0;
        if (cube.v0.value > level) cubeIndex |= 1;
        if (cube.v1.value > level) cubeIndex |= 2;
        if (cube.v2.value > level) cubeIndex |= 4;
        if (cube.v3.value > level) cubeIndex |= 8;
        if (cube.v4.value > level) cubeIndex |= 16;
        if (cube.v5.value > level) cubeIndex |= 32;
        if (cube.v6.value > level) cubeIndex |= 64;
        if (cube.v7.value > level) cubeIndex |= 128;

        // Get triangles for this case
        const triList = TRIANGLE_TABLE[cubeIndex] || [];
        
        for (const tri of triList) {
          const v1 = getVertex(tri[0], cube, level);
          const v2 = getVertex(tri[1], cube, level);
          const v3 = getVertex(tri[2], cube, level);
          triangles.push([v1, v2, v3]);
        }
      }
    }
  }

  return triangles;
}

/**
 * Build 3D volume from nodes and values
 */
function buildVolume(nodes, values, nx, ny, nz) {
  const volume = [];
  for (let i = 0; i < nx; i++) {
    volume[i] = [];
    for (let j = 0; j < ny; j++) {
      volume[i][j] = [];
      for (let k = 0; k < nz; k++) {
        const idx = i * ny * nz + j * nz + k;
        volume[i][j][k] = {
          x: nodes[idx].x,
          y: nodes[idx].y,
          z: nodes[idx].z,
          value: values[idx]
        };
      }
    }
  }
  return volume;
}

/**
 * Generate iso-surfaces (3D equipotential surfaces)
 * @param {Object} volume - 3D volume with nodes and values
 * @param {Array} levels - Contour levels
 * @returns {Array} Array of iso-surfaces
 */
export function generateIsoSurfaces(volume, levels) {
  const { nodes, values } = volume;
  
  // Determine volume dimensions
  const n = Math.cbrt(nodes.length);
  const nx = Math.floor(n);
  const ny = Math.floor(n);
  const nz = Math.floor(n);

  // Build 3D volume
  const vol = buildVolume(nodes, values, nx, ny, nz);

  const surfaces = [];

  for (const level of levels) {
    const triangles = marchingCubes(vol, nx, ny, nz, level);

    // ETAP-style styling
    const isMajor = Math.round(level) % 500 === 0;

    surfaces.push({
      level,
      triangles,
      opacity: isMajor ? 0.8 : 0.4,
      isMajor
    });
  }

  return surfaces;
}

/**
 * Simplify mesh (reduce triangle count)
 */
export function simplifyMesh(surface, reductionFactor = 0.5) {
  // Quadric edge collapse simplification (simplified)
  // For production, use proper mesh simplification algorithm
  return {
    ...surface,
    triangles: surface.triangles.filter((_, idx) => idx % Math.floor(1 / reductionFactor) === 0)
  };
}

/**
 * Compute surface normals
 */
export function computeNormals(surface) {
  const normals = [];
  
  surface.triangles.forEach(tri => {
    const [v0, v1, v2] = tri;
    
    // Calculate edge vectors
    const edge1 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
    const edge2 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };
    
    // Cross product
    const normal = {
      x: edge1.y * edge2.z - edge1.z * edge2.y,
      y: edge1.z * edge2.x - edge1.x * edge2.z,
      z: edge1.x * edge2.y - edge1.y * edge2.x
    };
    
    // Normalize
    const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
    if (len > EPS) {
      normal.x /= len;
      normal.y /= len;
      normal.z /= len;
    }
    
    normals.push(normal);
  });
  
  return { ...surface, normals };
}

export default {
  generateIsoSurfaces,
  simplifyMesh,
  computeNormals
};
