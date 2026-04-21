/**
 * Solver FEM para campo eléctrico en malla de tierra
 * Discretización 2D + Gradiente conjugado
 */

// ============================================
// 1. DISCRETIZACIÓN DE LA MALLA
// ============================================

export const discretizeGrid = (bounds, resolution = 50) => {
  const { minX, maxX, minY, maxY } = bounds;
  const dx = (maxX - minX) / resolution;
  const dy = (maxY - minY) / resolution;
  
  const nodes = [];
  const elements = [];
  
  // Crear nodos
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      nodes.push({
        id: i * (resolution + 1) + j,
        x: minX + i * dx,
        y: minY + j * dy,
        potential: 0,
        conductivity: 1
      });
    }
  }
  
  // Crear elementos (cuadriláteros)
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const n0 = i * (resolution + 1) + j;
      const n1 = (i + 1) * (resolution + 1) + j;
      const n2 = (i + 1) * (resolution + 1) + j + 1;
      const n3 = i * (resolution + 1) + j + 1;
      
      elements.push({ nodes: [n0, n1, n2, n3], conductivity: 1 });
    }
  }
  
  return { nodes, elements, dx, dy, resolution };
};

// ============================================
// 2. MATRIZ DE RIGIDEZ (FEM)
// ============================================

export const buildStiffnessMatrix = (nodes, elements, conductivity) => {
  const n = nodes.length;
  const K = Array(n).fill().map(() => Array(n).fill(0));
  
  for (const element of elements) {
    const [n0, n1, n2, n3] = element.nodes;
    const cond = element.conductivity;
    
    // Matriz elemental simplificada
    const ke = [
      [2, -1, -1, 0],
      [-1, 2, 0, -1],
      [-1, 0, 2, -1],
      [0, -1, -1, 2]
    ];
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        K[element.nodes[i]][element.nodes[j]] += cond * ke[i][j];
      }
    }
  }
  
  return K;
};

// ============================================
// 3. SOLVER DE GRADIENTE CONJUGADO
// ============================================

export const conjugateGradient = (A, b, maxIter = 1000, tol = 1e-6) => {
  const n = b.length;
  let x = Array(n).fill(0);
  let r = [...b];
  let p = [...r];
  let rsold = dot(r, r);
  
  for (let iter = 0; iter < maxIter; iter++) {
    const Ap = matVec(A, p);
    const alpha = rsold / dot(p, Ap);
    
    for (let i = 0; i < n; i++) {
      x[i] += alpha * p[i];
      r[i] -= alpha * Ap[i];
    }
    
    const rsnew = dot(r, r);
    if (Math.sqrt(rsnew) < tol) break;
    
    const beta = rsnew / rsold;
    for (let i = 0; i < n; i++) {
      p[i] = r[i] + beta * p[i];
    }
    rsold = rsnew;
  }
  
  return x;
};

const dot = (a, b) => a.reduce((sum, val, i) => sum + val * b[i], 0);

const matVec = (A, v) => {
  const n = v.length;
  const result = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      result[i] += A[i][j] * v[j];
    }
  }
  return result;
};

// ============================================
// 4. SOLVER DE POTENCIAL ELÉCTRICO
// ============================================

export const solveElectricField = (bounds, sources, resolution = 80) => {
  // Discretizar dominio
  const { nodes, elements } = discretizeGrid(bounds, resolution);
  
  // Aplicar condiciones de borde (fuentes de corriente)
  const b = Array(nodes.length).fill(0);
  for (const source of sources) {
    // Encontrar nodo más cercano a la fuente
    let minDist = Infinity;
    let closestIdx = 0;
    for (let i = 0; i < nodes.length; i++) {
      const dx = nodes[i].x - source.x;
      const dy = nodes[i].y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }
    b[closestIdx] = source.current;
  }
  
  // Construir matriz de rigidez
  const K = buildStiffnessMatrix(nodes, elements, 1);
  
  // Resolver sistema
  const potentials = conjugateGradient(K, b);
  
  // Actualizar nodos con potenciales
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].potential = potentials[i];
  }
  
  // Calcular campo eléctrico (gradiente)
  for (let i = 0; i < nodes.length; i++) {
    const idx = i;
    const nx = nodes[idx].x;
    const ny = nodes[idx].y;
    
    // Buscar nodos vecinos
    let gradX = 0, gradY = 0;
    let count = 0;
    
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const dx = nodes[j].x - nx;
      const dy = nodes[j].y - ny;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5) {
        gradX += (nodes[j].potential - potentials[i]) * dx / dist;
        gradY += (nodes[j].potential - potentials[i]) * dy / dist;
        count++;
      }
    }
    
    if (count > 0) {
      nodes[i].Ex = -gradX / count;
      nodes[i].Ey = -gradY / count;
      nodes[i].E = Math.sqrt(nodes[i].Ex ** 2 + nodes[i].Ey ** 2);
    }
  }
  
  return nodes;
};

// ============================================
// 5. INTERPOLACIÓN BICÚBICA PARA HEATMAP
// ============================================

export const bicubicInterpolation = (grid, x, y) => {
  // Encontrar celda que contiene el punto
  const xi = Math.floor(x / grid.dx);
  const yi = Math.floor(y / grid.dy);
  
  if (xi < 0 || xi >= grid.resolution || yi < 0 || yi >= grid.resolution) {
    return 0;
  }
  
  // Obtener valores en los 16 puntos vecinos
  const values = [];
  for (let i = -1; i <= 2; i++) {
    for (let j = -1; j <= 2; j++) {
      const ix = Math.min(Math.max(0, xi + i), grid.resolution);
      const iy = Math.min(Math.max(0, yi + j), grid.resolution);
      values.push(grid.values[ix][iy]);
    }
  }
  
  // Interpolación bicúbica simplificada
  const u = (x - xi * grid.dx) / grid.dx;
  const v = (y - yi * grid.dy) / grid.dy;
  
  // Coeficientes de interpolación
  const coeff = [
    [1, 0, -3, 2],
    [0, 0, 3, -2],
    [0, 1, -2, 1],
    [0, 0, -1, 1]
  ];
  
  let result = 0;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result += values[i * 4 + j] * coeff[i][j];
    }
  }
  
  return Math.max(0, result);
};

// ============================================
// FEM SOLVER CON GAUSS-SEIDEL (Laplace)
// ============================================

export class FemSolver {
  constructor(width, height, iterations = 100) {
    this.width = width;
    this.height = height;
    this.iterations = iterations;
    this.grid = null;
    this.sources = [];
    this.boundaryConditions = [];
  }

  // Inicializar grid con valores por defecto
  initGrid() {
    const grid = [];
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        // Condiciones de borde: tierra = 0V
        if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
          row.push(0);
        } else {
          row.push(0);
        }
      }
      grid.push(row);
    }
    this.grid = grid;
    return grid;
  }

  // Agregar fuente de corriente (electrodo)
  addSource(x, y, voltage = 1) {
    const ix = Math.floor(x * this.width);
    const iy = Math.floor(y * this.height);
    if (ix >= 0 && ix < this.width && iy >= 0 && iy < this.height) {
      this.sources.push({ x: ix, y: iy, voltage });
      this.grid[iy][ix] = voltage;
    }
  }

  // Agregar condición de borde
  addBoundary(x, y, voltage) {
    const ix = Math.floor(x * this.width);
    const iy = Math.floor(y * this.height);
    if (ix >= 0 && ix < this.width && iy >= 0 && iy < this.height) {
      this.boundaryConditions.push({ x: ix, y: iy, voltage });
      this.grid[iy][ix] = voltage;
    }
  }

  // Solver de Gauss-Seidel para ecuación de Laplace
  solve() {
    for (let iter = 0; iter < this.iterations; iter++) {
      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 1; x < this.width - 1; x++) {
          // Verificar si es fuente o condición de borde
          const isSource = this.sources.some(s => s.x === x && s.y === y);
          const isBoundary = this.boundaryConditions.some(b => b.x === x && b.y === y);
          
          if (!isSource && !isBoundary) {
            // Promedio de vecinos (Laplace)
            this.grid[y][x] = (
              this.grid[y - 1][x] +
              this.grid[y + 1][x] +
              this.grid[y][x - 1] +
              this.grid[y][x + 1]
            ) / 4;
          }
        }
      }
    }
    return this.grid;
  }

  // Obtener valor interpolado en cualquier punto
  getValueAt(x, y) {
    const fx = x * (this.width - 1);
    const fy = y * (this.height - 1);
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    
    if (ix < 0 || ix >= this.width - 1 || iy < 0 || iy >= this.height - 1) {
      return 0;
    }
    
    const tx = fx - ix;
    const ty = fy - iy;
    
    // Interpolación bilineal
    const v00 = this.grid[iy][ix];
    const v10 = this.grid[iy][ix + 1];
    const v01 = this.grid[iy + 1][ix];
    const v11 = this.grid[iy + 1][ix + 1];
    
    const v0 = v00 * (1 - tx) + v10 * tx;
    const v1 = v01 * (1 - tx) + v11 * tx;
    
    return v0 * (1 - ty) + v1 * ty;
  }

  // Obtener gradiente (campo eléctrico) en un punto
  getGradientAt(x, y) {
    const eps = 0.01;
    const vx = this.getValueAt(x + eps, y) - this.getValueAt(x - eps, y);
    const vy = this.getValueAt(x, y + eps) - this.getValueAt(x, y - eps);
    return { ex: vx / (2 * eps), ey: vy / (2 * eps) };
  }

  // Obtener valor máximo
  getMaxValue() {
    let max = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] > max) max = this.grid[y][x];
      }
    }
    return max;
  }

  // Obtener valor mínimo
  getMinValue() {
    let min = Infinity;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] < min) min = this.grid[y][x];
      }
    }
    return min;
  }
}

// ============================================
// GENERAR COLOR SEGÚN VALOR (estilo ETAP)
// ============================================

export const getEtapColor = (value, minVal, maxVal) => {
  const t = maxVal > minVal ? (value - minVal) / (maxVal - minVal) : 0;
  
  // Mapa de colores estilo ETAP: azul -> verde -> amarillo -> rojo
  if (t <= 0.25) {
    // Azul a verde
    const r = 0;
    const g = Math.floor(100 + 155 * (t / 0.25));
    const b = Math.floor(200 - 100 * (t / 0.25));
    return `rgb(${r}, ${g}, ${b})`;
  } else if (t <= 0.5) {
    // Verde a amarillo
    const r = Math.floor(0 + 255 * ((t - 0.25) / 0.25));
    const g = Math.floor(255);
    const b = Math.floor(100 - 100 * ((t - 0.25) / 0.25));
    return `rgb(${r}, ${g}, ${b})`;
  } else if (t <= 0.75) {
    // Amarillo a naranja
    const r = Math.floor(255);
    const g = Math.floor(255 - 100 * ((t - 0.5) / 0.25));
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Naranja a rojo
    const r = Math.floor(255);
    const g = Math.floor(155 - 155 * ((t - 0.75) / 0.25));
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  }
};

// ============================================
// DIBUJAR HEATMAP EN CANVAS
// ============================================

export const drawHeatmap = (ctx, solver, width, height) => {
  if (!solver || !solver.grid) return;
  
  const cellW = width / solver.width;
  const cellH = height / solver.height;
  const maxVal = solver.getMaxValue();
  const minVal = solver.getMinValue();
  
  for (let y = 0; y < solver.height; y++) {
    for (let x = 0; x < solver.width; x++) {
      const value = solver.grid[y][x];
      const color = getEtapColor(value, minVal, maxVal);
      
      ctx.fillStyle = color;
      ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
    }
  }
  
  // Dibujar electrodos (fuentes)
  for (const source of solver.sources) {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(source.x * cellW + cellW / 2, source.y * cellH + cellH / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('⚡', source.x * cellW + cellW / 2 - 3, source.y * cellH + cellH / 2 + 3);
  }
};

export default {
  discretizeGrid,
  solveElectricField,
  bicubicInterpolation,
  conjugateGradient,
  FemSolver,
  getEtapColor,
  drawHeatmap
};
