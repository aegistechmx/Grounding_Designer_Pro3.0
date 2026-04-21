/**
 * Verifica la equipotencialización entre estructuras
 * Basado en IEEE 80 sección 14 y NOM-001-SEDE 250.4(A)(2)
 */

export const equipotentialCheck = (params, calculations, structures = []) => {
  const { GPR } = calculations || {};
  const safeGPR = GPR || 0;
  
  // Validar que GPR sea un número válido
  if (safeGPR === 0) {
    return {
      structures: [],
      needsAction: false,
      summary: '⚠️ No hay datos de GPR disponibles para el análisis',
      recommendations: ['Ejecute primero los cálculos de la malla']
    };
  }
  
  const defaultStructures = [
    { name: 'Transformador', distance: 0, bonded: true, x: 0, y: 0, description: 'Estructura principal' },
    { name: 'Cerca perimetral', distance: 2, bonded: false, x: params.gridWidth / 2 + 2, y: 0, description: 'Cerca metálica' },
    { name: 'Edificio de control', distance: 5, bonded: false, x: 0, y: params.gridLength + 3, description: 'Sala de control' },
    { name: 'Poste de acometida', distance: 8, bonded: false, x: -3, y: params.gridLength / 2, description: 'Poste de media tensión' },
    { name: 'Estructura metálica', distance: 3, bonded: false, x: params.gridWidth, y: params.gridLength, description: 'Estructura soporte' }
  ];
  
  const allStructures = structures.length > 0 ? structures : defaultStructures;
  const results = [];
  
  for (const struct of allStructures) {
    // Atenuación exponencial de la tensión transferida
    const attenuation = Math.exp(-0.15 * struct.distance); // Factor más realista
    const transferred = safeGPR * attenuation;
    const difference = Math.abs(safeGPR - transferred);
    
    // Determinar nivel de riesgo
    let riskLevel = 'Bajo';
    let riskColor = 'green';
    if (difference > 1000) {
      riskLevel = 'Alto';
      riskColor = 'red';
    } else if (difference > 500) {
      riskLevel = 'Medio';
      riskColor = 'yellow';
    }
    
    results.push({
      ...struct,
      gpr: safeGPR.toFixed(0),
      transferredVoltage: transferred.toFixed(0),
      difference: difference.toFixed(0),
      attenuation: (attenuation * 100).toFixed(1),
      needsBonding: difference > 500 && !struct.bonded,
      recommendedBondingCable: difference > 1000 ? '2/0 AWG' : difference > 500 ? '1/0 AWG' : '2 AWG',
      status: difference <= 500 ? '✅ Aceptable' : '⚠️ Requiere enlace',
      riskLevel,
      riskColor
    });
  }
  
  const needsAction = results.some(r => r.needsBonding);
  const highRiskStructures = results.filter(r => r.riskLevel === 'Alto' && r.needsBonding);
  
  // Generar resumen más detallado
  let summary = '';
  let recommendations = [];
  
  if (safeGPR === 0) {
    summary = '⚠️ No hay datos suficientes';
  } else if (needsAction) {
    summary = `⚠️ Se requieren ${results.filter(r => r.needsBonding).length} conductores de enlace equipotencial`;
    recommendations = results.filter(r => r.needsBonding).map(r => 
      `• Conectar ${r.name} (${r.description}) con conductor ${r.recommendedBondingCable} - Tensión diferencial: ${r.difference} V`
    );
    
    if (highRiskStructures.length > 0) {
      recommendations.unshift(`🔴 ATENCIÓN: ${highRiskStructures.length} estructura(s) con riesgo ALTO de diferencia de potencial`);
    }
  } else {
    summary = '✅ Equipotencialización adecuada. Todas las estructuras están dentro de límites seguros.';
    recommendations = ['✓ Verificar conexiones existentes periódicamente', '✓ Documentar todas las uniones equipotenciales'];
  }
  
  return {
    structures: results,
    needsAction,
    highRiskCount: highRiskStructures.length,
    summary,
    recommendations,
    gprValue: safeGPR.toFixed(0),
    totalStructures: results.length
  };
};

export const bondingCableLength = (structures, params) => {
  const { gridLength, gridWidth, gridDepth } = params;
  const centerX = gridLength / 2;
  const centerY = gridWidth / 2;
  
  let totalLength = 0;
  const cables = [];
  let totalCost = 0;
  
  const cablePrices = {
    '2 AWG': 2.5,
    '1/0 AWG': 3.5,
    '2/0 AWG': 4.5
  };
  
  for (const struct of structures) {
    if (struct.needsBonding) {
      // Distancia desde el centro de la malla a la estructura
      const distance = Math.sqrt(Math.pow(struct.x - centerX, 2) + Math.pow(struct.y - centerY, 2));
      // Agregar profundidad adicional para conexión
      const totalDistance = distance + gridDepth + 0.5; // +0.5m para conexión
      const pricePerMeter = cablePrices[struct.recommendedBondingCable] || 3.5;
      
      totalLength += totalDistance;
      totalCost += totalDistance * pricePerMeter;
      
      cables.push({
        structure: struct.name,
        description: struct.description,
        distance: totalDistance.toFixed(1),
        cableSize: struct.recommendedBondingCable,
        cost: (totalDistance * pricePerMeter).toFixed(0)
      });
    }
  }
  
  return {
    totalLength: totalLength.toFixed(1),
    totalCost: totalCost.toFixed(0),
    cables,
    estimatedLaborHours: (totalLength / 10).toFixed(1),
    estimatedLaborCost: ((totalLength / 10) * 25).toFixed(0), // $25 por hora
    grandTotal: (totalCost + (totalLength / 10) * 25).toFixed(0)
  };
};

// Función adicional para verificar una estructura específica
export const checkSingleStructure = (params, calculations, structureName, distance) => {
  const { GPR } = calculations || {};
  const safeGPR = GPR || 0;
  
  const attenuation = Math.exp(-0.15 * distance);
  const transferred = safeGPR * attenuation;
  const difference = Math.abs(safeGPR - transferred);
  
  const needsBonding = difference > 500;
  const cableSize = difference > 1000 ? '2/0 AWG' : difference > 500 ? '1/0 AWG' : '2 AWG';
  
  return {
    structureName,
    distance,
    gpr: safeGPR.toFixed(0),
    transferredVoltage: transferred.toFixed(0),
    difference: difference.toFixed(0),
    needsBonding,
    recommendedCable: cableSize,
    status: needsBonding ? '⚠️ Requiere enlace' : '✅ Aceptable'
  };
};

export default { 
  equipotentialCheck, 
  bondingCableLength, 
  checkSingleStructure 
};