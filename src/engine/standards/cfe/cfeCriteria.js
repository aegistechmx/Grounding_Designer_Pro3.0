// src/engine/standards/cfe/cfeCriteria.js
// Criterios de la Comisión Federal de Electricidad (CFE)

/**
 * CFE 01J00-01 - Criterios de Puesta a Tierra
 * CFE G0100-04 - Especificaciones de Subestaciones
 */

export const CFE_CRITERIA = {
  /**
   * Factor de seguridad por tipo de instalación
   */
  safetyFactors: (system) => {
    const { installationType, soilMoisture, protectionTime } = system;
    
    // Factores base
    let timeFactor = 1.0;
    let soilFactor = 1.0;
    let installationFactor = 1.0;
    
    // Factor por tiempo de despeje
    if (protectionTime < 0.2) timeFactor = 0.8;
    else if (protectionTime > 0.5) timeFactor = 1.2;
    
    // Factor por humedad del suelo
    if (soilMoisture > 0.3) soilFactor = 0.8;  // Suelo húmedo (mejor)
    else if (soilMoisture < 0.1) soilFactor = 1.3; // Suelo seco (peor)
    
    // Factor por tipo de instalación
    const installationFactors = {
      'substation': 1.0,
      'industrial': 1.1,
      'commercial': 1.2,
      'residential': 1.3,
      'hospital': 0.9,
      'data_center': 0.8
    };
    installationFactor = installationFactors[installationType] || 1.0;
    
    return {
      total: timeFactor * soilFactor * installationFactor,
      timeFactor,
      soilFactor,
      installationFactor,
      description: CFE_CRITERIA.getSafetyDescription(installationType, soilMoisture)
    };
  },

  /**
   * Descripción de seguridad
   */
  getSafetyDescription: (installationType, soilMoisture) => {
    if (installationType === 'hospital') return 'Criterios médicos - Máxima seguridad';
    if (installationType === 'data_center') return 'Equipos sensibles - Seguridad crítica';
    if (soilMoisture < 0.1) return 'Suelo seco - Requiere medidas adicionales';
    return 'Criterios estándar CFE';
  },

  /**
   * Máxima resistencia de puesta a tierra por nivel de tensión CFE
   */
  maxGroundResistance: (voltageLevel, substationType = 'distribution') => {
    // CFE G0100-04 Tabla 1
    const limits = {
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
    
    const category = voltageLevel < 50 ? 'distribution' : 'transmission';
    return limits[category][voltageLevel.toString()] || 10;
  },

  /**
   * Verifica criterios CFE para subestaciones
   */
  verifySubstationCriteria: (results, context) => {
    const { voltageLevel, substationType, protectionTime, faultCurrent } = context;
    const violations = [];
    
    // 1. Verificar resistencia de malla
    const maxRg = CFE_CRITERIA.maxGroundResistance(voltageLevel, substationType);
    if (results.groundResistance > maxRg) {
      violations.push({
        code: 'CFE-G0100-04',
        title: 'Resistencia de malla fuera de especificación CFE',
        description: `Rg = ${results.groundResistance.toFixed(2)} Ω > ${maxRg} Ω`,
        severity: 'HIGH'
      });
    }
    
    // 2. Verificar gradiente de potencial
    if (results.GPR > 5000) {
      violations.push({
        code: 'CFE-01J00-01',
        title: 'GPR elevado',
        description: `GPR = ${results.GPR.toFixed(0)} V > 5000 V`,
        severity: 'MEDIUM'
      });
    }
    
    // 3. Verificar tiempo de despeje
    if (protectionTime > 0.5) {
      violations.push({
        code: 'CFE-01J00-01',
        title: 'Tiempo de despeje excesivo',
        description: `t = ${protectionTime} s > 0.5 s recomendado`,
        severity: 'MEDIUM'
      });
    }
    
    return {
      compliant: violations.length === 0,
      violations,
      criticalViolations: violations.filter(v => v.severity === 'HIGH')
    };
  },

  /**
   * Verifica criterios de seguridad operativa
   */
  verifyOperationalSafety: (results, context) => {
    const { installationType, faultCurrent, protectionTime } = context;
    const safetyFactors = CFE_CRITERIA.safetyFactors(context);
    
    const maxTouch = 50 * safetyFactors.total;
    const maxStep = 150 * safetyFactors.total;
    
    const violations = [];
    
    if (results.touchVoltage?.value > maxTouch) {
      violations.push({
        code: 'CFE-01J00-01',
        title: 'Tensión de contacto excede límite operativo',
        value: results.touchVoltage.value,
        limit: maxTouch,
        severity: 'CRITICAL'
      });
    }
    
    if (results.stepVoltage?.value > maxStep) {
      violations.push({
        code: 'CFE-01J00-01',
        title: 'Tensión de paso excede límite operativo',
        value: results.stepVoltage.value,
        limit: maxStep,
        severity: 'HIGH'
      });
    }
    
    return {
      compliant: violations.length === 0,
      violations,
      safetyFactors,
      operationalLimit: { maxTouch, maxStep }
    };
  },

  /**
   * Genera reporte CFE completo
   */
  generateCFEReport: (results, context) => {
    const substationCheck = CFE_CRITERIA.verifySubstationCriteria(results, context);
    const safetyCheck = CFE_CRITERIA.verifyOperationalSafety(results, context);
    
    return {
      standard: 'CFE 01J00-01 / G0100-04',
      title: 'Criterios de Puesta a Tierra CFE',
      compliant: substationCheck.compliant && safetyCheck.compliant,
      substation: substationCheck,
      operationalSafety: safetyCheck,
      certificateNumber: `CFE-${Date.now()}`,
      engineerResponsible: context.engineerName || 'Ingeniero Especialista',
      reviewDate: new Date().toISOString()
    };
  }
};

export default CFE_CRITERIA;
