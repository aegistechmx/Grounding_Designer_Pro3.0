/**
 * Energy Alignment Analysis
 * Investigates physical model discrepancies between analytical and discrete methods
 */

console.log('=== ENERGY ALIGNMENT ANALYSIS ===');
console.log('Investigating physical model discrepancies between methods');

(async () => {
  try {
    // Import modules
    const PhysicalAlignment = (await import('../domain/grounding/PhysicalAlignment.js')).default;
    const SoilModel = (await import('../domain/grounding/SoilModel.js')).default;
    const GridModel = (await import('../domain/grounding/GridModel.js')).default;
    const FaultModel = (await import('../domain/grounding/FaultModel.js')).default;
    const GridSolver = (await import('../domain/grounding/GridSolver.js')).default;
    
    // Test case for detailed analysis
    const testCase = {
      soil: { soilResistivity: 100, surfaceLayerResistivity: 2000, surfaceLayerThickness: 0.1 },
      grid: { gridLength: 30, gridWidth: 20, numParallel: 7, numParallelY: 5, burialDepth: 0.5, numRods: 4, rodLength: 3 },
      fault: { current: 10000, faultCurrent: 10000, faultDuration: 1.0, bodyWeight: 70, decrementFactor: 0.15, divisionFactor: 1.0 }
    };
    
    console.log('\n--- ENERGY ALIGNMENT INVESTIGATION ---');
    console.log(`Grid: ${testCase.grid.gridLength}m × ${testCase.grid.gridWidth}m`);
    console.log(`Soil: ${testCase.soil.soilResistivity} ×m`);
    console.log(`Fault: ${testCase.fault.current} A`);
    
    // Calculate unified parameters
    const unifiedGridCurrent = PhysicalAlignment.computeGridCurrent(testCase.fault);
    console.log(`Unified Grid Current: ${unifiedGridCurrent.toFixed(0)} A`);
    
    // Method 1: Analytical
    console.log('\n=== ANALYTICAL METHOD ENERGY ANALYSIS ===');
    
    const soilModel = new SoilModel(testCase.soil);
    const soilAnalysis = soilModel.analyze();
    
    const gridModel = new GridModel(testCase.grid);
    const gridAnalysis = gridModel.analyze(soilAnalysis.effectiveResistivity);
    
    const Rg_analytical = gridAnalysis.gridResistance;
    const GPR_analytical = unifiedGridCurrent * Rg_analytical;
    const Power_analytical = unifiedGridCurrent * unifiedGridCurrent * Rg_analytical;
    
    console.log(`Grid Resistance: ${Rg_analytical.toFixed(3)} ×`);
    console.log(`GPR: ${GPR_analytical.toFixed(0)} V`);
    console.log(`Power Dissipation: ${(Power_analytical / 1000).toFixed(1)} kW`);
    
    // Method 2: Discrete
    console.log('\n=== DISCRETE METHOD ENERGY ANALYSIS ===');
    
    const discreteResults = GridSolver.solveGrid(
      testCase.grid,
      soilAnalysis.effectiveResistivity,
      unifiedGridCurrent
    );
    
    const Rg_discrete = discreteResults.gridResistance;
    const GPR_discrete = discreteResults.gpr;
    const Power_discrete = unifiedGridCurrent * unifiedGridCurrent * Rg_discrete;
    
    console.log(`Grid Resistance: ${Rg_discrete.toFixed(3)} ×`);
    console.log(`GPR: ${GPR_discrete.toFixed(0)} V`);
    console.log(`Power Dissipation: ${(Power_discrete / 1000).toFixed(1)} kW`);
    
    // Energy Comparison
    console.log('\n=== ENERGY COMPARISON ===');
    
    const ResistanceRatio = Rg_discrete / Rg_analytical;
    const GPRRatio = GPR_discrete / GPR_analytical;
    const PowerRatio = Power_discrete / Power_analytical;
    
    console.log(`Resistance Ratio (Discrete/Analytical): ${ResistanceRatio.toFixed(2)}x`);
    console.log(`GPR Ratio (Discrete/Analytical): ${GPRRatio.toFixed(2)}x`);
    console.log(`Power Ratio (Discrete/Analytical): ${PowerRatio.toFixed(2)}x`);
    
    // Physical Consistency Check
    console.log('\n=== PHYSICAL CONSISTENCY CHECK ===');
    
    const energyConsistent = Math.abs(PowerRatio - 1.0) < 0.1; // Within 10%
    const resistanceReasonable = ResistanceRatio < 3.0; // Less than 3x difference
    const currentConsistent = true; // Both use same current
    
    console.log(`Energy Conservation: ${energyConsistent ? 'CONSISTENT' : 'VIOLATED'}`);
    console.log(`Resistance Difference: ${resistanceReasonable ? 'REASONABLE' : 'EXCESSIVE'}`);
    console.log(`Current Consistency: ${currentConsistent ? 'CONSISTENT' : 'INCONSISTENT'}`);
    
    // Detailed Discrete Analysis
    console.log('\n=== DISCRETE SOLVER DETAILED ANALYSIS ===');
    
    // Analyze node voltages
    const nodeVoltages = discreteResults.nodeVoltages;
    const nodes = discreteResults.nodes;
    
    const maxVoltage = Math.max(...nodeVoltages);
    const minVoltage = Math.min(...nodeVoltages);
    const avgVoltage = nodeVoltages.reduce((sum, v) => sum + v, 0) / nodeVoltages.length;
    
    console.log(`Node Voltage Statistics:`);
    console.log(`  Max: ${maxVoltage.toFixed(0)} V`);
    console.log(`  Min: ${minVoltage.toFixed(0)} V`);
    console.log(`  Avg: ${avgVoltage.toFixed(0)} V`);
    console.log(`  Range: ${(maxVoltage - minVoltage).toFixed(0)} V`);
    
    // Analyze current distribution
    const totalCurrent = discreteResults.totalCurrent;
    const expectedCurrent = unifiedGridCurrent;
    const currentBalance = Math.abs(totalCurrent - expectedCurrent) / expectedCurrent;
    
    console.log(`\nCurrent Distribution:`);
    console.log(`  Expected: ${expectedCurrent.toFixed(0)} A`);
    console.log(`  Actual: ${totalCurrent.toFixed(0)} A`);
    console.log(`  Balance Error: ${(currentBalance * 100).toFixed(1)}%`);
    
    // Analyze ground conductance paths
    console.log('\n=== GROUND CONDUCTANCE ANALYSIS ===');
    
    // Count nodes with rods
    const rodNodes = nodes.filter(node => node.hasRod);
    const edgeNodes = nodes.filter(node => node.isEdge);
    const interiorNodes = nodes.filter(node => !node.isEdge);
    
    console.log(`Node Distribution:`);
    console.log(`  Total Nodes: ${nodes.length}`);
    console.log(`  Rod Nodes: ${rodNodes.length}`);
    console.log(`  Edge Nodes: ${edgeNodes.length}`);
    console.log(`  Interior Nodes: ${interiorNodes.length}`);
    
    // Analyze voltage distribution by node type
    const rodVoltages = rodNodes.map(node => nodeVoltages[nodes.indexOf(node)]);
    const edgeVoltages = edgeNodes.map(node => nodeVoltages[nodes.indexOf(node)]);
    const interiorVoltages = interiorNodes.map(node => nodeVoltages[nodes.indexOf(node)]);
    
    if (rodVoltages.length > 0) {
      const avgRodVoltage = rodVoltages.reduce((sum, v) => sum + v, 0) / rodVoltages.length;
      console.log(`  Avg Rod Node Voltage: ${avgRodVoltage.toFixed(0)} V`);
    }
    
    if (edgeVoltages.length > 0) {
      const avgEdgeVoltage = edgeVoltages.reduce((sum, v) => sum + v, 0) / edgeVoltages.length;
      console.log(`  Avg Edge Node Voltage: ${avgEdgeVoltage.toFixed(0)} V`);
    }
    
    if (interiorVoltages.length > 0) {
      const avgInteriorVoltage = interiorVoltages.reduce((sum, v) => sum + v, 0) / interiorVoltages.length;
      console.log(`  Avg Interior Node Voltage: ${avgInteriorVoltage.toFixed(0)} V`);
    }
    
    // Boundary Condition Analysis
    console.log('\n=== BOUNDARY CONDITION ANALYSIS ===');
    
    // Check if discrete solver has proper reference to infinity
    const referenceVoltage = minVoltage; // Assume minimum is reference
    const voltageRange = maxVoltage - minVoltage;
    const relativeRange = voltageRange / maxVoltage;
    
    console.log(`Boundary Conditions:`);
    console.log(`  Reference Voltage: ${referenceVoltage.toFixed(0)} V`);
    console.log(`  Voltage Range: ${voltageRange.toFixed(0)} V`);
    console.log(`  Relative Range: ${(relativeRange * 100).toFixed(1)}%`);
    
    // Compare with analytical expectations
    const expectedGPR = unifiedGridCurrent * Rg_analytical;
    const gprRatio = GPR_discrete / expectedGPR;
    
    console.log(`\nGPR Comparison:`);
    console.log(`  Expected (Analytical): ${expectedGPR.toFixed(0)} V`);
    console.log(`  Calculated (Discrete): ${GPR_discrete.toFixed(0)} V`);
    console.log(`  Ratio: ${gprRatio.toFixed(2)}x`);
    
    // Diagnostic Conclusions
    console.log('\n=== DIAGNOSTIC CONCLUSIONS ===');
    
    let issues = [];
    
    if (PowerRatio > 5.0) {
      issues.push('EXCESSIVE power dissipation difference (>5x)');
    }
    
    if (ResistanceRatio > 5.0) {
      issues.push('EXCESSIVE grid resistance difference (>5x)');
    }
    
    if (currentBalance > 0.1) {
      issues.push('CURRENT balance error (>10%)');
    }
    
    if (relativeRange > 0.5) {
      issues.push('EXCESSIVE voltage range (>50% of max)');
    }
    
    if (issues.length === 0) {
      console.log('Status: ENERGY ALIGNED - No significant issues detected');
    } else {
      console.log('Status: ENERGY MISALIGNMENT DETECTED');
      console.log('Issues:');
      issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
    }
    
    // Recommendations
    console.log('\n=== RECOMMENDATIONS ===');
    
    if (PowerRatio > 5.0) {
      console.log('1. Review ground conductance modeling in discrete solver');
      console.log('2. Check boundary conditions and reference potential');
      console.log('3. Verify current injection distribution');
    }
    
    if (ResistanceRatio > 5.0) {
      console.log('4. Analyze effective ground paths in discrete method');
      console.log('5. Review rod modeling and effectiveness');
      console.log('6. Check soil resistivity implementation');
    }
    
    if (currentBalance > 0.1) {
      console.log('7. Verify current conservation in discrete solver');
      console.log('8. Check admittance matrix construction');
    }
    
    if (relativeRange > 0.5) {
      console.log('9. Review voltage distribution in discrete method');
      console.log('10. Check for voltage concentration issues');
    }
    
    console.log('\n=== ANALYSIS COMPLETE ===');
    
  } catch (error) {
    console.error('Energy alignment analysis failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
})().catch(error => {
  console.error('Import error:', error.message);
});
