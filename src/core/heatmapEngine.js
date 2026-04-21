/**
 * Motor de heatmap real con interpolación IDW
 * Genera mapas de potencial tipo ETAP
 */

// ============================================
// 1. GENERAR HEATMAP CON INTERPOLACIÓN IDW
// ============================================

export const generateHeatmap = (nodes, resolution = 60, power = 2) => {
  if (!nodes || nodes.length === 0) return [];
  
  const grid = [];
  
  // Determinar límites
  const minX = Math.min(...nodes.map(n => n.x));
  const maxX = Math.max(...nodes.map(n => n.x));
  const minY = Math.min(...nodes.map(n => n.y));
  const maxY = Math.max(...nodes.map(n => n.y));
  
  const stepX = (maxX - minX) / resolution;
  const stepY = (maxY - minY) / resolution;
  
  // Encontrar valores máximos y mínimos para normalización
  const allValues = nodes.map(n => n.voltage || n.potential || 0);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  
  for (let i = 0; i <= resolution; i++) {
    const x = minX + i * stepX;
    const row = [];
    
    for (let j = 0; j <= resolution; j++) {
      const y = minY + j * stepY;
      
      // Interpolación IDW
      let numerator = 0;
      let denominator = 0;
      
      for (const node of nodes) {
        const nodeValue = node.voltage || node.potential || 0;
        const dx = x - node.x;
        const dy = y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const weight = 1 / Math.pow(distance, power);
        
        numerator += weight * nodeValue;
        denominator += weight;
      }
      
      const value = denominator > 0 ? numerator / denominator : 0;
      const normalized = maxValue > minValue ? (value - minValue) / (maxValue - minValue) : 0;
      
      row.push({
        x,
        y,
        value,
        normalized
      });
    }
    grid.push(row);
  }
  
  return {
    grid,
    bounds: { minX, maxX, minY, maxY },
    minValue,
    maxValue,
    resolution
  };
};

// ============================================
// 2. OBTENER COLOR SEGÚN VALOR
// ============================================

export const getHeatmapColor = (normalized, theme = 'thermal') => {
  // Thermal: verde -> amarillo -> rojo
  if (theme === 'thermal') {
    if (normalized <= 0.2) return '#22c55e';      // Verde
    if (normalized <= 0.4) return '#84cc16';      // Verde claro
    if (normalized <= 0.6) return '#eab308';      // Amarillo
    if (normalized <= 0.8) return '#f97316';      // Naranja
    return '#ef4444';                              // Rojo
  }
  
  // Blue: azul claro -> azul oscuro
  if (theme === 'blue') {
    const intensity = Math.floor(100 + 155 * (1 - normalized));
    return `rgb(0, 0, ${intensity})`;
  }
  
  // Gray: escala de grises
  if (theme === 'gray') {
    const intensity = Math.floor(255 * (1 - normalized));
    return `rgb(${intensity}, ${intensity}, ${intensity})`;
  }
  
  return '#22c55e';
};

// ============================================
// 3. DIBUJAR HEATMAP EN CANVAS
// ============================================

export const drawHeatmap = (ctx, heatmapData, width, height, theme = 'thermal') => {
  if (!heatmapData || !heatmapData.grid) return;
  
  const { grid, bounds, minValue, maxValue } = heatmapData;
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  
  const cellW = width / cols;
  const cellH = height / rows;
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = grid[i][j];
      if (!cell) continue;
      
      const color = getHeatmapColor(cell.normalized, theme);
      ctx.fillStyle = color;
      ctx.fillRect(j * cellW, i * cellH, cellW, cellH);
    }
  }
  
  // Dibujar líneas de contorno
  ctx.beginPath();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= rows; i++) {
    ctx.moveTo(0, i * cellH);
    ctx.lineTo(width, i * cellH);
    ctx.stroke();
    ctx.moveTo(i * cellW, 0);
    ctx.lineTo(i * cellW, height);
    ctx.stroke();
  }
};

// ============================================
// 4. GENERAR CURVAS EQUIPOTENCIALES
// ============================================

export const generateContours = (heatmapData, numLevels = 6) => {
  const { grid, minValue, maxValue } = heatmapData;
  const levels = [];
  
  const step = (maxValue - minValue) / numLevels;
  for (let i = 1; i <= numLevels; i++) {
    levels.push(minValue + i * step);
  }
  
  const contours = [];
  
  for (const level of levels) {
    const points = [];
    
    for (let i = 0; i < grid.length - 1; i++) {
      for (let j = 0; j < grid[i].length - 1; j++) {
        const corners = [
          grid[i][j].value,
          grid[i + 1][j].value,
          grid[i + 1][j + 1].value,
          grid[i][j + 1].value
        ];
        
        const min = corners.length > 0 ? Math.min(...corners) : 0;
        const max = corners.length > 0 ? Math.max(...corners) : 1;
        
        if (level >= min && level <= max) {
          const centerX = (grid[i][j].x + grid[i + 1][j].x) / 2;
          const centerY = (grid[i][j].y + grid[i][j + 1].y) / 2;
          points.push({ x: centerX, y: centerY });
        }
      }
    }
    
    if (points.length > 2) {
      contours.push({
        level,
        points,
        color: getHeatmapColor((level - minValue) / (maxValue - minValue))
      });
    }
  }
  
  return contours;
};

// ============================================
// 5. DIBUJAR CURVAS EN CANVAS
// ============================================

export const drawContours = (ctx, contours, width, height, bounds) => {
  const scaleX = width / (bounds.maxX - bounds.minX);
  const scaleY = height / (bounds.maxY - bounds.minY);
  const offsetX = -bounds.minX * scaleX;
  const offsetY = -bounds.minY * scaleY;
  
  for (const contour of contours) {
    ctx.beginPath();
    ctx.strokeStyle = contour.color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    
    let first = true;
    for (const point of contour.points) {
      const x = point.x * scaleX + offsetX;
      const y = point.y * scaleY + offsetY;
      
      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }
  
  ctx.setLineDash([]);
};

export default {
  generateHeatmap,
  getHeatmapColor,
  drawHeatmap,
  generateContours,
  drawContours
};
