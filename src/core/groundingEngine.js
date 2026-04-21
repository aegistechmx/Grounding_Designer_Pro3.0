/**
 * Motor de Cálculos de Puesta a Tierra
 * Basado en IEEE Std 80-2013
 * Independiente de React - puede usarse en Web Workers
 */

// Constantes térmicas
const THERMAL_CONSTANTS = {
  COPPER_SOFT: { k: 7.0, name: 'Cobre Recocido', maxTemp: 250 },
  COPPER_HARD: { k: 7.0, name: 'Cobre Duro', maxTemp: 250 },
  ALUMINUM: { k: 4.5, name: 'Aluminio', maxTemp: 200 }
};

// Catálogo de conductores Viakon
export const CONDUCTORS = {
  '6 AWG': { area: 13.3, ampacity: 55, diameter: 7.72 },
  '4 AWG': { area: 21.2, ampacity: 70, diameter: 8.94 },
  '2 AWG': { area: 33.6, ampacity: 95, diameter: 10.5 },
  '1/0 AWG': { area: 53.5, ampacity: 125, diameter: 13.5 },
  '2/0 AWG': { area: 67.4, ampacity: 145, diameter: 14.7 },
  '3/0 AWG': { area: 85.0, ampacity: 165, diameter: 16.0 },
  '4/0 AWG': { area: 107.2, ampacity: 195, diameter: 17.5 },
  '250 kcmil': { area: 127.0, ampacity: 215, diameter: 19.4 },
  '300 kcmil': { area: 152.0, ampacity: 240, diameter: 20.8 },
  '350 kcmil': { area: 177.0, ampacity: 260, diameter: 22.1 },
  '400 kcmil': { area: 203.0, ampacity: 280, diameter: 23.3 },
  '500 kcmil': { area: 253.0, ampacity: 320, diameter: 25.5 },
  '600 kcmil': { area: 304.0, ampacity: 355, diameter: 28.3 },
  '750 kcmil': { area: 380.0, ampacity: 400, diameter: 30.9 },
  '1000 kcmil': { area: 507.0, ampacity: 455, diameter: 34.8 }
};

// Función segura para obtener número
const safeNumber = (value, defaultValue = 0) => {
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};

// Factor de capa superficial (Cs)
const calculateCs = (soilResistivity, surfaceLayer, surfaceDepth) => {
  const ρ = safeNumber(soilResistivity, 100);
  const ρs = safeNumber(surfaceLayer, 3000);
  const hs = safeNumber(surfaceDepth, 0.1);
  
  let Cs = 1 - (0.09 * (1 - ρ / ρs)) / (2 * hs + 0.09);
  return (isNaN(Cs) || !isFinite(Cs)) ? 1 : Cs;
};

// Tensiones permisibles
const calculatePermissibleVoltages = (Cs, surfaceLayer, faultDuration) => {
  const ρs = safeNumber(surfaceLayer, 3000);
  const t = Math.max(0.1, safeNumber(faultDuration, 0.5));
  const sqrt_t = Math.sqrt(t);
  
  let Etouch70 = (1000 + 1.5 * Cs * ρs) * (0.157 / sqrt_t);
  let Estep70 = (1000 + 6.0 * Cs * ρs) * (0.157 / sqrt_t);
  
  Etouch70 = (isNaN(Etouch70) || !isFinite(Etouch70)) ? 1 : Math.max(1, Etouch70);
  Estep70 = (isNaN(Estep70) || !isFinite(Estep70)) ? 1 : Math.max(1, Estep70);
  
  // Para 50 kg (factor 0.116 en lugar de 0.157)
  let Etouch50 = (1000 + 1.5 * Cs * ρs) * (0.116 / sqrt_t);
  let Estep50 = (1000 + 6.0 * Cs * ρs) * (0.116 / sqrt_t);
  
  Etouch50 = (isNaN(Etouch50) || !isFinite(Etouch50)) ? 1 : Math.max(1, Etouch50);
  Estep50 = (isNaN(Estep50) || !isFinite(Estep50)) ? 1 : Math.max(1, Estep50);
  
  return { Etouch70, Estep70, Etouch50, Estep50 };
};

// Geometría de la malla
const calculateGeometry = (params) => {
  const gridLength = safeNumber(params.gridLength, 30);
  const gridWidth = safeNumber(params.gridWidth, 16);
  const numParallel = safeNumber(params.numParallel, 8);
  const numParallelY = safeNumber(params.numParallelY, 8);
  const gridDepth = safeNumber(params.gridDepth, 0.6);
  const conductorDiameter = safeNumber(params.conductorDiameter, 0.01168);
  
  const A = gridLength * gridWidth;
  const perimeter = 2 * (gridLength + gridWidth);
  const totalGridLength = perimeter * numParallel;
  const totalGridLengthY = perimeter * numParallelY;
  const totalGridLengthTotal = (totalGridLength + totalGridLengthY) / 2;
  
  const numRods = safeNumber(params.numRods, 8);
  const rodLength = safeNumber(params.rodLength, 3);
  const totalRodLength = numRods * rodLength;
  const LT = totalGridLengthTotal + totalRodLength;
  
  const nx = numParallel;
  const ny = numParallelY;
  const Dx = gridLength / Math.max(1, nx - 1);
  const Dy = gridWidth / Math.max(1, ny - 1);
  const D = Math.sqrt(Dx * Dy);
  
  // Factor de irregularidad (n)
  let n = (2 * totalGridLengthTotal / perimeter) * Math.sqrt(perimeter / (4 * Math.sqrt(A)));
  n = (isNaN(n) || !isFinite(n)) ? 1 : Math.max(1, n);
  
  // Factores geométricos
  let Ki = 0.644 + 0.148 * n;
  Ki = (isNaN(Ki) || !isFinite(Ki)) ? 0.7 : Ki;
  
  let Kh = Math.sqrt(1 + gridDepth);
  Kh = (isNaN(Kh) || !isFinite(Kh)) ? 1 : Kh;
  
  // Factor de malla Km
  const h = gridDepth;
  const d = conductorDiameter;
  
  const term1 = (D * D) / (16 * h * d);
  const term2 = ((D + 2 * h) * (D + 2 * h)) / (8 * D * d);
  const term3 = h / (4 * d);
  const term4 = Math.log(8 / (Math.PI * (2 * n - 1)));
  
  let Km = (1 / (2 * Math.PI)) * (Math.log(term1 + term2 - term3) + term4);
  Km = Math.max(0.05, Math.min(0.8, Km)) * Kh;
  Km = (isNaN(Km) || !isFinite(Km)) ? 0.5 : Km;
  
  // Factor de paso Ks
  let Ks = (1 / Math.PI) * (1 / (2 * h) + 1 / (D + h) + (1 / D) * (1 - Math.pow(0.5, n - 2)));
  Ks = Math.max(0.2, Math.min(1.2, Ks));
  Ks = (isNaN(Ks) || !isFinite(Ks)) ? 0.7 : Ks;
  
  return {
    A, perimeter, totalGridLength: totalGridLengthTotal, totalRodLength,
    LT, nx, ny, D, n, Ki, Kh, Km, Ks, h, d
  };
};

// Corrientes de falla
const calculateFaultCurrents = (params) => {
  const transformerKVA = safeNumber(params.transformerKVA, 75);
  const secondaryVoltage = safeNumber(params.secondaryVoltage, 220);
  const transformerImpedance = Math.max(0.1, safeNumber(params.transformerImpedance, 5));
  const currentDivisionFactor = Math.min(0.8, Math.max(0.1, safeNumber(params.currentDivisionFactor, 0.2)));
  
  const In = (transformerKVA * 1000) / (Math.sqrt(3) * secondaryVoltage);
  const faultCurrent = In / (transformerImpedance / 100);
  const Ig = faultCurrent * currentDivisionFactor;
  
  return { faultCurrent, Ig, In, currentDivisionFactor };
};

// Resistencia de malla (Rg)
const calculateResistance = (soilResistivity, LT, A, gridDepth) => {
  const ρ = safeNumber(soilResistivity, 100);
  const h = safeNumber(gridDepth, 0.6);
  
  let Rg = ρ * (1 / LT + 1 / Math.sqrt(20 * A) * (1 + 1 / (1 + h * Math.sqrt(20 / A))));
  return (isNaN(Rg) || !isFinite(Rg)) ? 0 : Rg;
};

// Tensiones de malla y paso
const calculateVoltages = (soilResistivity, Km, Ki, Ig, LT, Ks, totalGridLength, totalRodLength) => {
  const ρ = safeNumber(soilResistivity, 100);
  
  let Em = (ρ * Km * Ki * Ig) / LT;
  let Es = (ρ * Ks * Ki * Ig) / (0.75 * totalGridLength + 0.85 * totalRodLength);
  
  Em = (isNaN(Em) || !isFinite(Em)) ? 0 : Em;
  Es = (isNaN(Es) || !isFinite(Es)) ? 0 : Es;
  
  return { Em, Es };
};

// Verificación térmica del conductor
const calculateThermalCheck = (Ig, faultDuration, conductorArea, material = 'COPPER_SOFT') => {
  const constData = THERMAL_CONSTANTS[material];
  if (!constData) return { complies: false, error: 'Material no soportado' };
  
  const t = Math.max(0.1, safeNumber(faultDuration, 0.35));
  const minRequiredArea = (Ig * Math.sqrt(t)) / constData.k;
  const complies = conductorArea >= minRequiredArea;
  
  return {
    complies,
    minRequiredArea: minRequiredArea.toFixed(2),
    currentArea: conductorArea.toFixed(2),
    message: complies 
      ? `✅ Conductor adecuado (${conductorArea.toFixed(2)} mm² ≥ ${minRequiredArea.toFixed(2)} mm²)`
      : `❌ Conductor insuficiente (${conductorArea.toFixed(2)} mm² < ${minRequiredArea.toFixed(2)} mm²)`
  };
};

// Función principal - Motor de cálculo completo
export const runGroundingCalculation = (params) => {
  // Validar entrada
  if (!params || typeof params !== 'object') {
    console.warn('Parámetros inválidos para cálculo');
    return null;
  }
  
  try {
    // 1. Corrientes
    const currents = calculateFaultCurrents(params);
    const { faultCurrent, Ig, In, currentDivisionFactor } = currents;
    
    // 2. Factor Cs
    const Cs = calculateCs(params.soilResistivity, params.surfaceLayer, params.surfaceDepth);
    
    // 3. Tensiones permisibles
    const permissible = calculatePermissibleVoltages(Cs, params.surfaceLayer, params.faultDuration);
    const { Etouch70, Estep70, Etouch50, Estep50 } = permissible;
    
    // 4. Geometría
    const geometry = calculateGeometry(params);
    const { A, perimeter, totalGridLength, totalRodLength, LT, nx, ny, D, n, Ki, Kh, Km, Ks, h, d } = geometry;
    
    // 5. Resistencia de malla
    const Rg = calculateResistance(params.soilResistivity, LT, A, params.gridDepth);
    
    // 6. GPR
    const GPR = Rg * Ig;
    
    // 7. Tensiones calculadas
    const voltages = calculateVoltages(params.soilResistivity, Km, Ki, Ig, LT, Ks, totalGridLength, totalRodLength);
    const { Em, Es } = voltages;
    
    // 8. Verificaciones de seguridad
    const touchSafe70 = Em <= Etouch70;
    const stepSafe70 = Es <= Estep70;
    const touchSafe50 = Em <= Etouch50;
    const stepSafe50 = Es <= Estep50;
    const complies = touchSafe70 && stepSafe70;
    
    // 9. Verificación térmica
    const conductorArea = Math.PI * Math.pow(params.conductorDiameter / 2, 2) * 1000000;
    const thermalCheck = calculateThermalCheck(Ig, params.faultDuration, conductorArea, params.materialType);
    
    // 10. Calibre mínimo por área térmica
    let minConductorArea = 0;
    let selectedConductor = '4/0 AWG';
    let selectedConductorInfo = CONDUCTORS['4/0 AWG'];
    
    const minAreaNum = parseFloat(thermalCheck.minRequiredArea);
    if (!isNaN(minAreaNum)) {
      minConductorArea = minAreaNum;
      for (const [name, data] of Object.entries(CONDUCTORS)) {
        if (data.area >= minAreaNum) {
          selectedConductor = name;
          selectedConductorInfo = data;
          break;
        }
      }
    }
    
    // Resultados
    return {
      // Corrientes
      faultCurrent,
      Ig,
      In,
      Sf: currentDivisionFactor,
      
      // Factores
      Cs,
      n,
      Ki,
      Kh,
      Km,
      Ks,
      
      // Tensiones permisibles
      Etouch70,
      Estep70,
      Etouch50,
      Estep50,
      
      // Resultados principales
      Rg,
      GPR,
      Em,
      Es,
      
      // Verificaciones
      touchSafe70,
      stepSafe70,
      touchSafe50,
      stepSafe50,
      complies,
      
      // Geometría
      gridArea: A,
      perimeter,
      totalConductor: totalGridLength,
      totalRodLength,
      LT,
      nx,
      ny,
      D,
      h,
      d,
      
      // Conductor
      minConductorArea,
      selectedConductor,
      selectedConductorInfo,
      thermalCheck,
      
      // Parámetros originales (para referencia)
      params: { ...params }
    };
  } catch (error) {
    console.error('Error en cálculo:', error);
    return null;
  }
};

// Generar recomendaciones basadas en resultados
export const generateRecommendations = (results) => {
  const recommendations = [];
  
  if (!results) return recommendations;
  
  if (results.Rg > 5) {
    recommendations.push("• Resistencia de malla > 5Ω: agregar más varillas o mejorar resistividad del suelo");
  }
  
  if (!results.touchSafe70) {
    recommendations.push("• Tensión de contacto excede límite: reducir espaciamiento entre conductores o agregar varillas en perímetro");
  }
  
  if (!results.stepSafe70) {
    recommendations.push("• Tensión de paso excede límite: agregar conductor perimetral adicional o mejorar capa superficial");
  }
  
  if (results.GPR > results.Etouch70) {
    recommendations.push("• GPR elevado: considerar malla de mayor área o reducir corriente de falla");
  }
  
  if (results.thermalCheck && !results.thermalCheck.complies) {
    recommendations.push(`⚠️ ${results.thermalCheck.message}`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push("✓ Diseño cumple con IEEE 80. Verificar mediciones in-situ.");
  }
  
  recommendations.push("• Realizar prueba de resistencia después de instalación (método de caída de potencial)");
  recommendations.push("• Medir resistividad del suelo in-situ (método Wenner de 4 puntas)");
  
  return recommendations;
};

export default {
  runGroundingCalculation,
  generateRecommendations,
  CONDUCTORS
};