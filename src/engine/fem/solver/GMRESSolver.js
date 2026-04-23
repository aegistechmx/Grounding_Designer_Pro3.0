// src/engine/fem/solver/GMRESSolver.js
// GMRES (Generalized Minimal Residual) solver for difficult linear systems

const DEFAULT_MAX_ITERATIONS = 1000;
const DEFAULT_TOLERANCE = 1e-8;
const DEFAULT_RESTART = 50;
const EPSILON = 1e-12;

export class GMRESSolver {
  constructor(options = {}) {
    this.maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;
    this.tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
    this.restart = options.restart ?? DEFAULT_RESTART;
    this.verbose = options.verbose ?? false;
  }

  /**
   * Solves K * x = b using GMRES algorithm
   * @param {Object} K - Matrix with multiply method
   * @param {Array} b - Right-hand side vector
   * @returns {Object} Solution with solution, iterations, executionTime, converged, residual
   */
  solve(K, b) {
    const startTime = performance.now();
    const vectorSize = b.length;
    
    let solution = new Array(vectorSize).fill(0);
    let residual = this.computeResidual(K, solution, b);
    let residualNorm = this.norm(residual);
    
    if (residualNorm < this.tolerance) {
      return this.buildResult(solution, 0, startTime, true, residualNorm);
    }
    
    let totalIterations = 0;
    let hasConverged = false;
    
    // Krylov subspace vectors
    const krylovVectors = [];
    const hessenbergMatrix = [];
    
    while (totalIterations < this.maxIterations && !hasConverged) {
      const restartIterations = Math.min(this.restart, this.maxIterations - totalIterations);
      
      // Arnoldi iteration
      krylovVectors.length = 0;
      hessenbergMatrix.length = 0;
      
      let normalizedVector = this.scale(residual, 1 / residualNorm);
      krylovVectors.push(normalizedVector);
      
      for (let iteration = 0; iteration < restartIterations; iteration++) {
        // Compute w = K * v
        let ArnoldiVector = K.multiply(krylovVectors[iteration]);
        
        // Arnoldi orthogonalization
        const hessenbergRow = new Array(iteration + 2).fill(0);
        for (let i = 0; i <= iteration; i++) {
          hessenbergRow[i] = this.dotProduct(ArnoldiVector, krylovVectors[i]);
          ArnoldiVector = this.add(ArnoldiVector, this.scale(krylovVectors[i], -hessenbergRow[i]));
        }
        
        hessenbergRow[iteration + 1] = this.norm(ArnoldiVector);
        
        if (hessenbergRow[iteration + 1] > EPSILON) {
          krylovVectors.push(this.scale(ArnoldiVector, 1 / hessenbergRow[iteration + 1]));
        }
        
        hessenbergMatrix.push(hessenbergRow);
        
        // Solve least squares problem
        const coefficients = this.solveLeastSquares(hessenbergMatrix, residualNorm, iteration + 1);
        
        // Update solution
        solution = new Array(vectorSize).fill(0);
        for (let i = 0; i <= iteration; i++) {
          for (let k = 0; k < vectorSize; k++) {
            solution[k] += coefficients[i] * krylovVectors[i][k];
          }
        }
        
        // Compute new residual
        residual = this.computeResidual(K, solution, b);
        residualNorm = this.norm(residual);
        
        if (this.verbose) {
          console.log(`  Iteration ${totalIterations + iteration + 1}: residual = ${residualNorm.toExponential(2)}`);
        }
        
        if (residualNorm < this.tolerance) {
          totalIterations += iteration + 1;
          hasConverged = true;
          break;
        }
      }
      
      if (!hasConverged) {
        // Prepare for restart
        residual = this.computeResidual(K, solution, b);
        residualNorm = this.norm(residual);
        totalIterations += restartIterations;
      }
    }
    
    const endTime = performance.now();
    
    if (this.verbose) {
      console.log(`✅ GMRES converged in ${totalIterations} iterations`);
      console.log(`   Time: ${(endTime - startTime).toFixed(2)} ms`);
    }
    
    // Compute final residual
    const finalResidual = this.computeResidual(K, solution, b);
    const finalResidualNorm = this.norm(finalResidual);
    
    return this.buildResult(solution, totalIterations, startTime, hasConverged, finalResidualNorm);
  }

  /**
   * Builds result object
   */
  buildResult(solution, iterations, startTime, converged, residualNorm) {
    const endTime = performance.now();
    return {
      solution,
      iterations,
      executionTime: endTime - startTime,
      converged,
      residual: residualNorm
    };
  }

  /**
   * Solves least squares problem using Givens rotations
   * @param {Array} hessenbergMatrix - Upper Hessenberg matrix
   * @param {number} beta - Initial residual norm
   * @param {number} matrixSize - Size of the matrix
   * @returns {Array} Solution vector
   */
  solveLeastSquares(hessenbergMatrix, beta, matrixSize) {
    const solution = new Array(matrixSize + 1).fill(0);
    const givensVector = new Array(matrixSize + 1).fill(0);
    givensVector[0] = beta;
    
    // Copy Hessenberg matrix
    const matrixCopy = hessenbergMatrix.map(row => [...row]);
    
    for (let i = 0; i < matrixSize; i++) {
      // Givens rotation
      const diagonalElement = matrixCopy[i][i];
      const subDiagonalElement = matrixCopy[i + 1]?.[i] || 0;
      
      const rotationDenominator = Math.sqrt(diagonalElement * diagonalElement + subDiagonalElement * subDiagonalElement);
      
      // Handle degenerate case to prevent division by zero
      const cosine = rotationDenominator < EPSILON ? 1 : diagonalElement / rotationDenominator;
      const sine = rotationDenominator < EPSILON ? 0 : subDiagonalElement / rotationDenominator;
      
      // Apply rotation
      for (let j = i; j < matrixSize + 1; j++) {
        const temp = cosine * matrixCopy[i][j] + sine * (matrixCopy[i + 1]?.[j] || 0);
        if (matrixCopy[i + 1]) {
          matrixCopy[i + 1][j] = -sine * matrixCopy[i][j] + cosine * (matrixCopy[i + 1]?.[j] || 0);
        }
        matrixCopy[i][j] = temp;
      }
      
      const temp = cosine * givensVector[i] + sine * givensVector[i + 1];
      givensVector[i + 1] = -sine * givensVector[i] + cosine * givensVector[i + 1];
      givensVector[i] = temp;
    }
    
    // Back substitution
    for (let i = matrixSize - 1; i >= 0; i--) {
      let sum = 0;
      for (let j = i + 1; j < matrixSize; j++) {
        sum += matrixCopy[i][j] * solution[j];
      }
      
      // Handle potential division by zero
      const diagonalValue = matrixCopy[i][i];
      solution[i] = Math.abs(diagonalValue) < EPSILON ? 0 : (givensVector[i] - sum) / diagonalValue;
    }
    
    return solution;
  }

  /**
   * Computes residual r = b - K*x
   * @param {Object} K - Matrix with multiply method
   * @param {Array} x - Solution vector
   * @param {Array} b - Right-hand side vector
   * @returns {Array} Residual vector
   */
  computeResidual(K, x, b) {
    const Kx = K.multiply(x);
    return b.map((value, index) => value - Kx[index]);
  }

  /**
   * Computes dot product of two vectors
   * @param {Array} vectorA - First vector
   * @param {Array} vectorB - Second vector
   * @returns {number} Dot product
   */
  dotProduct(vectorA, vectorB) {
    return vectorA.reduce((sum, value, index) => sum + value * vectorB[index], 0);
  }

  /**
   * Computes Euclidean norm of a vector
   * @param {Array} vector - Input vector
   * @returns {number} Euclidean norm
   */
  norm(vector) {
    return Math.sqrt(this.dotProduct(vector, vector));
  }

  /**
   * Scales a vector by a factor
   * @param {Array} vector - Input vector
   * @param {number} factor - Scaling factor
   * @returns {Array} Scaled vector
   */
  scale(vector, factor) {
    return vector.map(value => value * factor);
  }

  /**
   * Adds two vectors element-wise
   * @param {Array} vectorA - First vector
   * @param {Array} vectorB - Second vector
   * @returns {Array} Sum of vectors
   */
  add(vectorA, vectorB) {
    return vectorA.map((value, index) => value + vectorB[index]);
  }
}

export default GMRESSolver;
