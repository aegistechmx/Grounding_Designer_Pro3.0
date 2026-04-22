/**
 * Ground Conductance Analysis
 * Analyzes effective ground paths in discrete solver to identify resistance discrepancies
 */

console.log('=== GROUND CONDUCTANCE ANALYSIS ===');
console.log('Analyzing effective ground paths in discrete solver');

(async () => {
  try {
    // Import modules
    const GridSolver = (await import('../domain/grounding/GridSolver.js')).default;
    
    // Test case
    const gridGeometry = {
      gridLength: 30,
      gridWidth: 20,
      numParallel: 7,
      numParallelY: 5,
      burialDepth: 0.5,
      numRods: 4,
      rodLength: 3
    };
    
    const soilResistivity = 100;
    const faultCurrent = 1500;
    
    console.log('\n--- GROUND CONDUCTANCE INVESTIGATION ---');
    console.log(`Grid: ${gridGeometry.gridLength}m × ${gridGeometry.gridWidth}m`);
    console.log(`Soil Resistivity: ${soilResistivity} ×m`);
    console.log(`Fault Current: ${faultCurrent} A`);
    
    // Analyze ground conductance paths
    console.log('\n=== STEP 1: ADMITTANCE MATRIX ANALYSIS ===');
    
    // Build grid components manually for analysis
    const nodes = GridSolver.buildGridNodes(gridGeometry);
    const edges = GridSolver.buildGridEdges(nodes, gridGeometry, soilResistivity);
    
    console.log(`Nodes: ${nodes.length}`);
    console.log(`Edges: ${edges.length}`);
    
    // Analyze edge types and conductances
    const conductorEdges = edges.filter(e => e.type === 'conductor');
    const groundEdges = edges.filter(e => e.type === 'ground');
    const rodEdges = edges.filter(e => e.type === 'rod');
    
    console.log(`\nEdge Types:`);
    console.log(`  Conductor Edges: ${conductorEdges.length}`);
    console.log(`  Ground Edges: ${groundEdges.length}`);
    console.log(`  Rod Edges: ${rodEdges.length}`);
    
    // Calculate total conductance to ground
    let totalGroundConductance = 0;
    let totalRodConductance = 0;
    let totalConductorConductance = 0;
    
    groundEdges.forEach(edge => {
      totalGroundConductance += 1 / edge.resistance;
    });
    
    rodEdges.forEach(edge => {
      totalRodConductance += 1 / edge.resistance;
    });
    
    conductorEdges.forEach(edge => {
      totalConductorConductance += 1 / edge.resistance;
    });
    
    console.log(`\nConductance Analysis:`);
    console.log(`  Total Ground Conductance: ${(totalGroundConductance * 1000).toFixed(3)} mS`);
    console.log(`  Total Rod Conductance: ${(totalRodConductance * 1000).toFixed(3)} mS`);
    console.log(`  Total Conductor Conductance: ${(totalConductorConductance * 1000).toFixed(3)} mS`);
    
    // Calculate expected resistance from conductance
    const expectedResistanceFromConductance = 1 / totalGroundConductance;
    console.log(`  Expected Resistance from Conductance: ${expectedResistanceFromConductance.toFixed(3)} ×`);
    
    // Analyze ground edge distribution
    console.log('\n=== STEP 2: GROUND EDGE DISTRIBUTION ===');
    
    // Group ground edges by resistance ranges
    const lowResistanceGround = groundEdges.filter(e => e.resistance < 10);
    const mediumResistanceGround = groundEdges.filter(e => e.resistance >= 10 && e.resistance < 100);
    const highResistanceGround = groundEdges.filter(e => e.resistance >= 100);
    
    console.log(`Ground Edge Resistance Distribution:`);
    console.log(`  Low Resistance (<10×): ${lowResistanceGround.length}`);
    console.log(`  Medium Resistance (10-100×): ${mediumResistanceGround.length}`);
    console.log(`  High Resistance (>=100×): ${highResistanceGround.length}`);
    
    if (lowResistanceGround.length > 0) {
      const avgLowResistance = lowResistanceGround.reduce((sum, e) => sum + e.resistance, 0) / lowResistanceGround.length;
      console.log(`    Avg Low Resistance: ${avgLowResistance.toFixed(2)} ×`);
    }
    
    if (highResistanceGround.length > 0) {
      const avgHighResistance = highResistanceGround.reduce((sum, e) => sum + e.resistance, 0) / highResistanceGround.length;
      console.log(`    Avg High Resistance: ${avgHighResistance.toFixed(0)} ×`);
    }
    
    // Analyze rod effectiveness
    console.log('\n=== STEP 3: ROD EFFECTIVENESS ANALYSIS ===');
    
    if (rodEdges.length > 0) {
      const rodResistances = rodEdges.map(e => e.resistance);
      const minRodResistance = Math.min(...rodResistances);
      const maxRodResistance = Math.max(...rodResistances);
      const avgRodResistance = rodResistances.reduce((sum, r) => sum + r, 0) / rodResistances.length;
      
      console.log(`Rod Edge Analysis:`);
      console.log(`  Number of Rod Edges: ${rodEdges.length}`);
      console.log(`  Min Rod Resistance: ${minRodResistance.toFixed(2)} ×`);
      console.log(`  Max Rod Resistance: ${maxRodResistance.toFixed(2)} ×`);
      console.log(`  Avg Rod Resistance: ${avgRodResistance.toFixed(2)} ×`);
      
      // Calculate rod contribution
      const rodContribution = totalRodConductance / totalGroundConductance;
      console.log(`  Rod Conductance Contribution: ${(rodContribution * 100).toFixed(1)}%`);
    } else {
      console.log('No rod edges found - rods may not be properly modeled');
    }
    
    // Analyze boundary conditions
    console.log('\n=== STEP 4: BOUNDARY CONDITION ANALYSIS ===');
    
    // Check if ground reference is properly implemented
    const groundReferenceNodes = nodes.filter(node => node.isGroundReference);
    console.log(`Ground Reference Nodes: ${groundReferenceNodes.length}`);
    
    // Analyze soil resistivity implementation
    console.log('\n=== STEP 5: SOIL RESISTIVITY IMPLEMENTATION ===');
    
    // Calculate expected ground resistance for simple hemisphere
    const hemisphereRadius = Math.sqrt(gridGeometry.gridLength * gridGeometry.gridWidth / Math.PI);
    const hemisphereResistance = soilResistivity / (2 * Math.PI * hemisphereRadius);
    
    console.log(`Simple Hemisphere Model:`);
    console.log(`  Equivalent Radius: ${hemisphereRadius.toFixed(2)} m`);
    console.log(`  Hemisphere Resistance: ${hemisphereResistance.toFixed(3)} ×`);
    
    // Compare with discrete solver
    console.log('\n=== STEP 6: COMPARATIVE ANALYSIS ===');
    
    const discreteResults = GridSolver.solveGrid(gridGeometry, soilResistivity, faultCurrent);
    const actualDiscreteResistance = discreteResults.gridResistance;
    
    console.log(`Resistance Comparison:`);
    console.log(`  Hemisphere Model: ${hemisphereResistance.toFixed(3)} ×`);
    console.log(`  Conductance Model: ${expectedResistanceFromConductance.toFixed(3)} ×`);
    console.log(`  Discrete Solver: ${actualDiscreteResistance.toFixed(3)} ×`);
    
    // Calculate ratios
    const hemisphereRatio = actualDiscreteResistance / hemisphereResistance;
    const conductanceRatio = actualDiscreteResistance / expectedResistanceFromConductance;
    
    console.log(`\nResistance Ratios:`);
    console.log(`  Discrete/Hemisphere: ${hemisphereRatio.toFixed(2)}x`);
    console.log(`  Discrete/Conductance: ${conductanceRatio.toFixed(2)}x`);
    
    // Identify issues
    console.log('\n=== STEP 7: ISSUE IDENTIFICATION ===');
    
    const issues = [];
    
    if (actualDiscreteResistance > hemisphereResistance * 3) {
      issues.push('Discrete resistance excessively high compared to hemisphere model');
    }
    
    if (actualDiscreteResistance > expectedResistanceFromConductance * 2) {
      issues.push('Discrete resistance higher than conductance prediction');
    }
    
    if (groundEdges.length === 0) {
      issues.push('No ground edges found - boundary conditions may be incorrect');
    }
    
    if (rodEdges.length === 0 && gridGeometry.numRods > 0) {
      issues.push('Rod edges not found - rod modeling may be incomplete');
    }
    
    if (totalGroundConductance < 0.001) { // Less than 1 mS
      issues.push('Ground conductance too low - check soil resistivity implementation');
    }
    
    if (issues.length === 0) {
      console.log('Status: NO SIGNIFICANT GROUND CONDUCTANCE ISSUES DETECTED');
    } else {
      console.log('Status: GROUND CONDUCTANCE ISSUES DETECTED');
      console.log('Issues:');
      issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
    }
    
    // Recommendations
    console.log('\n=== RECOMMENDATIONS ===');
    
    if (actualDiscreteResistance > hemisphereResistance * 3) {
      console.log('1. Review ground edge resistance calculations');
      console.log('2. Check soil resistivity scaling factors');
      console.log('3. Verify boundary condition implementation');
    }
    
    if (totalGroundConductance < 0.001) {
      console.log('4. Increase ground conductance in discrete solver');
      console.log('5. Review soil resistivity to conductance conversion');
      console.log('6. Check for missing ground connection paths');
    }
    
    if (rodEdges.length === 0 && gridGeometry.numRods > 0) {
      console.log('7. Implement proper rod edge modeling');
      console.log('8. Add rod-to-ground conductance paths');
      console.log('9. Verify rod geometry parameters');
    }
    
    console.log('\n=== ANALYSIS COMPLETE ===');
    
  } catch (error) {
    console.error('Ground conductance analysis failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
})().catch(error => {
  console.error('Import error:', error.message);
});
