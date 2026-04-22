/**
 * Debug IEEE 80 Validation - Isolate the exact problem
 */

console.log('=== DEBUG IEEE 80 VALIDATION ===');

try {
  console.log('1. Importing modules...');
  import('../application/GroundingCalculator.js').then(({ default: GroundingCalculator }) => {
    console.log('2. Modules imported successfully');
    
    const testInput = {
      soil: {
        model: 'uniform',
        soilResistivity: 100,
        surfaceLayerResistivity: 3000,
        surfaceLayerThickness: 0.1,
        temperature: 20,
        humidity: 50,
        season: 'normal'
      },
      grid: {
        gridLength: 50,
        gridWidth: 50,
        numParallel: 11,
        numParallelY: 11,
        numRods: 4,
        rodLength: 3,
        gridDepth: 0.5,
        conductorSize: '4/0',
        conductorMaterial: 'copper'
      },
      fault: {
        faultCurrent: 10000,
        faultDuration: 0.5,
        systemVoltage: 13800,
        divisionFactor: 0.15,
        bodyWeight: 70,
        faultType: 'single_line_to_ground'
      }
    };
    
    console.log('3. Creating calculator...');
    const calculator = new GroundingCalculator(testInput);
    console.log('4. Calculator created successfully');
    console.log('Input validated:', calculator.input);
    
    console.log('5. Running calculation...');
    const results = calculator.calculate();
    console.log('6. Calculation completed successfully');
    
    console.log('=== RESULTS ===');
    console.log('Grid Resistance:', results.grid?.resistance);
    console.log('GPR:', results.fault?.gpr);
    console.log('Step Voltage:', results.fault?.stepVoltage);
    console.log('Touch Voltage:', results.fault?.touchVoltage);
    
  }).catch(error => {
    console.error('ERROR:', error.message);
    console.error('STACK:', error.stack);
  });
  
} catch (error) {
  console.error('IMPORT ERROR:', error.message);
  console.error('STACK:', error.stack);
}
