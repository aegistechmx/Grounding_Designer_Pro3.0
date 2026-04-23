/**
 * Contour Labels Service - Rotated Labels on Contours
 * ETAP-style professional contour line labeling
 * Grounding Designer Pro - Professional Engineering Visualization
 */

/**
 * Draw contour labels rotated to match contour direction
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} contours - Array of contour lines (each is array of points)
 * @param {Array} levels - Array of voltage levels for each contour
 * @param {Object} mapper - Coordinate mapper with mapX, mapY functions
 */
function drawContourLabels(ctx, contours, levels, mapper) {
  ctx.font = '10px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  contours.forEach((line, i) => {
    if (!line || line.length < 10) return; // Skip null/undefined or short contours

    const mid = Math.floor(line.length / 2);
    const p1 = line[mid];
    const p2 = line[mid + 1];

    if (!p1 || !p2) return; // Skip if points are invalid

    // Calculate angle of contour at midpoint
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    // Map to canvas coordinates
    const px = mapper.mapX(p1.x);
    const py = mapper.mapY(p1.y);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);

    // Draw label with background for visibility
    const levelValue = levels[i] !== undefined ? levels[i] : 0;
    const label = `${levelValue.toFixed(0)} V`;
    const textWidth = ctx.measureText(label).width;
    
    // Background for label
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(-textWidth / 2 - 2, -6, textWidth + 4, 12);
    
    // Label text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, 0, 0);

    ctx.restore();
  });
}

/**
 * Draw contour labels with custom styling
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} contours - Array of contour lines
 * @param {Array} levels - Array of voltage levels
 * @param {Object} mapper - Coordinate mapper
 * @param {Object} options - Styling options
 */
function drawContourLabelsWithOptions(ctx, contours, levels, mapper, options = {}) {
  const {
    fontSize = 10,
    fontFamily = 'Arial',
    textColor = '#ffffff',
    backgroundColor = 'rgba(0, 0, 0, 0.7)',
    showBackground = true
  } = options;

  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  contours.forEach((line, i) => {
    if (!line || line.length < 10) return; // Skip null/undefined or short contours

    const mid = Math.floor(line.length / 2);
    const p1 = line[mid];
    const p2 = line[mid + 1];

    if (!p1 || !p2) return; // Skip if points are invalid

    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    const px = mapper.mapX(p1.x);
    const py = mapper.mapY(p1.y);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);

    const levelValue = levels[i] !== undefined ? levels[i] : 0;
    const label = `${levelValue.toFixed(0)} V`;
    const textWidth = ctx.measureText(label).width;

    if (showBackground) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(-textWidth / 2 - 2, -fontSize / 2 - 2, textWidth + 4, fontSize + 4);
    }

    ctx.fillStyle = textColor;
    ctx.fillText(label, 0, 0);

    ctx.restore();
  });
}

module.exports = {
  drawContourLabels,
  drawContourLabelsWithOptions
};
