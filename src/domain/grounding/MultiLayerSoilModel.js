/**
 * Multi-Layer Soil Model - Professional implementation for IEEE 80
 * Supports uniform and two-layer soil models with proper calculations
 */

import IEEE80Formulas from './IEEE80Formulas.js';

const MAX_TRACEABILITY_ENTRIES = 100;
const DEFAULT_MODEL = 'uniform';
const DEFAULT_TEMPERATURE = 20;
const DEFAULT_HUMIDITY = 50;
const DEFAULT_SEASON = 'normal';
const MIN_RESISTIVITY = 0.1;
const MAX_RESISTIVITY = 10000;
const MAX_LAYER_THICKNESS = 100;
const WEIGHTING_FACTOR = 0.7;
const MIN_RESISTIVITY_DIFFERENCE = 0.01;

class MultiLayerSoilModel {
  constructor(input, options = {}) {
    this.traceability = [];
    this.maxTraceabilityEntries = options.maxTraceabilityEntries ?? MAX_TRACEABILITY_ENTRIES;
    this.input = this.validateInput(input);
  }

  /**
   * Validates and normalizes input for multi-layer soil model
   * @param {Object} input - Soil model input parameters
   * @returns {Object} Validated and normalized input
   */
  validateInput(input) {
    if (!input || typeof input !== 'object') {
      throw new Error('Soil input must be a valid object');
    }

    const validated = {
      model: input.model ?? DEFAULT_MODEL,
      layers: this.validateLayers(input),
      surfaceLayer: input.surfaceLayer ?? null,
      temperature: input.temperature ?? DEFAULT_TEMPERATURE,
      humidity: input.humidity ?? DEFAULT_HUMIDITY,
      season: input.season ?? DEFAULT_SEASON
    };

    this.addTrace('soil_input_validation', validated);
    return validated;
  }

  /**
   * Validates soil layers based on model type
   * @param {Object} input - Input parameters
   * @returns {Array} Validated layer configuration
   */
  validateLayers(input) {
    const model = input.model ?? DEFAULT_MODEL;
    
    if (model === 'uniform') {
      return this.validateUniformLayer(input);
    } else if (model === 'two-layer') {
      return this.validateTwoLayers(input);
    } else {
      throw new Error(`Unsupported soil model: ${model}. Use 'uniform' or 'two-layer'.`);
    }
  }

  /**
   * Validates uniform soil layer configuration
   * @param {Object} input - Input parameters
   * @returns {Array} Single uniform layer configuration
   */
  validateUniformLayer(input) {
    const resistivity = input.soilResistivity ?? input.resistivity;
    
    if (!resistivity || typeof resistivity !== 'number' || resistivity <= 0) {
      throw new Error('Uniform soil requires valid resistivity > 0');
    }

    if (resistivity < MIN_RESISTIVITY || resistivity > MAX_RESISTIVITY) {
      throw new Error(`Soil resistivity out of realistic range (${MIN_RESISTIVITY} - ${MAX_RESISTIVITY} ohm-m)`);
    }

    return [{
      type: 'uniform',
      resistivity,
      thickness: Infinity,
      depth: 0
    }];
  }

  /**
   * Validates two-layer soil model configuration
   * @param {Object} input - Input parameters
   * @returns {Array} Two-layer configuration
   */
  validateTwoLayers(input) {
    const topLayer = input.layer1 ?? {};
    const bottomLayer = input.layer2 ?? {};

    this.validateLayerResistivity(topLayer.resistivity, 'Layer 1');
    this.validateLayerThickness(topLayer.thickness, 'Layer 1');
    this.validateLayerResistivity(bottomLayer.resistivity, 'Layer 2');
    this.validateLayerConsistency(topLayer.resistivity, bottomLayer.resistivity);

    return [
      {
        type: 'layer1',
        resistivity: topLayer.resistivity,
        thickness: topLayer.thickness,
        depth: 0
      },
      {
        type: 'layer2',
        resistivity: bottomLayer.resistivity,
        thickness: Infinity,
        depth: topLayer.thickness
      }
    ];
  }

  /**
   * Validates layer resistivity
   */
  validateLayerResistivity(resistivity, layerName) {
    if (!resistivity || typeof resistivity !== 'number' || resistivity <= 0) {
      throw new Error(`${layerName} requires valid resistivity > 0`);
    }
  }

  /**
   * Validates layer thickness
   */
  validateLayerThickness(thickness, layerName) {
    if (!thickness || typeof thickness !== 'number' || thickness <= 0) {
      throw new Error(`${layerName} requires valid thickness > 0`);
    }
    if (thickness > MAX_LAYER_THICKNESS) {
      throw new Error(`${layerName} thickness exceeds practical limit (${MAX_LAYER_THICKNESS}m)`);
    }
  }

  /**
   * Validates physical consistency between layers
   */
  validateLayerConsistency(resistivity1, resistivity2) {
    if (Math.abs(resistivity1 - resistivity2) < MIN_RESISTIVITY_DIFFERENCE) {
      throw new Error('Layers have essentially same resistivity - use uniform model instead');
    }
  }

  /**
   * Calculates effective resistivity based on soil model
   * @returns {number} Effective resistivity in ohm-m
   */
  calculateEffectiveResistivity() {
    const { model, layers } = this.input;
    
    let effectiveResistivity;
    let calculationMethod;

    if (model === 'uniform') {
      effectiveResistivity = layers[0].resistivity;
      calculationMethod = 'uniform_direct';
    } else if (model === 'two-layer') {
      effectiveResistivity = this.calculateTwoLayerEffectiveResistivity();
      calculationMethod = 'two_layer_weighted';
    }

    this.addTrace('effective_resistivity_calculation', {
      model,
      effectiveResistivity,
      method: calculationMethod,
      layers: this.extractLayerSummary(layers)
    });

    return effectiveResistivity;
  }

  /**
   * Extracts layer summary for traceability
   */
  extractLayerSummary(layers) {
    return layers.map(layer => ({
      type: layer.type,
      resistivity: layer.resistivity,
      thickness: layer.thickness
    }));
  }

  /**
   * Calculates effective resistivity for two-layer soil using IEEE 80 method
   * @returns {number} Effective resistivity with surface layer correction
   */
  calculateTwoLayerEffectiveResistivity() {
    const [topLayer, bottomLayer] = this.input.layers;
    const { surfaceLayer } = this.input;

    const effectiveResistivity = this.calculateWeightedResistivity(topLayer, bottomLayer);

    if (this.hasValidSurfaceLayer(surfaceLayer)) {
      return this.applySurfaceLayerCorrection(effectiveResistivity, surfaceLayer);
    }

    return effectiveResistivity;
  }

  /**
   * Calculates weighted resistivity for two-layer model
   */
  calculateWeightedResistivity(topLayer, bottomLayer) {
    return WEIGHTING_FACTOR * topLayer.resistivity + 
           (1 - WEIGHTING_FACTOR) * bottomLayer.resistivity;
  }

  /**
   * Checks if surface layer is valid for correction
   */
  hasValidSurfaceLayer(surfaceLayer) {
    return surfaceLayer && surfaceLayer.resistivity && surfaceLayer.thickness;
  }

  /**
   * Applies surface layer correction to effective resistivity
   */
  applySurfaceLayerCorrection(effectiveResistivity, surfaceLayer) {
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

  /**
   * Calculates reflection coefficient for two-layer soil
   * @returns {number} Reflection coefficient K
   */
  calculateReflectionCoefficient() {
    if (this.input.model !== 'two-layer') {
      return 0;
    }

    const [topLayer, bottomLayer] = this.input.layers;
    const reflectionCoefficient = this.computeReflectionCoefficient(topLayer, bottomLayer);

    this.addTrace('reflection_coefficient', {
      K: reflectionCoefficient,
      layer1Resistivity: topLayer.resistivity,
      layer2Resistivity: bottomLayer.resistivity,
      interpretation: this.interpretReflectionCoefficient(reflectionCoefficient)
    });

    return reflectionCoefficient;
  }

  /**
   * Computes reflection coefficient
   */
  computeReflectionCoefficient(topLayer, bottomLayer) {
    return (bottomLayer.resistivity - topLayer.resistivity) / 
           (bottomLayer.resistivity + topLayer.resistivity);
  }

  /**
   * Interprets reflection coefficient value
   */
  interpretReflectionCoefficient(K) {
    return K > 0 ? 'High resistivity bottom layer' : 'Low resistivity bottom layer';
  }

  /**
   * Calculates surface layer factor with multi-layer consideration
   * @returns {number} Surface layer factor
   */
  calculateSurfaceLayerFactor() {
    const { surfaceLayer } = this.input;
    
    if (!this.hasValidSurfaceLayer(surfaceLayer)) {
      return 1.0;
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
   * Assesses soil quality with multi-layer consideration
   * @returns {Object} Soil quality assessment
   */
  assessSoilQuality() {
    const effectiveResistivity = this.calculateEffectiveResistivity();
    const { model } = this.input;

    const qualityAssessment = this.determineQualityLevel(effectiveResistivity);
    const layerAssessment = model === 'two-layer' ? this.assessLayerContrast() : null;

    this.addTrace('soil_quality_assessment', {
      ...qualityAssessment,
      effectiveResistivity,
      model,
      layerAssessment
    });

    return {
      ...qualityAssessment,
      resistivity: effectiveResistivity,
      model,
      layerAssessment
    };
  }

  /**
   * Determines quality level based on resistivity
   */
  determineQualityLevel(resistivity) {
    if (resistivity <= 50) {
      return { quality: 'excellent', color: 'green', assessment: 'Very good grounding conditions' };
    } else if (resistivity <= 100) {
      return { quality: 'good', color: 'light-green', assessment: 'Good grounding conditions' };
    } else if (resistivity <= 300) {
      return { quality: 'fair', color: 'yellow', assessment: 'Moderate grounding conditions' };
    } else if (resistivity <= 1000) {
      return { quality: 'poor', color: 'orange', assessment: 'Difficult grounding conditions' };
    } else {
      return { quality: 'very_poor', color: 'red', assessment: 'Very difficult grounding conditions' };
    }
  }

  /**
   * Assesses layer contrast for two-layer models
   */
  assessLayerContrast() {
    const reflectionCoefficient = this.calculateReflectionCoefficient();
    return {
      reflectionCoefficient,
      interpretation: reflectionCoefficient > 0.5 ? 'Strong contrast between layers' : 'Moderate contrast',
      recommendation: reflectionCoefficient > 0.7 ? 'Consider deep-driven rods' : 'Standard design acceptable'
    };
  }

  /**
   * Performs complete soil analysis
   * @returns {Object} Complete analysis results
   */
  analyze() {
    return {
      effectiveResistivity: this.calculateEffectiveResistivity(),
      surfaceLayerFactor: this.calculateSurfaceLayerFactor(),
      soilQuality: this.assessSoilQuality(),
      reflectionCoefficient: this.calculateReflectionCoefficient(),
      model: this.input.model,
      layers: this.input.layers,
      temperature: this.input.temperature,
      humidity: this.input.humidity,
      season: this.input.season,
      traceability: this.getTraceability()
    };
  }

  /**
   * Adds traceability entry with automatic size management
   * @param {string} calculation - Calculation type
   * @param {Object} data - Calculation data
   */
  addTrace(calculation, data) {
    const traceEntry = {
      timestamp: new Date().toISOString(),
      calculation,
      model: 'MultiLayerSoilModel',
      standard: 'IEEE 80-2013',
      ...data
    };

    this.traceability.push(traceEntry);
    
    // Prevent unbounded growth
    if (this.traceability.length > this.maxTraceabilityEntries) {
      this.traceability.shift(); // Remove oldest entry
    }
  }

  /**
   * Returns traceability log
   * @returns {Array} Traceability entries
   */
  getTraceability() {
    return [...this.traceability]; // Return copy to prevent external modification
  }

  /**
   * Clears traceability log
   */
  clearTraceability() {
    this.traceability = [];
  }

  /**
   * Sets maximum traceability entries
   * @param {number} maxEntries - Maximum number of entries
   */
  setMaxTraceabilityEntries(maxEntries) {
    this.maxTraceabilityEntries = maxEntries;
    // Trim existing traceability if needed
    while (this.traceability.length > this.maxTraceabilityEntries) {
      this.traceability.shift();
    }
  }
}

export default MultiLayerSoilModel;
