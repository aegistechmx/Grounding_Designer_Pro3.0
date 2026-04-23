/**
 * PDF Charts - ETAP-style Heatmap with Equipotential Contour Lines
 * Grounding Designer Pro - Professional Engineering Visualization
 */

import { createCanvas } from 'canvas';
import { contours } from 'd3-contour';

/**
 * Generate heatmap with equipotential contour lines (ETAP-style)
 * @param {Array} data - Grid data with potential values
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Buffer} PNG image buffer
 */
export function generateHeatmapWithContours(data, width = 800, height = 500) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // Create grid (50x50 for smooth contours)
  const size = 50;
  const values = new Array(size * size).fill(0);

  data.forEach((d, i) => {
    values[i] = d.potential || 0;
  });

  // Normalize values
  const min = Math.min(...values);
  const max = Math.max(...values);

  const scale = v => (v - min) / (max - min + 1e-6);

  // Smooth heatmap
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const v = scale(values[y * size + x]);

      // Red-yellow gradient (ETAP style)
      const r = 255;
      const g = Math.floor(255 * (1 - v));
      const b = 0;

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(
        (x / size) * width,
        (y / size) * height,
        width / size,
        height / size
      );
    }
  }

  // Equipotential contour lines
  const contourGen = contours()
    .size([size, size])
    .thresholds(10); // Number of contour lines

  const contourData = contourGen(values);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;

  contourData.forEach(contour => {
    contour.coordinates.forEach(polygon => {
      polygon.forEach(ring => {
        ctx.beginPath();
        ring.forEach(([x, y], i) => {
          const px = (x / size) * width;
          const py = (y / size) * height;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      });
    });
  });

  return canvas.toBuffer('image/png');
}

/**
 * Draw professional legend (ETAP-style)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} min - Minimum potential value
 * @param {number} max - Maximum potential value
 * @param {number} x - Legend x position
 * @param {number} y - Legend y position
 */
export function drawLegend(ctx, min, max, x, y) {
  const width = 20;
  const height = 200;

  // Gradient legend
  for (let i = 0; i < height; i++) {
    const t = i / height;
    const r = 255;
    const g = Math.floor(255 * (1 - t));
    const b = 0;

    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, y + i, width, 1);
  }

  // Legend border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  // Legend labels
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px Arial';

  ctx.fillText(`${max.toFixed(0)} V`, x + 25, y + 10);
  ctx.fillText(`${((max + min) / 2).toFixed(0)} V`, x + 25, y + height / 2);
  ctx.fillText(`${min.toFixed(0)} V`, x + 25, y + height);

  // Legend title
  ctx.font = 'bold 11px Arial';
  ctx.fillText('Potencial (V)', x, y - 5);
}

/**
 * Generate heatmap with legend
 * @param {Array} data - Grid data
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Buffer} PNG image buffer with legend
 */
export function generateHeatmapWithLegend(data, width = 800, height = 500) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Generate heatmap
  const heatmapBuffer = generateHeatmapWithContours(data, width - 50, height);
  
  // Load heatmap onto canvas
  const img = new Image();
  img.src = heatmapBuffer;
  ctx.drawImage(img, 0, 0, width - 50, height);

  // Draw legend
  const values = data.map(d => d.potential || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  drawLegend(ctx, min, max, width - 40, 50);

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
