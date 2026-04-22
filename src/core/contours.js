/**
 * Generación de curvas equipotenciales (contours)
 * Algoritmo de marching squares simplificado
 */

// ============================================
// 1. GENERAR CURVAS A PARTIR DEL GRID
// ============================================

export const generateContours = (grid, levels) => {
  const contours = [];
  
  if (!grid || grid.length === 0 || !levels || levels.length === 0) return contours;
  
  for (const level of levels) {
    const points = [];
    
    // Recorrer el grid buscando intersecciones con el nivel
    for (let i = 0; i < grid.length - 1; i++) {
      if (!grid[i] || grid[i].length === 0) continue;
      for (let j = 0; j < grid[i].length - 1; j++) {
        const corners = [
          grid[i][j]?.value || 0,
          grid[i + 1]?.[j]?.value || 0,
          grid[i + 1]?.[j + 1]?.value || 0,
          grid[i]?.[j + 1]?.value || 0
        ];
        
        const center = {
          x: ((grid[i][j]?.x || 0) + (grid[i + 1]?.[j]?.x || 0)) / 2,
          y: ((grid[i][j]?.y || 0) + (grid[i]?.[j + 1]?.y || 0)) / 2
        };
        
        // Verificar si el nivel cruza esta celda
        const min = Math.min(...corners);
        const max = Math.max(...corners);
        
        if (level >= min && level <= max) {
          points.push(center);
        }
      }
    }
    
    if (points.length > 2) {
      contours.push({
        level,
        points,
        color: getContourColor(level, levels)
      });
    }
  }
  
  return contours;
};

// ============================================
// 2. COLOR DE CURVA SEGÚN NIVEL
// ============================================

const getContourColor = (level, levels) => {
  const minLevel = Math.min(...levels);
  const maxLevel = Math.max(...levels);
  const ratio = (maxLevel - minLevel) > 0 ? (level - minLevel) / (maxLevel - minLevel) : 0;
  
  if (ratio < 0.25) return '#22c55e';      // Verde
  if (ratio < 0.5) return '#84cc16';       // Verde claro
  if (ratio < 0.75) return '#eab308';      // Amarillo
  return '#ef4444';                         // Rojo
};

// ============================================
// 3. GENERAR ISOLÍNEAS (versión mejorada)
// ============================================

export const generateIsoLines = (grid, numLevels = 8) => {
  const allValues = grid && grid.length > 0 ? grid.flat().map(cell => cell?.value || 0) : [];
  const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 1000;
  
  const step = (maxVal - minVal) / numLevels;
  const levels = [];
  
  for (let i = 1; i <= numLevels; i++) {
    levels.push(minVal + i * step);
  }
  
  return generateContours(grid, levels);
};

// ============================================
// 4. DIBUJAR CURVAS EN CANVAS
// ============================================

export const drawContours = (ctx, contours, width, height, bounds) => {
  const scaleX = width / (bounds.maxX - bounds.minX);
  const scaleY = height / (bounds.maxY - bounds.minY);
  const offsetX = -bounds.minX * scaleX;
  const offsetY = -bounds.minY * scaleY;
  
  for (const contour of contours) {
    ctx.beginPath();
    ctx.strokeStyle = contour.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    for (let i = 0; i < contour.points.length; i++) {
      const x = contour.points[i].x * scaleX + offsetX;
      const y = contour.points[i].y * scaleY + offsetY;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }
  
  ctx.setLineDash([]);
};

export default {
  generateContours,
  generateIsoLines,
  drawContours
};
