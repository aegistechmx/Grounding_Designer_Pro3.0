// src/engine/fem/core/SparseMatrix.js
// Matriz dispersa industrial (CSR + CRS)

export class SparseMatrix {
  constructor(n) {
    this.n = n;
    this.values = [];     // Valores no cero
    this.colIndices = []; // Índices de columna
    this.rowPointers = new Array(n + 1).fill(0);
    this.nnz = 0;         // Número de elementos no cero
  }

  /**
   * Agrega valor a la matriz
   */
  add(i, j, value) {
    if (Math.abs(value) < 1e-12) return;
    
    // Buscar si ya existe
    const start = this.rowPointers[i];
    const end = this.rowPointers[i + 1];
    
    for (let k = start; k < end; k++) {
      if (this.colIndices[k] === j) {
        this.values[k] += value;
        return;
      }
    }
    
    // Insertar nuevo elemento (mantener orden)
    let insertPos = start;
    while (insertPos < end && this.colIndices[insertPos] < j) {
      insertPos++;
    }
    
    this.colIndices.splice(insertPos, 0, j);
    this.values.splice(insertPos, 0, value);
    
    // Actualizar rowPointers
    for (let row = i + 1; row <= this.n; row++) {
      this.rowPointers[row]++;
    }
    
    this.nnz++;
  }

  /**
   * Obtiene valor en posición (i, j)
   */
  get(i, j) {
    const start = this.rowPointers[i];
    const end = this.rowPointers[i + 1];
    
    for (let k = start; k < end; k++) {
      if (this.colIndices[k] === j) {
        return this.values[k];
      }
    }
    
    return 0;
  }

  /**
   * Multiplica matriz por vector
   */
  multiply(vector) {
    const result = new Array(this.n).fill(0);
    
    for (let i = 0; i < this.n; i++) {
      const start = this.rowPointers[i];
      const end = this.rowPointers[i + 1];
      
      let sum = 0;
      for (let k = start; k < end; k++) {
        sum += this.values[k] * vector[this.colIndices[k]];
      }
      result[i] = sum;
    }
    
    return result;
  }

  /**
   * Aplica condición Dirichlet
   */
  applyDirichlet(nodeId, value) {
    // Modificar fila
    const start = this.rowPointers[nodeId];
    const end = this.rowPointers[nodeId + 1];
    
    for (let k = start; k < end; k++) {
      if (this.colIndices[k] === nodeId) {
        this.values[k] = 1;
      } else {
        this.values[k] = 0;
      }
    }
    
    // Modificar columna
    for (let i = 0; i < this.n; i++) {
      if (i !== nodeId) {
        const val = this.get(i, nodeId);
        if (val !== 0) {
          this.add(i, nodeId, -val);
        }
      }
    }
    
    return value;
  }

  /**
   * Convierte a formato denso (solo para depuración)
   */
  toDense() {
    const dense = Array(this.n).fill().map(() => Array(this.n).fill(0));
    
    for (let i = 0; i < this.n; i++) {
      const start = this.rowPointers[i];
      const end = this.rowPointers[i + 1];
      
      for (let k = start; k < end; k++) {
        dense[i][this.colIndices[k]] = this.values[k];
      }
    }
    
    return dense;
  }

  /**
   * Obtiene norma de Frobenius
   */
  norm() {
    let sum = 0;
    for (const val of this.values) {
      sum += val * val;
    }
    return Math.sqrt(sum);
  }
}

export default SparseMatrix;
