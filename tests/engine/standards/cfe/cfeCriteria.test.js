// tests/engine/standards/cfe/cfeCriteria.test.js
import CFE_CRITERIA from '../../../../src/engine/standards/cfe/cfeCriteria.js';

describe('CFE_CRITERIA - CFE Grounding Standards', () => {
  
  describe('safetyFactors', () => {
    test('debe calcular factores de seguridad', () => {
      const system = {
        installationType: 'substation',
        soilMoisture: 0.2,
        protectionTime: 0.35
      };
      
      const factors = CFE_CRITERIA.safetyFactors(system);
      
      expect(factors).toBeDefined();
      expect(factors.total).toBeGreaterThan(0);
      expect(factors.timeFactor).toBeDefined();
      expect(factors.soilFactor).toBeDefined();
      expect(factors.installationFactor).toBeDefined();
      expect(factors.description).toBeDefined();
    });

    test('debe ajustar factor de tiempo corto', () => {
      const system = {
        installationType: 'substation',
        soilMoisture: 0.2,
        protectionTime: 0.15
      };
      
      const factors = CFE_CRITERIA.safetyFactors(system);
      
      expect(factors.timeFactor).toBe(0.8);
    });

    test('debe ajustar factor de tiempo largo', () => {
      const system = {
        installationType: 'substation',
        soilMoisture: 0.2,
        protectionTime: 0.6
      };
      
      const factors = CFE_CRITERIA.safetyFactors(system);
      
      expect(factors.timeFactor).toBe(1.2);
    });

    test('debe usar factor de tiempo normal por defecto', () => {
      const system = {
        installationType: 'substation',
        soilMoisture: 0.2,
        protectionTime: 0.35
      };
      
      const factors = CFE_CRITERIA.safetyFactors(system);
      
      expect(factors.timeFactor).toBe(1.0);
    });

    test('debe ajustar factor de suelo húmedo', () => {
      const system = {
        installationType: 'substation',
        soilMoisture: 0.4,
        protectionTime: 0.35
      };
      
      const factors = CFE_CRITERIA.safetyFactors(system);
      
      expect(factors.soilFactor).toBe(0.8);
    });

    test('debe ajustar factor de suelo seco', () => {
      const system = {
        installationType: 'substation',
        soilMoisture: 0.05,
        protectionTime: 0.35
      };
      
      const factors = CFE_CRITERIA.safetyFactors(system);
      
      expect(factors.soilFactor).toBe(1.3);
    });

    test('debe usar factor de instalación correcto', () => {
      const installations = ['substation', 'industrial', 'commercial', 'residential', 'hospital', 'data_center'];
      
      installations.forEach(type => {
        const system = {
          installationType: type,
          soilMoisture: 0.2,
          protectionTime: 0.35
        };
        
        const factors = CFE_CRITERIA.safetyFactors(system);
        
        expect(factors.installationFactor).toBeGreaterThan(0);
        expect(factors.installationFactor).toBeLessThanOrEqual(1.3);
      });
    });

    test('debe usar factor de instalación por defecto desconocido', () => {
      const system = {
        installationType: 'unknown',
        soilMoisture: 0.2,
        protectionTime: 0.35
      };
      
      const factors = CFE_CRITERIA.safetyFactors(system);
      
      expect(factors.installationFactor).toBe(1.0);
    });
  });

  describe('getSafetyDescription', () => {
    test('debe describir hospital', () => {
      const desc = CFE_CRITERIA.getSafetyDescription('hospital', 0.2);
      
      expect(desc).toBe('Medical criteria - Maximum safety');
    });

    test('debe describir data center', () => {
      const desc = CFE_CRITERIA.getSafetyDescription('data_center', 0.2);
      
      expect(desc).toBe('Sensitive equipment - Critical safety');
    });

    test('debe describir suelo seco', () => {
      const desc = CFE_CRITERIA.getSafetyDescription('substation', 0.05);
      
      expect(desc).toBe('Dry soil - Additional measures required');
    });

    test('debe describir criterios estándar', () => {
      const desc = CFE_CRITERIA.getSafetyDescription('substation', 0.2);
      
      expect(desc).toBe('Standard CFE criteria');
    });
  });

  describe('maxGroundResistance', () => {
    test('debe retornar límite para distribución 13.8kV', () => {
      const limit = CFE_CRITERIA.maxGroundResistance('13.8', 'distribution');
      
      expect(limit).toBe(10);
    });

    test('debe retornar límite para distribución 23kV', () => {
      const limit = CFE_CRITERIA.maxGroundResistance('23', 'distribution');
      
      expect(limit).toBe(8);
    });

    test('debe retornar límite para distribución 34.5kV', () => {
      const limit = CFE_CRITERIA.maxGroundResistance('34.5', 'distribution');
      
      expect(limit).toBe(5);
    });

    test('debe retornar límite para transmisión 69kV', () => {
      const limit = CFE_CRITERIA.maxGroundResistance('69', 'transmission');
      
      expect(limit).toBe(3);
    });

    test('debe retornar límite para transmisión 115kV', () => {
      const limit = CFE_CRITERIA.maxGroundResistance('115', 'transmission');
      
      expect(limit).toBe(2);
    });

    test('debe retornar límite para transmisión 230kV', () => {
      const limit = CFE_CRITERIA.maxGroundResistance('230', 'transmission');
      
      expect(limit).toBe(1);
    });

    test('debe retornar límite para transmisión 400kV', () => {
      const limit = CFE_CRITERIA.maxGroundResistance('400', 'transmission');
      
      expect(limit).toBe(0.5);
    });

    test('debe inferir categoría por tensión', () => {
      const limit = CFE_CRITERIA.maxGroundResistance('13.8');
      
      expect(limit).toBe(10); // Inferido como distribución
    });

    test('debe inferir categoría alta tensión', () => {
      const limit = CFE_CRITERIA.maxGroundResistance('69');
      
      expect(limit).toBe(3); // Inferido como transmisión
    });

    test('debe usar default para tensión desconocida', () => {
      const limit = CFE_CRITERIA.maxGroundResistance('999');
      
      expect(limit).toBe(10);
    });
  });

  describe('verifySubstationCriteria', () => {
    test('debe verificar criterios de subestación', () => {
      const results = {
        groundResistance: 5,
        GPR: 3000
      };
      const context = {
        voltageLevel: '13.8',
        substationType: 'distribution',
        protectionTime: 0.35,
        faultCurrent: 1000
      };
      
      const check = CFE_CRITERIA.verifySubstationCriteria(results, context);
      
      expect(check).toBeDefined();
      expect(check.compliant).toBeDefined();
      expect(check.violations).toBeDefined();
      expect(Array.isArray(check.violations)).toBe(true);
    });

    test('debe detectar resistencia fuera de especificación', () => {
      const results = {
        groundResistance: 15,
        GPR: 3000
      };
      const context = {
        voltageLevel: '13.8',
        substationType: 'distribution',
        protectionTime: 0.35,
        faultCurrent: 1000
      };
      
      const check = CFE_CRITERIA.verifySubstationCriteria(results, context);
      
      expect(check.compliant).toBe(false);
      expect(check.violations.length).toBeGreaterThan(0);
      expect(check.violations[0].code).toBe('CFE-G0100-04');
    });

    test('debe detectar GPR elevado', () => {
      const results = {
        groundResistance: 5,
        GPR: 6000
      };
      const context = {
        voltageLevel: '13.8',
        substationType: 'distribution',
        protectionTime: 0.35,
        faultCurrent: 1000
      };
      
      const check = CFE_CRITERIA.verifySubstationCriteria(results, context);
      
      expect(check.compliant).toBe(false);
      expect(check.violations).toContainEqual(
        expect.objectContaining({ code: 'CFE-01J00-01', title: 'Elevated GPR' })
      );
    });

    test('debe detectar tiempo de despeje excesivo', () => {
      const results = {
        groundResistance: 5,
        GPR: 3000
      };
      const context = {
        voltageLevel: '13.8',
        substationType: 'distribution',
        protectionTime: 0.6,
        faultCurrent: 1000
      };
      
      const check = CFE_CRITERIA.verifySubstationCriteria(results, context);
      
      expect(check.compliant).toBe(false);
      expect(check.violations).toContainEqual(
        expect.objectContaining({ title: 'Excessive clearing time' })
      );
    });

    test('debe pasar todos los criterios', () => {
      const results = {
        groundResistance: 5,
        GPR: 3000
      };
      const context = {
        voltageLevel: '13.8',
        substationType: 'distribution',
        protectionTime: 0.35,
        faultCurrent: 1000
      };
      
      const check = CFE_CRITERIA.verifySubstationCriteria(results, context);
      
      expect(check.compliant).toBe(true);
      expect(check.violations).toHaveLength(0);
    });

    test('debe filtrar violaciones críticas', () => {
      const results = {
        groundResistance: 15,
        GPR: 6000
      };
      const context = {
        voltageLevel: '13.8',
        substationType: 'distribution',
        protectionTime: 0.35,
        faultCurrent: 1000
      };
      
      const check = CFE_CRITERIA.verifySubstationCriteria(results, context);
      
      expect(check.criticalViolations).toBeDefined();
      expect(check.criticalViolations.length).toBeGreaterThan(0);
    });
  });

  describe('verifyOperationalSafety', () => {
    test('debe verificar seguridad operativa', () => {
      const results = {
        touchVoltage: { value: 40 },
        stepVoltage: { value: 100 }
      };
      const context = {
        installationType: 'substation',
        soilMoisture: 0.2,
        protectionTime: 0.35,
        faultCurrent: 1000
      };
      
      const check = CFE_CRITERIA.verifyOperationalSafety(results, context);
      
      expect(check).toBeDefined();
      expect(check.compliant).toBeDefined();
      expect(check.violations).toBeDefined();
      expect(check.safetyFactors).toBeDefined();
      expect(check.operationalLimit).toBeDefined();
    });

    test('debe detectar tensión de contacto excesiva', () => {
      const results = {
        touchVoltage: { value: 60 },
        stepVoltage: { value: 100 }
      };
      const context = {
        installationType: 'substation',
        soilMoisture: 0.2,
        protectionTime: 0.35,
        faultCurrent: 1000
      };
      
      const check = CFE_CRITERIA.verifyOperationalSafety(results, context);
      
      expect(check.compliant).toBe(false);
      expect(check.violations).toContainEqual(
        expect.objectContaining({ severity: 'CRITICAL' })
      );
    });

    test('debe detectar tensión de paso excesiva', () => {
      const results = {
        touchVoltage: { value: 40 },
        stepVoltage: { value: 200 }
      };
      const context = {
        installationType: 'substation',
        soilMoisture: 0.2,
        protectionTime: 0.35,
        faultCurrent: 1000
      };
      
      const check = CFE_CRITERIA.verifyOperationalSafety(results, context);
      
      expect(check.compliant).toBe(false);
      expect(check.violations).toContainEqual(
        expect.objectContaining({ severity: 'HIGH' })
      );
    });

    test('debe pasar seguridad operativa', () => {
      const results = {
        touchVoltage: { value: 40 },
        stepVoltage: { value: 100 }
      };
      const context = {
        installationType: 'substation',
        soilMoisture: 0.2,
        protectionTime: 0.35,
        faultCurrent: 1000
      };
      
      const check = CFE_CRITERIA.verifyOperationalSafety(results, context);
      
      expect(check.compliant).toBe(true);
      expect(check.violations).toHaveLength(0);
    });
  });

  describe('generateCFEReport', () => {
    test('debe generar reporte CFE completo', () => {
      const results = {
        groundResistance: 5,
        GPR: 3000,
        touchVoltage: { value: 40 },
        stepVoltage: { value: 100 }
      };
      const context = {
        voltageLevel: '13.8',
        substationType: 'distribution',
        installationType: 'substation',
        soilMoisture: 0.2,
        protectionTime: 0.35,
        faultCurrent: 1000,
        engineerName: 'Ing. Test'
      };
      
      const report = CFE_CRITERIA.generateCFEReport(results, context);
      
      expect(report).toBeDefined();
      expect(report.standard).toBe('CFE 01J00-01 / G0100-04');
      expect(report.title).toBe('CFE Grounding Criteria');
      expect(report.compliant).toBeDefined();
      expect(report.substation).toBeDefined();
      expect(report.operationalSafety).toBeDefined();
      expect(report.certificateNumber).toBeDefined();
      expect(report.engineerResponsible).toBe('Ing. Test');
      expect(report.reviewDate).toBeDefined();
    });

    test('debe usar nombre por defecto', () => {
      const results = {
        groundResistance: 5,
        GPR: 3000,
        touchVoltage: { value: 40 },
        stepVoltage: { value: 100 }
      };
      const context = {
        voltageLevel: '13.8',
        substationType: 'distribution',
        installationType: 'substation',
        soilMoisture: 0.2,
        protectionTime: 0.35,
        faultCurrent: 1000
      };
      
      const report = CFE_CRITERIA.generateCFEReport(results, context);
      
      expect(report.engineerResponsible).toBe('Specialist Engineer');
    });

    test('debe generar número de certificado', () => {
      const results = {
        groundResistance: 5,
        GPR: 3000,
        touchVoltage: { value: 40 },
        stepVoltage: { value: 100 }
      };
      const context = {
        voltageLevel: '13.8',
        substationType: 'distribution',
        installationType: 'substation',
        soilMoisture: 0.2,
        protectionTime: 0.35,
        faultCurrent: 1000
      };
      
      const report = CFE_CRITERIA.generateCFEReport(results, context);
      
      expect(report.certificateNumber).toBeDefined();
      expect(report.certificateNumber).toMatch(/^CFE-\d+$/);
    });
  });
});
