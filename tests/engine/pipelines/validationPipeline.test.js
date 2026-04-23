// tests/engine/pipelines/validationPipeline.test.js
import { validationPipeline } from '../../../src/engine/pipelines/validationPipeline.js';

describe('validationPipeline - Cross-validation between analytical and discrete methods', () => {
  
  describe('Input validation', () => {
    test('debe lanzar error sin resultados analíticos', () => {
      const discrete = {
        grid: { resistance: 5 },
        fault: { gpr: 100, stepVoltage: 50, touchVoltage: 70 }
      };
      
      expect(() => validationPipeline({ analytical: null, discrete })).toThrow(
        'Validation requires both analytical and discrete results'
      );
    });

    test('debe lanzar error sin resultados discretos', () => {
      const analytical = {
        grid: { resistance: 5 },
        fault: { gpr: 100, stepVoltage: 50, touchVoltage: 70 }
      };
      
      expect(() => validationPipeline({ analytical, discrete: null })).toThrow(
        'Validation requires both analytical and discrete results'
      );
    });

    test('debe lanzar error sin ninguno de los dos', () => {
      expect(() => validationPipeline({ analytical: null, discrete: null })).toThrow(
        'Validation requires both analytical and discrete results'
      );
    });
  });

  describe('Basic consistency checks', () => {
    test('debe detectar touch < step en analítico', () => {
      const analytical = {
        grid: { resistance: 5 },
        fault: { gpr: 100, stepVoltage: 70, touchVoltage: 50 }
      };
      const discrete = {
        grid: { resistance: 5 },
        fault: { gpr: 100, stepVoltage: 50, touchVoltage: 70 }
      };
      
      const result = validationPipeline({ analytical, discrete });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Analytical: touch voltage < step voltage');
    });

    test('debe detectar touch < step en discreto', () => {
      const analytical = {
        grid: { resistance: 5 },
        fault: { gpr: 100, stepVoltage: 50, touchVoltage: 70 }
      };
      const discrete = {
        grid: { resistance: 5 },
        fault: { gpr: 100, stepVoltage: 70, touchVoltage: 50 }
      };
      
      const result = validationPipeline({ analytical, discrete });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Discrete: touch voltage < step voltage');
    });

    test('debe detectar ambos errores de consistencia', () => {
      const analytical = {
        grid: { resistance: 5 },
        fault: { gpr: 100, stepVoltage: 70, touchVoltage: 50 }
      };
      const discrete = {
        grid: { resistance: 5 },
        fault: { gpr: 100, stepVoltage: 70, touchVoltage: 50 }
      };
      
      const result = validationPipeline({ analytical, discrete });
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
      expect(result.errors).toContain('Analytical: touch voltage < step voltage');
      expect(result.errors).toContain('Discrete: touch voltage < step voltage');
    });

    test('debe pasar consistencia básica cuando touch > step', () => {
      const analytical = {
        grid: { resistance: 5 },
        fault: { gpr: 100, stepVoltage: 50, touchVoltage: 70 }
      };
      const discrete = {
        grid: { resistance: 5 },
        fault: { gpr: 100, stepVoltage: 50, touchVoltage: 70 }
      };
      
      const result = validationPipeline({ analytical, discrete });
      
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Difference calculations', () => {
    test('debe calcular diferencias porcentuales', () => {
      const analytical = {
        grid: { resistance: 5 },
        fault: { gpr: 100, stepVoltage: 50, touchVoltage: 70 }
      };
      const discrete = {
        grid: { resistance: 5.5 },
        fault: { gpr: 105, stepVoltage: 52, touchVoltage: 72 }
      };
      
      const result = validationPipeline({ analytical, discrete });
      
      expect(result.diff).toBeDefined();
      expect(result.diff.gridResistance).toBeGreaterThan(0);
      expect(result.diff.gpr).toBeGreaterThan(0);
      expect(result.diff.stepVoltage).toBeGreaterThan(0);
      expect(result.diff.touchVoltage).toBeGreaterThan(0);
    });

    test('debe retornar null cuando un valor es 0', () => {
      const analytical = {
        grid: { resistance: 0 },
        fault: { gpr: 100, stepVoltage: 50, touchVoltage: 70 }
      };
      const discrete = {
        grid: { resistance: 5 },
        fault: { gpr: 100, stepVoltage: 50, touchVoltage: 70 }
      };
      
      const result = validationPipeline({ analytical, discrete });
      
      expect(result.diff.gridResistance).toBeNull();
    });

    test('debe retornar null cuando ambos valores son 0', () => {
      const analytical = {
        grid: { resistance: 0 },
        fault: { gpr: 100, stepVoltage: 50, touchVoltage: 70 }
      };
      const discrete = {
        grid: { resistance: 0 },
        fault: { gpr: 100, stepVoltage: 50, touchVoltage: 70 }
      };
      
      const result = validationPipeline({ analytical, discrete });
      
      expect(result.diff.gridResistance).toBeNull();
    });

    test('debe retornar 0 cuando valores son idénticos', () => {
      const analytical = {
        grid: { resistance: 5 },
        fault: { gpr: 100, stepVoltage: 50, touchVoltage: 70 }
      };
      const discrete = {
        grid: { resistance: 5 },
        fault: { gpr: 100, stepVoltage: 50, touchVoltage: 70 }
      };
      
      const result = validationPipeline({ analytical, discrete });
      
      expect(result.diff.gridResistance).toBe(0);
      expect(result.diff.gpr).toBe(0);
      expect(result.diff.stepVoltage).toBe(0);
      expect(result.diff.touchVoltage).toBe(0);
    });

    test('debe calcular diferencia porcentual correctamente', () => {
      const analytical = {
        grid: { resistance: 100 },
        fault: { gpr: 100, stepVoltage: 50, touchVoltage: 70 }
      };
      const discrete = {
        grid: { resistance: 120 },
        fault: { gpr: 100, stepVoltage: 50, touchVoltage: 70 }
      };
      
      const result = validationPipeline({ analytical, discrete });
      
      // |100 - 120| / ((100 + 120) / 2) * 100 = 20 / 110 * 100 ≈ 18.18%
      expect(result.diff.gridResistance).toBeCloseTo(18.18, 1);
    });
  });

  describe('Result structure', () => {
    test('debe retornar estructura correcta', () => {
      const analytical = {
        grid: { resistance: 5 },
        fault: { gpr: 100, stepVoltage: 50, touchVoltage: 70 }
      };
      const discrete = {
        grid: { resistance: 5 },
        fault: { gpr: 100, stepVoltage: 50, touchVoltage: 70 }
      };
      
      const result = validationPipeline({ analytical, discrete });
      
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('diff');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
});
