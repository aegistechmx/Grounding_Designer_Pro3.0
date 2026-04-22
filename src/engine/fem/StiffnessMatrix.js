// src/engine/fem/StiffnessMatrix.js
// Cálculo de matrices de rigidez para elementos triangulares

export class StiffnessMatrixAssembler {
  constructor() {
    this.K = null;
    this.nNodes = 0;
  }

  /**
   * Inicializa matriz global sparse
   */
  initialize(nNodes) {
    this.nNodes = nNodes;
    // Usar formato CSR (Compressed Sparse Row) para eficiencia
    this.K = {
      values: [],
      colIndices: [],
      rowPointers: new Array(nNodes + 1).fill(0)
    };
    return this.K;
  }

  /**
   * Calcula matriz de rigidez para un elemento triangular
   */
  computeElementMatrix(n1, n2, n3, conductivity) {
    // Coordenadas de los nodos
    const x1 = n1.x, y1 = n1.y;
    const x2 = n2.x, y2 = n2.y;
    const x3 = n3.x, y3 = n3.y;
    
    // Área del triángulo
    const area = this.triangleArea(x1, y1, x2, y2, x3, y3);
    
    // Matriz de gradientes B (2x3)
    const B = this.computeGradientMatrix(x1, y1, x2, y2, x3, y3, area);
    
    // Ke = σ * A * (B^T * B)
    const BtB = this.multiplyMatricesTransposed(B);
    const Ke = this.multiplyScalar(BtB, conductivity * area);
    
    return Ke;
  }

  /**
   * Calcula matriz de gradientes B para elemento triangular
   */
  computeGradientMatrix(x1, y1, x2, y2, x3, y3, area) {
    const areaSafe = Math.max(1e-10, area);
    
    // Coeficientes de las funciones de forma
    const a1 = x2*y3 - x3*y2;
    const a2 = x3*y1 - x1*y3;
    const a3 = x1*y2 - x2*y1;
    
    const b1 = y2 - y3;
    const b2 = y3 - y1;
    const b3 = y1 - y2;
    
    const c1 = x3 - x2;
    const c2 = x1 - x3;
    const c3 = x2 - x1;
    
    const twoA = 2 * areaSafe;
    
    // Matriz B (2x3)
    return [
      [b1 / twoA, b2 / twoA, b3 / twoA],
      [c1 / twoA, c2 / twoA, c3 / twoA]
    ];
  }

  /**
   * Calcula B^T * B
   */
  multiplyMatricesTransposed(B) {
    const Ke = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        Ke[i][j] = B[0][i] * B[0][j] + B[1][i] * B[1][j];
      }
    }
    
    return Ke;
  }

  /**
   * Multiplica matriz por escalar
   */
  multiplyScalar(matrix, scalar) {
    const result = [[0,0,0], [0,0,0], [0,0,0]];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        result[i][j] = matrix[i][j] * scalar;
      }
    }
    return result;
  }

  /**
   * Agrega matriz elemental a la matriz global
   */
  addToGlobalMatrix(Ke, nodeIndices) {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const row = nodeIndices[i];
        const col = nodeIndices[j];
        const value = Ke[i][j];
        
        this.addToSparseMatrix(row, col, value);
      }
    }
  }

  /**
   * Agrega valor a matriz sparse CSR
   */
  addToSparseMatrix(row, col, value) {
    if (!this.K || !this.K.rowPointers) return;
    
    // Buscar si ya existe entrada
    const start = this.K.rowPointers[row];
    const end = this.K.rowPointers[row + 1];
    
    for (let i = start; i < end; i++) {
      if (this.K.colIndices[i] === col) {
        this.K.values[i] += value;
        return;
      }
    }
    
    // Insertar nueva entrada (mantener orden)
    let insertPos = start;
    while (insertPos < end && this.K.colIndices[insertPos] < col) {
      insertPos++;
    }
    
    this.K.colIndices.splice(insertPos, 0, col);
    this.K.values.splice(insertPos, 0, value);
    
    // Actualizar rowPointers
    for (let i = row + 1; i <= this.nNodes; i++) {
      this.K.rowPointers[i]++;
    }
  }

  /**
   * Aplica condiciones de borde (Dirichlet)
   */
  applyBoundaryConditions(F, boundaryNodes, groundPotential = 0) {
    for (const nodeId of boundaryNodes) {
      // Fijar potencial en nodos de borde
      this.K.rowPointers = this.modifyRowForDirichlet(this.K, nodeId);
      F[nodeId] = groundPotential;
    }
  }

  /**
   * Modifica fila para condición Dirichlet
   */
  modifyRowForDirichlet(K, nodeId) {
    if (!K || !K.rowPointers || nodeId >= K.rowPointers.length) return K.rowPointers;
    
    // Eliminar todas las entradas de la fila excepto la diagonal
    const start = K.rowPointers[nodeId];
    const end = K.rowPointers[nodeId + 1];
    
    for (let i = start; i < end; i++) {
      if (K.colIndices[i] !== nodeId) {
        K.values[i] = 0;
      } else {
        K.values[i] = 1;
      }
    }
    
    return K.rowPointers;
  }

  /**
   * Calcula área de triángulo
   */
  triangleArea(x1, y1, x2, y2, x3, y3) {
    const area = Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1)) / 2;
    return Math.max(1e-10, area);
  }

  /**
   * Convierte matriz CSR a formato denso (para depuración)
   */
  toDenseMatrix() {
    const dense = Array(this.nNodes).fill().map(() => Array(this.nNodes).fill(0));
    
    for (let i = 0; i < this.nNodes; i++) {
      const start = this.K.rowPointers[i];
      const end = this.K.rowPointers[i + 1];
      
      for (let j = start; j < end; j++) {
        dense[i][this.K.colIndices[j]] = this.K.values[j];
      }
    }
    
    return dense;
  }
}

export default StiffnessMatrixAssembler;
