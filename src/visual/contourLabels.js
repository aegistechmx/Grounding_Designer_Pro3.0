/**
 * Contour Labels Rendering - ETAP Style
 * Professional labels following contour direction
 * Grounding Designer Pro - Professional Engineering Visualization
 */

/**
 * Place labels on contours following curve direction
 * @param {Array} curves - Array of contour curves
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} options - Label options
 */
export function placeLabelsOnCurves(curves, ctx, options = {}) {
  const {
    fontSize = 12,
    fontFamily = 'Arial',
    textColor = '#000',
    backgroundColor = 'rgba(255, 255, 255, 0.9)',
    labelInterval = 0.3, // Label every 30% of curve length
    minSegmentLength = 10
  } = options;

  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  curves.forEach(curve => {
    if (curve.segments.length === 0) return;

    // Calculate total curve length
    const totalLength = calculateCurveLength(curve.segments);
    
    // Determine number of labels based on curve length
    const numLabels = Math.max(1, Math.floor(totalLength / labelInterval));
    
    // Place labels at regular intervals
    for (let i = 0; i < numLabels; i++) {
      const t = (i + 0.5) / numLabels;
      const position = getPointAtT(curve.segments, t);
      
      if (!position) continue;

      const angle = calculateAngleAtT(curve.segments, t);

      ctx.save();
      ctx.translate(position.x, position.y);
      ctx.rotate(angle);

      const label = `${Math.round(curve.level)} V`;
      const textWidth = ctx.measureText(label).width;

      // Draw background for visibility
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(-textWidth / 2 - 3, -fontSize / 2 - 2, textWidth + 6, fontSize + 4);

      // Draw label
      ctx.fillStyle = textColor;
      ctx.fillText(label, 0, 0);

      ctx.restore();
    }
  });
}

/**
 * Calculate total length of a curve
 * @param {Array} segments - Curve segments
 * @returns {number} Total length
 */
function calculateCurveLength(segments) {
  let length = 0;
  
  segments.forEach(seg => {
    for (let i = 1; i < seg.length; i++) {
      const dx = seg[i].x - seg[i - 1].x;
      const dy = seg[i].y - seg[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
  });
  
  return length;
}

/**
 * Get point at normalized position t along curve
 * @param {Array} segments - Curve segments
 * @param {number} t - Normalized position (0-1)
 * @returns {Object|null} Point at position t
 */
function getPointAtT(segments, t) {
  const totalLength = calculateCurveLength(segments);
  const targetLength = t * totalLength;
  
  let currentLength = 0;
  
  for (const seg of segments) {
    for (let i = 1; i < seg.length; i++) {
      const dx = seg[i].x - seg[i - 1].x;
      const dy = seg[i].y - seg[i - 1].y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);
      
      if (currentLength + segmentLength >= targetLength) {
        const segmentT = (targetLength - currentLength) / segmentLength;
        return {
          x: seg[i - 1].x + dx * segmentT,
          y: seg[i - 1].y + dy * segmentT
        };
      }
      
      currentLength += segmentLength;
    }
  }
  
  return null;
}

/**
 * Calculate angle at normalized position t along curve
 * @param {Array} segments - Curve segments
 * @param {number} t - Normalized position (0-1)
 * @returns {number} Angle in radians
 */
function calculateAngleAtT(segments, t) {
  const totalLength = calculateCurveLength(segments);
  const targetLength = t * totalLength;
  
  let currentLength = 0;
  
  for (const seg of segments) {
    for (let i = 1; i < seg.length; i++) {
      const dx = seg[i].x - seg[i - 1].x;
      const dy = seg[i].y - seg[i - 1].y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);
      
      if (currentLength + segmentLength >= targetLength) {
        return Math.atan2(dy, dx);
      }
      
      currentLength += segmentLength;
    }
  }
  
  return 0;
}

/**
 * Smooth curve using spline interpolation
 * @param {Array} points - Curve points
 * @param {number} tension - Spline tension (0-1)
 * @returns {Array} Smoothed points
 */
export function smoothCurve(points, tension = 0.5) {
  if (points.length < 3) return points;
  
  const smoothed = [];
  
  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    
    smoothed.push({
      x: (p0.x + p1.x + p2.x) / 3,
      y: (p0.y + p1.y + p2.y) / 3
    });
  }
  
  return smoothed;
}

/**
 * Apply ETAP-style thickness to curves
 * @param {Array} curves - Array of curves
 * @param {number} majorStep - Step for major contours (default 500)
 * @returns {Array} Curves with thickness
 */
export function applyETAPThickness(curves, majorStep = 500) {
  return curves.map(curve => ({
    ...curve,
    thickness: curve.level % majorStep === 0 ? 3 : 1,
    alpha: curve.level % majorStep === 0 ? 1.0 : 0.6
  }));
}

/**
 * Draw labels with background for better visibility
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} curves - Array of curves
 * @param {Object} options - Drawing options
 */
export function drawLabelsWithBackground(ctx, curves, options = {}) {
  const {
    fontSize = 10,
    fontFamily = 'Arial',
    textColor = '#000',
    backgroundColor = 'rgba(255, 255, 255, 0.9)',
    padding = 4
  } = options;

  ctx.font = `${fontSize}px ${fontFamily}`;

  curves.forEach(curve => {
    if (!curve.isMajor) return; // Only label major contours

    curve.segments.forEach(seg => {
      if (seg.length < 6) return;

      const mid = Math.floor(seg.length / 2);
      const p = seg[mid];
      const q = seg[mid + 1];

      if (!p || !q) return;

      const angle = Math.atan2(q.y - p.y, q.x - p.x);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(angle);

      const label = `${Math.round(curve.level)} V`;
      const textWidth = ctx.measureText(label).width;

      // Draw background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(
        -textWidth / 2 - padding,
        -fontSize / 2 - padding,
        textWidth + padding * 2,
        fontSize + padding * 2
      );

      // Draw label
      ctx.fillStyle = textColor;
      ctx.fillText(label, 0, 0);

      ctx.restore();
    });
  });
}

export default {
  placeLabelsOnCurves,
  smoothCurve,
  applyETAPThickness,
  drawLabelsWithBackground
};
