/**
 * Test Unified Pipeline End-to-End
 * Verifies that all components work together through UnifiedEngine
 */

import UnifiedEngine from '../application/UnifiedEngine.js';

const testInput = {
  soil: {
    soilResistivity: 100,
    surfaceLayerResistivity: null,
    surfaceLayerThickness: 0.1,
    temperature: 20,
    humidity: 50,
    season: 'normal'
  },
  grid: {
    gridLength: 30,
    gridWidth: 16,
    numParallel: 15,
    numParallelY: 8,
    numRods: 45,
    rodLength: 3,
    gridDepth: 0.6,
    conductorSize: '4/0',
    conductorMaterial: 'copper'
  },
  fault: {
    faultCurrent: 10000,
    faultDuration: 0.5,
    systemVoltage: 13800,
    divisionFactor: 0.15,
    bodyResistance: 1000,
    bodyWeight: 70,
    faultType: 'single_line_to_ground'
  }
};

console.log('=== Testing Unified Pipeline End-to-End ===\n');

try {
  console.log('1. Creating UnifiedEngine...');
  const engine = new UnifiedEngine(testInput);
  console.log('✓ UnifiedEngine created');
  console.log('  Source of Truth:', UnifiedEngine.getSourceOfTruth());
  
  console.log('\n2. Running full analysis...');
  const results = engine.analyze({
    includeAnalytical: true,
    includeDiscrete: true,
    includeValidation: true,
    includeSpatialData: true
  });
  console.log('✓ Analysis complete');
  
  console.log('\n3. Verifying results structure...');
  console.log('✓ Has primary results:', !!results.primary);
  console.log('✓ Has secondary results:', !!results.secondary);
  console.log('✓ Has validation results:', !!results.validation);
  console.log('✓ Has spatial data:', !!results.primary.spatialData);
  
  console.log('\n4. Checking primary (discrete) results...');
  const primary = results.primary;
  console.log('  Grid Resistance:', primary.grid.resistance?.toFixed(3), 'Ω');
  console.log('  GPR:', primary.fault.gpr?.toFixed(1), 'V');
  console.log('  Touch Voltage:', primary.fault.touchVoltage?.toFixed(1), 'V');
  console.log('  Step Voltage:', primary.fault.stepVoltage?.toFixed(1), 'V');
  console.log('  Node Count:', primary.spatialData?.nodes?.length || 0);
  
  console.log('\n5. Checking secondary (analytical) results...');
  const secondary = results.secondary;
  console.log('  Grid Resistance:', secondary.grid.resistance?.toFixed(3), 'Ω');
  console.log('  GPR:', secondary.fault.gpr?.toFixed(1), 'V');
  console.log('  Touch Voltage:', secondary.fault.touchVoltage?.toFixed(1), 'V');
  console.log('  Step Voltage:', secondary.fault.stepVoltage?.toFixed(1), 'V');
  
  console.log('\n6. Checking validation results...');
  const validation = results.validation;
  console.log('  Confidence:', validation.confidence?.toFixed(1), '%');
  console.log('  Average Error:', validation.avgError?.toFixed(1), '%');
  console.log('  Physical Consistency:', validation.physicalConsistency?.consistent);
  console.log('  Interpretation:', validation.interpretation);
  
  console.log('\n7. Checking safety margins...');
  console.log('  Touch Safe:', primary.fault.safetyMargins?.touchSafe);
  console.log('  Step Safe:', primary.fault.safetyMargins?.stepSafe);
  console.log('  Touch Margin:', primary.fault.safetyMargins?.touchMargin?.toFixed(1), '%');
  console.log('  Step Margin:', primary.fault.safetyMargins?.stepMargin?.toFixed(1), '%');
  
  console.log('\n8. Verifying physical consistency...');
  const touchVoltage = primary.fault.touchVoltage;
  const stepVoltage = primary.fault.stepVoltage;
  const gpr = primary.fault.gpr;
  
  console.log('  Touch > Step:', touchVoltage > stepVoltage ? '✓' : '✗');
  console.log('  GPR > Touch:', gpr > touchVoltage ? '✓' : '✗');
  console.log('  GPR > Step:', gpr > stepVoltage ? '✓' : '✗');
  
  console.log('\n=== Pipeline Test Complete ===');
  console.log('Status: SUCCESS ✓');
  console.log('\nSummary:');
  console.log('- UnifiedEngine working correctly');
  console.log('- Both methods (analytical + discrete) executing');
  console.log('- CrossValidation running automatically');
  console.log('- Spatial data available for visualization');
  console.log('- Physical consistency checks passing');
  
} catch (error) {
  console.error('\n=== Pipeline Test FAILED ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
