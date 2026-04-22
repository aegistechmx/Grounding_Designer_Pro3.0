/**
 * Exportación profesional a DXF (AutoCAD)
 * Incluye: Plano de malla, tablas de resultados, especificaciones, reporte ejecutivo, vista isométrica, símbolos IEEE
 */

export const generateDXF = (params, calculations) => {
  const { 
    gridLength, 
    gridWidth, 
    numParallel, 
    numRods, 
    rodLength, 
    gridDepth,
    surfaceDepth,
    soilResistivity,
    surfaceLayer,
    transformerKVA,
    primaryVoltage,
    secondaryVoltage,
    transformerImpedance,
    faultDuration,
    currentDivisionFactor,
    projectName,
    projectLocation,
    engineerName,
    clientName
  } = params;
  
  const { 
    nx, ny, Rg, GPR, Em, Es, Ig, faultCurrent,
    Etouch70, Estep70, touchSafe70, stepSafe70, complies,
    totalConductor, totalRodLength, gridArea, minConductorArea, selectedConductor
  } = calculations;
  
  const spacingX = gridWidth / Math.max(1, nx - 1);
  const spacingY = gridLength / Math.max(1, ny - 1);
  const safetyMarginTouch = Etouch70 > 0 ? ((Etouch70 - Em) / Etouch70 * 100).toFixed(1) : '0';
  const safetyMarginStep = Estep70 > 0 ? ((Estep70 - Es) / Estep70 * 100).toFixed(1) : '0';
  
  let dxf = '';
  
  // ============================================
  // HEADER
  // ============================================
  dxf += '0\n';
  dxf += 'SECTION\n';
  dxf += '2\n';
  dxf += 'HEADER\n';
  dxf += '9\n';
  dxf += '$ACADVER\n';
  dxf += '1\n';
  dxf += 'AC1009\n';
  dxf += '0\n';
  dxf += 'ENDSEC\n';
  
  // ============================================
  // TABLAS (Capas)
  // ============================================
  dxf += '0\n';
  dxf += 'SECTION\n';
  dxf += '2\n';
  dxf += 'TABLES\n';
  dxf += '0\n';
  dxf += 'TABLE\n';
  dxf += '2\n';
  dxf += 'LAYER\n';
  dxf += '70\n';
  dxf += '5\n';
  dxf += '0\n';
  dxf += 'LAYER\n';
  dxf += '2\n';
  dxf += '0\n';
  dxf += '70\n';
  dxf += '0\n';
  dxf += '62\n';
  dxf += '7\n';
  dxf += '6\n';
  dxf += 'CONTINUOUS\n';
  dxf += '0\n';
  dxf += 'ENDTAB\n';
  dxf += '0\n';
  dxf += 'ENDSEC\n';
  
  // ============================================
  // ENTIDADES
  // ============================================
  dxf += '0\n';
  dxf += 'SECTION\n';
  dxf += '2\n';
  dxf += 'ENTITIES\n';
  
  // ------------------------------------------------------------------
  // 1. MARCO PRINCIPAL DEL PLANO
  // ------------------------------------------------------------------
  const margin = 10;
  const frameW = Math.max(gridWidth + margin * 2, 280);
  const frameH = gridLength + 140;
  
  // Línea 1
  dxf += '0\n';
  dxf += 'LINE\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (-margin).toString() + '\n';
  dxf += '20\n';
  dxf += (-margin).toString() + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '11\n';
  dxf += frameW.toString() + '\n';
  dxf += '21\n';
  dxf += (-margin).toString() + '\n';
  dxf += '31\n';
  dxf += '0.0\n';
  
  // Línea 2
  dxf += '0\n';
  dxf += 'LINE\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += frameW.toString() + '\n';
  dxf += '20\n';
  dxf += (-margin).toString() + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '11\n';
  dxf += frameW.toString() + '\n';
  dxf += '21\n';
  dxf += frameH.toString() + '\n';
  dxf += '31\n';
  dxf += '0.0\n';
  
  // Línea 3
  dxf += '0\n';
  dxf += 'LINE\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += frameW.toString() + '\n';
  dxf += '20\n';
  dxf += frameH.toString() + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '11\n';
  dxf += (-margin).toString() + '\n';
  dxf += '21\n';
  dxf += frameH.toString() + '\n';
  dxf += '31\n';
  dxf += '0.0\n';
  
  // Línea 4
  dxf += '0\n';
  dxf += 'LINE\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (-margin).toString() + '\n';
  dxf += '20\n';
  dxf += frameH.toString() + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '11\n';
  dxf += (-margin).toString() + '\n';
  dxf += '21\n';
  dxf += (-margin).toString() + '\n';
  dxf += '31\n';
  dxf += '0.0\n';
  
  // Texto de prueba
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += '0.0\n';
  dxf += '20\n';
  dxf += '0.0\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '1.0\n';
  dxf += '1\n';
  dxf += 'PRUEBA DXF\n';
  
  // ------------------------------------------------------------------
  // 2. MALLA DE TIERRAS
  // ------------------------------------------------------------------
  // Líneas horizontales
  for (let i = 0; i < ny; i++) {
    const y = i * spacingY;
    dxf += '0\n';
    dxf += 'LINE\n';
    dxf += '8\n';
    dxf += '0\n';
    dxf += '10\n';
    dxf += '0.0\n';
    dxf += '20\n';
    dxf += y.toFixed(3) + '\n';
    dxf += '30\n';
    dxf += '0.0\n';
    dxf += '11\n';
    dxf += gridWidth.toFixed(3) + '\n';
    dxf += '21\n';
    dxf += y.toFixed(3) + '\n';
    dxf += '31\n';
    dxf += '0.0\n';
  }
  
  // Líneas verticales
  for (let i = 0; i < nx; i++) {
    const x = i * spacingX;
    dxf += '0\n';
    dxf += 'LINE\n';
    dxf += '8\n';
    dxf += '0\n';
    dxf += '10\n';
    dxf += x.toFixed(3) + '\n';
    dxf += '20\n';
    dxf += '0.0\n';
    dxf += '30\n';
    dxf += '0.0\n';
    dxf += '11\n';
    dxf += x.toFixed(3) + '\n';
    dxf += '21\n';
    dxf += gridLength.toFixed(3) + '\n';
    dxf += '31\n';
    dxf += '0.0\n';
  }
  
  // ------------------------------------------------------------------
  // 3. VARILLAS CON SÍMBOLOS IEEE
  // ------------------------------------------------------------------
  const perimeter = 2 * (gridWidth + gridLength);
  const rodSpacing = numRods > 0 ? perimeter / numRods : perimeter;
  let currentDistance = 0;
  
  for (let i = 0; i < Math.min(numRods, 30); i++) {
    let pos = currentDistance;
    let x, y;
    
    if (pos < gridWidth) {
      x = pos;
      y = 0;
    } else if (pos < gridWidth + gridLength) {
      x = gridWidth;
      y = pos - gridWidth;
    } else if (pos < 2 * gridWidth + gridLength) {
      x = 2 * gridWidth + gridLength - pos;
      y = gridLength;
    } else {
      x = 0;
      y = pos - (2 * gridWidth + gridLength);
    }
    
    // Círculo de la varilla
    dxf += '0\n';
    dxf += 'CIRCLE\n';
    dxf += '8\n';
    dxf += '0\n';
    dxf += '10\n';
    dxf += x.toFixed(3) + '\n';
    dxf += '20\n';
    dxf += y.toFixed(3) + '\n';
    dxf += '30\n';
    dxf += '0.0\n';
    dxf += '40\n';
    dxf += '0.15\n';
    
    // Símbolo de tierra IEEE (líneas horizontales)
    const groundSymbolX = x + 0.25;
    const groundSymbolY = y - 0.3;
    
    // Línea vertical
    dxf += '0\n';
    dxf += 'LINE\n';
    dxf += '8\n';
    dxf += '0\n';
    dxf += '10\n';
    dxf += groundSymbolX.toFixed(3) + '\n';
    dxf += '20\n';
    dxf += (groundSymbolY + 0.3).toFixed(3) + '\n';
    dxf += '30\n';
    dxf += '0.0\n';
    dxf += '11\n';
    dxf += groundSymbolX.toFixed(3) + '\n';
    dxf += '21\n';
    dxf += groundSymbolY.toFixed(3) + '\n';
    dxf += '31\n';
    dxf += '0.0\n';
    
    // Línea horizontal superior
    dxf += '0\n';
    dxf += 'LINE\n';
    dxf += '8\n';
    dxf += '0\n';
    dxf += '10\n';
    dxf += (groundSymbolX - 0.2).toFixed(3) + '\n';
    dxf += '20\n';
    dxf += groundSymbolY.toFixed(3) + '\n';
    dxf += '30\n';
    dxf += '0.0\n';
    dxf += '11\n';
    dxf += (groundSymbolX + 0.2).toFixed(3) + '\n';
    dxf += '21\n';
    dxf += groundSymbolY.toFixed(3) + '\n';
    dxf += '31\n';
    dxf += '0.0\n';
    
    // Línea horizontal media
    dxf += '0\n';
    dxf += 'LINE\n';
    dxf += '8\n';
    dxf += '0\n';
    dxf += '10\n';
    dxf += (groundSymbolX - 0.15).toFixed(3) + '\n';
    dxf += '20\n';
    dxf += (groundSymbolY - 0.05).toFixed(3) + '\n';
    dxf += '30\n';
    dxf += '0.0\n';
    dxf += '11\n';
    dxf += (groundSymbolX + 0.15).toFixed(3) + '\n';
    dxf += '21\n';
    dxf += (groundSymbolY - 0.05).toFixed(3) + '\n';
    dxf += '31\n';
    dxf += '0.0\n';
    
    // Línea horizontal inferior
    dxf += '0\n';
    dxf += 'LINE\n';
    dxf += '8\n';
    dxf += '0\n';
    dxf += '10\n';
    dxf += (groundSymbolX - 0.1).toFixed(3) + '\n';
    dxf += '20\n';
    dxf += (groundSymbolY - 0.1).toFixed(3) + '\n';
    dxf += '30\n';
    dxf += '0.0\n';
    dxf += '11\n';
    dxf += (groundSymbolX + 0.1).toFixed(3) + '\n';
    dxf += '21\n';
    dxf += (groundSymbolY - 0.1).toFixed(3) + '\n';
    dxf += '31\n';
    dxf += '0.0\n';
    
    // Texto de etiqueta
    dxf += '0\n';
    dxf += 'TEXT\n';
    dxf += '8\n';
    dxf += '0\n';
    dxf += '10\n';
    dxf += (x + 0.25).toFixed(3) + '\n';
    dxf += '20\n';
    dxf += (y + 0.25).toFixed(3) + '\n';
    dxf += '30\n';
    dxf += '0.0\n';
    dxf += '40\n';
    dxf += '0.2\n';
    dxf += '1\n';
    dxf += 'V' + (i + 1) + '\n';
    
    currentDistance += rodSpacing;
    if (currentDistance > perimeter) currentDistance -= perimeter;
  }
  
  // ------------------------------------------------------------------
  // 4. COTAS (Texto simple)
  // ------------------------------------------------------------------
  // Cota horizontal
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (gridWidth / 2).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += '-2.0\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.3\n';
  dxf += '1\n';
  dxf += 'L = ' + gridWidth.toFixed(2) + ' m\n';
  
  // Cota vertical
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += '-2.0\n';
  dxf += '20\n';
  dxf += (gridLength / 2).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.3\n';
  dxf += '1\n';
  dxf += 'W = ' + gridLength.toFixed(2) + ' m\n';
  
  // ------------------------------------------------------------------
  // 5. RESULTADOS PRINCIPALES
  // ------------------------------------------------------------------
  const resultsY = gridLength + 5;
  
  // Resistencia de malla
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += '0.0\n';
  dxf += '20\n';
  dxf += resultsY.toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.25\n';
  dxf += '1\n';
  dxf += 'Rg = ' + (Rg?.toFixed(3) || 'N/A') + ' Ω\n';
  
  // GPR
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += '0.0\n';
  dxf += '20\n';
  dxf += (resultsY + 3).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.25\n';
  dxf += '1\n';
  dxf += 'GPR = ' + (GPR?.toFixed(0) || 'N/A') + ' V\n';
  
  // Tensión de contacto
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += '0.0\n';
  dxf += '20\n';
  dxf += (resultsY + 6).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.25\n';
  dxf += '1\n';
  dxf += 'Em = ' + (Em?.toFixed(0) || 'N/A') + ' V\n';
  
  // Tensión de paso
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += '0.0\n';
  dxf += '20\n';
  dxf += (resultsY + 9).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.25\n';
  dxf += '1\n';
  dxf += 'Es = ' + (Es?.toFixed(0) || 'N/A') + ' V\n';
  
  // Estado de cumplimiento
  const statusText = complies ? 'CUMPLE IEEE 80' : 'NO CUMPLE IEEE 80';
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += '0.0\n';
  dxf += '20\n';
  dxf += (resultsY + 12).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.3\n';
  dxf += '1\n';
  dxf += statusText + '\n';
  
  // ------------------------------------------------------------------
  // 6. TABLA DE ESPECIFICACIONES TÉCNICAS
  // ------------------------------------------------------------------
  const tableX = gridWidth + 5;
  const tableY = gridLength + 5;
  
  // Marco de la tabla
  dxf += '0\n';
  dxf += 'LINE\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += tableX.toFixed(3) + '\n';
  dxf += '20\n';
  dxf += tableY.toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '11\n';
  dxf += (tableX + 40).toFixed(3) + '\n';
  dxf += '21\n';
  dxf += tableY.toFixed(3) + '\n';
  dxf += '31\n';
  dxf += '0.0\n';
  
  dxf += '0\n';
  dxf += 'LINE\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (tableX + 40).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += tableY.toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '11\n';
  dxf += (tableX + 40).toFixed(3) + '\n';
  dxf += '21\n';
  dxf += (tableY - 25).toFixed(3) + '\n';
  dxf += '31\n';
  dxf += '0.0\n';
  
  dxf += '0\n';
  dxf += 'LINE\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (tableX + 40).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (tableY - 25).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '11\n';
  dxf += tableX.toFixed(3) + '\n';
  dxf += '21\n';
  dxf += (tableY - 25).toFixed(3) + '\n';
  dxf += '31\n';
  dxf += '0.0\n';
  
  dxf += '0\n';
  dxf += 'LINE\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += tableX.toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (tableY - 25).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '11\n';
  dxf += tableX.toFixed(3) + '\n';
  dxf += '21\n';
  dxf += tableY.toFixed(3) + '\n';
  dxf += '31\n';
  dxf += '0.0\n';
  
  // Título
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (tableX + 2).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (tableY - 2).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.2\n';
  dxf += '1\n';
  dxf += 'ESPECIFICACIONES\n';
  
  // Contenido
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (tableX + 2).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (tableY - 6).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.15\n';
  dxf += '1\n';
  dxf += 'Trafo: ' + transformerKVA + ' kVA\n';
  
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (tableX + 2).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (tableY - 9).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.15\n';
  dxf += '1\n';
  dxf += 'V: ' + primaryVoltage + '/' + secondaryVoltage + ' V\n';
  
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (tableX + 2).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (tableY - 12).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.15\n';
  dxf += '1\n';
  dxf += 'Z%: ' + transformerImpedance + '%\n';
  
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (tableX + 2).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (tableY - 15).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.15\n';
  dxf += '1\n';
  dxf += 'If: ' + (faultCurrent?.toFixed(0) || 'N/A') + ' A\n';
  
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (tableX + 2).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (tableY - 18).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.15\n';
  dxf += '1\n';
  dxf += 'Ig: ' + (Ig?.toFixed(0) || 'N/A') + ' A\n';
  
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (tableX + 2).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (tableY - 21).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.15\n';
  dxf += '1\n';
  dxf += 'Sf: ' + currentDivisionFactor + '\n';
  
  // ------------------------------------------------------------------
  // 7. TABLA DE RESULTADOS
  // ------------------------------------------------------------------
  const resX = tableX;
  const resY = tableY - 30;
  
  // Marco
  dxf += '0\n';
  dxf += 'LINE\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += resX.toFixed(3) + '\n';
  dxf += '20\n';
  dxf += resY.toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '11\n';
  dxf += (resX + 40).toFixed(3) + '\n';
  dxf += '21\n';
  dxf += resY.toFixed(3) + '\n';
  dxf += '31\n';
  dxf += '0.0\n';
  
  dxf += '0\n';
  dxf += 'LINE\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (resX + 40).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += resY.toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '11\n';
  dxf += (resX + 40).toFixed(3) + '\n';
  dxf += '21\n';
  dxf += (resY - 20).toFixed(3) + '\n';
  dxf += '31\n';
  dxf += '0.0\n';
  
  dxf += '0\n';
  dxf += 'LINE\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (resX + 40).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (resY - 20).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '11\n';
  dxf += resX.toFixed(3) + '\n';
  dxf += '21\n';
  dxf += (resY - 20).toFixed(3) + '\n';
  dxf += '31\n';
  dxf += '0.0\n';
  
  dxf += '0\n';
  dxf += 'LINE\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += resX.toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (resY - 20).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '11\n';
  dxf += resX.toFixed(3) + '\n';
  dxf += '21\n';
  dxf += resY.toFixed(3) + '\n';
  dxf += '31\n';
  dxf += '0.0\n';
  
  // Título
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (resX + 2).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (resY - 2).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.2\n';
  dxf += '1\n';
  dxf += 'RESULTADOS\n';
  
  // Resultados
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (resX + 2).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (resY - 6).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.15\n';
  dxf += '1\n';
  dxf += 'Rg: ' + (Rg?.toFixed(3) || 'N/A') + ' Ω\n';
  
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (resX + 2).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (resY - 9).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.15\n';
  dxf += '1\n';
  dxf += 'GPR: ' + (GPR?.toFixed(0) || 'N/A') + ' V\n';
  
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (resX + 2).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (resY - 12).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.15\n';
  dxf += '1\n';
  dxf += 'Em: ' + (Em?.toFixed(0) || 'N/A') + ' V\n';
  
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (resX + 2).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (resY - 15).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.15\n';
  dxf += '1\n';
  dxf += 'Es: ' + (Es?.toFixed(0) || 'N/A') + ' V\n';
  
  // Estado
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (resX + 2).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (resY - 18).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.18\n';
  dxf += '1\n';
  dxf += statusText + ' IEEE 80\n';
  
  // ------------------------------------------------------------------
  // 8. TABLA DE MATERIALES
  // ------------------------------------------------------------------
  const matX = tableX;
  const matY = resY - 25;
  
  // Marco
  dxf += '0\n';
  dxf += 'LINE\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += matX.toFixed(3) + '\n';
  dxf += '20\n';
  dxf += matY.toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '11\n';
  dxf += (matX + 40).toFixed(3) + '\n';
  dxf += '21\n';
  dxf += matY.toFixed(3) + '\n';
  dxf += '31\n';
  dxf += '0.0\n';
  
  dxf += '0\n';
  dxf += 'LINE\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (matX + 40).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += matY.toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '11\n';
  dxf += (matX + 40).toFixed(3) + '\n';
  dxf += '21\n';
  dxf += (matY - 15).toFixed(3) + '\n';
  dxf += '31\n';
  dxf += '0.0\n';
  
  dxf += '0\n';
  dxf += 'LINE\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (matX + 40).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (matY - 15).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '11\n';
  dxf += matX.toFixed(3) + '\n';
  dxf += '21\n';
  dxf += (matY - 15).toFixed(3) + '\n';
  dxf += '31\n';
  dxf += '0.0\n';
  
  dxf += '0\n';
  dxf += 'LINE\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += matX.toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (matY - 15).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '11\n';
  dxf += matX.toFixed(3) + '\n';
  dxf += '21\n';
  dxf += matY.toFixed(3) + '\n';
  dxf += '31\n';
  dxf += '0.0\n';
  
  // Título
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (matX + 2).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (matY - 2).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.2\n';
  dxf += '1\n';
  dxf += 'MATERIALES\n';
  
  // Contenido
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (matX + 2).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (matY - 6).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.15\n';
  dxf += '1\n';
  dxf += 'Cond: ' + (selectedConductor || '2/0 AWG') + '\n';
  
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (matX + 2).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (matY - 9).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.15\n';
  dxf += '1\n';
  dxf += 'Long: ' + (totalConductor?.toFixed(0) || 'N/A') + ' m\n';
  
  dxf += '0\n';
  dxf += 'TEXT\n';
  dxf += '8\n';
  dxf += '0\n';
  dxf += '10\n';
  dxf += (matX + 2).toFixed(3) + '\n';
  dxf += '20\n';
  dxf += (matY - 12).toFixed(3) + '\n';
  dxf += '30\n';
  dxf += '0.0\n';
  dxf += '40\n';
  dxf += '0.15\n';
  dxf += '1\n';
  dxf += 'Var: ' + numRods + ' x ' + rodLength + ' m\n';
  
  // ============================================
  // CIERRE
  // ============================================
  dxf += '0\n';
  dxf += 'ENDSEC\n';
  dxf += '0\n';
  dxf += 'EOF\n';
  
  return dxf;
};

export const downloadDXF = (params, calculations) => {
  try {
    const dxfContent = generateDXF(params, calculations);
    const blob = new Blob([dxfContent], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plano_malla_tierras_' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.dxf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('✅ DXF COMPLETO generado con formato AC1009:\n' +
          '- Marco del plano\n' +
          '- Malla de tierras (líneas)\n' +
          '- Varillas con símbolos IEEE\n' +
          '- Cotas dimensionales\n' +
          '- Tabla de especificaciones técnicas\n' +
          '- Tabla de resultados (Rg, GPR, Em, Es)\n' +
          '- Tabla de materiales\n' +
          '- Estado de cumplimiento IEEE 80');
    return true;
  } catch (error) {
    console.error('Error exportando DXF:', error);
    alert('❌ Error al exportar DXF: ' + error.message);
    return false;
  }
};

export default { generateDXF, downloadDXF };
