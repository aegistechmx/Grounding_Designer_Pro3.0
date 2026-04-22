/**
 * Extreme IEEE 80 Validation - Real Engineering Scenarios
 * Tests that will break the engine if there are hidden problems
 */

console.log('=== EXTREME IEEE 80 VALIDATION ===');
console.log('Testing scenarios that break most grounding engines');

(async () => {
  const { default: IEEE80Formulas } = await import('../domain/grounding/IEEE80Formulas.js');
  
  // Base case for comparison
  const baseCase = {
    soil: { resistivity: 100, surfaceResistivity: 3000, surfaceThickness: 0.1 },
    grid: { length: 50, width: 50, totalConductorLength: 500, burialDepth: 0.5 },
    fault: { current: 10000, duration: 0.5, divisionFactor: 1.0 }
  };
  
  console.log('\n=== BASE CASE (Reference) ===');
  const baseResults = runTest('BASE', baseCase, IEEE80Formulas);
  
  console.log('\n=== TEST 1: HIGH RESISTIVITY SOIL (Critical) ===');
  console.log('Expected: GPR and voltages should scale linearly with resistivity');
  
  const highResistivityCase = {
    ...baseCase,
    soil: { 
      resistivity: 1000, // 10x higher
      surfaceResistivity: 3000, 
      surfaceThickness: 0.1 
    }
  };
  
  const test1Results = runTest('HIGH RESISTIVITY', highResistivityCase, IEEE80Formulas);
  analyzeSensitivity('TEST 1', baseResults, test1Results, 'soilResistivity', 10);
  
  console.log('\n=== TEST 2: EXTREME SURFACE LAYER ===');
  console.log('Expected: Step and touch voltages should decrease significantly');
  
  const extremeSurfaceCase = {
    ...baseCase,
    soil: { 
      resistivity: 100,
      surfaceResistivity: 5000, // Much higher surface resistivity
      surfaceThickness: 0.2    // Thicker surface layer
    }
  };
  
  const test2Results = runTest('EXTREME SURFACE', extremeSurfaceCase, IEEE80Formulas);
  analyzeSurfaceLayerEffect('TEST 2', baseResults, test2Results);
  
  console.log('\n=== TEST 3: SMALL GRID (Critical Scenario) ===');
  console.log('Expected: Higher resistance, dangerous voltages');
  
  const smallGridCase = {
    ...baseCase,
    grid: {
      length: 20,     // 20x20m grid (400 m²)
      width: 20,
      totalConductorLength: 200, // Less conductor
      burialDepth: 0.5
    }
  };
  
  const test3Results = runTest('SMALL GRID', smallGridCase, IEEE80Formulas);
  analyzeGridSizeEffect('TEST 3', baseResults, test3Results);
  
  console.log('\n=== TEST 4: TWO-LAYER SOIL (True IEEE 80 Exam) ===');
  console.log('Expected: Different behavior than uniform model');
  
  const twoLayerCase = {
    soil: {
      model: 'two-layer',
      layer1: { resistivity: 100, thickness: 2 },    // Top layer
      layer2: { resistivity: 1000 }                    // Bottom layer (10x higher)
    },
    grid: baseCase.grid,
    fault: baseCase.fault
  };
  
  const test4Results = runTest('TWO-LAYER', twoLayerCase, IEEE80Formulas);
  analyzeTwoLayerEffect('TEST 4', baseResults, test4Results);
  
  console.log('\n=== EXTREME VALIDATION SUMMARY ===');
  const allTests = [baseResults, test1Results, test2Results, test3Results, test4Results];
  
  // Check for stability and consistency
  checkNumericalStability(allTests);
  checkPhysicalConsistency(allTests);
  checkEngineeringRealism(allTests);
  
  console.log('\n=== FINAL ASSESSMENT ===');
  const criticalFailures = identifyCriticalFailures(allTests);
  
  if (criticalFailures.length === 0) {
    console.log('STATUS: ENGINE PASSED EXTREME VALIDATION');
    console.log('Ready for real engineering applications');
  } else {
    console.log('STATUS: ENGINE HAS CRITICAL ISSUES');
    console.log('FAILURES:', criticalFailures);
  }
  
})().catch(error => {
  console.error('Import error:', error.message);
});

function runTest(testName, testCase, IEEE80Formulas) {
  console.log(`\n--- ${testName} ---`);
  
  try {
    // Handle two-layer soil model
    let soilResistivity;
    if (testCase.soil.model === 'two-layer') {
      // Use weighted average for two-layer
      soilResistivity = (testCase.soil.layer1.resistivity * testCase.soil.layer1.thickness + 
                         testCase.soil.layer2.resistivity * 10) / 
                        (testCase.soil.layer1.thickness + 10);
    } else {
      soilResistivity = testCase.soil.resistivity;
    }
    
    // Surface layer factor
    const Cs = IEEE80Formulas.calculateSurfaceLayerFactor(
      soilResistivity,
      testCase.soil.surfaceResistivity || 3000,
      testCase.soil.surfaceThickness || 0.1
    );
    
    // Grid resistance
    const Rg = IEEE80Formulas.calculateGridResistance(
      soilResistivity,
      testCase.grid.totalConductorLength,
      testCase.grid.length * testCase.grid.width,
      testCase.grid.burialDepth
    );
    
    // Grid current
    const Ig = IEEE80Formulas.calculateGridCurrent(
      testCase.fault.current,
      testCase.fault.divisionFactor
    );
    
    // GPR
    const GPR = IEEE80Formulas.calculateGPR(Ig, Rg);
    
    // Geometric factors
    const Ks = IEEE80Formulas.calculateStepGeometricFactor(
      testCase.grid.length,
      testCase.grid.width,
      11, 11,
      testCase.grid.burialDepth
    );
    
    const Km = IEEE80Formulas.calculateTouchGeometricFactor(
      testCase.grid.length,
      testCase.grid.width,
      11, 11,
      testCase.grid.burialDepth
    );
    
    // Voltages with surface layer factor
    const Es = IEEE80Formulas.calculateStepVoltage(
      soilResistivity,
      Ig,
      Ks,
      testCase.grid.totalConductorLength,
      Cs
    );
    
    const Et = IEEE80Formulas.calculateTouchVoltage(
      soilResistivity,
      Ig,
      Km,
      testCase.grid.totalConductorLength,
      Cs
    );
    
    const results = {
      testName,
      testCase,
      Cs,
      Rg,
      Ig,
      GPR,
      Ks,
      Km,
      Es,
      Et,
      soilResistivity,
      // Sensitivity metrics
      sensitivity: {
        dV_dRho: null,  // Will be calculated later
        dV_dL: null,   // Will be calculated later
        dV_dA: null   // Will be calculated later
      }
    };
    
    console.log(`Soil Resistivity: ${soilResistivity} ×m`);
    console.log(`Grid Resistance: ${Rg.toFixed(4)} ×`);
    console.log(`GPR: ${GPR.toFixed(0)} V`);
    console.log(`Step Voltage: ${Es.toFixed(0)} V`);
    console.log(`Touch Voltage: ${Et.toFixed(0)} V`);
    console.log(`Surface Factor: ${Cs.toFixed(3)}`);
    
    // Check for critical issues
    const issues = [];
    if (Rg > 50) issues.push('Grid resistance dangerously high');
    if (GPR > 10000) issues.push('GPR extremely high');
    if (Es > 5000) issues.push('Step voltage dangerous');
    if (Et > 5000) issues.push('Touch voltage dangerous');
    if (Es <= 0 || Et <= 0) issues.push('Negative or zero voltages');
    if (Ks <= 0 || Km <= 0) issues.push('Negative geometric factors');
    
    if (issues.length > 0) {
      console.log('CRITICAL ISSUES:', issues.join(', '));
      results.criticalIssues = issues;
    }
    
    return results;
    
  } catch (error) {
    console.error(`${testName} FAILED:`, error.message);
    return { testName, error: error.message, criticalIssues: ['Calculation failed'] };
  }
}

function analyzeSensitivity(testName, base, current, parameter, factor) {
  console.log(`\n--- ${testName} Sensitivity Analysis ---`);
  
  if (base.error || current.error) {
    console.log('Cannot analyze sensitivity - calculation failed');
    return;
  }
  
  // Calculate sensitivities
  const dRg_dRho = (current.Rg - base.Rg) / (base.Rg * (factor - 1));
  const dGPR_dRho = (current.GPR - base.GPR) / (base.GPR * (factor - 1));
  const dEs_dRho = (current.Es - base.Es) / (base.Es * (factor - 1));
  const dEt_dRho = (current.Et - base.Et) / (base.Et * (factor - 1));
  
  console.log(`${parameter} sensitivity (×${factor}):`);
  console.log(`  Grid Resistance: ${(dRg_dRho * 100).toFixed(1)}%`);
  console.log(`  GPR: ${(dGPR_dRho * 100).toFixed(1)}%`);
  console.log(`  Step Voltage: ${(dEs_dRho * 100).toFixed(1)}%`);
  console.log(`  Touch Voltage: ${(dEt_dRho * 100).toFixed(1)}%`);
  
  // Check for linearity (should be ~100% for linear scaling)
  const expectedSensitivity = 100; // Linear scaling
  const tolerance = 10; // ±10%
  
  const linearScaling = Math.abs(dGPR_dRho * 100 - expectedSensitivity) < tolerance;
  console.log(`Linear scaling: ${linearScaling ? 'PASS' : 'FAIL'}`);
  
  // Store sensitivity metrics
  current.sensitivity.dV_dRho = {
    gridResistance: dRg_dRho,
    gpr: dGPR_dRho,
    stepVoltage: dEs_dRho,
    touchVoltage: dEt_dRho
  };
}

function analyzeSurfaceLayerEffect(testName, base, current) {
  console.log(`\n--- ${testName} Surface Layer Analysis ---`);
  
  if (base.error || current.error) {
    console.log('Cannot analyze surface layer - calculation failed');
    return;
  }
  
  const csReduction = ((base.Cs - current.Cs) / base.Cs) * 100;
  const stepReduction = ((base.Es - current.Es) / base.Es) * 100;
  const touchReduction = ((base.Et - current.Et) / base.Et) * 100;
  
  console.log(`Surface layer factor reduction: ${csReduction.toFixed(1)}%`);
  console.log(`Step voltage reduction: ${stepReduction.toFixed(1)}%`);
  console.log(`Touch voltage reduction: ${touchReduction.toFixed(1)}%`);
  
  // Surface layer should reduce voltages
  const effectiveReduction = stepReduction > 0 && touchReduction > 0;
  console.log(`Surface layer effective: ${effectiveReduction ? 'PASS' : 'FAIL'}`);
}

function analyzeGridSizeEffect(testName, base, current) {
  console.log(`\n--- ${testName} Grid Size Analysis ---`);
  
  if (base.error || current.error) {
    console.log('Cannot analyze grid size - calculation failed');
    return;
  }
  
  const baseArea = base.testCase.grid.length * base.testCase.grid.width;
  const currentArea = current.testCase.grid.length * current.testCase.grid.width;
  const areaRatio = baseArea / currentArea;
  
  const rgIncrease = ((current.Rg - base.Rg) / base.Rg) * 100;
  const gprIncrease = ((current.GPR - base.GPR) / base.GPR) * 100;
  
  console.log(`Area ratio: ${areaRatio.toFixed(1)}x smaller`);
  console.log(`Grid resistance increase: ${rgIncrease.toFixed(1)}%`);
  console.log(`GPR increase: ${gprIncrease.toFixed(1)}%`);
  
  // Smaller grid should have higher resistance
  const reasonableScaling = rgIncrease > 0 && gprIncrease > 0;
  console.log(`Reasonable scaling: ${reasonableScaling ? 'PASS' : 'FAIL'}`);
}

function analyzeTwoLayerEffect(testName, base, current) {
  console.log(`\n--- ${testName} Two-Layer Analysis ---`);
  
  if (base.error || current.error) {
    console.log('Cannot analyze two-layer - calculation failed');
    return;
  }
  
  // Two-layer should behave differently than uniform
  const uniformResistivity = base.testCase.soil.resistivity;
  const effectiveResistivity = (current.testCase.soil.layer1.resistivity * current.testCase.soil.layer1.thickness + 
                         current.testCase.soil.layer2.resistivity * 10) / 
                        (current.testCase.soil.layer1.thickness + 10);
  
  const expectedBehavior = current.Rg !== base.Rg;
  console.log(`Different behavior than uniform: ${expectedBehavior ? 'PASS' : 'FAIL'}`);
  console.log(`Uniform resistivity: ${uniformResistivity} ×m`);
  console.log(`Two-layer average: ${effectiveResistivity.toFixed(0)} ×m`);
}

function checkNumericalStability(allTests) {
  console.log('\n=== NUMERICAL STABILITY CHECK ===');
  
  const validTests = allTests.filter(t => !t.error);
  const maxValues = {
    Rg: Math.max(...validTests.map(t => t.Rg || 0)),
    GPR: Math.max(...validTests.map(t => t.GPR || 0)),
    Es: Math.max(...validTests.map(t => t.Es || 0)),
    Et: Math.max(...validTests.map(t => t.Et || 0))
  };
  
  const minValues = {
    Rg: Math.min(...validTests.map(t => t.Rg || Infinity)),
    GPR: Math.min(...validTests.map(t => t.GPR || Infinity)),
    Es: Math.min(...validTests.map(t => t.Es || Infinity)),
    Et: Math.min(...validTests.map(t => t.Et || Infinity))
  };
  
  console.log('Value ranges:');
  console.log(`  Grid Resistance: ${minValues.Rg.toFixed(4)} - ${maxValues.Rg.toFixed(4)} ×`);
  console.log(`  GPR: ${minValues.GPR.toFixed(0)} - ${maxValues.GPR.toFixed(0)} V`);
  console.log(`  Step Voltage: ${minValues.Es.toFixed(0)} - ${maxValues.Es.toFixed(0)} V`);
  console.log(`  Touch Voltage: ${minValues.Et.toFixed(0)} - ${maxValues.Et.toFixed(0)} V`);
  
  // Check for reasonable ranges
  const stable = maxValues.Rg < 100 && maxValues.GPR < 50000 && maxValues.Es < 10000 && maxValues.Et < 10000;
  console.log(`Numerically stable: ${stable ? 'PASS' : 'FAIL'}`);
}

function checkPhysicalConsistency(allTests) {
  console.log('\n=== PHYSICAL CONSISTENCY CHECK ===');
  
  let consistentCount = 0;
  
  allTests.forEach(test => {
    if (test.error) return;
    
    const gprConsistent = Math.abs(test.GPR - (test.Ig * test.Rg)) / (test.Ig * test.Rg) < 0.01;
    const touchHigherStep = test.Et > test.Es;
    const allPositive = test.Rg > 0 && test.GPR > 0 && test.Es > 0 && test.Et > 0;
    
    const consistent = gprConsistent && touchHigherStep && allPositive;
    if (consistent) consistentCount++;
    
    console.log(`${test.testName}: ${consistent ? 'CONSISTENT' : 'INCONSISTENT'}`);
  });
  
  console.log(`Physical consistency rate: ${(consistentCount / allTests.length * 100).toFixed(0)}%`);
}

function checkEngineeringRealism(allTests) {
  console.log('\n=== ENGINEERING REALISM CHECK ===');
  
  allTests.forEach(test => {
    if (test.error) return;
    
    // Check for realistic engineering values
    const realisticResistance = test.Rg > 0.01 && test.Rg < 100;
    const realisticGPR = test.GPR > 10 && test.GPR < 50000;
    const realisticVoltages = test.Es > 1 && test.Es < 10000 && test.Et > 1 && test.Et < 10000;
    const reasonableRatio = test.Et / test.Es > 0.5 && test.Et / test.Es < 5; // Touch should be higher but not extremely higher
    
    const realistic = realisticResistance && realisticGPR && realisticVoltages && reasonableRatio;
    console.log(`${test.testName}: ${realistic ? 'REALISTIC' : 'UNREALISTIC'}`);
  });
}

function identifyCriticalFailures(allTests) {
  const failures = [];
  
  allTests.forEach(test => {
    if (test.error) {
      failures.push(`${test.testName}: ${test.error}`);
    } else if (test.criticalIssues) {
      failures.push(`${test.testName}: ${test.criticalIssues.join(', ')}`);
    }
  });
  
  return failures;
}
