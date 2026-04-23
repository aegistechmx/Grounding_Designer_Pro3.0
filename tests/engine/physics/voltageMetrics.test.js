// tests/engine/physics/voltageMetrics.test.js
import {
  computeTouchVoltagePhysical,
  computeStepVoltagePhysical,
  computeTouchVoltageAnalytical,
  computeStepVoltageAnalytical,
  generateSurfaceGrid,
  interpolateVoltage,
  generateAnalyticalGrid,
  findCriticalPoints,
  computeTouchVoltageWithOffset,
  computeElectricGradient,
  computeVoltageIsoline
} from '../../../src/engine/physics/voltageMetrics.js';

describe('Voltage Metrics - Physics Calculations', () => {
  
  describe('computeTouchVoltagePhysical', () => {
    test('debe calcular touch voltage para grid simple', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 100 },
        { x: 10, y: 0, voltage: 80 },
        { x: 0, y: 10, voltage: 80 },
        { x: 10, y: 10, voltage: 60 },
        { x: 5, y: 5, voltage: 40 }
      ];
      
      const touchVoltage = computeTouchVoltagePhysical(nodes);
      
      expect(touchVoltage).toBeGreaterThan(0);
      expect(touchVoltage).toBeLessThan(100);
    });

    test('debe usar fallback cuando no hay nodos interiores', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 100 },
        { x: 1, y: 0, voltage: 90 }
      ];
      
      const touchVoltage = computeTouchVoltagePhysical(nodes);
      
      expect(touchVoltage).toBeGreaterThan(0);
    });

    test('debe manejar grid uniforme', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 50 },
        { x: 10, y: 0, voltage: 50 },
        { x: 0, y: 10, voltage: 50 },
        { x: 10, y: 10, voltage: 50 },
        { x: 5, y: 5, voltage: 50 }
      ];
      
      const touchVoltage = computeTouchVoltagePhysical(nodes);
      
      // Para grid uniforme, touch voltage debe ser cercano a 0
      expect(touchVoltage).toBeLessThan(10);
    });
  });

  describe('computeStepVoltagePhysical', () => {
    test('debe calcular step voltage para grid simple', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 100 },
        { x: 1, y: 0, voltage: 50 },
        { x: 2, y: 0, voltage: 0 }
      ];
      
      const stepVoltage = computeStepVoltagePhysical(nodes, 1);
      
      expect(stepVoltage).toBeGreaterThan(0);
      expect(stepVoltage).toBeLessThan(100);
    });

    test('debe usar step distance default de 1m', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 100 },
        { x: 2, y: 0, voltage: 0 }
      ];
      
      const stepVoltage = computeStepVoltagePhysical(nodes);
      
      expect(stepVoltage).toBeGreaterThan(0);
    });

    test('debe escalar con step distance', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 100 },
        { x: 10, y: 0, voltage: 0 }
      ];
      
      const step1 = computeStepVoltagePhysical(nodes, 1);
      const step2 = computeStepVoltagePhysical(nodes, 2);
      
      expect(step2).toBeGreaterThan(step1);
    });

    test('debe retornar 0 para grid uniforme', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 50 },
        { x: 1, y: 0, voltage: 50 },
        { x: 2, y: 0, voltage: 50 }
      ];
      
      const stepVoltage = computeStepVoltagePhysical(nodes, 1);
      
      expect(stepVoltage).toBe(0);
    });
  });

  describe('computeTouchVoltageAnalytical', () => {
    test('debe calcular touch voltage usando formula IEEE 80', () => {
      const gpr = 1000;
      const Km = 0.2;
      
      const touchVoltage = computeTouchVoltageAnalytical(gpr, Km);
      
      expect(touchVoltage).toBe(200);
    });

    test('debe usar Km default de 0.2', () => {
      const gpr = 1000;
      
      const touchVoltage = computeTouchVoltageAnalytical(gpr);
      
      expect(touchVoltage).toBe(200);
    });

    test('debe escalar con GPR', () => {
      const touch1 = computeTouchVoltageAnalytical(1000);
      const touch2 = computeTouchVoltageAnalytical(2000);
      
      expect(touch2).toBe(touch1 * 2);
    });
  });

  describe('computeStepVoltageAnalytical', () => {
    test('debe calcular step voltage usando formula IEEE 80', () => {
      const gpr = 1000;
      const Ks = 0.09;
      
      const stepVoltage = computeStepVoltageAnalytical(gpr, Ks);
      
      expect(stepVoltage).toBe(90);
    });

    test('debe usar Ks default de 0.09', () => {
      const gpr = 1000;
      
      const stepVoltage = computeStepVoltageAnalytical(gpr);
      
      expect(stepVoltage).toBe(90);
    });

    test('debe escalar con GPR', () => {
      const step1 = computeStepVoltageAnalytical(1000);
      const step2 = computeStepVoltageAnalytical(2000);
      
      expect(step2).toBe(step1 * 2);
    });
  });

  describe('generateSurfaceGrid', () => {
    test('debe generar grid de superficie', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 100 },
        { x: 10, y: 0, voltage: 50 },
        { x: 0, y: 10, voltage: 50 },
        { x: 10, y: 10, voltage: 0 }
      ];
      
      const grid = generateSurfaceGrid(nodes, 5);
      
      expect(grid).toBeDefined();
      expect(grid.length).toBeGreaterThan(0);
      expect(grid[0]).toBeDefined();
      expect(grid[0].length).toBeGreaterThan(0);
    });

    test('debe usar resolution default de 1m', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 100 },
        { x: 10, y: 10, voltage: 0 }
      ];
      
      const grid = generateSurfaceGrid(nodes);
      
      expect(grid).toBeDefined();
      expect(grid.length).toBeGreaterThan(10);
    });

    test('debe interpolar voltajes', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 100 },
        { x: 10, y: 10, voltage: 0 }
      ];
      
      const grid = generateSurfaceGrid(nodes, 5);
      
      // Punto cerca del primer nodo debe tener voltage cercano a 100
      expect(grid[0][0].voltage).toBeGreaterThan(50);
      
      // Punto cerca del segundo nodo debe tener voltage cercano a 0
      expect(grid[grid.length - 1][grid[0].length - 1].voltage).toBeLessThan(50);
    });
  });

  describe('generateAnalyticalGrid', () => {
    test('debe generar grid analitico', () => {
      const params = {
        GPR: 1000,
        gridLength: 100,
        gridWidth: 100,
        decayFactor: 20
      };
      
      const grid = generateAnalyticalGrid(params, 50);
      
      expect(grid).toBeDefined();
      expect(grid.length).toBe(50);
      expect(grid[0].length).toBe(50);
    });

    test('debe usar resolution default de 50', () => {
      const params = {
        GPR: 1000,
        gridLength: 100,
        gridWidth: 100
      };
      
      const grid = generateAnalyticalGrid(params);
      
      expect(grid.length).toBe(50);
      expect(grid[0].length).toBe(50);
    });

    test('debe tener maximo en el centro', () => {
      const params = {
        GPR: 1000,
        gridLength: 100,
        gridWidth: 100,
        decayFactor: 20
      };
      
      const grid = generateAnalyticalGrid(params, 50);
      
      const centerVoltage = grid[25][25];
      const edgeVoltage = grid[0][0];
      
      expect(centerVoltage).toBeGreaterThan(edgeVoltage);
    });

    test('debe usar decay factor default de 20', () => {
      const params = {
        GPR: 1000,
        gridLength: 100,
        gridWidth: 100
      };
      
      const grid = generateAnalyticalGrid(params, 50);
      
      expect(grid).toBeDefined();
    });
  });

  describe('findCriticalPoints', () => {
    test('debe encontrar puntos criticos', () => {
      const surfaceGrid = [
        [
          { x: 0, y: 0, voltage: 100 },
          { x: 1, y: 0, voltage: 50 }
        ],
        [
          { x: 0, y: 1, voltage: 50 },
          { x: 1, y: 1, voltage: 0 }
        ]
      ];
      
      const critical = findCriticalPoints(surfaceGrid);
      
      expect(critical).toBeDefined();
      expect(critical.maxTouch).toBeDefined();
      expect(critical.maxStep).toBeDefined();
      expect(critical.maxTouch.value).toBeGreaterThan(0);
    });

    test('maxTouch debe ser el voltage maximo absoluto', () => {
      const surfaceGrid = [
        [
          { x: 0, y: 0, voltage: 100 },
          { x: 1, y: 0, voltage: 50 }
        ]
      ];
      
      const critical = findCriticalPoints(surfaceGrid);
      
      expect(critical.maxTouch.value).toBe(100);
    });

    test('maxStep debe calcular gradientes', () => {
      const surfaceGrid = [
        [
          { x: 0, y: 0, voltage: 100 },
          { x: 1, y: 0, voltage: 0 }
        ]
      ];
      
      const critical = findCriticalPoints(surfaceGrid);
      
      expect(critical.maxStep.value).toBe(100);
    });
  });

  describe('computeTouchVoltageWithOffset', () => {
    test('debe calcular touch voltage con offset', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 100 },
        { x: 1, y: 0, voltage: 0 }
      ];
      
      const touchVoltage = computeTouchVoltageWithOffset(nodes, 1);
      
      expect(touchVoltage).toBeGreaterThan(0);
      expect(touchVoltage).toBeLessThan(1000);
    });

    test('debe usar offset default de 1m', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 100 },
        { x: 2, y: 0, voltage: 0 }
      ];
      
      const touchVoltage = computeTouchVoltageWithOffset(nodes);
      
      expect(touchVoltage).toBeGreaterThan(0);
    });

    test('debe escalar con offset', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 100 },
        { x: 10, y: 0, voltage: 0 }
      ];
      
      const touch1 = computeTouchVoltageWithOffset(nodes, 1);
      const touch2 = computeTouchVoltageWithOffset(nodes, 2);
      
      expect(touch2).toBeGreaterThan(touch1);
    });
  });

  describe('computeElectricGradient', () => {
    test('debe calcular gradiente electrico', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 100 },
        { x: 1, y: 0, voltage: 0 },
        { x: 0, y: 1, voltage: 0 }
      ];
      
      const gradient = computeElectricGradient(nodes, 0.5, 0.5, 0.1);
      
      expect(gradient).toBeDefined();
      expect(gradient.Ex).toBeDefined();
      expect(gradient.Ey).toBeDefined();
      expect(gradient.magnitude).toBeDefined();
    });

    test('debe retornar cero cuando no hay nodos cercanos', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 100 }
      ];
      
      const gradient = computeElectricGradient(nodes, 10, 10, 0.1);
      
      expect(gradient.Ex).toBe(0);
      expect(gradient.Ey).toBe(0);
      expect(gradient.magnitude).toBe(0);
    });

    test('debe usar delta default de 0.1m', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 100 },
        { x: 1, y: 0, voltage: 0 }
      ];
      
      const gradient = computeElectricGradient(nodes, 0.5, 0);
      
      expect(gradient).toBeDefined();
    });

    test('magnitude debe ser sqrt(Ex^2 + Ey^2)', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 100 },
        { x: 1, y: 0, voltage: 0 },
        { x: 0, y: 1, voltage: 0 }
      ];
      
      const gradient = computeElectricGradient(nodes, 0.5, 0.5, 0.1);
      
      const expectedMagnitude = Math.sqrt(gradient.Ex ** 2 + gradient.Ey ** 2);
      
      expect(gradient.magnitude).toBeCloseTo(expectedMagnitude, 10);
    });
  });

  describe('computeVoltageIsoline', () => {
    test('debe encontrar puntos en isoline', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 50 },
        { x: 1, y: 0, voltage: 50 },
        { x: 0, y: 1, voltage: 100 },
        { x: 1, y: 1, voltage: 0 }
      ];
      
      const isoline = computeVoltageIsoline(nodes, 50, 5);
      
      expect(isoline).toBeDefined();
      expect(isoline.length).toBe(2);
      expect(isoline[0]).toHaveProperty('x');
      expect(isoline[0]).toHaveProperty('y');
    });

    test('debe usar tolerance default de 5V', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 50 },
        { x: 1, y: 0, voltage: 53 }
      ];
      
      const isoline = computeVoltageIsoline(nodes, 50);
      
      expect(isoline.length).toBe(2);
    });

    test('debe retornar array vacio cuando no hay nodos en nivel', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 100 },
        { x: 1, y: 0, voltage: 200 }
      ];
      
      const isoline = computeVoltageIsoline(nodes, 50, 5);
      
      expect(isoline).toEqual([]);
    });

    test('debe respetar tolerance', () => {
      const nodes = [
        { x: 0, y: 0, voltage: 50 },
        { x: 1, y: 0, voltage: 60 }
      ];
      
      const isolineStrict = computeVoltageIsoline(nodes, 50, 1);
      const isolineLoose = computeVoltageIsoline(nodes, 50, 15);
      
      expect(isolineLoose.length).toBeGreaterThan(isolineStrict.length);
    });
  });
});
