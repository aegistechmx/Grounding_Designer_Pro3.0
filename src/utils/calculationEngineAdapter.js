/**
 * Calculation Engine Adapter - Bridge between new professional engine and existing codebase
 * Provides backward compatibility while leveraging the new calculation engine
 */

import GroundingCalculator from '../application/GroundingCalculator.js';
import IEEE80Service from '../services/ieee80Service.js';
import { ValidationUtils } from './validation.js';
import UnitsUtils from './units.js';

class CalculationEngineAdapter {
  /**
   * Convert old parameter format to new engine format
   */
  static convertLegacyParams(params) {
    if (!params) return null;

    // Handle different legacy parameter formats
    const converted = {
      soil: {
        soilResistivity: params.soilResistivity || params.resistivity || 100,
        surfaceLayerResistivity: params.surfaceLayerResistivity || params.surfaceResistivity || null,
        surfaceLayerThickness: params.surfaceLayerThickness || params.surfaceThickness || 0.1,
        temperature: params.temperature || 20,
        humidity: params.humidity || 50,
        season: params.season || 'normal'
      },
      grid: {
        gridLength: params.gridLength || params.length || 30,
        gridWidth: params.gridWidth || params.width || 16,
        numParallel: params.numParallel || params.parallel || 15,
        numParallelY: params.numParallelY || params.parallelY || null,
        numRods: params.numRods || params.rods || 45,
        rodLength: params.rodLength || params.rodLength || 3,
        gridDepth: params.gridDepth || params.depth || 0.6,
        conductorSize: params.conductorSize || '4/0',
        conductorMaterial: params.conductorMaterial || 'copper'
      },
      fault: {
        faultCurrent: params.faultCurrent || params.current || params.Ifault || 10000,
        faultDuration: params.faultDuration || params.duration || 0.5,
        systemVoltage: params.systemVoltage || params.voltage || 13800,
        divisionFactor: params.divisionFactor || params.divisionFactor || 0.15,
        bodyResistance: params.bodyResistance || 1000,
        bodyWeight: params.bodyWeight || 70,
        faultType: params.faultType || 'single_line_to_ground'
      }
    };

    return converted;
  }

  /**
   * Convert new engine results to legacy format
   */
  static convertLegacyResults(results) {
    if (!results) return null;

    // Convert to the format expected by existing components
    const legacy = {
      // Grid calculations
      Rg: results.grid?.resistance || 0,
      totalConductor: results.grid?.totalConductorLength || 0,
      gridArea: results.grid?.area || 0,
      gridPerimeter: results.grid?.perimeter || 0,
      
      // Fault calculations
      GPR: results.fault?.gpr || 0,
      Ig: results.fault?.gridCurrent || 0,
      Em: results.fault?.touchVoltage || 0,
      Es: results.fault?.stepVoltage || 0,
      
      // Safety limits
      Etouch70: results.fault?.permissibleTouch || 0,
      Estep70: results.fault?.permissibleStep || 0,
      
      // Compliance
      touchSafe70: results.fault?.safetyMargins?.touchSafe || false,
      stepSafe70: results.fault?.safetyMargins?.stepSafe || false,
      complies: results.compliance?.overall || false,
      
      // Additional data
      safetyMargin: results.fault?.safetyMargins?.touchMargin || 0,
      stepMargin: results.fault?.safetyMargins?.stepMargin || 0,
      
      // Traceability (for debugging)
      _traceability: results.traceability || [],
      
      // New engine metadata
      _professionalEngine: true,
      _version: '2.0'
    };

    return legacy;
  }

  /**
   * Calculate using professional engine with legacy interface
   */
  static calculate(params) {
    try {
      // Convert legacy parameters
      const engineParams = this.convertLegacyParams(params);
      
      // Validate input
      const validation = ValidationUtils.validateGroundingInput(engineParams);
      if (!validation.valid) {
        console.warn('Input validation warnings:', validation.warnings);
        if (validation.errors.length > 0) {
          throw new Error(`Validation errors: ${validation.errors.join(', ')}`);
        }
      }

      // Use professional engine
      const calculator = new GroundingCalculator(engineParams);
      const results = calculator.calculate();
      
      // Convert to legacy format
      return this.convertLegacyResults(results);
      
    } catch (error) {
      console.error('Calculation engine error:', error);
      throw error;
    }
  }

  /**
   * Quick calculation with minimal parameters
   */
  static quickCalculate(params) {
    try {
      const engineParams = this.convertLegacyParams(params);
      const results = IEEE80Service.quickCalculate(engineParams);
      return this.convertLegacyResults(results);
    } catch (error) {
      console.error('Quick calculation error:', error);
      throw error;
    }
  }

  /**
   * Validate parameters using new engine
   */
  static validate(params) {
    try {
      const engineParams = this.convertLegacyParams(params);
      return ValidationUtils.validateGroundingInput(engineParams);
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
        warnings: []
      };
    }
  }

  /**
   * Get design recommendations
   */
  static getRecommendations(params) {
    try {
      const engineParams = this.convertLegacyParams(params);
      const calculator = new GroundingCalculator(engineParams);
      const results = calculator.calculate();
      
      return {
        recommendations: results.recommendations || [],
        riskAssessment: results.riskAssessment || {},
        compliance: results.compliance || {}
      };
    } catch (error) {
      console.error('Recommendations error:', error);
      return {
        recommendations: [],
        riskAssessment: {},
        compliance: {}
      };
    }
  }

  /**
   * Export results in different formats
   */
  static export(results, format = 'json') {
    try {
      // Convert back to engine format if needed
      const engineResults = this.convertToEngineFormat(results);
      const calculator = new GroundingCalculator({ soil: {}, grid: {}, fault: {} });
      
      // Set results manually for export
      calculator.results = engineResults;
      
      return calculator.export(format);
    } catch (error) {
      console.error('Export error:', error);
      return JSON.stringify(results, null, 2);
    }
  }

  /**
   * Convert legacy results back to engine format for export
   */
  static convertToEngineFormat(legacy) {
    if (!legacy) return null;

    return {
      soil: {
        effectiveResistivity: legacy.soilResistivity || 100,
        surfaceLayerFactor: 1,
        soilQuality: { quality: 'good', color: 'green' }
      },
      grid: {
        area: legacy.gridArea || 0,
        totalConductorLength: legacy.totalConductor || 0,
        perimeter: legacy.gridPerimeter || 0,
        resistance: legacy.Rg || 0
      },
      fault: {
        gridCurrent: legacy.Ig || 0,
        gpr: legacy.GPR || 0,
        touchVoltage: legacy.Em || 0,
        stepVoltage: legacy.Es || 0,
        permissibleTouch: legacy.Etouch70 || 0,
        permissibleStep: legacy.Estep70 || 0,
        safetyMargins: {
          touchSafe: legacy.touchSafe70 || false,
          stepSafe: legacy.stepSafe70 || false,
          touchMargin: legacy.safetyMargin || 0,
          stepMargin: legacy.stepMargin || 0
        }
      },
      compliance: {
        overall: legacy.complies || false,
        touch: legacy.touchSafe70 || false,
        step: legacy.stepSafe70 || false
      },
      traceability: legacy._traceability || []
    };
  }

  /**
   * Get calculation statistics
   */
  static getStatistics(results) {
    if (!results || !results._traceability) {
      return {
        totalCalculations: 0,
        engineVersion: '2.0',
        professionalEngine: false
      };
    }

    return {
      totalCalculations: results._traceability.length,
      engineVersion: results._version || '2.0',
      professionalEngine: results._professionalEngine || false,
      modelsUsed: ['soil', 'grid', 'fault'],
      complianceStatus: results.complies || false
    };
  }

  /**
   * Check if results are from professional engine
   */
  static isProfessionalEngine(results) {
    return results && results._professionalEngine === true;
  }

  /**
   * Migrate old calculations to new engine
   */
  static migrateOldCalculation(oldResults, params) {
    if (this.isProfessionalEngine(oldResults)) {
      return oldResults; // Already using new engine
    }

    try {
      // Recalculate using new engine
      return this.calculate(params);
    } catch (error) {
      console.warn('Migration failed, returning old results:', error);
      return oldResults;
    }
  }

  /**
   * Batch calculate multiple scenarios
   */
  static batchCalculate(scenarios) {
    const results = [];
    
    for (const scenario of scenarios) {
      try {
        const result = this.calculate(scenario.params);
        results.push({
          name: scenario.name,
          success: true,
          result,
          params: scenario.params
        });
      } catch (error) {
        results.push({
          name: scenario.name,
          success: false,
          error: error.message,
          params: scenario.params
        });
      }
    }
    
    return results;
  }

  /**
   * Compare old vs new engine results
   */
  static compareEngines(params) {
    try {
      // Calculate with new engine
      const newResults = this.calculate(params);
      
      // Calculate with old method (if available)
      let oldResults = null;
      try {
        // Try to use old calculation method
        oldResults = this.fallbackOldCalculation(params);
      } catch (error) {
        console.warn('Old engine not available:', error);
      }
      
      const comparison = {
        newEngine: newResults,
        oldEngine: oldResults,
        differences: {}
      };
      
      if (oldResults) {
        comparison.differences = {
          Rg: Math.abs((newResults.Rg || 0) - (oldResults.Rg || 0)),
          Em: Math.abs((newResults.Em || 0) - (oldResults.Em || 0)),
          Es: Math.abs((newResults.Es || 0) - (oldResults.Es || 0)),
          GPR: Math.abs((newResults.GPR || 0) - (oldResults.GPR || 0))
        };
      }
      
      return comparison;
    } catch (error) {
      console.error('Engine comparison failed:', error);
      return null;
    }
  }

  /**
   * Fallback old calculation method (simplified)
   */
  static fallbackOldCalculation(params) {
    // This would be the old calculation method
    // For now, return null to indicate it's not available
    return null;
  }
}

export default CalculationEngineAdapter;
