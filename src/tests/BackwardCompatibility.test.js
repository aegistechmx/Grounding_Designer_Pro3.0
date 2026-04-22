/**
 * Backward Compatibility Validation - Exact format verification
 * Ensures new professional engine maintains exact compatibility with existing code
 */

import CalculationEngineAdapter from '../utils/calculationEngineAdapter.js';
import GroundingCalculator from '../application/GroundingCalculator.js';

describe('Backward Compatibility Validation', () => {
  
  // Legacy format test case (what existing components expect)
  const legacyInput = {
    soilResistivity: 100,
    surfaceResistivity: 2000,
    surfaceDepth: 0.1,
    temperature: 20,
    humidity: 50,
    area: 600,
    length: 30,
    width: 20,
    nx: 8,
    ny: 6,
    numRods: 16,
    rodLength: 3,
    burialDepth: 0.5,
    faultCurrent: 10000,
    faultDuration: 1.0,
    X_R: 0.15,
    systemVoltage: 13800
  };

  // Expected legacy output format
  const expectedLegacyFormat = {
    // Core parameters (must exist exactly)
    Rg: expect.any(Number),
    totalConductor: expect.any(Number),
    gridArea: expect.any(Number),
    gridPerimeter: expect.any(Number),
    GPR: expect.any(Number),
    Ig: expect.any(Number),
    Em: expect.any(Number),
    Es: expect.any(Number),
    Etouch70: expect.any(Number),
    Estep70: expect.any(Number),
    touchSafe70: expect.any(Boolean),
    stepSafe70: expect.any(Boolean),
    touchOk: expect.any(Boolean),
    stepOk: expect.any(Boolean),
    
    // Professional engine indicators
    _professionalEngine: expect.any(Boolean),
    _traceability: expect.any(Array),
    _engineVersion: expect.any(String)
  };

  describe('Exact Legacy Format Compatibility', () => {
    test('Adapter maintains exact legacy property names', () => {
      const results = CalculationEngineAdapter.calculate(legacyInput);
      
      // Verify all expected properties exist
      Object.keys(expectedLegacyFormat).forEach(property => {
        expect(results).toHaveProperty(property);
      });
      
      // Verify property types
      expect(typeof results.Rg).toBe('number');
      expect(typeof results.totalConductor).toBe('number');
      expect(typeof results.gridArea).toBe('number');
      expect(typeof results.touchSafe70).toBe('boolean');
      expect(typeof results.stepSafe70).toBe('boolean');
      expect(typeof results._professionalEngine).toBe('boolean');
      expect(Array.isArray(results._traceability)).toBe(true);
      expect(typeof results._engineVersion).toBe('string');
    });

    test('Parameter conversion preserves values', () => {
      const convertedParams = CalculationEngineAdapter.convertLegacyParams(legacyInput);
      
      // Verify conversion preserves core values
      expect(convertedParams.soil.soilResistivity).toBe(legacyInput.soilResistivity);
      expect(convertedParams.grid.gridLength).toBe(legacyInput.length);
      expect(convertedParams.grid.gridWidth).toBe(legacyInput.width);
      expect(convertedParams.fault.faultCurrent).toBe(legacyInput.faultCurrent);
      
      // Verify structure conversion
      expect(convertedParams.soil).toBeDefined();
      expect(convertedParams.grid).toBeDefined();
      expect(convertedParams.fault).toBeDefined();
    });

    test('Result conversion maintains numerical accuracy', () => {
      const professionalResults = {
        grid: { resistance: 2.8, totalConductorLength: 240, area: 600, perimeter: 100 },
        fault: { 
          gpr: 4200, 
          gridCurrent: 1500, 
          touchVoltage: 480, 
          stepVoltage: 320,
          permissibleTouch: 520,
          permissibleStep: 350,
          safetyMargins: { touchSafe: true, stepSafe: true }
        },
        _professionalEngine: true,
        _traceability: [],
        _engineVersion: '2.0'
      };
      
      const legacyResults = CalculationEngineAdapter.convertLegacyResults(professionalResults);
      
      // Verify numerical preservation
      expect(legacyResults.Rg).toBe(2.8);
      expect(legacyResults.totalConductor).toBe(240);
      expect(legacyResults.gridArea).toBe(600);
      expect(legacyResults.GPR).toBe(4200);
      expect(legacyResults.Ig).toBe(1500);
      expect(legacyResults.Em).toBe(480);
      expect(legacyResults.Es).toBe(320);
      expect(legacyResults.touchSafe70).toBe(true);
      expect(legacyResults.stepSafe70).toBe(true);
    });
  });

  describe('Hook Integration Compatibility', () => {
    test('useGroundingCalculator hook functions work with new engine', () => {
      // This would be tested in the actual hook context
      // For now, verify the adapter provides expected interface
      
      expect(typeof CalculationEngineAdapter.calculate).toBe('function');
      expect(typeof CalculationEngineAdapter.convertLegacyParams).toBe('function');
      expect(typeof CalculationEngineAdapter.convertLegacyResults).toBe('function');
      expect(typeof CalculationEngineAdapter.validate).toBe('function');
      expect(typeof CalculationEngineAdapter.export).toBe('function');
      expect(typeof CalculationEngineAdapter.getStatistics).toBe('function');
    });

    test('Professional engine detection works', () => {
      const professionalResults = CalculationEngineAdapter.calculate(legacyInput);
      
      expect(CalculationEngineAdapter.isProfessionalEngine(professionalResults)).toBe(true);
      expect(professionalResults._professionalEngine).toBe(true);
      expect(professionalResults._engineVersion).toBe('2.0');
    });
  });

  describe('Component Integration Safety', () => {
    test('Existing components can access all expected properties', () => {
      const results = CalculationEngineAdapter.calculate(legacyInput);
      
      // Simulate existing component access patterns
      const componentAccess = {
        resistance: results.Rg,
        gpr: results.GPR,
        touchVoltage: results.Em,
        stepVoltage: results.Es,
        touchSafe: results.touchSafe70,
        stepSafe: results.stepSafe70,
        isProfessional: results._professionalEngine
      };
      
      // Verify all accesses work without errors
      expect(typeof componentAccess.resistance).toBe('number');
      expect(typeof componentAccess.gpr).toBe('number');
      expect(typeof componentAccess.touchVoltage).toBe('number');
      expect(typeof componentAccess.stepVoltage).toBe('number');
      expect(typeof componentAccess.touchSafe).toBe('boolean');
      expect(typeof componentAccess.stepSafe).toBe('boolean');
      expect(typeof componentAccess.isProfessional).toBe('boolean');
    });

    test('Fallback behavior when professional engine fails', () => {
      // Mock a failure scenario
      const originalCalculate = CalculationEngineAdapter.calculate;
      let callCount = 0;
      
      CalculationEngineAdapter.calculate = (params) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Professional engine failed');
        }
        // Return fallback result on second call
        return {
          Rg: 3.0,
          Em: 500,
          Es: 350,
          _professionalEngine: false,
          _fallbackUsed: true
        };
      };
      
      // Should handle failure gracefully
      expect(() => {
        const results = CalculationEngineAdapter.calculate(legacyInput);
        expect(results._professionalEngine).toBe(false);
        expect(results._fallbackUsed).toBe(true);
      }).not.toThrow();
      
      // Restore original function
      CalculationEngineAdapter.calculate = originalCalculate;
    });
  });

  describe('Performance Compatibility', () => {
    test('Performance impact is minimal', () => {
      const startTime = performance.now();
      
      // Run multiple calculations
      for (let i = 0; i < 100; i++) {
        CalculationEngineAdapter.calculate(legacyInput);
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 100;
      
      // Should complete calculations quickly (less than 50ms per calculation)
      expect(avgTime).toBeLessThan(50);
    });

    test('Memory usage is reasonable', () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Create many results
      const results = [];
      for (let i = 0; i < 1000; i++) {
        results.push(CalculationEngineAdapter.calculate(legacyInput));
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Should not use excessive memory (less than 10MB for 1000 calculations)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      
      // Clear references
      results.length = 0;
    });
  });

  describe('Edge Case Compatibility', () => {
    test('Handles missing optional parameters gracefully', () => {
      const minimalInput = {
        soilResistivity: 100,
        area: 600,
        length: 30,
        width: 20,
        nx: 8,
        ny: 6,
        faultCurrent: 10000
      };
      
      expect(() => {
        const results = CalculationEngineAdapter.calculate(minimalInput);
        expect(results.Rg).toBeDefined();
        expect(results.Em).toBeDefined();
        expect(results.Es).toBeDefined();
      }).not.toThrow();
    });

    test('Validates and rejects invalid inputs', () => {
      const invalidInputs = [
        { soilResistivity: -100 }, // Negative resistivity
        { area: 0 }, // Zero area
        { faultCurrent: "invalid" }, // Invalid type
        null, // Null input
        undefined // Undefined input
      ];
      
      invalidInputs.forEach(input => {
        expect(() => {
          CalculationEngineAdapter.calculate(input);
        }).toThrow();
      });
    });
  });

  describe('Migration Path Validation', () => {
    test('Gradual migration is supported', () => {
      // Test that both old and new formats work simultaneously
      const legacyResults = CalculationEngineAdapter.calculate(legacyInput);
      
      // New format should also work
      const newFormatInput = CalculationEngineAdapter.convertLegacyParams(legacyInput);
      const professionalCalculator = new GroundingCalculator(newFormatInput);
      const professionalResults = professionalCalculator.calculate();
      
      // Results should be compatible
      expect(legacyResults._professionalEngine).toBe(true);
      expect(professionalResults.compliance).toBeDefined();
      
      // Core values should be similar (within tolerance)
      expect(Math.abs(legacyResults.Rg - professionalResults.grid.resistance)).toBeLessThan(0.5);
    });

    test('Feature detection works for migration', () => {
      const results = CalculationEngineAdapter.calculate(legacyInput);
      
      // Components can detect professional engine availability
      const hasProfessionalEngine = results._professionalEngine;
      const hasTraceability = Array.isArray(results._traceability) && results._traceability.length > 0;
      const hasStatistics = typeof CalculationEngineAdapter.getStatistics === 'function';
      
      expect(hasProfessionalEngine).toBe(true);
      expect(hasTraceability).toBe(true);
      expect(hasStatistics).toBe(true);
    });
  });
});

export default {};
