/**
 * Professional Legend Generator - ETAP Style
 * Generate engineering-grade legends for visualizations
 * Grounding Designer Pro - Professional Engineering Simulation
 */

/**
 * Generate legend data for ETAP-style visualization
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {Object} options - Legend options
 * @returns {Object} Legend data
 */
export function generateLegend(min, max, options = {}) {
  const {
    steps = 5,
    majorStep = 500,
    minorStep = 100,
    title = 'Voltage (V)',
    colorScale = 'etap'
  } = options;

  const levels = [];
  const start = Math.floor(min / minorStep) * minorStep;

  for (let v = start; v <= max; v += minorStep) {
    const isMajor = v % majorStep === 0;
    const isMinor = v % minorStep === 0;

    levels.push({
      value: v,
      label: `${v} V`,
      color: getETAPColor((v - min) / (max - min)),
      isMajor,
      isMinor,
      thickness: isMajor ? 2.5 : (isMinor ? 1.2 : 0.8),
      alpha: isMajor ? 1.0 : (isMinor ? 0.7 : 0.5)
    });
  }

  return {
    title,
    levels,
    min,
    max,
    range: max - min,
    colorScale
  };
}

/**
 * Generate simplified legend for display
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} numTicks - Number of tick marks
 * @returns {Array} Tick data
 */
export function generateLegendTicks(min, max, numTicks = 5) {
  const ticks = [];
  const step = (max - min) / numTicks;

  for (let i = 0; i <= numTicks; i++) {
    const value = min + i * step;
    const t = (value - min) / (max - min);
    
    ticks.push({
      value,
      label: `${Math.round(value)} V`,
      color: getETAPColor(t),
      position: i / numTicks
    });
  }

  return ticks;
}

/**
 * Get ETAP-style color for normalized value
 * @param {number} t - Normalized value (0-1)
 * @returns {string} RGB color string
 */
function getETAPColor(t) {
  if (t < 0.33) {
    const k = t / 0.33;
    return `rgb(${Math.floor(255 * k)}, 255, 0)`;
  } else if (t < 0.66) {
    const k = (t - 0.33) / 0.33;
    return `rgb(255, ${Math.floor(255 * (1 - k))}, 0)`;
  } else {
    const k = (t - 0.66) / 0.34;
    return `rgb(255, ${Math.floor(255 * (1 - k))}, 0)`;
  }
}

/**
 * Draw legend on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} legend - Legend data
 * @param {Object} position - Legend position
 * @param {Object} size - Legend size
 */
export function drawLegendCanvas(ctx, legend, position = { x: 20, y: 20 }, size = { width: 20, height: 200 }) {
  const { x, y } = position;
  const { width, height } = size;
  const { min, max, title } = legend;

  // Draw gradient bar
  for (let i = 0; i < height; i++) {
    const t = 1 - i / height;
    ctx.fillStyle = getETAPColor(t);
    ctx.fillRect(x, y + i, width, 1);
  }

  // Draw border
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  // Draw ticks and labels
  ctx.fillStyle = '#000';
  ctx.font = '10px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const ticks = generateLegendTicks(min, max, 5);
  ticks.forEach(tick => {
    const py = y + tick.position * height;

    // Draw tick mark
    ctx.beginPath();
    ctx.moveTo(x + width, py);
    ctx.lineTo(x + width + 5, py);
    ctx.stroke();

    // Draw label
    ctx.fillText(tick.label, x + width + 8, py);
  });

  // Draw title
  ctx.font = 'bold 11px Arial';
  ctx.fillText(title, x, y - 8);
}

/**
 * Generate color bar gradient for WebGL
 * @param {number} steps - Number of gradient steps
 * @returns {Array} Array of RGB values
 */
export function generateColorBar(steps = 256) {
  const colors = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    colors.push(getETAPColorRGB(t));
  }
  return colors;
}

/**
 * Get ETAP color as RGB array
 * @param {number} t - Normalized value (0-1)
 * @returns {Array} RGB array [r, g, b]
 */
function getETAPColorRGB(t) {
  if (t < 0.33) {
    const k = t / 0.33;
    return [Math.floor(255 * k), 255, 0];
  } else if (t < 0.66) {
    const k = (t - 0.33) / 0.33;
    return [255, Math.floor(255 * (1 - k)), 0];
  } else {
    const k = (t - 0.66) / 0.34;
    return [255, Math.floor(255 * (1 - k)), 0];
  }
}

/**
 * Generate legend for 3D iso-surfaces
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {Array} levels - Contour levels
 * @returns {Object} 3D legend data
 */
export function generate3DLegend(min, max, levels) {
  const surfaces = levels.map(level => ({
    level,
    color: getETAPColor((level - min) / (max - min)),
    opacity: level % 500 === 0 ? 0.8 : 0.4,
    isMajor: level % 500 === 0
  }));

  return {
    min,
    max,
    surfaces,
    colorScale: 'etap'
  };
}

export default {
  generateLegend,
  generateLegendTicks,
  drawLegendCanvas,
  generateColorBar,
  generate3DLegend
};
