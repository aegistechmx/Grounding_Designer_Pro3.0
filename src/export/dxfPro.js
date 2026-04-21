/**
 * Exportador DXF profesional con capas reales
 * Capas: MALLA_TIERRA, VARILLAS, NODOS, CONTOURS
 */

export const exportDXFPro = (grid, results, filename = 'grounding_pro.dxf') => {
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
6
0
LAYER
2
MALLA_TIERRA
70
0
62
3
0
LAYER
2
VARILLAS
70
0
62
1
0
LAYER
2
NODOS
70
0
62
7
0
LAYER
2
CONTOURS
70
0
62
4
0
LAYER
2
DIMENSIONES
70
0
62
2
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  // Exportar conductores (capa MALLA_TIERRA)
  for (const conductor of grid.conductors) {
    const fromNode = grid.nodes?.find(n => n.id === conductor.from);
    const toNode = grid.nodes?.find(n => n.id === conductor.to);
    
    if (fromNode && toNode) {
      dxf += `0
LINE
8
MALLA_TIERRA
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
  
  // Exportar varillas (capa VARILLAS)
  const rods = grid.nodes.filter(n => n.isRod);
  for (const rod of rods) {
    dxf += `0
CIRCLE
8
VARILLAS
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
  
  // Exportar nodos (capa NODOS)
  for (const node of grid.nodes) {
    dxf += `0
POINT
8
NODOS
10
${node.x.toFixed(3)}
20
${node.y.toFixed(3)}
30
${node.z || 0}
`;
  }
  
  // Exportar dimensiones de la malla (capa DIMENSIONES)
  const { minX, maxX, minY, maxY } = getBounds(grid.nodes);
  
  dxf += `0
LINE
8
DIMENSIONES
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
DIMENSIONES
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

const getBounds = (nodes) => {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x);
    minY = Math.min(minY, node.y);
    maxY = Math.max(maxY, node.y);
  }
  
  return { minX, maxX, minY, maxY };
};

export const exportContoursToDXF = (contours, bounds, filename = 'contours.dxf') => {
  let dxf = `0
SECTION
2
ENTITIES
`;
  
  for (const contour of contours) {
    for (const point of contour.points) {
      dxf += `0
POINT
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

export default {
  exportDXFPro,
  exportContoursToDXF
};
