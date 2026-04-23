// tests/simulation/SimulationRunner.test.js
import { SimulationRunner, quickSimulate } from '../../src/simulation/SimulationRunner.js';

describe('SimulationRunner - Main Simulation', () => {
  
  const mockProject = {
    grid: {
      area: 200,
      totalConductorLength: 100,
      depth: 0.6,
      length: 30,
      width: 16,
      numRods: 0,
      rodLength: 0
    },
    soil: {
      resistivity: 100,
      surfaceResistivity: 10000,
      surfaceDepth: 0.2
    },
    scenarios: [
      {
        id: 1,
        current: 1000,
        divisionFactor: 0.2,
        Ig: 200,
        duration: 0.35
      }
    ]
  };

  describe('Constructor', () => {
    test('debe crear runner con proyecto', () => {
      const runner = new SimulationRunner(mockProject);
      
      expect(runner.project).toBe(mockProject);
      expect(runner.results).toEqual([]);
    });
  });

  describe('runAll', () => {
    test('debe ejecutar simulación para todos los escenarios', () => {
      const runner = new SimulationRunner(mockProject);
      
      const results = runner.runAll();
      
      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0]).toHaveProperty('scenarioId');
      expect(results[0]).toHaveProperty('Rg');
      expect(results[0]).toHaveProperty('GPR');
      expect(results[0]).toHaveProperty('Em');
      expect(results[0]).toHaveProperty('Es');
    });

    test('debe guardar resultados en instance', () => {
      const runner = new SimulationRunner(mockProject);
      
      runner.runAll();
      
      expect(runner.results).toBeDefined();
      expect(runner.results.length).toBe(1);
    });

    test('debe manejar múltiples escenarios', () => {
      const project = {
        ...mockProject,
        scenarios: [
          { id: 1, current: 1000, divisionFactor: 0.2, duration: 0.35 },
          { id: 2, current: 2000, divisionFactor: 0.2, duration: 0.5 }
        ]
      };
      
      const runner = new SimulationRunner(project);
      const results = runner.runAll();
      
      expect(results.length).toBe(2);
      expect(results[0].scenarioId).toBe(1);
      expect(results[1].scenarioId).toBe(2);
    });
  });

  describe('runScenario', () => {
    test('debe ejecutar simulación para un escenario', () => {
      const runner = new SimulationRunner(mockProject);
      const scenario = mockProject.scenarios[0];
      
      const result = runner.runScenario(scenario);
      
      expect(result).toBeDefined();
      expect(result.scenarioId).toBe(1);
      expect(result.Rg).toBeGreaterThan(0);
      expect(result.GPR).toBeGreaterThan(0);
      expect(result.Cs).toBeGreaterThan(0);
      expect(result.Em).toBeGreaterThan(0);
      expect(result.Es).toBeGreaterThan(0);
      expect(result.Etouch70).toBeGreaterThan(0);
      expect(result.Estep70).toBeGreaterThan(0);
    });

    test('debe lanzar error con datos incompletos', () => {
      const runner = new SimulationRunner({});
      
      expect(() => runner.runScenario({})).toThrow('Incomplete data for simulation');
    });

    test('debe calcular Rg correctamente', () => {
      const runner = new SimulationRunner(mockProject);
      const scenario = mockProject.scenarios[0];
      
      const result = runner.runScenario(scenario);
      
      expect(result.Rg).toBeGreaterThan(0);
      expect(result.Rg).toBeLessThan(50);
    });

    test('debe calcular GPR correctamente', () => {
      const runner = new SimulationRunner(mockProject);
      const scenario = mockProject.scenarios[0];
      
      const result = runner.runScenario(scenario);
      
      expect(result.GPR).toBeGreaterThan(0);
    });

    test('debe calcular Cs correctamente', () => {
      const runner = new SimulationRunner(mockProject);
      const scenario = mockProject.scenarios[0];
      
      const result = runner.runScenario(scenario);
      
      expect(result.Cs).toBeGreaterThan(0);
      expect(result.Cs).toBeLessThan(1);
    });
  });

  describe('simulateStepVoltageAtPoint', () => {
    test('debe simular tensión de paso en un punto', () => {
      const runner = new SimulationRunner(mockProject);
      const scenario = mockProject.scenarios[0];
      
      const voltage = runner.simulateStepVoltageAtPoint(15, 8, scenario);
      
      expect(voltage).toBeGreaterThan(0);
    });

    test('debe retornar 0 en puntos lejanos', () => {
      const runner = new SimulationRunner(mockProject);
      const scenario = mockProject.scenarios[0];
      
      const voltage = runner.simulateStepVoltageAtPoint(100, 100, scenario);
      
      expect(voltage).toBe(0);
    });

    test('debe tener máximo en el centro', () => {
      const runner = new SimulationRunner(mockProject);
      const scenario = mockProject.scenarios[0];
      
      const centerVoltage = runner.simulateStepVoltageAtPoint(15, 8, scenario);
      const edgeVoltage = runner.simulateStepVoltageAtPoint(0, 0, scenario);
      
      expect(centerVoltage).toBeGreaterThan(edgeVoltage);
    });
  });

  describe('simulateTouchVoltageAtPoint', () => {
    test('debe simular tensión de contacto en un punto', () => {
      const runner = new SimulationRunner(mockProject);
      const scenario = mockProject.scenarios[0];
      
      const touchVoltage = runner.simulateTouchVoltageAtPoint(15, 8, scenario);
      const stepVoltage = runner.simulateStepVoltageAtPoint(15, 8, scenario);
      
      expect(touchVoltage).toBeGreaterThan(0);
      expect(touchVoltage).toBeLessThan(stepVoltage);
    });

    test('debe ser aproximadamente 70% de tensión de paso', () => {
      const runner = new SimulationRunner(mockProject);
      const scenario = mockProject.scenarios[0];
      
      const stepVoltage = runner.simulateStepVoltageAtPoint(15, 8, scenario);
      const touchVoltage = runner.simulateTouchVoltageAtPoint(15, 8, scenario);
      
      expect(touchVoltage).toBeCloseTo(stepVoltage * 0.7, 1);
    });
  });

  describe('generateVoltageMap', () => {
    test('debe generar mapa de tensiones', () => {
      const runner = new SimulationRunner(mockProject);
      
      const map = runner.generateVoltageMap(20);
      
      expect(map).toBeDefined();
      expect(map.length).toBeGreaterThan(0);
      expect(map[0]).toHaveProperty('x');
      expect(map[0]).toHaveProperty('y');
      expect(map[0]).toHaveProperty('voltage');
    });

    test('debe retornar array vacio sin escenarios', () => {
      const project = { ...mockProject, scenarios: [] };
      const runner = new SimulationRunner(project);
      
      const map = runner.generateVoltageMap();
      
      expect(map).toEqual([]);
    });

    test('debe respetar resolution', () => {
      const runner = new SimulationRunner(mockProject);
      
      const map10 = runner.generateVoltageMap(10);
      const map20 = runner.generateVoltageMap(20);
      
      expect(map20.length).toBeGreaterThan(map10.length);
    });
  });

  describe('quickSimulate', () => {
    test('debe simular sin instanciar clase', () => {
      const results = quickSimulate(mockProject);
      
      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0]).toHaveProperty('scenarioId');
    });

    test('debe retornar mismos resultados que runAll', () => {
      const runner = new SimulationRunner(mockProject);
      const results1 = runner.runAll();
      const results2 = quickSimulate(mockProject);
      
      expect(results1.length).toBe(results2.length);
      expect(results1[0].scenarioId).toBe(results2[0].scenarioId);
    });
  });
});
