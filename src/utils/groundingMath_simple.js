/**
 * Cálculos de Malla de Tierras - VERSIÓN SIMPLIFICADA PARA PRUEBAS
 * Basado en IEEE Std 80-2013 y CFE 01J00-01
 */

export const calculateIEEE80 = (params) => {
  console.log('calculateIEEE80 called with:', params);
  
  // Valores por defecto si no se proporcionan
  const p = {
    transformerKVA: params?.transformerKVA || 75,
    primaryVoltage: params?.primaryVoltage || 13200,
    secondaryVoltage: params?.secondaryVoltage || 220,
    transformerImpedance: params?.transformerImpedance || 5,
    faultDuration: params?.faultDuration || 0.35,
    currentDivisionFactor: params?.currentDivisionFactor || 0.20,
    soilResistivity: params?.soilResistivity || 100,
    surfaceLayer: params?.surfaceLayer || 10000,
    surfaceDepth: params?.surfaceDepth || 0.2,
    gridLength: params?.gridLength || 30,
    gridWidth: params?.gridWidth || 16,
    gridDepth: params?.gridDepth || 0.6,
    conductorDiameter: params?.conductorDiameter || 0.01052,
    numParallel: params?.numParallel || 15,
    numRods: params?.numRods || 45,
    rodLength: params?.rodLength || 3,
    ...params
  };

  console.log('Parámetros procesados:', p);

  // Cálculo básico
  const Vsec = p.secondaryVoltage;
  const Z = p.transformerImpedance;
  const In = (p.transformerKVA * 1000) / (Math.sqrt(3) * Vsec);
  const faultCurrent = In / (Z / 100);
  const Ig = faultCurrent * p.currentDivisionFactor;
  
  console.log('Corriente de falla calculada:', faultCurrent);
  console.log('Corriente de falla con división:', Ig);
  
  const A = p.gridLength * p.gridWidth;
  const perimeter = 2 * (p.gridLength + p.gridWidth);
  const totalGridLength = perimeter * p.numParallel;
  const totalRodLength = p.numRods * p.rodLength;
  const LT = totalGridLength + totalRodLength;
  
  // Resistencia de malla simplificada
  const Rg = p.soilResistivity * (1/LT + 1/Math.sqrt(20 * A));
  const GPR = Ig * Rg;
  
  console.log('Resistencia de malla calculada:', Rg);
  console.log('GPR calculado:', GPR);
  
  // Tensiones simplificadas
  const Cs = 1 - (0.09 * (1 - p.soilResistivity / p.surfaceLayer)) / (2 * p.surfaceDepth + 0.09);
  const t = p.faultDuration;
  const sqrt_t = Math.sqrt(t);
  const Etouch70 = (1000 + 1.5 * Cs * p.surfaceLayer) * (0.157 / sqrt_t);
  const Estep70 = (1000 + 6.0 * Cs * p.surfaceLayer) * (0.157 / sqrt_t);
  
  const Em = GPR * 0.3; // Aproximación
  const Es = GPR * 0.15; // Aproximación
  
  const touchSafe70 = Em <= Etouch70;
  const stepSafe70 = Es <= Estep70;
  const complies = touchSafe70 && stepSafe70;
  
  const minConductorArea = (Ig * Math.sqrt(t)) / 7.0;
  
  console.log('Tension de contacto calculada:', Em);
  console.log('Tensión de paso calculada:', Es);
  console.log('¿Cumple con seguridad?', complies);
  
  return {
    faultCurrent,
    Ig,
    Sf: p.currentDivisionFactor,
    Cs,
    Etouch70,
    Estep70,
    Rg,
    GPR,
    Em,
    Es,
    touchSafe70,
    stepSafe70,
    complies,
    gridArea: A,
    totalConductor: totalGridLength,
    totalRodLength,
    minConductorArea,
    selectedConductor: minConductorArea <= 67.4 ? '2/0 AWG' : '4/0 AWG'
  };
};

export const generateRecommendations = (results) => {
  const recs = [];
  if (results?.Rg > 5) recs.push("• Resistencia de malla > 5Ω: mejorar diseño");
  if (!results?.touchSafe70) recs.push("• Tensión de contacto excede límite");
  if (!results?.stepSafe70) recs.push("• Tensión de paso excede límite");
  if (recs.length === 0) recs.push("✓ Diseño cumple con IEEE 80");
  return recs;
};

export const validateImportedData = (data) => {
  return !!(data?.parameters?.transformerKVA || data?.parameters?.transformerKVA);
};
