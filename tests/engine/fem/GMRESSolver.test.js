// tests/engine/fem/GMRESSolver.test.js
import { GMRESSolver } from '../../../src/engine/fem/solver/GMRESSolver.js';

describe('GMRESSolver - FEM Solver', () => {
  
  describe('Constructor', () => {
    test('debe crear solver con opciones por defecto', () => {
      const solver = new GMRESSolver();
      expect(solver.maxIterations).toBe(1000);
      expect(solver.tolerance).toBe(1e-8);
      expect(solver.restart).toBe(50);
      expect(solver.verbose).toBe(false);
    });

    test('debe aceptar opciones personalizadas', () => {
      const solver = new GMRESSolver({
        maxIterations: 500,
        tolerance: 1e-6,
        restart: 30,
        verbose: true
      });
      expect(solver.maxIterations).toBe(500);
      expect(solver.tolerance).toBe(1e-6);
      expect(solver.restart).toBe(30);
      expect(solver.verbose).toBe(true);
    });
  });

  describe('solve', () => {
    test('debe resolver sistema simple 2x2', () => {
      const solver = new GMRESSolver({ maxIterations: 100 });
      
      // Sistema diagonal simple: 2x = 4, 2y = 6
      // Solución: x = 2, y = 3
      const K = {
        multiply: (v) => [2 * v[0], 2 * v[1]]
      };
      const b = [4, 6];
      
      const result = solver.solve(K, b);
      
      expect(result.converged).toBe(true);
    });

    test('debe respetar maxIterations', () => {
      const solver = new GMRESSolver({ maxIterations: 5, tolerance: 1e-6 });
      
      const K = {
        multiply: (x) => [2 * x[0], 2 * x[1], 2 * x[2]]
      };
      const b = [2, 4, 6];
      
      const result = solver.solve(K, b);
      
      expect(result.iterations).toBeLessThanOrEqual(5);
    });

    test('debe retornar información de convergencia', () => {
      const solver = new GMRESSolver({ maxIterations: 100, tolerance: 1e-6 });
      
      const K = {
        multiply: (x) => [2 * x[0], 2 * x[1], 2 * x[2]]
      };
      const b = [2, 4, 6];
      
      const result = solver.solve(K, b);
      
      expect(result.converged).toBeDefined();
      expect(result.residual).toBeDefined();
      expect(result.iterations).toBeDefined();
    });

    test('debe manejar sistema 2x2', () => {
      const solver = new GMRESSolver({ maxIterations: 50, tolerance: 1e-6 });
      
      const K = {
        multiply: (x) => [2 * x[0], 2 * x[1]]
      };
      const b = [2, 4];
      
      const result = solver.solve(K, b);
      
      expect(result).toBeDefined();
      expect(result.solution).toBeDefined();
    });
  });

  describe('computeResidual', () => {
    test('debe calcular residual correctamente', () => {
      const solver = new GMRESSolver();
      
      const K = {
        multiply: (v) => [2 * v[0]]
      };
      const x = [1];
      const b = [2];
      
      const r = solver.computeResidual(K, x, b);
      
      expect(r[0]).toBeCloseTo(0, 10);
    });

    test('debe calcular residual no cero para solución incorrecta', () => {
      const solver = new GMRESSolver();
      
      const K = {
        multiply: (v) => [2 * v[0]]
      };
      const x = [1];
      const b = [5];
      
      const r = solver.computeResidual(K, x, b);
      
      expect(Math.abs(r[0])).toBeGreaterThan(0);
    });
  });

  describe('norm', () => {
    test('debe calcular norma euclidiana', () => {
      const solver = new GMRESSolver();
      
      const v = [3, 4];
      const n = solver.norm(v);
      
      expect(n).toBeCloseTo(5, 10);
    });

    test('debe calcular norma de vector cero', () => {
      const solver = new GMRESSolver();
      
      const v = [0, 0, 0];
      const n = solver.norm(v);
      
      expect(n).toBe(0);
    });
  });

  describe('scale', () => {
    test('debe escalar vector por factor', () => {
      const solver = new GMRESSolver();
      
      const v = [1, 2, 3];
      const scaled = solver.scale(v, 2);
      
      expect(scaled).toEqual([2, 4, 6]);
    });

    test('debe escalar por fracción', () => {
      const solver = new GMRESSolver();
      
      const v = [4, 6];
      const scaled = solver.scale(v, 0.5);
      
      expect(scaled).toEqual([2, 3]);
    });
  });

  describe('dotProduct', () => {
    test('debe calcular producto punto', () => {
      const solver = new GMRESSolver();
      
      const a = [1, 2, 3];
      const b = [4, 5, 6];
      const dot = solver.dotProduct(a, b);
      
      expect(dot).toBe(1*4 + 2*5 + 3*6); // 32
    });

    test('debe calcular producto punto con cero', () => {
      const solver = new GMRESSolver();
      
      const a = [1, 2];
      const b = [0, 0];
      const dot = solver.dotProduct(a, b);
      
      expect(dot).toBe(0);
    });
  });
});
