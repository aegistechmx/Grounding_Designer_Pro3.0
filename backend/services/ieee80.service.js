/**
 * IEEE 80 Engine Service
 * Core grounding system calculations per IEEE Std 80-2013
 */

class IEEE80Service {
  /**
   * Calculate grid resistance (Schwarz equation)
   */
  calculateGridResistance(params) {
    const {
      gridLength,
      gridWidth,
      numParallel,
      numParallelY,
      burialDepth,
      conductorDiameter,
      rodLength,
      numRods,
      soilResistivity
    } = params;

    // Grid area
    const A = gridLength * gridWidth;
    
    // Total conductor length
    const Lc = (numParallel * gridLength) + (numParallelY * gridWidth);
    
    // Total rod length
    const Lr = numRods * rodLength;
    
    // Total length
    const L = Lc + Lr;
    
    // Grid resistance (simplified Schwarz equation)
    const Rg = (soilResistivity / (Math.PI * L)) * (1 + Math.log(2 * L / Math.sqrt(A)));
    
    return Rg;
  }

  /**
   * Calculate GPR (Ground Potential Rise)
   */
  calculateGPR(params, Ig) {
    const Rg = this.calculateGridResistance(params);
    const GPR = Ig * Rg;
    return GPR;
  }

  /**
   * Calculate touch voltage (Em)
   */
  calculateTouchVoltage(params, GPR, faultDuration) {
    const {
      gridLength,
      gridWidth,
      numParallel,
      numParallelY,
      burialDepth
    } = params;

    // Grid geometry factor
    const Km = 0.6; // Simplified mesh factor
    
    // Touch voltage
    const Em = Km * GPR * (1 - burialDepth / Math.sqrt(gridLength * gridWidth));
    
    return Em;
  }

  /**
   * Calculate step voltage (Es)
   */
  calculateStepVoltage(params, GPR, faultDuration) {
    const {
      gridLength,
      gridWidth
    } = params;

    // Step geometry factor
    const Ks = 0.8; // Simplified step factor
    
    // Step voltage
    const Es = Ks * GPR;
    
    return Es;
  }

  /**
   * Calculate permissible touch voltage (70kg person)
   */
  calculatePermissibleTouch(faultDuration, surfaceLayerResistivity = 0, surfaceLayerThickness = 0) {
    // Clamp Cs to valid range [0, 1] to prevent invalid values
    const Cs = Math.max(0, Math.min(1, 1 - 0.08 * (surfaceLayerResistivity / 100) * (surfaceLayerThickness / 0.1)));
    const Etouch70 = (1000 + 1.5 * Cs * surfaceLayerResistivity) / Math.sqrt(faultDuration);
    return Etouch70;
  }

  /**
   * Calculate permissible step voltage (70kg person)
   */
  calculatePermissibleStep(faultDuration, surfaceLayerResistivity = 0) {
    const Estep70 = (1000 + 6 * surfaceLayerResistivity) / Math.sqrt(faultDuration);
    return Estep70;
  }

  /**
   * Run complete IEEE 80 calculation
   */
  calculate(params) {
    const {
      faultCurrent,
      faultDuration,
      surfaceLayerResistivity = 0,
      surfaceLayerThickness = 0
    } = params;

    // Calculate grid resistance
    const Rg = this.calculateGridResistance(params);
    
    // Calculate GPR
    const GPR = this.calculateGPR(params, faultCurrent);
    
    // Calculate touch voltage
    const Em = this.calculateTouchVoltage(params, GPR, faultDuration);
    
    // Calculate step voltage
    const Es = this.calculateStepVoltage(params, GPR, faultDuration);
    
    // Calculate permissible voltages
    const Etouch70 = this.calculatePermissibleTouch(faultDuration, surfaceLayerResistivity, surfaceLayerThickness);
    const Estep70 = this.calculatePermissibleStep(faultDuration, surfaceLayerResistivity);
    
    // Check compliance
    const touchSafe70 = Em <= Etouch70;
    const stepSafe70 = Es <= Estep70;
    const complies = touchSafe70 && stepSafe70;

    return {
      Rg,
      GPR,
      Em,
      Es,
      Etouch70,
      Estep70,
      touchSafe70,
      stepSafe70,
      complies,
      method: 'IEEE80',
      standard: 'IEEE Std 80-2013'
    };
  }
}

module.exports = new IEEE80Service();
