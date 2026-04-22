/**
 * Discrete Solver Debug Test
 * Diagnose and fix step/touch voltage calculation issues
 */

console.log('=== DISCRETE SOLVER DEBUG ===');
console.log('Diagnosing step and touch voltage calculation problems');

(async () => {
  try {
    // Import modules
    const GridSolver = (await import('../domain/grounding/GridSolver.js')).default;
    const PhysicalAlignment = (await import('../domain/grounding/PhysicalAlignment.js')).default;
    
    // Test case
    const testCase = {
      grid: {
        gridLength: 30,
        gridWidth: 20,
        numParallel: 7,
        numParallelY: 5,
        burialDepth: 0.5,
        numRods: 4,
        rodLength: 3
      },
      soilResistivity: 100,
      faultCurrent: 1500 // Unified grid current
    };
    
    console.log('\n--- DEBUG CONFIGURATION ---');
    console.log(`Grid: ${testCase.grid.gridLength}m × ${testCase.grid.gridWidth}m`);
    console.log(`Nodes: ${testCase.grid.numParallel} × ${testCase.grid.numParallelY}`);
    console.log(`Fault Current: ${testCase.faultCurrent} A`);
    
    // Run discrete solver
    console.log('\n=== STEP 1: RUN DISCRETE SOLVER ===');
    
    const discreteResults = GridSolver.solveGrid(
      testCase.grid,
      testCase.soilResistivity,
      testCase.faultCurrent
    );
    
    console.log(`Nodes: ${discreteResults.nodes.length}`);
    console.log(`Grid Resistance: ${discreteResults.gridResistance.toFixed(3)} ×`);
    console.log(`GPR: ${discreteResults.gpr.toFixed(0)} V`);
    console.log(`Original Step Voltage: ${discreteResults.stepVoltage.toFixed(0)} V`);
    console.log(`Original Touch Voltage: ${discreteResults.touchVoltage.toFixed(0)} V`);
    
    // Debug node positions and voltages
    console.log('\n=== STEP 2: DEBUG NODE POSITIONS AND VOLTAGES ===');
    
    console.log('\nFirst 10 nodes (position, voltage):');
    for (let i = 0; i < Math.min(10, discreteResults.nodes.length); i++) {
      const node = discreteResults.nodes[i];
      const voltage = discreteResults.nodeVoltages[i];
      const nodeVoltage = node.voltage || voltage;
      console.log(`Node ${i}: (${node.x ? node.x.toFixed(1) : 'undefined'}, ${node.y ? node.y.toFixed(1) : 'undefined'}, ${node.z ? node.z.toFixed(1) : 'undefined'}) -> ${nodeVoltage ? nodeVoltage.toFixed(0) : 'undefined'} V`);
      console.log(`  Node ID: ${node.id || 'undefined'}, Has Rod: ${node.hasRod || 'undefined'}, Is Edge: ${node.isEdge || 'undefined'}`);
    }
    
    // Debug step voltage calculation
    console.log('\n=== STEP 3: DEBUG STEP VOLTAGE CALCULATION ===');
    
    let stepVoltageDebug = 0;
    let stepDebugInfo = [];
    
    for (let i = 0; i < discreteResults.nodes.length; i++) {
      for (let j = i + 1; j < discreteResults.nodes.length; j++) {
        const distance = PhysicalAlignment.calculateDistance(discreteResults.nodes[i], discreteResults.nodes[j]);
        
        // Check all distance ranges
        if (distance >= 0.5 && distance <= 2.0) {
          const stepVoltage = Math.abs(discreteResults.nodeVoltages[i] - discreteResults.nodeVoltages[j]);
          
          if (stepVoltage > stepVoltageDebug) {
            stepVoltageDebug = stepVoltage;
            stepDebugInfo = [i, j, distance, stepVoltage];
          }
        }
      }
    }
    
    console.log(`\nStep Voltage Debug Results:`);
    console.log(`Max Step Voltage: ${stepVoltageDebug.toFixed(0)} V`);
    if (stepDebugInfo.length > 0) {
      console.log(`Node Pair: ${stepDebugInfo[0]} - ${stepDebugInfo[1]}`);
      console.log(`Distance: ${stepDebugInfo[2].toFixed(2)} m`);
      console.log(`Voltage Difference: ${stepDebugInfo[3].toFixed(0)} V`);
    } else {
      console.log('No node pairs found in 0.5-2.0m range');
    }
    
    // Debug specific 1m pairs
    console.log('\n--- Specific 1m Pairs ---');
    let oneMeterPairs = [];
    for (let i = 0; i < discreteResults.nodes.length; i++) {
      for (let j = i + 1; j < discreteResults.nodes.length; j++) {
        const distance = PhysicalAlignment.calculateDistance(discreteResults.nodes[i], discreteResults.nodes[j]);
        if (distance >= 0.9 && distance <= 1.1) {
          oneMeterPairs.push([i, j, distance, Math.abs(discreteResults.nodeVoltages[i] - discreteResults.nodeVoltages[j])]);
        }
      }
    }
    
    console.log(`Found ${oneMeterPairs.length} pairs at ~1m distance:`);
    oneMeterPairs.slice(0, 5).forEach(([i, j, distance, voltage]) => {
      console.log(`  Nodes ${i}-${j}: ${distance.toFixed(2)}m, ${voltage.toFixed(0)}V`);
    });
    
    // Debug touch voltage calculation
    console.log('\n=== STEP 4: DEBUG TOUCH VOLTAGE CALCULATION ===');
    
    let touchVoltageDebug = 0;
    let touchDebugInfo = [];
    
    for (let i = 0; i < discreteResults.nodes.length; i++) {
      const node = discreteResults.nodes[i];
      const nodeVoltage = discreteResults.nodeVoltages[i];
      
      const surfacePotential = PhysicalAlignment.estimateSurfacePotential(node, discreteResults.nodes, discreteResults.nodeVoltages);
      const touchVoltage = Math.abs(nodeVoltage - surfacePotential);
      
      if (touchVoltage > touchVoltageDebug) {
        touchVoltageDebug = touchVoltage;
        touchDebugInfo = [i, nodeVoltage, surfacePotential, touchVoltage];
      }
    }
    
    console.log(`\nTouch Voltage Debug Results:`);
    console.log(`Max Touch Voltage: ${touchVoltageDebug.toFixed(0)} V`);
    if (touchDebugInfo.length > 0) {
      console.log(`Node: ${touchDebugInfo[0]}`);
      console.log(`Node Voltage: ${touchDebugInfo[1].toFixed(0)} V`);
      console.log(`Surface Potential: ${touchDebugInfo[2].toFixed(0)} V`);
      console.log(`Touch Voltage: ${touchDebugInfo[3].toFixed(0)} V`);
    }
    
    // Debug surface potential estimation
    console.log('\n=== STEP 5: DEBUG SURFACE POTENTIAL ESTIMATION ===');
    
    // Test surface potential for a specific node
    const testNode = discreteResults.nodes[0];
    console.log(`\nTesting surface potential for Node 0 at (${testNode.x.toFixed(1)}, ${testNode.y.toFixed(1)}, ${testNode.z.toFixed(1)})`);
    
    const nearbyNodes = discreteResults.nodes.filter(node => {
      const distance = PhysicalAlignment.calculateDistance(testNode, node);
      return distance > 0.5 && distance <= 2.0;
    });
    
    console.log(`Found ${nearbyNodes.length} nearby nodes (0.5-2.0m):`);
    
    if (nearbyNodes.length > 0) {
      console.log('Nearby nodes (index, distance, voltage):');
      nearbyNodes.forEach(node => {
        const idx = discreteResults.nodes.indexOf(node);
        const distance = PhysicalAlignment.calculateDistance(testNode, node);
        const voltage = discreteResults.nodeVoltages[idx];
        console.log(`  Node ${idx}: ${distance.toFixed(2)}m, ${voltage.toFixed(0)}V`);
      });
      
      const surfacePotential = PhysicalAlignment.estimateSurfacePotential(testNode, discreteResults.nodes, discreteResults.nodeVoltages);
      console.log(`\nEstimated Surface Potential: ${surfacePotential.toFixed(0)} V`);
      console.log(`Node Voltage: ${discreteResults.nodeVoltages[0].toFixed(0)} V`);
      console.log(`Touch Voltage: ${Math.abs(discreteResults.nodeVoltages[0] - surfacePotential).toFixed(0)} V`);
    } else {
      console.log('No nearby nodes found - using fallback calculation');
      
      // Test fallback calculation
      const otherNodes = discreteResults.nodes.filter((_, i) => i !== 0);
      if (otherNodes.length > 0) {
        const otherVoltages = otherNodes.map(node => 
          discreteResults.nodeVoltages[discreteResults.nodes.indexOf(node)]
        );
        const avgVoltage = otherVoltages.reduce((sum, v) => sum + v, 0) / otherVoltages.length;
        console.log(`Fallback - Average of other nodes: ${avgVoltage.toFixed(0)} V`);
      }
    }
    
    // Voltage range analysis
    console.log('\n=== STEP 6: VOLTAGE DISTRIBUTION ANALYSIS ===');
    
    const voltages = discreteResults.nodeVoltages;
    const maxVoltage = Math.max(...voltages);
    const minVoltage = Math.min(...voltages);
    const voltageRange = maxVoltage - minVoltage;
    const avgVoltage = voltages.reduce((sum, v) => sum + v, 0) / voltages.length;
    
    console.log(`Voltage Statistics:`);
    console.log(`  Max: ${maxVoltage.toFixed(0)} V`);
    console.log(`  Min: ${minVoltage.toFixed(0)} V`);
    console.log(`  Range: ${voltageRange.toFixed(0)} V`);
    console.log(`  Average: ${avgVoltage.toFixed(0)} V`);
    
    // Find nodes with max and min voltages
    const maxNodeIndex = voltages.indexOf(maxVoltage);
    const minNodeIndex = voltages.indexOf(minVoltage);
    
    console.log(`\nMax Voltage Node ${maxNodeIndex}:`);
    console.log(`  Position: (${discreteResults.nodes[maxNodeIndex].x.toFixed(1)}, ${discreteResults.nodes[maxNodeIndex].y.toFixed(1)})`);
    console.log(`  Voltage: ${maxVoltage.toFixed(0)} V`);
    console.log(`  Has Rod: ${discreteResults.nodes[maxNodeIndex].hasRod ? 'YES' : 'NO'}`);
    console.log(`  Is Edge: ${discreteResults.nodes[maxNodeIndex].isEdge ? 'YES' : 'NO'}`);
    
    console.log(`\nMin Voltage Node ${minNodeIndex}:`);
    console.log(`  Position: (${discreteResults.nodes[minNodeIndex].x.toFixed(1)}, ${discreteResults.nodes[minNodeIndex].y.toFixed(1)})`);
    console.log(`  Voltage: ${minVoltage.toFixed(0)} V`);
    console.log(`  Has Rod: ${discreteResults.nodes[minNodeIndex].hasRod ? 'YES' : 'NO'}`);
    console.log(`  Is Edge: ${discreteResults.nodes[minNodeIndex].isEdge ? 'YES' : 'NO'}`);
    
    // Recommendations
    console.log('\n=== STEP 7: RECOMMENDATIONS ===');
    
    const recommendations = [];
    
    if (stepVoltageDebug === 0) {
      recommendations.push('Step voltage calculation failing - check node spacing and distance calculation');
    }
    
    if (touchVoltageDebug < 100) {
      recommendations.push('Touch voltage too low - surface potential estimation needs correction');
    }
    
    if (voltageRange < 100) {
      recommendations.push('Voltage range too small - check current distribution and conductance');
    }
    
    if (oneMeterPairs.length === 0) {
      recommendations.push('No 1m node pairs found - grid spacing may be too large');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Step and touch voltage calculations appear functional');
    }
    
    console.log('\nRecommendations:');
    recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
    
    console.log('\n=== DEBUG SUMMARY ===');
    console.log(`Original Step Voltage: ${discreteResults.stepVoltage.toFixed(0)} V`);
    console.log(`Debug Step Voltage: ${stepVoltageDebug.toFixed(0)} V`);
    console.log(`Original Touch Voltage: ${discreteResults.touchVoltage.toFixed(0)} V`);
    console.log(`Debug Touch Voltage: ${touchVoltageDebug.toFixed(0)} V`);
    console.log(`Voltage Range: ${voltageRange.toFixed(0)} V`);
    console.log(`1m Pairs Found: ${oneMeterPairs.length}`);
    
  } catch (error) {
    console.error('Discrete solver debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
})().catch(error => {
  console.error('Import error:', error.message);
});
