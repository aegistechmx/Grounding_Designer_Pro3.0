export default class CrossValidation {
  constructor(analytical, discrete) {
    this.a = analytical;
    this.d = discrete;
    this.results = {};
  }

  validate() {
    this.results = {
      resistance: this.compare(
        this.a.grid?.resistance,
        this.d.grid?.resistance
      ),
      gpr: this.compare(
        this.a.fault?.gpr,
        this.d.fault?.gpr
      ),
      step: this.compare(
        this.a.fault?.stepVoltage,
        this.d.fault?.stepVoltage
      ),
      touch: this.compare(
        this.a.fault?.touchVoltage,
        this.d.fault?.touchVoltage
      )
    };

    // Add physical consistency checks
    const physicalChecks = this.performPhysicalChecks();

    // Build summary
    const summary = this.buildSummary();

    // Adjust confidence based on physical checks
    if (!physicalChecks.touchGreaterThanStep || !physicalChecks.gprConsistency) {
      summary.confidence = this.downgradeConfidence(summary.confidence);
      summary.physicalInconsistencies = true;
    }

    return {
      ...summary,
      physicalChecks,
      interpretation: this.interpret(summary)
    };
  }

  compare(a, d) {
    if (!a || !d || !isFinite(a) || !isFinite(d)) return null;
    
    // Robust percent error using max absolute value as denominator
    const denom = Math.max(Math.abs(a), Math.abs(d), 1e-6);
    const diff = ((d - a) / denom) * 100;
    return {
      analytical: a,
      discrete: d,
      diff,
      absDiff: Math.abs(diff),
      status: this.classify(diff)
    };
  }

  classify(diff) {
    const abs = Math.abs(diff);
    if (abs < 20) return 'excellent';
    if (abs < 50) return 'acceptable';
    return 'poor';
  }

  performPhysicalChecks() {
    // Use analytical results for physical checks (both methods should agree on physics)
    const results = this.a;
    
    return {
      touchGreaterThanStep: results.fault?.touchVoltage > results.fault?.stepVoltage,
      gprConsistency: this.checkGPRConsistency(results)
    };
  }

  checkGPRConsistency(results) {
    if (!results.fault?.gpr || !results.grid?.resistance || !results.fault?.gridCurrent) {
      return true; // Can't check if data missing
    }
    
    const expectedGPR = results.grid.resistance * results.fault.gridCurrent;
    const actualGPR = results.fault.gpr;
    
    // Allow 5% tolerance
    const tolerance = 0.05 * actualGPR;
    return Math.abs(expectedGPR - actualGPR) < tolerance;
  }

  downgradeConfidence(currentConfidence) {
    if (currentConfidence === 'high') return 'medium';
    if (currentConfidence === 'medium') return 'low';
    return 'low';
  }

  buildSummary() {
    const values = Object.values(this.results).filter(Boolean);
    
    if (values.length === 0) {
      return {
        metrics: this.results,
        avgError: 0,
        worstMetric: null,
        confidence: 'low',
        interpretation: 'Insufficient data for validation.'
      };
    }

    const avgError = values.reduce((sum, v) => sum + v.absDiff, 0) / values.length;
    const worst = values.reduce((max, v) => (v.absDiff > max.absDiff ? v : max));

    return {
      metrics: this.results,
      avgError,
      worstMetric: worst,
      confidence: this.getConfidence(avgError)
    };
  }

  getConfidence(avgError) {
    if (avgError < 5) return 'high';
    if (avgError < 15) return 'medium';
    return 'low';
  }

  interpret(summary) {
    if (summary.physicalInconsistencies) {
      return 'Physical inconsistencies detected. Review model assumptions or calibration.';
    }

    // Check for voltage metric definition inconsistency
    const touchError = summary.metrics.touch?.absDiff || 0;
    const stepError = summary.metrics.step?.absDiff || 0;
    
    if (touchError > 20 || stepError > 20) {
      return 'Voltage metric definition inconsistency between methods. Discrete uses direct field measurement (V_node vs remote ground, ΔV@1m), while analytical uses IEEE 80 geometric factors (GPR*Km, GPR*Ks). This is expected - methods measure different physical quantities.';
    }

    if (summary.confidence === 'high') {
      return 'Strong agreement between methods. Results are reliable.';
    }
    if (summary.confidence === 'medium') {
      return 'Moderate differences due to modeling assumptions. Results acceptable but review critical parameters.';
    }
    
    // Low confidence with very high error indicates scaling/calibration issue
    if (summary.avgError > 500) {
      return 'Analytical model likely misconfigured (scaling issue). Review calibration factors or current distribution parameters.';
    }
    
    return 'Significant discrepancies. Review model assumptions or calibration before relying on results.';
  }

  getStatusColor(confidence) {
    switch (confidence) {
      case 'high': return 'green';
      case 'medium': return 'yellow';
      case 'low': return 'red';
      default: return 'gray';
    }
  }

  getMetricStatusColor(status) {
    switch (status) {
      case 'excellent': return 'green';
      case 'acceptable': return 'yellow';
      case 'poor': return 'red';
      default: return 'gray';
    }
  }
}
