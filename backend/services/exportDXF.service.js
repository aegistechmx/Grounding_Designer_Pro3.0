/**
 * DXF Export Service - AutoCAD Vector Export
 * ETAP-style professional DXF export for contour lines
 * Grounding Designer Pro - Professional Engineering Visualization
 */

/**
 * Export contours to DXF format for AutoCAD
 * @param {Array} contours - Array of contour lines (each is array of points with x, y)
 * @param {Array} levels - Array of voltage levels for each contour
 * @returns {string} DXF file content as string
 */
function exportContoursToDXF(contours, levels) {
  let dxf = `0
SECTION
2
ENTITIES
`;

  contours.forEach((line, i) => {
    const levelValue = levels[i] !== undefined ? levels[i].toFixed(2) : i;
    const layerName = `CONTOUR_${levelValue}`;

    dxf += `0
POLYLINE
8
${layerName}
66
1
70
0
`;

    line.forEach(p => {
      dxf += `0
VERTEX
8
${layerName}
10
${p.x.toFixed(4)}
20
${p.y.toFixed(4)}
30
0.0
`;
    });

    dxf += `0
SEQEND
`;
  });

  dxf += `0
ENDSEC
0
EOF
`;

  return dxf;
}

/**
 * Export contours to DXF with custom settings
 * @param {Array} contours - Array of contour lines
 * @param {Array} levels - Array of voltage levels
 * @param {Object} options - Export options
 * @returns {string} DXF file content
 */
function exportContoursToDXFWithOptions(contours, levels, options = {}) {
  const {
    layerPrefix = 'CONTOUR',
    includeZ = false,
    zValue = 0.0
  } = options;

  let dxf = `0
SECTION
2
ENTITIES
`;

  contours.forEach((line, i) => {
    const levelValue = levels[i] !== undefined ? levels[i].toFixed(2) : i;
    const layerName = `${layerPrefix}_${levelValue}`;

    dxf += `0
POLYLINE
8
${layerName}
66
1
70
0
`;

    line.forEach(p => {
      const z = includeZ ? (p.z !== undefined ? p.z.toFixed(4) : zValue.toFixed(4)) : '0.0';
      
      dxf += `0
VERTEX
8
${layerName}
10
${p.x.toFixed(4)}
20
${p.y.toFixed(4)}
30
${z}
`;
    });

    dxf += `0
SEQEND
`;
  });

  dxf += `0
ENDSEC
0
EOF
`;

  return dxf;
}

/**
 * Generate DXF header with metadata
 * @param {Object} metadata - Project metadata
 * @returns {string} DXF header
 */
function generateDXFHeader(metadata = {}) {
  const {
    projectName = 'Grounding Design',
    author = 'Grounding Designer Pro',
    date = new Date().toISOString()
  } = metadata;

  return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
9
$INSBASE
10
0.0
20
0.0
30
0.0
9
$EXTMIN
10
0.0
20
0.0
30
0.0
9
$EXTMAX
10
1000.0
20
1000.0
30
0.0
9
$LIMMIN
10
0.0
20
0.0
9
$LIMMAX
10
1000.0
20
1000.0
9
$LUNITS
70
2
9
$LUPREC
40
4
9
$LWDIRECTION
70
0
9
$LWSCALE
40
1.0
9
$TEXTSTYLE
70
STANDARD
40
0.0
41
1.0
9
$CLAYER
8
0
0
ENDSEC
`;
}

/**
 * Export complete DXF file with header and entities
 * @param {Array} contours - Array of contour lines
 * @param {Array} levels - Array of voltage levels
 * @param {Object} metadata - Project metadata
 * @param {Object} options - Export options
 * @returns {string} Complete DXF file content
 */
function exportCompleteDXF(contours, levels, metadata = {}, options = {}) {
  const header = generateDXFHeader(metadata);
  const entities = exportContoursToDXFWithOptions(contours, levels, options);

  return `${header}
${entities}
`;
}

module.exports = {
  exportContoursToDXF,
  exportContoursToDXFWithOptions,
  generateDXFHeader,
  exportCompleteDXF
};
