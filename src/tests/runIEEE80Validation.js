/**
 * Manual IEEE 80 Validation Runner
 * Runs the physical validation test without Jest
 */

import GroundingCalculator from '../application/GroundingCalculator.js';

// IEEE 80 Test Case
const ieee80TestCase = {
  name: 'IEEE 80 Physical Validation - Medium Substation',
  input: {
    soil: {
      model: 'uniform',
      soilResistivity: 100,          // ohm-m
      surfaceLayerResistivity: 3000, // ohm-m
      surfaceLayerThickness: 0.1,    // m
      temperature: 20,
      humidity: 50,
      season: 'normal'
    },
    grid: {
      gridLength: 50,               // m
      gridWidth: 50,                // m
      numParallel: 11,              // 5m spacing
      numParallelY: 11,            // 5m spacing
      numRods: 4,                   // Corner rods
      rodLength: 3,                // m
      gridDepth: 0.5,              // m
      conductorSize: '4/0',
      conductorMaterial: 'copper'
    },
    fault: {
      faultCurrent: 10000,          // A
      faultDuration: 0.5,          // s
      systemVoltage: 13800,        // V
      divisionFactor: 0.15,
      bodyWeight: 70,
      faultType: 'single_line_to_ground'
    }
  },
  
  expected: {
    gridResistance: { min: 0.04, max: 0.07 },    // ohms
    gpr: { min: 400, max: 700 },                  // V
    stepVoltage: { min: 250, max: 400 },          // V
    touchVoltage: { min: 400, max: 700 }          // V
  }
};

console.log('=== IEEE 80 Physical Validation Test ===');
console.log('Case:', ieee80TestCase.name);
console.log('');

try {
  const calculator = new GroundingCalculator(ieee80TestCase.input);
  const results = calculator.calculate();
  
  console.log('=== RESULTS ===');
  console.log('Grid Resistance:', results.grid.resistance.toFixed(4), '×');
  console.log('GPR:', results.fault.gpr.toFixed(0), 'V');
  console.log('Step Voltage:', results.fault.stepVoltage.toFixed(0), 'V');
  console.log('Touch Voltage:', results.fault.touchVoltage.toFixed(0), 'V');
  console.log('Grid Current:', results.fault.gridCurrent.toFixed(0), 'A');
  console.log('');
  
  console.log('=== EXPECTED RANGES ===');
  console.log('Grid Resistance:', ieee80TestCase.expected.gridResistance.min, '-', ieee80TestCase.expected.gridResistance.max, '×');
  console.log('GPR:', ieee80TestCase.expected.gpr.min, '-', ieee80TestCase.expected.gpr.max, 'V');
  console.log('Step Voltage:', ieee80TestCase.expected.stepVoltage.min, '-', ieee80TestCase.expected.stepVoltage.max, 'V');
  console.log('Touch Voltage:', ieee80TestCase.expected.touchVoltage.min, '-', ieee80TestCase.expected.touchVoltage.max, 'V');
  console.log('');
  
  // Validation checks
  const checks = {
    gridResistance: {
      value: results.grid.resistance,
      min: ieee80TestCase.expected.gridResistance.min,
      max: ieee80TestCase.expected.gridResistance.max,
      pass: results.grid.resistance >= ieee80TestCase.expected.gridResistance.min && 
             results.grid.resistance <= ieee80TestCase.expected.gridResistance.max
    },
    gpr: {
      value: results.fault.gpr,
      min: ieee80TestCase.expected.gpr.min,
      max: ieee80TestCase.expected.gpr.max,
      pass: results.fault.gpr >= ieee80TestCase.expected.gpr.min && 
             results.fault.gpr <= ieee80TestCase.expected.gpr.max
    },
    stepVoltage: {
      value: results.fault.stepVoltage,
      min: ieee80TestCase.expected.stepVoltage.min,
      max: ieee80TestCase.expected.stepVoltage.max,
      pass: results.fault.stepVoltage >= ieee80TestCase.expected.stepVoltage.min && 
             results.fault.stepVoltage <= ieee80TestCase.expected.stepVoltage.max
    },
    touchVoltage: {
      value: results.fault.touchVoltage,
      min: ieee80TestCase.expected.touchVoltage.min,
      max: ieee80TestCase.expected.touchVoltage.max,
      pass: results.fault.touchVoltage >= ieee80TestCase.expected.touchVoltage.min && 
             results.fault.touchVoltage <= ieee80TestCase.expected.touchVoltage.max
    }
  };
  
  console.log('=== VALIDATION RESULTS ===');
  Object.entries(checks).forEach(([param, check]) => {
    const status = check.pass ? 'PASS' : 'FAIL';
    const value = typeof check.value === 'number' ? check.value.toFixed(param.includes('Resistance') ? 4 : 0) : check.value;
    console.log(`${param}: ${value} [${check.min}-${check.max}] - ${status}`);
  });
  console.log('');
  
  // Physical consistency checks
  console.log('=== PHYSICAL CONSISTENCY ===');
  const gprCalculated = results.fault.gridCurrent * results.grid.resistance;
  const gprError = Math.abs(results.fault.gpr - gprCalculated) / gprCalculated * 100;
  const gprConsistent = gprError < 5;
  
  console.log(`GPR Consistency: ${gprError.toFixed(1)}% error - ${gprConsistent ? 'PASS' : 'FAIL'}`);
  console.log(`Touch > Step: ${results.fault.touchVoltage > results.fault.stepVoltage ? 'PASS' : 'FAIL'}`);
  console.log(`All Positive: ${results.grid.resistance > 0 && results.fault.gpr > 0 && results.fault.stepVoltage > 0 && results.fault.touchVoltage > 0 ? 'PASS' : 'FAIL'}`);
  console.log('');
  
  // Overall assessment
  const allPassed = Object.values(checks).every(check => check.pass) && gprConsistent;
  console.log('=== OVERALL ASSESSMENT ===');
  console.log(allPassed ? 'ENGINE VALIDATION: PHYSICALLY CONSISTENT' : 'ENGINE VALIDATION: NEEDS ADJUSTMENT');
  
  if (!allPassed) {
    console.log('');
    console.log('=== DIAGNOSIS ===');
    if (!checks.gridResistance.pass) {
      console.log('DIAGNOSIS: Grid resistance issue - check GridModel calculations');
      console.log(`  Got: ${checks.gridResistance.value.toFixed(4)}, Expected: [${checks.gridResistance.min}-${checks.gridResistance.max}]`);
    }
    if (!checks.gpr.pass) {
      console.log('DIAGNOSIS: GPR issue - check fault current integration');
      console.log(`  Got: ${checks.gpr.value.toFixed(0)}, Expected: [${checks.gpr.min}-${checks.gpr.max}]`);
    }
    if (!checks.stepVoltage.pass || !checks.touchVoltage.pass) {
      console.log('DIAGNOSIS: Voltage issue - check SoilModel and IEEE formulas');
      if (!checks.stepVoltage.pass) {
        console.log(`  Step: Got ${checks.stepVoltage.value.toFixed(0)}, Expected: [${checks.stepVoltage.min}-${checks.stepVoltage.max}]`);
      }
      if (!checks.touchVoltage.pass) {
        console.log(`  Touch: Got ${checks.touchVoltage.value.toFixed(0)}, Expected: [${checks.touchVoltage.min}-${checks.touchVoltage.max}]`);
      }
    }
    if (!gprConsistent) {
      console.log('DIAGNOSIS: GPR calculation inconsistent - check integration');
    }
  }
  
  console.log('');
  console.log('=== TRACEABILITY INFO ===');
  console.log('Total trace entries:', results.traceability?.length || 0);
  if (results.traceability) {
    const criticalTraces = results.traceability.filter(t => 
      t.calculation.includes('grid_resistance') || 
      t.calculation.includes('gpr') || 
      t.calculation.includes('step_voltage') || 
      t.calculation.includes('touch_voltage')
    );
    console.log('Critical calculations:', criticalTraces.length);
  }
  
} catch (error) {
  console.error('CALCULATION FAILED:', error.message);
  console.error('Stack:', error.stack);
}
