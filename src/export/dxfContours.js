/**
 * DXF Contours Export - Professional CAD Export
 * AutoCAD-compatible DXF export with curve support
 * Grounding Designer Pro - Professional Engineering Simulation
 */

/**
 * Export contours to DXF format
 * @param {Array} curves - Array of contour curves
 * @param {Object} options - Export options
 * @returns {string} DXF file content
 */
export function exportContoursDXF(curves, options = {}) {
  const {
    layers = true,
    colors = true,
    polyline = true,
    units = 'METERS'
  } = options;

  let dxf = `0
SECTION
2
HEADER
9
$INSUNITS
70
4
9
$MEASUREMENT
70
1
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
${curves.length + 1}
`;

  // Add layers for each contour level
  if (layers) {
    const uniqueLevels = [...new Set(curves.map(c => Math.round(c.level)))];
    uniqueLevels.forEach((level, idx) => {
      dxf += `0
LAYER
2
EQUIPOTENTIAL_${level}
70
0
62
${getDXFColor(level)}
6
CONTINUOUS
`;
    });
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

  // Export contours as polylines or lines
  curves.forEach(curve => {
    const layerName = layers ? `EQUIPOTENTIAL_${Math.round(curve.level)}` : '0';
    const color = colors ? getDXFColor(curve.level) : 7;

    curve.segments.forEach(seg => {
      if (polyline && seg.length > 2) {
        // Export as polyline for smoother curves
        dxf += exportPolyline(seg, layerName, color, curve.thickness);
      } else {
        // Export as individual lines
        dxf += exportLines(seg, layerName, color, curve.thickness);
      }
    });
  });

  dxf += `0
ENDSEC
0
EOF
`;

  return dxf;
}

/**
 * Export segment as polyline
 * @param {Array} seg - Segment points
 * @param {string} layer - Layer name
 * @param {number} color - DXF color index
 * @param {number} thickness - Line thickness
 * @returns {string} DXF polyline entity
 */
function exportPolyline(seg, layer, color, thickness) {
  let dxf = `0
POLYLINE
8
${layer}
62
${color}
6
CONTINUOUS
40
${thickness || 0}
70
1
`;

  seg.forEach(point => {
    dxf += `0
VERTEX
8
${layer}
10
${point.x.toFixed(6)}
20
${point.y.toFixed(6)}
30
0
`;
  });

  dxf += `0
SEQEND
`;

  return dxf;
}

/**
 * Export segment as lines
 * @param {Array} seg - Segment points
 * @param {string} layer - Layer name
 * @param {number} color - DXF color index
 * @param {number} thickness - Line thickness
 * @returns {string} DXF line entities
 */
function exportLines(seg, layer, color, thickness) {
  let dxf = '';

  for (let i = 0; i < seg.length - 1; i++) {
    const p1 = seg[i];
    const p2 = seg[i + 1];

    dxf += `0
LINE
8
${layer}
62
${color}
6
CONTINUOUS
40
${thickness || 0}
10
${p1.x.toFixed(6)}
20
${p1.y.toFixed(6)}
30
0
11
${p2.x.toFixed(6)}
21
${p2.y.toFixed(6)}
31
0
`;
  }

  return dxf;
}

/**
 * Get DXF color index based on voltage level
 * @param {number} level - Voltage level
 * @returns {number} DXF color index
 */
function getDXFColor(level) {
  // DXF color indices: 1=red, 2=yellow, 3=green, 4=cyan, 5=blue, 6=magenta, 7=white
  // Map voltage levels to colors (ETAP-style: green->yellow->red)
  const normalized = (level % 1000) / 1000;
  
  if (normalized < 0.33) {
    return 3; // Green
  } else if (normalized < 0.66) {
    return 2; // Yellow
  } else {
    return 1; // Red
  }
}

/**
 * Export contours with spline curves (LWPOLYLINE)
 * @param {Array} curves - Array of contour curves
 * @param {Object} options - Export options
 * @returns {string} DXF file content
 */
export function exportContoursDXFSpline(curves, options = {}) {
  const {
    layers = true,
    colors = true,
    units = 'METERS'
  } = options;

  let dxf = `0
SECTION
2
HEADER
9
$INSUNITS
70
4
9
$MEASUREMENT
70
1
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
${curves.length + 1}
`;

  if (layers) {
    const uniqueLevels = [...new Set(curves.map(c => Math.round(c.level)))];
    uniqueLevels.forEach((level, idx) => {
      dxf += `0
LAYER
2
EQUIPOTENTIAL_${level}
70
0
62
${getDXFColor(level)}
6
CONTINUOUS
`;
    });
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

  // Export as LWPOLYLINE with spline fit
  curves.forEach(curve => {
    const layerName = layers ? `EQUIPOTENTIAL_${Math.round(curve.level)}` : '0';
    const color = colors ? getDXFColor(curve.level) : 7;

    curve.segments.forEach(seg => {
      if (seg.length > 2) {
        dxf += exportLWPolylineSpline(seg, layerName, color, curve.thickness);
      }
    });
  });

  dxf += `0
ENDSEC
0
EOF
`;

  return dxf;
}

/**
 * Export as LWPOLYLINE with spline fit
 * @param {Array} seg - Segment points
 * @param {string} layer - Layer name
 * @param {number} color - DXF color index
 * @param {number} thickness - Line thickness
 * @returns {string} DXF LWPOLYLINE entity
 */
function exportLWPolylineSpline(seg, layer, color, thickness) {
  let dxf = `0
LWPOLYLINE
8
${layer}
62
${color}
6
CONTINUOUS
40
${thickness || 0}
90
${seg.length}
70
1
`;

  seg.forEach(point => {
    dxf += `10
${point.x.toFixed(6)}
20
${point.y.toFixed(6)}
`;
  });

  dxf += `0
ENDSEC
`;

  return dxf;
}

/**
 * Generate DXF header with metadata
 * @param {Object} metadata - Project metadata
 * @returns {string} DXF header
 */
export function generateDXFHeader(metadata = {}) {
  const {
    title = 'Grounding Grid Analysis',
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
$HANDSEED
5
0
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
$TEXTSTYLE
40
0
9
$LUNITS
70
2
9
$LUPREC
40
4
9
$INSUNITS
70
4
9
$MEASUREMENT
70
1
`;
}

export default {
  exportContoursDXF,
  exportContoursDXFSpline,
  generateDXFHeader
};
