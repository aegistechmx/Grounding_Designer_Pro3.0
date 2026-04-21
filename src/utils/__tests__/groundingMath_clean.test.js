/**
 * Unit tests para groundingMath_clean (calculateIEEE80)
 * Pruebas de regresión para cálculos críticos IEEE 80
 */

import { calculateIEEE80, generateRecommendations, validateImportedData, selectConductor, CONDUCTORS } from '../groundingMath_clean';

describe('calculateIEEE80', () => {
  const defaultParams = {
    transformerKVA: 75,
    primaryVoltage: 13200,
    secondaryVoltage: 220,
    transformerImpedance: 5,
    faultDuration: 0.35,
    currentDivisionFactor: 0.20,
    soilResistivity: 100,
    surfaceLayer: 10000,
    surfaceDepth: 0.2,
    gridLength: 30,
    gridWidth: 16,
    gridDepth: 0.6,
    conductorDiameter: 0.01052,
    numParallel: 15,
    numRods: 45,
    rodLength: 3
  };

  test('debe calcular resultados con parámetros por defecto', () => {
    const result = calculateIEEE80(defaultParams);
    
    expect(result).toBeDefined();
    expect(result.faultCurrent).toBeGreaterThan(0);
    expect(result.Ig).toBeGreaterThan(0);
    expect(result.Rg).toBeGreaterThan(0);
    expect(result.GPR).toBeGreaterThan(0);
    expect(result.Em).toBeGreaterThan(0);
    expect(result.Es).toBeGreaterThan(0);
    expect(typeof result.touchSafe70).toBe('boolean');
    expect(typeof result.stepSafe70).toBe('boolean');
    expect(typeof result.complies).toBe('boolean');
  });

  test('debe usar valores por defecto cuando params es null/undefined', () => {
    const result1 = calculateIEEE80(null);
    const result2 = calculateIEEE80(undefined);
    
    expect(result1.faultCurrent).toEqual(result2.faultCurrent);
    expect(result1.Rg).toEqual(result2.Rg);
  });

  test('debe calcular corriente de falla correctamente', () => {
    const result = calculateIEEE80(defaultParams);
    
    // In = (KVA * 1000) / (sqrt(3) * Vsec)
    // faultCurrent = In / (Z / 100)
    const expectedIn = (75 * 1000) / (Math.sqrt(3) * 220);
    const expectedFaultCurrent = expectedIn / (5 / 100);
    
    expect(result.faultCurrent).toBeCloseTo(expectedFaultCurrent, 2);
  });

  test('debe calcular Ig correctamente', () => {
    const result = calculateIEEE80(defaultParams);
    
    // Ig = faultCurrent * currentDivisionFactor
    const expectedIg = result.faultCurrent * 0.20;
    
    expect(result.Ig).toBeCloseTo(expectedIg, 2);
  });

  test('debe calcular área de malla correctamente', () => {
    const result = calculateIEEE80(defaultParams);
    
    // A = gridLength * gridWidth
    const expectedArea = 30 * 16;
    
    expect(result.gridArea).toBe(expectedArea);
  });

  test('debe calcular longitud total de conductor correctamente', () => {
    const result = calculateIEEE80(defaultParams);
    
    // perimeter = 2 * (L + W)
    // totalGridLength = perimeter * numParallel
    const perimeter = 2 * (30 + 16);
    const expectedTotalGridLength = perimeter * 15;
    
    expect(result.totalConductor).toBe(expectedTotalGridLength);
  });

  test('debe calcular longitud total de varillas correctamente', () => {
    const result = calculateIEEE80(defaultParams);
    
    // totalRodLength = numRods * rodLength
    const expectedTotalRodLength = 45 * 3;
    
    expect(result.totalRodLength).toBe(expectedTotalRodLength);
  });

  test('debe calcular GPR correctamente', () => {
    const result = calculateIEEE80(defaultParams);
    
    // GPR = Ig * Rg
    const expectedGPR = result.Ig * result.Rg;
    
    expect(result.GPR).toBeCloseTo(expectedGPR, 2);
  });

  test('debe calcular Cs correctamente', () => {
    const result = calculateIEEE80(defaultParams);
    
    // Cs = 1 - (0.09 * (1 - ρ/ρs)) / (2 * hs + 0.09)
    const expectedCs = 1 - (0.09 * (1 - 100 / 10000)) / (2 * 0.2 + 0.09);
    
    expect(result.Cs).toBeCloseTo(expectedCs, 4);
  });

  test('debe calcular Etouch70 correctamente', () => {
    const result = calculateIEEE80(defaultParams);
    
    // Etouch70 = (1000 + 1.5 * Cs * ρs) * (0.157 / sqrt(t))
    const sqrt_t = Math.sqrt(0.35);
    const expectedEtouch70 = (1000 + 1.5 * result.Cs * 10000) * (0.157 / sqrt_t);
    
    expect(result.Etouch70).toBeCloseTo(expectedEtouch70, 2);
  });

  test('debe calcular Estep70 correctamente', () => {
    const result = calculateIEEE80(defaultParams);
    
    // Estep70 = (1000 + 6.0 * Cs * ρs) * (0.157 / sqrt(t))
    const sqrt_t = Math.sqrt(0.35);
    const expectedEstep70 = (1000 + 6.0 * result.Cs * 10000) * (0.157 / sqrt_t);
    
    expect(result.Estep70).toBeCloseTo(expectedEstep70, 2);
  });

  test('debe calcular minConductorArea correctamente', () => {
    const result = calculateIEEE80(defaultParams);
    
    // minConductorArea = (Ig * sqrt(t)) / 7.0
    const sqrt_t = Math.sqrt(0.35);
    const expectedMinArea = (result.Ig * sqrt_t) / 7.0;
    
    expect(result.minConductorArea).toBeCloseTo(expectedMinArea, 2);
  });

  test('debe manejar diferentes valores de resistividad de suelo', () => {
    const paramsHighResistivity = { ...defaultParams, soilResistivity: 500 };
    const paramsLowResistivity = { ...defaultParams, soilResistivity: 50 };
    
    const resultHigh = calculateIEEE80(paramsHighResistivity);
    const resultLow = calculateIEEE80(paramsLowResistivity);
    
    expect(resultHigh.Rg).toBeGreaterThan(resultLow.Rg);
    expect(resultHigh.GPR).toBeGreaterThan(resultLow.GPR);
  });

  test('debe manejar diferentes valores de corriente de falla', () => {
    const paramsHighKVA = { ...defaultParams, transformerKVA: 500 };
    const paramsLowKVA = { ...defaultParams, transformerKVA: 25 };
    
    const resultHigh = calculateIEEE80(paramsHighKVA);
    const resultLow = calculateIEEE80(paramsLowKVA);
    
    expect(resultHigh.faultCurrent).toBeGreaterThan(resultLow.faultCurrent);
    expect(resultHigh.GPR).toBeGreaterThan(resultLow.GPR);
  });

  test('debe manejar diferentes duraciones de falla', () => {
    const paramsLongFault = { ...defaultParams, faultDuration: 1.0 };
    const paramsShortFault = { ...defaultParams, faultDuration: 0.1 };
    
    const resultLong = calculateIEEE80(paramsLongFault);
    const resultShort = calculateIEEE80(paramsShortFault);
    
    expect(resultLong.Etouch70).toBeLessThan(resultShort.Etouch70);
    expect(resultLong.Estep70).toBeLessThan(resultShort.Estep70);
  });

  test('debe seleccionar conductor AWG 4/0 por defecto', () => {
    const result = calculateIEEE80(defaultParams);
    
    expect(result.selectedConductor).toEqual(CONDUCTORS.AWG_4_0);
  });
});

describe('generateRecommendations', () => {
  test('debe generar recomendaciones cuando Rg > 5', () => {
    const results = { Rg: 10, touchSafe70: true, stepSafe70: true };
    const recs = generateRecommendations(results);
    
    expect(recs).toContain('• Resistencia de malla > 5Ω: mejorar diseño');
  });

  test('debe generar recomendaciones cuando touchSafe70 es false', () => {
    const results = { Rg: 2, touchSafe70: false, stepSafe70: true };
    const recs = generateRecommendations(results);
    
    expect(recs).toContain('• Tensión de contacto excede límite');
  });

  test('debe generar recomendaciones cuando stepSafe70 es false', () => {
    const results = { Rg: 2, touchSafe70: true, stepSafe70: false };
    const recs = generateRecommendations(results);
    
    expect(recs).toContain('• Tensión de paso excede límite');
  });

  test('debe indicar cumplimiento cuando todo está correcto', () => {
    const results = { Rg: 2, touchSafe70: true, stepSafe70: true };
    const recs = generateRecommendations(results);
    
    expect(recs).toContain('✓ Diseño cumple con IEEE 80');
  });

  test('debe manejar resultados nulos/undefined', () => {
    const recs1 = generateRecommendations(null);
    const recs2 = generateRecommendations(undefined);
    
    expect(recs1).toContain('✓ Diseño cumple con IEEE 80');
    expect(recs2).toContain('✓ Diseño cumple con IEEE 80');
  });
});

describe('validateImportedData', () => {
  test('debe validar datos con transformerKVA', () => {
    const data = { parameters: { transformerKVA: 75 } };
    const isValid = validateImportedData(data);
    
    expect(isValid).toBe(true);
  });

  test('debe rechazar datos sin parámetros', () => {
    const data = { parameters: {} };
    const isValid = validateImportedData(data);
    
    expect(isValid).toBe(false);
  });

  test('debe rechazar datos null/undefined', () => {
    const isValid1 = validateImportedData(null);
    const isValid2 = validateImportedData(undefined);
    
    expect(isValid1).toBe(false);
    expect(isValid2).toBe(false);
  });
});

describe('selectConductor', () => {
  test('debe seleccionar conductor basado en área', () => {
    const conductor = selectConductor(50);
    
    expect(conductor.area).toBeGreaterThanOrEqual(50);
  });

  test('debe retornar el primer conductor si área es muy pequeña', () => {
    const conductor = selectConductor(5);
    
    expect(conductor).toEqual(CONDUCTORS.AWG_6);
  });

  test('debe retornar el primer conductor si área excede máximo', () => {
    const conductor = selectConductor(1000);
    
    expect(conductor).toEqual(CONDUCTORS.AWG_6);
  });

  test('debe seleccionar AWG 4/0 para área ~107 mm²', () => {
    const conductor = selectConductor(107);
    
    expect(conductor.name).toBe('4/0 AWG');
  });
});
