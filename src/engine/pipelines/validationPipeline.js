export function validationPipeline({ analytical, discrete }) {
  if (!analytical || !discrete) {
    throw new Error('Validation requires both analytical and discrete results');
  }

  const errors = [];

  // =========================
  // 1. CONSISTENCIA BÁSICA
  // =========================
  if (analytical.fault.touchVoltage < analytical.fault.stepVoltage) {
    errors.push('Analytical: touch voltage < step voltage');
  }

  if (discrete.fault.touchVoltage < discrete.fault.stepVoltage) {
    errors.push('Discrete: touch voltage < step voltage');
  }

  // =========================
  // 2. DIFERENCIAS ENTRE MÉTODOS
  // =========================
  const diff = {
    gridResistance: percentDiff(
      analytical.grid.resistance,
      discrete.grid.resistance
    ),
    gpr: percentDiff(
      analytical.fault.gpr,
      discrete.fault.gpr
    ),
    stepVoltage: percentDiff(
      analytical.fault.stepVoltage,
      discrete.fault.stepVoltage
    ),
    touchVoltage: percentDiff(
      analytical.fault.touchVoltage,
      discrete.fault.touchVoltage
    )
  };

  return {
    valid: errors.length === 0,
    errors,
    diff
  };
}

function percentDiff(a, b) {
  if (!a || !b) return null;
  return Math.abs(a - b) / ((a + b) / 2) * 100;
}