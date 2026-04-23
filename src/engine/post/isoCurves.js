/**
 * Iso-Curves Post-Processing
 * Generate equipotential curves using Marching Squares
 * Grounding Designer Pro - Professional Engineering Simulation
 */

const EPS = 1e-6;

// Marching Squares lookup table
const CASES = {
  0:[],1:[[3,0]],2:[[0,1]],3:[[3,1]],
  4:[[1,2]],5:[[3,2],[0,1]],6:[[0,2]],7:[[3,2]],
  8:[[2,3]],9:[[0,2]],10:[[1,3],[0,2]],11:[[1,3]],
  12:[[1,3]],13:[[0,1]],14:[[3,0]],15:[]
};

/**
 * Linear interpolation
 */
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Interpolate point along edge
 */
function interp(p1, p2, v1, v2, level) {
  if (Math.abs(v2 - v1) < EPS) return p1;
  const t = (level - v1) / (v2 - v1);
  return { x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t) };
}

/**
 * Get edge point from cell
 */
function edgePoint(edge, cell, level) {
  const { tl, tr, br, bl } = cell;
  switch (edge) {
    case 0: return interp(tl, tr, tl.value, tr.value, level);
    case 1: return interp(tr, br, tr.value, br.value, level);
    case 2: return interp(bl, br, bl.value, br.value, level);
    case 3: return interp(tl, bl, tl.value, bl.value, level);
  }
}

/**
 * Marching Squares algorithm
 */
function marchingSquares(grid, gridSize, level) {
  const segs = [];
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const tl = grid[i][j];
      const tr = grid[i + 1][j];
      const br = grid[i + 1][j + 1];
      const bl = grid[i][j + 1];
      
      let idx = 0;
      if (tl.value > level) idx |= 8;
      if (tr.value > level) idx |= 4;
      if (br.value > level) idx |= 2;
      if (bl.value > level) idx |= 1;

      const conf = CASES[idx];
      if (!conf) continue;

      const cell = { tl, tr, br, bl };
      for (const [e1, e2] of conf) {
        const p1 = edgePoint(e1, cell, level);
        const p2 = edgePoint(e2, cell, level);
        segs.push([p1, p2]);
      }
    }
  }
  return segs;
}

/**
 * Connect segments into continuous lines
 */
function connectSegments(segments) {
  const lines = [];
  const used = new Set();

  for (let i = 0; i < segments.length; i++) {
    if (used.has(i)) continue;
    const line = [segments[i][0], segments[i][1]];
    used.add(i);

    let extended = true;
    while (extended) {
      extended = false;
      for (let j = 0; j < segments.length; j++) {
        if (used.has(j)) continue;
        const [a, b] = segments[j];
        const tail = line[line.length - 1];

        if (key(tail) === key(a)) {
          line.push(b);
          used.add(j);
          extended = true;
        } else if (key(tail) === key(b)) {
          line.push(a);
          used.add(j);
          extended = true;
        }
      }
    }
    lines.push(line);
  }
  return lines;
}

/**
 * Generate unique key for point
 */
function key(p) {
  return `${p.x.toFixed(4)},${p.y.toFixed(4)}`;
}

/**
 * Build 2D grid from nodes and values
 */
function buildGrid(nodes, values, nx, ny) {
  const grid = [];
  for (let i = 0; i <= nx; i++) {
    grid[i] = [];
    for (let j = 0; j <= ny; j++) {
      const idx = i * ny + j;
      grid[i][j] = {
        x: nodes[idx].x,
        y: nodes[idx].y,
        value: values[idx]
      };
    }
  }
  return grid;
}

/**
 * Generate iso-curves (equipotential lines)
 * @param {Object} field - Field with nodes and values
 * @param {Array} levels - Contour levels
 * @returns {Array} Array of iso-curves with ETAP styling
 */
export function generateIsoCurves(field, levels) {
  const { nodes, values } = field;
  
  // Determine grid dimensions
  const n = Math.sqrt(nodes.length);
  const nx = Math.floor(n);
  const ny = Math.floor(n);

  // Build grid
  const grid = buildGrid(nodes, values, nx, ny);

  const curves = [];

  for (const level of levels) {
    const segments = marchingSquares(grid, nx, level);
    const lines = connectSegments(segments);

    // ETAP-style thickness based on level
    const isMajor = Math.round(level) % 500 === 0;
    const isMinor = Math.round(level) % 100 === 0;

    curves.push({
      level,
      segments: lines,
      thickness: isMajor ? 2.5 : (isMinor ? 1.2 : 0.8),
      alpha: isMajor ? 1.0 : (isMinor ? 0.7 : 0.5),
      isMajor,
      isMinor
    });
  }

  return curves;
}

/**
 * Smooth curves using Catmull-Rom spline
 */
export function smoothCurves(curves, segments = 10) {
  return curves.map(curve => ({
    ...curve,
    segments: curve.segments.map(line => smoothCatmullRom(line, segments))
  }));
}

/**
 * Catmull-Rom smoothing
 */
function smoothCatmullRom(points, segments = 10) {
  if (points.length < 3) return points;
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    for (let t = 0; t <= 1; t += 1 / segments) {
      const t2 = t * t, t3 = t2 * t;
      const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      out.push({ x, y });
    }
  }
  return out;
}

export default {
  generateIsoCurves,
  smoothCurves
};
