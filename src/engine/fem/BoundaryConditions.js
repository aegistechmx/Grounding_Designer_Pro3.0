// src/engine/fem/BoundaryConditions.js
// Condiciones de borde para el problema eléctrico

export class BoundaryConditionManager {
  constructor() {
    this.dirichletNodes = new Map(); // nodeId -> potential
    this.neumannNodes = new Map();   // nodeId -> current
    this.sourceNodes = new Map();    // nodeId -> injectedCurrent
  }

  /**
   * Fija potencial en un nodo (Dirichlet)
   */
  fixPotential(nodeId, potential = 0) {
    this.dirichletNodes.set(nodeId, potential);
  }

  /**
   * Fija corriente inyectada en un nodo (Neumann)
   */
  injectCurrent(nodeId, current) {
    this.sourceNodes.set(nodeId, current);
  }

  /**
   * Identifica nodos de borde del dominio (tierra infinita)
   */
  identifyInfiniteGroundNodes(nodes, grid) {
    if (!nodes || !grid) return [];
    
    const tolerance = 0.01;
    const groundNodes = [];
    const gridLength = grid.length || 10;
    const gridWidth = grid.width || 10;
    
    for (const node of nodes) {
      const isBoundary = 
        node.x < tolerance || 
        node.x > gridLength - tolerance ||
        node.y < tolerance || 
        node.y > gridWidth - tolerance;
      
      if (isBoundary) {
        groundNodes.push(node.id);
        this.fixPotential(node.id, 0);
      }
    }
    
    return groundNodes;
  }

  /**
   * Identifica nodos donde se inyecta corriente (puntos de falla)
   */
  identifySourceNodes(nodes, faultPoint, faultCurrent) {
    if (!nodes || !faultPoint) return null;
    
    let closestNode = null;
    let minDistance = Infinity;
    
    for (const node of nodes) {
      const distance = Math.hypot(
        node.x - faultPoint.x,
        node.y - faultPoint.y
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestNode = node;
      }
    }
    
    if (closestNode) {
      this.injectCurrent(closestNode.id, faultCurrent);
    }
    
    return closestNode;
  }

  /**
   * Aplica condiciones de borde al sistema
   */
  applyToSystem(K, F, nodes) {
    if (!K || !F || !nodes) return F;
    
    const modifiedF = [...F];
    
    // Aplicar condiciones Dirichlet
    for (const [nodeId, potential] of this.dirichletNodes) {
      if (!K.rowPointers || nodeId >= K.rowPointers.length) continue;
      
      // Modificar matriz K
      const start = K.rowPointers[nodeId];
      const end = K.rowPointers[nodeId + 1];
      
      for (let i = start; i < end; i++) {
        if (K.colIndices[i] !== nodeId) {
          K.values[i] = 0;
        } else {
          K.values[i] = 1;
        }
      }
      
      // Modificar vector F
      modifiedF[nodeId] = potential;
    }
    
    // Aplicar condiciones Neumann (fuentes de corriente)
    for (const [nodeId, current] of this.sourceNodes) {
      if (nodeId < modifiedF.length) {
        modifiedF[nodeId] += current;
      }
    }
    
    return modifiedF;
  }

  /**
   * Calcula condiciones de borde para la malla conductora
   */
  applyConductorConditions(nodes, gridPoints, GPR) {
    if (!nodes || !gridPoints) return;
    
    // Los puntos de la malla conductora tienen potencial fijo = GPR
    for (const point of gridPoints) {
      let closestNode = null;
      let minDistance = Infinity;
      
      for (const node of nodes) {
        const distance = Math.hypot(node.x - point.x, node.y - point.y);
        if (distance < minDistance) {
          minDistance = distance;
          closestNode = node;
        }
      }
      
      if (closestNode && minDistance < 0.1) {
        this.fixPotential(closestNode.id, GPR);
      }
    }
  }

  /**
   * Limpia todas las condiciones
   */
  clear() {
    this.dirichletNodes.clear();
    this.neumannNodes.clear();
    this.sourceNodes.clear();
  }
}

export default BoundaryConditionManager;
