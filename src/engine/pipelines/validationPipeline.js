// src/engine/pipelines/validationPipeline.js
// Cross-validation between analytical and discrete simulation methods

/**
 * Validates consistency between analytical and discrete simulation results
 * @param {Object} params - { analytical, discrete }
 * @param {Object} params.analytical - Analytical simulation results
 * @param {Object} params.discrete - Discrete (FEM) simulation results
 * @returns {Object} Validation result with valid status, errors, and differences
 */
export function validationPipeline({ analytical, discrete }) {
  validateInput(analytical, discrete);
  
  const errors = validateBasicConsistency(analytical, discrete);
  const differences = calculateMethodDifferences(analytical, discrete);
  
  return {
    valid: errors.length === 0,
    errors,
    diff: differences
  };
}

/**
 * Validates input parameters
 */
function validateInput(analytical, discrete) {
  if (!analytical || !discrete) {
    throw new Error('Validation requires both analytical and discrete results');
  }
}

/**
 * Validates basic consistency between touch and step voltages
 */
function validateBasicConsistency(analytical, discrete) {
  const errors = [];
  
  if (analytical.fault.touchVoltage < analytical.fault.stepVoltage) {
    errors.push('Analytical: touch voltage < step voltage');
  }

  if (discrete.fault.touchVoltage < discrete.fault.stepVoltage) {
    errors.push('Discrete: touch voltage < step voltage');
  }
  
  return errors;
}

/**
 * Calculates percentage differences between analytical and discrete methods
 */
function calculateMethodDifferences(analytical, discrete) {
  return {
    gridResistance: calculatePercentDifference(
      analytical.grid.resistance,
      discrete.grid.resistance
    ),
    gpr: calculatePercentDifference(
      analytical.fault.gpr,
      discrete.fault.gpr
    ),
    stepVoltage: calculatePercentDifference(
      analytical.fault.stepVoltage,
      discrete.fault.stepVoltage
    ),
    touchVoltage: calculatePercentDifference(
      analytical.fault.touchVoltage,
      discrete.fault.touchVoltage
    )
  };
}

/**
 * Calculates percentage difference between two values
 * @param {number} a - First value
 * @param {number} b - Second value
 * @returns {number|null} Percentage difference or null if invalid
 */
function calculatePercentDifference(a, b) {
  if (!a || !b) return null;
  return Math.abs(a - b) / ((a + b) / 2) * 100;
}