/**
 * Modelo avanzado de resistencia de malla
 * Schwarz completo + factores de forma y profundidad
 */

// ============================================
// 1. FACTOR DE FORMA (geometría de la malla)
// ============================================

export const shapeFactor = ({ nx, ny }) => {
  const ratio = Math.max(1, nx) / Math.max(1, ny);
  // Aproximación estable del factor de forma
  let Fs = 1 + 0.2 * Math.log(ratio + 1);
  return Math.max(1, Math.min(2, Fs));
};

// ============================================
// 2. FACTOR DE PROFUNDIDAD
// ============================================

export const depthFactor = ({ burialDepth, gridSize }) => {
  const h = Math.max(0.1, burialDepth);
  const A = Math.max(1, gridSize);
  const sqrtA = Math.sqrt(A);
  
  let Fd = 1 + h / sqrtA;
  return Math.max(1, Math.min(2.5, Fd));
};

// ============================================
// 3. CORRECCIÓN POR VARILLAS (efecto paralelo con interferencia)
// ============================================

export const rodCorrection = ({ numRods, rodLength, rodDiameter = 0.0254, soilResistivity }) => {
  if (numRods === 0) return 0;
  
  const ρ = Math.max(1, soilResistivity);
  const L = Math.max(0.5, rodLength);
  const d = Math.max(0.01, rodDiameter);
  
  // Resistencia individual de varilla (fórmula de Dwight)
  const Rrod = (ρ / (2 * Math.PI * L)) * Math.log(4 * L / d);
  
  // Factor de interferencia (efecto de proximidad)
  // A mayor número de varillas, menor eficiencia
  const interference = 1 + 0.3 * (numRods - 1) / numRods;
  
  // Resistencia equivalente en paralelo con interferencia
  const RrodEq = Rrod / (numRods * interference);
  
  return Math.max(0, RrodEq);
};

// ============================================
// 4. RESISTENCIA BASE DE LA MALLA (Schwarz)
// ============================================

export const calcBaseGridResistance = ({ soilResistivity, totalLength, area }) => {
  const ρ = Math.max(1, soilResistivity);
  const L = Math.max(1, totalLength);
  const A = Math.max(1, area);
  
  // Fórmula de Schwarz simplificada
  const Rg = ρ * (1 / L + 1 / Math.sqrt(20 * A));
  
  return Rg;
};

// ============================================
// 5. RESISTENCIA AVANZADA (completa)
// ============================================

export const calcAdvancedGridResistance = (params) => {
  const {
    soilResistivity,
    totalLength,
    nx,
    ny,
    burialDepth,
    area,
    numRods = 0,
    rodLength = 3,
    rodDiameter = 0.0254
  } = params;
  
  // Factores
  const Fs = shapeFactor({ nx, ny });
  const Fd = depthFactor({ burialDepth, gridSize: area });
  
  // Resistencia base con factores
  const baseRg = (soilResistivity / (4 * totalLength)) * Fs * Fd;
  
  // Corrección por varillas
  const Rrod = rodCorrection({
    numRods,
    rodLength,
    rodDiameter,
    soilResistivity
  });
  
  // Resistencia total
  const Rg = baseRg + Rrod;
  
  return {
    Rg: Math.max(0.1, Math.min(50, Rg)),
    baseRg,
    rodContribution: Rrod,
    factors: { Fs, Fd },
    components: {
      soilResistivity,
      totalLength,
      nx,
      ny,
      burialDepth,
      area,
      numRods,
      rodLength
    }
  };
};

// ============================================
// 6. RESISTENCIA CON MÚLTIPLES CAPAS DE SUELO
// ============================================

export const calcTwoLayerResistance = ({ rho1, rho2, h1, totalLength, area }) => {
  // Resistividad equivalente para suelo bicapa (método simplificado)
  const depth = Math.sqrt(area);
  const ratio = rho2 / rho1;
  
  let rhoEq;
  if (depth <= h1) {
    rhoEq = rho1;
  } else {
    const penetration = (depth - h1) / depth;
    rhoEq = rho1 * (1 - penetration) + rho2 * penetration;
  }
  
  return calcBaseGridResistance({
    soilResistivity: rhoEq,
    totalLength,
    area
  });
};

export default {
  shapeFactor,
  depthFactor,
  rodCorrection,
  calcBaseGridResistance,
  calcAdvancedGridResistance,
  calcTwoLayerResistance
};
