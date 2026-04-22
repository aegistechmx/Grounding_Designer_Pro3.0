// src/workers/heatmap/heatmapWorker.js
// Worker para cálculo de heatmaps (procesamiento pesado)

/* eslint-disable no-restricted-globals */

self.addEventListener('message', (e) => {
  const { type, data, id } = e.data;
  
  switch (type) {
    case 'GENERATE_HEATMAP':
      generateHeatmap(data, id);
      break;
    case 'GENERATE_VOLTAGE_MAP':
      generateVoltageMap(data, id);
      break;
    default:
      self.postMessage({ type: 'ERROR', error: `Unknown task: ${type}`, id });
  }
});

/**
 * Genera mapa de calor de tensiones
 */
function generateHeatmap(data, id) {
  const { grid, GPR, resolution = 100, colors = 256 } = data;
  
  try {
    const startTime = performance.now();
    
    const heatmap = [];
    const stepX = grid.length / resolution;
    const stepY = grid.width / resolution;
    
    let minValue = Infinity;
    let maxValue = -Infinity;
    
    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const x = j * stepX;
        const y = i * stepY;
        
        // Calcular tensión en punto
        const centerX = grid.length / 2;
        const centerY = grid.width / 2;
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        const maxDistance = Math.max(grid.length, grid.width) / 2;
        
        let voltage = GPR * Math.exp(-3 * distance / maxDistance);
        voltage = Math.max(0, Math.min(voltage, GPR));
        
        minValue = Math.min(minValue, voltage);
        maxValue = Math.max(maxValue, voltage);
        
        heatmap.push({ x, y, voltage });
      }
    }
    
    // Normalizar valores para colores
    const range = maxValue - minValue;
    const normalizedHeatmap = heatmap.map(point => ({
      ...point,
      normalized: range > 0 ? (point.voltage - minValue) / range : 0
    }));
    
    // Generar colores
    const colorMap = generateColorMap(colors);
    
    const endTime = performance.now();
    
    self.postMessage({
      type: 'HEATMAP_COMPLETE',
      results: {
        heatmap: normalizedHeatmap,
        colorMap,
        minValue,
        maxValue,
        resolution,
        executionTime: endTime - startTime
      },
      id
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message,
      id
    });
  }
}

/**
 * Genera mapa de voltajes 2D
 */
function generateVoltageMap(data, id) {
  const { grid, potentials, resolution } = data;
  
  try {
    const voltageMap = [];
    
    for (let i = 0; i <= resolution; i++) {
      const row = [];
      for (let j = 0; j <= resolution; j++) {
        const idx = i * (resolution + 1) + j;
        row.push(potentials && potentials[idx] !== undefined ? potentials[idx] : 0);
      }
      voltageMap.push(row);
    }
    
    self.postMessage({
      type: 'VOLTAGE_MAP_COMPLETE',
      results: { voltageMap, resolution },
      id
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message,
      id
    });
  }
}

/**
 * Genera mapa de colores para heatmap
 */
function generateColorMap(colors) {
  const colorMap = [];
  
  // Colores: azul (bajo) -> verde -> amarillo -> rojo (alto)
  const colorStops = [
    { position: 0, r: 0, g: 0, b: 255 },      // Azul
    { position: 0.33, r: 0, g: 255, b: 0 },   // Verde
    { position: 0.66, r: 255, g: 255, b: 0 }, // Amarillo
    { position: 1, r: 255, g: 0, b: 0 }       // Rojo
  ];
  
  for (let i = 0; i < colors; i++) {
    const t = i / (colors - 1);
    
    // Encontrar color stops
    let stop1 = colorStops[0];
    let stop2 = colorStops[colorStops.length - 1];
    
    for (let j = 0; j < colorStops.length - 1; j++) {
      if (t >= colorStops[j].position && t <= colorStops[j + 1].position) {
        stop1 = colorStops[j];
        stop2 = colorStops[j + 1];
        break;
      }
    }
    
    // Interpolar
    const range = stop2.position - stop1.position;
    const t2 = range > 0 ? (t - stop1.position) / range : 0;
    
    const r = Math.round(stop1.r + (stop2.r - stop1.r) * t2);
    const g = Math.round(stop1.g + (stop2.g - stop1.g) * t2);
    const b = Math.round(stop1.b + (stop2.b - stop1.b) * t2);
    
    colorMap.push(`rgb(${r}, ${g}, ${b})`);
  }
  
  return colorMap;
}

export default {};
