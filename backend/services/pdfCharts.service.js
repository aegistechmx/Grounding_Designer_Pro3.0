/**
 * PDF Charts Service - ETAP-style Heatmap with Equipotential Contour Lines
 * Grounding Designer Pro - Professional Engineering Visualization
 * Server-side only - uses Node.js canvas library
 */

let createCanvas;
try {
  const canvas = require('canvas');
  createCanvas = canvas.createCanvas;
} catch (error) {
  console.warn('Canvas library not available - heatmap generation disabled');
  console.warn('Install canvas with: npm install canvas (requires native compilation)');
  createCanvas = null;
}

// Import ETAP-style contour services
const contourSmoothingService = require('./contourSmoothing.service');
const contourLabelsService = require('./contourLabels.service');

// ================================
// 🎨 CONFIG
// ================================
const WIDTH = 800;
const HEIGHT = 500;
const MARGIN = 60;

// ================================
// 🌈 COLOR SCALE (ETAP STYLE)
// ================================
function getHeatColor(t) {
  // Clamp
  t = Math.max(0, Math.min(1, t));

  let r, g, b;

  if (t < 0.33) {
    const k = t / 0.33;
    r = 255 * k;
    g = 255;
    b = 0;
  } else if (t < 0.66) {
    const k = (t - 0.33) / 0.33;
    r = 255;
    g = 255 * (1 - k);
    b = 0;
  } else {
    const k = (t - 0.66) / 0.34;
    r = 255;
    g = 255 * (1 - k);
    b = 0;
  }

  return `rgb(${r|0},${g|0},${b|0})`;
}

// ================================
// 📏 NORMALIZACIÓN
// ================================
function normalize(value, min, max) {
  if (max - min === 0) return 0.5;
  return (value - min) / (max - min);
}

// ================================
// 🗺️ MAPEO COORDENADAS
// ================================
function createMapper(data) {
  const xs = data.map(d => d.x);
  const ys = data.map(d => d.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const scaleX = (WIDTH - 2 * MARGIN) / (maxX - minX || 1);
  const scaleY = (HEIGHT - 2 * MARGIN) / (maxY - minY || 1);

  return {
    mapX: x => MARGIN + (x - minX) * scaleX,
    mapY: y => HEIGHT - MARGIN - (y - minY) * scaleY,
    minX,
    maxX,
    minY,
    maxY
  };
}

// ================================
// 🌡️ HEATMAP
// ================================
function drawHeatmap(ctx, data, mapper, min, max) {
  if (!data || data.length === 0) {
    console.warn('No data provided for heatmap generation');
    return;
  }

  const resolution = 80;

  const cellW = (WIDTH - 2 * MARGIN) / resolution;
  const cellH = (HEIGHT - 2 * MARGIN) / resolution;

  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const x = mapper.minX + (i / resolution) * (mapper.maxX - mapper.minX);
      const y = mapper.minY + (j / resolution) * (mapper.maxY - mapper.minY);

      // nearest point interpolation (rápido y suficiente)
      let closest = data[0];
      let minDist = Infinity;

      for (const p of data) {
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < minDist) {
          minDist = d;
          closest = p;
        }
      }

      const t = normalize(closest.potential, min, max);

      ctx.fillStyle = getHeatColor(t);
      ctx.fillRect(
        MARGIN + i * cellW,
        HEIGHT - MARGIN - j * cellH,
        cellW,
        cellH
      );
    }
  }
}

// ================================
// 🧠 CURVAS EQUIPOTENCIALES (MARCHING SQUARES)
// ================================

// ================================
// ⚙️ CONFIG
// ================================
const GRID_SIZE = 60; // resolución (ajustable)
const EPSILON = 1e-6;

// ================================
// 📏 INTERPOLACIÓN LINEAL
// ================================
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function interp(p1, p2, v1, v2, level) {
  if (Math.abs(v2 - v1) < EPSILON) return p1;
  const t = (level - v1) / (v2 - v1);
  return {
    x: lerp(p1.x, p2.x, t),
    y: lerp(p1.y, p2.y, t)
  };
}

// ================================
// 🌐 IDW (Interpolación rápida)
// ================================
function interpolateIDW(x, y, points, power = 2) {
  let num = 0;
  let den = 0;

  for (const p of points) {
    const dx = p.x - x;
    const dy = p.y - y;
    const d = Math.sqrt(dx * dx + dy * dy) + EPSILON;

    const w = 1 / Math.pow(d, power);

    num += w * p.potential;
    den += w;
  }

  return num / den;
}

// ================================
// 🗺️ GENERAR GRID ESCALAR
// ================================
function buildScalarField(data, mapper) {
  if (!data || data.length === 0) {
    console.warn('No data provided for scalar field generation');
    return [];
  }

  const grid = [];

  for (let i = 0; i <= GRID_SIZE; i++) {
    const row = [];

    for (let j = 0; j <= GRID_SIZE; j++) {
      const x = mapper.minX + (i / GRID_SIZE) * (mapper.maxX - mapper.minX);
      const y = mapper.minY + (j / GRID_SIZE) * (mapper.maxY - mapper.minY);

      const value = interpolateIDW(x, y, data);

      row.push({
        x,
        y,
        value
      });
    }

    grid.push(row);
  }

  return grid;
}

// ================================
// 🧠 CASE TABLE (Marching Squares)
// ================================
const CASES = {
  0: [],
  1: [[3, 0]],
  2: [[0, 1]],
  3: [[3, 1]],
  4: [[1, 2]],
  5: [[3, 2], [0, 1]],
  6: [[0, 2]],
  7: [[3, 2]],
  8: [[2, 3]],
  9: [[0, 2]],
  10: [[1, 3], [0, 2]],
  11: [[1, 3]],
  12: [[1, 3]],
  13: [[0, 1]],
  14: [[3, 0]],
  15: []
};

// Edges:
// 0 = top
// 1 = right
// 2 = bottom
// 3 = left

// ================================
// 🔗 EDGE INTERSECTION
// ================================
function getEdgePoint(edge, cell, level) {
  const { tl, tr, br, bl } = cell;

  switch (edge) {
    case 0: // top
      return interp(tl, tr, tl.value, tr.value, level);
    case 1: // right
      return interp(tr, br, tr.value, br.value, level);
    case 2: // bottom
      return interp(bl, br, bl.value, br.value, level);
    case 3: // left
      return interp(tl, bl, tl.value, bl.value, level);
  }
}

// ================================
// 🧩 MARCHING SQUARES CORE
// ================================
function marchingSquares(grid, level) {
  const lines = [];

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {

      const tl = grid[i][j];
      const tr = grid[i + 1][j];
      const br = grid[i + 1][j + 1];
      const bl = grid[i][j + 1];

      const cell = { tl, tr, br, bl };

      // bitmask
      let index = 0;
      if (tl.value > level) index |= 8;
      if (tr.value > level) index |= 4;
      if (br.value > level) index |= 2;
      if (bl.value > level) index |= 1;

      const config = CASES[index];
      if (!config) continue;

      config.forEach(pair => {
        const p1 = getEdgePoint(pair[0], cell, level);
        const p2 = getEdgePoint(pair[1], cell, level);

        lines.push([p1, p2]);
      });
    }
  }

  return lines;
}

// ================================
// 🔗 UNIR SEGMENTOS EN CURVAS
// ================================
function connectLines(segments) {
  const lines = [];
  const used = new Set();

  function key(p) {
    return `${p.x.toFixed(4)},${p.y.toFixed(4)}`;
  }

  for (let i = 0; i < segments.length; i++) {
    if (used.has(i)) continue;

    const line = [...segments[i]];
    used.add(i);

    let extended = true;
    let iterations = 0;
    const MAX_ITERATIONS = segments.length * 2; // Prevent infinite loops

    while (extended && iterations < MAX_ITERATIONS) {
      extended = false;
      iterations++;

      for (let j = 0; j < segments.length; j++) {
        if (used.has(j)) continue;

        const seg = segments[j];

        if (key(line[line.length - 1]) === key(seg[0])) {
          line.push(seg[1]);
          used.add(j);
          extended = true;
        } else if (key(line[line.length - 1]) === key(seg[1])) {
          line.push(seg[0]);
          used.add(j);
          extended = true;
        }
      }
    }

    if (iterations >= MAX_ITERATIONS) {
      console.warn('connectLines reached iteration limit - possible cycle in segments');
    }

    lines.push(line);
  }

  return lines;
}

// ================================
// 🧠 CURVAS EQUIPOTENCIALES
// ================================
function drawContours(ctx, data, mapper, min, max) {
  const levels = [];
  const steps = 10;

  for (let i = 0; i <= steps; i++) {
    levels.push(min + (i / steps) * (max - min));
  }

  // Build scalar field with IDW interpolation
  const grid = buildScalarField(data, mapper);

  // Generate contours using Marching Squares, organized by level
  const contoursByLevel = [];

  levels.forEach(level => {
    const segments = marchingSquares(grid, level);
    const lines = connectLines(segments);
    contoursByLevel.push(lines);
  });

  // Apply ETAP-style smoothing to contours per level
  const smoothedContoursByLevel = contoursByLevel.map(lines =>
    lines.map(line => contourSmoothingService.smoothContour(line, 0.5, 12))
  );

  // Draw contours with smoothing
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.2;

  smoothedContoursByLevel.forEach(lines => {
    lines.forEach(line => {
      ctx.beginPath();
      line.forEach((point, i) => {
        const px = mapper.mapX(point.x);
        const py = mapper.mapY(point.y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    });
  });

  // Draw ETAP-style rotated labels on contours (one label per level)
  const representativeContours = smoothedContoursByLevel.map(lines => lines[0] || []);
  contourLabelsService.drawContourLabels(ctx, representativeContours, levels, mapper);
}

// ================================
// 📏 GRID
// ================================
function drawGrid(ctx) {
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;

  for (let x = MARGIN; x < WIDTH - MARGIN; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, MARGIN);
    ctx.lineTo(x, HEIGHT - MARGIN);
    ctx.stroke();
  }

  for (let y = MARGIN; y < HEIGHT - MARGIN; y += 50) {
    ctx.beginPath();
    ctx.moveTo(MARGIN, y);
    ctx.lineTo(WIDTH - MARGIN, y);
    ctx.stroke();
  }
}

// ================================
// 📊 LEYENDA
// ================================
function drawLegend(ctx, min, max) {
  const x = WIDTH - 40;
  const y = MARGIN;
  const height = 300;

  const steps = 10;

  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const color = getHeatColor(t);

    ctx.fillStyle = color;
    ctx.fillRect(x, y + i * (height / steps), 20, height / steps);

    const value = (max - t * (max - min)).toFixed(0);

    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    ctx.fillText(
      `${value} V`,
      x - 50,
      y + i * (height / steps) + 10
    );
  }
}

// ================================
// 📏 ESCALA
// ================================
function drawScale(ctx, mapper) {
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;

  const lengthPx = 100;
  const realLength = ((mapper.maxX - mapper.minX) / (WIDTH - 2 * MARGIN)) * lengthPx;

  ctx.beginPath();
  ctx.moveTo(MARGIN, HEIGHT - 20);
  ctx.lineTo(MARGIN + lengthPx, HEIGHT - 20);
  ctx.stroke();

  ctx.font = '12px Arial';
  ctx.fillText(`${realLength.toFixed(1)} m`, MARGIN + 20, HEIGHT - 5);
}

// ================================
// 🏁 EXPORT PRINCIPAL
// ================================
function generateHeatmapChart(data = []) {
  if (!createCanvas) {
    console.warn('Cannot generate heatmap - canvas library not available');
    return null;
  }

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // fondo blanco
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (!data.length) {
    ctx.fillStyle = '#000';
    ctx.fillText('No data available', 100, 100);
    return canvas.toBuffer('image/png');
  }

  const potentials = data.map(d => d.potential || 0);
  const min = Math.min(...potentials);
  const max = Math.max(...potentials);

  const mapper = createMapper(data);

  // 🔥 render pipeline
  drawHeatmap(ctx, data, mapper, min, max);
  drawGrid(ctx);
  drawContours(ctx, data, mapper, min, max);
  drawLegend(ctx, min, max);
  drawScale(ctx, mapper);

  // border
  ctx.strokeStyle = '#000';
  ctx.strokeRect(MARGIN, MARGIN, WIDTH - 2*MARGIN, HEIGHT - 2*MARGIN);

  return canvas.toBuffer('image/png');
}

module.exports = {
  generateHeatmapChart,
  isAvailable: () => createCanvas !== null
};
