/**
 * Curve Generation Utilities
 * Generates engineering curves from grid data (ETAP-style)
 */

/**
 * Generate potential curve from grid data
 * @param {Array} gridData - Array of grid points with x, y, potential
 * @returns {Array} Curve data with distance and potential
 */
export function generatePotentialCurve(gridData) {
  if (!gridData || gridData.length === 0) return [];

  // Sort by radial distance from center
  const sorted = [...gridData].sort((a, b) => {
    const da = Math.sqrt(a.x * a.x + a.y * a.y);
    const db = Math.sqrt(b.x * b.x + b.y * b.y);
    return da - db;
  });

  return sorted.map(p => ({
    distance: Math.sqrt(p.x * p.x + p.y * p.y),
    potential: p.potential || 0
  }));
}

/**
 * Generate touch voltage curve along a path
 * @param {Array} gridData - Grid points
 * @param {Object} params - Design parameters
 * @returns {Array} Touch voltage curve data
 */
export function generateTouchVoltageCurve(gridData, params) {
  if (!gridData || gridData.length === 0) return [];

  const sorted = [...gridData].sort((a, b) => {
    const da = Math.sqrt(a.x * a.x + a.y * a.y);
    const db = Math.sqrt(b.x * b.x + b.y * b.y);
    return da - db;
  });

  return sorted.map(p => ({
    distance: Math.sqrt(p.x * p.x + p.y * p.y),
    touchVoltage: p.touchVoltage || 0
  }));
}

/**
 * Generate step voltage curve along a path
 * @param {Array} gridData - Grid points
 * @param {Object} params - Design parameters
 * @returns {Array} Step voltage curve data
 */
export function generateStepVoltageCurve(gridData, params) {
  if (!gridData || gridData.length === 0) return [];

  const sorted = [...gridData].sort((a, b) => {
    const da = Math.sqrt(a.x * a.x + a.y * a.y);
    const db = Math.sqrt(b.x * b.x + b.y * b.y);
    return da - db;
  });

  return sorted.map(p => ({
    distance: Math.sqrt(p.x * a.x + p.y * p.y),
    stepVoltage: p.stepVoltage || 0
  }));
}

/**
 * Generate GPR decay curve
 * @param {Object} calculations - Calculation results
 * @param {number} maxDistance - Maximum distance to plot
 * @param {number} points - Number of points in curve
 * @returns {Array} GPR decay curve data
 */
export function generateGPRDecayCurve(calculations, maxDistance = 100, points = 50) {
  if (!calculations || !calculations.GPR) return [];

  const curve = [];
  const GPR = calculations.GPR;
  const Rg = calculations.Rg || 1;

  for (let i = 0; i <= points; i++) {
    const distance = (i / points) * maxDistance;
    // Simplified GPR decay model
    const potential = GPR * Math.exp(-distance / (Rg * 10));
    curve.push({
      distance,
      potential
    });
  }

  return curve;
}

/**
 * Generate combined voltage curve (touch + step)
 * @param {Array} gridData - Grid points
 * @param {Object} calculations - Calculation results
 * @returns {Object} Combined curve data
 */
export function generateCombinedVoltageCurve(gridData, calculations) {
  const touchCurve = generateTouchVoltageCurve(gridData, calculations);
  const stepCurve = generateStepVoltageCurve(gridData, calculations);

  return {
    touch: touchCurve,
    step: stepCurve,
    touchLimit: calculations.Etouch70 || 0,
    stepLimit: calculations.Estep70 || 0
  };
}
