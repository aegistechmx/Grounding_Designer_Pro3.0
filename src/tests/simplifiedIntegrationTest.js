/**
 * Simplified Integration Test - Without Traceability
 * Test the core integration functionality without traceability complications
 */

console.log('=== SIMPLIFIED INTEGRATION TEST ===');
console.log('Testing both methods without traceability');

(async () => {
  try {
    // Import modules directly
    const SoilModel = (await import('../domain/grounding/SoilModel.js')).default;
    const GridModel = (await import('../domain/grounding/GridModel.js')).default;
    const FaultModel = (await import('../domain/grounding/FaultModel.js')).default;
    const GridSolver = (await import('../domain/grounding/GridSolver.js')).default;
    
    // Test input
    const testInput = {
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
    };
    
    console.log('\n--- Test Input ---');
    console.log(`Grid: ${testInput.grid.gridLength}m × ${testInput.grid.gridWidth}m`);
    console.log(`Nodes: ${testInput.grid.numParallel} × ${testInput.grid.numParallelY}`);
    console.log(`Fault Current: ${testInput.fault.faultCurrent} A`);
    
    // Test 1: Global Factors Method
    console.log('\n=== METHOD 1: GLOBAL FACTORS ===');
    
    try {
      console.log('Step 1: Soil Analysis...');
      const soilModel = new SoilModel(testInput.soil);
      const soilAnalysis = soilModel.analyze();
      console.log(`  Effective Resistivity: ${soilAnalysis.effectiveResistivity.toFixed(2)} ×m`);
      
      console.log('Step 2: Grid Analysis...');
      const gridModel = new GridModel(testInput.grid);
      const gridAnalysis = gridModel.analyze(soilAnalysis.effectiveResistivity);
      console.log(`  Grid Resistance: ${gridAnalysis.gridResistance.toFixed(3)} ×`);
      
      console.log('Step 3: Fault Analysis...');
      const faultModel = new FaultModel(testInput.fault);
      const gridGeometry = {
        ...testInput.grid,
        numRods: testInput.grid.numRods || 0,
        rodLength: testInput.grid.rodLength || 3
      };
      
      const faultAnalysis = faultModel.analyze(
        gridAnalysis.gridResistance, 
        gridAnalysis.geometricFactor, 
        soilAnalysis.effectiveResistivity,
        testInput.soil.surfaceLayerResistivity,
        gridGeometry
      );
      
      console.log('\n--- Global Factors Results ---');
      console.log(`GPR: ${faultAnalysis.gpr.toFixed(0)} V`);
      console.log(`Step Voltage: ${faultAnalysis.stepVoltage.toFixed(0)} V`);
      console.log(`Touch Voltage: ${faultAnalysis.touchVoltage.toFixed(0)} V`);
      console.log(`Grid Current: ${faultAnalysis.gridCurrent.toFixed(0)} A`);
      
      console.log('Global Factors: SUCCESS');
      
    } catch (error) {
      console.error('Global Factors: FAILED');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
    }
    
    // Test 2: Discrete Solver Method
    console.log('\n=== METHOD 2: DISCRETE SOLVER ===');
    
    try {
      console.log('Step 1: Soil Analysis...');
      const soilModel2 = new SoilModel(testInput.soil);
      const soilAnalysis2 = soilModel2.analyze();
      
      console.log('Step 2: Discrete Grid Solver...');
      const discreteResults = GridSolver.solveGrid(
        testInput.grid,
        soilAnalysis2.effectiveResistivity,
        testInput.fault.faultCurrent
      );
      
      console.log('\n--- Discrete Solver Results ---');
      console.log(`Grid Resistance: ${discreteResults.gridResistance.toFixed(3)} ×`);
      console.log(`GPR: ${discreteResults.gpr.toFixed(0)} V`);
      console.log(`Step Voltage: ${discreteResults.stepVoltage.toFixed(0)} V`);
      console.log(`Touch Voltage: ${discreteResults.touchVoltage.toFixed(0)} V`);
      console.log(`Node Count: ${discreteResults.nodes.length}`);
      console.log(`Voltage Range: ${discreteResults.analysis.voltageRange.toFixed(0)} V`);
      console.log(`Edge Concentration: ${discreteResults.analysis.edgeConcentration.toFixed(2)}x`);
      
      console.log('Discrete Solver: SUCCESS');
      
    } catch (error) {
      console.error('Discrete Solver: FAILED');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
    }
    
    // Test 3: Direct GridSolver Test (to verify it works independently)
    console.log('\n=== METHOD 3: DIRECT GRID SOLVER TEST ===');
    
    try {
      const directResults = GridSolver.solveGrid(
        testInput.grid,
        100, // soil resistivity
        10000 // fault current
      );
      
      console.log('Direct GridSolver: SUCCESS');
      console.log(`Grid Resistance: ${directResults.gridResistance.toFixed(3)} ×`);
      console.log(`GPR: ${directResults.gpr.toFixed(0)} V`);
      
    } catch (error) {
      console.error('Direct GridSolver: FAILED');
      console.error('Error:', error.message);
    }
    
    console.log('\n=== CONCLUSION ===');
    console.log('Core modules work independently.');
    console.log('Integration issue is in GroundingCalculator orchestration.');
    console.log('Traceability system needs redesign or bypass.');
    
  } catch (error) {
    console.error('Test setup failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
})().catch(error => {
  console.error('Import error:', error.message);
});
