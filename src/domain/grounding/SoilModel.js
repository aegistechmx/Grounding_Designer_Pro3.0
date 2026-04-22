/**
 * Soil Model - Professional calculation engine for soil resistivity and corrections
 * Implements IEEE 80 standard soil calculations with full traceability
 */

import IEEE80Formulas from './IEEE80Formulas.js';

class SoilModel {
  constructor(input) {
    this.traceability = []; // Initialize traceability BEFORE validateInput
    this.input = this.validateInput(input);
  }

  /**
   * Validate and normalize input parameters
   */
  validateInput(input) {
    const required = ['soilResistivity'];
    const missing = required.filter(key => input[key] === undefined || input[key] === null);
    
    if (missing.length > 0) {
      throw new Error(`Missing required input: ${missing.join(', ')}`);
    }

    const validated = {
      soilResistivity: this.validatePositiveNumber(input.soilResistivity, 'soilResistivity'),
      surfaceLayerResistivity: input.surfaceLayerResistivity || null,
      surfaceLayerThickness: input.surfaceLayerThickness || 0.1, // meters
      temperature: input.temperature || 20, // Celsius
      humidity: input.humidity || 50, // percentage
      season: input.season || 'normal' // dry, normal, wet
    };

    this.addTrace('input_validation', validated);
    return validated;
  }

  /**
   * Calculate surface layer factor (Cs) using IEEE 80 Equation 29
   */
  calculateSurfaceLayerFactor() {
    const { soilResistivity, surfaceLayerResistivity, surfaceLayerThickness } = this.input;
    
    // Use real IEEE 80 formula
    const result = IEEE80Formulas.calculateSurfaceLayerFactor(
      soilResistivity,
      surfaceLayerResistivity,
      surfaceLayerThickness
    );

    // Add traceability with real IEEE 80 formula documentation
    const formulaDoc = IEEE80Formulas.getFormulaDocumentation().surfaceLayerFactor;

    this.addTrace('surface_layer_factor', {
      value: result,
      formula: formulaDoc.equation,
      reference: formulaDoc.reference,
      inputs: {
        soilResistivity,
        surfaceLayerResistivity,
        surfaceLayerThickness
      },
      intermediateSteps: [
        {
          step: 'Reflection factor K',
          value: surfaceLayerResistivity ? 
            (surfaceLayerResistivity - soilResistivity) / (surfaceLayerResistivity + soilResistivity) : 0,
          unit: 'dimensionless'
        },
        {
          step: 'Surface layer thickness',
          value: surfaceLayerThickness,
          unit: 'm'
        },
        {
          step: 'Final Cs calculation',
          value: result,
          unit: 'dimensionless'
        }
      ],
      notes: 'Cs bounds: 0.5 to 2.0 per IEEE 80'
    });

    return Math.max(0.5, Math.min(2.0, result)); // IEEE 80 bounds
  }

  /**
   * Calculate temperature correction factor
   */
  calculateTemperatureCorrection() {
    const { soilResistivity, temperature } = this.input;
    const baseTemperature = 20; // IEEE 80 reference
    const tempDiff = temperature - baseTemperature;
    const result = soilResistivity * (1 - 0.02 * tempDiff); // Approximate 2% per °C

    this.addTrace('temperature_correction', {
      value: result,
      formula: 'R_temp = R_20 * (1 - 0.02 * (T - 20))',
      inputs: { soilResistivity, temperature, tempDiff }
    });

    return Math.max(0.1, result);
  }

  /**
   * Calculate seasonal correction factor
   */
  calculateSeasonalCorrection() {
    const { season, humidity } = this.input;
    const seasonalFactors = {
      dry: 1.5,
      normal: 1.0,
      wet: 0.8
    };

    const baseFactor = seasonalFactors[season] || 1.0;
    const humidityFactor = 1 - (humidity - 50) * 0.005; // Small humidity adjustment
    const result = baseFactor * humidityFactor;

    this.addTrace('seasonal_correction', {
      value: result,
      formula: 'R_seasonal = R_base * seasonal_factor * humidity_factor',
      inputs: { season, humidity, baseFactor, humidityFactor }
    });

    return Math.max(0.5, Math.min(2.0, result));
  }

  /**
   * Calculate effective soil resistivity with all corrections
   */
  calculateEffectiveResistivity() {
    const baseResistivity = this.calculateTemperatureCorrection();
    const seasonalResistivity = baseResistivity * this.calculateSeasonalCorrection();
    const surfaceLayerFactor = this.calculateSurfaceLayerFactor();

    const result = seasonalResistivity * surfaceLayerFactor;

    this.addTrace('effective_resistivity', {
      value: result,
      formula: 'R_eff = R_temp * seasonal_factor * Cs',
      inputs: {
        baseResistivity,
        seasonalResistivity,
        surfaceLayerFactor
      }
    });

    return result;
  }

  /**
   * Calculate soil quality metrics
   */
  calculateSoilQuality() {
    const effectiveResistivity = this.calculateEffectiveResistivity();
    
    let quality = 'poor';
    let color = 'red';
    
    if (effectiveResistivity < 50) {
      quality = 'excellent';
      color = 'green';
    } else if (effectiveResistivity < 100) {
      quality = 'good';
      color = 'blue';
    } else if (effectiveResistivity < 300) {
      quality = 'fair';
      color = 'yellow';
    } else if (effectiveResistivity < 1000) {
      quality = 'poor';
      color = 'orange';
    } else {
      quality = 'very_poor';
      color = 'red';
    }

    this.addTrace('soil_quality', {
      quality,
      color,
      resistivity: effectiveResistivity
    });

    return { quality, color, resistivity: effectiveResistivity };
  }

  /**
   * Add traceability entry for debugging and auditing
   */
  addTrace(calculation, data) {
    if (!this.traceability) {
      console.error('SoilModel traceability not initialized!');
      this.traceability = [];
    }
    this.traceability.push({
      timestamp: new Date().toISOString(),
      calculation,
      ...data
    });
  }

  /**
   * Get full traceability log
   */
  getTraceability() {
    return this.traceability;
  }

  /**
   * Utility: validate positive number
   */
  validatePositiveNumber(value, name) {
    if (typeof value !== 'number' || value <= 0) {
      throw new Error(`${name} must be a positive number, got: ${value}`);
    }
    return value;
  }

  /**
   * Get complete soil analysis
   */
  analyze() {
    return {
      effectiveResistivity: this.calculateEffectiveResistivity(),
      surfaceLayerFactor: this.calculateSurfaceLayerFactor(),
      temperatureCorrection: this.calculateTemperatureCorrection(),
      seasonalCorrection: this.calculateSeasonalCorrection(),
      soilQuality: this.calculateSoilQuality(),
      traceability: this.getTraceability()
    };
  }
}

export default SoilModel;
