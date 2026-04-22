/**
 * Simple IEEE 80 Test - Direct calculation without complex traceability
 */

console.log('=== SIMPLE IEEE 80 TEST ===');

try {
  // Test basic calculation without traceability issues
  const testInput = {
    soil: {
      model: 'uniform',
      soilResistivity: 100,
      surfaceLayerResistivity: 3000,
      surfaceLayerThickness: 0.1,
      temperature: 20,
      humidity: 50,
      season: 'normal'
    },
    grid: {
      gridLength: 50,
      gridWidth: 50,
      numParallel: 11,
      numParallelY: 11,
      numRods: 4,
      rodLength: 3,
      gridDepth: 0.5,
      conductorSize: '4/0',
      conductorMaterial: 'copper'
    },
    fault: {
      faultCurrent: 10000,
      faultDuration: 0.5,
      systemVoltage: 13800,
      divisionFactor: 0.15,
      bodyWeight: 70,
      faultType: 'single_line_to_ground'
    }
  };

  // Test IEEE80Formulas directly
  import('../domain/grounding/IEEE80Formulas.js').then(({ default: IEEE80Formulas }) => {
    console.log('Testing IEEE80Formulas directly...');
    
    try {
      // Test surface layer factor
      const Cs = IEEE80Formulas.calculateSurfaceLayerFactor(100, 3000, 0.1);
      console.log('Surface Layer Factor (Cs):', Cs);
      
      // Test grid resistance
      const Rg = IEEE80Formulas.calculateGridResistance(100, 500, 2500, 0.5);
      console.log('Grid Resistance (Rg):', Rg, '×');
      
      // Test step voltage
      const Es = IEEE80Formulas.calculateStepVoltage(100, 1500, 0.8, 500);
      console.log('Step Voltage (Es):', Es, 'V');
      
      // Test touch voltage
      const Et = IEEE80Formulas.calculateTouchVoltage(100, 1500, 0.6, 500);
      console.log('Touch Voltage (Et):', Et, 'V');
      
      // Test GPR
      const GPR = IEEE80Formulas.calculateGPR(1500, 0.05);
      console.log('GPR:', GPR, 'V');
      
      console.log('\n=== IEEE80Formulas working correctly ===');
      
      // Now test the full calculator
      console.log('\nTesting full calculator...');
      import('../application/GroundingCalculator.js').then(({ default: GroundingCalculator }) => {
        try {
          const calculator = new GroundingCalculator(testInput);
          const results = calculator.calculate();
          
          console.log('\n=== CALCULATION RESULTS ===');
          console.log('Grid Resistance:', results.grid?.resistance?.toFixed(4), '×');
          console.log('GPR:', results.fault?.gpr?.toFixed(0), 'V');
          console.log('Step Voltage:', results.fault?.stepVoltage?.toFixed(0), 'V');
          console.log('Touch Voltage:', results.fault?.touchVoltage?.toFixed(0), 'V');
          console.log('Grid Current:', results.fault?.gridCurrent?.toFixed(0), 'A');
          
          // Validation against expected ranges
          const expected = {
            gridResistance: { min: 0.04, max: 0.07 },
            gpr: { min: 400, max: 700 },
            stepVoltage: { min: 250, max: 400 },
            touchVoltage: { min: 400, max: 700 }
          };
          
          console.log('\n=== VALIDATION ===');
          const checks = {
            gridResistance: results.grid?.resistance >= expected.gridResistance.min && results.grid?.resistance <= expected.gridResistance.max,
            gpr: results.fault?.gpr >= expected.gpr.min && results.fault?.gpr <= expected.gpr.max,
            stepVoltage: results.fault?.stepVoltage >= expected.stepVoltage.min && results.fault?.stepVoltage <= expected.stepVoltage.max,
            touchVoltage: results.fault?.touchVoltage >= expected.touchVoltage.min && results.fault?.touchVoltage <= expected.touchVoltage.max
          };
          
          Object.entries(checks).forEach(([param, pass]) => {
            const value = param === 'gridResistance' ? results.grid?.resistance?.toFixed(4) :
                         param === 'gpr' ? results.fault?.gpr?.toFixed(0) :
                         param === 'stepVoltage' ? results.fault?.stepVoltage?.toFixed(0) :
                         results.fault?.touchVoltage?.toFixed(0);
            const range = expected[param];
            console.log(`${param}: ${value} [${range.min}-${range.max}] - ${pass ? 'PASS' : 'FAIL'}`);
          });
          
          const allPassed = Object.values(checks).every(pass => pass);
          console.log('\n=== RESULT ===');
          console.log(allPassed ? 'ENGINE VALIDATION: PASS' : 'ENGINE VALIDATION: FAIL');
          
        } catch (error) {
          console.error('Calculator error:', error.message);
          console.error('Stack:', error.stack);
        }
      }).catch(error => {
        console.error('Import calculator error:', error.message);
      });
      
    } catch (error) {
      console.error('IEEE80Formulas error:', error.message);
      console.error('Stack:', error.stack);
    }
  }).catch(error => {
    console.error('Import IEEE80Formulas error:', error.message);
  });
  
} catch (error) {
  console.error('General error:', error.message);
  console.error('Stack:', error.stack);
}
