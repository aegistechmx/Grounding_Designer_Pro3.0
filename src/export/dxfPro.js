/**
 * Exportador DXF profesional con capas reales
 * Capas: MALLA_TIERRA, VARILLAS, NODOS, CONTOURS
 */

export const exportDXFPro = (grid, results, filename = 'grounding_pro.dxf') => {
  if (!grid || !grid.nodes || !Array.isArray(grid.nodes)) {
    console.error('exportDXFPro: grid o grid.nodes inválido');
    return null;
  }
  
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
  if (grid.conductors && Array.isArray(grid.conductors)) {
    for (const conductor of grid.conductors) {
      const fromNode = grid.nodes.find(n => n.id === conductor.from);
      const toNode = grid.nodes.find(n => n.id === conductor.to);
      
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
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
  
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  for (const node of nodes) {
    if (node.x !== undefined && !isNaN(node.x)) {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
    }
    if (node.y !== undefined && !isNaN(node.y)) {
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    }
  }
  
  // Si no se encontraron coordenadas válidas
  if (minX === Infinity) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
  
  return { minX, maxX, minY, maxY };
};

export const exportContoursToDXF = (contours, bounds, filename = 'contours.dxf') => {
  if (!contours || !Array.isArray(contours)) {
    console.error('exportContoursToDXF: contours inválido');
    return null;
  }
  
  let dxf = `0
SECTION
2
ENTITIES
`;
  
  for (const contour of contours) {
    if (!contour.points || !Array.isArray(contour.points)) continue;
    
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
