// src/engine/fem/mesh/Delaunay2D.js
// Triangulación de Delaunay industrial

export class Delaunay2D {
  constructor(points) {
    this.points = points;
    this.triangles = [];
    this.hull = [];
  }

  /**
   * Ejecuta triangulación de Delaunay
   */
  triangulate() {
    // Crear super-triángulo que contiene todos los puntos
    const superTriangle = this.createSuperTriangle();
    this.triangles = [superTriangle];
    
    // Insertar puntos uno por uno
    for (const point of this.points) {
      this.insertPoint(point);
    }
    
    // Eliminar triángulos que usan super-triángulo
    this.removeSuperTriangle(superTriangle);
    
    return this.triangles;
  }

  /**
   * Crea super-triángulo
   */
  createSuperTriangle() {
    const minX = Math.min(...this.points.map(p => p.x));
    const maxX = Math.max(...this.points.map(p => p.x));
    const minY = Math.min(...this.points.map(p => p.y));
    const maxY = Math.max(...this.points.map(p => p.y));
    
    const dx = (maxX - minX) * 10;
    const dy = (maxY - minY) * 10;
    
    return {
      vertices: [
        { x: minX - dx, y: minY - dy },
        { x: maxX + dx, y: minY - dy },
        { x: minX + (maxX - minX) / 2, y: maxY + dy }
      ]
    };
  }

  /**
   * Inserta punto en la triangulación
   */
  insertPoint(point) {
    // Encontrar triángulos cuyo circuncírculo contiene el punto
    const badTriangles = [];
    
    for (const triangle of this.triangles) {
      if (this.isPointInCircumcircle(point, triangle)) {
        badTriangles.push(triangle);
      }
    }
    
    // Encontrar borde de la cavidad
    const boundary = this.findBoundary(badTriangles);
    
    // Eliminar triángulos malos
    this.triangles = this.triangles.filter(t => !badTriangles.includes(t));
    
    // Crear nuevos triángulos
    for (const edge of boundary) {
      this.triangles.push({
        vertices: [edge[0], edge[1], point]
      });
    }
  }

  /**
   * Verifica si un punto está en el circuncírculo de un triángulo
   */
  isPointInCircumcircle(point, triangle) {
    const [p1, p2, p3] = triangle.vertices;
    
    const ax = p1.x - point.x;
    const ay = p1.y - point.y;
    const bx = p2.x - point.x;
    const by = p2.y - point.y;
    const cx = p3.x - point.x;
    const cy = p3.y - point.y;
    
    const det = (ax * ax + ay * ay) * (bx * cy - by * cx) -
                (bx * bx + by * by) * (ax * cy - ay * cx) +
                (cx * cx + cy * cy) * (ax * by - ay * bx);
    
    return det > 0;
  }

  /**
   * Encuentra borde de la cavidad
   */
  findBoundary(badTriangles) {
    const edges = [];
    
    for (const triangle of badTriangles) {
      const triEdges = [
        [triangle.vertices[0], triangle.vertices[1]],
        [triangle.vertices[1], triangle.vertices[2]],
        [triangle.vertices[2], triangle.vertices[0]]
      ];
      
      for (const edge of triEdges) {
        const opposite = this.findOppositeEdge(edge, badTriangles);
        if (!opposite) {
          edges.push(edge);
        }
      }
    }
    
    return edges;
  }

  /**
   * Encuentra arista opuesta
   */
  findOppositeEdge(edge, triangles) {
    for (const triangle of triangles) {
      const triEdges = [
        [triangle.vertices[0], triangle.vertices[1]],
        [triangle.vertices[1], triangle.vertices[2]],
        [triangle.vertices[2], triangle.vertices[0]]
      ];
      
      for (const triEdge of triEdges) {
        if (this.areEdgesEqual(edge, triEdge)) {
          return triEdge;
        }
      }
    }
    return null;
  }

  /**
   * Compara dos aristas
   */
  areEdgesEqual(edge1, edge2) {
    return (edge1[0] === edge2[0] && edge1[1] === edge2[1]) ||
           (edge1[0] === edge2[1] && edge1[1] === edge2[0]);
  }

  /**
   * Elimina triángulos del super-triángulo
   */
  removeSuperTriangle(superTriangle) {
    this.triangles = this.triangles.filter(triangle => {
      return !triangle.vertices.some(v => 
        v === superTriangle.vertices[0] ||
        v === superTriangle.vertices[1] ||
        v === superTriangle.vertices[2]
      );
    });
  }
}

export default Delaunay2D;
