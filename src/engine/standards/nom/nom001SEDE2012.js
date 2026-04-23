// src/engine/standards/nom/nom001SEDE2012.js
// NOM-001-SEDE-2012 - Electrical Installations (Utilization)

/**
 * Limits per NOM-001-SEDE-2012
 * Based on Table 250-95, 250-96 and Section 250
 */

const DEFAULT_SYSTEM_TYPE = 'industrial';
const DEFAULT_FAULT_DURATION = 0.5;
const DEFAULT_SURFACE_RESISTIVITY = 3000;
const DEFAULT_CONDUCTOR_SIZE = '2/0';
const DEFAULT_CONDUCTOR_AMPACITY = 195;
const FAULT_CURRENT_MULTIPLIER = 5;
const MAX_LOW_VOLTAGE_LIMIT = 500;
const CERTIFICATE_VALIDITY_DAYS = 365;

const VOLTAGE_THRESHOLDS = {
  LOW_VOLTAGE: 1000,
  MEDIUM_VOLTAGE: 15000,
  HIGH_VOLTAGE: 50000
};

const RESISTANCE_LIMITS = {
  LOW_VOLTAGE: 25,
  MEDIUM_VOLTAGE: 10,
  HIGH_VOLTAGE: 5,
  VERY_HIGH_VOLTAGE: 2
};

const CONDUCTOR_AMPACITIES = {
  '2': 130, '4': 85, '6': 65, '8': 50, '10': 35, '12': 25,
  '1/0': 170, '2/0': 195, '3/0': 225, '4/0': 260
};

const RESISTIVITY_THRESHOLDS = {
  LOW: 100,
  HIGH: 500
};

const DURATION_THRESHOLDS = {
  VERY_FAST: 0.1,
  FAST: 0.5,
  NORMAL: 1.0
};

const BASE_VOLTAGE_LIMITS = {
  VERY_FAST: 100,
  FAST: 75,
  NORMAL: 50,
  SLOW: 30
};

const SYSTEM_FACTORS = {
  hospital: 0.7,
  industrial: 1.0,
  default: 1.2
};

export const NOM001_SEDE_2012 = {
  /**
   * Calculates tolerable touch voltage (V)
   * @param {Object} context - { faultDuration, soilResistivity, systemType }
   * @returns {number} Tolerable touch voltage
   */
  touchVoltage: (context) => {
    const { faultDuration, soilResistivity, systemType = DEFAULT_SYSTEM_TYPE } = context;
    
    const duration = faultDuration ?? DEFAULT_FAULT_DURATION;
    const resistivityFactor = NOM001_SEDE_2012.calculateResistivityFactor(soilResistivity);
    const baseLimit = NOM001_SEDE_2012.getBaseVoltageLimit(duration);
    const systemFactor = SYSTEM_FACTORS[systemType] ?? SYSTEM_FACTORS.default;
    
    return baseLimit * resistivityFactor * systemFactor;
  },

  /**
   * Calculates resistivity correction factor
   */
  calculateResistivityFactor(soilResistivity) {
    if (soilResistivity < RESISTIVITY_THRESHOLDS.LOW) return 1.2;
    if (soilResistivity > RESISTIVITY_THRESHOLDS.HIGH) return 0.8;
    return 1.0;
  },

  /**
   * Gets base voltage limit by duration
   */
  getBaseVoltageLimit(duration) {
    if (duration < DURATION_THRESHOLDS.VERY_FAST) return BASE_VOLTAGE_LIMITS.VERY_FAST;
    if (duration < DURATION_THRESHOLDS.FAST) return BASE_VOLTAGE_LIMITS.FAST;
    if (duration < DURATION_THRESHOLDS.NORMAL) return BASE_VOLTAGE_LIMITS.NORMAL;
    return BASE_VOLTAGE_LIMITS.SLOW;
  },

  /**
   * Calculates tolerable step voltage (V)
   * @param {Object} context - { faultDuration, soilResistivity, surfaceLayer }
   * @returns {number} Tolerable step voltage
   */
  stepVoltage: (context) => {
    const { faultDuration, soilResistivity, surfaceResistivity = DEFAULT_SURFACE_RESISTIVITY } = context;
    
    const duration = faultDuration ?? DEFAULT_FAULT_DURATION;
    const surfaceLayerFactor = NOM001_SEDE_2012.calculateSurfaceLayerFactor(soilResistivity, surfaceResistivity);
    const baseLimit = NOM001_SEDE_2012.calculateStepVoltageBase(surfaceLayerFactor, surfaceResistivity, duration);
    
    return Math.min(baseLimit, MAX_LOW_VOLTAGE_LIMIT);
  },

  /**
   * Calculates surface layer factor
   */
  calculateSurfaceLayerFactor(soilResistivity, surfaceResistivity) {
    return 1 - (0.09 * (1 - soilResistivity / surfaceResistivity)) /
               (2 * 0.1 + 0.09);
  },

  /**
   * Calculates step voltage base limit
   */
  calculateStepVoltageBase(surfaceLayerFactor, surfaceResistivity, duration) {
    return (1000 + 6 * surfaceLayerFactor * surfaceResistivity) * (0.116 / Math.sqrt(duration));
  },

  /**
   * Gets maximum ground resistance (Ω)
   * @param {Object} context - { voltageLevel, systemType, faultCurrent }
   * @returns {number} Maximum resistance
   */
  maxGroundResistance: (context) => {
    const { voltageLevel } = context;
    
    if (voltageLevel < VOLTAGE_THRESHOLDS.LOW_VOLTAGE) return RESISTANCE_LIMITS.LOW_VOLTAGE;
    if (voltageLevel < VOLTAGE_THRESHOLDS.MEDIUM_VOLTAGE) return RESISTANCE_LIMITS.MEDIUM_VOLTAGE;
    if (voltageLevel < VOLTAGE_THRESHOLDS.HIGH_VOLTAGE) return RESISTANCE_LIMITS.HIGH_VOLTAGE;
    return RESISTANCE_LIMITS.VERY_HIGH_VOLTAGE;
  },

  /**
   * Calculates maximum allowable fault current (A)
   * @param {Object} context - { conductorSize, faultDuration, systemType }
   * @returns {number} Maximum fault current
   */
  maxFaultCurrent: (context) => {
    const { conductorSize = DEFAULT_CONDUCTOR_SIZE, faultDuration = DEFAULT_FAULT_DURATION } = context;
    
    const ampacity = CONDUCTOR_AMPACITIES[conductorSize] ?? DEFAULT_CONDUCTOR_AMPACITY;
    const timeFactor = Math.sqrt(1 / faultDuration);
    
    return ampacity * timeFactor * FAULT_CURRENT_MULTIPLIER;
  },

  /**
   * Verifies grounding system
   * @param {Object} results - FEM results
   * @param {Object} context - Project context
   * @returns {Object} Verification result
   */
  verifyGroundingSystem: (results, context) => {
    const violations = NOM001_SEDE_2012.checkGroundResistance(results, context);
    
    return {
      compliant: violations.length === 0,
      violations,
      recommendations: violations.map(v => v.description)
    };
  },

  /**
   * Checks ground resistance compliance
   */
  checkGroundResistance(results, context) {
    const maxResistance = NOM001_SEDE_2012.maxGroundResistance(context);
    if (results.groundResistance > maxResistance) {
      return [{
        code: '250-56',
        title: 'Excessive ground resistance',
        description: `Rg = ${results.groundResistance.toFixed(2)} Ω > ${maxResistance} Ω allowed`,
        severity: 'HIGH'
      }];
    }
    return [];
  },

  /**
   * Verifies indirect contact protection
   * @param {Object} results - FEM results
   * @param {Object} context - Project context
   * @returns {Object} Verification result
   */
  verifyIndirectContact: (results, context) => {
    const touchLimit = NOM001_SEDE_2012.touchVoltage(context);
    const stepLimit = NOM001_SEDE_2012.stepVoltage(context);
    
    const violations = [];
    
    if (results.touchVoltage?.value > touchLimit) {
      violations.push({
        code: '250-95',
        title: 'Touch voltage exceeds NOM limit',
        value: results.touchVoltage.value,
        limit: touchLimit,
        severity: 'CRITICAL'
      });
    }
    
    if (results.stepVoltage?.value > stepLimit) {
      violations.push({
        code: '250-95',
        title: 'Step voltage exceeds NOM limit',
        value: results.stepVoltage.value,
        limit: stepLimit,
        severity: 'HIGH'
      });
    }
    
    return {
      compliant: violations.length === 0,
      violations,
      touchSafe: results.touchVoltage?.value <= touchLimit,
      stepSafe: results.stepVoltage?.value <= stepLimit
    };
  },

  /**
   * Generates compliance certificate
   * @param {Object} results - FEM results
   * @param {Object} context - Project context
   * @returns {Object} Compliance certificate
   */
  generateComplianceCertificate: (results, context) => {
    const groundingCheck = NOM001_SEDE_2012.verifyGroundingSystem(results, context);
    const indirectCheck = NOM001_SEDE_2012.verifyIndirectContact(results, context);
    
    return {
      standard: 'NOM-001-SEDE-2012',
      title: 'Electrical Installations (Utilization)',
      compliant: groundingCheck.compliant && indirectCheck.compliant,
      sections: {
        grounding: groundingCheck,
        indirectContact: indirectCheck
      },
      certificateNumber: `NOM-${Date.now()}`,
      issuedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + CERTIFICATE_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString()
    };
  }
};

export default NOM001_SEDE_2012;
