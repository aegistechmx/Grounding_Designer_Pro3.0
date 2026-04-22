/**
 * Direct IEEE 80 Calculation - Bypass traceability issues
 * Uses IEEE80Formulas directly for validation
 */

console.log('=== DIRECT IEEE 80 CALCULATION ===');

try {
  import('../domain/grounding/IEEE80Formulas.js').then(({ default: IEEE80Formulas }) => {
    
    // IEEE 80 Test Case (50x50m substation)
    const testCase = {
      soil: {
        resistivity: 100,          // ohm-m
        surfaceResistivity: 3000,  // ohm-m
        surfaceThickness: 0.1      // m
      },
      grid: {
        length: 50,                // m
        width: 50,                 // m
        spacing: 5,                // m (11 conductors each direction)
        totalConductorLength: 500, // m (approx)
        burialDepth: 0.5,          // m
        numRods: 4,
        rodLength: 3               // m
      },
      fault: {
        current: 10000,            // A
        duration: 0.5,            // s
        divisionFactor: 0.15
      }
    };
    
    console.log('Test Case:', JSON.stringify(testCase, null, 2));
    console.log('');
    
    // Step 1: Calculate surface layer factor
    const Cs = IEEE80Formulas.calculateSurfaceLayerFactor(
      testCase.soil.resistivity,
      testCase.soil.surfaceResistivity,
      testCase.soil.surfaceThickness
    );
    console.log('1. Surface Layer Factor (Cs):', Cs.toFixed(3));
    
    // Step 2: Calculate grid resistance
    const Rg = IEEE80Formulas.calculateGridResistance(
      testCase.soil.resistivity,
      testCase.grid.totalConductorLength,
      testCase.grid.length * testCase.grid.width,
      testCase.grid.burialDepth
    );
    console.log('2. Grid Resistance (Rg):', Rg.toFixed(4), '×');
    
    // Step 3: Calculate grid current
    const Ig = IEEE80Formulas.calculateGridCurrent(
      testCase.fault.current,
      testCase.fault.divisionFactor
    );
    console.log('3. Grid Current (Ig):', Ig.toFixed(0), 'A');
    
    // Step 4: Calculate GPR
    const GPR = IEEE80Formulas.calculateGPR(Ig, Rg);
    console.log('4. Ground Potential Rise (GPR):', GPR.toFixed(0), 'V');
    
    // Step 5: Calculate geometric factors
    const Ks = IEEE80Formulas.calculateStepGeometricFactor(
      testCase.grid.length,
      testCase.grid.width,
      11, // numParallel
      11, // numParallelY
      testCase.grid.burialDepth
    );
    console.log('5. Step Geometric Factor (Ks):', Ks.toFixed(3));
    
    const Km = IEEE80Formulas.calculateTouchGeometricFactor(
      testCase.grid.length,
      testCase.grid.width,
      11, // numParallel
      11, // numParallelY
      testCase.grid.burialDepth
    );
    console.log('6. Touch Geometric Factor (Km):', Km.toFixed(3));
    
    // Step 6: Calculate step voltage
    const Es = IEEE80Formulas.calculateStepVoltage(
      testCase.soil.resistivity,
      Ig,
      Ks,
      testCase.grid.totalConductorLength
    );
    console.log('7. Step Voltage (Es):', Es.toFixed(0), 'V');
    
    // Step 7: Calculate touch voltage
    const Et = IEEE80Formulas.calculateTouchVoltage(
      testCase.soil.resistivity,
      Ig,
      Km,
      testCase.grid.totalConductorLength
    );
    console.log('8. Touch Voltage (Et):', Et.toFixed(0), 'V');
    
    // Step 8: Calculate permissible voltages
    const Etouch70 = IEEE80Formulas.calculatePermissibleTouchVoltage(
      70, // body weight
      testCase.fault.duration,
      Cs,
      testCase.soil.surfaceResistivity
    );
    console.log('9. Permissible Touch Voltage (70kg):', Etouch70.toFixed(0), 'V');
    
    const Estep70 = IEEE80Formulas.calculatePermissibleStepVoltage(
      70, // body weight
      testCase.fault.duration,
      Cs,
      testCase.soil.surfaceResistivity
    );
    console.log('10. Permissible Step Voltage (70kg):', Estep70.toFixed(0), 'V');
    
    // Step 9: Check compliance
    const compliance = IEEE80Formulas.validateCompliance(Es, Et, Estep70, Etouch70);
    console.log('11. IEEE 80 Compliance:', compliance.overallCompliant ? 'PASS' : 'FAIL');
    console.log('    - Step Voltage:', compliance.stepCompliant ? 'SAFE' : 'UNSAFE');
    console.log('    - Touch Voltage:', compliance.touchCompliant ? 'SAFE' : 'UNSAFE');
    
    console.log('');
    console.log('=== VALIDATION AGAINST EXPECTED RANGES ===');
    
    const expected = {
      gridResistance: { min: 0.04, max: 0.07 },
      gpr: { min: 400, max: 700 },
      stepVoltage: { min: 250, max: 400 },
      touchVoltage: { min: 400, max: 700 }
    };
    
    const validation = {
      gridResistance: Rg >= expected.gridResistance.min && Rg <= expected.gridResistance.max,
      gpr: GPR >= expected.gpr.min && GPR <= expected.gpr.max,
      stepVoltage: Es >= expected.stepVoltage.min && Es <= expected.stepVoltage.max,
      touchVoltage: Et >= expected.touchVoltage.min && Et <= expected.touchVoltage.max
    };
    
    console.log('Grid Resistance:', Rg.toFixed(4), '× [', expected.gridResistance.min, '-', expected.gridResistance.max, '] -', validation.gridResistance ? 'PASS' : 'FAIL');
    console.log('GPR:', GPR.toFixed(0), 'V [', expected.gpr.min, '-', expected.gpr.max, '] -', validation.gpr ? 'PASS' : 'FAIL');
    console.log('Step Voltage:', Es.toFixed(0), 'V [', expected.stepVoltage.min, '-', expected.stepVoltage.max, '] -', validation.stepVoltage ? 'PASS' : 'FAIL');
    console.log('Touch Voltage:', Et.toFixed(0), 'V [', expected.touchVoltage.min, '-', expected.touchVoltage.max, '] -', validation.touchVoltage ? 'PASS' : 'FAIL');
    
    console.log('');
    console.log('=== PHYSICAL CONSISTENCY CHECKS ===');
    
    // GPR should equal Ig * Rg
    const calculatedGPR = Ig * Rg;
    const gprError = Math.abs(GPR - calculatedGPR) / calculatedGPR * 100;
    console.log('GPR Consistency:', gprError.toFixed(1), '% error -', gprError < 1 ? 'PASS' : 'FAIL');
    
    // Touch voltage should be higher than step voltage
    console.log('Touch > Step:', Et > Es ? 'PASS' : 'FAIL');
    
    // All values should be positive
    console.log('All Positive:', Rg > 0 && GPR > 0 && Es > 0 && Et > 0 ? 'PASS' : 'FAIL');
    
    console.log('');
    console.log('=== ENGINEERING ASSESSMENT ===');
    
    const allPassed = Object.values(validation).every(pass => pass);
    const physicallyConsistent = gprError < 1 && Et > Es && Rg > 0 && GPR > 0 && Es > 0 && Et > 0;
    
    console.log('IEEE 80 Validation:', allPassed ? 'PASS' : 'FAIL');
    console.log('Physical Consistency:', physicallyConsistent ? 'PASS' : 'FAIL');
    console.log('Overall Assessment:', allPassed && physicallyConsistent ? 'ENGINE READY' : 'NEEDS ADJUSTMENT');
    
    if (!allPassed || !physicallyConsistent) {
      console.log('');
      console.log('=== DIAGNOSIS ===');
      
      if (!validation.gridResistance) {
        console.log('ISSUE: Grid resistance outside expected range');
        console.log('  Expected: [0.04-0.07] ×, Got:', Rg.toFixed(4), '×');
      }
      
      if (!validation.gpr) {
        console.log('ISSUE: GPR outside expected range');
        console.log('  Expected: [400-700] V, Got:', GPR.toFixed(0), 'V');
      }
      
      if (!validation.stepVoltage) {
        console.log('ISSUE: Step voltage outside expected range');
        console.log('  Expected: [250-400] V, Got:', Es.toFixed(0), 'V');
      }
      
      if (!validation.touchVoltage) {
        console.log('ISSUE: Touch voltage outside expected range');
        console.log('  Expected: [400-700] V, Got:', Et.toFixed(0), 'V');
      }
      
      if (gprError >= 1) {
        console.log('ISSUE: GPR calculation inconsistent');
      }
      
      if (Et <= Es) {
        console.log('ISSUE: Touch voltage should be higher than step voltage');
      }
    }
    
  }).catch(error => {
    console.error('Import error:', error.message);
    console.error('Stack:', error.stack);
  });
  
} catch (error) {
  console.error('General error:', error.message);
  console.error('Stack:', error.stack);
}
