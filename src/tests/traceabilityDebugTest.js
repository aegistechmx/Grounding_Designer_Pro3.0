/**
 * Traceability Debug Test
 * Isolate and fix the traceability push error
 */

console.log('=== TRACEABILITY DEBUG TEST ===');

(async () => {
  try {
    // Test 1: Direct GroundingCalculator instantiation
    console.log('\n--- Test 1: Direct Instantiation ---');
    
    const { default: GroundingCalculator } = await import('../application/GroundingCalculator.js');
    
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
    
    console.log('Creating GroundingCalculator...');
    const calculator = new GroundingCalculator(testInput);
    
    console.log('Calculator created successfully');
    console.log('Traceability type:', typeof calculator.traceability);
    console.log('Traceability length:', calculator.traceability?.length);
    console.log('Traceability is array:', Array.isArray(calculator.traceability));
    
    // Test 2: Manual traceability test
    console.log('\n--- Test 2: Manual Traceability Test ---');
    
    try {
      calculator.addTrace('test_entry', { test: 'data' });
      console.log('Manual traceability: SUCCESS');
      console.log('New traceability length:', calculator.traceability.length);
    } catch (error) {
      console.error('Manual traceability: FAILED');
      console.error('Error:', error.message);
    }
    
    // Test 3: Simple calculation
    console.log('\n--- Test 3: Simple Calculation ---');
    
    try {
      const results = calculator.calculate({ useDiscreteSolver: false });
      console.log('Simple calculation: SUCCESS');
      console.log('Results keys:', Object.keys(results));
    } catch (error) {
      console.error('Simple calculation: FAILED');
      console.error('Error:', error.message);
      console.error('Stack trace:', error.stack);
      
      // Debug traceability state after error
      console.log('\n--- Traceability State After Error ---');
      console.log('Type:', typeof calculator.traceability);
      console.log('Length:', calculator.traceability?.length);
      console.log('Is array:', Array.isArray(calculator.traceability));
      console.log('Has push method:', typeof calculator.traceability?.push);
    }
    
  } catch (error) {
    console.error('Test setup failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
})().catch(error => {
  console.error('Import error:', error.message);
});
