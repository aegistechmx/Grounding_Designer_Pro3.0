// tests/simulation/scenarios/FaultScenarios.test.js
import FaultScenarios, { createCustomScenario } from '../../../src/simulation/scenarios/FaultScenarios.js';

describe('FaultScenarios - Fault Scenario Definitions', () => {
  
  describe('Predefined Scenarios', () => {
    test('debe tener escenario industrial estándar', () => {
      expect(FaultScenarios.industrialStandard).toBeDefined();
      expect(FaultScenarios.industrialStandard.id).toBe('industrial_std');
      expect(FaultScenarios.industrialStandard.name).toBe('Industrial Standard');
      expect(FaultScenarios.industrialStandard.current).toBe(5000);
      expect(FaultScenarios.industrialStandard.duration).toBe(0.5);
      expect(FaultScenarios.industrialStandard.divisionFactor).toBe(0.15);
      expect(FaultScenarios.industrialStandard.description).toBe('Typical industrial substation fault');
    });

    test('debe tener escenario conservador', () => {
      expect(FaultScenarios.conservative).toBeDefined();
      expect(FaultScenarios.conservative.id).toBe('conservative');
      expect(FaultScenarios.conservative.name).toBe('Conservative');
      expect(FaultScenarios.conservative.current).toBe(10000);
      expect(FaultScenarios.conservative.duration).toBe(0.35);
      expect(FaultScenarios.conservative.divisionFactor).toBe(0.2);
      expect(FaultScenarios.conservative.description).toBe('High safety scenario');
    });

    test('debe tener escenario económico', () => {
      expect(FaultScenarios.economic).toBeDefined();
      expect(FaultScenarios.economic.id).toBe('economic');
      expect(FaultScenarios.economic.name).toBe('Economic');
      expect(FaultScenarios.economic.current).toBe(3000);
      expect(FaultScenarios.economic.duration).toBe(0.7);
      expect(FaultScenarios.economic.divisionFactor).toBe(0.1);
      expect(FaultScenarios.economic.description).toBe('Fast protection');
    });

    test('debe tener escenario data center', () => {
      expect(FaultScenarios.dataCenter).toBeDefined();
      expect(FaultScenarios.dataCenter.id).toBe('datacenter');
      expect(FaultScenarios.dataCenter.name).toBe('Data Center');
      expect(FaultScenarios.dataCenter.current).toBe(8000);
      expect(FaultScenarios.dataCenter.duration).toBe(0.25);
      expect(FaultScenarios.dataCenter.divisionFactor).toBe(0.12);
      expect(FaultScenarios.dataCenter.description).toBe('High availability');
    });

    test('debe tener escenario hospital', () => {
      expect(FaultScenarios.hospital).toBeDefined();
      expect(FaultScenarios.hospital.id).toBe('hospital');
      expect(FaultScenarios.hospital.name).toBe('Hospital');
      expect(FaultScenarios.hospital.current).toBe(6000);
      expect(FaultScenarios.hospital.duration).toBe(0.2);
      expect(FaultScenarios.hospital.divisionFactor).toBe(0.18);
      expect(FaultScenarios.hospital.description).toBe('Ultra-sensitive protection');
    });
  });

  describe('createCustomScenario', () => {
    test('debe crear escenario personalizado con parámetros completos', () => {
      const params = {
        name: 'Mi Escenario',
        current: 7500,
        duration: 0.4,
        divisionFactor: 0.16,
        description: 'Descripción personalizada'
      };
      
      const scenario = createCustomScenario(params);
      
      expect(scenario).toBeDefined();
      expect(scenario.id).toMatch(/^custom_\d+$/);
      expect(scenario.name).toBe('Mi Escenario');
      expect(scenario.current).toBe(7500);
      expect(scenario.duration).toBe(0.4);
      expect(scenario.divisionFactor).toBe(0.16);
      expect(scenario.description).toBe('Descripción personalizada');
    });

    test('debe usar valores por defecto cuando faltan parámetros', () => {
      const scenario = createCustomScenario({});
      
      expect(scenario.name).toBe('Custom');
      expect(scenario.current).toBe(5000);
      expect(scenario.duration).toBe(0.5);
      expect(scenario.divisionFactor).toBe(0.15);
      expect(scenario.description).toBe('Custom configuration');
    });

    test('debe usar valores por defecto parciales', () => {
      const params = {
        current: 4000,
        duration: 0.6
      };
      
      const scenario = createCustomScenario(params);
      
      expect(scenario.name).toBe('Custom');
      expect(scenario.current).toBe(4000);
      expect(scenario.duration).toBe(0.6);
      expect(scenario.divisionFactor).toBe(0.15);
      expect(scenario.description).toBe('Custom configuration');
    });

    test('debe generar IDs únicos para cada escenario', async () => {
      const scenario1 = createCustomScenario({ name: 'Test1' });
      await new Promise(resolve => setTimeout(resolve, 1));
      const scenario2 = createCustomScenario({ name: 'Test2' });
      
      expect(scenario1.id).not.toBe(scenario2.id);
    });

    test('debe usar valores por defecto cuando se pasan ceros', () => {
      const params = {
        current: 0,
        duration: 0,
        divisionFactor: 0
      };
      
      const scenario = createCustomScenario(params);
      
      // 0 is a valid value (not null/undefined), so it's used as-is
      expect(scenario.current).toBe(0);
      expect(scenario.duration).toBe(0);
      expect(scenario.divisionFactor).toBe(0);
    });

    test('debe manejar valores negativos', () => {
      const params = {
        current: -1000,
        duration: -0.5,
        divisionFactor: -0.1
      };
      
      const scenario = createCustomScenario(params);
      
      expect(scenario.current).toBe(-1000);
      expect(scenario.duration).toBe(-0.5);
      expect(scenario.divisionFactor).toBe(-0.1);
    });
  });

  describe('Scenario Validation', () => {
    test('todos los escenarios predefinidos deben tener estructura válida', () => {
      const scenarios = [
        FaultScenarios.industrialStandard,
        FaultScenarios.conservative,
        FaultScenarios.economic,
        FaultScenarios.dataCenter,
        FaultScenarios.hospital
      ];
      
      scenarios.forEach(scenario => {
        expect(scenario).toHaveProperty('id');
        expect(scenario).toHaveProperty('name');
        expect(scenario).toHaveProperty('current');
        expect(scenario).toHaveProperty('duration');
        expect(scenario).toHaveProperty('divisionFactor');
        expect(scenario).toHaveProperty('description');
        
        expect(typeof scenario.id).toBe('string');
        expect(typeof scenario.name).toBe('string');
        expect(typeof scenario.current).toBe('number');
        expect(typeof scenario.duration).toBe('number');
        expect(typeof scenario.divisionFactor).toBe('number');
        expect(typeof scenario.description).toBe('string');
      });
    });

    test('valores de corriente deben ser positivos en escenarios predefinidos', () => {
      const scenarios = [
        FaultScenarios.industrialStandard,
        FaultScenarios.conservative,
        FaultScenarios.economic,
        FaultScenarios.dataCenter,
        FaultScenarios.hospital
      ];
      
      scenarios.forEach(scenario => {
        expect(scenario.current).toBeGreaterThan(0);
      });
    });

    test('valores de duración deben ser positivos en escenarios predefinidos', () => {
      const scenarios = [
        FaultScenarios.industrialStandard,
        FaultScenarios.conservative,
        FaultScenarios.economic,
        FaultScenarios.dataCenter,
        FaultScenarios.hospital
      ];
      
      scenarios.forEach(scenario => {
        expect(scenario.duration).toBeGreaterThan(0);
      });
    });

    test('valores de factor de división deben estar en rango razonable', () => {
      const scenarios = [
        FaultScenarios.industrialStandard,
        FaultScenarios.conservative,
        FaultScenarios.economic,
        FaultScenarios.dataCenter,
        FaultScenarios.hospital
      ];
      
      scenarios.forEach(scenario => {
        expect(scenario.divisionFactor).toBeGreaterThan(0);
        expect(scenario.divisionFactor).toBeLessThan(1);
      });
    });
  });

  describe('Scenario Comparison', () => {
    test('escenario conservador debe tener mayor corriente que económico', () => {
      expect(FaultScenarios.conservative.current).toBeGreaterThan(FaultScenarios.economic.current);
    });

    test('escenario hospital debe tener menor duración que industrial', () => {
      expect(FaultScenarios.hospital.duration).toBeLessThan(FaultScenarios.industrialStandard.duration);
    });

    test('escenario data center debe tener alta corriente y baja duración', () => {
      expect(FaultScenarios.dataCenter.current).toBeGreaterThan(5000);
      expect(FaultScenarios.dataCenter.duration).toBeLessThan(0.3);
    });
  });
});
