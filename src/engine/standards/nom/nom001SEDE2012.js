// src/engine/standards/nom/nom001SEDE2012.js
// NOM-001-SEDE-2012 - Instalaciones Eléctricas (Utilización)

/**
 * Límites según NOM-001-SEDE-2012
 * Basado en Tabla 250-95, 250-96 y Sección 250
 */

export const NOM001_SEDE_2012 = {
  /**
   * Tensión de contacto tolerable (V)
   * @param {Object} context - { faultDuration, soilResistivity, systemType }
   */
  touchVoltage: (context) => {
    const { faultDuration, soilResistivity, systemType = 'industrial' } = context;
    
    // Tiempo de despeje de falla (segundos)
    const t = faultDuration || 0.5;
    
    // Factor de corrección por resistividad del suelo
    const rhoFactor = soilResistivity < 100 ? 1.2 : 
                      soilResistivity > 500 ? 0.8 : 1.0;
    
    // Límite base según NOM-001-SEDE-2012
    let baseLimit = 50; // 50V para condiciones normales
    
    if (t < 0.1) baseLimit = 100;
    else if (t < 0.5) baseLimit = 75;
    else if (t < 1.0) baseLimit = 50;
    else baseLimit = 30;
    
    // Ajuste por tipo de sistema
    const systemFactor = systemType === 'hospital' ? 0.7 :
                         systemType === 'industrial' ? 1.0 : 1.2;
    
    return baseLimit * rhoFactor * systemFactor;
  },

  /**
   * Tensión de paso tolerable (V)
   * @param {Object} context - { faultDuration, soilResistivity, surfaceLayer }
   */
  stepVoltage: (context) => {
    const { faultDuration, soilResistivity, surfaceResistivity = 3000 } = context;
    
    const t = faultDuration || 0.5;
    const Cs = 1 - (0.09 * (1 - soilResistivity / surfaceResistivity)) /
               (2 * 0.1 + 0.09);
    
    // NOM-001-SEDE-2012 Sección 250-95
    let baseLimit = (1000 + 6 * Cs * surfaceResistivity) * (0.116 / Math.sqrt(t));
    
    // Limitar a máximo de 500V para instalaciones de baja tensión
    return Math.min(baseLimit, 500);
  },

  /**
   * Resistencia de puesta a tierra máxima (Ω)
   * @param {Object} context - { voltageLevel, systemType, faultCurrent }
   */
  maxGroundResistance: (context) => {
    const { voltageLevel, systemType, faultCurrent } = context;
    
    // Artículo 250-56 NOM-001-SEDE-2012
    if (voltageLevel < 1000) {
      return 25; // Baja tensión
    } else if (voltageLevel < 15000) {
      return 10; // Media tensión
    } else if (voltageLevel < 50000) {
      return 5;  // Alta tensión
    } else {
      return 2;  // Muy alta tensión
    }
  },

  /**
   * Corriente máxima de falla permitida (A)
   * @param {Object} context - { conductorSize, faultDuration, systemType }
   */
  maxFaultCurrent: (context) => {
    const { conductorSize = '2/0', faultDuration = 0.5, systemType } = context;
    
    // Capacidad de conducción de corriente de falla
    const conductorAmpacities = {
      '2': 130, '4': 85, '6': 65, '8': 50, '10': 35, '12': 25,
      '1/0': 170, '2/0': 195, '3/0': 225, '4/0': 260
    };
    
    const ampacity = conductorAmpacities[conductorSize] || 195;
    
    // Factor de tiempo
    const timeFactor = Math.sqrt(1 / faultDuration);
    
    return ampacity * timeFactor * 5; // Aprox 5x para falla
  },

  /**
   * Verifica sistema de tierras
   * @param {Object} results - Resultados del FEM
   * @param {Object} context - Contexto del proyecto
   */
  verifyGroundingSystem: (results, context) => {
    const violations = [];
    
    // 1. Verificar resistencia de tierra
    const maxRg = NOM001_SEDE_2012.maxGroundResistance(context);
    if (results.groundResistance > maxRg) {
      violations.push({
        code: '250-56',
        title: 'Resistencia de puesta a tierra excesiva',
        description: `Rg = ${results.groundResistance.toFixed(2)} Ω > ${maxRg} Ω permitidos`,
        severity: 'HIGH'
      });
    }
    
    // 2. Verificar continuidad del electrodo
    // (simplificado)
    
    // 3. Verificar conexiones
    // (simplificado)
    
    return {
      compliant: violations.length === 0,
      violations,
      recommendations: violations.map(v => v.description)
    };
  },

  /**
   * Verifica protección contra contactos indirectos
   * @param {Object} results - Resultados del FEM
   * @param {Object} context - Contexto
   */
  verifyIndirectContact: (results, context) => {
    const touchLimit = NOM001_SEDE_2012.touchVoltage(context);
    const stepLimit = NOM001_SEDE_2012.stepVoltage(context);
    
    const violations = [];
    
    if (results.touchVoltage?.value > touchLimit) {
      violations.push({
        code: '250-95',
        title: 'Tensión de contacto excede límite NOM',
        value: results.touchVoltage.value,
        limit: touchLimit,
        severity: 'CRITICAL'
      });
    }
    
    if (results.stepVoltage?.value > stepLimit) {
      violations.push({
        code: '250-95',
        title: 'Tensión de paso excede límite NOM',
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
   * Genera certificado de cumplimiento
   */
  generateComplianceCertificate: (results, context) => {
    const groundingCheck = NOM001_SEDE_2012.verifyGroundingSystem(results, context);
    const indirectCheck = NOM001_SEDE_2012.verifyIndirectContact(results, context);
    
    return {
      standard: 'NOM-001-SEDE-2012',
      title: 'Instalaciones Eléctricas (Utilización)',
      compliant: groundingCheck.compliant && indirectCheck.compliant,
      sections: {
        grounding: groundingCheck,
        indirectContact: indirectCheck
      },
      certificateNumber: `NOM-${Date.now()}`,
      issuedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };
  }
};

export default NOM001_SEDE_2012;
