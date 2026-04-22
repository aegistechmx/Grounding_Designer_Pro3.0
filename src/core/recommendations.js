/**
 * AI Recommendations Engine for Grounding Design
 * Generates structured engineering recommendations based on IEEE 80 calculations
 */

export const generateSmartRecommendations = (results) => {
  const actions = [];

  if (!results) return actions;

  // Check for high grounding resistance
  if (results.Rg > 5) {
    actions.push({
      priority: "HIGH",
      title: "High grounding resistance",
      action: "Add ground rods",
      value: Math.ceil(results.Rg),
      impact: "Rg ↓ 20–40%"
    });
  }

  // Check for unsafe touch voltage
  if (!results.touchSafe70) {
    const D = results.D || 1;
    actions.push({
      priority: "CRITICAL",
      title: "Unsafe touch voltage",
      action: "Reduce conductor spacing",
      value: (D * 0.7).toFixed(2) + " m",
      impact: "Em ↓ ~30%"
    });
  }

  // Check for unsafe step voltage
  if (!results.stepSafe70) {
    actions.push({
      priority: "HIGH",
      title: "Unsafe step voltage",
      action: "Add perimeter conductor",
      impact: "Es ↓ ~25%"
    });
  }

  // Check thermal limits
  if (results.thermalCheck && !results.thermalCheck.complies) {
    actions.push({
      priority: "CRITICAL",
      title: "Thermal limit exceeded",
      action: "Upgrade conductor",
      value: results.selectedConductor,
      impact: "Avoid conductor failure"
    });
  }

  // If no issues found
  if (actions.length === 0) {
    actions.push({
      priority: "OK",
      title: "Design compliant",
      action: "No changes required",
      impact: "Meets IEEE 80"
    });
  }

  return actions;
};
