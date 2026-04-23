/**
 * Contour Smoothing Service - Catmull-Rom Spline
 * ETAP-style professional contour line smoothing
 * Grounding Designer Pro - Professional Engineering Visualization
 */

/**
 * Catmull-Rom spline smoothing (ETAP-style)
 * @param {Array} points - Array of points with x, y coordinates
 * @param {number} tension - Tension parameter (0.5 is standard)
 * @param {number} segments - Number of segments per curve (12 is standard)
 * @returns {Array} Smoothed contour points
 */
function smoothContour(points, tension = 0.5, segments = 12) {
  if (!points || points.length < 3) return points;

  const result = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    // Use integer iteration to avoid floating point precision issues
    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const t2 = t * t;
      const t3 = t2 * t;

      const x =
        0.5 *
        ((2 * p1.x) +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

      const y =
        0.5 *
        ((2 * p1.y) +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

      result.push({ x, y });
    }
  }

  return result;
}

/**
 * Smooth multiple contours
 * @param {Array} contours - Array of contour lines (each is array of points)
 * @param {number} tension - Tension parameter
 * @param {number} segments - Segments per curve
 * @returns {Array} Smoothed contours
 */
function smoothContours(contours, tension = 0.5, segments = 12) {
  return contours.map(line => smoothContour(line, tension, segments));
}

module.exports = {
  smoothContour,
  smoothContours
};
