/**
 * Model Calibration Analysis
 * Calibrates analytical method to match discrete solver (spatial reference)
 * Targets: Rg < 50%, Step < 40%, Touch < 40%
 */

console.log('=== MODEL CALIBRATION ANALYSIS ===');
console.log('Calibrating analytical method to discrete solver (spatial reference)');

(async () => {
  try {
    // Import modules
    const PhysicalAlignment = (await import('../domain/grounding/PhysicalAlignment.js')).default;
    const SoilModel = (await import('../domain/grounding/SoilModel.js')).default;
    const GridModel = (await import('../domain/grounding/GridModel.js')).default;
    const FaultModel = (await import('../domain/grounding/FaultModel.js')).default;
    const GridSolver = (await import('../domain/grounding/GridSolver.js')).default;
    
    // Test cases for calibration
    const testCases = [
      {
        name: 'Small Industrial',
        soil: { soilResistivity: 100, surfaceLayerResistivity: 2000, surfaceLayerThickness: 0.1 },
        grid: { gridLength: 30, gridWidth: 20, numParallel: 7, numParallelY: 5, burialDepth: 0.5, numRods: 4, rodLength: 3 },
        fault: { current: 10000, faultCurrent: 10000, faultDuration: 1.0, bodyWeight: 70, decrementFactor: 0.15, divisionFactor: 1.0 }
      },
      {
        name: 'Medium Industrial',
        soil: { soilResistivity: 200, surfaceLayerResistivity: 3000, surfaceLayerThickness: 0.1 },
        grid: { gridLength: 50, gridWidth: 40, numParallel: 9, numParallelY: 7, burialDepth: 0.5, numRods: 8, rodLength: 4 },
        fault: { current: 15000, faultCurrent: 15000, faultDuration: 1.0, bodyWeight: 70, decrementFactor: 0.15, divisionFactor: 1.0 }
      },
      {
        name: 'High Resistivity',
        soil: { soilResistivity: 1000, surfaceLayerResistivity: 5000, surfaceLayerThickness: 0.2 },
        grid: { gridLength: 40, gridWidth: 30, numParallel: 8, numParallelY: 6, burialDepth: 0.5, numRods: 6, rodLength: 6 },
        fault: { current: 8000, faultCurrent: 8000, faultDuration: 0.5, bodyWeight: 70, decrementFactor: 0.15, divisionFactor: 1.0 }
      }
    ];
    
    console.log('\n--- SPATIAL REFERENCE CALIBRATION ---');
    
    const calibrationResults = [];
    
    for (const testCase of testCases) {
      console.log(`\n=== ${testCase.name} ===`);
      
      // Calculate unified parameters
      const unifiedGridCurrent = PhysicalAlignment.computeGridCurrent(testCase.fault);
      
      // Method 1: Analytical (Current)
      const soilModel = new SoilModel(testCase.soil);
      const soilAnalysis = soilModel.analyze();
      
      const gridModel = new GridModel(testCase.grid);
      const gridAnalysis = gridModel.analyze(soilAnalysis.effectiveResistivity);
      
      const Rg_analytical = gridAnalysis.gridResistance;
      const GPR_analytical = unifiedGridCurrent * Rg_analytical;
      
      // Method 2: Discrete (Reference)
      const discreteResults = GridSolver.solveGrid(
        testCase.grid,
        soilAnalysis.effectiveResistivity,
        unifiedGridCurrent
      );
      
      const Rg_discrete = discreteResults.gridResistance;
      const GPR_discrete = discreteResults.gpr;
      
      // Calculate step and touch voltages using unified definitions
      const stepVoltage_analytical = PhysicalAlignment.computeStepVoltage(
        [{x: 0, y: 0}], // Representative node
        [GPR_analytical], // GPR as voltage
        'analytical', // Use analytical method
        testCase.grid, // Grid geometry
        unifiedGridCurrent // Fault current
      );
      
      const touchVoltage_analytical = PhysicalAlignment.computeTouchVoltage(
        [{x: 0, y: 0}], // Representative node
        [GPR_analytical], // Node voltage
        testCase.grid // Grid geometry for surface potential
      );
      
      const stepVoltage_discrete = discreteResults.stepVoltage;
      const touchVoltage_discrete = discreteResults.touchVoltage;
      
      // Current alignment analysis
      console.log(`Current Alignment Analysis:`);
      console.log(`  Grid Resistance - Analytical: ${Rg_analytical.toFixed(3)} ×, Discrete: ${Rg_discrete.toFixed(3)} ×`);
      console.log(`  Step Voltage - Analytical: ${stepVoltage_analytical.toFixed(0)} V, Discrete: ${stepVoltage_discrete.toFixed(0)} V`);
      console.log(`  Touch Voltage - Analytical: ${touchVoltage_analytical.toFixed(0)} V, Discrete: ${touchVoltage_discrete.toFixed(0)} V`);
      
      // Calculate calibration factors
      const Rg_calibrationFactor = Rg_discrete / Rg_analytical;
      const step_calibrationFactor = stepVoltage_discrete / stepVoltage_analytical;
      const touch_calibrationFactor = touchVoltage_discrete / touchVoltage_analytical;
      
      console.log(`\nCalibration Factors (Discrete/Analytical):`);
      console.log(`  Grid Resistance: ${Rg_calibrationFactor.toFixed(3)}x`);
      console.log(`  Step Voltage: ${step_calibrationFactor.toFixed(3)}x`);
      console.log(`  Touch Voltage: ${touch_calibrationFactor.toFixed(3)}x`);
      
      // Analyze divergence sources
      console.log(`\nDivergence Source Analysis:`);
      
      // 1. Spatial current distribution effects
      const voltageRange_discrete = discreteResults.analysis.voltageRange;
      const voltageRange_analytical = GPR_analytical * 0.1; // Approximate 10% range
      const spatialEffect = voltageRange_discrete / voltageRange_analytical;
      
      console.log(`  Spatial Current Distribution:`);
      console.log(`    Discrete Voltage Range: ${voltageRange_discrete.toFixed(0)} V`);
      console.log(`    Analytical Voltage Range: ${voltageRange_analytical.toFixed(0)} V`);
      console.log(`    Spatial Effect Factor: ${spatialEffect.toFixed(2)}x`);
      
      // 2. Boundary condition differences
      const edgeConcentration = discreteResults.analysis.edgeConcentration;
      console.log(`  Boundary Conditions:`);
      console.log(`    Edge Concentration (Discrete): ${edgeConcentration.toFixed(2)}x`);
      console.log(`    Analytical: Uniform distribution assumed`);
      
      // 3. IEEE 80 simplification effects
      const rodEffectiveness = discreteResults.analysis.rodEffectiveness;
      console.log(`  IEEE 80 Simplifications:`);
      console.log(`    Rod Effectiveness (Discrete): ${rodEffectiveness.toFixed(2)}x`);
      console.log(`    Analytical: Empirical factors applied`);
      
      // Store results for calibration
      calibrationResults.push({
        name: testCase.name,
        Rg_calibrationFactor,
        step_calibrationFactor,
        touch_calibrationFactor,
        spatialEffect,
        edgeConcentration,
        rodEffectiveness
      });
    }
    
    // Analyze calibration patterns
    console.log('\n=== CALIBRATION PATTERN ANALYSIS ===');
    
    const avgRgFactor = calibrationResults.reduce((sum, r) => sum + r.Rg_calibrationFactor, 0) / calibrationResults.length;
    const avgStepFactor = calibrationResults.reduce((sum, r) => sum + r.step_calibrationFactor, 0) / calibrationResults.length;
    const avgTouchFactor = calibrationResults.reduce((sum, r) => sum + r.touch_calibrationFactor, 0) / calibrationResults.length;
    const avgSpatialEffect = calibrationResults.reduce((sum, r) => sum + r.spatialEffect, 0) / calibrationResults.length;
    
    console.log(`Average Calibration Factors:`);
    console.log(`  Grid Resistance: ${avgRgFactor.toFixed(3)}x`);
    console.log(`  Step Voltage: ${avgStepFactor.toFixed(3)}x`);
    console.log(`  Touch Voltage: ${avgTouchFactor.toFixed(3)}x`);
    console.log(`  Spatial Effect: ${avgSpatialEffect.toFixed(2)}x`);
    
    // Identify systematic patterns
    console.log(`\nSystematic Pattern Analysis:`);
    
    // Check if calibration factors are consistent across cases
    const RgVariance = calibrationResults.reduce((sum, r) => sum + Math.pow(r.Rg_calibrationFactor - avgRgFactor, 2), 0) / calibrationResults.length;
    const stepVariance = calibrationResults.reduce((sum, r) => sum + Math.pow(r.step_calibrationFactor - avgStepFactor, 2), 0) / calibrationResults.length;
    const touchVariance = calibrationResults.reduce((sum, r) => sum + Math.pow(r.touch_calibrationFactor - avgTouchFactor, 2), 0) / calibrationResults.length;
    
    console.log(`Calibration Consistency (lower variance = more consistent):`);
    console.log(`  Grid Resistance Variance: ${RgVariance.toFixed(4)}`);
    console.log(`  Step Voltage Variance: ${stepVariance.toFixed(4)}`);
    console.log(`  Touch Voltage Variance: ${touchVariance.toFixed(4)}`);
    
    // Determine calibration strategy
    console.log(`\nCalibration Strategy Recommendations:`);
    
    if (RgVariance < 0.1) {
      console.log(`  Grid Resistance: Apply uniform calibration factor (${avgRgFactor.toFixed(3)}x)`);
    } else {
      console.log(`  Grid Resistance: Use case-specific calibration factors`);
    }
    
    if (stepVariance < 0.5) {
      console.log(`  Step Voltage: Apply spatial correction factor (${avgStepFactor.toFixed(3)}x)`);
    } else {
      console.log(`  Step Voltage: Implement spatial distribution modeling`);
    }
    
    if (touchVariance < 0.5) {
      console.log(`  Touch Voltage: Apply spatial correction factor (${avgTouchFactor.toFixed(3)}x)`);
    } else {
      console.log(`  Touch Voltage: Implement surface potential modeling`);
    }
    
    // Target achievement analysis
    console.log(`\n=== TARGET ACHIEVEMENT ANALYSIS ===`);
    
    calibrationResults.forEach(result => {
      const RgError = Math.abs(result.Rg_calibrationFactor - 1.0) * 100;
      const stepError = Math.abs(result.step_calibrationFactor - 1.0) * 100;
      const touchError = Math.abs(result.touch_calibrationFactor - 1.0) * 100;
      
      console.log(`\n${result.name} - Target Achievement:`);
      console.log(`  Grid Resistance: ${RgError.toFixed(1)}% (Target: < 50%) - ${RgError < 50 ? 'PASS' : 'FAIL'}`);
      console.log(`  Step Voltage: ${stepError.toFixed(1)}% (Target: < 40%) - ${stepError < 40 ? 'PASS' : 'FAIL'}`);
      console.log(`  Touch Voltage: ${touchError.toFixed(1)}% (Target: < 40%) - ${touchError < 40 ? 'PASS' : 'FAIL'}`);
      
      const overallPass = RgError < 50 && stepError < 40 && touchError < 40;
      console.log(`  Overall: ${overallPass ? 'TARGETS ACHIEVED' : 'CALIBRATION NEEDED'}`);
    });
    
    // Document divergence sources
    console.log(`\n=== DIVERGENCE SOURCE DOCUMENTATION ===`);
    
    console.log(`\n1. Spatial Current Distribution Effects:`);
    console.log(`   - Discrete solver captures actual voltage gradients`);
    console.log(`   - Analytical method assumes uniform distribution`);
    console.log(`   - Average spatial effect: ${avgSpatialEffect.toFixed(2)}x`);
    
    console.log(`\n2. Boundary Condition Assumptions:`);
    console.log(`   - Discrete solver: Edge concentration effects`);
    console.log(`   - Analytical method: IEEE 80 empirical factors`);
    console.log(`   - Edge concentration varies: ${calibrationResults.map(r => r.edgeConcentration.toFixed(2)).join(', ')}x`);
    
    console.log(`\n3. IEEE 80 Analytical Simplifications:`);
    console.log(`   - Discrete solver: Physics-based rod modeling`);
    console.log(`   - Analytical method: Empirical geometric factors`);
    console.log(`   - Rod effectiveness varies: ${calibrationResults.map(r => r.rodEffectiveness.toFixed(2)).join(', ')}x`);
    
    console.log(`\n=== CALIBRATION ANALYSIS COMPLETE ===`);
    
  } catch (error) {
    console.error('Model calibration analysis failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
})().catch(error => {
  console.error('Import error:', error.message);
});
