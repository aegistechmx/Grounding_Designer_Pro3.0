/**
 * Integrated Engine Test - Testing both Global Factors and Discrete Solver
 * Comprehensive comparison of both analysis methods
 */

console.log('=== INTEGRATED ENGINE TEST ===');
console.log('Testing both Global Factors and Discrete Solver methods');

(async () => {
  try {
    const { default: GroundingCalculator } = await import('../application/GroundingCalculator.js');
    
    // Test case: Small industrial substation
    const testCase = {
      name: 'Small Industrial Substation - Comparative Analysis',
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
    
    console.log('\n--- Test Case: Small Industrial Substation ---');
    console.log(`Grid: ${testCase.input.grid.gridLength}m × ${testCase.input.grid.gridWidth}m`);
    console.log(`Nodes: ${testCase.input.grid.numParallel} × ${testCase.input.grid.numParallelY}`);
    console.log(`Rods: ${testCase.input.grid.numRods}`);
    console.log(`Soil Resistivity: ${testCase.input.soil.soilResistivity} ×m`);
    console.log(`Fault Current: ${testCase.input.fault.faultCurrent} A`);
    
    // Test 1: Global Factors Method
    console.log('\n=== METHOD 1: GLOBAL FACTORS ===');
    
    const calculator1 = new GroundingCalculator(testCase.input);
    const results1 = calculator1.calculate({ useDiscreteSolver: false });
    
    console.log('\n--- Global Factors Results ---');
    console.log(`Grid Resistance: ${results1.grid.gridResistance ? results1.grid.gridResistance.toFixed(3) : 'undefined'} ×`);
    console.log(`GPR: ${results1.fault.gpr ? results1.fault.gpr.toFixed(0) : 'undefined'} V`);
    console.log(`Step Voltage: ${results1.fault.stepVoltage ? results1.fault.stepVoltage.toFixed(0) : 'NaN'} V`);
    console.log(`Touch Voltage: ${results1.fault.touchVoltage ? results1.fault.touchVoltage.toFixed(0) : 'NaN'} V`);
    console.log(`Grid Current: ${results1.fault.gridCurrent ? results1.fault.gridCurrent.toFixed(0) : 'undefined'} A`);
    
    if (results1.fault.factorAnalysis) {
      console.log('\n--- Factor Analysis ---');
      console.log(`Method: ${results1.fault.factorAnalysis.method || 'global_factors'}`);
      if (results1.fault.factorAnalysis.Ki) {
        console.log(`Ki: ${results1.fault.factorAnalysis.Ki.toFixed(3)}`);
        console.log(`Ks: ${results1.fault.factorAnalysis.Ks.toFixed(3)}`);
        console.log(`Km: ${results1.fault.factorAnalysis.Km.toFixed(3)}`);
      }
    }
    
    // Test 2: Discrete Solver Method
    console.log('\n=== METHOD 2: DISCRETE SOLVER ===');
    
    const calculator2 = new GroundingCalculator(testCase.input);
    const results2 = calculator2.calculate({ useDiscreteSolver: true });
    
    console.log('\n--- Discrete Solver Results ---');
    console.log(`Grid Resistance: ${results2.grid.gridResistance.toFixed(3)} ×`);
    console.log(`GPR: ${results2.fault.gpr.toFixed(0)} V`);
    console.log(`Step Voltage: ${results2.fault.stepVoltage.toFixed(0)} V`);
    console.log(`Touch Voltage: ${results2.fault.touchVoltage.toFixed(0)} V`);
    console.log(`Grid Current: ${results2.fault.gridCurrent.toFixed(0)} A`);
    
    if (results2.fault.factorAnalysis) {
      console.log('\n--- Discrete Analysis ---');
      console.log(`Method: ${results2.fault.factorAnalysis.method}`);
      console.log(`Node Count: ${results2.fault.factorAnalysis.nodeCount}`);
      console.log(`Voltage Range: ${results2.fault.factorAnalysis.voltageRange.toFixed(0)} V`);
      console.log(`Edge Concentration: ${results2.fault.factorAnalysis.edgeConcentration.toFixed(2)}x`);
      console.log(`Rod Effectiveness: ${results2.fault.factorAnalysis.rodEffectiveness.toFixed(2)}x`);
    }
    
    // Comparative Analysis
    console.log('\n=== COMPARATIVE ANALYSIS ===');
    
    const comparison = {
      stepVoltage: {
        global: results1.fault.stepVoltage,
        discrete: results2.fault.stepVoltage,
        ratio: results2.fault.stepVoltage / results1.fault.stepVoltage
      },
      touchVoltage: {
        global: results1.fault.touchVoltage,
        discrete: results2.fault.touchVoltage,
        ratio: results2.fault.touchVoltage / results1.fault.touchVoltage
      },
      gridResistance: {
        global: results1.grid.gridResistance,
        discrete: results2.grid.gridResistance,
        ratio: results2.grid.gridResistance / results1.grid.gridResistance
      },
      gpr: {
        global: results1.fault.gpr,
        discrete: results2.fault.gpr,
        ratio: results2.fault.gpr / results1.fault.gpr
      }
    };
    
    console.log('\n--- Performance Comparison ---');
    console.log(`Step Voltage:`);
    console.log(`  Global: ${comparison.stepVoltage.global.toFixed(0)} V`);
    console.log(`  Discrete: ${comparison.stepVoltage.discrete.toFixed(0)} V`);
    console.log(`  Improvement: ${comparison.stepVoltage.ratio.toFixed(2)}x`);
    
    console.log(`Touch Voltage:`);
    console.log(`  Global: ${comparison.touchVoltage.global.toFixed(0)} V`);
    console.log(`  Discrete: ${comparison.touchVoltage.discrete.toFixed(0)} V`);
    console.log(`  Improvement: ${comparison.touchVoltage.ratio.toFixed(2)}x`);
    
    console.log(`Grid Resistance:`);
    console.log(`  Global: ${comparison.gridResistance.global.toFixed(3)} ×`);
    console.log(`  Discrete: ${comparison.gridResistance.discrete.toFixed(3)} ×`);
    console.log(`  Ratio: ${comparison.gridResistance.ratio.toFixed(2)}x`);
    
    console.log(`GPR:`);
    console.log(`  Global: ${comparison.gpr.global.toFixed(0)} V`);
    console.log(`  Discrete: ${comparison.gpr.discrete.toFixed(0)} V`);
    console.log(`  Ratio: ${comparison.gpr.ratio.toFixed(2)}x`);
    
    // Validation against expected ranges
    console.log('\n=== VALIDATION AGAINST EXPECTED RANGES ===');
    
    const validateMethod = (results, methodName) => {
      const stepInRange = results.fault.stepVoltage >= testCase.expected.stepVoltage.min && 
                          results.fault.stepVoltage <= testCase.expected.stepVoltage.max;
      const touchInRange = results.fault.touchVoltage >= testCase.expected.touchVoltage.min && 
                          results.fault.touchVoltage <= testCase.expected.touchVoltage.max;
      const resistanceInRange = results.grid.gridResistance >= testCase.expected.gridResistance.min && 
                              results.grid.gridResistance <= testCase.expected.gridResistance.max;
      
      return {
        step: stepInRange,
        touch: touchInRange,
        resistance: resistanceInRange,
        overall: stepInRange && touchInRange && resistanceInRange
      };
    };
    
    const validation1 = validateMethod(results1, 'Global Factors');
    const validation2 = validateMethod(results2, 'Discrete Solver');
    
    console.log(`Global Factors Validation:`);
    console.log(`  Step Voltage: ${validation1.step ? 'PASS' : 'FAIL'} (${results1.fault.stepVoltage.toFixed(0)} V)`);
    console.log(`  Touch Voltage: ${validation1.touch ? 'PASS' : 'FAIL'} (${results1.fault.touchVoltage.toFixed(0)} V)`);
    console.log(`  Grid Resistance: ${validation1.resistance ? 'PASS' : 'FAIL'} (${results1.grid.gridResistance.toFixed(3)} ×)`);
    console.log(`  Overall: ${validation1.overall ? 'PASS' : 'FAIL'}`);
    
    console.log(`\nDiscrete Solver Validation:`);
    console.log(`  Step Voltage: ${validation2.step ? 'PASS' : 'FAIL'} (${results2.fault.stepVoltage.toFixed(0)} V)`);
    console.log(`  Touch Voltage: ${validation2.touch ? 'PASS' : 'FAIL'} (${results2.fault.touchVoltage.toFixed(0)} V)`);
    console.log(`  Grid Resistance: ${validation2.resistance ? 'PASS' : 'FAIL'} (${results2.grid.gridResistance.toFixed(3)} ×)`);
    console.log(`  Overall: ${validation2.overall ? 'PASS' : 'FAIL'}`);
    
    // Physical consistency check
    console.log('\n=== PHYSICAL CONSISTENCY CHECK ===');
    
    const checkConsistency = (results, methodName) => {
      const touchGreaterThanStep = results.fault.touchVoltage > results.fault.stepVoltage;
      const allPositive = results.fault.stepVoltage > 0 && results.fault.touchVoltage > 0 && results.grid.gridResistance > 0;
      
      return {
        touchGreaterThanStep,
        allPositive,
        overall: touchGreaterThanStep && allPositive
      };
    };
    
    const consistency1 = checkConsistency(results1, 'Global Factors');
    const consistency2 = checkConsistency(results2, 'Discrete Solver');
    
    console.log(`Global Factors Consistency:`);
    console.log(`  Touch > Step: ${consistency1.touchGreaterThanStep ? 'YES' : 'NO'}`);
    console.log(`  All Positive: ${consistency1.allPositive ? 'YES' : 'NO'}`);
    console.log(`  Overall: ${consistency1.overall ? 'PASS' : 'FAIL'}`);
    
    console.log(`\nDiscrete Solver Consistency:`);
    console.log(`  Touch > Step: ${consistency2.touchGreaterThanStep ? 'YES' : 'NO'}`);
    console.log(`  All Positive: ${consistency2.allPositive ? 'YES' : 'NO'}`);
    console.log(`  Overall: ${consistency2.overall ? 'PASS' : 'FAIL'}`);
    
    // Method-specific advantages
    console.log('\n=== METHOD-SPECIFIC ADVANTAGES ===');
    
    console.log('\nGlobal Factors Advantages:');
    console.log('  + Simpler implementation');
    console.log('  + Faster computation');
    console.log('  + Well-established methodology');
    console.log('  + Good for preliminary analysis');
    
    console.log('\nDiscrete Solver Advantages:');
    console.log('  + Spatial voltage distribution');
    console.log('  + Realistic current flow');
    console.log('  + Edge concentration modeling');
    console.log('  + No artificial factors needed');
    console.log('  + Physics-based approach');
    
    // Final Assessment
    console.log('\n=== FINAL ASSESSMENT ===');
    
    const overallSuccess = consistency1.overall && consistency2.overall;
    const validationSuccess = validation1.overall || validation2.overall;
    
    console.log(`Physical Consistency: ${overallSuccess ? 'PASSED' : 'FAILED'}`);
    console.log(`Validation Success: ${validationSuccess ? 'PASSED' : 'FAILED'}`);
    console.log(`Dual Method Support: ${overallSuccess ? 'WORKING' : 'NEEDS FIX'}`);
    
    if (overallSuccess) {
      console.log('\n=== SUCCESS ===');
      console.log('Integrated engine with dual analysis methods is working!');
      console.log('Both methods produce physically consistent results.');
      
      if (validation2.overall) {
        console.log('Discrete solver shows better validation performance.');
      } else if (validation1.overall) {
        console.log('Global factors show better validation performance.');
      } else {
        console.log('Both methods need calibration for exact literature matching.');
      }
    } else {
      console.log('\n=== ISSUES DETECTED ===');
      console.log('Physical consistency problems detected.');
      console.log('Review implementation for errors.');
    }
    
    // Recommendations
    console.log('\n=== RECOMMENDATIONS ===');
    
    if (comparison.stepVoltage.ratio > 2) {
      console.log('- Discrete solver shows significant step voltage improvement');
    }
    if (comparison.touchVoltage.ratio > 2) {
      console.log('- Discrete solver shows significant touch voltage improvement');
    }
    if (Math.abs(comparison.gridResistance.ratio - 1) > 0.5) {
      console.log('- Grid resistance differs significantly between methods');
    }
    
    if (validation2.overall && !validation1.overall) {
      console.log('- Consider using discrete solver for better accuracy');
    } else if (validation1.overall && !validation2.overall) {
      console.log('- Consider using global factors for better validation');
    } else if (!validation1.overall && !validation2.overall) {
      console.log('- Both methods need calibration for literature matching');
    }
    
  } catch (error) {
    console.error('Integrated engine test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
})().catch(error => {
  console.error('Import error:', error.message);
});
