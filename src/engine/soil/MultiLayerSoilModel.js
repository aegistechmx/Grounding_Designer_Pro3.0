// src/engine/soil/MultiLayerSoilModel.js
// Modelo de suelo multicapa para FEM

export class MultiLayerSoilModel {
  constructor() {
    this.layers = [];
    this.baseResistivity = 100;
    this.baseConductivity = 1 / 100;
  }

  /**
   * Agrega una capa de suelo
   */
  addLayer(depth, resistivity, description = '') {
    const resistivitySafe = Math.max(0.1, resistivity || 100);
    this.layers.push({
      depth,
      resistivity: resistivitySafe,
      conductivity: 1 / resistivitySafe,
      description
    });
    
    // Ordenar por profundidad
    this.layers.sort((a, b) => a.depth - b.depth);
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
    
    // Capa base (infinita)
    return this.baseConductivity;
  }

  /**
   * Obtiene resistividad en un punto
   */
  getResistivity(x, y) {
    return 1 / this.getConductivity(x, y);
  }

  /**
   * Crea modelo de suelo por defecto
   */
  static createDefault() {
    const model = new MultiLayerSoilModel();
    model.baseResistivity = 100;
    model.baseConductivity = 0.01;
    
    // Capa superficial de grava (alta resistividad)
    model.addLayer(0.2, 3000, 'Capa de grava');
    
    // Capa de suelo húmedo
    model.addLayer(1.5, 100, 'Suelo húmedo');
    
    // Capa de suelo seco
    model.addLayer(5.0, 500, 'Suelo seco');
    
    return model;
  }

  /**
   * Crea modelo de suelo desde parámetros IEEE 80
   */
  static fromIEEE80Params(soilResistivity, surfaceResistivity, surfaceDepth) {
    const model = new MultiLayerSoilModel();
    const soilResistivitySafe = Math.max(0.1, soilResistivity || 100);
    model.baseResistivity = soilResistivitySafe;
    model.baseConductivity = 1 / soilResistivitySafe;
    
    if (surfaceDepth > 0) {
      const surfaceResistivitySafe = Math.max(0.1, surfaceResistivity || 3000);
      model.addLayer(surfaceDepth, surfaceResistivitySafe, 'Capa superficial');
    }
    
    return model;
  }

  /**
   * Calcula resistividad equivalente (Wenner)
   */
  calculateEquivalentResistivity(a) {
    const aSafe = Math.max(0.1, a || 1);
    const baseResistivitySafe = Math.max(0.1, this.baseResistivity || 100);
    
    // Método simplificado de Capriotti
    let sum = 0;
    
    for (const layer of this.layers) {
      const layerResistivitySafe = Math.max(0.1, layer.resistivity || 100);
      const factor = Math.exp(-2 * layer.depth / aSafe);
      sum += (1 / layerResistivitySafe - 1 / baseResistivitySafe) * factor;
    }
    
    return 1 / (1 / baseResistivitySafe + sum);
  }
}

export default MultiLayerSoilModel;
