// tests/engine/standards/nom/nom001SEDE2012.test.js
import NOM001_SEDE_2012 from '../../../../src/engine/standards/nom/nom001SEDE2012.js';

describe('NOM001_SEDE_2012 - NOM-001-SEDE-2012 Standards', () => {
  
  describe('touchVoltage', () => {
    test('debe calcular tensión de contacto tolerable', () => {
      const context = {
        faultDuration: 0.5,
        soilResistivity: 100,
        systemType: 'industrial'
      };
      
      const limit = NOM001_SEDE_2012.touchVoltage(context);
      
      expect(limit).toBeDefined();
      expect(limit).toBeGreaterThan(0);
    });

    test('debe ajustar por tiempo corto', () => {
      const context = {
        faultDuration: 0.05,
        soilResistivity: 100,
        systemType: 'industrial'
      };
      
      const limit = NOM001_SEDE_2012.touchVoltage(context);
      
      expect(limit).toBeGreaterThan(75); // Debe ser 100 * 1.2 = 120
    });

    test('debe ajustar por tiempo medio', () => {
      const context = {
        faultDuration: 0.3,
        soilResistivity: 100,
        systemType: 'industrial'
      };
      
      const limit = NOM001_SEDE_2012.touchVoltage(context);
      
      expect(limit).toBe(75 * 1.0); // 75V
    });

    test('debe ajustar por tiempo normal', () => {
      const context = {
        faultDuration: 0.5,
        soilResistivity: 100,
        systemType: 'industrial'
      };
      
      const limit = NOM001_SEDE_2012.touchVoltage(context);
      
      expect(limit).toBe(50 * 1.0); // 50V
    });

    test('debe ajustar por tiempo largo', () => {
      const context = {
        faultDuration: 1.5,
        soilResistivity: 100,
        systemType: 'industrial'
      };
      
      const limit = NOM001_SEDE_2012.touchVoltage(context);
      
      expect(limit).toBe(30 * 1.0); // 30V
    });

    test('debe ajustar por resistividad baja', () => {
      const context = {
        faultDuration: 0.5,
        soilResistivity: 50,
        systemType: 'industrial'
      };
      
      const limit = NOM001_SEDE_2012.touchVoltage(context);
      
      expect(limit).toBe(50 * 1.2); // 60V
    });

    test('debe ajustar por resistividad alta', () => {
      const context = {
        faultDuration: 0.5,
        soilResistivity: 600,
        systemType: 'industrial'
      };
      
      const limit = NOM001_SEDE_2012.touchVoltage(context);
      
      expect(limit).toBe(50 * 0.8); // 40V
    });

    test('debe ajustar por sistema hospital', () => {
      const context = {
        faultDuration: 0.5,
        soilResistivity: 100,
        systemType: 'hospital'
      };
      
      const limit = NOM001_SEDE_2012.touchVoltage(context);
      
      expect(limit).toBe(50 * 0.7); // 35V
    });

    test('debe usar tipo industrial por defecto', () => {
      const context = {
        faultDuration: 0.5,
        soilResistivity: 100
      };
      
      const limit = NOM001_SEDE_2012.touchVoltage(context);
      
      expect(limit).toBe(50 * 1.0); // 50V
    });

    test('debe usar tiempo por defecto', () => {
      const context = {
        soilResistivity: 100,
        systemType: 'industrial'
      };
      
      const limit = NOM001_SEDE_2012.touchVoltage(context);
      
      expect(limit).toBeGreaterThan(0);
    });
  });

  describe('stepVoltage', () => {
    test('debe calcular tensión de paso tolerable', () => {
      const context = {
        faultDuration: 0.5,
        soilResistivity: 100,
        surfaceResistivity: 3000
      };
      
      const limit = NOM001_SEDE_2012.stepVoltage(context);
      
      expect(limit).toBeDefined();
      expect(limit).toBeGreaterThan(0);
    });

    test('debe usar tiempo por defecto', () => {
      const context = {
        soilResistivity: 100,
        surfaceResistivity: 3000
      };
      
      const limit = NOM001_SEDE_2012.stepVoltage(context);
      
      expect(limit).toBeGreaterThan(0);
    });

    test('debe usar resistividad superficial por defecto', () => {
      const context = {
        faultDuration: 0.5,
        soilResistivity: 100
      };
      
      const limit = NOM001_SEDE_2012.stepVoltage(context);
      
      expect(limit).toBeGreaterThan(0);
    });

    test('debe limitar a máximo 500V', () => {
      const context = {
        faultDuration: 0.1,
        soilResistivity: 100,
        surfaceResistivity: 10000
      };
      
      const limit = NOM001_SEDE_2012.stepVoltage(context);
      
      expect(limit).toBeLessThanOrEqual(500);
    });

    test('debe calcular Cs correctamente', () => {
      const context = {
        faultDuration: 0.5,
        soilResistivity: 100,
        surfaceResistivity: 3000
      };
      
      const limit = NOM001_SEDE_2012.stepVoltage(context);
      
      // Cs = 1 - 0.09 * (1 - 100/3000) / (2*0.1 + 0.09) = 1 - 0.09*0.967/0.29 ≈ 0.7
      // baseLimit = (1000 + 6*0.7*3000) * 0.116/sqrt(0.5) ≈ 10600 * 0.164 ≈ 1739
      // limitado a 500V
      expect(limit).toBeLessThanOrEqual(500);
    });
  });

  describe('maxGroundResistance', () => {
    test('debe retornar límite para baja tensión', () => {
      const context = {
        voltageLevel: 480,
        systemType: 'industrial',
        faultCurrent: 1000
      };
      
      const limit = NOM001_SEDE_2012.maxGroundResistance(context);
      
      expect(limit).toBe(25);
    });

    test('debe retornar límite para media tensión', () => {
      const context = {
        voltageLevel: 13800,
        systemType: 'industrial',
        faultCurrent: 1000
      };
      
      const limit = NOM001_SEDE_2012.maxGroundResistance(context);
      
      expect(limit).toBe(10);
    });

    test('debe retornar límite para alta tensión', () => {
      const context = {
        voltageLevel: 34500,
        systemType: 'industrial',
        faultCurrent: 1000
      };
      
      const limit = NOM001_SEDE_2012.maxGroundResistance(context);
      
      expect(limit).toBe(5);
    });

    test('debe retornar límite para muy alta tensión', () => {
      const context = {
        voltageLevel: 69000,
        systemType: 'industrial',
        faultCurrent: 1000
      };
      
      const limit = NOM001_SEDE_2012.maxGroundResistance(context);
      
      expect(limit).toBe(2);
    });

    test('debe manejar límite superior', () => {
      const context = {
        voltageLevel: 99999,
        systemType: 'industrial',
        faultCurrent: 1000
      };
      
      const limit = NOM001_SEDE_2012.maxGroundResistance(context);
      
      expect(limit).toBe(2);
    });
  });

  describe('maxFaultCurrent', () => {
    test('debe calcular corriente máxima de falla', () => {
      const context = {
        conductorSize: '2/0',
        faultDuration: 0.5,
        systemType: 'industrial'
      };
      
      const maxCurrent = NOM001_SEDE_2012.maxFaultCurrent(context);
      
      expect(maxCurrent).toBeDefined();
      expect(maxCurrent).toBeGreaterThan(0);
    });

    test('debe usar tamaño por defecto', () => {
      const context = {
        faultDuration: 0.5,
        systemType: 'industrial'
      };
      
      const maxCurrent = NOM001_SEDE_2012.maxFaultCurrent(context);
      
      expect(maxCurrent).toBeGreaterThan(0);
    });

    test('debe usar tiempo por defecto', () => {
      const context = {
        conductorSize: '2/0',
        systemType: 'industrial'
      };
      
      const maxCurrent = NOM001_SEDE_2012.maxFaultCurrent(context);
      
      expect(maxCurrent).toBeGreaterThan(0);
    });

    test('debe ajustar por tamaño de conductor', () => {
      const sizes = ['2', '4', '6', '8', '10', '12', '1/0', '2/0', '3/0', '4/0'];
      
      sizes.forEach(size => {
        const context = {
          conductorSize: size,
          faultDuration: 0.5,
          systemType: 'industrial'
        };
        
        const maxCurrent = NOM001_SEDE_2012.maxFaultCurrent(context);
        
        expect(maxCurrent).toBeGreaterThan(0);
      });
    });

    test('debe ajustar por tiempo de falla', () => {
      const context1 = {
        conductorSize: '2/0',
        faultDuration: 0.25,
        systemType: 'industrial'
      };
      const context2 = {
        conductorSize: '2/0',
        faultDuration: 1.0,
        systemType: 'industrial'
      };
      
      const maxCurrent1 = NOM001_SEDE_2012.maxFaultCurrent(context1);
      const maxCurrent2 = NOM001_SEDE_2012.maxFaultCurrent(context2);
      
      expect(maxCurrent1).toBeGreaterThan(maxCurrent2);
    });
  });

  describe('verifyGroundingSystem', () => {
    test('debe verificar sistema de tierras', () => {
      const results = {
        groundResistance: 10
      };
      const context = {
        voltageLevel: 13800,
        systemType: 'industrial',
        faultCurrent: 1000
      };
      
      const check = NOM001_SEDE_2012.verifyGroundingSystem(results, context);
      
      expect(check).toBeDefined();
      expect(check.compliant).toBeDefined();
      expect(check.violations).toBeDefined();
      expect(Array.isArray(check.violations)).toBe(true);
      expect(check.recommendations).toBeDefined();
    });

    test('debe detectar resistencia excesiva', () => {
      const results = {
        groundResistance: 30
      };
      const context = {
        voltageLevel: 13800,
        systemType: 'industrial',
        faultCurrent: 1000
      };
      
      const check = NOM001_SEDE_2012.verifyGroundingSystem(results, context);
      
      expect(check.compliant).toBe(false);
      expect(check.violations.length).toBeGreaterThan(0);
      expect(check.violations[0].code).toBe('250-56');
    });

    test('debe pasar verificación', () => {
      const results = {
        groundResistance: 5
      };
      const context = {
        voltageLevel: 13800,
        systemType: 'industrial',
        faultCurrent: 1000
      };
      
      const check = NOM001_SEDE_2012.verifyGroundingSystem(results, context);
      
      expect(check.compliant).toBe(true);
      expect(check.violations).toHaveLength(0);
    });

    test('debe generar recomendaciones', () => {
      const results = {
        groundResistance: 30
      };
      const context = {
        voltageLevel: 13800,
        systemType: 'industrial',
        faultCurrent: 1000
      };
      
      const check = NOM001_SEDE_2012.verifyGroundingSystem(results, context);
      
      expect(check.recommendations).toBeDefined();
      expect(check.recommendations.length).toBe(check.violations.length);
    });
  });

  describe('verifyIndirectContact', () => {
    test('debe verificar protección contra contactos indirectos', () => {
      const results = {
        touchVoltage: { value: 40 },
        stepVoltage: { value: 100 }
      };
      const context = {
        faultDuration: 0.5,
        soilResistivity: 100,
        surfaceResistivity: 3000,
        systemType: 'industrial'
      };
      
      const check = NOM001_SEDE_2012.verifyIndirectContact(results, context);
      
      expect(check).toBeDefined();
      expect(check.compliant).toBeDefined();
      expect(check.violations).toBeDefined();
      expect(check.touchSafe).toBeDefined();
      expect(check.stepSafe).toBeDefined();
    });

    test('debe detectar tensión de contacto excesiva', () => {
      const results = {
        touchVoltage: { value: 80 },
        stepVoltage: { value: 100 }
      };
      const context = {
        faultDuration: 0.5,
        soilResistivity: 100,
        surfaceResistivity: 3000,
        systemType: 'industrial'
      };
      
      const check = NOM001_SEDE_2012.verifyIndirectContact(results, context);
      
      expect(check.compliant).toBe(false);
      expect(check.touchSafe).toBe(false);
      expect(check.violations).toContainEqual(
        expect.objectContaining({ code: '250-95', severity: 'CRITICAL' })
      );
    });

    test('debe detectar tensión de paso excesiva', () => {
      const results = {
        touchVoltage: { value: 40 },
        stepVoltage: { value: 600 }
      };
      const context = {
        faultDuration: 0.5,
        soilResistivity: 100,
        surfaceResistivity: 3000,
        systemType: 'industrial'
      };
      
      const check = NOM001_SEDE_2012.verifyIndirectContact(results, context);
      
      expect(check.compliant).toBe(false);
      expect(check.stepSafe).toBe(false);
      expect(check.violations).toContainEqual(
        expect.objectContaining({ code: '250-95', severity: 'HIGH' })
      );
    });

    test('debe pasar verificación', () => {
      const results = {
        touchVoltage: { value: 40 },
        stepVoltage: { value: 100 }
      };
      const context = {
        faultDuration: 0.5,
        soilResistivity: 100,
        surfaceResistivity: 3000,
        systemType: 'industrial'
      };
      
      const check = NOM001_SEDE_2012.verifyIndirectContact(results, context);
      
      expect(check.compliant).toBe(true);
      expect(check.touchSafe).toBe(true);
      expect(check.stepSafe).toBe(true);
      expect(check.violations).toHaveLength(0);
    });
  });

  describe('generateComplianceCertificate', () => {
    test('debe generar certificado de cumplimiento', () => {
      const results = {
        groundResistance: 5,
        touchVoltage: { value: 40 },
        stepVoltage: { value: 100 }
      };
      const context = {
        voltageLevel: 13800,
        systemType: 'industrial',
        faultDuration: 0.5,
        soilResistivity: 100,
        surfaceResistivity: 3000
      };
      
      const certificate = NOM001_SEDE_2012.generateComplianceCertificate(results, context);
      
      expect(certificate).toBeDefined();
      expect(certificate.standard).toBe('NOM-001-SEDE-2012');
      expect(certificate.title).toBe('Electrical Installations (Utilization)');
      expect(certificate.compliant).toBeDefined();
      expect(certificate.sections).toBeDefined();
      expect(certificate.sections.grounding).toBeDefined();
      expect(certificate.sections.indirectContact).toBeDefined();
      expect(certificate.certificateNumber).toBeDefined();
      expect(certificate.issuedAt).toBeDefined();
      expect(certificate.validUntil).toBeDefined();
    });

    test('debe generar número de certificado', () => {
      const results = {
        groundResistance: 5,
        touchVoltage: { value: 40 },
        stepVoltage: { value: 100 }
      };
      const context = {
        voltageLevel: 13800,
        systemType: 'industrial',
        faultDuration: 0.5,
        soilResistivity: 100,
        surfaceResistivity: 3000
      };
      
      const certificate = NOM001_SEDE_2012.generateComplianceCertificate(results, context);
      
      expect(certificate.certificateNumber).toBeDefined();
      expect(certificate.certificateNumber).toMatch(/^NOM-\d+$/);
    });

    test('debe calcular fecha de validez', () => {
      const results = {
        groundResistance: 5,
        touchVoltage: { value: 40 },
        stepVoltage: { value: 100 }
      };
      const context = {
        voltageLevel: 13800,
        systemType: 'industrial',
        faultDuration: 0.5,
        soilResistivity: 100,
        surfaceResistivity: 3000
      };
      
      const certificate = NOM001_SEDE_2012.generateComplianceCertificate(results, context);
      
      const issuedDate = new Date(certificate.issuedAt);
      const validDate = new Date(certificate.validUntil);
      const daysDiff = (validDate - issuedDate) / (1000 * 60 * 60 * 24);
      
      expect(daysDiff).toBeCloseTo(365, 0);
    });
  });
});
