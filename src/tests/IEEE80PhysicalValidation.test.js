/**
 * IEEE 80 Physical Validation Test - Real Engineering Case
 * Validates physical consistency of the calculation engine
 * Based on realistic substation grounding scenario
 */

import GroundingCalculator from '../application/GroundingCalculator.js';

describe('IEEE 80 Physical Validation', () => {
  
  // Realistic substation case (50x50m grid)
  const ieee80TestCase = {
    name: 'IEEE 80 Physical Validation - Medium Substation',
    description: 'Realistic 50x50m substation grounding grid validation',
    input: {
      soil: {
        model: 'uniform',
        soilResistivity: 100,          // ohm-m (typical soil)
        surfaceLayerResistivity: 3000, // ohm-m (gravel surface)
        surfaceLayerThickness: 0.1,    // m (10cm gravel)
        temperature: 20,
        humidity: 50,
        season: 'normal'
      },
      grid: {
        gridLength: 50,               // m
        gridWidth: 50,                // m
        numParallel: 11,              // 5m spacing
        numParallelY: 11,            // 5m spacing
        numRods: 4,                   // Corner rods
        rodLength: 3,                // m
        gridDepth: 0.5,              // m
        conductorSize: '4/0',
        conductorMaterial: 'copper'
      },
      fault: {
        faultCurrent: 10000,          // A (10kA fault)
        faultDuration: 0.5,          // s
        systemVoltage: 13800,        // V
        divisionFactor: 0.15,        // Typical split factor
        bodyWeight: 70,              // kg
        faultType: 'single_line_to_ground'
      }
    },
    
    // Expected ranges based on IEEE 80 calculations
    expected: {
      gridResistance: {
        min: 0.04,    // ohms
        max: 0.07,    // ohms
        calculation: 'Rg = 4L/rho'
      },
      gpr: {
        min: 400,     // V
        max: 700,     // V  
        calculation: 'GPR = If * Rg'
      },
      stepVoltage: {
        min: 250,     // V
        max: 400,     // V
        calculation: 'Estep = (rho * If) / (2*pi*L)'
      },
      touchVoltage: {
        min: 400,     // V
        max: 700,     // V
        calculation: 'Et = 1.5 * Estep (typical)'
      }
    }
  };

  describe('IEEE 80 Physical Consistency Validation', () => {
    test('IEEE 80 grounding validation case - physical consistency', () => {
      console.log('\n=== IEEE 80 Physical Validation Test ===');
      console.log('Case:', ieee80TestCase.name);
      console.log('Input:', JSON.stringify(ieee80TestCase.input, null, 2));
      
      const calculator = new GroundingCalculator(ieee80TestCase.input);
      const results = calculator.calculate();
      
      console.log('\n=== Results ===');
      console.log('Grid Resistance:', results.grid.resistance.toFixed(4), '×');
      console.log('GPR:', results.fault.gpr.toFixed(0), 'V');
      console.log('Step Voltage:', results.fault.stepVoltage.toFixed(0), 'V');
      console.log('Touch Voltage:', results.fault.touchVoltage.toFixed(0), 'V');
      console.log('Grid Current:', results.fault.gridCurrent.toFixed(0), 'A');
      
      console.log('\n=== Expected Ranges ===');
      console.log('Grid Resistance:', ieee80TestCase.expected.gridResistance.min, '-', ieee80TestCase.expected.gridResistance.max, '×');
      console.log('GPR:', ieee80TestCase.expected.gpr.min, '-', ieee80TestCase.expected.gpr.max, 'V');
      console.log('Step Voltage:', ieee80TestCase.expected.stepVoltage.min, '-', ieee80TestCase.expected.stepVoltage.max, 'V');
      console.log('Touch Voltage:', ieee80TestCase.expected.touchVoltage.min, '-', ieee80TestCase.expected.touchVoltage.max, 'V');

      // Grid resistance validation
      const { min: rgMin, max: rgMax } = ieee80TestCase.expected.gridResistance;
      expect(results.grid.resistance).toBeGreaterThan(rgMin);
      expect(results.grid.resistance).toBeLessThan(rgMax);
      
      console.log('Grid Resistance: PASS -', results.grid.resistance.toFixed(4), '× within [', rgMin, ',', rgMax, ']');

      // GPR validation
      const { min: gprMin, max: gprMax } = ieee80TestCase.expected.gpr;
      expect(results.fault.gpr).toBeGreaterThan(gprMin);
      expect(results.fault.gpr).toBeLessThan(gprMax);
      
      console.log('GPR: PASS -', results.fault.gpr.toFixed(0), 'V within [', gprMin, ',', gprMax, ']');

      // Step voltage validation
      const { min: stepMin, max: stepMax } = ieee80TestCase.expected.stepVoltage;
      expect(results.fault.stepVoltage).toBeGreaterThan(stepMin);
      expect(results.fault.stepVoltage).toBeLessThan(stepMax);
      
      console.log('Step Voltage: PASS -', results.fault.stepVoltage.toFixed(0), 'V within [', stepMin, ',', stepMax, ']');

      // Touch voltage validation
      const { min: touchMin, max: touchMax } = ieee80TestCase.expected.touchVoltage;
      expect(results.fault.touchVoltage).toBeGreaterThan(touchMin);
      expect(results.fault.touchVoltage).toBeLessThan(touchMax);
      
      console.log('Touch Voltage: PASS -', results.fault.touchVoltage.toFixed(0), 'V within [', touchMin, ',', touchMax, ']');

      // Additional physical consistency checks
      console.log('\n=== Physical Consistency Checks ===');
      
      // GPR should be approximately grid current * grid resistance
      const calculatedGPR = results.fault.gridCurrent * results.grid.resistance;
      const gprError = Math.abs(results.fault.gpr - calculatedGPR) / calculatedGPR * 100;
      expect(gprError).toBeLessThan(5); // Within 5%
      console.log('GPR Consistency:', gprError.toFixed(1), '% error - PASS');

      // Touch voltage should be higher than step voltage
      expect(results.fault.touchVoltage).toBeGreaterThan(results.fault.stepVoltage);
      console.log('Touch > Step:', results.fault.touchVoltage.toFixed(0), 'V >', results.fault.stepVoltage.toFixed(0), 'V - PASS');

      // All values should be positive
      expect(results.grid.resistance).toBeGreaterThan(0);
      expect(results.fault.gpr).toBeGreaterThan(0);
      expect(results.fault.stepVoltage).toBeGreaterThan(0);
      expect(results.fault.touchVoltage).toBeGreaterThan(0);
      console.log('Positive Values: All positive - PASS');

      console.log('\n=== ENGINE VALIDATION: PHYSICALLY CONSISTENT ===');
    });

    test('Detailed calculation verification', () => {
      const calculator = new GroundingCalculator(ieee80TestCase.input);
      const results = calculator.calculate();
      
      // Verify traceability exists for audit
      expect(results.traceability).toBeDefined();
      expect(Array.isArray(results.traceability)).toBe(true);
      expect(results.traceability.length).toBeGreaterThan(10);
      
      // Check for critical calculation traces
      const criticalCalculations = results.traceability.filter(trace => 
        trace.calculation.includes('grid_resistance') ||
        trace.calculation.includes('gpr') ||
        trace.calculation.includes('step_voltage') ||
        trace.calculation.includes('touch_voltage')
      );
      
      expect(criticalCalculations.length).toBeGreaterThanOrEqual(4);
      
      console.log('\n=== Traceability Analysis ===');
      console.log('Total trace entries:', results.traceability.length);
      console.log('Critical calculations:', criticalCalculations.length);
      
      criticalCalculations.forEach(trace => {
        console.log('-', trace.calculation, ':', trace.value || trace.standard);
      });
    });

    test('Engineering tolerances validation', () => {
      const calculator = new GroundingCalculator(ieee80TestCase.input);
      const results = calculator.calculate();
      
      // Test engineering tolerances (not exact equality)
      const engineeringTolerances = {
        gridResistance: 0.20,    // ±20%
        gpr: 0.25,              // ±25%
        stepVoltage: 0.30,     // ±30%
        touchVoltage: 0.30     // ±30%
      };
      
      // Expected values based on simplified calculations
      const expectedSimplified = {
        gridResistance: 100 / (4 * 500), // 0.05 ohms
        gpr: 10000 * 0.05,               // 500 V
        stepVoltage: (100 * 10000) / (2 * Math.PI * 500), // ~318 V
        touchVoltage: 1.5 * 318          // ~477 V
      };
      
      // Check each parameter within engineering tolerance
      Object.keys(engineeringTolerances).forEach(param => {
        const tolerance = engineeringTolerances[param];
        const expected = expectedSimplified[param];
        const actual = param === 'gridResistance' ? results.grid.resistance :
                      param === 'gpr' ? results.fault.gpr :
                      param === 'stepVoltage' ? results.fault.stepVoltage :
                      results.fault.touchVoltage;
        
        const error = Math.abs(actual - expected) / expected;
        expect(error).toBeLessThan(tolerance);
        
        console.log(`${param}: ${actual.toFixed(2)} vs ${expected.toFixed(2)} (${(error * 100).toFixed(1)}% error) - PASS`);
      });
    });
  });

  describe('Error Diagnosis Framework', () => {
    test('Failure diagnosis helper', () => {
      // This test helps diagnose where the engine might fail
      const calculator = new GroundingCalculator(ieee80TestCase.input);
      
      try {
        const results = calculator.calculate();
        
        const diagnosis = {
          gridResistanceOK: results.grid.resistance >= 0.04 && results.grid.resistance <= 0.07,
          gprOK: results.fault.gpr >= 400 && results.fault.gpr <= 700,
          stepVoltageOK: results.fault.stepVoltage >= 250 && results.fault.stepVoltage <= 400,
          touchVoltageOK: results.fault.touchVoltage >= 400 && results.fault.touchVoltage <= 700,
          physicalConsistency: {
            gprMatches: Math.abs(results.fault.gpr - (results.fault.gridCurrent * results.grid.resistance)) / (results.fault.gridCurrent * results.grid.resistance) < 0.05,
            touchGreaterThanStep: results.fault.touchVoltage > results.fault.stepVoltage,
            allPositive: results.grid.resistance > 0 && results.fault.gpr > 0 && results.fault.stepVoltage > 0 && results.fault.touchVoltage > 0
          }
        };
        
        console.log('\n=== Diagnosis Results ===');
        console.log('Grid Resistance:', diagnosis.gridResistanceOK ? 'PASS' : 'FAIL');
        console.log('GPR:', diagnosis.gprOK ? 'PASS' : 'FAIL');
        console.log('Step Voltage:', diagnosis.stepVoltageOK ? 'PASS' : 'FAIL');
        console.log('Touch Voltage:', diagnosis.touchVoltageOK ? 'PASS' : 'FAIL');
        console.log('Physical Consistency:', diagnosis.physicalConsistency);
        
        // If any test fails, provide specific guidance
        if (!diagnosis.gridResistanceOK) {
          console.log('DIAGNOSIS: Grid resistance issue - check GridModel calculations');
        }
        if (!diagnosis.gprOK) {
          console.log('DIAGNOSIS: GPR issue - check fault current integration');
        }
        if (!diagnosis.stepVoltageOK || !diagnosis.touchVoltageOK) {
          console.log('DIAGNOSIS: Voltage issue - check SoilModel and IEEE formulas');
        }
        
      } catch (error) {
        console.log('CALCULATION FAILED:', error.message);
        throw error;
      }
    });
  });
});

export default {};
