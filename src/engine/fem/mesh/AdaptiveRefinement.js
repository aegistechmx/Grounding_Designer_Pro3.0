// src/engine/fem/mesh/AdaptiveRefinement.js
// Refinamiento adaptativo de malla industrial

export class AdaptiveRefinement {
  constructor(mesh, options = {}) {
    this.mesh = mesh;
    this.refineNearConductors = options.refineNearConductors || true;
    this.refineNearFaults = options.refineNearFaults || true;
    this.minEdgeLength = options.minEdgeLength || 0.1;
    this.maxEdgeLength = options.maxEdgeLength || 2.0;
  }

  /**
   * Ejecuta refinamiento adaptativo
   */
  refine(voltageField = null) {
    let refined = false;
    let iteration = 0;
    const maxIterations = 5;
    
    do {
      refined = false;
      const newTriangles = [];
      
      for (const triangle of this.mesh.triangles) {
        const edgeLengths = this.computeEdgeLengths(triangle);
        const maxEdge = Math.max(...edgeLengths);
        const minEdge = Math.min(...edgeLengths);
        
        // Criterio 1: Refinar por longitud de arista
        if (maxEdge > this.maxEdgeLength) {
          const subdivided = this.subdivideTriangle(triangle);
          newTriangles.push(...subdivided);
          refined = true;
        }
        // Criterio 2: Refinar por gradiente (si hay campo)
        else if (voltageField && this.shouldRefineByGradient(triangle, voltageField)) {
          const subdivided = this.subdivideTriangle(triangle);
          newTriangles.push(...subdivided);
          refined = true;
        }
        // Criterio 3: Refinar cerca de conductores
        else if (this.refineNearConductors && this.isNearConductor(triangle)) {
          if (minEdge > this.minEdgeLength) {
            const subdivided = this.subdivideTriangle(triangle);
            newTriangles.push(...subdivided);
            refined = true;
          } else {
            newTriangles.push(triangle);
          }
        }
        else {
          newTriangles.push(triangle);
        }
      }
      
      this.mesh.triangles = newTriangles;
      iteration++;
      
    } while (refined && iteration < maxIterations);
    
    return this.mesh;
  }

  /**
   * Calcula longitudes de aristas del triángulo
   */
  computeEdgeLengths(triangle) {
    const [v1, v2, v3] = triangle.vertices;
    return [
      Math.hypot(v2.x - v1.x, v2.y - v1.y),
      Math.hypot(v3.x - v2.x, v3.y - v2.y),
      Math.hypot(v1.x - v3.x, v1.y - v3.y)
    ];
  }

  /**
   * Subdivide triángulo en 4 triángulos más pequeños
   */
  subdivideTriangle(triangle) {
    const [v1, v2, v3] = triangle.vertices;
    
    // Puntos medios
    const m12 = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
    const m23 = { x: (v2.x + v3.x) / 2, y: (v2.y + v3.y) / 2 };
    const m31 = { x: (v3.x + v1.x) / 2, y: (v3.y + v1.y) / 2 };
    
    // 4 nuevos triángulos
    return [
      { vertices: [v1, m12, m31] },
      { vertices: [m12, v2, m23] },
      { vertices: [m31, m23, v3] },
      { vertices: [m12, m23, m31] }
    ];
  }

  /**
   * Verifica si debe refinar por gradiente
   */
  shouldRefineByGradient(triangle, voltageField) {
    const [v1, v2, v3] = triangle.vertices;
    const V1 = voltageField[this.findNodeIndex(v1)];
    const V2 = voltageField[this.findNodeIndex(v2)];
    const V3 = voltageField[this.findNodeIndex(v3)];
    
    const gradX = (V2 - V1) / Math.hypot(v2.x - v1.x, v2.y - v1.y);
    const gradY = (V3 - V1) / Math.hypot(v3.x - v1.x, v3.y - v1.y);
    const gradient = Math.sqrt(gradX * gradX + gradY * gradY);
    
    return gradient > 100; // Umbral de gradiente
  }

  /**
   * Verifica si está cerca de conductor
   */
  isNearConductor(triangle) {
    // Simplificación: verificar distancia al centro
    const center = this.getTriangleCenter(triangle);
    const distanceToConductor = Math.min(
      Math.abs(center.x - 6.25), // Centro en x
      Math.abs(center.y - 4)     // Centro en y
    );
    
    return distanceToConductor < 1.0;
  }

  /**
   * Obtiene centro del triángulo
   */
  getTriangleCenter(triangle) {
    const [v1, v2, v3] = triangle.vertices;
    return {
      x: (v1.x + v2.x + v3.x) / 3,
      y: (v1.y + v2.y + v3.y) / 3
    };
  }

  /**
   * Encuentra índice de nodo
   */
  findNodeIndex(node) {
    // Implementar búsqueda eficiente
    return this.mesh.nodes.findIndex(n => n.x === node.x && n.y === node.y);
  }
}

export default AdaptiveRefinement;
