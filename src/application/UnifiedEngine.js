/**
 * UnifiedEngine - Single Source of Truth for Grounding Analysis
 * 
 * This is the ONLY official entry point for all grounding calculations.
 * All UI, optimization, heatmap, and validation MUST route through this engine.
 * 
 * Architecture:
 * - Single source of truth: DISCRETE method (GridSolver)
 * - Analytical method used for reference/comparison only
 * - Cross-validation performed at engine level
 * - Consistent data structure for all consumers
 */

import SoilModel from '../domain/grounding/SoilModel.js';
import GridModel from '../domain/grounding/GridModel.js';
import FaultModel from '../domain/grounding/FaultModel.js';
import GridSolver from '../domain/grounding/GridSolver.js';
import StrongValidation, { ValidationError } from '../utils/strongValidation.js';
import UnitSystem from '../utils/unitSystem.js';
import CrossValidation from '../services/CrossValidation.js';

// Single source of truth configuration
const SOURCE_OF_TRUTH = 'discrete'; // 'discrete' or 'analytical'
const SPLIT_FACTOR = 0.15; // Unified split factor for both methods (Ig = If * Sf)

class UnifiedEngine {
  constructor(input) {
    this.traceability = [];
    this.results = null;
    this.input = this.validateAndNormalizeInput(input);
  }

  /**
   * Strong validation and normalization of input parameters
   */
  validateAndNormalizeInput(input) {
    try {
      const sanitized = StrongValidation.sanitizeInput(input);
      const validated = StrongValidation.validateGroundingInput(sanitized);
      const normalized = UnitSystem.normalizeInput(validated);
      
      // Ensure unified split factor is used
      if (normalized.fault) {
        normalized.fault.divisionFactor = SPLIT_FACTOR;
      }
      
      this.addTrace('input_validation', {
        validation: 'strong',
        units: 'normalized_to_SI',
        splitFactor: SPLIT_FACTOR,
        source: 'UnifiedEngine',
        timestamp: new Date().toISOString()
      });
      
      return normalized;
      
    } catch (error) {
      this.addTrace('validation_error', { 
        error: error.message, 
        code: error.code,
        field: error.field,
        source: 'UnifiedEngine'
      });
      throw new ValidationError(`Input validation failed: ${error.message}`, error.code, error.field);
    }
  }

  /**
   * Main entry point - run complete grounding analysis
   * This is the ONLY method that should be called from UI, optimization, etc.
   * 
   * @param {Object} options - Analysis options
   * @param {boolean} options.includeAnalytical - Include analytical method for comparison (default: true)
   * @param {boolean} options.includeValidation - Include cross-validation (default: true)
   * @param {boolean} options.includeSpatialData - Include spatial node data for heatmap (default: true)
   * @returns {Object} Unified results structure
   */
  analyze(options = {}) {
    const {
      includeAnalytical = true,
      includeValidation = true,
      includeSpatialData = true
    } = options;

    try {
      console.log('UnifiedEngine: Starting analysis...');
      console.log('Source of truth:', SOURCE_OF_TRUTH);
      
      // Step 1: Analyze soil (shared by both methods)
      const soilModel = new SoilModel(this.input.soil);
      const soilAnalysis = soilModel.analyze();
      const effectiveResistivity = soilAnalysis.effectiveResistivity;
      
      this.addTrace('soil_analysis_complete', {
        effectiveResistivity,
        surfaceLayerFactor: soilAnalysis.surfaceLayerFactor,
        model: 'SoilModel',
        standard: 'IEEE 80'
      });

      // Step 2: Run DISCRETE method (SOURCE OF TRUTH)
      const discreteResults = this.runDiscreteMethod(soilAnalysis, effectiveResistivity, includeSpatialData);
      
      // Step 3: Run ANALYTICAL method (for comparison only)
      let analyticalResults = null;
      if (includeAnalytical) {
        analyticalResults = this.runAnalyticalMethod(soilAnalysis, effectiveResistivity);
      }

      // Step 4: Cross-validation
      let validation = null;
      if (includeValidation && analyticalResults && discreteResults) {
        const validator = new CrossValidation(analyticalResults, discreteResults);
        validation = validator.validate();
      }

      // Step 5: Build unified results structure
      this.results = this.buildUnifiedResults({
        soil: soilAnalysis,
        discrete: discreteResults,
        analytical: analyticalResults,
        validation,
        sourceOfTruth: SOURCE_OF_TRUTH
      });

      this.addTrace('analysis_complete', {
        sourceOfTruth: SOURCE_OF_TRUTH,
        hasAnalytical: !!analyticalResults,
        hasValidation: !!validation,
        hasSpatialData: !!discreteResults.spatialData,
        success: true,
        timestamp: new Date().toISOString()
      });

      return this.results;

    } catch (error) {
      this.addTrace('analysis_error', { 
        error: error.message,
        stack: error.stack,
        source: 'UnifiedEngine'
      });
      throw new Error(`UnifiedEngine analysis failed: ${error.message}`);
    }
  }

  /**
   * Run discrete solver (SOURCE OF TRUTH)
   */
  runDiscreteMethod(soilAnalysis, effectiveResistivity, includeSpatialData) {
    console.log('Running discrete solver (source of truth)...');
    
    // Use unified grid current (Ig = If * Sf) for discrete solver
    const gridCurrent = this.input.fault.faultCurrent * SPLIT_FACTOR;
    
    const discreteResults = GridSolver.solveGrid(
      this.input.grid,
      effectiveResistivity,
      gridCurrent,
      includeSpatialData
    );
    
    // Convert to standard format
    const gridAnalysis = {
      area: this.input.grid.gridLength * this.input.grid.gridWidth,
      totalConductorLength: this.calculateTotalConductorLength(),
      perimeter: 2 * (this.input.grid.gridLength + this.input.grid.gridWidth),
      resistance: discreteResults.gridResistance,
      meshSpacing: this.input.grid.spacing,
      geometricFactor: 1.0, // Not used in discrete
      method: 'discrete'
    };
    
    const faultAnalysis = {
      gridCurrent: this.input.fault.faultCurrent * SPLIT_FACTOR, // Unified split factor
      gpr: discreteResults.gpr,
      stepVoltage: discreteResults.stepVoltage,
      touchVoltage: discreteResults.touchVoltage,
      permissibleTouch: this.calculatePermissibleTouch(),
      permissibleStep: this.calculatePermissibleStep(),
      safetyMargins: this.calculateSafetyMargins(discreteResults),
      factorAnalysis: {
        method: 'discrete',
        nodeCount: discreteResults.nodes.length,
        voltageRange: discreteResults.analysis.voltageRange,
        edgeConcentration: discreteResults.analysis.edgeConcentration,
        rodEffectiveness: discreteResults.analysis.rodEffectiveness
      }
    };

    this.addTrace('discrete_solver_complete', {
      method: 'nodal_analysis',
      nodeCount: discreteResults.nodes.length,
      gridResistance: discreteResults.gridResistance,
      gpr: discreteResults.gpr,
      stepVoltage: discreteResults.stepVoltage,
      touchVoltage: discreteResults.touchVoltage,
      model: 'GridSolver',
      standard: 'IEEE 80'
    });

    return {
      grid: gridAnalysis,
      fault: faultAnalysis,
      spatialData: includeSpatialData ? discreteResults.spatialData : null,
      rawDiscrete: discreteResults
    };
  }

  /**
   * Run analytical method (for comparison only)
   */
  runAnalyticalMethod(soilAnalysis, effectiveResistivity) {
    console.log('Running analytical method (for comparison)...');
    
    const gridModel = new GridModel(this.input.grid);
    const gridAnalysis = gridModel.analyze(effectiveResistivity);

    const faultModel = new FaultModel(this.input.fault);
    
    const gridGeometry = {
      length: this.input.grid.gridLength,
      width: this.input.grid.gridWidth,
      numParallelX: this.input.grid.numParallel,
      numParallelY: this.input.grid.numParallelY,
      gridDepth: this.input.grid.gridDepth,
      numRods: this.input.grid.numRods || 0,
      rodLength: this.input.grid.rodLength || 3
    };

    const faultAnalysis = faultModel.analyze(
      gridAnalysis.gridResistance, 
      gridAnalysis.geometricFactor, 
      effectiveResistivity,
      this.input.soil.surfaceLayerResistivity,
      gridGeometry
    );

    // Add safety margins
    faultAnalysis.permissibleTouch = this.calculatePermissibleTouch();
    faultAnalysis.permissibleStep = this.calculatePermissibleStep();
    faultAnalysis.safetyMargins = this.calculateSafetyMargins(faultAnalysis);

    // Generate analytical voltage grid for overlay visualization
    const analyticalGrid = this.generateAnalyticalGrid(faultAnalysis.gpr, effectiveResistivity);

    this.addTrace('analytical_method_complete', {
      gridResistance: gridAnalysis.gridResistance,
      geometricFactor: gridAnalysis.geometricFactor,
      gpr: faultAnalysis.gpr,
      stepVoltage: faultAnalysis.stepVoltage,
      touchVoltage: faultAnalysis.touchVoltage,
      hasAnalyticalGrid: !!analyticalGrid,
      model: 'Analytical',
      standard: 'IEEE 80'
    });

    return {
      grid: gridAnalysis,
      fault: faultAnalysis,
      voltageGrid: analyticalGrid
    };
  }

  /**
   * Generate analytical voltage grid for overlay visualization
   * Uses simplified exponential decay model for visual comparison
   * Not IEEE-accurate, but sufficient for overlay validation
   */
  generateAnalyticalGrid(gpr, effectiveResistivity, resolution = 100) {
    const grid = [];
    const gridLength = this.input.grid.gridLength || 50;
    const gridWidth = this.input.grid.gridWidth || 50;
    
    // Characteristic decay distance based on resistivity
    const decayFactor = Math.sqrt(effectiveResistivity) * 0.5;
    
    // Center of grid
    const centerX = gridLength / 2;
    const centerY = gridWidth / 2;
    
    for (let y = 0; y < resolution; y++) {
      grid[y] = [];
      for (let x = 0; x < resolution; x++) {
        // Map grid coordinates to physical coordinates
        const physX = (x / resolution) * gridLength;
        const physY = (y / resolution) * gridWidth;
        
        // Distance from center (fault point)
        const r = Math.sqrt(Math.pow(physX - centerX, 2) + Math.pow(physY - centerY, 2));
        
        // Simplified exponential decay model
        // V(r) = GPR * exp(-r / decayFactor)
        const voltage = gpr * Math.exp(-r / decayFactor);
        
        grid[y][x] = voltage;
      }
    }
    
    return grid;
  }

  /**
   * Build unified results structure
   */
  buildUnifiedResults({ soil, discrete, analytical, validation, sourceOfTruth }) {
    const primary = sourceOfTruth === 'discrete' ? discrete : analytical;
    
    // Normalize grid property names (GridModel uses gridResistance, discrete uses resistance)
    const normalizeGrid = (grid) => ({
      ...grid,
      resistance: grid.resistance || grid.gridResistance,
      gridResistance: grid.gridResistance || grid.resistance
    });

    return {
      // Metadata
      metadata: {
        sourceOfTruth,
        timestamp: new Date().toISOString(),
        engine: 'UnifiedEngine',
        version: '1.0.0'
      },

      // Input summary
      input: {
        ...this.input,
        validation: 'strong',
        units: 'SI_normalized'
      },

      // Soil analysis (shared)
      soil: {
        effectiveResistivity: soil.effectiveResistivity,
        surfaceLayerFactor: soil.surfaceLayerFactor,
        soilQuality: soil.soilQuality,
        temperatureCorrection: soil.temperatureCorrection,
        seasonalCorrection: soil.seasonalCorrection,
        reflectionCoefficient: soil.reflectionCoefficient,
        layers: soil.layers
      },

      // Primary results (source of truth)
      primary: {
        method: sourceOfTruth,
        grid: normalizeGrid(discrete.grid),
        fault: discrete.fault,
        spatialData: discrete.spatialData
      },

      // Secondary results (for comparison)
      secondary: analytical ? {
        method: 'analytical',
        grid: normalizeGrid(analytical.grid),
        fault: analytical.fault
      } : null,

      // Cross-validation
      validation: validation || null,

      // Compliance check
      compliance: this.checkCompliance(primary.fault),

      // Traceability
      traceability: this.getFullTraceability()
    };
  }

  /**
   * Calculate total conductor length
   */
  calculateTotalConductorLength() {
    const { gridLength, gridWidth, numParallel, numParallelY } = this.input.grid;
    return gridLength * (numParallelY - 1) + gridWidth * (numParallel - 1);
  }

  /**
   * Calculate permissible touch voltage (IEEE 80)
   */
  calculatePermissibleTouch() {
    const bodyWeight = 70; // kg (typical)
    const faultDuration = this.input.fault.faultDuration || 0.5;
    const surfaceResistivity = this.input.soil.surfaceLayerResistivity || 1000;
    
    // IEEE 80 formula
    const Cs = 1 - 0.08 * (surfaceResistivity / 1000) / (2 * Math.sqrt(this.input.soil.surfaceDepth || 0.1) + 0.08);
    const permissible = (1000 + 1.5 * Cs * surfaceResistivity) / Math.sqrt(faultDuration) * 0.157 / Math.sqrt(bodyWeight);
    
    return permissible;
  }

  /**
   * Calculate permissible step voltage (IEEE 80)
   */
  calculatePermissibleStep() {
    const bodyWeight = 70; // kg (typical)
    const faultDuration = this.input.fault.faultDuration || 0.5;
    const surfaceResistivity = this.input.soil.surfaceLayerResistivity || 1000;
    
    // IEEE 80 formula
    const Cs = 1 - 0.08 * (surfaceResistivity / 1000) / (2 * Math.sqrt(this.input.soil.surfaceDepth || 0.1) + 0.08);
    const permissible = (1000 + 6 * Cs * surfaceResistivity) / Math.sqrt(faultDuration) * 0.157 / Math.sqrt(bodyWeight);
    
    return permissible;
  }

  /**
   * Calculate safety margins
   */
  calculateSafetyMargins(faultResults) {
    const permissibleTouch = this.calculatePermissibleTouch();
    const permissibleStep = this.calculatePermissibleStep();
    
    const touchMargin = ((permissibleTouch - faultResults.touchVoltage) / permissibleTouch) * 100;
    const stepMargin = ((permissibleStep - faultResults.stepVoltage) / permissibleStep) * 100;
    
    return {
      touchMargin,
      stepMargin,
      touchSafe: touchMargin > 0,
      stepSafe: stepMargin > 0,
      permissibleTouch,
      permissibleStep
    };
  }

  /**
   * Check IEEE 80 compliance
   */
  checkCompliance(faultAnalysis) {
    if (!faultAnalysis || !faultAnalysis.safetyMargins) {
      return { complies: false, reason: 'No safety data available' };
    }

    const { touchSafe, stepSafe } = faultAnalysis.safetyMargins;
    
    return {
      complies: touchSafe && stepSafe,
      touchSafe,
      stepSafe,
      reason: touchSafe && stepSafe 
        ? 'Meets IEEE 80 safety requirements' 
        : touchSafe 
          ? 'Step voltage exceeds limits' 
          : stepSafe 
            ? 'Touch voltage exceeds limits' 
            : 'Both voltages exceed limits'
    };
  }

  /**
   * Add traceability entry
   */
  addTrace(step, data) {
    this.traceability.push({
      step,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get full traceability
   */
  getFullTraceability() {
    return this.traceability;
  }

  /**
   * Get source of truth configuration
   */
  static getSourceOfTruth() {
    return SOURCE_OF_TRUTH;
  }
}

export default UnifiedEngine;
