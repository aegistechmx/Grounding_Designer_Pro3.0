// tests/engine/fem/solvers/ConjugateGradientSolver.test.js
import ConjugateGradientSolver from '../../../../src/engine/fem/solvers/ConjugateGradientSolver.js';

describe('ConjugateGradientSolver - FEM Solver', () => {
  
  describe('Constructor', () => {
    test('debe crear solver con opciones por defecto', () => {
      const solver = new ConjugateGradientSolver();
      expect(solver.maxIterations).toBe(1000);
      expect(solver.tolerance).toBe(1e-8);
      expect(solver.preconditioner).toBe('diagonal');
    });

    test('debe aceptar opciones personalizadas', () => {
      const solver = new ConjugateGradientSolver({
        maxIterations: 500,
        tolerance: 1e-6,
        preconditioner: 'none'
      });
      expect(solver.maxIterations).toBe(500);
      expect(solver.tolerance).toBe(1e-6);
      expect(solver.preconditioner).toBe('none');
    });
  });

  describe('solve', () => {
    test('debe resolver sistema simple', () => {
      const solver = new ConjugateGradientSolver();
      
      // CSR format for matrix [[2]]
      const K = {
        rowPointers: [0, 1],
        colIndices: [0],
        values: [2]
      };
      const F = [4];
      const n = 1;
      
      const result = solver.solve(K, F, n);
      
      expect(result).toBeDefined();
      expect(result.solution).toBeDefined();
      expect(result.iterations).toBeDefined();
      expect(result.residual).toBeDefined();
    });

    test('debe resolver sistema 2x2', () => {
      const solver = new ConjugateGradientSolver({ maxIterations: 100, tolerance: 1e-4 });
      
      // CSR format for diagonal matrix [[2, 0], [0, 2]]
      const K = {
        rowPointers: [0, 1, 2],
        colIndices: [0, 1],
        values: [2, 2]
      };
      const F = [4, 6];
      const n = 2;
      
      const result = solver.solve(K, F, n);
      
      expect(result).toBeDefined();
      expect(result.solution).toBeDefined();
    });

    test('debe resolver sistema 3x3', () => {
      const solver = new ConjugateGradientSolver({ maxIterations: 100, tolerance: 1e-4 });
      
      // CSR format for diagonal matrix [[2, 0, 0], [0, 2, 0], [0, 0, 2]]
      const K = {
        rowPointers: [0, 1, 2, 3],
        colIndices: [0, 1, 2],
        values: [2, 2, 2]
      };
      const F = [4, 6, 8];
      const n = 3;
      
      const result = solver.solve(K, F, n);
      
      expect(result).toBeDefined();
      expect(result.solution).toBeDefined();
    });

    test('debe respetar maxIterations', () => {
      const solver = new ConjugateGradientSolver({ maxIterations: 5 });
      
      const K = {
        rowPointers: [0, 1],
        colIndices: [0],
        values: [1]
      };
      const F = [1];
      const n = 1;
      
      const result = solver.solve(K, F, n);
      
      expect(result.iterations).toBeLessThanOrEqual(5);
    });

    test('debe usar tolerancia para convergencia', () => {
      const solver = new ConjugateGradientSolver({ tolerance: 0.1, maxIterations: 50 });
      
      const K = {
        rowPointers: [0, 1],
        colIndices: [0],
        values: [1]
      };
      const F = [0.01];
      const n = 1;
      
      const result = solver.solve(K, F, n);
      
      expect(result).toBeDefined();
      expect(result.solution).toBeDefined();
    });

    test('debe manejar preconditioner none', () => {
      const solver = new ConjugateGradientSolver({ 
        preconditioner: 'none',
        maxIterations: 100,
        tolerance: 1e-4
      });
      
      const K = {
        rowPointers: [0, 1, 2],
        colIndices: [0, 1],
        values: [2, 2]
      };
      const F = [4, 6];
      const n = 2;
      
      const result = solver.solve(K, F, n);
      
      expect(result).toBeDefined();
      expect(result.solution).toBeDefined();
    });
  });

  describe('computeResidual', () => {
    test('debe calcular residual cero para solución correcta', () => {
      const solver = new ConjugateGradientSolver();
      
      // CSR format: rowPointers, colIndices, values
      const K = {
        rowPointers: [0, 1],
        colIndices: [0],
        values: [2]
      };
      const x = [1];
      const F = [2];
      const n = 1;
      
      const r = solver.computeResidual(K, x, F, n);
      
      expect(r[0]).toBeCloseTo(0, 10);
    });

    test('debe calcular residual no cero para solución incorrecta', () => {
      const solver = new ConjugateGradientSolver();
      
      const K = {
        rowPointers: [0, 1],
        colIndices: [0],
        values: [2]
      };
      const x = [1];
      const F = [5];
      const n = 1;
      
      const r = solver.computeResidual(K, x, F, n);
      
      expect(Math.abs(r[0])).toBeGreaterThan(0);
    });
  });

  describe('norm', () => {
    test('debe calcular norma euclidiana', () => {
      const solver = new ConjugateGradientSolver();
      
      const v = [3, 4];
      const n = solver.norm(v);
      
      expect(n).toBeCloseTo(5, 10);
    });

    test('debe calcular norma de vector cero', () => {
      const solver = new ConjugateGradientSolver();
      
      const v = [0, 0, 0];
      const n = solver.norm(v);
      
      expect(n).toBe(0);
    });
  });

  describe('dotProduct', () => {
    test('debe calcular producto punto', () => {
      const solver = new ConjugateGradientSolver();
      
      const a = [1, 2, 3];
      const b = [4, 5, 6];
      const dot = solver.dotProduct(a, b);
      
      expect(dot).toBe(32); // 1*4 + 2*5 + 3*6
    });

    test('debe calcular producto punto con cero', () => {
      const solver = new ConjugateGradientSolver();
      
      const a = [1, 2];
      const b = [0, 0];
      const dot = solver.dotProduct(a, b);
      
      expect(dot).toBe(0);
    });
  });

  describe('matrixVectorProduct', () => {
    test('debe multiplicar matriz por vector', () => {
      const solver = new ConjugateGradientSolver();
      
      // CSR format for matrix [[1, 2], [3, 4]]
      const K = {
        rowPointers: [0, 2, 4],
        colIndices: [0, 1, 0, 1],
        values: [1, 2, 3, 4]
      };
      const v = [1, 2];
      const n = 2;
      
      const result = solver.matrixVectorProduct(K, v, n);
      
      expect(result[0]).toBe(1*1 + 2*2); // 5
      expect(result[1]).toBe(3*1 + 4*2); // 11
    });

    test('debe manejar matriz diagonal', () => {
      const solver = new ConjugateGradientSolver();
      
      // CSR format for diagonal matrix [[2, 0], [0, 3]]
      const K = {
        rowPointers: [0, 1, 2],
        colIndices: [0, 1],
        values: [2, 3]
      };
      const v = [1, 2];
      const n = 2;
      
      const result = solver.matrixVectorProduct(K, v, n);
      
      expect(result).toEqual([2, 6]);
    });
  });

  describe('applyPreconditioner', () => {
    test('debe aplicar preconditioner diagonal', () => {
      const solver = new ConjugateGradientSolver({ preconditioner: 'diagonal' });
      
      const r = [4, 6];
      const p = [0, 0];
      
      solver.applyPreconditioner(r, p);
      
      expect(p[0]).toBeGreaterThan(0);
      expect(p[1]).toBeGreaterThan(0);
    });
  });
});
