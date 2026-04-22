// Comparison utilities for IEEE 80 Dual-Method Analysis

export function getError(analytical, discrete) {
  if (!analytical || !discrete) return 0;
  if (analytical === 0) return 0;
  return ((discrete - analytical) / analytical) * 100;
}

export function formatDiff(diff) {
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}%`;
}

export function getInterpretation(results) {
  if (!results?.analytical || !results?.discrete) {
    return "Insufficient data for comparison.";
  }

  const diffStep = getError(results.analytical.step, results.discrete.step);
  const diffTouch = getError(results.analytical.touch, results.discrete.touch);
  const diffResistance = getError(results.analytical.resistance, results.discrete.resistance);

  const maxDiff = Math.max(Math.abs(diffStep), Math.abs(diffTouch), Math.abs(diffResistance));

  if (maxDiff < 20) {
    return "Excellent agreement between analytical and discrete methods. Results are highly reliable.";
  } else if (maxDiff < 50) {
    return "Good agreement with expected methodological differences. Both methods provide valid insights for engineering decisions.";
  } else {
    return "Significant differences detected. Discrete method captures non-uniform field effects and spatial current distribution not present in analytical model. Consider both results for comprehensive analysis.";
  }
}

export function getDifferenceColor(diff) {
  const absDiff = Math.abs(diff);
  if (absDiff < 20) return 'text-green-600';
  if (absDiff < 50) return 'text-yellow-600';
  return 'text-red-600';
}

export function getBarColor(diff) {
  const absDiff = Math.abs(diff);
  if (absDiff < 20) return 'bg-green-500';
  if (absDiff < 50) return 'bg-yellow-500';
  return 'bg-red-500';
}
