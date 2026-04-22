/**
 * Enhanced IEEE 80 Validation - Testing with Real Geometric Factors
 * This implements the complete IEEE 80 model with missing factors
 */

console.log('=== ENHANCED IEEE 80 VALIDATION ===');
console.log('Testing with real geometric factors (Km, Ki, Ks)');

(async () => {
  const { default: IEEE80RealFactors } = await import('../domain/grounding/IEEE80RealFactors.js');
  
  // Test the enhanced model against literature cases
  const testCases = [
    {
      name: 'IEEE 80-2013 Small Industrial',
      grid: {
        length: 30,
        width: 20,
        numParallelX: 7,
        numParallelY: 5,
        burialDepth: 0.5,
        numRods: 4,
        rodLength: 3
      },
      soil: {
        resistivity: 100,
        surfaceResistivity: 2000,
        surfaceThickness: 0.1
      },
      fault: {
        current: 10000,
        duration: 1.0
      },
      expected: {
        stepVoltage: { min: 250, max: 400 },
        touchVoltage: { min: 400, max: 600 }
      }
    },
    {
      name: 'Large Utility Substation',
      grid: {
        length: 100,
        width: 80,
        numParallelX: 21,
        numParallelY: 17,
        burialDepth: 0.8,
        numRods: 16,
        rodLength: 4
      },
      soil: {
        resistivity: 50,
        surfaceResistivity: 1000,
        surfaceThickness: 0.15
      },
      fault: {
        current: 25000,
        duration: 0.5
      },
      expected: {
        stepVoltage: { min: 150, max: 250 },
        touchVoltage: { min: 250, max: 400 }
      }
    },
    {
      name: 'High Resistivity Soil',
      grid: {
        length: 40,
        width: 30,
        numParallelX: 9,
        numParallelY: 7,
        burialDepth: 0.6,
        numRods: 8,
        rodLength: 3
      },
      soil: {
        resistivity: 800,
        surfaceResistivity: 5000,
        surfaceThickness: 0.2
      },
      fault: {
        current: 15000,
        duration: 1.0
      },
      expected: {
        stepVoltage: { min: 600, max: 900 },
        touchVoltage: { min: 900, max: 1400 }
      }
    }
  ];
  
  console.log('\n=== ENHANCED MODEL RESULTS ===');
  
  let totalTests = 0;
  let passedTests = 0;
  const results = [];
  
  for (const testCase of testCases) {
    totalTests++;
    console.log(`\n--- ${testCase.name} ---`);
    
    try {
      // Calculate surface layer factor
      const Cs = calculateSurfaceLayerFactor(
        testCase.soil.resistivity,
        testCase.soil.surfaceResistivity,
        testCase.soil.surfaceThickness
      );
      
      // Enhanced calculations with real factors
      const stepVoltage = IEEE80RealFactors.calculateEnhancedStepVoltage(
        testCase.soil.resistivity,
        testCase.fault.current,
        testCase.grid,
        Cs
      );
      
      const touchVoltage = IEEE80RealFactors.calculateEnhancedTouchVoltage(
        testCase.soil.resistivity,
        testCase.fault.current,
        testCase.grid,
        Cs
      );
      
      // Get factor analysis
      const factorAnalysis = IEEE80RealFactors.analyzeFactors(
        testCase.grid,
        testCase.soil.resistivity,
        testCase.fault.current
      );
      
      console.log(`Enhanced Results:`);
      console.log(`  Step Voltage: ${stepVoltage.toFixed(0)} V`);
      console.log(`  Touch Voltage: ${touchVoltage.toFixed(0)} V`);
      console.log(`  Surface Factor: ${Cs.toFixed(3)}`);
      console.log(`  Current Division: ${factorAnalysis.currentDivision.toFixed(3)}`);
      console.log(`  Grid Current: ${factorAnalysis.gridCurrent.toFixed(0)} A`);
      console.log(`  Step Factor (Ks): ${factorAnalysis.stepFactor.toFixed(3)}`);
      console.log(`  Mesh Factor (Km): ${factorAnalysis.meshFactor.toFixed(3)}`);
      console.log(`  Irregularity Factor (Ki): ${factorAnalysis.irregularityFactor.toFixed(3)}`);
      
      console.log(`Expected Ranges:`);
      console.log(`  Step Voltage: ${testCase.expected.stepVoltage.min}-${testCase.expected.stepVoltage.max} V`);
      console.log(`  Touch Voltage: ${testCase.expected.touchVoltage.min}-${testCase.expected.touchVoltage.max} V`);
      
      // Validation
      const stepInRange = stepVoltage >= testCase.expected.stepVoltage.min && 
                        stepVoltage <= testCase.expected.stepVoltage.max;
      const touchInRange = touchVoltage >= testCase.expected.touchVoltage.min && 
                          touchVoltage <= testCase.expected.touchVoltage.max;
      const overallPass = stepInRange && touchInRange;
      
      if (overallPass) passedTests++;
      
      console.log(`Result: ${overallPass ? 'PASS' : 'FAIL'}`);
      if (!stepInRange) console.log(`  Step voltage out of range`);
      if (!touchInRange) console.log(`  Touch voltage out of range`);
      
      results.push({
        testCase: testCase.name,
        stepVoltage,
        touchVoltage,
        expected: testCase.expected,
        stepInRange,
        touchInRange,
        overallPass,
        factorAnalysis
      });
      
    } catch (error) {
      console.error(`${testCase.name} FAILED:`, error.message);
      results.push({
        testCase: testCase.name,
        error: error.message,
        overallPass: false
      });
    }
  }
  
  console.log('\n=== ENHANCED VALIDATION SUMMARY ===');
  console.log(`Overall Pass Rate: ${(passedTests / totalTests * 100).toFixed(0)}%`);
  console.log(`Passed: ${passedTests}/${totalTests} cases`);
  
  // Detailed factor analysis
  console.log('\n=== FACTOR ANALYSIS ===');
  results.filter(r => !r.error).forEach(result => {
    console.log(`\n${result.testCase}:`);
    console.log(`  Step/Touch Ratio: ${(result.touchVoltage / result.stepVoltage).toFixed(2)}`);
    console.log(`  Current Collection: ${result.factorAnalysis.currentCollection.toFixed(3)}`);
    console.log(`  Irregularity Impact: ${result.factorAnalysis.irregularityImpact.toFixed(3)}`);
    console.log(`  Step-to-Mesh Ratio: ${result.factorAnalysis.analysis.stepToMeshRatio.toFixed(2)}`);
  });
  
  // Final assessment
  const overallSuccess = passedTests === totalTests;
  console.log(`\n=== FINAL ENHANCED ASSESSMENT ===`);
  console.log(`Status: ${overallSuccess ? 'ENHANCED MODEL VALIDATION PASSED' : 'NEEDS FINE-TUNING'}`);
  
  if (overallSuccess) {
    console.log('Enhanced IEEE 80 model with real geometric factors works correctly');
    console.log('Ready for professional engineering applications');
  } else {
    console.log('Enhanced model improved but needs further calibration');
  }
  
})().catch(error => {
  console.error('Import error:', error.message);
});

// Helper function for surface layer factor
function calculateSurfaceLayerFactor(soilResistivity, surfaceResistivity, surfaceThickness) {
  const h_s_meters = surfaceThickness;
  const K = (surfaceResistivity - soilResistivity) / (surfaceResistivity + soilResistivity);
  
  // IEEE 80 Equation 29
  const Cs = 1 - (0.09 * (1 - K)) / (2 * h_s_meters + 0.09);
  
  return Math.max(0.5, Math.min(2.0, Cs));
}
