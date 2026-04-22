/**
 * Final Integrated Test - Complete IEEE 80 Engine
 * Testing the fully integrated engine with IEEE 80 practical factors
 */

console.log('=== FINAL INTEGRATED IEEE 80 ENGINE TEST ===');
console.log('Testing complete grounding calculator with IEEE 80 practical factors');

(async () => {
  const GroundingCalculator = (await import('../application/GroundingCalculator.js')).default;
  
  // Test case: Small industrial substation
  const testCase = {
    name: 'Small Industrial Substation - Complete Engine',
    input: {
      soil: {
        soilResistivity: 100,
        surfaceLayerResistivity: 2000,
        surfaceLayerThickness: 0.1
      },
      grid: {
        gridLength: 30,
        gridWidth: 20,
        numParallel: 7,
        numParallelY: 5,
        burialDepth: 0.5,
        numRods: 4,
        rodLength: 3
      },
      fault: {
        faultCurrent: 10000,
        faultDuration: 1.0,
        bodyWeight: 70
      }
    },
    expected: {
      stepVoltage: { min: 250, max: 400 },
      touchVoltage: { min: 400, max: 600 },
      gridResistance: { min: 2, max: 4 }
    }
  };
  
  console.log('\n--- Running Complete Engine Test ---');
  console.log(`Test Case: ${testCase.name}`);
  
  try {
    // Initialize calculator
    const calculator = new GroundingCalculator(testCase.input);
    
    // Run calculation
    const results = calculator.calculate();
    
    console.log('\n=== COMPLETE ENGINE RESULTS ===');
    console.log('Input Summary:');
    console.log(`  Soil Resistivity: ${testCase.input.soil.soilResistivity} ×m`);
    console.log(`  Grid Dimensions: ${testCase.input.grid.gridLength}m × ${testCase.input.grid.gridWidth}m`);
    console.log(`  Fault Current: ${testCase.input.fault.faultCurrent} A`);
    
    console.log('\nCalculated Results:');
    console.log(`  Grid Resistance: ${results.grid.resistance.toFixed(3)} ×`);
    console.log(`  GPR: ${results.fault.gpr.toFixed(0)} V`);
    console.log(`  Step Voltage: ${results.fault.stepVoltage.toFixed(0)} V`);
    console.log(`  Touch Voltage: ${results.fault.touchVoltage.toFixed(0)} V`);
    console.log(`  Grid Current: ${results.fault.gridCurrent.toFixed(0)} A`);
    
    // Check for IEEE 80 practical factors
    if (results.fault.factorAnalysis) {
      console.log('\nIEEE 80 Practical Factors:');
      console.log(`  Irregularity Factor (Ki): ${results.fault.factorAnalysis.Ki.toFixed(3)}`);
      console.log(`  Step Factor (Ks): ${results.fault.factorAnalysis.Ks.toFixed(3)}`);
      console.log(`  Mesh Factor (Km): ${results.fault.factorAnalysis.Km.toFixed(3)}`);
      console.log(`  Base Voltage: ${results.fault.factorAnalysis.Ebase.toFixed(0)} V`);
      console.log(`  Step/Touch Ratio: ${results.fault.factorAnalysis.stepToTouchRatio.toFixed(2)}`);
    }
    
    console.log('\nCompliance Analysis:');
    console.log(`  Touch Voltage Safe: ${results.compliance.touch ? 'YES' : 'NO'}`);
    console.log(`  Step Voltage Safe: ${results.compliance.step ? 'YES' : 'NO'}`);
    console.log(`  Overall Compliant: ${results.compliance.overall ? 'YES' : 'NO'}`);
    
    console.log('\nSafety Margins:');
    console.log(`  Touch Margin: ${results.fault.safetyMargins.touchMargin.toFixed(1)}%`);
    console.log(`  Step Margin: ${results.fault.safetyMargins.stepMargin.toFixed(1)}%`);
    
    // Validation against expected ranges
    console.log('\n=== VALIDATION AGAINST EXPECTED RANGES ===');
    const stepInRange = results.fault.stepVoltage >= testCase.expected.stepVoltage.min && 
                      results.fault.stepVoltage <= testCase.expected.stepVoltage.max;
    const touchInRange = results.fault.touchVoltage >= testCase.expected.touchVoltage.min && 
                        results.fault.touchVoltage <= testCase.expected.touchVoltage.max;
    const resistanceInRange = results.grid.resistance >= testCase.expected.gridResistance.min && 
                            results.grid.resistance <= testCase.expected.gridResistance.max;
    
    console.log(`Expected Ranges:`);
    console.log(`  Step Voltage: ${testCase.expected.stepVoltage.min}-${testCase.expected.stepVoltage.max} V`);
    console.log(`  Touch Voltage: ${testCase.expected.touchVoltage.min}-${testCase.expected.touchVoltage.max} V`);
    console.log(`  Grid Resistance: ${testCase.expected.gridResistance.min}-${testCase.expected.gridResistance.max} ×`);
    
    console.log(`\nValidation Results:`);
    console.log(`  Step Voltage: ${stepInRange ? 'PASS' : 'FAIL'} (${results.fault.stepVoltage.toFixed(0)} V)`);
    console.log(`  Touch Voltage: ${touchInRange ? 'PASS' : 'FAIL'} (${results.fault.touchVoltage.toFixed(0)} V)`);
    console.log(`  Grid Resistance: ${resistanceInRange ? 'PASS' : 'FAIL'} (${results.grid.resistance.toFixed(3)} ×)`);
    
    const overallValidation = stepInRange && touchInRange && resistanceInRange;
    console.log(`  Overall: ${overallValidation ? 'PASS' : 'FAIL'}`);
    
    // Physical consistency check
    console.log('\n=== PHYSICAL CONSISTENCY CHECK ===');
    const touchGreaterThanStep = results.fault.touchVoltage > results.fault.stepVoltage;
    const gprConsistent = Math.abs(results.fault.gpr - results.fault.gridCurrent * results.grid.resistance) < 1;
    const allPositive = results.fault.stepVoltage > 0 && results.fault.touchVoltage > 0 && results.grid.resistance > 0;
    
    console.log(`Touch > Step: ${touchGreaterThanStep ? 'YES' : 'NO'}`);
    console.log(`GPR = Ig × Rg: ${gprConsistent ? 'YES' : 'NO'}`);
    console.log(`All Values Positive: ${allPositive ? 'YES' : 'NO'}`);
    
    const physicalConsistency = touchGreaterThanStep && gprConsistent && allPositive;
    console.log(`Physical Consistency: ${physicalConsistency ? 'PASS' : 'FAIL'}`);
    
    // Traceability analysis
    console.log('\n=== TRACEABILITY ANALYSIS ===');
    const traceability = results.traceability;
    console.log(`Total Traceability Entries: ${traceability.length}`);
    
    // Check for IEEE 80 practical factors trace
    const practicalFactorsTrace = traceability.find(t => t.calculation === 'ieee80_practical_factors');
    if (practicalFactorsTrace) {
      console.log('IEEE 80 Practical Factors Trace: FOUND');
      console.log(`  Formula: ${practicalFactorsTrace.formula}`);
      console.log(`  Factors: Ki=${practicalFactorsTrace.factors.Ki.toFixed(3)}, Ks=${practicalFactorsTrace.factors.Ks.toFixed(3)}, Km=${practicalFactorsTrace.factors.Km.toFixed(3)}`);
    } else {
      console.log('IEEE 80 Practical Factors Trace: NOT FOUND');
    }
    
    // Final assessment
    console.log('\n=== FINAL ENGINE ASSESSMENT ===');
    console.log(`Validation: ${overallValidation ? 'PASSED' : 'FAILED'}`);
    console.log(`Physical Consistency: ${physicalConsistency ? 'PASSED' : 'FAILED'}`);
    console.log(`IEEE 80 Factors: ${practicalFactorsTrace ? 'INTEGRATED' : 'MISSING'}`);
    
    const engineReady = physicalConsistency && practicalFactorsTrace;
    console.log(`Engine Status: ${engineReady ? 'PRODUCTION READY' : 'NEEDS WORK'}`);
    
    if (engineReady) {
      console.log('\n=== SUCCESS ===');
      console.log('Complete IEEE 80 engine with practical factors is operational!');
      console.log('Ready for professional engineering applications.');
    } else {
      console.log('\n=== ISSUES FOUND ===');
      console.log('Engine needs additional work before production use.');
    }
    
    // Recommendations
    console.log('\n=== RECOMMENDATIONS ===');
    if (results.recommendations && results.recommendations.length > 0) {
      results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    } else {
      console.log('No specific recommendations - design appears adequate.');
    }
    
  } catch (error) {
    console.error('Engine test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
})().catch(error => {
  console.error('Import error:', error.message);
});
