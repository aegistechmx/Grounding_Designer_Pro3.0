/**
 * Professional Test Suite for Grounding Calculator
 * Comprehensive testing of all calculation engine components
 */

import GroundingCalculator from '../application/GroundingCalculator.js';
import IEEE80Service from '../services/ieee80Service.js';
import { ValidationUtils, ValidationError } from '../utils/validation.js';
import UnitsUtils from '../utils/units.js';

describe('GroundingCalculator Professional Test Suite', () => {
  
  // Test Data
  const standardInput = {
    soil: {
      soilResistivity: 100,
      surfaceLayerResistivity: 3000,
      surfaceLayerThickness: 0.1,
      temperature: 20,
      humidity: 50,
      season: 'normal'
    },
    grid: {
      gridLength: 30,
      gridWidth: 16,
      numParallel: 15,
      numParallelY: 12,
      numRods: 45,
      rodLength: 3,
      gridDepth: 0.6,
      conductorSize: '4/0',
      conductorMaterial: 'copper'
    },
    fault: {
      faultCurrent: 10000,
      faultDuration: 0.5,
      systemVoltage: 13800,
      divisionFactor: 0.15,
      bodyResistance: 1000,
      bodyWeight: 70,
      faultType: 'single_line_to_ground'
    }
  };

  describe('Input Validation', () => {
    test('should accept valid input', () => {
      expect(() => {
        const calculator = new GroundingCalculator(standardInput);
      }).not.toThrow();
    });

    test('should reject missing soil parameters', () => {
      const invalidInput = { ...standardInput };
      delete invalidInput.soil;
      
      expect(() => {
        new GroundingCalculator(invalidInput);
      }).toThrow('Missing required sections: soil');
    });

    test('should reject missing grid parameters', () => {
      const invalidInput = { ...standardInput };
      delete invalidInput.grid;
      
      expect(() => {
        new GroundingCalculator(invalidInput);
      }).toThrow('Missing required sections: grid');
    });

    test('should reject missing fault parameters', () => {
      const invalidInput = { ...standardInput };
      delete invalidInput.fault;
      
      expect(() => {
        new GroundingCalculator(invalidInput);
      }).toThrow('Missing required sections: fault');
    });

    test('should reject negative soil resistivity', () => {
      const invalidInput = {
        ...standardInput,
        soil: { ...standardInput.soil, soilResistivity: -100 }
      };
      
      expect(() => {
        new GroundingCalculator(invalidInput);
      }).toThrow('soilResistivity must be a positive number');
    });

    test('should reject zero grid length', () => {
      const invalidInput = {
        ...standardInput,
        grid: { ...standardInput.grid, gridLength: 0 }
      };
      
      expect(() => {
        new GroundingCalculator(invalidInput);
      }).toThrow('gridLength must be a positive number');
    });

    test('should reject negative fault current', () => {
      const invalidInput = {
        ...standardInput,
        fault: { ...standardInput.fault, faultCurrent: -1000 }
      };
      
      expect(() => {
        new GroundingCalculator(invalidInput);
      }).toThrow('faultCurrent must be a positive number');
    });
  });

  describe('Soil Model Calculations', () => {
    test('should calculate effective resistivity correctly', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      expect(results.soil.effectiveResistivity).toBeGreaterThan(0);
      expect(results.soil.effectiveResistivity).toBeLessThan(1000);
    });

    test('should calculate surface layer factor', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      expect(results.soil.surfaceLayerFactor).toBeGreaterThanOrEqual(0.5);
      expect(results.soil.surfaceLayerFactor).toBeLessThanOrEqual(2.0);
    });

    test('should assess soil quality', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      expect(['excellent', 'good', 'fair', 'poor', 'very_poor']).toContain(results.soil.soilQuality.quality);
      expect(results.soil.soilQuality.color).toBeDefined();
    });

    test('should handle high resistivity soil', () => {
      const highResistivityInput = {
        ...standardInput,
        soil: { ...standardInput.soil, soilResistivity: 1000 }
      };
      
      const calculator = new GroundingCalculator(highResistivityInput);
      const results = calculator.calculate();
      
      expect(results.soil.soilQuality.quality).toBe('poor');
    });

    test('should handle low resistivity soil', () => {
      const lowResistivityInput = {
        ...standardInput,
        soil: { ...standardInput.soil, soilResistivity: 10 }
      };
      
      const calculator = new GroundingCalculator(lowResistivityInput);
      const results = calculator.calculate();
      
      expect(results.soil.soilQuality.quality).toBe('excellent');
    });
  });

  describe('Grid Model Calculations', () => {
    test('should calculate grid area correctly', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      const expectedArea = 30 * 16; // 480 m²
      expect(results.grid.area).toBeCloseTo(expectedArea, 2);
    });

    test('should calculate total conductor length', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      expect(results.grid.totalConductorLength).toBeGreaterThan(0);
      expect(results.grid.totalConductorLength).toBeGreaterThan(results.grid.area); // Should be more than area
    });

    test('should calculate grid perimeter correctly', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      const expectedPerimeter = 2 * (30 + 16); // 92 m
      expect(results.grid.perimeter).toBeCloseTo(expectedPerimeter, 2);
    });

    test('should calculate grid resistance within reasonable bounds', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      expect(results.grid.resistance).toBeGreaterThan(0);
      expect(results.grid.resistance).toBeLessThan(50); // Should be reasonable for this configuration
    });

    test('should calculate mesh spacing', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      expect(results.grid.meshSpacing.x).toBeGreaterThan(0);
      expect(results.grid.meshSpacing.y).toBeGreaterThan(0);
    });

    test('should calculate geometric factors', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      expect(results.grid.geometricFactor.Ks).toBeGreaterThan(0);
      expect(results.grid.geometricFactor.Km).toBeGreaterThan(0);
    });
  });

  describe('Fault Model Calculations', () => {
    test('should calculate grid current correctly', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      const expectedGridCurrent = 10000 * 0.15; // 1500 A
      expect(results.fault.gridCurrent).toBeCloseTo(expectedGridCurrent, 2);
    });

    test('should calculate GPR correctly', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      expect(results.fault.gpr).toBeGreaterThan(0);
      expect(results.fault.gpr).toBeLessThan(10000); // Should be reasonable
    });

    test('should calculate step and touch voltages', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      expect(results.fault.stepVoltage).toBeGreaterThan(0);
      expect(results.fault.touchVoltage).toBeGreaterThan(0);
      expect(results.fault.touchVoltage).toBeGreaterThan(results.fault.stepVoltage); // Touch voltage usually higher
    });

    test('should calculate permissible voltages according to IEEE 70', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      expect(results.fault.permissibleStep).toBeGreaterThan(0);
      expect(results.fault.permissibleTouch).toBeGreaterThan(0);
      expect(results.fault.permissibleStep).toBeLessThan(results.fault.permissibleTouch); // Step limit usually lower
    });

    test('should calculate safety margins', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      expect(results.fault.safetyMargins.touchMargin).toBeGreaterThanOrEqual(0);
      expect(results.fault.safetyMargins.stepMargin).toBeGreaterThanOrEqual(0);
      expect(typeof results.fault.safetyMargins.touchSafe).toBe('boolean');
      expect(typeof results.fault.safetyMargins.stepSafe).toBe('boolean');
    });

    test('should calculate fault distribution', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      expect(results.fault.faultDistribution.totalFault).toBe(10000);
      expect(results.fault.faultDistribution.gridReturn).toBe(1500);
      expect(results.fault.faultDistribution.earthReturn).toBe(8500);
    });
  });

  describe('Compliance and Safety', () => {
    test('should assess IEEE 80 compliance', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      expect(typeof results.compliance.overall).toBe('boolean');
      expect(typeof results.compliance.touch).toBe('boolean');
      expect(typeof results.compliance.step).toBe('boolean');
      expect(typeof results.compliance.resistance).toBe('boolean');
    });

    test('should generate recommendations for unsafe conditions', () => {
      const unsafeInput = {
        ...standardInput,
        soil: { ...standardInput.soil, soilResistivity: 2000 }, // High resistivity
        grid: { ...standardInput.grid, numParallel: 5, numRods: 10 }, // Minimal grid
        fault: { ...standardInput.fault, faultCurrent: 50000 } // High fault current
      };
      
      const calculator = new GroundingCalculator(unsafeInput);
      const results = calculator.calculate();
      
      expect(results.recommendations).toBeInstanceOf(Array);
      expect(results.recommendations.length).toBeGreaterThan(0);
      
      // Should have safety recommendations
      const safetyRecs = results.recommendations.filter(r => r.category === 'safety');
      expect(safetyRecs.length).toBeGreaterThan(0);
    });

    test('should assess risk level', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      expect(['low', 'medium', 'high', 'critical']).toContain(results.riskAssessment.level);
      expect(results.riskAssessment.score).toBeGreaterThanOrEqual(0);
      expect(results.riskAssessment.score).toBeLessThanOrEqual(100);
      expect(results.riskAssessment.assessment).toBeDefined();
    });
  });

  describe('Traceability', () => {
    test('should provide full traceability', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      expect(results.traceability).toBeInstanceOf(Array);
      expect(results.traceability.length).toBeGreaterThan(10); // Should have many trace entries
      
      // Check traceability structure
      const traceEntry = results.traceability[0];
      expect(traceEntry.timestamp).toBeDefined();
      expect(traceEntry.calculation).toBeDefined();
    });

    test('should include model traceability', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      // Should have traceability from all models
      const soilTraces = results.traceability.filter(t => t.calculation.includes('soil'));
      const gridTraces = results.traceability.filter(t => t.calculation.includes('grid'));
      const faultTraces = results.traceability.filter(t => t.calculation.includes('fault'));
      
      expect(soilTraces.length).toBeGreaterThan(0);
      expect(gridTraces.length).toBeGreaterThan(0);
      expect(faultTraces.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle minimal grid configuration', () => {
      const minimalInput = {
        soil: { soilResistivity: 100 },
        grid: { gridLength: 10, gridWidth: 10, numParallel: 2, numRods: 4 },
        fault: { faultCurrent: 1000, faultDuration: 0.5 }
      };
      
      expect(() => {
        const calculator = new GroundingCalculator(minimalInput);
        const results = calculator.calculate();
        expect(results).toBeDefined();
      }).not.toThrow();
    });

    test('should handle large grid configuration', () => {
      const largeInput = {
        soil: { soilResistivity: 100 },
        grid: { gridLength: 200, gridWidth: 150, numParallel: 50, numRods: 200 },
        fault: { faultCurrent: 50000, faultDuration: 1.0 }
      };
      
      expect(() => {
        const calculator = new GroundingCalculator(largeInput);
        const results = calculator.calculate();
        expect(results).toBeDefined();
      }).not.toThrow();
    });

    test('should handle very high soil resistivity', () => {
      const highResistivityInput = {
        ...standardInput,
        soil: { ...standardInput.soil, soilResistivity: 5000 }
      };
      
      const calculator = new GroundingCalculator(highResistivityInput);
      const results = calculator.calculate();
      
      expect(results.grid.resistance).toBeGreaterThan(5); // Should have high resistance
      expect(results.soil.soilQuality.quality).toBe('very_poor');
    });

    test('should handle very low soil resistivity', () => {
      const lowResistivityInput = {
        ...standardInput,
        soil: { ...standardInput.soil, soilResistivity: 5 }
      };
      
      const calculator = new GroundingCalculator(lowResistivityInput);
      const results = calculator.calculate();
      
      expect(results.grid.resistance).toBeLessThan(1); // Should have low resistance
      expect(results.soil.soilQuality.quality).toBe('excellent');
    });
  });

  describe('Export and Import', () => {
    test('should export results in JSON format', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      expect(() => {
        const exported = calculator.export('json');
        const parsed = JSON.parse(exported);
        expect(parsed.soil).toBeDefined();
        expect(parsed.grid).toBeDefined();
        expect(parsed.fault).toBeDefined();
      }).not.toThrow();
    });

    test('should export summary format', () => {
      const calculator = new GroundingCalculator(standardInput);
      const results = calculator.calculate();
      
      expect(() => {
        const summary = calculator.export('summary');
        expect(summary).toContain('Grounding System Analysis Summary');
        expect(summary).toContain('Grid Resistance');
        expect(summary).toContain('Touch Voltage');
        expect(summary).toContain('Step Voltage');
      }).not.toThrow();
    });

    test('should throw error for invalid export format', () => {
      const calculator = new GroundingCalculator(standardInput);
      calculator.calculate();
      
      expect(() => {
        calculator.export('invalid');
      }).toThrow('Unsupported export format: invalid');
    });
  });

  describe('Statistics', () => {
    test('should provide calculation statistics', () => {
      const calculator = new GroundingCalculator(standardInput);
      calculator.calculate();
      
      const stats = calculator.getStatistics();
      
      expect(stats.totalCalculations).toBeGreaterThan(0);
      expect(stats.modelsUsed).toContain('soil');
      expect(stats.modelsUsed).toContain('grid');
      expect(stats.modelsUsed).toContain('fault');
      expect(typeof stats.complianceStatus).toBe('boolean');
      expect(stats.riskScore).toBeGreaterThanOrEqual(0);
    });

    test('should return null stats before calculation', () => {
      const calculator = new GroundingCalculator(standardInput);
      
      expect(calculator.getStatistics()).toBeNull();
    });
  });
});

describe('IEEE80Service Tests', () => {
  const standardParams = {
    soilResistivity: 100,
    gridLength: 30,
    gridWidth: 16,
    numParallel: 15,
    numRods: 45,
    faultCurrent: 10000,
    faultDuration: 0.5
  };

  test('should perform quick calculation', () => {
    const results = IEEE80Service.quickCalculate(standardParams);
    
    expect(results.soil).toBeDefined();
    expect(results.grid).toBeDefined();
    expect(results.fault).toBeDefined();
    expect(results.compliance).toBeDefined();
  });

  test('should validate input correctly', () => {
    const validation = IEEE80Service.validateInput({
      soil: { soilResistivity: 100 },
      grid: { gridLength: 30, gridWidth: 16, numParallel: 15, numRods: 45 },
      fault: { faultCurrent: 10000, faultDuration: 0.5 }
    });
    
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('should detect invalid input', () => {
    const validation = IEEE80Service.validateInput({
      soil: { soilResistivity: -100 }, // Invalid
      grid: { gridLength: 30, gridWidth: 16, numParallel: 15, numRods: 45 },
      fault: { faultCurrent: 10000, faultDuration: 0.5 }
    });
    
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  test('should generate design recommendations', () => {
    const recommendations = IEEE80Service.getDesignRecommendations({
      area: 480,
      resistivity: 100,
      faultCurrent: 10000,
      safetyMargin: 20
    });
    
    expect(recommendations.grid).toBeDefined();
    expect(recommendations.rods).toBeDefined();
    expect(recommendations.conductors).toBeDefined();
  });

  test('should run validation tests', () => {
    const testResults = IEEE80Service.runTests();
    
    expect(testResults.total).toBeGreaterThan(0);
    expect(testResults.passed).toBeGreaterThanOrEqual(0);
    expect(testResults.failed).toBeGreaterThanOrEqual(0);
    expect(testResults.results).toHaveLength(testResults.total);
  });

  test('should export IEEE 80 format', () => {
    const results = IEEE80Service.quickCalculate(standardParams);
    const exported = IEEE80Service.exportIEEE80Format(results);
    
    expect(exported.projectInfo).toBeDefined();
    expect(exported.projectInfo.standard).toBe('IEEE 80-2013');
    expect(exported.inputParameters).toBeDefined();
    expect(exported.calculationResults).toBeDefined();
  });
});

describe('ValidationUtils Tests', () => {
  test('should validate positive numbers', () => {
    expect(ValidationUtils.validatePositiveNumber(10, 'test')).toBe(10);
    expect(ValidationUtils.validatePositiveNumber(0.1, 'test')).toBe(0.1);
    
    expect(() => ValidationUtils.validatePositiveNumber(-1, 'test')).toThrow('must be greater than 0');
    expect(() => ValidationUtils.validatePositiveNumber(0, 'test')).toThrow('must be greater than 0');
  });

  test('should validate positive integers', () => {
    expect(ValidationUtils.validatePositiveInteger(10, 'test')).toBe(10);
    
    expect(() => ValidationUtils.validatePositiveInteger(10.5, 'test')).toThrow('must be an integer');
    expect(() => ValidationUtils.validatePositiveInteger(0, 'test')).toThrow('must be greater than 1');
  });

  test('should validate strings', () => {
    expect(ValidationUtils.validateString('test', 'test')).toBe('test');
    
    expect(() => ValidationUtils.validateString(123, 'test')).toThrow('must be a string');
    expect(() => ValidationUtils.validateString('', 'test', { minLength: 1 })).toThrow('must be at least 1 characters');
  });

  test('should validate complete grounding input', () => {
    const validInput = {
      soil: { soilResistivity: 100 },
      grid: { gridLength: 30, gridWidth: 16, numParallel: 15, numRods: 45 },
      fault: { faultCurrent: 10000, faultDuration: 0.5 }
    };
    
    const validation = ValidationUtils.validateGroundingInput(validInput);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('should detect invalid grounding input', () => {
    const invalidInput = {
      soil: { soilResistivity: -100 }, // Invalid
      grid: { gridLength: 30, gridWidth: 16, numParallel: 15, numRods: 45 },
      fault: { faultCurrent: 10000, faultDuration: 0.5 }
    };
    
    const validation = ValidationUtils.validateGroundingInput(invalidInput);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});

describe('UnitsUtils Tests', () => {
  test('should convert lengths correctly', () => {
    expect(UnitsUtils.convertLength(1, 'feet')).toBeCloseTo(0.3048, 4);
    expect(UnitsUtils.convertLength(100, 'meters')).toBe(100);
    expect(UnitsUtils.convertLength(12, 'inches')).toBeCloseTo(0.3048, 4);
  });

  test('should convert resistivity correctly', () => {
    expect(UnitsUtils.convertResistivity(100, 'ohm-centimeter')).toBe(1);
    expect(UnitsUtils.convertResistivity(1, 'ohm-meter')).toBe(1);
  });

  test('should convert AWG to mm²', () => {
    expect(UnitsUtils.convertAWGToMm2('4/0')).toBeCloseTo(107.16, 2);
    expect(UnitsUtils.convertAWGToMm2('2')).toBeCloseTo(33.63, 2);
  });

  test('should normalize grounding input', () => {
    const inputWithUnits = {
      soil: {
        soilResistivity: 100,
        soilResistivityUnit: 'ohm-centimeter',
        surfaceLayerThickness: 100,
        surfaceLayerThicknessUnit: 'millimeters'
      },
      grid: {
        gridLength: 100,
        gridLengthUnit: 'feet',
        gridWidth: 50,
        gridWidthUnit: 'feet',
        numParallel: 10,
        numRods: 20
      },
      fault: {
        faultCurrent: 1,
        faultCurrentUnit: 'kiloampere',
        faultDuration: 0.5
      }
    };
    
    const normalized = UnitsUtils.normalizeGroundingInput(inputWithUnits);
    
    expect(normalized.soil.soilResistivity).toBe(1); // 100 ohm-cm = 1 ohm-m
    expect(normalized.soil.surfaceLayerThickness).toBe(0.1); // 100 mm = 0.1 m
    expect(normalized.grid.gridLength).toBeCloseTo(30.48, 2); // 100 ft = 30.48 m
    expect(normalized.grid.gridWidth).toBeCloseTo(15.24, 2); // 50 ft = 15.24 m
    expect(normalized.fault.faultCurrent).toBe(1000); // 1 kA = 1000 A
  });

  test('should format values with units', () => {
    expect(UnitsUtils.formatLength(1.5)).toBe('1.50 m');
    expect(UnitsUtils.formatLength(0.5)).toBe('50.00 cm');
    expect(UnitsUtils.formatLength(1500)).toBe('1.50 km');
    
    expect(UnitsUtils.formatResistivity(100)).toBe('100 ohm-m');
    expect(UnitsUtils.formatResistivity(0.5)).toBe('50 ohm-cm');
    
    expect(UnitsUtils.formatVoltage(500)).toBe('500 V');
    expect(UnitsUtils.formatVoltage(5000)).toBe('5 kV');
    
    expect(UnitsUtils.formatCurrent(500)).toBe('500 A');
    expect(UnitsUtils.formatCurrent(5000)).toBe('5 kA');
  });
});

export default GroundingCalculator;
