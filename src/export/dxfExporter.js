/**
 * Exportador DXF profesional con capas reales
 * Soporta: GRID, RODS, TEXT, DIMENSIONS
 */

// ============================================
// 1. EXPORTAR A DXF
// ============================================

export const exportDXF = (grid, filename = 'grounding_grid.dxf') => {
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
7
`;

  // Definir capas
  const layers = [
    { name: 'GRID', color: 3, description: 'Conductores de la malla' },
    { name: 'RODS', color: 1, description: 'Varillas de tierra' },
    { name: 'NODES', color: 7, description: 'Nodos de intersección' },
    { name: 'TEXT', color: 2, description: 'Textos y etiquetas' },
    { name: 'DIMENSIONS', color: 4, description: 'Dimensiones' },
    { name: 'CONTOURS', color: 5, description: 'Curvas equipotenciales' }
  ];
  
  for (const layer of layers) {
    dxf += `0
LAYER
2
${layer.name}
70
0
62
${layer.color}
6
CONTINUOUS
`;
  }
  
  dxf += `0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  // Exportar conductores (capa GRID)
  if (grid.conductors) {
    for (const conductor of grid.conductors) {
      const fromNode = grid.nodes?.find(n => n.id === conductor.from);
      const toNode = grid.nodes?.find(n => n.id === conductor.to);
      
      if (fromNode && toNode) {
        dxf += `0
LINE
8
GRID
10
${fromNode.x.toFixed(3)}
20
${fromNode.y.toFixed(3)}
30
${fromNode.z || 0}
11
${toNode.x.toFixed(3)}
21
${toNode.y.toFixed(3)}
31
${toNode.z || 0}
`;
      }
    }
  }
  
  // Exportar varillas (capa RODS)
  if (grid.rods) {
    for (const rod of grid.rods) {
      dxf += `0
CIRCLE
8
RODS
10
${rod.x.toFixed(3)}
20
${rod.y.toFixed(3)}
30
${rod.z || 0}
40
0.15
`;
    }
  }
  
  // Exportar nodos (capa NODES)
  if (grid.nodes) {
    for (const node of grid.nodes) {
      dxf += `0
POINT
8
NODES
10
${node.x.toFixed(3)}
20
${node.y.toFixed(3)}
30
${node.z || 0}
`;
    }
  }
  
  // Exportar dimensiones (capa DIMENSIONS)
  if (grid.bounds) {
    const { minX, maxX, minY, maxY } = grid.bounds;
    
    dxf += `0
LINE
8
DIMENSIONS
10
${minX}
20
${minY}
30
0
11
${maxX}
21
${minY}
31
0
0
LINE
8
DIMENSIONS
10
${maxX}
20
${minY}
30
0
11
${maxX}
21
${maxY}
31
0
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
// 2. EXPORTAR RESULTADOS A DXF
// ============================================

export const exportResultsToDXF = (results, filename = 'grounding_results.dxf') => {
  let dxf = `0
SECTION
2
ENTITIES
`;
  
  // Exportar isolíneas de tensión
  if (results.contours) {
    for (const contour of results.contours) {
      dxf += `0
POLYLINE
8
CONTOURS
66
1
`;
      for (const point of contour.points) {
        dxf += `0
VERTEX
8
CONTOURS
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
  a.click();
  URL.revokeObjectURL(url);
  
  return dxf;
};

// ============================================
// 3. EXPORTAR HEATMAP A IMAGEN
// ============================================

export const exportHeatmapToImage = (canvas, filename = 'heatmap.png') => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

export default {
  exportDXF,
  exportResultsToDXF,
  exportHeatmapToImage
};
