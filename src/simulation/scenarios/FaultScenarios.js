// src/simulation/scenarios/FaultScenarios.js
// DEFINICIÓN DE ESCENARIOS DE FALLA

export const FaultScenarios = {
  /**
   * Escenario estándar para subestación industrial
   */
  industrialStandard: {
    id: 'industrial_std',
    name: 'Industrial Estándar',
    current: 5000,
    duration: 0.5,
    divisionFactor: 0.15,
    description: 'Falla típica en subestación industrial'
  },

  /**
   * Escenario conservador (máxima seguridad)
   */
  conservative: {
    id: 'conservative',
    name: 'Conservador',
    current: 10000,
    duration: 0.35,
    divisionFactor: 0.2,
    description: 'Escenario de alta seguridad'
  },

  /**
   * Escenario económico (falla rápida)
   */
  economic: {
    id: 'economic',
    name: 'Económico',
    current: 3000,
    duration: 0.7,
    divisionFactor: 0.1,
    description: 'Protecciones rápidas'
  },

  /**
   * Escenario para data center
   */
  dataCenter: {
    id: 'datacenter',
    name: 'Data Center',
    current: 8000,
    duration: 0.25,
    divisionFactor: 0.12,
    description: 'Alta disponibilidad'
  },

  /**
   * Escenario para hospital
   */
  hospital: {
    id: 'hospital',
    name: 'Hospital',
    current: 6000,
    duration: 0.2,
    divisionFactor: 0.18,
    description: 'Protecciones ultrasensibles'
  }
};

/**
 * Crea escenario personalizado
 */
export function createCustomScenario(params) {
  return {
    id: `custom_${Date.now()}`,
    name: params.name || 'Personalizado',
    current: params.current || 5000,
    duration: params.duration || 0.5,
    divisionFactor: params.divisionFactor || 0.15,
    description: params.description || 'Configuración personalizada'
  };
}

export default FaultScenarios;
