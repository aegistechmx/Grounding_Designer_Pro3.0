// src/engine/fem/mesh/MeshGenerator.js
// Generación de malla para FEM 2D

export class MeshGenerator {
  constructor(grid, resolution = 0.5) {
    this.grid = grid;
    this.resolution = resolution;
    this.nodes = [];
    this.elements = [];
    this.nodeMap = new Map();
  }

  /**
   * Genera malla estructurada para el dominio
   */
  generateStructuredMesh() {
    const { length, width } = this.grid;
    const nx = Math.ceil(length / this.resolution);
    const ny = Math.ceil(width / this.resolution);
    
    // Crear nodos
    for (let i = 0; i <= ny; i++) {
      for (let j = 0; j <= nx; j++) {
        const x = j * this.resolution;
        const y = i * this.resolution;
        const id = this.nodes.length;
        
        this.nodes.push({
          id,
          x,
          y,
          boundary: this.isBoundary(x, y, length, width)
        });
        
        this.nodeMap.set(`${x},${y}`, id);
      }
    }
    
    // Crear elementos triangulares
    for (let i = 0; i < ny; i++) {
      for (let j = 0; j < nx; j++) {
        const n0 = i * (nx + 1) + j;
        const n1 = n0 + 1;
        const n2 = n0 + (nx + 1);
        const n3 = n2 + 1;
        
        // Triángulo inferior
        this.elements.push({
          id: this.elements.length,
          nodes: [n0, n1, n2],
          area: this.computeTriangleArea(this.nodes[n0], this.nodes[n1], this.nodes[n2])
        });
        
        // Triángulo superior
        this.elements.push({
          id: this.elements.length,
          nodes: [n1, n3, n2],
          area: this.computeTriangleArea(this.nodes[n1], this.nodes[n3], this.nodes[n2])
        });
      }
    }
    
    return { nodes: this.nodes, elements: this.elements };
  }

  /**
   * Genera malla adaptativa (refinamiento donde hay más gradiente)
   */
  generateAdaptiveMesh(potentialField = null) {
    const baseMesh = this.generateStructuredMesh();
    
    if (!potentialField) return baseMesh;
    
    // Refinar donde el gradiente es alto
    const refinedElements = [];
    const gradientThreshold = this.computeGradientThreshold(potentialField);
    
    for (const element of baseMesh.elements) {
      const gradient = this.computeElementGradient(element, potentialField);
      
      if (gradient > gradientThreshold) {
        // Refinar elemento (subdividir)
        const subdivided = this.subdivideElement(element, baseMesh.nodes);
        refinedElements.push(...subdivided);
      } else {
        refinedElements.push(element);
      }
    }
    
    return { nodes: baseMesh.nodes, elements: refinedElements };
  }

  /**
   * Verifica si un nodo está en el borde del dominio
   */
  isBoundary(x, y, length, width, tolerance = 0.01) {
    return x < tolerance || x > length - tolerance || 
           y < tolerance || y > width - tolerance;
  }

  /**
   * Calcula área de un triángulo
   */
  computeTriangleArea(p1, p2, p3) {
    const area = Math.abs((p2.x - p1.x) * (p3.y - p1.y) - 
                          (p3.x - p1.x) * (p2.y - p1.y)) / 2;
    return Math.max(1e-10, area);
  }

  /**
   * Calcula el gradiente de un elemento
   */
  computeElementGradient(element, potentialField) {
    const [n1, n2, n3] = element.nodes;
    const V1 = potentialField[n1] || 0;
    const V2 = potentialField[n2] || 0;
    const V3 = potentialField[n3] || 0;
    
    return Math.sqrt(Math.pow(V2 - V1, 2) + Math.pow(V3 - V1, 2));
  }

  /**
   * Subdivide un elemento en 4 elementos más pequeños
   */
  subdivideElement(element, nodes) {
    const [n1, n2, n3] = element.nodes;
    const p1 = nodes[n1];
    const p2 = nodes[n2];
    const p3 = nodes[n3];
    
    // Puntos medios
    const m12 = this.addMidpoint(p1, p2);
    const m23 = this.addMidpoint(p2, p3);
    const m31 = this.addMidpoint(p3, p1);
    
    // 4 nuevos triángulos
    return [
      { nodes: [n1, m12.id, m31.id], area: element.area / 4 },
      { nodes: [m12.id, n2, m23.id], area: element.area / 4 },
      { nodes: [m31.id, m23.id, n3], area: element.area / 4 },
      { nodes: [m12.id, m23.id, m31.id], area: element.area / 4 }
    ];
  }

  /**
   * Agrega un punto medio a la lista de nodos
   */
  addMidpoint(p1, p2) {
    const x = (p1.x + p2.x) / 2;
    const y = (p1.y + p2.y) / 2;
    const key = `${x},${y}`;
    
    if (this.nodeMap.has(key)) {
      return { id: this.nodeMap.get(key) };
    }
    
    const id = this.nodes.length;
    this.nodes.push({
      id,
      x,
      y,
      boundary: false
    });
    this.nodeMap.set(key, id);
    
    return { id };
  }

  /**
   * Calcula umbral de gradiente para refinamiento
   */
  computeGradientThreshold(potentialField) {
    const gradients = [];
    
    for (const element of this.elements) {
      gradients.push(this.computeElementGradient(element, potentialField));
    }
    
    gradients.sort((a, b) => a - b);
    const p95 = gradients[Math.floor(gradients.length * 0.95)];
    
    return p95 * 0.5; // Refinar donde el gradiente es > 50% del percentil 95
  }
}

export default MeshGenerator;
