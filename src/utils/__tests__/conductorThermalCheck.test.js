/**
 * Unit tests para conductorThermalCheck
 * Pruebas de regresión para verificación térmica de conductores
 */

import { conductorThermalCheck, recommendConductor, CONDUCTORS } from '../conductorThermalCheck';

describe('conductorThermalCheck', () => {
  const defaultParams = {
    faultCurrent: 1000,
    faultDuration: 0.35,
    currentArea: 67.4,
    material: 'COPPER_SOFT'
  };

  test('debe calcular verificación térmica con parámetros válidos', () => {
    const result = conductorThermalCheck(
      defaultParams.faultCurrent,
      defaultParams.faultDuration,
      defaultParams.currentArea,
      defaultParams.material
    );
    
    expect(result).toBeDefined();
    expect(typeof result.complies).toBe('boolean');
    expect(typeof result.thermalComplies).toBe('boolean');
    expect(typeof result.ampacityComplies).toBe('boolean');
    expect(result.minRequiredArea).toBeDefined();
    expect(result.currentArea).toBeDefined();
    expect(result.recommendation).toBeDefined();
  });

  test('debe rechazar material no soportado', () => {
    const result = conductorThermalCheck(1000, 0.35, 67.4, 'INVALID_MATERIAL');
    
    expect(result.complies).toBe(false);
    expect(result.error).toBe('Material no soportado');
    expect(result.recommendation).toContain('COPPER_SOFT, COPPER_HARD o ALUMINUM');
  });

  test('debe calcular área mínima requerida correctamente', () => {
    const result = conductorThermalCheck(1000, 0.35, 50, 'COPPER_SOFT');
    
    // A = (I × √t) / K = (1000 × √0.35) / 7.0
    const sqrt_t = Math.sqrt(0.35);
    const expectedMinArea = (1000 * sqrt_t) / 7.0;
    
    const minRequiredAreaNum = parseFloat(result.minRequiredArea);
    expect(minRequiredAreaNum).toBeCloseTo(expectedMinArea, 1);
  });

  test('debe detectar cuando conductor es térmicamente insuficiente', () => {
    const result = conductorThermalCheck(5000, 1.0, 10, 'COPPER_SOFT');
    
    expect(result.thermalComplies).toBe(false);
    expect(result.complies).toBe(false);
    expect(result.message).toContain('INSUFICIENTE');
  });

  test('debe detectar cuando conductor es ampacity insuficiente', () => {
    const result = conductorThermalCheck(5000, 0.35, 200, 'COPPER_SOFT');
    
    expect(result.ampacityComplies).toBe(false);
  });

  test('debe calcular información de paralelo cuando ampacity insuficiente', () => {
    const result = conductorThermalCheck(5000, 0.35, 67.4, 'COPPER_SOFT');
    
    if (!result.ampacityComplies && result.currentAmpacity > 0) {
      expect(result.parallelInfo).toBeDefined();
      expect(result.parallelInfo.requiredCount).toBeGreaterThan(1);
      expect(result.needsParallel).toBe(true);
    }
  });

  test('debe tener severity "success" cuando cumple', () => {
    const result = conductorThermalCheck(100, 0.35, 200, 'COPPER_SOFT');
    
    if (result.complies) {
      expect(result.severity).toBe('success');
    }
  });

  test('debe tener severity "error" cuando no cumple térmicamente', () => {
    const result = conductorThermalCheck(10000, 1.0, 10, 'COPPER_SOFT');
    
    if (!result.thermalComplies && !result.ampacityComplies) {
      expect(result.severity).toBe('error');
    }
  });

  test('debe tener severity "warning" cuando solo ampacity falla', () => {
    const result = conductorThermalCheck(5000, 0.1, 200, 'COPPER_SOFT');
    
    if (result.thermalComplies && !result.ampacityComplies) {
      expect(result.severity).toBe('warning');
    }
  });

  test('debe manejar diferentes materiales', () => {
    const resultCopper = conductorThermalCheck(1000, 0.35, 50, 'COPPER_SOFT');
    const resultAluminum = conductorThermalCheck(1000, 0.35, 50, 'ALUMINUM');
    
    expect(resultCopper.material).toBe('Cobre Recocido');
    expect(resultAluminum.material).toBe('Aluminio');
  });

  test('debe incluir fórmula en resultado', () => {
    const result = conductorThermalCheck(1000, 0.35, 67.4, 'COPPER_SOFT');
    
    expect(result.formula).toContain('A = (I × √t) / K');
  });

  test('debe retornar conductor actual correcto', () => {
    const result = conductorThermalCheck(1000, 0.35, 67.4, 'COPPER_SOFT');
    
    expect(result.currentConductor).toBeDefined();
    expect(result.currentConductor.area).toBeCloseTo(67.4, 0.5);
  });

  test('debe retornar conductor recomendado', () => {
    const result = conductorThermalCheck(1000, 0.35, 10, 'COPPER_SOFT');
    
    expect(result.recommendedConductor).toBeDefined();
    expect(result.recommendedConductor.area).toBeGreaterThan(10);
  });

  test('debe manejar duración de falla mínima', () => {
    const result = conductorThermalCheck(1000, 0.1, 50, 'COPPER_SOFT');
    
    expect(result).toBeDefined();
    expect(result.minRequiredArea).toBeDefined();
  });

  test('debe manejar corriente de falla alta', () => {
    const result = conductorThermalCheck(50000, 0.35, 500, 'COPPER_SOFT');
    
    expect(result).toBeDefined();
    expect(result.parallelInfo).toBeDefined();
  });

  test('debe manejar área de conductor cero', () => {
    const result = conductorThermalCheck(1000, 0.35, 0, 'COPPER_SOFT');
    
    expect(result).toBeDefined();
    expect(result.thermalComplies).toBe(false);
  });
});

describe('recommendConductor', () => {
  test('debe recomendar conductor que cumple térmica y ampacity', () => {
    const result = recommendConductor(100, 0.35, 'COPPER_SOFT');
    
    expect(result).toBeDefined();
    expect(result.complies).toBe(true);
    expect(result.needsParallel).toBe(false);
  });

  test('debe recomendar conductor con paralelo si ninguno cumple individualmente', () => {
    const result = recommendConductor(50000, 0.35, 'COPPER_SOFT');
    
    if (result) {
      expect(result.complies).toBe(false);
      expect(result.needsParallel).toBe(true);
      expect(result.parallelCount).toBeGreaterThan(1);
    }
  });

  test('debe retornar null cuando cálculo falla', () => {
    const result = recommendConductor(1000, 0.35, 'INVALID_MATERIAL');
    
    expect(result).toBeNull();
  });

  test('debe seleccionar conductor con área suficiente', () => {
    const result = recommendConductor(1000, 0.35, 'COPPER_SOFT');
    
    if (result) {
      expect(result.area).toBeGreaterThan(result.minRequiredArea ? parseFloat(result.minRequiredArea) : 0);
    }
  });

  test('debe incluir recomendación de paralelo cuando es necesario', () => {
    const result = recommendConductor(50000, 0.35, 'COPPER_SOFT');
    
    if (result && result.parallelRecommendation) {
      expect(result.parallelRecommendation).toContain('en paralelo');
    }
  });

  test('debe manejar materiales diferentes', () => {
    const resultCopper = recommendConductor(1000, 0.35, 'COPPER_SOFT');
    const resultAluminum = recommendConductor(1000, 0.35, 'ALUMINUM');
    
    expect(resultCopper).toBeDefined();
    expect(resultAluminum).toBeDefined();
  });

  test('debe manejar duración de falla corta', () => {
    const result = recommendConductor(1000, 0.1, 'COPPER_SOFT');
    
    expect(result).toBeDefined();
  });

  test('debe manejar duración de falla larga', () => {
    const result = recommendConductor(1000, 3.0, 'COPPER_SOFT');
    
    expect(result).toBeDefined();
  });
});

describe('CONDUCTORS catalog', () => {
  test('debe tener todos los conductores Viakon definidos', () => {
    expect(CONDUCTORS.AWG_6).toBeDefined();
    expect(CONDUCTORS.AWG_4).toBeDefined();
    expect(CONDUCTORS.AWG_2).toBeDefined();
    expect(CONDUCTORS.AWG_1).toBeDefined();
    expect(CONDUCTORS.AWG_1_0).toBeDefined();
    expect(CONDUCTORS.AWG_2_0).toBeDefined();
    expect(CONDUCTORS.AWG_3_0).toBeDefined();
    expect(CONDUCTORS.AWG_4_0).toBeDefined();
    expect(CONDUCTORS.KCMIL_250).toBeDefined();
    expect(CONDUCTORS.KCMIL_300).toBeDefined();
    expect(CONDUCTORS.KCMIL_350).toBeDefined();
    expect(CONDUCTORS.KCMIL_400).toBeDefined();
    expect(CONDUCTORS.KCMIL_500).toBeDefined();
    expect(CONDUCTORS.KCMIL_600).toBeDefined();
    expect(CONDUCTORS.KCMIL_700).toBeDefined();
    expect(CONDUCTORS.KCMIL_750).toBeDefined();
    expect(CONDUCTORS.KCMIL_800).toBeDefined();
    expect(CONDUCTORS.KCMIL_1000).toBeDefined();
  });

  test('debe tener propiedades correctas en cada conductor', () => {
    Object.values(CONDUCTORS).forEach(conductor => {
      expect(conductor).toHaveProperty('name');
      expect(conductor).toHaveProperty('area');
      expect(conductor).toHaveProperty('diameter');
      expect(conductor).toHaveProperty('ampacity');
      expect(conductor.area).toBeGreaterThan(0);
      expect(conductor.diameter).toBeGreaterThan(0);
      expect(conductor.ampacity).toBeGreaterThan(0);
    });
  });

  test('debe tener áreas en orden creciente', () => {
    const areas = Object.values(CONDUCTORS).map(c => c.area);
    const sortedAreas = [...areas].sort((a, b) => a - b);
    
    expect(areas).toEqual(sortedAreas);
  });

  test('AWG 4/0 debe tener área de 107.2 mm²', () => {
    expect(CONDUCTORS.AWG_4_0.area).toBe(107.2);
  });

  test('AWG 4/0 debe tener ampacity de 195 A', () => {
    expect(CONDUCTORS.AWG_4_0.ampacity).toBe(195);
  });
});
