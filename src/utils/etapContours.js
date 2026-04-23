/**
 * ETAP-Style Contour Rendering (Frontend)
 * Professional engineering visualization with hierarchy, labels, and legend
 * Grounding Designer Pro - Professional Engineering Visualization
 */

/**
 * Get contour style based on voltage level (ETAP hierarchy)
 * @param {number} level - Voltage level
 * @param {number} baseStep - Base step for minor contours (default: 100)
 * @param {number} majorStep - Step for major contours (default: 500)
 * @returns {Object} Style object with width, alpha, and isMajor flag
 */
export function getContourStyle(level, baseStep = 100, majorStep = 500) {
  const roundedLevel = Math.round(level);
  const isMajor = roundedLevel % majorStep === 0;
  const isMinor = roundedLevel % baseStep === 0;

  return {
    width: isMajor ? 2.5 : (isMinor ? 1.2 : 0.8),
    alpha: isMajor ? 1.0 : (isMinor ? 0.7 : 0.5),
    isMajor,
    isMinor
  };
}

/**
 * Draw contours with ETAP-style hierarchy on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} contours - Array of contour lines with level and segments
 * @param {Object} options - Rendering options
 */
export function drawETAPContours(ctx, contours, options = {}) {
  const {
    baseStep = 100,
    majorStep = 500,
    showLabels = true,
    labelStep = 500
  } = options;

  contours.forEach(({ level, segments }) => {
    const style = getContourStyle(level, baseStep, majorStep);

    ctx.beginPath();

    segments.forEach(seg => {
      if (!seg || seg.length < 2) return;
      
      ctx.moveTo(seg[0].x, seg[0].y);
      for (let i = 1; i < seg.length; i++) {
        ctx.lineTo(seg[i].x, seg[i].y);
      }
    });

    ctx.strokeStyle = `rgba(0, 0, 0, ${style.alpha})`;
    ctx.lineWidth = style.width;
    ctx.stroke();
  });

  // Draw labels on major contours
  if (showLabels) {
    drawContourLabels(ctx, contours, { labelStep });
  }
}

/**
 * Draw rotated contour labels following contour direction
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} contours - Array of contour lines
 * @param {Object} options - Label options
 */
export function drawContourLabels(ctx, contours, options = {}) {
  const {
    labelStep = 500,
    fontSize = 10,
    fontFamily = 'Arial',
    textColor = '#111111',
    backgroundColor = 'rgba(255, 255, 255, 0.9)'
  } = options;

  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  contours.forEach(({ level, segments }) => {
    const roundedLevel = Math.round(level);
    
    // Only label major contours
    if (roundedLevel % labelStep !== 0) return;

    segments.forEach(seg => {
      if (!seg || seg.length < 10) return;

      const mid = Math.floor(seg.length / 2);
      const midPoint = seg[mid];
      const nextPoint = seg[mid + 1];

      if (!midPoint || !nextPoint) return;

      // Calculate angle of contour at midpoint
      const angle = Math.atan2(nextPoint.y - midPoint.y, nextPoint.x - midPoint.x);

      ctx.save();
      ctx.translate(midPoint.x, midPoint.y);
      ctx.rotate(angle);

      const label = `${roundedLevel} V`;
      const textWidth = ctx.measureText(label).width;

      // Draw background for visibility
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(-textWidth / 2 - 3, -fontSize / 2 - 2, textWidth + 6, fontSize + 4);

      // Draw label
      ctx.fillStyle = textColor;
      ctx.fillText(label, 0, 0);

      ctx.restore();
    });
  });
}

/**
 * Draw ETAP-style legend with calibrated ticks
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Legend width
 * @param {number} height - Legend height
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} numTicks - Number of tick marks
 */
export function drawETAPLegend(ctx, x, y, width, height, min, max, numTicks = 5) {
  // Draw gradient bar
  for (let i = 0; i < height; i++) {
    const t = 1 - i / height;
    const val = min + t * (max - min);
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

  for (let i = 0; i <= numTicks; i++) {
    const t = i / numTicks;
    const val = min + (1 - t) * (max - min);
    const py = y + t * height;

    // Draw tick mark
    ctx.beginPath();
    ctx.moveTo(x + width, py);
    ctx.lineTo(x + width + 5, py);
    ctx.stroke();

    // Draw label
    ctx.fillText(`${Math.round(val)} V`, x + width + 8, py);
  }

  // Draw title
  ctx.font = 'bold 11px Arial';
  ctx.fillText('Voltage (V)', x, y - 8);
}

/**
 * Get ETAP-style color for value (0-1 range)
 * @param {number} t - Normalized value (0-1)
 * @returns {string} Color string
 */
export function getETAPColor(t) {
  // ETAP-style color scale: blue -> green -> yellow -> red
  if (t < 0.25) {
    // Blue to cyan
    const localT = t / 0.25;
    return `rgb(0, ${Math.floor(localT * 255)}, 255)`;
  } else if (t < 0.5) {
    // Cyan to green
    const localT = (t - 0.25) / 0.25;
    return `rgb(0, 255, ${Math.floor(255 - localT * 255)})`;
  } else if (t < 0.75) {
    // Green to yellow
    const localT = (t - 0.5) / 0.25;
    return `rgb(${Math.floor(localT * 255)}, 255, 0)`;
  } else {
    // Yellow to red
    const localT = (t - 0.75) / 0.25;
    return `rgb(255, ${Math.floor(255 - localT * 255)}, 0)`;
  }
}

export default {
  getContourStyle,
  drawETAPContours,
  drawContourLabels,
  drawETAPLegend,
  getETAPColor
};
