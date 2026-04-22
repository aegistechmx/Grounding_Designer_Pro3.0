/**
 * Grid Model - Professional calculation engine for grounding grid geometry and resistance
 * Implements IEEE 80 standard grid calculations with full traceability
 */

import IEEE80Formulas from './IEEE80Formulas.js';

class GridModel {
  constructor(input) {
    this.traceability = []; // Initialize traceability first
    this.input = this.validateInput(input);
  }

  /**
   * Validate and normalize input parameters
   */
  validateInput(input) {
    const required = ['gridLength', 'gridWidth', 'numParallel', 'numRods'];
    const missing = required.filter(key => input[key] === undefined || input[key] === null);
    
    if (missing.length > 0) {
      throw new Error(`Missing required input: ${missing.join(', ')}`);
    }

    const validated = {
      gridLength: this.validatePositiveNumber(input.gridLength, 'gridLength'),
      gridWidth: this.validatePositiveNumber(input.gridWidth, 'gridWidth'),
      numParallel: this.validatePositiveInteger(input.numParallel, 'numParallel'),
      numParallelY: input.numParallelY || Math.floor((input.numParallel * input.gridLength) / input.gridWidth),
      numRods: this.validatePositiveInteger(input.numRods, 'numRods'),
      rodLength: this.validatePositiveNumber(input.rodLength || 3, 'rodLength'),
      gridDepth: this.validatePositiveNumber(input.gridDepth || 0.6, 'gridDepth'),
      conductorSize: input.conductorSize || 4/0, // AWG
      conductorMaterial: input.conductorMaterial || 'copper',
      gridSpacing: input.gridSpacing || null // Will be calculated if not provided
    };

    // Calculate grid spacing if not provided
    if (!validated.gridSpacing) {
      validated.gridSpacing = {
        x: validated.gridLength / Math.max(1, validated.numParallel - 1),
        y: validated.gridWidth / Math.max(1, validated.numParallelY - 1)
      };
    }

    this.addTrace('input_validation', validated);
    return validated;
  }

  /**
   * Calculate grid area
   */
  calculateGridArea() {
    const { gridLength, gridWidth } = this.input;
    const result = gridLength * gridWidth;

    this.addTrace('grid_area', {
      value: result,
      formula: 'A = L × W',
      inputs: { gridLength, gridWidth }
    });

    return result;
  }

  /**
   * Calculate total conductor length
   */
  calculateTotalConductorLength() {
    const { gridLength, gridWidth, numParallel, numParallelY, rodLength, numRods } = this.input;
    
    // Horizontal conductors
    const horizontalLength = gridLength * numParallelY;
    // Vertical conductors  
    const verticalLength = gridWidth * numParallel;
    // Rod connections
    const rodConnections = numRods * rodLength;
    
    const result = horizontalLength + verticalLength + rodConnections;

    this.addTrace('total_conductor_length', {
      value: result,
      formula: 'L_total = (L × n_y) + (W × n_x) + (n_rods × l_rod)',
      inputs: {
        horizontalLength,
        verticalLength,
        rodConnections,
        gridLength,
        gridWidth,
        numParallel,
        numParallelY,
        rodLength,
        numRods
      }
    });

    return result;
  }

  /**
   * Calculate grid perimeter
   */
  calculateGridPerimeter() {
    const { gridLength, gridWidth } = this.input;
    const result = 2 * (gridLength + gridWidth);

    this.addTrace('grid_perimeter', {
      value: result,
      formula: 'P = 2 × (L + W)',
      inputs: { gridLength, gridWidth }
    });

    return result;
  }

  /**
   * Calculate grid resistance using real IEEE 80 formulas
   */
  calculateGridResistance(soilResistivity) {
    const { gridLength, gridWidth, numRods, rodLength, gridDepth } = this.input;
    const gridArea = this.calculateGridArea();
    const totalConductorLength = this.calculateTotalConductorLength();
    
    // Use real IEEE 80 formula (Dwight's method)
    const gridResistance = IEEE80Formulas.calculateGridResistance(
      soilResistivity,
      totalConductorLength,
      gridArea,
      gridDepth
    );

    // Rod contribution (if rods are present)
    let rodContribution = 0;
    if (numRods > 0 && rodLength > 0) {
      const rodResistance = (soilResistivity / (2 * Math.PI * rodLength)) * 
                           Math.log(4 * rodLength / 0.01); // Assuming 1cm rod radius
      rodContribution = rodResistance / numRods;
    }

    const totalResistance = rodContribution > 0 
      ? 1 / (1/gridResistance + 1/rodContribution) // Parallel combination
      : gridResistance;

    // Add traceability with real IEEE 80 formula documentation
    const formulaDoc = IEEE80Formulas.getFormulaDocumentation().gridResistance;
    
    this.addTrace('grid_resistance', {
      value: totalResistance,
      formula: formulaDoc.equation,
      reference: formulaDoc.reference,
      inputs: {
        soilResistivity,
        totalConductorLength,
        gridArea,
        gridDepth,
        gridResistance,
        rodContribution,
        numRods,
        rodLength
      },
      intermediateSteps: [
        {
          step: 'Equivalent radius',
          value: Math.sqrt(gridArea / Math.PI),
          unit: 'm'
        },
        {
          step: 'Basic grid resistance',
          value: gridResistance,
          unit: '×'
        },
        {
          step: 'Rod contribution',
          value: rodContribution,
          unit: '×'
        },
        {
          step: 'Total resistance',
          value: totalResistance,
          unit: '×'
        }
      ]
    });

    return totalResistance;
  }

  /**
   * Calculate mesh spacing
   */
  calculateMeshSpacing() {
    const { gridLength, gridWidth, numParallel, numParallelY } = this.input;
    
    const spacingX = gridLength / Math.max(1, numParallel - 1);
    const spacingY = gridWidth / Math.max(1, numParallelY - 1);
    
    const result = { x: spacingX, y: spacingY };

    this.addTrace('mesh_spacing', {
      value: result,
      formula: 's_x = L / (n_x - 1), s_y = W / (n_y - 1)',
      inputs: {
        gridLength,
        gridWidth,
        numParallel,
        numParallelY,
        spacingX,
        spacingY
      }
    });

    return result;
  }

  /**
   * Calculate grid geometric factor using real IEEE 80 formulas
   */
  calculateGeometricFactor() {
    const { gridLength, gridWidth, numParallel, numParallelY, gridDepth } = this.input;
    
    // Use real IEEE 80 geometric factors
    const Ks = IEEE80Formulas.calculateStepGeometricFactor(
      gridLength, 
      gridWidth, 
      numParallel, 
      numParallelY, 
      gridDepth
    );
    
    const Km = IEEE80Formulas.calculateTouchGeometricFactor(
      gridLength, 
      gridWidth, 
      numParallel, 
      numParallelY, 
      gridDepth
    );
    
    const result = { Ks, Km };

    // Add traceability with formula documentation
    const stepFormulaDoc = IEEE80Formulas.getFormulaDocumentation().stepVoltage;
    const touchFormulaDoc = IEEE80Formulas.getFormulaDocumentation().touchVoltage;

    this.addTrace('geometric_factor', {
      value: result,
      stepFormula: stepFormulaDoc.equation,
      stepReference: stepFormulaDoc.reference,
      touchFormula: touchFormulaDoc.equation,
      touchReference: touchFormulaDoc.reference,
      inputs: {
        gridLength,
        gridWidth,
        numParallel,
        numParallelY,
        gridDepth,
        Ks,
        Km
      },
      notes: 'Geometric factors depend on mesh configuration and require IEEE 80 tables/graphs for precise values'
    });

    return result;
  }

  /**
   * Calculate conductor properties
   */
  calculateConductorProperties() {
    const { conductorSize, conductorMaterial, totalConductorLength } = this.input;
    
    // AWG to mm² conversion
    const awgToMm2 = {
      '4/0': 107.16,
      '3/0': 85.01,
      '2/0': 67.43,
      '1/0': 53.49,
      '1': 42.41,
      '2': 33.63,
      '3': 26.67,
      '4': 21.15
    };

    const crossSection = awgToMm2[conductorSize] || 42.41; // Default to 1 AWG
    const resistivity = conductorMaterial === 'copper' ? 0.0172 : 0.0283; // ×·mm²/m
    const resistance = (resistivity * totalConductorLength) / crossSection;
    
    const result = {
      crossSection,
      resistance,
      material: conductorMaterial,
      size: conductorSize
    };

    this.addTrace('conductor_properties', {
      value: result,
      formula: 'R_conductor = (× × L) / A',
      inputs: {
        conductorSize,
        conductorMaterial,
        totalConductorLength,
        crossSection,
        resistivity,
        resistance
      }
    });

    return result;
  }

  /**
   * Add traceability entry for debugging and auditing
   */
  addTrace(calculation, data) {
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
   * Utility: validate positive integer
   */
  validatePositiveInteger(value, name) {
    if (typeof value !== 'number' || value <= 0 || !Number.isInteger(value)) {
      throw new Error(`${name} must be a positive integer, got: ${value}`);
    }
    return value;
  }

  /**
   * Get complete grid analysis
   */
  analyze(soilResistivity) {
    return {
      gridArea: this.calculateGridArea(),
      totalConductorLength: this.calculateTotalConductorLength(),
      gridPerimeter: this.calculateGridPerimeter(),
      gridResistance: this.calculateGridResistance(soilResistivity),
      meshSpacing: this.calculateMeshSpacing(),
      geometricFactor: this.calculateGeometricFactor(),
      conductorProperties: this.calculateConductorProperties(),
      traceability: this.getTraceability()
    };
  }
}

export default GridModel;
