// tests/simulation/FEMSimulationRunner.test.js
import { FEMSimulationRunner } from '../../src/simulation/FEMSimulationRunner.js';

describe('FEMSimulationRunner - FEM Simulation', () => {
  
  describe('Constructor', () => {
    test('debe crear runner con proyecto', () => {
      const project = {
        soil: { resistivity: 100, surfaceResistivity: 10000, surfaceDepth: 0.2 },
        scenarios: [{ id: 1, duration: 0.35 }]
      };
      
      const runner = new FEMSimulationRunner(project);
      
      expect(runner.project).toBe(project);
      expect(runner.options).toEqual({});
      expect(runner.femAssembler).toBeNull();
    });

    test('debe aceptar opciones personalizadas', () => {
      const project = {
        soil: { resistivity: 100, surfaceResistivity: 10000, surfaceDepth: 0.2 },
        scenarios: [{ id: 1, duration: 0.35 }]
      };
      
      const options = { resolution: 0.5, tolerance: 1e-8, maxIterations: 1000 };
      const runner = new FEMSimulationRunner(project, options);
      
      expect(runner.options).toEqual(options);
    });
  });

  describe('mapResultsToFormat', () => {
    test('debe mapear resultados FEM al formato del sistema', () => {
      const project = {
        soil: { resistivity: 100, surfaceResistivity: 10000, surfaceDepth: 0.2 },
        scenarios: [{ id: 1, duration: 0.35 }]
      };
      
      const runner = new FEMSimulationRunner(project);
      
      const femResults = {
        groundResistance: 5,
        voltageField: [100, 80, 60, 40],
        stepVoltageMap: [{ value: 50 }, { value: 60 }],
        touchVoltageMap: [{ value: 70 }, { value: 80 }],
        nodes: [{ x: 0, y: 0, voltage: 100 }],
        elements: [],
        executionTime: 1000,
        iterations: 50
      };
      
      const result = runner.mapResultsToFormat(femResults);
      
      expect(result).toBeDefined();
      expect(result.Rg).toBe(5);
      expect(result.GPR).toBe(100);
      expect(result.Em).toBe(80);
      expect(result.Es).toBe(60);
      expect(result.Etouch70).toBeGreaterThan(0);
      expect(result.Estep70).toBeGreaterThan(0);
      expect(result.touchOk).toBeDefined();
      expect(result.stepOk).toBeDefined();
      expect(result.complies).toBeDefined();
    });

    test('debe lanzar error cuando no hay escenarios', () => {
      const project = {
        soil: { resistivity: 100, surfaceResistivity: 10000, surfaceDepth: 0.2 },
        scenarios: []
      };
      
      const runner = new FEMSimulationRunner(project);
      
      const femResults = {
        groundResistance: 5,
        voltageField: [100, 80],
        stepVoltageMap: [],
        touchVoltageMap: []
      };
      
      expect(() => runner.mapResultsToFormat(femResults)).toThrow('No hay escenarios disponibles en el proyecto');
    });

    test('debe manejar arrays vacios de voltajes', () => {
      const project = {
        soil: { resistivity: 100, surfaceResistivity: 10000, surfaceDepth: 0.2 },
        scenarios: [{ id: 1, duration: 0.35 }]
      };
      
      const runner = new FEMSimulationRunner(project);
      
      const femResults = {
        groundResistance: 5,
        voltageField: [100, 80],
        stepVoltageMap: [],
        touchVoltageMap: []
      };
      
      const result = runner.mapResultsToFormat(femResults);
      
      expect(result.Em).toBe(0);
      expect(result.Es).toBe(0);
    });

    test('debe calcular Cs correctamente', () => {
      const project = {
        soil: { resistivity: 100, surfaceResistivity: 10000, surfaceDepth: 0.2 },
        scenarios: [{ id: 1, duration: 0.35 }]
      };
      
      const runner = new FEMSimulationRunner(project);
      
      const femResults = {
        groundResistance: 5,
        voltageField: [100],
        stepVoltageMap: [],
        touchVoltageMap: []
      };
      
      const result = runner.mapResultsToFormat(femResults);
      
      expect(result.Etouch70).toBeGreaterThan(0);
      expect(result.Estep70).toBeGreaterThan(0);
    });
  });
});
