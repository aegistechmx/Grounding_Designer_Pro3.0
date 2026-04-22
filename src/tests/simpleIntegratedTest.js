/**
 * Simple Integrated Test - Debug Traceability Issue
 * Testing the integrated engine with minimal complexity
 */

console.log('=== SIMPLE INTEGRATED TEST ===');
console.log('Debugging traceability push error');

(async () => {
  try {
    // Test basic import first
    console.log('Testing imports...');
    
    const { default: IEEE80PracticalFactors } = await import('../domain/grounding/IEEE80PracticalFactors.js');
    console.log('IEEE80PracticalFactors imported successfully');
    
    // Test basic calculation
    console.log('\nTesting basic IEEE 80 calculation...');
    const testGrid = {
      length: 30,
      width: 20,
      numParallelX: 7,
      numParallelY: 5,
      burialDepth: 0.5,
      numRods: 4,
      rodLength: 3
    };
    
    const voltages = IEEE80PracticalFactors.calculateEnhancedVoltages(
      100, // soil resistivity
      1000, // grid current
      testGrid,
      0.97 // surface layer factor
    );
    
    console.log('IEEE 80 calculation successful:');
    console.log(`  Step Voltage: ${voltages.stepVoltage.toFixed(0)} V`);
    console.log(`  Touch Voltage: ${voltages.touchVoltage.toFixed(0)} V`);
    console.log(`  Ki: ${voltages.Ki.toFixed(3)}`);
    console.log(`  Ks: ${voltages.Ks.toFixed(3)}`);
    console.log(`  Km: ${voltages.Km.toFixed(3)}`);
    
    // Now test GroundingCalculator import
    console.log('\nTesting GroundingCalculator import...');
    const GroundingCalculator = (await import('../application/GroundingCalculator.js')).default;
    console.log('GroundingCalculator imported successfully');
    
    // Test minimal input
    console.log('\nTesting minimal calculation...');
    const minimalInput = {
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
    
    console.log('Creating calculator instance...');
    const calculator = new GroundingCalculator(minimalInput);
    console.log('Calculator created successfully');
    
    console.log('Running calculation...');
    const results = calculator.calculate();
    console.log('Calculation completed successfully');
    
    console.log('\n=== RESULTS ===');
    console.log(`Grid Resistance: ${results.grid.resistance.toFixed(3)} ×`);
    console.log(`GPR: ${results.fault.gpr.toFixed(0)} V`);
    console.log(`Step Voltage: ${results.fault.stepVoltage.toFixed(0)} V`);
    console.log(`Touch Voltage: ${results.fault.touchVoltage.toFixed(0)} V`);
    
    if (results.fault.factorAnalysis) {
      console.log('\nIEEE 80 Factors Found:');
      console.log(`Ki: ${results.fault.factorAnalysis.Ki.toFixed(3)}`);
      console.log(`Ks: ${results.fault.factorAnalysis.Ks.toFixed(3)}`);
      console.log(`Km: ${results.fault.factorAnalysis.Km.toFixed(3)}`);
      console.log('SUCCESS: IEEE 80 practical factors integrated!');
    } else {
      console.log('IEEE 80 factors not found in results');
    }
    
    console.log('\n=== SIMPLE INTEGRATION TEST PASSED ===');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
})().catch(error => {
  console.error('Import error:', error.message);
});
