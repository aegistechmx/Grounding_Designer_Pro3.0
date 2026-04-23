/**
 * Professional DXF Export Service
 * Enhanced CAD integration for AutoCAD/ETAP workflow
 * Compatible with professional CAD software
 */

export const dxfProService = {
  /**
   * Export professional DXF with CAD integration
   */
  exportToDXF(gridDesign, projectName, calculations, options = {}) {
    const {
      includeDimensions = true,
      includeTitleBlock = true,
      includeLayers = true,
      includeBlocks = true,
      units = 'meters'
    } = options;

    const lines = [];
    
    // DXF Header
    lines.push('0', 'SECTION', '2', 'HEADER');
    lines.push('9', '$INSUNITS', '70', '4'); // Metric units
    lines.push('9', '$MEASUREMENT', '70', '1'); // Metric
    lines.push('0', 'ENDSEC');
    
    // TABLES Section (Layers, Linetypes, Styles)
    lines.push('0', 'SECTION', '2', 'TABLES');
    
    // LTYPE table
    lines.push('0', 'TABLE', '2', 'LTYPE', '70', '2');
    lines.push('0', 'LTYPE', '2', 'CONTINUOUS', '70', '0', '3', 'Solid line', '72', '65', '73', '0', '40', '0.0');
    lines.push('0', 'LTYPE', '2', 'DASHED', '70', '0', '3', 'Dashed line', '72', '65', '73', '2', '40', '15.0', '49', '5.0', '49', '-3.0');
    lines.push('0', 'ENDTAB');
    
    // LAYER table
    lines.push('0', 'TABLE', '2', 'LAYER', '70', '6');
    lines.push('0', 'LAYER', '2', 'CONDUCTORS', '70', '0', '62', '3', '6', 'CONTINUOUS'); // Green
    lines.push('0', 'LAYER', '2', 'RODS', '70', '0', '62', '1', '6', 'CONTINUOUS'); // Red
    lines.push('0', 'LAYER', '2', 'DIMENSIONS', '70', '0', '62', '7', '6', 'CONTINUOUS'); // White
    lines.push('0', 'LAYER', '2', 'ANNOTATION', '70', '0', '62', '7', '6', 'CONTINUOUS'); // White
    lines.push('0', 'LAYER', '2', 'TITLE_BLOCK', '70', '0', '62', '8', '6', 'CONTINUOUS'); // Dark gray
    lines.push('0', 'LAYER', '2', 'GRID', '70', '0', '62', '9', '6', 'DASHED'); // Light gray dashed
    lines.push('0', 'ENDTAB');
    
    // STYLE table
    lines.push('0', 'TABLE', '2', 'STYLE', '70', '1');
    lines.push('0', 'STYLE', '2', 'STANDARD', '70', '0', '40', '0.0', '41', '1.0', '50', '0.0', '71', '0', '42', '2.5', '3', 'txt', '4', '');
    lines.push('0', 'ENDTAB');
    
    lines.push('0', 'ENDSEC');
    
    // BLOCKS Section (Reusable elements)
    if (includeBlocks) {
      lines.push('0', 'SECTION', '2', 'BLOCKS');
      
      // Rod block
      lines.push('0', 'BLOCK', '8', '0', '2', 'ROD_SYMBOL', '70', '0', '10', '0.0', '20', '0.0', '30', '0.0');
      lines.push('0', 'CIRCLE', '8', 'RODS', '10', '0.0', '20', '0.0', '30', '0.0', '40', '0.1');
      lines.push('0', 'LINE', '8', 'RODS', '10', '-0.05', '20', '0.0', '30', '0.0', '11', '0.05', '21', '0.0', '31', '0.0');
      lines.push('0', 'LINE', '8', 'RODS', '10', '0.0', '20', '-0.05', '30', '0.0', '11', '0.0', '21', '0.05', '31', '0.0');
      lines.push('0', 'ENDBLK');
      
      lines.push('0', 'ENDSEC');
    }
    
    // ENTITIES Section
    lines.push('0', 'SECTION', '2', 'ENTITIES');
    
    const { length, width, nx, ny, numRods, rodLength, depth } = gridDesign;
    const gridLength = Math.max(1, length || 30);
    const gridWidth = Math.max(1, width || 16);
    const nxSafe = Math.max(1, nx || 8);
    const nySafe = Math.max(1, ny || 8);
    const dx = gridLength / nxSafe;
    const dy = gridWidth / nySafe;
    
    // Grid reference lines (if enabled)
    if (includeLayers) {
      for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * gridLength;
        lines.push(
          '0', 'LINE', '8', 'GRID',
          '10', x.toFixed(3), '20', '0', '30', '0',
          '11', x.toFixed(3), '21', gridWidth.toFixed(3), '31', '0'
        );
      }
      for (let j = 0; j <= 10; j++) {
        const y = (j / 10) * gridWidth;
        lines.push(
          '0', 'LINE', '8', 'GRID',
          '10', '0', '20', y.toFixed(3), '30', '0',
          '11', gridLength.toFixed(3), '21', y.toFixed(3), '31', '0'
        );
      }
    }
    
    // Horizontal conductors
    for (let i = 0; i <= nxSafe; i++) {
      const x = i * dx;
      lines.push(
        '0', 'LINE', '8', 'CONDUCTORS',
        '10', x.toFixed(3), '20', '0', '30', depth,
        '11', x.toFixed(3), '21', gridWidth.toFixed(3), '31', depth
      );
    }
    
    // Vertical conductors
    for (let j = 0; j <= nySafe; j++) {
      const y = j * dy;
      lines.push(
        '0', 'LINE', '8', 'CONDUCTORS',
        '10', '0', '20', y.toFixed(3), '30', depth,
        '11', gridLength.toFixed(3), '21', y.toFixed(3), '31', depth
      );
    }
    
    // Rod positions
    const rodPositions = [];
    rodPositions.push([0, 0], [gridLength, 0], [0, gridWidth], [gridLength, gridWidth]);
    
    if (numRods > 4) {
      rodPositions.push([gridLength/2, 0], [gridLength/2, gridWidth], [0, gridWidth/2], [gridLength, gridWidth/2]);
    }
    
    if (numRods > 8) {
      for (let i = 1; i < nxSafe; i++) {
        for (let j = 1; j < nySafe; j++) {
          if (rodPositions.length < numRods) {
            rodPositions.push([i * dx, j * dy]);
          }
        }
      }
    }
    
    // Draw rods
    for (let i = 0; i < Math.min(numRods, rodPositions.length); i++) {
      const [x, y] = rodPositions[i];
      lines.push(
        '0', 'LINE', '8', 'RODS',
        '10', x.toFixed(3), '20', y.toFixed(3), '30', depth,
        '11', x.toFixed(3), '21', y.toFixed(3), '31', -rodLength
      );
      
      // Add rod symbol (block reference)
      if (includeBlocks) {
        lines.push(
          '0', 'INSERT', '8', 'RODS',
          '2', 'ROD_SYMBOL',
          '10', x.toFixed(3), '20', y.toFixed(3), '30', depth,
          '41', '1.0', '42', '1.0', '43', '1.0'
        );
      }
    }
    
    // Dimensions
    if (includeDimensions) {
      // Length dimension
      lines.push(
        '0', 'DIMENSION', '8', 'DIMENSIONS',
        '10', '0', '20', gridWidth + 2, '30', 0,
        '13', gridLength, '23', gridWidth + 2, '33', 0,
        '14', '0', '24', gridWidth + 2, '34', 0,
        '1', `${gridLength.toFixed(2)} m`
      );
      
      // Width dimension
      lines.push(
        '0', 'DIMENSION', '8', 'DIMENSIONS',
        '10', gridLength + 2, '20', '0', '30', 0,
        '13', gridLength + 2, '23', gridWidth, '33', 0,
        '14', gridLength + 2, '24', '0', '34', 0,
        '1', `${gridWidth.toFixed(2)} m`
      );
    }
    
    // Title block
    if (includeTitleBlock) {
      const titleX = gridLength + 5;
      const titleY = gridWidth;
      
      // Title block border
      lines.push(
        '0', 'LWPOLYLINE', '8', 'TITLE_BLOCK', '90', '1', '70', '1',
        '10', titleX, '20', titleY,
        '10', titleX + 20, '20', titleY,
        '10', titleX + 20, '20', titleY - 15,
        '10', titleX, '20', titleY - 15
      );
      
      // Project info
      const infoTexts = [
        { text: `PROYECTO: ${projectName || 'Grounding Design'}`, y: titleY - 2 },
        { text: `Rg = ${calculations?.Rg?.toFixed(3) || 'N/A'} Ω`, y: titleY - 5 },
        { text: `GPR = ${calculations?.GPR?.toFixed(0) || 'N/A'} V`, y: titleY - 8 },
        { text: `Fecha: ${new Date().toLocaleDateString()}`, y: titleY - 11 },
        { text: `Grounding Designer Pro`, y: titleY - 14 }
      ];
      
      infoTexts.forEach(({ text, y }) => {
        lines.push(
          '0', 'TEXT', '8', 'ANNOTATION',
          '10', titleX + 1, '20', y, '30', 0,
          '40', 0.8,
          '1', text
        );
      });
    }
    
    // Compliance annotation
    if (calculations?.complies !== undefined) {
      const complianceText = calculations.complies ? 'CUMPLE IEEE 80' : 'NO CUMPLE IEEE 80';
      const color = calculations.complies ? '3' : '1'; // Green or Red
      
      lines.push(
        '0', 'TEXT', '8', 'ANNOTATION', '62', color,
        '10', gridLength / 2, '20', gridWidth + 3, '30', 0,
        '40', 1.2,
        '1', complianceText
      );
    }
    
    lines.push('0', 'ENDSEC', '0', 'EOF');
    
    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'grounding_grid'}_PRO_${new Date().toISOString().slice(0,19)}.dxf`;
    a.click();
    URL.revokeObjectURL(url);
    
    return true;
  },

  /**
   * Export to ETAP-compatible format
   */
  exportToETAP(gridDesign, projectName, calculations) {
    // ETAP uses similar DXF format but with specific layer requirements
    return this.exportToDXF(gridDesign, projectName, calculations, {
      includeDimensions: true,
      includeTitleBlock: true,
      includeLayers: true,
      includeBlocks: true
    });
  },

  /**
   * Export with custom blocks for specific CAD software
   */
  exportWithCustomBlocks(gridDesign, projectName, calculations, customBlocks) {
    // Allow custom block definitions for specific CAD workflows
    return this.exportToDXF(gridDesign, projectName, calculations, {
      includeBlocks: true,
      customBlocks
    });
  }
};
