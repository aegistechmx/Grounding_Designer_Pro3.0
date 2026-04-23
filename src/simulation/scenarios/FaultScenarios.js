// src/simulation/scenarios/FaultScenarios.js
// Fault scenario definitions

const DEFAULT_CURRENT = 5000;
const DEFAULT_DURATION = 0.5;
const DEFAULT_DIVISION_FACTOR = 0.15;
const DEFAULT_NAME = 'Custom';
const DEFAULT_DESCRIPTION = 'Custom configuration';

export const FaultScenarios = {
  /**
   * Standard industrial substation scenario
   */
  industrialStandard: {
    id: 'industrial_std',
    name: 'Industrial Standard',
    current: 5000,
    duration: 0.5,
    divisionFactor: 0.15,
    description: 'Typical industrial substation fault'
  },

  /**
   * Conservative scenario (maximum safety)
   */
  conservative: {
    id: 'conservative',
    name: 'Conservative',
    current: 10000,
    duration: 0.35,
    divisionFactor: 0.2,
    description: 'High safety scenario'
  },

  /**
   * Economic scenario (fast fault clearing)
   */
  economic: {
    id: 'economic',
    name: 'Economic',
    current: 3000,
    duration: 0.7,
    divisionFactor: 0.1,
    description: 'Fast protection'
  },

  /**
   * Data center scenario
   */
  dataCenter: {
    id: 'datacenter',
    name: 'Data Center',
    current: 8000,
    duration: 0.25,
    divisionFactor: 0.12,
    description: 'High availability'
  },

  /**
   * Hospital scenario
   */
  hospital: {
    id: 'hospital',
    name: 'Hospital',
    current: 6000,
    duration: 0.2,
    divisionFactor: 0.18,
    description: 'Ultra-sensitive protection'
  }
};

/**
 * Creates custom fault scenario
 * @param {Object} params - Scenario parameters
 * @returns {Object} Custom scenario
 */
export function createCustomScenario(params) {
  return {
    id: `custom_${Date.now()}`,
    name: params.name ?? DEFAULT_NAME,
    current: params.current ?? DEFAULT_CURRENT,
    duration: params.duration ?? DEFAULT_DURATION,
    divisionFactor: params.divisionFactor ?? DEFAULT_DIVISION_FACTOR,
    description: params.description ?? DEFAULT_DESCRIPTION
  };
}

export default FaultScenarios;
