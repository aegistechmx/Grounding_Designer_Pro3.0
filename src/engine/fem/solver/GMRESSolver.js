// src/engine/fem/solver/GMRESSolver.js
// Solver GMRES (Generalized Minimal Residual) para problemas más difíciles

export class GMRESSolver {
  constructor(options = {}) {
    this.maxIterations = options.maxIterations || 1000;
    this.tolerance = options.tolerance || 1e-8;
    this.restart = options.restart || 50;
    this.verbose = options.verbose || false;
  }

  /**
   * Resuelve K * x = b usando GMRES
   */
  solve(K, b) {
    const startTime = performance.now();
    const n = b.length;
    
    let x = new Array(n).fill(0);
    let r = this.computeResidual(K, x, b);
    let beta = this.norm(r);
    
    if (beta < this.tolerance) {
      return { solution: x, iterations: 0, converged: true };
    }
    
    let iterations = 0;
    let converged = false;
    
    // Vectores de Krylov
    const V = [];
    const H = [];
    const g = [];
    
    while (iterations < this.maxIterations && !converged) {
      // Reiniciar cada 'restart' iteraciones
      const restartIter = Math.min(this.restart, this.maxIterations - iterations);
      
      // Arnoldi iteration
      V.length = 0;
      H.length = 0;
      
      let v = this.scale(r, 1 / beta);
      V.push(v);
      
      for (let j = 0; j < restartIter; j++) {
        // Calcular w = K * v
        let w = K.multiply(V[j]);
        
        // Arnoldi orthogonalization
        const h = new Array(j + 2).fill(0);
        for (let i = 0; i <= j; i++) {
          h[i] = this.dotProduct(w, V[i]);
          w = this.add(w, this.scale(V[i], -h[i]));
        }
        
        h[j + 1] = this.norm(w);
        
        if (h[j + 1] > 1e-12) {
          V.push(this.scale(w, 1 / h[j + 1]));
        }
        
        H.push(h);
        
        // Resolver problema de mínimos cuadrados
        const y = this.solveLeastSquares(H, beta, j + 1);
        
        // Actualizar solución
        x = new Array(n).fill(0);
        for (let i = 0; i <= j; i++) {
          for (let k = 0; k < n; k++) {
            x[k] += y[i] * V[i][k];
          }
        }
        
        // Calcular nuevo residual
        r = this.computeResidual(K, x, b);
        const residualNorm = this.norm(r);
        
        if (this.verbose) {
          console.log(`  Iteración ${iterations + j + 1}: residual = ${residualNorm.toExponential(2)}`);
        }
        
        if (residualNorm < this.tolerance) {
          iterations += j + 1;
          converged = true;
          break;
        }
      }
      
      if (!converged) {
        // Preparar para reinicio
        r = this.computeResidual(K, x, b);
        beta = this.norm(r);
        iterations += restartIter;
      }
    }
    
    const endTime = performance.now();
    
    if (this.verbose) {
      console.log(`✅ GMRES convergió en ${iterations} iteraciones`);
      console.log(`   Tiempo: ${(endTime - startTime).toFixed(2)} ms`);
    }
    
    return {
      solution: x,
      iterations,
      executionTime: endTime - startTime,
      converged
    };
  }

  /**
   * Resuelve sistema de mínimos cuadrados para GMRES
   */
  solveLeastSquares(H, beta, m) {
    // Implementación simplificada - usar rotaciones de Givens
    const y = new Array(m + 1).fill(0);
    const g = new Array(m + 1).fill(0);
    g[0] = beta;
    
    // Copiar H
    const Hcopy = H.map(h => [...h]);
    
    for (let i = 0; i < m; i++) {
      // Rotación de Givens
      const hii = Hcopy[i][i];
      const hip1i = Hcopy[i + 1]?.[i] || 0;
      
      const c = hii / Math.sqrt(hii * hii + hip1i * hip1i);
      const s = hip1i / Math.sqrt(hii * hii + hip1i * hip1i);
      
      // Aplicar rotación
      for (let j = i; j < m + 1; j++) {
        const temp = c * Hcopy[i][j] + s * Hcopy[i + 1]?.[j] || 0;
        Hcopy[i + 1][j] = -s * Hcopy[i][j] + c * Hcopy[i + 1]?.[j] || 0;
        Hcopy[i][j] = temp;
      }
      
      const temp = c * g[i] + s * g[i + 1];
      g[i + 1] = -s * g[i] + c * g[i + 1];
      g[i] = temp;
    }
    
    // Back substitution
    for (let i = m - 1; i >= 0; i--) {
      let sum = 0;
      for (let j = i + 1; j < m; j++) {
        sum += Hcopy[i][j] * y[j];
      }
      y[i] = (g[i] - sum) / Hcopy[i][i];
    }
    
    return y;
  }

  /**
   * Calcula residual r = b - K*x
   */
  computeResidual(K, x, b) {
    const Kx = K.multiply(x);
    const r = new Array(b.length);
    
    for (let i = 0; i < b.length; i++) {
      r[i] = b[i] - Kx[i];
    }
    
    return r;
  }

  /**
   * Producto punto
   */
  dotProduct(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }
    return sum;
  }

  /**
   * Norma euclidiana
   */
  norm(v) {
    return Math.sqrt(this.dotProduct(v, v));
  }

  /**
   * Escala vector
   */
  scale(v, factor) {
    return v.map(x => x * factor);
  }

  /**
   * Suma vectores
   */
  add(a, b) {
    return a.map((x, i) => x + b[i]);
  }
}

export default GMRESSolver;
