/**
 * Grid Node Debug Test
 * Debug node coordinate assignment in GridSolver
 */

console.log('=== GRID NODE DEBUG ===');
console.log('Debugging node coordinate assignment in GridSolver');

(async () => {
  try {
    // Import GridSolver directly
    const GridSolver = (await import('../domain/grounding/GridSolver.js')).default;
    
    // Test grid geometry
    const gridGeometry = {
      gridLength: 30,
      gridWidth: 20,
      numParallel: 7,
      numParallelY: 5,
      burialDepth: 0.5,
      numRods: 4,
      rodLength: 3
    };
    
    console.log('\n--- GRID GEOMETRY ---');
    console.log(`Grid Length: ${gridGeometry.gridLength} m`);
    console.log(`Grid Width: ${gridGeometry.gridWidth} m`);
    console.log(`Nodes X: ${gridGeometry.numParallel}`);
    console.log(`Nodes Y: ${gridGeometry.numParallelY}`);
    
    // Calculate expected spacing
    const expectedSpacingX = gridGeometry.gridLength / (gridGeometry.numParallel - 1);
    const expectedSpacingY = gridGeometry.gridWidth / (gridGeometry.numParallelY - 1);
    
    console.log(`\nExpected Spacing X: ${expectedSpacingX.toFixed(2)} m`);
    console.log(`Expected Spacing Y: ${expectedSpacingY.toFixed(2)} m`);
    
    // Test buildGridNodes function directly
    console.log('\n=== TESTING buildGridNodes FUNCTION ===');
    
    const nodes = GridSolver.buildGridNodes(gridGeometry);
    
    console.log(`\nNodes Created: ${nodes.length}`);
    console.log(`First 5 nodes:`);
    
    for (let i = 0; i < Math.min(5, nodes.length); i++) {
      const node = nodes[i];
      console.log(`Node ${i}:`);
      console.log(`  ID: ${node.id}`);
      console.log(`  X: ${node.x}`);
      console.log(`  Y: ${node.y}`);
      console.log(`  Z: ${node.z}`);
      console.log(`  Is Edge: ${node.isEdge}`);
      console.log(`  Is Corner: ${node.isCorner}`);
      console.log(`  Has Rod: ${node.hasRod}`);
    }
    
    // Check all nodes for coordinate issues
    console.log('\n=== COORDINATE VALIDATION ===');
    
    let xUndefined = 0;
    let yUndefined = 0;
    let zUndefined = 0;
    
    nodes.forEach((node, i) => {
      if (node.x === undefined) xUndefined++;
      if (node.y === undefined) yUndefined++;
      if (node.z === undefined) zUndefined++;
    });
    
    console.log(`Undefined X coordinates: ${xUndefined}/${nodes.length}`);
    console.log(`Undefined Y coordinates: ${yUndefined}/${nodes.length}`);
    console.log(`Undefined Z coordinates: ${zUndefined}/${nodes.length}`);
    
    // Check coordinate ranges
    if (xUndefined === 0) {
      const xValues = nodes.map(n => n.x);
      const xMin = Math.min(...xValues);
      const xMax = Math.max(...xValues);
      console.log(`X Range: ${xMin.toFixed(1)} to ${xMax.toFixed(1)} m`);
    }
    
    if (yUndefined === 0) {
      const yValues = nodes.map(n => n.y);
      const yMin = Math.min(...yValues);
      const yMax = Math.max(...yValues);
      console.log(`Y Range: ${yMin.toFixed(1)} to ${yMax.toFixed(1)} m`);
    }
    
    // Test distance calculation
    console.log('\n=== DISTANCE CALCULATION TEST ===');
    
    if (nodes.length >= 2 && xUndefined === 0 && yUndefined === 0) {
      // Test distance between first two nodes
      const distance01 = GridSolver.calculateDistance ? 
        GridSolver.calculateDistance(nodes[0], nodes[1]) :
        Math.sqrt(
          Math.pow(nodes[0].x - nodes[1].x, 2) + 
          Math.pow(nodes[0].y - nodes[1].y, 2) + 
          Math.pow(nodes[0].z - nodes[1].z, 2)
        );
      
      console.log(`Distance between Node 0 and Node 1: ${distance01.toFixed(2)} m`);
      
      // Find minimum distance
      let minDistance = Infinity;
      let minPair = [0, 0];
      
      for (let i = 0; i < Math.min(nodes.length, 20); i++) {
        for (let j = i + 1; j < Math.min(nodes.length, 20); j++) {
          const dist = Math.sqrt(
            Math.pow(nodes[i].x - nodes[j].x, 2) + 
            Math.pow(nodes[i].y - nodes[j].y, 2) + 
            Math.pow(nodes[i].z - nodes[j].z, 2)
          );
          
          if (dist > 0 && dist < minDistance) {
            minDistance = dist;
            minPair = [i, j];
          }
        }
      }
      
      console.log(`Minimum Distance: ${minDistance.toFixed(2)} m (Nodes ${minPair[0]}-${minPair[1]})`);
      
      // Count pairs at expected spacing
      let pairsAtSpacingX = 0;
      let pairsAtSpacingY = 0;
      
      for (let i = 0; i < Math.min(nodes.length, 20); i++) {
        for (let j = i + 1; j < Math.min(nodes.length, 20); j++) {
          const dist = Math.sqrt(
            Math.pow(nodes[i].x - nodes[j].x, 2) + 
            Math.pow(nodes[i].y - nodes[j].y, 2) + 
            Math.pow(nodes[i].z - nodes[j].z, 2)
          );
          
          const tolerance = 0.1;
          if (Math.abs(dist - expectedSpacingX) <= tolerance) pairsAtSpacingX++;
          if (Math.abs(dist - expectedSpacingY) <= tolerance) pairsAtSpacingY++;
        }
      }
      
      console.log(`Pairs at X spacing (${expectedSpacingX.toFixed(1)}m): ${pairsAtSpacingX}`);
      console.log(`Pairs at Y spacing (${expectedSpacingY.toFixed(1)}m): ${pairsAtSpacingY}`);
      
    } else {
      console.log('Cannot test distances - coordinate problems detected');
    }
    
    // Test full solveGrid to see if coordinates persist
    console.log('\n=== TESTING FULL SOLVEGRID ===');
    
    const fullResults = GridSolver.solveGrid(gridGeometry, 100, 1500);
    
    console.log(`Full Results Nodes: ${fullResults.nodes.length}`);
    console.log(`First 3 nodes from full results:`);
    
    for (let i = 0; i < Math.min(3, fullResults.nodes.length); i++) {
      const node = fullResults.nodes[i];
      console.log(`Node ${i}:`);
      console.log(`  ID: ${node.id}`);
      console.log(`  X: ${node.x}`);
      console.log(`  Y: ${node.y}`);
      console.log(`  Z: ${node.z}`);
      console.log(`  Voltage: ${node.voltage ? node.voltage.toFixed(0) : 'undefined'}`);
    }
    
    // Recommendations
    console.log('\n=== RECOMMENDATIONS ===');
    
    const recommendations = [];
    
    if (xUndefined > 0) {
      recommendations.push('Fix X coordinate assignment in buildGridNodes');
    }
    
    if (yUndefined > 0) {
      recommendations.push('Fix Y coordinate assignment in buildGridNodes');
    }
    
    if (zUndefined > 0) {
      recommendations.push('Fix Z coordinate assignment in buildGridNodes');
    }
    
    if (xUndefined === 0 && yUndefined === 0) {
      recommendations.push('Coordinates are properly assigned - check distance calculation');
    }
    
    console.log('\nRecommendations:');
    recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
    
  } catch (error) {
    console.error('Grid node debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
})().catch(error => {
  console.error('Import error:', error.message);
});
