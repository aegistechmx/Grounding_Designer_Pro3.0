// src/engine/standards/cfe/cfeCriteria.js
// Comisión Federal de Electricidad (CFE) Grounding Criteria

/**
 * CFE 01J00-01 - Grounding Criteria
 * CFE G0100-04 - Substation Specifications
 */

const DEFAULT_SUBSTATION_TYPE = 'distribution';
const DEFAULT_ENGINEER_NAME = 'Specialist Engineer';
const FAST_PROTECTION_TIME = 0.2;
const SLOW_PROTECTION_TIME = 0.5;
const HIGH_GPR_THRESHOLD = 5000;
const BASE_TOUCH_VOLTAGE = 50;
const BASE_STEP_VOLTAGE = 150;
const DEFAULT_VOLTAGE_LIMIT = 10;

const INSTALLATION_FACTORS = {
  substation: 1.0,
  industrial: 1.1,
  commercial: 1.2,
  residential: 1.3,
  hospital: 0.9,
  data_center: 0.8
};

const VOLTAGE_LIMITS = {
  distribution: {
    '13.8': 10,
    '23': 8,
    '34.5': 5
  },
  transmission: {
    '69': 3,
    '115': 2,
    '230': 1,
    '400': 0.5
  }
};

export const CFE_CRITERIA = {
  /**
   * Calculates safety factors by installation type
   * @param {Object} system - System parameters
   * @returns {Object} Safety factors
   */
  safetyFactors: (system) => {
    const { installationType, soilMoisture, protectionTime } = system;
    
    const timeFactor = CFE_CRITERIA.calculateTimeFactor(protectionTime);
    const soilFactor = CFE_CRITERIA.calculateSoilFactor(soilMoisture);
    const installationFactor = INSTALLATION_FACTORS[installationType] ?? 1.0;
    
    return {
      total: timeFactor * soilFactor * installationFactor,
      timeFactor,
      soilFactor,
      installationFactor,
      description: CFE_CRITERIA.getSafetyDescription(installationType, soilMoisture)
    };
  },

  /**
   * Calculates time factor based on protection time
   */
  calculateTimeFactor(protectionTime) {
    if (protectionTime < FAST_PROTECTION_TIME) return 0.8;
    if (protectionTime > SLOW_PROTECTION_TIME) return 1.2;
    return 1.0;
  },

  /**
   * Calculates soil factor based on moisture
   */
  calculateSoilFactor(soilMoisture) {
    if (soilMoisture > 0.3) return 0.8; // Wet soil (better)
    if (soilMoisture < 0.1) return 1.3; // Dry soil (worse)
    return 1.0;
  },

  /**
   * Gets safety description
   * @param {string} installationType - Type of installation
   * @param {number} soilMoisture - Soil moisture level
   * @returns {string} Safety description
   */
  getSafetyDescription: (installationType, soilMoisture) => {
    if (installationType === 'hospital') return 'Medical criteria - Maximum safety';
    if (installationType === 'data_center') return 'Sensitive equipment - Critical safety';
    if (soilMoisture < 0.1) return 'Dry soil - Additional measures required';
    return 'Standard CFE criteria';
  },

  /**
   * Gets maximum ground resistance by voltage level per CFE
   * @param {number} voltageLevel - Voltage level in kV
   * @param {string} substationType - Substation type
   * @returns {number} Maximum resistance in ohms
   */
  maxGroundResistance: (voltageLevel, substationType = DEFAULT_SUBSTATION_TYPE) => {
    const category = voltageLevel < 50 ? 'distribution' : 'transmission';
    return VOLTAGE_LIMITS[category][voltageLevel.toString()] ?? DEFAULT_VOLTAGE_LIMIT;
  },

  /**
   * Verifies CFE criteria for substations
   * @param {Object} results - Simulation results
   * @param {Object} context - Project context
   * @returns {Object} Verification result
   */
  verifySubstationCriteria: (results, context) => {
    const { voltageLevel, substationType, protectionTime } = context;
    const violations = [];
    
    violations.push(...CFE_CRITERIA.checkGroundResistance(results, voltageLevel, substationType));
    violations.push(...CFE_CRITERIA.checkGPR(results));
    violations.push(...CFE_CRITERIA.checkProtectionTime(protectionTime));
    
    return {
      compliant: violations.length === 0,
      violations,
      criticalViolations: violations.filter(v => v.severity === 'HIGH')
    };
  },

  /**
   * Checks ground resistance compliance
   */
  checkGroundResistance(results, voltageLevel, substationType) {
    const maxResistance = CFE_CRITERIA.maxGroundResistance(voltageLevel, substationType);
    if (results.groundResistance > maxResistance) {
      return [{
        code: 'CFE-G0100-04',
        title: 'Grid resistance outside CFE specification',
        description: `Rg = ${results.groundResistance.toFixed(2)} Ω > ${maxResistance} Ω`,
        severity: 'HIGH'
      }];
    }
    return [];
  },

  /**
   * Checks GPR compliance
   */
  checkGPR(results) {
    if (results.GPR > HIGH_GPR_THRESHOLD) {
      return [{
        code: 'CFE-01J00-01',
        title: 'Elevated GPR',
        description: `GPR = ${results.GPR.toFixed(0)} V > ${HIGH_GPR_THRESHOLD} V`,
        severity: 'MEDIUM'
      }];
    }
    return [];
  },

  /**
   * Checks protection time compliance
   */
  checkProtectionTime(protectionTime) {
    if (protectionTime > SLOW_PROTECTION_TIME) {
      return [{
        code: 'CFE-01J00-01',
        title: 'Excessive clearing time',
        description: `t = ${protectionTime} s > ${SLOW_PROTECTION_TIME} s recommended`,
        severity: 'MEDIUM'
      }];
    }
    return [];
  },

  /**
   * Verifies operational safety criteria
   * @param {Object} results - Simulation results
   * @param {Object} context - Project context
   * @returns {Object} Verification result
   */
  verifyOperationalSafety: (results, context) => {
    const safetyFactors = CFE_CRITERIA.safetyFactors(context);
    const maxTouchVoltage = BASE_TOUCH_VOLTAGE * safetyFactors.total;
    const maxStepVoltage = BASE_STEP_VOLTAGE * safetyFactors.total;
    
    const violations = [];
    
    if (results.touchVoltage?.value > maxTouchVoltage) {
      violations.push({
        code: 'CFE-01J00-01',
        title: 'Touch voltage exceeds operational limit',
        value: results.touchVoltage.value,
        limit: maxTouchVoltage,
        severity: 'CRITICAL'
      });
    }
    
    if (results.stepVoltage?.value > maxStepVoltage) {
      violations.push({
        code: 'CFE-01J00-01',
        title: 'Step voltage exceeds operational limit',
        value: results.stepVoltage.value,
        limit: maxStepVoltage,
        severity: 'HIGH'
      });
    }
    
    return {
      compliant: violations.length === 0,
      violations,
      safetyFactors,
      operationalLimit: { maxTouch: maxTouchVoltage, maxStep: maxStepVoltage }
    };
  },

  /**
   * Generates complete CFE report
   * @param {Object} results - Simulation results
   * @param {Object} context - Project context
   * @returns {Object} CFE report
   */
  generateCFEReport: (results, context) => {
    const substationCheck = CFE_CRITERIA.verifySubstationCriteria(results, context);
    const safetyCheck = CFE_CRITERIA.verifyOperationalSafety(results, context);
    
    return {
      standard: 'CFE 01J00-01 / G0100-04',
      title: 'CFE Grounding Criteria',
      compliant: substationCheck.compliant && safetyCheck.compliant,
      substation: substationCheck,
      operationalSafety: safetyCheck,
      certificateNumber: `CFE-${Date.now()}`,
      engineerResponsible: context.engineerName ?? DEFAULT_ENGINEER_NAME,
      reviewDate: new Date().toISOString()
    };
  }
};

export default CFE_CRITERIA;
