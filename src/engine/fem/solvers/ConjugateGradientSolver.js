// src/engine/fem/solvers/ConjugateGradientSolver.js
// Solver iterativo para sistemas lineales grandes

export class ConjugateGradientSolver {
  constructor(options = {}) {
    this.maxIterations = options.maxIterations || 1000;
    this.tolerance = options.tolerance || 1e-8;
    this.preconditioner = options.preconditioner || 'diagonal';
  }

  /**
   * Resuelve K * x = F usando método de gradiente conjugado
   */
  solve(K, F, n) {
    const startTime = performance.now();
    
    // Inicializar solución
    let x = new Array(n).fill(0);
    
    // Calcular residual inicial r = F - K*x
    let r = this.computeResidual(K, x, F, n);
    
    // Dirección inicial p = r
    let p = [...r];
    
    // Aplicar preconditioner si está disponible
    if (this.preconditioner !== 'none') {
      this.applyPreconditioner(r, p);
    }
    
    let residualNorm = this.norm(r);
    const initialResidual = residualNorm;
    
    let iterations = 0;
    
    for (iterations = 0; iterations < this.maxIterations; iterations++) {
      // Calcular K * p
      const Kp = this.matrixVectorProduct(K, p, n);
      
      // Calcular alpha = (r·r) / (p·Kp)
      const rDotR = this.dotProduct(r, r);
      const pDotKp = this.dotProduct(p, Kp);
      
      if (Math.abs(pDotKp) < 1e-12) break;
      
      const alpha = rDotR / pDotKp;
      
      // Actualizar solución: x = x + alpha * p
      for (let i = 0; i < n; i++) {
        x[i] += alpha * p[i];
      }
      
      // Actualizar residual: r = r - alpha * Kp
      for (let i = 0; i < n; i++) {
        r[i] -= alpha * Kp[i];
      }
      
      // Calcular nueva norma del residual
      const newResidualNorm = this.norm(r);
      
      // Verificar convergencia
      if (newResidualNorm / initialResidual < this.tolerance) {
        break;
      }
      
      // Calcular beta = (r_new·r_new) / (r_old·r_old)
      const newRDotR = this.dotProduct(r, r);
      const beta = newRDotR / rDotR;
      
      // Actualizar dirección: p = r + beta * p
      for (let i = 0; i < n; i++) {
        p[i] = r[i] + beta * p[i];
      }
      
      residualNorm = newResidualNorm;
    }
    
    const endTime = performance.now();
    
    return {
      solution: x,
      iterations,
      residual: residualNorm / initialResidual,
      executionTime: endTime - startTime,
      converged: residualNorm / initialResidual < this.tolerance
    };
  }

  /**
   * Producto matriz-vector para matriz CSR
   */
  matrixVectorProduct(K, v, n) {
    const result = new Array(n).fill(0);
    
    for (let i = 0; i < n; i++) {
      const start = K.rowPointers[i];
      const end = K.rowPointers[i + 1];
      
      let sum = 0;
      for (let j = start; j < end; j++) {
        const col = K.colIndices[j];
        sum += K.values[j] * v[col];
      }
      result[i] = sum;
    }
    
    return result;
  }

  /**
   * Calcula residual r = F - K*x
   */
  computeResidual(K, x, F, n) {
    const Kx = this.matrixVectorProduct(K, x, n);
    const r = new Array(n);
    
    for (let i = 0; i < n; i++) {
      r[i] = F[i] - Kx[i];
    }
    
    return r;
  }

  /**
   * Aplica preconditionador diagonal
   */
  applyPreconditioner(r, p) {
    // Preconditionador diagonal simple: M = diag(K)
    // Para simplificar, usamos un factor constante
    const factor = 1.0;
    
    for (let i = 0; i < r.length; i++) {
      p[i] = r[i] * factor;
    }
  }

  /**
   * Producto punto de dos vectores
   */
  dotProduct(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }
    return sum;
  }

  /**
   * Norma euclidiana de un vector
   */
  norm(v) {
    return Math.sqrt(this.dotProduct(v, v));
  }
}

export default ConjugateGradientSolver;
