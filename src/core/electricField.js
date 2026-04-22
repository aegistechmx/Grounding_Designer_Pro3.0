/**
 * Motor de campo eléctrico vectorial
 * E = -∇V (gradiente negativo del potencial)
 */

// ============================================
// 1. COMPUTAR CAMPO ELÉCTRICO
// ============================================

export const computeElectricField = (grid, dx = 1, dy = 1) => {
  if (!grid || grid.length === 0 || !grid[0] || grid[0].length === 0) return [];
  
  const field = [];
  const rows = grid.length;
  const cols = grid[0].length;
  
  // Calcular gradiente usando diferencias centrales
  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      // Gradiente en X: ∂V/∂x ≈ (V[i+1][j] - V[i-1][j]) / (2*dx)
      const dVdx = (grid[i + 1][j] - grid[i - 1][j]) / (2 * dx);
      
      // Gradiente en Y: ∂V/∂y ≈ (V[i][j+1] - V[i][j-1]) / (2*dy)
      const dVdy = (grid[i][j + 1] - grid[i][j - 1]) / (2 * dy);
      
      // Campo eléctrico: E = -∇V
      const ex = -dVdx;
      const ey = -dVdy;
      const magnitude = Math.sqrt(ex * ex + ey * ey);
      
      field.push({
        x: j,
        y: i,
        ex,
        ey,
        magnitude,
        angle: Math.atan2(ey, ex)
      });
    }
  }
  
  return field;
};

// ============================================
// 2. DIBUJAR CAMPO EN CANVAS
// ============================================

export const drawElectricField = (ctx, field, bounds, scale = 5, color = 'rgba(255, 255, 255, 0.6)') => {
  if (!field || field.length === 0 || !bounds) return;
  
  const rangeX = bounds.maxX - bounds.minX;
  const rangeY = bounds.maxY - bounds.minY;
  if (rangeX === 0 || rangeY === 0) return;
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  
  const scaleX = bounds.width / Math.max(1, rangeX);
  const scaleY = bounds.height / Math.max(1, rangeY);
  
  for (const v of field) {
    const startX = v.x * scaleX;
    const startY = v.y * scaleY;
    
    // Normalizar vector para visualización
    const mag = v.magnitude || 1;
    const normX = v.ex / Math.max(0.1, mag);
    const normY = v.ey / Math.max(0.1, mag);
    
    const endX = startX + normX * scale;
    const endY = startY + normY * scale;
    
    // Dibujar flecha
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Dibujar punta de flecha
    const arrowSize = 3;
    const angle = Math.atan2(normY, normX);
    
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle - Math.PI / 6),
      endY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle + Math.PI / 6),
      endY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }
};

// ============================================
// 3. DIBUJAR CAMPO CON COLOR POR MAGNITUD
// ============================================

export const drawElectricFieldColored = (ctx, field, bounds, scale = 5, maxMagnitude = 100) => {
  if (!field || field.length === 0 || !bounds) return;
  
  const rangeX = bounds.maxX - bounds.minX;
  const rangeY = bounds.maxY - bounds.minY;
  if (rangeX === 0 || rangeY === 0) return;
  
  const scaleX = bounds.width / Math.max(1, rangeX);
  const scaleY = bounds.height / Math.max(1, rangeY);
  
  for (const v of field) {
    const startX = v.x * scaleX;
    const startY = v.y * scaleY;
    
    const mag = v.magnitude || 1;
    const normX = v.ex / Math.max(0.1, mag);
    const normY = v.ey / Math.max(0.1, mag);
    
    const endX = startX + normX * scale;
    const endY = startY + normY * scale;
    
    // Color basado en magnitud (azul = bajo, rojo = alto)
    const t = Math.min(mag / Math.max(0.1, maxMagnitude), 1);
    const r = Math.floor(255 * t);
    const g = Math.floor(255 * (1 - t) * 0.5);
    const b = Math.floor(255 * (1 - t));
    
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.7)`;
    ctx.lineWidth = 1 + t; // Más grueso para campos fuertes
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
};

// ============================================
// 4. GENERAR GRID DE POTENCIAL
// ============================================

export const generatePotentialGrid = (nodes, resolution = 50, width = 600, height = 400) => {
  if (!nodes || nodes.length === 0) return [];
  
  const grid = [];
  const values = nodes.map(n => n.value || 0);
  if (values.length === 0) return [];
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Interpolación IDW simplificada
  for (let i = 0; i < resolution; i++) {
    grid[i] = [];
    for (let j = 0; j < resolution; j++) {
      const x = (i / resolution) * width;
      const y = (j / resolution) * height;
      
      let num = 0, den = 0;
      for (const node of nodes) {
        const d = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2) + 0.0001;
        const w = 1 / (d * d);
        num += w * node.value;
        den += w;
      }
      
      grid[i][j] = den > 0 ? num / den : 0;
    }
  }
  
  return { grid, min, max };
};

// ============================================
// 5. STREAMLINES (LÍNEAS DE CORRIENTE)
// ============================================

export const generateStreamlines = (field, startPoints, steps = 100, stepSize = 2) => {
  if (!field || field.length === 0 || !startPoints || startPoints.length === 0) return [];
  
  const streamlines = [];
  
  for (const start of startPoints) {
    const line = [{ x: start.x, y: start.y }];
    let x = start.x;
    let y = start.y;
    
    for (let i = 0; i < steps; i++) {
      // Encontrar campo más cercano
      let nearest = null;
      let minDist = Infinity;
      
      for (const v of field) {
        const d = Math.sqrt((x - v.x) ** 2 + (y - v.y) ** 2);
        if (d < minDist) {
          minDist = d;
          nearest = v;
        }
      }
      
      if (!nearest) break;
      
      // Avanzar en dirección del campo
      x += (nearest.ex / Math.max(0.1, nearest.magnitude || 1)) * stepSize;
      y += (nearest.ey / Math.max(0.1, nearest.magnitude || 1)) * stepSize;
      
      line.push({ x, y });
    }
    
    streamlines.push(line);
  }
  
  return streamlines;
};

export const drawStreamlines = (ctx, streamlines, bounds, color = 'rgba(255, 255, 0, 0.5)') => {
  if (!streamlines || streamlines.length === 0 || !bounds) return;
  
  const rangeX = bounds.maxX - bounds.minX;
  const rangeY = bounds.maxY - bounds.minY;
  if (rangeX === 0 || rangeY === 0) return;
  
  const scaleX = bounds.width / Math.max(1, rangeX);
  const scaleY = bounds.height / Math.max(1, rangeY);
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  
  for (const line of streamlines) {
    ctx.beginPath();
    for (let i = 0; i < line.length; i++) {
      const x = line[i].x * scaleX;
      const y = line[i].y * scaleY;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }
};

export default {
  computeElectricField,
  drawElectricField,
  drawElectricFieldColored,
  generatePotentialGrid,
  generateStreamlines,
  drawStreamlines
};
