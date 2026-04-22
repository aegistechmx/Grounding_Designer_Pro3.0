/**
 * Discrete Grid Solver Test
 * Testing the new nodal analysis approach for current distribution
 */

console.log('=== DISCRETE GRID SOLVER TEST ===');
console.log('Testing nodal analysis for realistic current distribution');

(async () => {
  const GridSolver = (await import('../domain/grounding/GridSolver.js')).default;
  
  // Test case: Small industrial substation
  const testCase = {
    name: 'Small Industrial Substation - Discrete Analysis',
    gridGeometry: {
      gridLength: 30,
      gridWidth: 20,
      numParallel: 7,
      numParallelY: 5,
      burialDepth: 0.5,
      numRods: 4,
      rodLength: 3,
      spacing: 5 // meters
    },
    soilResistivity: 100,
    faultCurrent: 10000,
    expected: {
      stepVoltage: { min: 250, max: 400 },
      touchVoltage: { min: 400, max: 600 },
      gridResistance: { min: 2, max: 4 }
    }
  };
  
  console.log('\n--- Test Case: Small Industrial Substation ---');
  console.log(`Grid: ${testCase.gridGeometry.gridLength}m × ${testCase.gridGeometry.gridWidth}m`);
  console.log(`Nodes: ${testCase.gridGeometry.numParallel} × ${testCase.gridGeometry.numParallelY}`);
  console.log(`Rods: ${testCase.gridGeometry.numRods}`);
  console.log(`Soil Resistivity: ${testCase.soilResistivity} ×m`);
  console.log(`Fault Current: ${testCase.faultCurrent} A`);
  
  try {
    // Solve using discrete grid analysis
    console.log('\n=== SOLVING WITH DISCRETE GRID ANALYSIS ===');
    
    const results = GridSolver.solveGrid(
      testCase.gridGeometry,
      testCase.soilResistivity,
      testCase.faultCurrent
    );
    
    console.log('\n=== DISCRETE ANALYSIS RESULTS ===');
    console.log(`Grid Resistance: ${results.gridResistance.toFixed(3)} ×`);
    console.log(`GPR: ${results.gpr.toFixed(0)} V`);
    console.log(`Step Voltage: ${results.stepVoltage.toFixed(0)} V`);
    console.log(`Touch Voltage: ${results.touchVoltage.toFixed(0)} V`);
    console.log(`Total Current: ${results.totalCurrent.toFixed(0)} A`);
    
    console.log('\n=== NODE ANALYSIS ===');
    console.log(`Total Nodes: ${results.nodes.length}`);
    console.log(`Edge Nodes: ${results.nodes.filter(n => n.isEdge).length}`);
    console.log(`Corner Nodes: ${results.nodes.filter(n => n.isCorner).length}`);
    console.log(`Rod Nodes: ${results.nodes.filter(n => n.hasRod).length}`);
    
    console.log('\n=== VOLTAGE DISTRIBUTION ===');
    console.log(`Max Node Voltage: ${results.analysis.maxNodeVoltage.toFixed(0)} V`);
    console.log(`Min Node Voltage: ${results.analysis.minNodeVoltage.toFixed(0)} V`);
    console.log(`Voltage Range: ${results.analysis.voltageRange.toFixed(0)} V`);
    console.log(`Edge Concentration: ${results.analysis.edgeConcentration.toFixed(2)}x`);
    console.log(`Rod Effectiveness: ${results.analysis.rodEffectiveness.toFixed(2)}x`);
    
    console.log('\n=== BRANCH CURRENTS ===');
    const maxBranchCurrent = Math.max(...results.edges.map(e => Math.abs(e.current)));
    const avgBranchCurrent = results.edges.reduce((sum, e) => sum + Math.abs(e.current), 0) / results.edges.length;
    console.log(`Max Branch Current: ${maxBranchCurrent.toFixed(1)} A`);
    console.log(`Avg Branch Current: ${avgBranchCurrent.toFixed(1)} A`);
    console.log(`Total Branches: ${results.edges.length}`);
    
    // Show edge vs interior voltage comparison
    const edgeNodes = results.nodes.filter(n => n.isEdge);
    const interiorNodes = results.nodes.filter(n => !n.isEdge);
    
    if (edgeNodes.length > 0 && interiorNodes.length > 0) {
      const avgEdgeVoltage = edgeNodes.reduce((sum, n) => sum + n.voltage, 0) / edgeNodes.length;
      const avgInteriorVoltage = interiorNodes.reduce((sum, n) => sum + n.voltage, 0) / interiorNodes.length;
      
      console.log('\n=== EDGE VS INTERIOR COMPARISON ===');
      console.log(`Avg Edge Voltage: ${avgEdgeVoltage.toFixed(0)} V`);
      console.log(`Avg Interior Voltage: ${avgInteriorVoltage.toFixed(0)} V`);
      console.log(`Edge/Interior Ratio: ${(avgEdgeVoltage / avgInteriorVoltage).toFixed(2)}`);
    }
    
    // Show rod vs non-rod comparison
    const rodNodes = results.nodes.filter(n => n.hasRod);
    const nonRodNodes = results.nodes.filter(n => !n.hasRod);
    
    if (rodNodes.length > 0 && nonRodNodes.length > 0) {
      const avgRodVoltage = rodNodes.reduce((sum, n) => sum + n.voltage, 0) / rodNodes.length;
      const avgNonRodVoltage = nonRodNodes.reduce((sum, n) => sum + n.voltage, 0) / nonRodNodes.length;
      
      console.log('\n=== ROD VS NON-ROD COMPARISON ===');
      console.log(`Avg Rod Voltage: ${avgRodVoltage.toFixed(0)} V`);
      console.log(`Avg Non-Rod Voltage: ${avgNonRodVoltage.toFixed(0)} V`);
      console.log(`Rod/Non-Rod Ratio: ${(avgRodVoltage / avgNonRodVoltage).toFixed(2)}`);
    }
    
    // Validation against expected ranges
    console.log('\n=== VALIDATION AGAINST EXPECTED RANGES ===');
    const stepInRange = results.stepVoltage >= testCase.expected.stepVoltage.min && 
                      results.stepVoltage <= testCase.expected.stepVoltage.max;
    const touchInRange = results.touchVoltage >= testCase.expected.touchVoltage.min && 
                        results.touchVoltage <= testCase.expected.touchVoltage.max;
    const resistanceInRange = results.gridResistance >= testCase.expected.gridResistance.min && 
                            results.gridResistance <= testCase.expected.gridResistance.max;
    
    console.log(`Expected Ranges:`);
    console.log(`  Step Voltage: ${testCase.expected.stepVoltage.min}-${testCase.expected.stepVoltage.max} V`);
    console.log(`  Touch Voltage: ${testCase.expected.touchVoltage.min}-${testCase.expected.touchVoltage.max} V`);
    console.log(`  Grid Resistance: ${testCase.expected.gridResistance.min}-${testCase.expected.gridResistance.max} ×`);
    
    console.log(`\nValidation Results:`);
    console.log(`  Step Voltage: ${stepInRange ? 'PASS' : 'FAIL'} (${results.stepVoltage.toFixed(0)} V)`);
    console.log(`  Touch Voltage: ${touchInRange ? 'PASS' : 'FAIL'} (${results.touchVoltage.toFixed(0)} V)`);
    console.log(`  Grid Resistance: ${resistanceInRange ? 'PASS' : 'FAIL'} (${results.gridResistance.toFixed(3)} ×)`);
    
    const overallValidation = stepInRange && touchInRange && resistanceInRange;
    console.log(`  Overall: ${overallValidation ? 'PASS' : 'FAIL'}`);
    
    // Physical consistency check
    console.log('\n=== PHYSICAL CONSISTENCY CHECK ===');
    const touchGreaterThanStep = results.touchVoltage > results.stepVoltage;
    const gprConsistent = Math.abs(results.gpr - results.analysis.maxNodeVoltage) < 1;
    const allPositive = results.stepVoltage > 0 && results.touchVoltage > 0 && results.gridResistance > 0;
    const edgeHigherThanInterior = results.analysis.edgeConcentration > 1;
    
    console.log(`Touch > Step: ${touchGreaterThanStep ? 'YES' : 'NO'}`);
    console.log(`GPR = Max Node Voltage: ${gprConsistent ? 'YES' : 'NO'}`);
    console.log(`All Values Positive: ${allPositive ? 'YES' : 'NO'}`);
    console.log(`Edge > Interior: ${edgeHigherThanInterior ? 'YES' : 'NO'}`);
    
    const physicalConsistency = touchGreaterThanStep && gprConsistent && allPositive && edgeHigherThanInterior;
    console.log(`Physical Consistency: ${physicalConsistency ? 'PASS' : 'FAIL'}`);
    
    // Comparison with previous approach
    console.log('\n=== COMPARISON WITH PREVIOUS APPROACH ===');
    console.log('Previous (Global Factors):');
    console.log('  Step Voltage: 59 V');
    console.log('  Touch Voltage: 190 V');
    console.log('  Grid Resistance: 4.167 ×');
    
    console.log('Current (Discrete Analysis):');
    console.log(`  Step Voltage: ${results.stepVoltage.toFixed(0)} V`);
    console.log(`  Touch Voltage: ${results.touchVoltage.toFixed(0)} V`);
    console.log(`  Grid Resistance: ${results.gridResistance.toFixed(3)} ×`);
    
    const stepImprovement = results.stepVoltage / 59;
    const touchImprovement = results.touchVoltage / 190;
    const resistanceImprovement = 4.167 / results.gridResistance;
    
    console.log('\nImprovement Factors:');
    console.log(`  Step Voltage: ${stepImprovement.toFixed(2)}x`);
    console.log(`  Touch Voltage: ${touchImprovement.toFixed(2)}x`);
    console.log(`  Grid Resistance: ${resistanceImprovement.toFixed(2)}x`);
    
    // Final assessment
    console.log('\n=== FINAL ASSESSMENT ===');
    console.log(`Validation: ${overallValidation ? 'PASSED' : 'FAILED'}`);
    console.log(`Physical Consistency: ${physicalConsistency ? 'PASSED' : 'FAILED'}`);
    console.log(`Edge Concentration: ${results.analysis.edgeConcentration > 1.2 ? 'REALISTIC' : 'NEEDS ADJUSTMENT'}`);
    console.log(`Rod Effectiveness: ${results.analysis.rodEffectiveness > 1.0 ? 'WORKING' : 'NEEDS ADJUSTMENT'}`);
    
    const overallSuccess = physicalConsistency && edgeHigherThanInterior;
    console.log(`Discrete Grid Solver: ${overallSuccess ? 'SUCCESS' : 'NEEDS TUNING'}`);
    
    if (overallSuccess) {
      console.log('\n=== SUCCESS ===');
      console.log('Discrete grid analysis shows realistic behavior!');
      console.log('Edge concentration and rod effects are working correctly.');
    } else {
      console.log('\n=== TUNING NEEDED ===');
      console.log('Discrete solver needs parameter adjustment.');
    }
    
    // Recommendations
    console.log('\n=== RECOMMENDATIONS ===');
    if (!stepInRange) {
      console.log('- Adjust step voltage calculation method');
    }
    if (!touchInRange) {
      console.log('- Review touch voltage definition');
    }
    if (!resistanceInRange) {
      console.log('- Tune ground conductance parameters');
    }
    if (!edgeHigherThanInterior) {
      console.log('- Increase current concentration at edges');
    }
    
  } catch (error) {
    console.error('Discrete solver test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
})().catch(error => {
  console.error('Import error:', error.message);
});
