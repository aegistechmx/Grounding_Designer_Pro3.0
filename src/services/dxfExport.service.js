// src/services/dxfExport.service.js
export const dxfExportService = {
  /**
   * Exporta la malla de tierra a formato DXF (AutoCAD)
   */
  exportToDXF(gridDesign, projectName, calculations) {
    const lines = [];
    
    // Cabecera DXF
    lines.push('0', 'SECTION', '2', 'HEADER');
    lines.push('0', 'ENDSEC');
    lines.push('0', 'SECTION', '2', 'ENTITIES');
    
    const { length, width, nx, ny, numRods, rodLength, depth } = gridDesign;
    const gridLength = Math.max(1, length || 30);
    const gridWidth = Math.max(1, width || 16);
    const nxSafe = Math.max(1, nx || 8);
    const nySafe = Math.max(1, ny || 8);
    const dx = gridLength / nxSafe;
    const dy = gridWidth / nySafe;
    
    // Capa para conductores
    lines.push('0', 'LAYER', '2', 'CONDUCTORES', '70', '0', '62', '3', '6', 'CONTINUOUS');
    
    // Líneas horizontales (conductores en X)
    for (let i = 0; i <= nxSafe; i++) {
      const x = i * dx;
      lines.push(
        '0', 'LINE', '8', 'CONDUCTORES',
        '10', x.toFixed(3), '20', '0', '30', depth,
        '11', x.toFixed(3), '21', gridWidth.toFixed(3), '31', depth
      );
    }
    
    // Líneas verticales (conductores en Y)
    for (let j = 0; j <= nySafe; j++) {
      const y = j * dy;
      lines.push(
        '0', 'LINE', '8', 'CONDUCTORES',
        '10', '0', '20', y.toFixed(3), '30', depth,
        '11', gridLength.toFixed(3), '21', y.toFixed(3), '31', depth
      );
    }
    
    // Capa para varillas
    lines.push('0', 'LAYER', '2', 'VARILLAS', '70', '0', '62', '1', '6', 'CONTINUOUS');
    
    // Posiciones de varillas (perímetro y puntos intermedios)
    const rodPositions = [];
    
    // Esquinas
    rodPositions.push([0, 0], [gridLength, 0], [0, gridWidth], [gridLength, gridWidth]);
    
    // Puntos medios de los lados
    if (numRods > 4) {
      rodPositions.push([gridLength/2, 0], [gridLength/2, gridWidth], [0, gridWidth/2], [gridLength, gridWidth/2]);
    }
    
    // Puntos interiores adicionales
    if (numRods > 8) {
      for (let i = 1; i < nxSafe; i++) {
        for (let j = 1; j < nySafe; j++) {
          if (rodPositions.length < numRods) {
            rodPositions.push([i * dx, j * dy]);
          }
        }
      }
    }
    
    // Dibujar varillas como cilindros (líneas verticales)
    for (let i = 0; i < Math.min(numRods, rodPositions.length); i++) {
      const [x, y] = rodPositions[i];
      lines.push(
        '0', 'LINE', '8', 'VARILLAS',
        '10', x.toFixed(3), '20', y.toFixed(3), '30', depth,
        '11', x.toFixed(3), '21', y.toFixed(3), '31', -rodLength
      );
    }
    
    // Información del proyecto como texto
    lines.push('0', 'LAYER', '2', 'TEXTO', '70', '0', '62', '7');
    
    const infoTexts = [
      `Proyecto: ${projectName || 'Grounding Design'}`,
      `Rg = ${calculations?.Rg?.toFixed(3) || 'N/A'} Ω`,
      `GPR = ${calculations?.GPR?.toFixed(0) || 'N/A'} V`,
      `Fecha: ${new Date().toLocaleDateString()}` 
    ];
    
    infoTexts.forEach((text, idx) => {
      lines.push(
        '0', 'TEXT', '8', 'TEXTO',
        '10', 10, '20', (gridWidth + 10 + (idx * 5)).toString(), '30', 0,
        '40', 2.5,
        '1', text
      );
    });
    
    lines.push('0', 'ENDSEC', '0', 'EOF');
    
    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'grounding_grid'}_${new Date().toISOString().slice(0,19)}.dxf`;
    a.click();
    URL.revokeObjectURL(url);
    
    return true;
  },
  
  /**
   * Exporta resultados a CSV para Excel
   */
  exportToCSV(calculations, params, projectName) {
    const rows = [
      ['GROUNDING DESIGNER PRO - INFORME TÉCNICO'],
      [''],
      ['DATOS DEL PROYECTO'],
      ['Parámetro', 'Valor', 'Unidad'],
      ['Nombre del Proyecto', projectName || 'No especificado', ''],
      ['Fecha', new Date().toLocaleDateString(), ''],
      [''],
      ['PARÁMETROS DE ENTRADA'],
      ['Parámetro', 'Valor', 'Unidad'],
      ['Largo de malla', params?.gridLength || 'N/A', 'm'],
      ['Ancho de malla', params?.gridWidth || 'N/A', 'm'],
      ['Profundidad', params?.gridDepth || 'N/A', 'm'],
      ['Número de conductores X', params?.numParallel || 'N/A', ''],
      ['Número de conductores Y', params?.numParallelY || 'N/A', ''],
      ['Número de varillas', params?.numRods || 'N/A', ''],
      ['Longitud de varillas', params?.rodLength || 'N/A', 'm'],
      ['Resistividad del suelo', params?.soilResistivity || 'N/A', 'Ω·m'],
      ['Resistividad superficial', params?.surfaceLayer || 'N/A', 'Ω·m'],
      ['Corriente de falla', params?.faultCurrent || 'N/A', 'A'],
      ['Duración de falla', params?.faultDuration || 'N/A', 's'],
      [''],
      ['RESULTADOS DE CÁLCULO'],
      ['Métrica', 'Valor', 'Límite', 'Estado'],
      ['Resistencia de Malla (Rg)', `${calculations?.Rg?.toFixed(3) || 'N/A'} Ω`, '< 5 Ω', calculations?.Rg < 5 ? 'CUMPLE' : 'REVISAR'],
      ['GPR', `${calculations?.GPR?.toFixed(0) || 'N/A'} V`, 'N/A', ''],
      ['Tensión de Contacto (Em)', `${calculations?.Em?.toFixed(0) || 'N/A'} V`, `${calculations?.Etouch70?.toFixed(0) || 'N/A'} V`, calculations?.Em <= calculations?.Etouch70 ? 'CUMPLE' : 'NO CUMPLE'],
      ['Tensión de Paso (Es)', `${calculations?.Es?.toFixed(0) || 'N/A'} V`, `${calculations?.Estep70?.toFixed(0) || 'N/A'} V`, calculations?.Es <= calculations?.Estep70 ? 'CUMPLE' : 'NO CUMPLE'],
      [''],
      ['ESTADO GLOBAL'],
      ['Cumple IEEE 80', calculations?.complies ? 'SÍ' : 'NO', ''],
      ['Cumple NOM-001', calculations?.touchSafe70 && calculations?.stepSafe70 ? 'SÍ' : 'NO', ''],
      ['Recomendaciones', calculations?.complies ? 'Diseño aprobado' : 'Aumentar conductores o varillas', '']
    ];
    
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'grounding_results'}_${new Date().toISOString().slice(0,19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
};
