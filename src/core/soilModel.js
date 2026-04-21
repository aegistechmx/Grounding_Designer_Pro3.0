/**
 * Modelo de suelo multicapa
 * Permite simular diferentes estratos con distintas resistividades
 */

export const DEFAULT_LAYERS = [
  { thickness: 0.2, resistivity: 10000, name: 'Capa superficial' },
  { thickness: 2.0, resistivity: 100, name: 'Suelo natural' },
  { thickness: Infinity, resistivity: 50, name: 'Capa profunda' }
];

export const soilResistivityModel = (layers = DEFAULT_LAYERS) => {
  return (depth) => {
    let accumulated = 0;
    
    for (const layer of layers) {
      if (depth <= accumulated + layer.thickness) {
        return {
          resistivity: layer.resistivity,
          layerName: layer.name,
          depth: depth,
          accumulatedDepth: accumulated
        };
      }
      accumulated += layer.thickness;
    }
    
    const lastLayer = layers[layers.length - 1];
    return {
      resistivity: lastLayer.resistivity,
      layerName: lastLayer.name,
      depth: depth,
      accumulatedDepth: accumulated
    };
  };
};

export const calculateApparentResistivity = (layers, spacing) => {
  // Método Wenner para suelo multicapa (simplificado)
  let total = 0;
  let accumulated = 0;
  
  for (const layer of layers) {
    const depth = accumulated + layer.thickness / 2;
    const contribution = layer.resistivity * (1 / Math.sqrt(1 + (depth / spacing) ** 2));
    total += contribution;
    accumulated += layer.thickness;
  }
  
  return total;
};

export const getResistivityAtDepth = (layers, depth) => {
  let accumulated = 0;
  
  for (const layer of layers) {
    if (depth <= accumulated + layer.thickness) {
      return layer.resistivity;
    }
    accumulated += layer.thickness;
  }
  
  return layers[layers.length - 1].resistivity;
};

export const calculateEquivalentResistivity = (layers, gridDepth = 0.6) => {
  // Resistividad equivalente para profundidad de malla
  const model = soilResistivityModel(layers);
  const result = model(gridDepth);
  return result.resistivity;
};

// ============================================
// MODELO DE SUELO MULTICAPA (MÉTODO DE IMÁGENES)
// ============================================

export class SoilModel {
  constructor(layers) {
    this.layers = layers || [
      { thickness: 0.2, resistivity: 10000, name: 'Capa superficial' },
      { thickness: 1.5, resistivity: 200, name: 'Suelo seco' },
      { thickness: Infinity, resistivity: 50, name: 'Capa húmeda profunda' }
    ];
  }
  
  getResistivityAtDepth(depth) {
    let accumulated = 0;
    for (const layer of this.layers) {
      if (depth <= accumulated + layer.thickness) {
        return layer.resistivity;
      }
      accumulated += layer.thickness;
    }
    return this.layers[this.layers.length - 1].resistivity;
  }
  
  getApparentResistivity(spacing) {
    // Método Wenner para suelo multicapa
    let total = 0;
    let accumulated = 0;
    
    for (const layer of this.layers) {
      const depth = accumulated + layer.thickness / 2;
      const contribution = layer.resistivity / Math.sqrt(1 + Math.pow(depth / spacing, 2));
      total += contribution;
      accumulated += layer.thickness;
    }
    
    return total;
  }
  
  getReflectionCoefficient(k) {
    if (k >= this.layers.length - 1) return 0;
    const rho1 = this.layers[k].resistivity;
    const rho2 = this.layers[k + 1].resistivity;
    return (rho2 - rho1) / (rho2 + rho1);
  }
  
  getEquivalentResistivity(depth) {
    // Método de resistividad equivalente
    let sum = 0;
    let accumulated = 0;
    
    for (const layer of this.layers) {
      const layerDepth = Math.min(layer.thickness, Math.max(0, depth - accumulated));
      sum += layerDepth / layer.resistivity;
      accumulated += layer.thickness;
      if (accumulated >= depth) break;
    }
    
    return depth / sum;
  }
  
  getPotentialAtPoint(x, y, sources) {
    // Potencial usando método de imágenes (Schwarz)
    let V = 0;
    const rho = this.getResistivityAtDepth(0);
    
    for (const source of sources) {
      const dx = x - source.x;
      const dy = y - source.y;
      const r = Math.sqrt(dx * dx + dy * dy);
      
      // Contribución directa
      V += (source.current * rho) / (2 * Math.PI * r);
      
      // Contribución de imágenes (capas)
      let accumulated = 0;
      let reflection = 1;
      
      for (let i = 0; i < this.layers.length - 1; i++) {
        const layer = this.layers[i];
        const coeff = this.getReflectionCoefficient(i);
        reflection *= coeff;
        accumulated += layer.thickness;
        
        const imageDepth = 2 * accumulated;
        const imageR = Math.sqrt(dx * dx + dy * dy + imageDepth * imageDepth);
        V += (source.current * rho * reflection) / (2 * Math.PI * imageR);
      }
    }
    
    return V;
  }
}

export default {
  DEFAULT_LAYERS,
  soilResistivityModel,
  calculateApparentResistivity,
  getResistivityAtDepth,
  calculateEquivalentResistivity,
  SoilModel
};
