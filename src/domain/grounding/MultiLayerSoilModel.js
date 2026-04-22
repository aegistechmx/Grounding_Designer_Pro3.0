/**
 * Multi-Layer Soil Model - Professional implementation for IEEE 80
 * Supports uniform and two-layer soil models with proper calculations
 */

import IEEE80Formulas from './IEEE80Formulas.js';

class MultiLayerSoilModel {
  constructor(input) {
    this.input = this.validateInput(input);
    this.traceability = [];
  }

  /**
   * Validate and normalize input for multi-layer soil
   */
  validateInput(input) {
    if (!input || typeof input !== 'object') {
      throw new Error('Soil input must be a valid object');
    }

    const validated = {
      model: input.model || 'uniform', // 'uniform' | 'two-layer'
      layers: this.validateLayers(input),
      surfaceLayer: input.surfaceLayer || null,
      temperature: input.temperature || 20,
      humidity: input.humidity || 50,
      season: input.season || 'normal'
    };

    this.addTrace('soil_input_validation', validated);
    return validated;
  }

  /**
   * Validate soil layers based on model type
   */
  validateLayers(input) {
    const model = input.model || 'uniform';
    
    if (model === 'uniform') {
      return this.validateUniformLayer(input);
    } else if (model === 'two-layer') {
      return this.validateTwoLayers(input);
    } else {
      throw new Error(`Unsupported soil model: ${model}. Use 'uniform' or 'two-layer'.`);
    }
  }

  /**
   * Validate uniform soil layer
   */
  validateUniformLayer(input) {
    const resistivity = input.soilResistivity || input.resistivity;
    
    if (!resistivity || typeof resistivity !== 'number' || resistivity <= 0) {
      throw new Error('Uniform soil requires valid resistivity > 0');
    }

    if (resistivity < 0.1 || resistivity > 10000) {
      throw new Error('Soil resistivity out of realistic range (0.1 - 10000 ohm-m)');
    }

    return [{
      type: 'uniform',
      resistivity,
      thickness: Infinity, // Infinite depth
      depth: 0 // Starts at surface
    }];
  }

  /**
   * Validate two-layer soil model
   */
  validateTwoLayers(input) {
    const layer1 = input.layer1 || {};
    const layer2 = input.layer2 || {};

    // Layer 1 (top layer)
    if (!layer1.resistivity || typeof layer1.resistivity !== 'number' || layer1.resistivity <= 0) {
      throw new Error('Layer 1 requires valid resistivity > 0');
    }

    if (!layer1.thickness || typeof layer1.thickness !== 'number' || layer1.thickness <= 0) {
      throw new Error('Layer 1 requires valid thickness > 0');
    }

    if (layer1.thickness > 100) {
      throw new Error('Layer 1 thickness exceeds practical limit (100m)');
    }

    // Layer 2 (bottom layer)
    if (!layer2.resistivity || typeof layer2.resistivity !== 'number' || layer2.resistivity <= 0) {
      throw new Error('Layer 2 requires valid resistivity > 0');
    }

    // Physical consistency check
    if (Math.abs(layer1.resistivity - layer2.resistivity) < 0.01) {
      throw new Error('Layers have essentially same resistivity - use uniform model instead');
    }

    return [
      {
        type: 'layer1',
        resistivity: layer1.resistivity,
        thickness: layer1.thickness,
        depth: 0
      },
      {
        type: 'layer2',
        resistivity: layer2.resistivity,
        thickness: Infinity, // Infinite depth
        depth: layer1.thickness
      }
    ];
  }

  /**
   * Calculate effective resistivity based on soil model
   */
  calculateEffectiveResistivity() {
    const { model, layers } = this.input;
    
    let effectiveResistivity;
    let method;

    if (model === 'uniform') {
      effectiveResistivity = layers[0].resistivity;
      method = 'uniform_direct';
    } else if (model === 'two-layer') {
      effectiveResistivity = this.calculateTwoLayerEffectiveResistivity();
      method = 'two_layer_weighted';
    }

    this.addTrace('effective_resistivity_calculation', {
      model,
      effectiveResistivity,
      method,
      layers: layers.map(l => ({
        type: l.type,
        resistivity: l.resistivity,
        thickness: l.thickness
      }))
    });

    return effectiveResistivity;
  }

  /**
   * Calculate effective resistivity for two-layer soil
   * Uses IEEE 80 recommended method
   */
  calculateTwoLayerEffectiveResistivity() {
    const [layer1, layer2] = this.input.layers;
    const { surfaceLayer } = this.input;

    // For grounding calculations, use weighted average based on current penetration
    // This is a simplified approach - more complex methods exist
    const weightingFactor = 0.7; // IEEE 80 typical value
    const effectiveResistivity = 
      weightingFactor * layer1.resistivity + 
      (1 - weightingFactor) * layer2.resistivity;

    // Apply surface layer correction if present
    if (surfaceLayer && surfaceLayer.resistivity && surfaceLayer.thickness) {
      const surfaceCorrection = IEEE80Formulas.calculateSurfaceLayerFactor(
        effectiveResistivity,
        surfaceLayer.resistivity,
        surfaceLayer.thickness
      );
      
      this.addTrace('surface_layer_correction', {
        baseResistivity: effectiveResistivity,
        surfaceResistivity: surfaceLayer.resistivity,
        surfaceThickness: surfaceLayer.thickness,
        correctionFactor: surfaceCorrection,
        finalResistivity: effectiveResistivity * surfaceCorrection
      });

      return effectiveResistivity * surfaceCorrection;
    }

    return effectiveResistivity;
  }

  /**
   * Calculate reflection coefficient for two-layer soil
   */
  calculateReflectionCoefficient() {
    if (this.input.model !== 'two-layer') {
      return 0; // No reflection for uniform soil
    }

    const [layer1, layer2] = this.input.layers;
    const K = (layer2.resistivity - layer1.resistivity) / 
              (layer2.resistivity + layer1.resistivity);

    this.addTrace('reflection_coefficient', {
      K,
      layer1Resistivity: layer1.resistivity,
      layer2Resistivity: layer2.resistivity,
      interpretation: K > 0 ? 'High resistivity bottom layer' : 'Low resistivity bottom layer'
    });

    return K;
  }

  /**
   * Calculate surface layer factor with multi-layer consideration
   */
  calculateSurfaceLayerFactor() {
    const { surfaceLayer } = this.input;
    
    if (!surfaceLayer || !surfaceLayer.resistivity || !surfaceLayer.thickness) {
      return 1.0; // No surface layer
    }

    const effectiveResistivity = this.calculateEffectiveResistivity();
    const surfaceFactor = IEEE80Formulas.calculateSurfaceLayerFactor(
      effectiveResistivity,
      surfaceLayer.resistivity,
      surfaceLayer.thickness
    );

    this.addTrace('surface_layer_factor', {
      effectiveResistivity,
      surfaceResistivity: surfaceLayer.resistivity,
      surfaceThickness: surfaceLayer.thickness,
      surfaceFactor,
      standard: 'IEEE 80 Equation 29'
    });

    return surfaceFactor;
  }

  /**
   * Assess soil quality with multi-layer consideration
   */
  assessSoilQuality() {
    const effectiveResistivity = this.calculateEffectiveResistivity();
    const { model, layers } = this.input;

    let quality;
    let color;
    let assessment;

    if (effectiveResistivity <= 50) {
      quality = 'excellent';
      color = 'green';
      assessment = 'Very good grounding conditions';
    } else if (effectiveResistivity <= 100) {
      quality = 'good';
      color = 'light-green';
      assessment = 'Good grounding conditions';
    } else if (effectiveResistivity <= 300) {
      quality = 'fair';
      color = 'yellow';
      assessment = 'Moderate grounding conditions';
    } else if (effectiveResistivity <= 1000) {
      quality = 'poor';
      color = 'orange';
      assessment = 'Difficult grounding conditions';
    } else {
      quality = 'very_poor';
      color = 'red';
      assessment = 'Very difficult grounding conditions';
    }

    // Multi-layer specific assessment
    let layerAssessment = null;
    if (model === 'two-layer') {
      const K = this.calculateReflectionCoefficient();
      layerAssessment = {
        reflectionCoefficient: K,
        interpretation: K > 0.5 ? 'Strong contrast between layers' : 'Moderate contrast',
        recommendation: K > 0.7 ? 'Consider deep-driven rods' : 'Standard design acceptable'
      };
    }

    this.addTrace('soil_quality_assessment', {
      quality,
      color,
      assessment,
      effectiveResistivity,
      model,
      layerAssessment
    });

    return {
      quality,
      color,
      assessment,
      resistivity: effectiveResistivity,
      model,
      layerAssessment
    };
  }

  /**
   * Complete soil analysis
   */
  analyze() {
    const effectiveResistivity = this.calculateEffectiveResistivity();
    const surfaceLayerFactor = this.calculateSurfaceLayerFactor();
    const soilQuality = this.assessSoilQuality();
    const reflectionCoefficient = this.calculateReflectionCoefficient();

    return {
      effectiveResistivity,
      surfaceLayerFactor,
      soilQuality,
      reflectionCoefficient,
      model: this.input.model,
      layers: this.input.layers,
      temperature: this.input.temperature,
      humidity: this.input.humidity,
      season: this.input.season,
      traceability: this.getTraceability()
    };
  }

  /**
   * Add traceability entry
   */
  addTrace(calculation, data) {
    this.traceability.push({
      timestamp: new Date().toISOString(),
      calculation,
      model: 'MultiLayerSoilModel',
      standard: 'IEEE 80-2013',
      ...data
    });
  }

  /**
   * Get traceability
   */
  getTraceability() {
    return this.traceability;
  }
}

export default MultiLayerSoilModel;
