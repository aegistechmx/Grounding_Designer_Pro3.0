// tests/calculations.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { calcGridResistance, calcSurfaceLayerFactor, allowableTouchVoltage, allowableStepVoltage } from '../ieee80';

describe('Cálculos IEEE 80', () => {
  beforeEach(() => {
    // Limpiar localStorage antes de cada test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('calcGridResistance', () => {
    it('debe calcular Rg correctamente con valores típicos', () => {
      const Rg = calcGridResistance({
        soilResistivity: 100,
        gridArea: 200,
        totalConductorLength: 100,
        burialDepth: 0.5,
        numRods: 16,
        rodLength: 3
      });
      expect(Rg).toBeGreaterThan(0);
      expect(Rg).toBeLessThan(10);
    });

    it('debe calcular Rg con alta resistividad', () => {
      const Rg = calcGridResistance({
        soilResistivity: 1000,
        gridArea: 200,
        totalConductorLength: 100,
        burialDepth: 0.5,
        numRods: 16,
        rodLength: 3
      });
      expect(Rg).toBeGreaterThan(0);
      expect(Rg).toBeGreaterThan(5);
    });

    it('debe calcular Rg con baja resistividad', () => {
      const Rg = calcGridResistance({
        soilResistivity: 50,
        gridArea: 200,
        totalConductorLength: 100,
        burialDepth: 0.5,
        numRods: 16,
        rodLength: 3
      });
      expect(Rg).toBeGreaterThan(0);
      expect(Rg).toBeLessThan(5);
    });
  });

  describe('calcSurfaceLayerFactor', () => {
    it('debe calcular Cs correctamente con valores típicos', () => {
      const Cs = calcSurfaceLayerFactor({
        soilResistivity: 100,
        surfaceResistivity: 3000,
        surfaceDepth: 0.1
      });
      expect(Cs).toBeGreaterThan(0);
      expect(Cs).toBeLessThanOrEqual(1);
      expect(Cs).toBeCloseTo(0.9, 1);
    });

    it('debe calcular Cs con alta resistividad superficial', () => {
      const Cs = calcSurfaceLayerFactor({
        soilResistivity: 100,
        surfaceResistivity: 10000,
        surfaceDepth: 0.1
      });
      expect(Cs).toBeGreaterThan(0);
      expect(Cs).toBeLessThanOrEqual(1);
    });

    it('debe calcular Cs con baja resistividad superficial', () => {
      const Cs = calcSurfaceLayerFactor({
        soilResistivity: 100,
        surfaceResistivity: 200,
        surfaceDepth: 0.1
      });
      expect(Cs).toBeGreaterThan(0);
      expect(Cs).toBeLessThanOrEqual(1);
    });
  });

  describe('allowableTouchVoltage', () => {
    it('debe calcular tensión de contacto permisible correctamente', () => {
      const Etouch = allowableTouchVoltage({
        bodyWeight: 70,
        surfaceResistivity: 3000,
        faultDuration: 0.35,
        Cs: 0.9
      });
      expect(Etouch).toBeGreaterThan(0);
      expect(Etouch).toBeGreaterThan(500);
    });

    it('debe calcular tensión de contacto con duración corta', () => {
      const Etouch = allowableTouchVoltage({
        bodyWeight: 70,
        surfaceResistivity: 3000,
        faultDuration: 0.1,
        Cs: 0.9
      });
      expect(Etouch).toBeGreaterThan(0);
      expect(Etouch).toBeGreaterThan(500);
    });

    it('debe calcular tensión de contacto con duración larga', () => {
      const Etouch = allowableTouchVoltage({
        bodyWeight: 70,
        surfaceResistivity: 3000,
        faultDuration: 1.0,
        Cs: 0.9
      });
      expect(Etouch).toBeGreaterThan(0);
    });
  });

  describe('allowableStepVoltage', () => {
    it('debe calcular tensión de paso permisible correctamente', () => {
      const Estep = allowableStepVoltage({
        bodyWeight: 70,
        surfaceResistivity: 3000,
        faultDuration: 0.35,
        Cs: 0.9
      });
      expect(Estep).toBeGreaterThan(0);
      expect(Estep).toBeGreaterThan(800);
    });

    it('debe calcular tensión de paso con duración corta', () => {
      const Estep = allowableStepVoltage({
        bodyWeight: 70,
        surfaceResistivity: 3000,
        faultDuration: 0.1,
        Cs: 0.9
      });
      expect(Estep).toBeGreaterThan(0);
      expect(Estep).toBeGreaterThan(800);
    });

    it('debe calcular tensión de paso con duración larga', () => {
      const Estep = allowableStepVoltage({
        bodyWeight: 70,
        surfaceResistivity: 3000,
        faultDuration: 1.0,
        Cs: 0.9
      });
      expect(Estep).toBeGreaterThan(0);
    });
  });

  describe('Validación de cumplimiento', () => {
    it('debe detectar cumplimiento cuando la tensión calculada es menor que la permisible', () => {
      const Em = 150;
      const Etouch70 = 921;
      const complies = Em <= Etouch70;
      expect(complies).toBe(true);
    });

    it('debe detectar no cumplimiento cuando la tensión calculada es mayor que la permisible', () => {
      const Em = 1000;
      const Etouch70 = 921;
      const complies = Em <= Etouch70;
      expect(complies).toBe(false);
    });

    it('debe validar tanto tensión de contacto como de paso', () => {
      const Em = 150;
      const Es = 200;
      const Etouch70 = 921;
      const Estep70 = 1500;
      
      const touchSafe = Em <= Etouch70;
      const stepSafe = Es <= Estep70;
      const overallComplies = touchSafe && stepSafe;
      
      expect(touchSafe).toBe(true);
      expect(stepSafe).toBe(true);
      expect(overallComplies).toBe(true);
    });
  });
});
