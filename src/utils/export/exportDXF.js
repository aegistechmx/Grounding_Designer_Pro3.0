/**
 * Exportación DXF para Malla de Tierras - Versión Estable y Mejorada
 * Compatible con AutoCAD, LibreCAD, DraftSight
 */

export const generateDXF = (params, calculations) => {
  const { 
    gridLength = 11, 
    gridWidth = 11, 
    numParallel = 14, 
    numRods = 22 
  } = params || {};

  let dxf = `999
DXF generado por Grounding Grid Calculator - IEEE 80
0
SECTION
2
HEADER
9
$ACADVER
1
AC1021
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  const spacing = gridWidth / (numParallel - 1 || 1);

  // Líneas horizontales
  for (let i = 0; i < numParallel; i++) {
    const y = i * spacing;
    dxf += `0
LINE
8
MALLA
10
0
20
${y.toFixed(3)}
30
0
11
${gridWidth.toFixed(3)}
21
${y.toFixed(3)}
31
0
0
`;
  }

  // Líneas verticales
  for (let i = 0; i < numParallel; i++) {
    const x = i * spacing;
    dxf += `0
LINE
8
MALLA
10
${x.toFixed(3)}
20
0
30
0
11
${x.toFixed(3)}
21
${gridLength.toFixed(3)}
31
0
0
`;
  }

  // Varillas en perímetro
  const perimeter = 2 * (gridWidth + gridLength);
  let dist = 0;
  for (let i = 0; i < Math.min(numRods, 40); i++) {
    let x = 0, y = 0;
    if (dist < gridWidth) { x = dist; y = 0; }
    else if (dist < gridWidth + gridLength) { x = gridWidth; y = dist - gridWidth; }
    else if (dist < 2*gridWidth + gridLength) { x = 2*gridWidth + gridLength - dist; y = gridLength; }
    else { x = 0; y = dist - (2*gridWidth + gridLength); }

    dxf += `0
CIRCLE
8
VARILLAS
10
${x.toFixed(3)}
20
${y.toFixed(3)}
30
0
40
0.15
0
`;
    dist += perimeter / numRods;
  }

  dxf += `0
ENDSEC
0
EOF`;

  return dxf;
};

export const downloadDXF = (params, calculations) => {
  try {
    const dxfContent = generateDXF(params, calculations);
    const blob = new Blob([dxfContent], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Malla_Tierra_${new Date().toISOString().slice(0,10)}.dxf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('✅ DXF generado correctamente.\n\nArchivo descargado: Malla_Tierra_....dxf');
    return true;
  } catch (error) {
    console.error('Error generando DXF:', error);
    alert('❌ Error al generar el DXF:\n' + error.message);
    return false;
  }
};