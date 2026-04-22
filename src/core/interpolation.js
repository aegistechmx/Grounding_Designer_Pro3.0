/**
 * Interpolación IDW para heatmap tipo ETAP
 */

// ============================================
// 1. INTERPOLACIÓN IDW BÁSICA
// ============================================

export const interpolateIDW = (points, values, targetX, targetY, power = 2, radius = Infinity) => {
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < points.length; i++) {
    const dx = targetX - points[i].x;
    const dy = targetY - points[i].y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < radius) {
      const weight = 1 / Math.pow(distance + 0.001, power);
      numerator += weight * values[i];
      denominator += weight;
    }
  }
  
  return denominator > 0 ? numerator / denominator : 0;
};

// ============================================
// 2. GENERAR GRID INTERPOLADO
// ============================================

export const interpolateGrid = (nodes, values, resolution = 80, bounds = null) => {
  // Determinar límites
  const minX = bounds?.minX ?? Math.min(...nodes.map(n => n.x));
  const maxX = bounds?.maxX ?? Math.max(...nodes.map(n => n.x));
  const minY = bounds?.minY ?? Math.min(...nodes.map(n => n.y));
  const maxY = bounds?.maxY ?? Math.max(...nodes.map(n => n.y));
  
  const stepX = (maxX - minX) / resolution;
  const stepY = (maxY - minY) / resolution;
  
  const grid = [];
  
  for (let i = 0; i <= resolution; i++) {
    const x = minX + i * stepX;
    const row = [];
    
    for (let j = 0; j <= resolution; j++) {
      const y = minY + j * stepY;
      
      // Extraer valores de los nodos
      const nodeValues = nodes.map(n => {
        const dx = n.x - x;
        const dy = n.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return { value: n.value, dist };
      });
      
      // IDW interpolation
      let interpolatedValue = interpolateIDW(nodes, values, x, y);
      
      row.push({
        x,
        y,
        value: Math.max(0, interpolatedValue)
      });
    }
    grid.push(row);
  }
  
  return {
    grid,
    bounds: { minX, maxX, minY, maxY },
    resolution,
    stepX,
    stepY
  };
};

// ============================================
// 3. INTERPOLACIÓN POR KRIGING (simplificado)
// ============================================

export const interpolateKriging = (nodes, values, targetX, targetY) => {
  // Versión simplificada usando IDW con potencia adaptativa
  const distances = nodes.map((node, i) => ({
    dist: Math.hypot(node.x - targetX, node.y - targetY),
    value: values[i]
  }));
  
  distances.sort((a, b) => a.dist - b.dist);
  
  // Usar los 4 puntos más cercanos
  const nearest = distances.slice(0, 4);
  let numerator = 0;
  let denominator = 0;
  
  for (const point of nearest) {
    const weight = 1 / (point.dist + 0.001);
    numerator += weight * point.value;
    denominator += weight;
  }
  
  return denominator > 0 ? numerator / denominator : 0;
};

// ============================================
// 4. GENERAR GRID CON RESOLUCIÓN PERSONALIZADA
// ============================================

export const generateHeatmapGrid = (gridData, resolution = 100) => {
  const { grid, bounds, stepX, stepY } = interpolateGrid(
    gridData.points,
    gridData.values,
    resolution,
    gridData.bounds
  );
  
  // Normalizar valores para colores
  const allValues = grid && grid.length > 0 ? grid.flat().map(cell => cell.value) : [];
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  
  const normalizedGrid = grid.map(row =>
    row.map(cell => ({
      ...cell,
      normalized: (maxVal - minVal) > 0 ? (cell.value - minVal) / (maxVal - minVal) : 0
    }))
  );
  
  return {
    grid: normalizedGrid,
    bounds,
    minValue: minVal,
    maxValue: maxVal,
    resolution
  };
};

export default {
  interpolateIDW,
  interpolateGrid,
  interpolateKriging,
  generateHeatmapGrid
};
