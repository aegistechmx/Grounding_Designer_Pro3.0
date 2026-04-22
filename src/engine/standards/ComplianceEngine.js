// src/engine/standards/ComplianceEngine.js
// Motor de validación normativa completo

import NOM001_SEDE_2012 from './nom/nom001SEDE2012.js';
import CFE_CRITERIA from './cfe/cfeCriteria.js';

export class ComplianceEngine {
  constructor(options = {}) {
    this.standards = options.standards || ['NOM-001', 'CFE'];
    this.verbose = options.verbose || false;
  }

  /**
   * Valida resultados FEM contra todas las normas
   */
  validate(femResults, projectContext) {
    if (!femResults || !projectContext) {
      return {
        timestamp: new Date().toISOString(),
        standards: {},
        globalCompliant: false,
        summary: {
          status: 'ERROR',
          message: 'Parámetros inválidos para validación',
          totalViolations: 0,
          criticalViolations: 0,
          recommendations: []
        }
      };
    }
    
    const validation = {
      timestamp: new Date().toISOString(),
      standards: {}
    };
    
    // Validar contra NOM-001-SEDE-2012
    if (this.standards.includes('NOM-001')) {
      validation.standards.NOM001 = this.validateNOM001(femResults, projectContext);
    }
    
    // Validar contra CFE
    if (this.standards.includes('CFE')) {
      validation.standards.CFE = this.validateCFE(femResults, projectContext);
    }
    
    // Resumen global
    validation.globalCompliant = Object.values(validation.standards)
      .every(s => s.compliant);
    
    validation.summary = this.generateSummary(validation);
    
    if (this.verbose) {
      console.log('✅ Validación normativa completada');
      console.log(`   Cumple NOM-001: ${validation.standards.NOM001?.compliant ? '✓' : '✗'}`);
      console.log(`   Cumple CFE: ${validation.standards.CFE?.compliant ? '✓' : '✗'}`);
    }
    
    return validation;
  }

  /**
   * Valida contra NOM-001-SEDE-2012
   */
  validateNOM001(femResults, context) {
    if (!femResults || !context) {
      return {
        standard: 'NOM-001-SEDE-2012',
        title: 'Instalaciones Eléctricas (Utilización)',
        compliant: false,
        violations: [{
          standard: 'NOM-001-SEDE-2012',
          section: 'N/A',
          type: 'INVALID_INPUT',
          message: 'Parámetros inválidos',
          severity: 'CRITICAL'
        }],
        metrics: {},
        certificate: null
      };
    }
    
    const nomContext = {
      faultDuration: context.faultDuration || 0.5,
      soilResistivity: context.soil?.resistivity || 100,
      surfaceResistivity: context.soil?.surfaceResistivity || 3000,
      voltageLevel: context.voltageLevel || 13200,
      systemType: context.systemType || 'industrial'
    };
    
    const touchCheck = {
      value: femResults.touchVoltage?.value || 0,
      limit: NOM001_SEDE_2012.touchVoltage(nomContext),
      safe: (femResults.touchVoltage?.value || 0) <= 
            NOM001_SEDE_2012.touchVoltage(nomContext)
    };
    
    const stepCheck = {
      value: femResults.stepVoltage?.value || 0,
      limit: NOM001_SEDE_2012.stepVoltage(nomContext),
      safe: (femResults.stepVoltage?.value || 0) <= 
            NOM001_SEDE_2012.stepVoltage(nomContext)
    };
    
    const resistanceCheck = {
      value: femResults.groundResistance || 0,
      limit: NOM001_SEDE_2012.maxGroundResistance(nomContext),
      safe: (femResults.groundResistance || 0) <= 
            NOM001_SEDE_2012.maxGroundResistance(nomContext)
    };
    
    const violations = [];
    
    if (!touchCheck.safe) {
      violations.push({
        standard: 'NOM-001-SEDE-2012',
        section: '250-95',
        type: 'TOUCH_VOLTAGE',
        message: `Tensión de contacto: ${isFinite(touchCheck.value) ? touchCheck.value.toFixed(0) : 'N/A'} V > ${isFinite(touchCheck.limit) ? touchCheck.limit.toFixed(0) : 'N/A'} V`,
        severity: 'CRITICAL'
      });
    }
    
    if (!stepCheck.safe) {
      violations.push({
        standard: 'NOM-001-SEDE-2012',
        section: '250-95',
        type: 'STEP_VOLTAGE',
        message: `Tensión de paso: ${isFinite(stepCheck.value) ? stepCheck.value.toFixed(0) : 'N/A'} V > ${isFinite(stepCheck.limit) ? stepCheck.limit.toFixed(0) : 'N/A'} V`,
        severity: 'HIGH'
      });
    }
    
    if (!resistanceCheck.safe) {
      violations.push({
        standard: 'NOM-001-SEDE-2012',
        section: '250-56',
        type: 'GROUND_RESISTANCE',
        message: `Resistencia: ${isFinite(resistanceCheck.value) ? resistanceCheck.value.toFixed(2) : 'N/A'} Ω > ${isFinite(resistanceCheck.limit) ? resistanceCheck.limit : 'N/A'} Ω`,
        severity: 'MEDIUM'
      });
    }
    
    return {
      standard: 'NOM-001-SEDE-2012',
      title: 'Instalaciones Eléctricas (Utilización)',
      compliant: violations.length === 0,
      violations,
      metrics: {
        touchVoltage: touchCheck,
        stepVoltage: stepCheck,
        groundResistance: resistanceCheck
      },
      certificate: violations.length === 0 ? 
        NOM001_SEDE_2012.generateComplianceCertificate(femResults, nomContext) : null
    };
  }

  /**
   * Valida contra CFE
   */
  validateCFE(femResults, context) {
    if (!femResults || !context) {
      return {
        standard: 'CFE 01J00-01 / G0100-04',
        title: 'Criterios de Puesta a Tierra CFE',
        compliant: false,
        violations: [{
          standard: 'CFE 01J00-01 / G0100-04',
          section: 'N/A',
          type: 'INVALID_INPUT',
          message: 'Parámetros inválidos',
          severity: 'CRITICAL'
        }],
        substation: null,
        operationalSafety: null,
        certificate: null
      };
    }
    
    const cfeContext = {
      voltageLevel: context.voltageLevel || 13200,
      substationType: context.substationType || 'distribution',
      installationType: context.installationType || 'industrial',
      soilMoisture: context.soil?.moisture || 0.2,
      protectionTime: context.faultDuration || 0.5,
      faultCurrent: context.faultCurrent || 5000,
      engineerName: context.engineerName
    };
    
    const substationCheck = CFE_CRITERIA.verifySubstationCriteria(femResults, cfeContext);
    const safetyCheck = CFE_CRITERIA.verifyOperationalSafety(femResults, cfeContext);
    
    const violations = [...substationCheck.violations, ...safetyCheck.violations];
    
    return {
      standard: 'CFE 01J00-01 / G0100-04',
      title: 'Criterios de Puesta a Tierra CFE',
      compliant: violations.length === 0,
      violations,
      substation: substationCheck,
      operationalSafety: safetyCheck,
      certificate: violations.length === 0 ?
        CFE_CRITERIA.generateCFEReport(femResults, cfeContext) : null
    };
  }

  /**
   * Genera resumen ejecutivo
   */
  generateSummary(validation) {
    const standards = Object.values(validation.standards);
    const totalViolations = standards.reduce((sum, s) => sum + (s.violations?.length || 0), 0);
    const criticalViolations = standards.reduce((sum, s) => 
      sum + (s.violations?.filter(v => v.severity === 'CRITICAL').length || 0), 0);
    
    let status = 'APPROVED';
    let message = 'Diseño cumple con todas las normas aplicables';
    
    if (criticalViolations > 0) {
      status = 'REJECTED';
      message = `Diseño NO cumple - ${criticalViolations} violación(es) crítica(s)`;
    } else if (totalViolations > 0) {
      status = 'REQUIRES_IMPROVEMENT';
      message = `Diseño requiere mejoras - ${totalViolations} observación(es)`;
    }
    
    return {
      status,
      message,
      totalViolations,
      criticalViolations,
      recommendations: this.generateRecommendations(validation)
    };
  }

  /**
   * Genera recomendaciones específicas
   */
  generateRecommendations(validation) {
    const recommendations = [];
    
    for (const standard of Object.values(validation.standards)) {
      if (!standard.compliant && standard.violations) {
        for (const violation of standard.violations) {
          if (violation.type === 'TOUCH_VOLTAGE') {
            recommendations.push({
              standard: standard.standard,
              action: 'Aumentar número de conductores paralelos o mejorar capa superficial',
              priority: 'HIGH'
            });
          } else if (violation.type === 'STEP_VOLTAGE') {
            recommendations.push({
              standard: standard.standard,
              action: 'Agregar varillas adicionales o reducir espaciamiento de malla',
              priority: 'HIGH'
            });
          } else if (violation.type === 'GROUND_RESISTANCE') {
            recommendations.push({
              standard: standard.standard,
              action: 'Tratamiento químico del suelo o aumentar área de malla',
              priority: 'MEDIUM'
            });
          }
        }
      }
    }
    
    return recommendations;
  }
}

export default ComplianceEngine;
