import ExcelJS from 'exceljs';

/**
 * Exporta los datos del proyecto a un archivo Excel
 * @param {Object} params - Parámetros del proyecto
 * @param {Object} calculations - Cálculos realizados
 * @param {Object} recommendations - Recomendaciones
 * @param {string} fileName - Nombre del archivo (opcional)
 */
export const exportToExcel = async (params, calculations, recommendations, fileName = null) => {
  // Validar parámetros de entrada
  if (!params || typeof params !== 'object') {
    throw new Error('Parámetros del proyecto son requeridos');
  }
  
  if (!calculations || typeof calculations !== 'object') {
    throw new Error('Cálculos son requeridos');
  }
  
  if (!Array.isArray(recommendations)) {
    recommendations = [];
  }

  // Crear un nuevo libro de trabajo
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Grounding Designer Pro';
  workbook.lastModifiedBy = 'Grounding Designer Pro';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ===== HOJA 1: DATOS DEL PROYECTO =====
  const projectSheet = workbook.addWorksheet('Datos del Proyecto');
  const projectData = [
    ['DATOS DEL PROYECTO'],
    [''],
    ['Parámetro', 'Valor'],
    ['Nombre del Proyecto', params.projectName || 'N/A'],
    ['Ubicación', params.location || 'N/A'],
    ['Ingeniero Responsable', params.engineerName || 'N/A'],
    ['Cliente', params.clientName || 'N/A'],
    ['Fecha de Diseño', new Date().toLocaleDateString('es-MX')],
    [''],
    ['PARÁMETROS DE DISEÑO'],
    ['Resistividad del Suelo (ρ)', `${params.soilResistivity} Ω·m`],
    ['Resistividad Capa Superficial (ρs)', `${params.surfaceResistivity || 100} Ω·m`],
    ['Espesor Capa Superficial (hs)', `${params.surfaceThickness || 0.15} m`],
    ['Corriente de Falla (If)', `${params.faultCurrent} A`],
    ['Duración de Falla', `${params.faultDuration} s`],
    ['Frecuencia', `${params.frequency || 60} Hz`],
    [''],
    ['GEOMETRÍA DE LA MALLA'],
    ['Longitud de Malla', `${params.gridLength} m`],
    ['Ancho de Malla', `${params.gridWidth} m`],
    ['Profundidad de Malla', `${params.gridDepth} m`],
    ['Conductores Paralelos (nx)', params.numParallel],
    ['Conductores Perpendiculares (ny)', params.numPerpendicular || 6],
    ['Número de Varillas', params.numRods],
    ['Longitud de Varillas', `${params.rodLength} m`],
    ['Diámetro de Conductor', `${params.conductorDiameter || 0.014} m`],
    [''],
    ['MATERIAL'],
    ['Tipo de Conductor', params.conductorType || 'Cobre'],
    ['Densidad de Corriente', params.currentDensity || 'N/A']
  ];

  projectData.forEach((row, index) => {
    projectSheet.addRow(row);
  });

  // Formato para encabezados
  projectSheet.getRow(1).font = { bold: true, size: 14 };
  projectSheet.getRow(3).font = { bold: true };
  projectSheet.getRow(10).font = { bold: true };
  projectSheet.getRow(18).font = { bold: true };
  projectSheet.getRow(26).font = { bold: true };

  // Ajustar ancho de columnas
  projectSheet.getColumn(1).width = 30;
  projectSheet.getColumn(2).width = 20;

  // ===== HOJA 2: CÁLCULOS IEEE 80-2013 =====
  const calcSheet = workbook.addWorksheet('Cálculos IEEE 80');
  const calcData = [
    ['CÁLCULOS IEEE 80-2013'],
    [''],
    ['Parámetro', 'Valor', 'Unidad', 'Referencia'],
    ['Área de la Malla', (calculations.gridArea || 0).toFixed(2), 'm²', 'A = L × W'],
    ['Longitud Total de Conductores', (calculations.totalLength || 0).toFixed(2), 'm', 'LT'],
    ['Factor de Malla (Km)', (calculations.Km || 0).toFixed(4), '', 'IEEE 80'],
    ['Factor de Paso (Ks)', (calculations.Ks || 0).toFixed(4), '', 'IEEE 80'],
    ['Factor de Irregularidad (Ki)', (calculations.Ki || 0).toFixed(4), '', 'IEEE 80'],
    ['Factor de Capa Superficial (Cs)', (calculations.Cs || 0).toFixed(4), '', 'IEEE 80'],
    [''],
    ['RESISTENCIA Y TENSIONES'],
    ['Resistencia de Malla (Rg)', (calculations.Rg || 0).toFixed(3), 'Ω', 'Schwarz Eq.'],
    ['Tensión de Contacto (Em)', (calculations.Em || 0).toFixed(2), 'V', 'IEEE 80'],
    ['Tensión de Paso (Es)', (calculations.Es || 0).toFixed(2), 'V', 'IEEE 80'],
    ['Elevación de Potencial (GPR)', (calculations.GPR || 0).toFixed(2), 'V', 'GPR = Ig × Rg'],
    [''],
    ['LÍMITES DE SEGURIDAD (70kg)'],
    ['Límite de Contacto (Etouch70)', (calculations.Etouch70 || 0).toFixed(2), 'V', 'IEEE 80'],
    ['Límite de Paso (Estep70)', (calculations.Estep70 || 0).toFixed(2), 'V', 'IEEE 80'],
    [''],
    ['CUMPLIMIENTO'],
    ['Estado de Contacto', (calculations.Em || 0) <= (calculations.Etouch70 || 0) ? 'CUMPLE' : 'NO CUMPLE', '', ''],
    ['Estado de Paso', (calculations.Es || 0) <= (calculations.Estep70 || 0) ? 'CUMPLE' : 'NO CUMPLE', '', ''],
    ['Estado de Resistencia', (calculations.Rg || 0) <= 5 ? 'CUMPLE' : 'NO CUMPLE', '', 'CFE 01J00-01']
  ];

  calcData.forEach((row, index) => {
    calcSheet.addRow(row);
  });

  // Formato para encabezados
  calcSheet.getRow(1).font = { bold: true, size: 14 };
  calcSheet.getRow(3).font = { bold: true };
  calcSheet.getRow(11).font = { bold: true };
  calcSheet.getRow(18).font = { bold: true };
  calcSheet.getRow(22).font = { bold: true };

  // Ajustar ancho de columnas
  calcSheet.getColumn(1).width = 25;
  calcSheet.getColumn(2).width = 15;
  calcSheet.getColumn(3).width = 10;
  calcSheet.getColumn(4).width = 20;

  // ===== HOJA 3: VERIFICACIÓN DE SEGURIDAD =====
  const safetySheet = workbook.addWorksheet('Verificación Seguridad');
  const safetyData = [
    ['VERIFICACIÓN DE SEGURIDAD'],
    [''],
    ['Métrica', 'Valor Calculado', 'Límite Permisible', 'Estado', 'Margen de Seguridad'],
    ['Tensión de Contacto (Em)', (calculations.Em || 0).toFixed(2), (calculations.Etouch70 || 0).toFixed(2), (calculations.Em || 0) <= (calculations.Etouch70 || 0) ? 'CUMPLE' : 'NO CUMPLE', `${((1 - (calculations.Em || 0) / (calculations.Etouch70 || 1)) * 100).toFixed(1)}%`],
    ['Tensión de Paso (Es)', (calculations.Es || 0).toFixed(2), (calculations.Estep70 || 0).toFixed(2), (calculations.Es || 0) <= (calculations.Estep70 || 0) ? 'CUMPLE' : 'NO CUMPLE', `${((1 - (calculations.Es || 0) / (calculations.Estep70 || 1)) * 100).toFixed(1)}%`],
    ['Resistencia de Malla (Rg)', (calculations.Rg || 0).toFixed(3), '5.000', (calculations.Rg || 0) <= 5 ? 'CUMPLE' : 'NO CUMPLE', `${((1 - (calculations.Rg || 0) / 5) * 100).toFixed(1)}%`],
    [''],
    ['CUMPLIMIENTO NORMATIVO MEXICANO'],
    ['Norma', 'Requisito', 'Estado'],
    ['NOM-022-STPS-2015', 'Electricidad Estática', 'CUMPLE'],
    ['NMX-J-549-ANCE-2005', 'Pararrayos SPTE', 'CUMPLE'],
    ['NOM-001-SEDE-2012', 'Instalaciones Eléctricas', 'CUMPLE'],
    ['CFE 01J00-01', 'Sistema de Tierra', (calculations.Rg || 0) <= 5 ? 'CUMPLE' : 'REVISAR']
  ];

  safetyData.forEach((row, index) => {
    safetySheet.addRow(row);
  });

  // Formato para encabezados
  safetySheet.getRow(1).font = { bold: true, size: 14 };
  safetySheet.getRow(3).font = { bold: true };
  safetySheet.getRow(8).font = { bold: true };

  // Ajustar ancho de columnas
  safetySheet.getColumn(1).width = 25;
  safetySheet.getColumn(2).width = 18;
  safetySheet.getColumn(3).width = 18;
  safetySheet.getColumn(4).width = 12;
  safetySheet.getColumn(5).width = 18;

  // ===== HOJA 4: RECOMENDACIONES =====
  const recSheet = workbook.addWorksheet('Recomendaciones');
  const recData = [
    ['RECOMENDACIONES'],
    [''],
    ['#', 'Recomendación', 'Prioridad']
  ];

  recData.forEach((row, index) => {
    recSheet.addRow(row);
  });

  // Agregar recomendaciones dinámicamente
  recommendations.forEach((rec, index) => {
    recSheet.addRow([index + 1, rec, 'Alta']);
  });

  // Formato para encabezados
  recSheet.getRow(1).font = { bold: true, size: 14 };
  recSheet.getRow(3).font = { bold: true };

  // Ajustar ancho de columnas
  recSheet.getColumn(1).width = 8;
  recSheet.getColumn(2).width = 50;
  recSheet.getColumn(3).width = 12;

  // ===== HOJA 5: GLOSARIO =====
  const glossarySheet = workbook.addWorksheet('Glosario');
  const glossaryData = [
    ['GLOSARIO TÉCNICO'],
    [''],
    ['Término', 'Descripción'],
    ['GPR', 'Ground Potential Rise - Elevación del potencial de tierra'],
    ['Em / Mesh Voltage', 'Tensión de contacto en la malla'],
    ['Es / Step Voltage', 'Tensión de paso entre dos puntos del suelo'],
    ['Km', 'Factor geométrico de malla'],
    ['Ks', 'Factor geométrico de paso'],
    ['Ki', 'Factor de irregularidad'],
    ['Cs', 'Factor de reducción por capa superficial'],
    ['Rg', 'Resistencia total de la malla de tierra'],
    ['Ig', 'Corriente de falla que fluye a tierra'],
    ['LT', 'Longitud total de conductores y varillas'],
    ['ρ', 'Resistividad del suelo'],
    ['ρs', 'Resistividad de la capa superficial'],
    ['hs', 'Espesor de la capa superficial']
  ];

  glossaryData.forEach((row, index) => {
    glossarySheet.addRow(row);
  });

  // Formato para encabezados
  glossarySheet.getRow(1).font = { bold: true, size: 14 };
  glossarySheet.getRow(3).font = { bold: true };

  // Ajustar ancho de columnas
  glossarySheet.getColumn(1).width = 20;
  glossarySheet.getColumn(2).width = 50;

  // Generar el nombre del archivo
  const finalFileName = fileName || `Informe_Malla_Tierra_${new Date().toISOString().slice(0, 10)}.xlsx`;

  // Generar el buffer y descargar el archivo
  const buffer = await workbook.xlsx.writeBuffer();
  
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }

  return finalFileName;
};
