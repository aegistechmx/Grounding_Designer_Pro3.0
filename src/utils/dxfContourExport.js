/**
 * Exportador DXF con isolíneas reales
 * Genera curvas equipotenciales en formato DXF
 */

// ============================================
// 1. GENERAR DXF CON ISOLÍNEAS
// ============================================

export const generateDXFWithContours = (contours, filename = 'grounding_contours.dxf') => {
  let dxf = `0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
2
`;

  // Definir capas
  dxf += `0
LAYER
2
CONTOUR
70
0
62
5
6
CONTINUOUS
0
LAYER
2
GRID
70
0
62
3
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  // Exportar isolíneas como polilíneas
  for (const contour of contours) {
    if (!contour.points || contour.points.length < 2) continue;
    
    dxf += `0
POLYLINE
8
CONTOUR
66
1
`;
    
    for (const point of contour.points) {
      dxf += `0
VERTEX
8
CONTOUR
10
${point.x.toFixed(3)}
20
${point.y.toFixed(3)}
30
0
`;
    }
    
    dxf += `0
SEQEND
`;
  }

  dxf += `0
ENDSEC
0
EOF`;

  // Descargar archivo
  const blob = new Blob([dxf], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return dxf;
};

// ============================================
// 2. GENERAR ISOLÍNEAS DESDE GRID
// ============================================

export const generateContoursFromGrid = (grid, numLevels = 6) => {
  if (!grid || grid.length === 0 || !grid[0]) return [];
  
  const rows = grid.length;
  const cols = grid[0].length;
  
  // Encontrar min y max
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const v = grid[i][j] || 0;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  
  // Generar niveles
  const levels = [];
  const step = (max - min) / (numLevels + 1);
  for (let i = 1; i <= numLevels; i++) {
    levels.push(min + i * step);
  }
  
  const contours = [];
  
  // Marching squares simplificado
  for (const level of levels) {
    const points = [];
    
    for (let i = 0; i < rows - 1; i++) {
      for (let j = 0; j < cols - 1; j++) {
        const v1 = grid[i][j] || 0;
        const v2 = grid[i + 1][j] || 0;
        const v3 = grid[i + 1][j + 1] || 0;
        const v4 = grid[i][j + 1] || 0;
        
        const mask =
          (v1 > level ? 1 : 0) |
          (v2 > level ? 2 : 0) |
          (v3 > level ? 4 : 0) |
          (v4 > level ? 8 : 0);
        
        if (mask === 0 || mask === 15) continue;
        
        // Interpolar puntos de cruce
        const crossings = [];
        
        if ((v1 > level) !== (v2 > level)) {
          const t = (level - v1) / (v2 - v1);
          crossings.push({ x: j + t, y: i });
        }
        if ((v2 > level) !== (v3 > level)) {
          const t = (level - v2) / (v3 - v2);
          crossings.push({ x: j + 1, y: i + t });
        }
        if ((v3 > level) !== (v4 > level)) {
          const t = (level - v3) / (v4 - v3);
          crossings.push({ x: j + 1 - t, y: i + 1 });
        }
        if ((v4 > level) !== (v1 > level)) {
          const t = (level - v4) / (v1 - v4);
          crossings.push({ x: j, y: i + 1 - t });
        }
        
        if (crossings.length >= 2) {
          points.push(...crossings);
        }
      }
    }
    
    if (points.length > 2) {
      contours.push({
        level,
        points: points.map(p => ({ x: p.x, y: p.y })),
        color: getContourColor((level - min) / (max - min))
      });
    }
  }
  
  return contours;
};

// ============================================
// 3. COLOR POR NIVEL
// ============================================

const getContourColor = (normalized) => {
  if (normalized < 0.2) return '#0066ff';
  if (normalized < 0.4) return '#00ccff';
  if (normalized < 0.6) return '#00ff66';
  if (normalized < 0.8) return '#ffcc00';
  return '#ff3300';
};

// ============================================
// 4. EXPORTAR GRID COMPLETO A DXF
// ============================================

export const exportGridToDXF = (grid, bounds, filename = 'grounding_grid.dxf') => {
  let dxf = `0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
3
`;

  // Capas
  dxf += `0
LAYER
2
GRID
70
0
62
3
6
CONTINUOUS
0
LAYER
2
CONTOUR
70
0
62
5
6
CONTINUOUS
0
LAYER
2
TEXT
70
0
62
2
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  // Generar y exportar isolíneas
  const contours = generateContoursFromGrid(grid, 6);
  
  for (const contour of contours) {
    if (!contour.points || contour.points.length < 2) continue;
    
    dxf += `0
POLYLINE
8
CONTOUR
66
1
`;
    
    for (const point of contour.points) {
      const realX = bounds.minX + (point.x / grid[0].length) * (bounds.maxX - bounds.minX);
      const realY = bounds.minY + (point.y / grid.length) * (bounds.maxY - bounds.minY);
      
      dxf += `0
VERTEX
8
CONTOUR
10
${realX.toFixed(3)}
20
${realY.toFixed(3)}
30
0
`;
    }
    
    dxf += `0
SEQEND
`;
  }

  // Agregar etiquetas de nivel
  for (const contour of contours) {
    if (!contour.points || contour.points.length === 0) continue;
    
    const midPoint = contour.points[Math.floor(contour.points.length / 2)];
    const realX = bounds.minX + (midPoint.x / grid[0].length) * (bounds.maxX - bounds.minX);
    const realY = bounds.minY + (midPoint.y / grid.length) * (bounds.maxY - bounds.minY);
    
    dxf += `0
TEXT
8
TEXT
10
${realX.toFixed(3)}
20
${realY.toFixed(3)}
30
0
40
2.5
1
${contour.level.toFixed(0)} V
`;
  }

  dxf += `0
ENDSEC
0
EOF`;

  const blob = new Blob([dxf], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return dxf;
};

export default {
  generateDXFWithContours,
  generateContoursFromGrid,
  exportGridToDXF
};
