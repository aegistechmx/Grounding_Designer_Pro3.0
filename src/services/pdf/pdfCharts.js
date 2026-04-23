/**
 * PDF Charts - ETAP-style Heatmap with Equipotential Contour Lines
 * Grounding Designer Pro - Professional Engineering Visualization
 */

import { createCanvas } from 'canvas';
import { generateContourLines } from '../../utils/contourLines';

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
// 🧠 CURVAS EQUIPOTENCIALES
// ================================
function drawContours(ctx, data, mapper, min, max) {
  const levels = [];
  const steps = 10;

  for (let i = 0; i <= steps; i++) {
    levels.push(min + (i / steps) * (max - min));
  }

  // Create interpolated field for contour generation
  const resolution = 50;
  const field = [];
  for (let i = 0; i < resolution; i++) {
    field[i] = [];
    for (let j = 0; j < resolution; j++) {
      const x = mapper.minX + (i / resolution) * (mapper.maxX - mapper.minX);
      const y = mapper.minY + (j / resolution) * (mapper.maxY - mapper.minY);
      
      // Find nearest point
      let closest = data[0];
      let minDist = Infinity;
      for (const p of data) {
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < minDist) {
          minDist = d;
          closest = p;
        }
      }
      field[i][j] = closest.potential;
    }
  }

  const contours = generateContourLines(field, levels, resolution);

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;

  contours.forEach(contour => {
    contour.lines.forEach(line => {
      ctx.beginPath();
      line.forEach((point, i) => {
        const x = mapper.mapX(point[0]);
        const y = mapper.mapY(point[1]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  });
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
export function generateHeatmapChart(data = []) {
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

/**
 * Legacy function for backward compatibility
 */
export const addHeatmap = (doc, heatmapImage) => {
  if (!heatmapImage) return;

  doc.addPage();

  doc.fontSize(14).text('Potential Distribution Heatmap');

  doc.image(heatmapImage, {
    fit: [500, 300],
    align: 'center'
  });
};
