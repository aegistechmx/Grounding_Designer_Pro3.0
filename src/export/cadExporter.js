/**
 * Exportador de malla a formato DXF (AutoCAD)
 */

export const exportGridToDXF = (grid, filename = 'grounding_grid.dxf') => {
  let dxf = `0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  // Exportar conductores como líneas
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
  
  // Exportar varillas como círculos
  const rods = grid.nodes.filter(n => n.isRod);
  for (const rod of rods) {
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
  
  // Exportar nodos como puntos
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

export const exportResultsToDXF = (results, filename = 'grounding_results.dxf') => {
  let dxf = `0
SECTION
2
ENTITIES
`;
  
  // Exportar isolíneas de tensión
  const contours = generateContours(results.potentialField, [500, 1000, 1500, 2000, 2500]);
  
  for (const contour of contours) {
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

const generateContours = (potentialField, levels) => {
  // Simplificado - en producción usar marching squares
  return levels.map(level => ({
    level,
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 }
    ]
  }));
};

export default {
  exportGridToDXF,
  exportResultsToDXF
};