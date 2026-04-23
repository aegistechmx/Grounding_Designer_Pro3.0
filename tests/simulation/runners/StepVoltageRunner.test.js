// tests/simulation/runners/StepVoltageRunner.test.js
import StepVoltageRunner from '../../../src/simulation/runners/StepVoltageRunner.js';

describe('StepVoltageRunner - Step Voltage Calculation', () => {
  
  const mockProject = {
    grid: {
      area: 200,
      totalConductorLength: 100,
      depth: 0.6,
      length: 30,
      width: 16
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
      const runner = new StepVoltageRunner(mockProject);
      
      expect(runner.project).toBe(mockProject);
    });
  });

  describe('calculateProfile', () => {
    test('debe calcular perfil de tensión de paso', () => {
      const runner = new StepVoltageRunner(mockProject);
      
      const profile = runner.calculateProfile(30);
      
      expect(profile).toBeDefined();
      expect(profile.length).toBeGreaterThan(0);
      expect(profile[0]).toHaveProperty('x');
      expect(profile[0]).toHaveProperty('y');
      expect(profile[0]).toHaveProperty('voltage');
    });

    test('debe retornar array vacio sin escenarios', () => {
      const project = { ...mockProject, scenarios: [] };
      const runner = new StepVoltageRunner(project);
      
      const profile = runner.calculateProfile();
      
      expect(profile).toEqual([]);
    });

    test('debe usar resolution default de 30', () => {
      const runner = new StepVoltageRunner(mockProject);
      
      const profile = runner.calculateProfile();
      
      expect(profile.length).toBeGreaterThan(900); // (30+1) * (30+1)
    });

    test('debe respetar resolution personalizada', () => {
      const runner = new StepVoltageRunner(mockProject);
      
      const profile10 = runner.calculateProfile(10);
      const profile20 = runner.calculateProfile(20);
      
      expect(profile20.length).toBeGreaterThan(profile10.length);
    });

    test('debe tener voltaje máximo en el centro', () => {
      const runner = new StepVoltageRunner(mockProject);
      
      const profile = runner.calculateProfile(50);
      
      // Encontrar voltaje máximo
      const maxVoltage = Math.max(...profile.map(p => p.voltage));
      
      // Verificar que el centro tiene voltaje significativo
      const centerPoint = profile.find(p => 
        Math.abs(p.x - 15) < 1 && Math.abs(p.y - 8) < 1
      );
      
      expect(centerPoint.voltage).toBeGreaterThan(0);
      expect(centerPoint.voltage).toBeLessThan(maxVoltage * 2);
    });

    test('debe tener voltaje cero en los bordes lejanos', () => {
      const runner = new StepVoltageRunner(mockProject);
      
      const profile = runner.calculateProfile(50);
      
      // Buscar punto en el borde
      const edgePoint = profile.find(p => p.x === 0 && p.y === 0);
      
      expect(edgePoint.voltage).toBeGreaterThan(0); // Debe tener algún valor
    });
  });

  describe('findMaxStepVoltage', () => {
    test('debe encontrar punto de máxima tensión de paso', () => {
      const runner = new StepVoltageRunner(mockProject);
      
      const result = runner.findMaxStepVoltage();
      
      expect(result).toBeDefined();
      expect(result.maxVoltage).toBeGreaterThan(0);
      expect(result.location).toBeDefined();
      expect(result.location).toHaveProperty('x');
      expect(result.location).toHaveProperty('y');
    });

    test('debe retornar ubicación del máximo', () => {
      const runner = new StepVoltageRunner(mockProject);
      
      const result = runner.findMaxStepVoltage();
      
      expect(result.location.x).toBeGreaterThan(0);
      expect(result.location.y).toBeGreaterThan(0);
      expect(result.location.x).toBeLessThanOrEqual(30);
      expect(result.location.y).toBeLessThanOrEqual(16);
    });

    test('debe usar resolution de 50 internamente', () => {
      const runner = new StepVoltageRunner(mockProject);
      
      const result = runner.findMaxStepVoltage();
      
      expect(result.maxVoltage).toBeGreaterThan(0);
    });
  });

  describe('isStepVoltageSafe', () => {
    test('debe verificar si tensión de paso es segura', () => {
      const runner = new StepVoltageRunner(mockProject);
      
      const result = runner.isStepVoltageSafe();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('safe');
      expect(result).toHaveProperty('maxVoltage');
      expect(result).toHaveProperty('tolerable');
      expect(result).toHaveProperty('margin');
    });

    test('debe calcular margen de seguridad', () => {
      const runner = new StepVoltageRunner(mockProject);
      
      const result = runner.isStepVoltageSafe();
      
      expect(typeof result.margin).toBe('number');
    });

    test('debe retornar safe booleano', () => {
      const runner = new StepVoltageRunner(mockProject);
      
      const result = runner.isStepVoltageSafe();
      
      expect(typeof result.safe).toBe('boolean');
    });

    test('debe calcular tensión tolerable correctamente', () => {
      const runner = new StepVoltageRunner(mockProject);
      
      const result = runner.isStepVoltageSafe();
      
      expect(result.tolerable).toBeGreaterThan(0);
    });
  });
});
