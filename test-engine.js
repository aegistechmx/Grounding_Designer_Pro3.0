/**
 * Test Engine - UnifiedEngine Integration Test
 * Tests the unified pipeline with both analytical and discrete methods
 */

import UnifiedEngine from './src/application/UnifiedEngine.js';

const input = {
  soil: {
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
    numParallel: 10,
    numParallelY: 10,
    meshSpacing: 5,
    gridDepth: 0.5,
    numRods: 4,
    rodLength: 3,
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

console.log('=== Testing UnifiedEngine ===\n');

try {
  const engine = new UnifiedEngine(input);
  console.log('Source of Truth:', UnifiedEngine.getSourceOfTruth());
  
  const result = engine.analyze({
    includeAnalytical: true,
    includeDiscrete: true,
    includeValidation: true,
    includeSpatialData: true
  });

  console.log('\n=== PRIMARY RESULTS (Discrete) ===');
  console.log('Grid Resistance:', result.primary.grid.resistance?.toFixed(3), 'Ω');
  console.log('GPR:', result.primary.fault.gpr?.toFixed(1), 'V');
  console.log('Touch Voltage:', result.primary.fault.touchVoltage?.toFixed(1), 'V');
  console.log('Step Voltage:', result.primary.fault.stepVoltage?.toFixed(1), 'V');
  console.log('Node Count:', result.primary.spatialData?.nodes?.length || 0);

  console.log('\n=== SECONDARY RESULTS (Analytical) ===');
  console.log('Grid Resistance:', result.secondary?.grid?.resistance?.toFixed(3), 'Ω');
  console.log('GPR:', result.secondary?.fault?.gpr?.toFixed(1), 'V');
  console.log('Touch Voltage:', result.secondary?.fault?.touchVoltage?.toFixed(1), 'V');
  console.log('Step Voltage:', result.secondary?.fault?.stepVoltage?.toFixed(1), 'V');

  console.log('\n=== VALIDATION ===');
  console.log('Confidence:', result.validation.confidence);
  console.log('Average Error:', result.validation.avgError?.toFixed(1), '%');
  console.log('Physical Consistency:', result.validation.physicalChecks?.touchGreaterThanStep);
  console.log('GPR Consistency:', result.validation.physicalChecks?.gprConsistency);
  console.log('Interpretation:', result.validation.interpretation);

  console.log('\n=== SAFETY MARGINS ===');
  console.log('Touch Safe:', result.primary.fault.safetyMargins?.touchSafe);
  console.log('Step Safe:', result.primary.fault.safetyMargins?.stepSafe);
  console.log('Touch Margin:', result.primary.fault.safetyMargins?.touchMargin?.toFixed(1), '%');
  console.log('Step Margin:', result.primary.fault.safetyMargins?.stepMargin?.toFixed(1), '%');

  console.log('\n=== ENERGY COMPARISON ===');
  const Ig = result.primary.fault.gridCurrent;
  const energyAnalytical = result.secondary.fault.touchVoltage * Ig;
  const energyDiscrete = result.primary.fault.gpr * Ig;
  const energyRatio = energyDiscrete / energyAnalytical;
  
  console.log('Analytical Energy (touchVoltage * Ig):', energyAnalytical.toFixed(0), 'VA');
  console.log('Discrete Energy (gpr * Ig):', energyDiscrete.toFixed(0), 'VA');
  console.log('Energy Ratio (discrete/analytical):', energyRatio.toFixed(2));
  console.log('Energy Consistency:', energyRatio > 0.1 && energyRatio < 10 ? '✓ Same order of magnitude' : '✗ Different orders of magnitude');

  console.log('\n=== TEST COMPLETE ===');
  console.log('Status: SUCCESS ✓');

} catch (error) {
  console.error('\n=== TEST FAILED ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}