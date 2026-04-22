// tests/engine/ieee80.test.js
import { 
  calcGridResistance, 
  calcCs, 
  calcEtouchTolerable,
  calcEstepTolerable,
  calcGPR,
  checkCompliance 
} from '../../src/core/ieee80.js';

describe('IEEE 80 Engine - Cálculos Fundamentales', () => {
  
  describe('calcGridResistance - Resistencia de Malla', () => {
    test('debe calcular resistencia para malla típica', () => {
      const Rg = calcGridResistance({
        soilResistivity: 100,
        gridArea: 200,
        totalConductorLength: 100,
        burialDepth: 0.5
      });
      expect(Rg).toBeGreaterThan(0);
      expect(Rg).toBeLessThan(10);
    });

    test('resistencia debe disminuir al aumentar LT', () => {
      const Rg1 = calcGridResistance({
        soilResistivity: 100,
        gridArea: 200,
        totalConductorLength: 100,
        burialDepth: 0.5
      });
      const Rg2 = calcGridResistance({
        soilResistivity: 100,
        gridArea: 200,
        totalConductorLength: 200,
        burialDepth: 0.5
      });
      expect(Rg2).toBeLessThan(Rg1);
    });

    test('resistencia debe aumentar con mayor resistividad', () => {
      const Rg1 = calcGridResistance({
        soilResistivity: 100,
        gridArea: 200,
        totalConductorLength: 100,
        burialDepth: 0.5
      });
      const Rg2 = calcGridResistance({
        soilResistivity: 200,
        gridArea: 200,
        totalConductorLength: 100,
        burialDepth: 0.5
      });
      expect(Rg2).toBeGreaterThan(Rg1);
    });

    test('resistencia debe ser mayor que cero', () => {
      const Rg = calcGridResistance({
        soilResistivity: 100,
        gridArea: 200,
        totalConductorLength: 100,
        burialDepth: 0.5
      });
      expect(Rg).toBeGreaterThan(0);
    });
  });

  describe('calcCs - Factor de Capa Superficial', () => {
    test('Cs debe ser 1 cuando no hay capa superficial', () => {
      const Cs = calcCs(100, 100, 0);
      expect(Cs).toBe(1);
    });

    test('Cs debe ser menor que 1 con capa superficial', () => {
      const Cs = calcCs(100, 3000, 0.1);
      expect(Cs).toBeLessThan(1);
      expect(Cs).toBeGreaterThan(0.5);
    });

    test('Cs debe aproximarse a 1 con capa muy delgada', () => {
      const Cs = calcCs(100, 3000, 0.001);
      expect(Cs).toBeCloseTo(1, 2);
    });
  });

  describe('calcEtouchTolerable - Tensión de Contacto Tolerable', () => {
    test('debe calcular para 70kg', () => {
      const Etouch = calcEtouchTolerable(3000, 0.9, 0.5, 70);
      expect(Etouch).toBeGreaterThan(800);
      expect(Etouch).toBeLessThan(1000);
    });

    test('debe calcular para 50kg', () => {
      const Etouch70 = calcEtouchTolerable(3000, 0.9, 0.5, 70);
      const Etouch50 = calcEtouchTolerable(3000, 0.9, 0.5, 50);
      expect(Etouch50).toBeLessThan(Etouch70);
    });

    test('tensión tolerable debe disminuir con menor duración', () => {
      const Etouch05 = calcEtouchTolerable(3000, 0.9, 0.5, 70);
      const Etouch10 = calcEtouchTolerable(3000, 0.9, 1.0, 70);
      expect(Etouch10).toBeLessThan(Etouch05);
    });
  });

  describe('calcEstepTolerable - Tensión de Paso Tolerable', () => {
    test('debe ser mayor que tensión de contacto', () => {
      const Estep = calcEstepTolerable(3000, 0.9, 0.5, 70);
      const Etouch = calcEtouchTolerable(3000, 0.9, 0.5, 70);
      expect(Estep).toBeGreaterThan(Etouch);
    });
  });

  describe('calcGPR - Ground Potential Rise', () => {
    test('GPR debe ser producto de Ig y Rg', () => {
      const GPR = calcGPR(1000, 5);
      expect(GPR).toBe(5000);
    });
  });

  describe('checkCompliance - Verificación de Cumplimiento', () => {
    test('debe retornar true cuando todo está dentro de límites', () => {
      const result = checkCompliance({
        Em: 100,
        EtouchTolerable: 200,
        Es: 50,
        EstepTolerable: 100
      });
      expect(result.complies).toBe(true);
      expect(result.touchSafe).toBe(true);
      expect(result.stepSafe).toBe(true);
    });

    test('debe retornar false cuando contacto excede límite', () => {
      const result = checkCompliance({
        Em: 300,
        EtouchTolerable: 200,
        Es: 50,
        EstepTolerable: 100
      });
      expect(result.complies).toBe(false);
      expect(result.touchSafe).toBe(false);
      expect(result.stepSafe).toBe(true);
    });

    test('debe retornar false cuando paso excede límite', () => {
      const result = checkCompliance({
        Em: 100,
        EtouchTolerable: 200,
        Es: 150,
        EstepTolerable: 100
      });
      expect(result.complies).toBe(false);
      expect(result.touchSafe).toBe(true);
      expect(result.stepSafe).toBe(false);
    });
  });
});
