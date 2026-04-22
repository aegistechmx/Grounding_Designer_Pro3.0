/**
 * Integration Example - Professional calculation engine usage
 * Demonstrates how to integrate the grounding calculator into applications
 */

import GroundingCalculator from '../application/GroundingCalculator.js';
import IEEE80Service from '../services/ieee80Service.js';
import { ValidationUtils } from '../utils/validation.js';
import UnitsUtils from '../utils/units.js';

/**
 * Example 1: Basic calculation with standard parameters
 */
function basicCalculationExample() {
  console.log('=== Basic Calculation Example ===');
  
  const input = {
    soil: {
      soilResistivity: 100, // ohm-m
      surfaceLayerResistivity: 3000, // ohm-m
      surfaceLayerThickness: 0.1, // meters
      temperature: 20, // Celsius
      humidity: 50, // percentage
      season: 'normal'
    },
    grid: {
      gridLength: 30, // meters
      gridWidth: 16, // meters
      numParallel: 15,
      numParallelY: 12,
      numRods: 45,
      rodLength: 3, // meters
      gridDepth: 0.6, // meters
      conductorSize: '4/0',
      conductorMaterial: 'copper'
    },
    fault: {
      faultCurrent: 10000, // amperes
      faultDuration: 0.5, // seconds
      systemVoltage: 13800, // volts
      divisionFactor: 0.15,
      bodyResistance: 1000, // ohms
      bodyWeight: 70, // kg
      faultType: 'single_line_to_ground'
    }
  };

  try {
    const calculator = new GroundingCalculator(input);
    const results = calculator.calculate();
    
    console.log('Grid Resistance:', results.grid.resistance.toFixed(2), '×');
    console.log('Touch Voltage:', results.fault.touchVoltage.toFixed(0), 'V');
    console.log('Step Voltage:', results.fault.stepVoltage.toFixed(0), 'V');
    console.log('GPR:', results.fault.gpr.toFixed(0), 'V');
    console.log('Compliance:', results.compliance.overall ? 'PASS' : 'FAIL');
    console.log('Risk Level:', results.riskAssessment.level);
    
    return results;
  } catch (error) {
    console.error('Calculation failed:', error.message);
    throw error;
  }
}

/**
 * Example 2: Quick calculation with minimal parameters
 */
function quickCalculationExample() {
  console.log('\n=== Quick Calculation Example ===');
  
  const params = {
    soilResistivity: 200,
    gridLength: 40,
    gridWidth: 25,
    numParallel: 20,
    numRods: 60,
    faultCurrent: 15000,
    faultDuration: 1.0
  };

  try {
    const results = IEEE80Service.quickCalculate(params);
    
    console.log('Quick Results:');
    console.log('- Grid Resistance:', results.grid.resistance.toFixed(2), '×');
    console.log('- Touch Voltage:', results.fault.touchVoltage.toFixed(0), 'V');
    console.log('- Step Voltage:', results.fault.stepVoltage.toFixed(0), 'V');
    console.log('- Safety Margins - Touch:', results.fault.safetyMargins.touchMargin.toFixed(1), '%');
    console.log('- Safety Margins - Step:', results.fault.safetyMargins.stepMargin.toFixed(1), '%');
    
    return results;
  } catch (error) {
    console.error('Quick calculation failed:', error.message);
    throw error;
  }
}

/**
 * Example 3: Input validation and error handling
 */
function validationExample() {
  console.log('\n=== Validation Example ===');
  
  // Valid input
  const validInput = {
    soil: { soilResistivity: 100 },
    grid: { gridLength: 30, gridWidth: 16, numParallel: 15, numRods: 45 },
    fault: { faultCurrent: 10000, faultDuration: 0.5 }
  };
  
  const validation = ValidationUtils.validateGroundingInput(validInput);
  console.log('Valid input validation:', validation.valid ? 'PASS' : 'FAIL');
  
  // Invalid input
  const invalidInput = {
    soil: { soilResistivity: -100 }, // Invalid negative value
    grid: { gridLength: 30, gridWidth: 16, numParallel: 15, numRods: 45 },
    fault: { faultCurrent: 10000, faultDuration: 0.5 }
  };
  
  const invalidValidation = ValidationUtils.validateGroundingInput(invalidInput);
  console.log('Invalid input validation:', invalidValidation.valid ? 'PASS' : 'FAIL');
  console.log('Errors:', invalidValidation.errors);
  
  return { valid: validation, invalid: invalidValidation };
}

/**
 * Example 4: Units conversion
 */
function unitsConversionExample() {
  console.log('\n=== Units Conversion Example ===');
  
  const inputWithMixedUnits = {
    soil: {
      soilResistivity: 100,
      soilResistivityUnit: 'ohm-centimeter', // Will be converted to ohm-m
      surfaceLayerThickness: 4,
      surfaceLayerThicknessUnit: 'inches', // Will be converted to meters
      temperature: 68,
      temperatureUnit: 'fahrenheit' // Will be converted to Celsius
    },
    grid: {
      gridLength: 100,
      gridLengthUnit: 'feet', // Will be converted to meters
      gridWidth: 50,
      gridWidthUnit: 'feet', // Will be converted to meters
      numParallel: 15,
      numRods: 45,
      rodLength: 10,
      rodLengthUnit: 'feet' // Will be converted to meters
    },
    fault: {
      faultCurrent: 15,
      faultCurrentUnit: 'kiloampere', // Will be converted to amperes
      systemVoltage: 13.8,
      systemVoltageUnit: 'kilovolt', // Will be converted to volts
      faultDuration: 0.5
    }
  };

  try {
    // Normalize units
    const normalizedInput = UnitsUtils.normalizeGroundingInput(inputWithMixedUnits);
    
    console.log('Original input (mixed units):');
    console.log('- Soil resistivity: 100 ohm-cm');
    console.log('- Grid dimensions: 100 ft × 50 ft');
    console.log('- Fault current: 15 kA');
    
    console.log('\nNormalized input (SI units):');
    console.log('- Soil resistivity:', normalizedInput.soil.soilResistivity, 'ohm-m');
    console.log('- Grid dimensions:', normalizedInput.grid.gridLength.toFixed(2), 'm ×', normalizedInput.grid.gridWidth.toFixed(2), 'm');
    console.log('- Fault current:', normalizedInput.fault.faultCurrent, 'A');
    
    // Calculate with normalized input
    const calculator = new GroundingCalculator(normalizedInput);
    const results = calculator.calculate();
    
    console.log('\nResults with formatted units:');
    console.log('- Grid Resistance:', UnitsUtils.formatWithUnits(results.grid.resistance, '×'));
    console.log('- Touch Voltage:', UnitsUtils.formatVoltage(results.fault.touchVoltage));
    console.log('- Step Voltage:', UnitsUtils.formatVoltage(results.fault.stepVoltage));
    console.log('- Grid Area:', UnitsUtils.formatWithUnits(results.grid.area, 'm²'));
    
    return results;
  } catch (error) {
    console.error('Units conversion example failed:', error.message);
    throw error;
  }
}

/**
 * Example 5: Design optimization
 */
function optimizationExample() {
  console.log('\n=== Design Optimization Example ===');
  
  const requirements = {
    area: 480, // m²
    resistivity: 300, // ohm-m
    faultCurrent: 15000, // A
    safetyMargin: 30 // %
  };

  const recommendations = IEEE80Service.getDesignRecommendations(requirements);
  
  console.log('Design Recommendations:');
  console.log('- Grid spacing:', recommendations.grid.spacing.toFixed(1), 'm');
  console.log('- Number of conductors:', recommendations.grid.conductors);
  console.log('- Rod quantity:', recommendations.rods.quantity);
  console.log('- Rod length:', recommendations.rods.length.toFixed(1), 'm');
  console.log('- Conductor size:', recommendations.conductors.size);
  console.log('- Conductor material:', recommendations.conductors.material);
  
  if (recommendations.surface.thickness) {
    console.log('- Surface layer thickness:', recommendations.surface.thickness, 'm');
    console.log('- Surface layer material:', recommendations.surface.material);
  }
  
  return recommendations;
}

/**
 * Example 6: Batch analysis
 */
function batchAnalysisExample() {
  console.log('\n=== Batch Analysis Example ===');
  
  const scenarios = [
    {
      name: 'Small Commercial',
      input: {
        soil: { soilResistivity: 50 },
        grid: { gridLength: 20, gridWidth: 15, numParallel: 10, numRods: 20 },
        fault: { faultCurrent: 5000, faultDuration: 0.5 }
      }
    },
    {
      name: 'Medium Industrial',
      input: {
        soil: { soilResistivity: 150 },
        grid: { gridLength: 40, gridWidth: 30, numParallel: 20, numRods: 40 },
        fault: { faultCurrent: 15000, faultDuration: 1.0 }
      }
    },
    {
      name: 'Large Utility',
      input: {
        soil: { soilResistivity: 300 },
        grid: { gridLength: 80, gridWidth: 60, numParallel: 30, numRods: 80 },
        fault: { faultCurrent: 30000, faultDuration: 1.0 }
      }
    }
  ];

  const results = [];
  
  for (const scenario of scenarios) {
    try {
      const calculator = new GroundingCalculator(scenario.input);
      const result = calculator.calculate();
      
      results.push({
        name: scenario.name,
        gridResistance: result.grid.resistance,
        touchVoltage: result.fault.touchVoltage,
        stepVoltage: result.fault.stepVoltage,
        compliance: result.compliance.overall,
        riskLevel: result.riskAssessment.level,
        riskScore: result.riskAssessment.score
      });
      
      console.log(`${scenario.name}:`);
      console.log('- Rg:', result.grid.resistance.toFixed(2), '×');
      console.log('- Em:', result.fault.touchVoltage.toFixed(0), 'V');
      console.log('- Es:', result.fault.stepVoltage.toFixed(0), 'V');
      console.log('- Compliance:', result.compliance.overall ? 'PASS' : 'FAIL');
      console.log('- Risk:', result.riskAssessment.level);
      console.log();
      
    } catch (error) {
      console.error(`Failed to analyze ${scenario.name}:`, error.message);
    }
  }
  
  return results;
}

/**
 * Example 7: Export and reporting
 */
function exportExample() {
  console.log('\n=== Export and Reporting Example ===');
  
  const input = {
    soil: { soilResistivity: 100 },
    grid: { gridLength: 30, gridWidth: 16, numParallel: 15, numRods: 45 },
    fault: { faultCurrent: 10000, faultDuration: 0.5 }
  };

  try {
    const calculator = new GroundingCalculator(input);
    const results = calculator.calculate();
    
    // Export JSON
    const jsonExport = calculator.export('json');
    console.log('JSON Export (first 200 chars):');
    console.log(jsonExport.substring(0, 200) + '...');
    
    // Export summary
    const summaryExport = calculator.export('summary');
    console.log('\nSummary Export:');
    console.log(summaryExport);
    
    // Export IEEE 80 format
    const ieee80Export = IEEE80Service.exportIEEE80Format(results);
    console.log('\nIEEE 80 Export (project info):');
    console.log('- Standard:', ieee80Export.projectInfo.standard);
    console.log('- Date:', ieee80Export.projectInfo.calculationDate);
    console.log('- Version:', ieee80Export.projectInfo.version);
    
    return { json: jsonExport, summary: summaryExport, ieee80: ieee80Export };
    
  } catch (error) {
    console.error('Export example failed:', error.message);
    throw error;
  }
}

/**
 * Example 8: Traceability and debugging
 */
function traceabilityExample() {
  console.log('\n=== Traceability and Debugging Example ===');
  
  const input = {
    soil: { soilResistivity: 100 },
    grid: { gridLength: 30, gridWidth: 16, numParallel: 15, numRods: 45 },
    fault: { faultCurrent: 10000, faultDuration: 0.5 }
  };

  try {
    const calculator = new GroundingCalculator(input);
    const results = calculator.calculate();
    
    console.log('Total traceability entries:', results.traceability.length);
    
    // Show first few trace entries
    console.log('\nFirst 5 trace entries:');
    results.traceability.slice(0, 5).forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.calculation} - ${entry.timestamp}`);
      if (entry.value !== undefined) {
        console.log(`   Value: ${entry.value}`);
      }
      if (entry.formula) {
        console.log(`   Formula: ${entry.formula}`);
      }
    });
    
    // Find specific calculation traces
    const gridResistanceTraces = results.traceability.filter(t => 
      t.calculation === 'grid_resistance'
    );
    
    console.log('\nGrid resistance calculation traces:');
    gridResistanceTraces.forEach(trace => {
      console.log('- Inputs:', trace.inputs);
      console.log('- Result:', trace.value);
      console.log('- Formula:', trace.formula);
    });
    
    return results.traceability;
    
  } catch (error) {
    console.error('Traceability example failed:', error.message);
    throw error;
  }
}

/**
 * Example 9: Performance testing
 */
function performanceTest() {
  console.log('\n=== Performance Test Example ===');
  
  const input = {
    soil: { soilResistivity: 100 },
    grid: { gridLength: 30, gridWidth: 16, numParallel: 15, numRods: 45 },
    fault: { faultCurrent: 10000, faultDuration: 0.5 }
  };

  const iterations = 100;
  const times = [];
  
  console.log(`Running ${iterations} calculations...`);
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    
    try {
      const calculator = new GroundingCalculator(input);
      calculator.calculate();
      
      const endTime = performance.now();
      times.push(endTime - startTime);
      
    } catch (error) {
      console.error(`Calculation ${i + 1} failed:`, error.message);
    }
  }
  
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`Performance Results (${times.length} successful):`);
    console.log('- Average time:', avgTime.toFixed(2), 'ms');
    console.log('- Minimum time:', minTime.toFixed(2), 'ms');
    console.log('- Maximum time:', maxTime.toFixed(2), 'ms');
    console.log('- Total time:', times.reduce((a, b) => a + b, 0).toFixed(2), 'ms');
    
    return { avgTime, minTime, maxTime, totalTime: times.reduce((a, b) => a + b, 0) };
  }
  
  return null;
}

/**
 * Main function to run all examples
 */
function runAllExamples() {
  console.log('Professional Grounding Calculator Integration Examples');
  console.log('=====================================================\n');
  
  try {
    basicCalculationExample();
    quickCalculationExample();
    validationExample();
    unitsConversionExample();
    optimizationExample();
    batchAnalysisExample();
    exportExample();
    traceabilityExample();
    performanceTest();
    
    console.log('\n=== All Examples Completed Successfully ===');
    
  } catch (error) {
    console.error('Example execution failed:', error.message);
    throw error;
  }
}

// Export individual examples for selective testing
export {
  basicCalculationExample,
  quickCalculationExample,
  validationExample,
  unitsConversionExample,
  optimizationExample,
  batchAnalysisExample,
  exportExample,
  traceabilityExample,
  performanceTest,
  runAllExamples
};

// Run all examples if this file is executed directly
if (typeof window === 'undefined' && typeof module !== 'undefined') {
  runAllExamples();
}

export default runAllExamples;
