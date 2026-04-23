/**
 * PDF Legend - Professional Color Scale (ETAP-style)
 * Grounding Designer Pro - Engineering Legend
 */

/**
 * Get heat color for normalized value (0-1)
 * Red-yellow gradient (ETAP style)
 * @param {number} t - Normalized value (0-1)
 * @returns {string} RGB color string
 */
export function getHeatColor(t) {
  const r = 255;
  const g = Math.floor(255 * (1 - t));
  const b = 0;
  return `rgb(${r},${g},${b})`;
}

/**
 * Draw professional legend (ETAP-style)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} min - Minimum potential value
 * @param {number} max - Maximum potential value
 * @param {number} x - Legend x position
 * @param {number} y - Legend y position
 * @param {number} height - Legend height
 */
export function drawLegend(ctx, min, max, x = 520, y = 50, height = 300) {
  const width = 20;
  const steps = 10;

  // Draw gradient legend
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const color = getHeatColor(t);

    ctx.fillStyle = color;
    ctx.fillRect(x, y + i * (height / steps), width, height / steps);

    // Add value labels
    const value = (max - t * (max - min)).toFixed(0);
    ctx.fillStyle = '#000000';
    ctx.font = '10px Arial';
    ctx.fillText(`${value} V`, x + 30, y + i * (height / steps) + 10);
  }

  // Legend border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  // Legend title
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 11px Arial';
  ctx.fillText('Potencial (V)', x, y - 5);
}

/**
 * Draw legend with gradient (smooth)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} min - Minimum potential value
 * @param {number} max - Maximum potential value
 * @param {number} x - Legend x position
 * @param {number} y - Legend y position
 * @param {number} height - Legend height
 */
export function drawGradientLegend(ctx, min, max, x = 520, y = 50, height = 300) {
  const width = 20;

  // Create gradient
  const gradient = ctx.createLinearGradient(x, y, x, y + height);
  gradient.addColorStop(0, 'rgb(255, 255, 0)'); // Yellow (high)
  gradient.addColorStop(1, 'rgb(255, 0, 0)'); // Red (low)

  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);

  // Legend border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  // Add value labels at key points
  ctx.fillStyle = '#000000';
  ctx.font = '10px Arial';
  ctx.fillText(`${max.toFixed(0)} V`, x + 30, y + 10);
  ctx.fillText(`${((max + min) / 2).toFixed(0)} V`, x + 30, y + height / 2);
  ctx.fillText(`${min.toFixed(0)} V`, x + 30, y + height);

  // Legend title
  ctx.font = 'bold 11px Arial';
  ctx.fillText('Potencial (V)', x, y - 5);
}

/**
 * Draw scale bar (spatial scale)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Scale bar x position
 * @param {number} y - Scale bar y position
 * @param {number} length - Scale bar length in pixels
 * @param {number} realLength - Real length in meters
 */
export function drawScaleBar(ctx, x = 50, y = 380, length = 100, realLength = 10) {
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + length, y);
  ctx.stroke();

  // Add tick marks
  ctx.beginPath();
  ctx.moveTo(x, y - 5);
  ctx.lineTo(x, y + 5);
  ctx.moveTo(x + length, y - 5);
  ctx.lineTo(x + length, y + 5);
  ctx.stroke();

  // Add label
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${realLength} m`, x + length / 2, y + 20);
  ctx.textAlign = 'left';
}
