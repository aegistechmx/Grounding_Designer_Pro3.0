// src/engine/fem/physics/MultiLayerSoil.js
// Modelo de suelo multicapa industrial

export class MultiLayerSoil {
  constructor() {
    this.layers = [];
    this.defaultResistivity = 100;
  }

  /**
   * Agrega capa de suelo
   */
  addLayer(depth, resistivity, description = '') {
    this.layers.push({
      depth,
      resistivity,
      conductivity: 1 / resistivity,
      description
    });
    
    // Ordenar por profundidad
    this.layers.sort((a, b) => a.depth - b.depth);
  }

  /**
   * Configura capas típicas de IEEE 80
   */
  setupFromIEEE80(soilResistivity, surfaceResistivity, surfaceDepth) {
    this.defaultResistivity = soilResistivity;
    
    if (surfaceDepth > 0) {
      this.addLayer(surfaceDepth, surfaceResistivity, 'Capa superficial');
    }
    
    // Capas adicionales para modelar suelo real
    this.addLayer(2.0, soilResistivity * 1.2, 'Suelo superior');
    this.addLayer(5.0, soilResistivity, 'Suelo medio');
    this.addLayer(10.0, soilResistivity * 0.8, 'Suelo profundo');
  }

  /**
   * Obtiene conductividad en un punto (x, y)
   */
  getConductivity(x, y) {
    // Buscar capa correspondiente a la profundidad y
    for (const layer of this.layers) {
      if (y <= layer.depth) {
        return layer.conductivity;
      }
    }
    
    // Capa base
    return 1 / this.defaultResistivity;
  }

  /**
   * Obtiene resistividad en un punto
   */
  getResistivity(x, y) {
    return 1 / this.getConductivity(x, y);
  }

  /**
   * Calcula resistividad equivalente (método de Sunde)
   */
  getEquivalentResistivity() {
    // Método simplificado de promediado
    let sumDepth = 0;
    let sumResistivity = 0;
    
    for (const layer of this.layers) {
      const depth = layer.depth - sumDepth;
      sumResistivity += depth / layer.resistivity;
      sumDepth = layer.depth;
    }
    
    // Capa infinita
    sumResistivity += 1000 / this.defaultResistivity;
    
    return 1 / sumResistivity;
  }

  /**
   * Exporta a formato para reporte
   */
  toReport() {
    return {
      type: 'MultiLayerSoil',
      layers: this.layers,
      defaultResistivity: this.defaultResistivity,
      equivalentResistivity: this.getEquivalentResistivity()
    };
  }
}

export default MultiLayerSoil;
