// src/simulation/SimulationRunner.js
// Simulation orchestrator using core + data model

import { 
  calcGridResistance, 
  calcSurfaceLayerFactor, 
  allowableTouchVoltage, 
  allowableStepVoltage,
  calcTouchVoltage,
  validateSystem 
} from '../core/ieee80.js';

const DEFAULT_BODY_WEIGHT = 70;
const MIN_CURRENT = 0.1;
const MIN_DIVISION_FACTOR = 0.1;
const DEFAULT_DIVISION_FACTOR = 0.2;
const TOUCH_VOLTAGE_RATIO = 0.18;
const STEP_VOLTAGE_RATIO = 0.10;
const TOUCH_TO_STEP_RATIO = 0.7;
const DEFAULT_GRID_LENGTH = 30;
const DEFAULT_GRID_WIDTH = 16;
const DEFAULT_RESOLUTION = 20;

/**
 * Main simulation runner - no UI, no React
 */
export class SimulationRunner {
  constructor(project) {
    this.project = project;
    this.results = [];
  }

  /**
   * Runs simulation for all scenarios
   * @returns {Array} Array of simulation results
   */
  runAll() {
    const results = this.project.scenarios.map(scenario => this.runScenario(scenario));
    this.results = results;
    return results;
  }

  /**
   * Runs simulation for a specific scenario
   * @param {Object} scenario - Fault scenario
   * @returns {Object} Simulation result
   */
  runScenario(scenario) {
    const { grid, soil } = this.project;
    
    this.validateSimulationInput(grid, soil, scenario);
    
    const gridResistance = this.calculateGridResistance(grid, soil);
    const gridCurrent = this.calculateGridCurrent(scenario);
    const { GPR: groundPotentialRise } = calcTouchVoltage({ faultCurrent: gridCurrent, Rg: gridResistance });
    const surfaceLayerFactor = this.calculateSurfaceLayerFactor(soil);
    const allowableTouchVoltage = this.calculateAllowableTouchVoltage(soil, surfaceLayerFactor, scenario);
    const allowableStepVoltage = this.calculateAllowableStepVoltage(soil, surfaceLayerFactor, scenario);
    const actualTouchVoltage = groundPotentialRise * TOUCH_VOLTAGE_RATIO;
    const actualStepVoltage = groundPotentialRise * STEP_VOLTAGE_RATIO;
    const validation = this.validateSystem(gridCurrent, gridResistance, soil, scenario);
    
    return {
      scenarioId: scenario.id,
      timestamp: new Date().toISOString(),
      Rg: gridResistance,
      GPR: groundPotentialRise,
      Ig: gridCurrent,
      Cs: surfaceLayerFactor,
      Em: actualTouchVoltage,
      Es: actualStepVoltage,
      Etouch70: allowableTouchVoltage,
      Estep70: allowableStepVoltage,
      ...validation
    };
  }

  /**
   * Validates simulation input parameters
   */
  validateSimulationInput(grid, soil, scenario) {
    if (!grid || !soil || !scenario) {
      throw new Error('Incomplete data for simulation');
    }
  }

  /**
   * Calculates grid resistance
   */
  calculateGridResistance(grid, soil) {
    return calcGridResistance({
      soilResistivity: soil.resistivity,
      gridArea: grid.area,
      totalConductorLength: grid.totalConductorLength,
      burialDepth: grid.depth,
      numRods: grid.numRods,
      rodLength: grid.rodLength
    });
  }

  /**
   * Calculates grid current
   */
  calculateGridCurrent(scenario) {
    const currentSafe = Math.max(MIN_CURRENT, scenario.current ?? 0);
    const divisionFactorSafe = Math.max(MIN_DIVISION_FACTOR, scenario.divisionFactor ?? DEFAULT_DIVISION_FACTOR);
    return scenario.Ig ?? (currentSafe * divisionFactorSafe);
  }

  /**
   * Calculates surface layer factor
   */
  calculateSurfaceLayerFactor(soil) {
    return calcSurfaceLayerFactor({
      soilResistivity: soil.resistivity,
      surfaceResistivity: soil.surfaceResistivity,
      surfaceDepth: soil.surfaceDepth
    });
  }

  /**
   * Calculates allowable touch voltage
   */
  calculateAllowableTouchVoltage(soil, surfaceLayerFactor, scenario) {
    return allowableTouchVoltage({
      surfaceResistivity: soil.surfaceResistivity,
      Cs: surfaceLayerFactor,
      faultDuration: scenario.duration,
      bodyWeight: DEFAULT_BODY_WEIGHT
    });
  }

  /**
   * Calculates allowable step voltage
   */
  calculateAllowableStepVoltage(soil, surfaceLayerFactor, scenario) {
    return allowableStepVoltage({
      surfaceResistivity: soil.surfaceResistivity,
      Cs: surfaceLayerFactor,
      faultDuration: scenario.duration,
      bodyWeight: DEFAULT_BODY_WEIGHT
    });
  }

  /**
   * Validates system compliance
   */
  validateSystem(gridCurrent, gridResistance, soil, scenario) {
    return validateSystem({
      faultCurrent: gridCurrent,
      Rg: gridResistance,
      soilResistivity: soil.resistivity,
      surfaceResistivity: soil.surfaceResistivity,
      surfaceDepth: soil.surfaceDepth,
      faultDuration: scenario.duration,
      bodyWeight: DEFAULT_BODY_WEIGHT
    });
  }

  /**
   * Simulates step voltage at a specific point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} scenario - Fault scenario
   * @returns {number} Step voltage at point
   */
  simulateStepVoltageAtPoint(x, y, scenario) {
    const { grid, soil } = this.project;
    const gridLength = Math.max(1, grid?.length ?? DEFAULT_GRID_LENGTH);
    const gridWidth = Math.max(1, grid?.width ?? DEFAULT_GRID_WIDTH);
    const gridResistance = calcGridResistance({
      soilResistivity: soil?.resistivity ?? 100,
      gridArea: grid?.area ?? 1,
      totalConductorLength: grid?.totalConductorLength ?? 0,
      burialDepth: grid?.depth ?? 0.6
    });
    const gridCurrent = scenario.Ig ?? scenario.current * scenario.divisionFactor;
    const { GPR: groundPotentialRise } = calcTouchVoltage({ faultCurrent: gridCurrent, Rg: gridResistance });
    
    const voltage = this.calculateVoltageDecay(groundPotentialRise, x, y, gridLength, gridWidth);
    return Math.max(0, voltage);
  }

  /**
   * Calculates voltage decay based on distance from center
   */
  calculateVoltageDecay(groundPotentialRise, x, y, gridLength, gridWidth) {
    const centerX = gridLength / 2;
    const centerY = gridWidth / 2;
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    const maxDistance = Math.max(gridLength, gridWidth) / 2;
    
    return groundPotentialRise * (1 - distance / maxDistance);
  }

  /**
   * Simulates touch voltage at a specific point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} scenario - Fault scenario
   * @returns {number} Touch voltage at point
   */
  simulateTouchVoltageAtPoint(x, y, scenario) {
    const stepVoltage = this.simulateStepVoltageAtPoint(x, y, scenario);
    return stepVoltage * TOUCH_TO_STEP_RATIO;
  }

  /**
   * Generates voltage map for entire grid
   * @param {number} resolution - Grid resolution
   * @returns {Array} Array of voltage points
   */
  generateVoltageMap(resolution = DEFAULT_RESOLUTION) {
    const { grid } = this.project;
    const scenario = this.project.scenarios?.[0];
    if (!scenario) return [];
    
    const gridLength = Math.max(1, grid?.length ?? DEFAULT_GRID_LENGTH);
    const gridWidth = Math.max(1, grid?.width ?? DEFAULT_GRID_WIDTH);
    const resolutionSafe = Math.max(1, resolution ?? DEFAULT_RESOLUTION);
    
    const voltageMap = [];
    const stepX = gridLength / resolutionSafe;
    const stepY = gridWidth / resolutionSafe;
    
    for (let i = 0; i <= resolutionSafe; i++) {
      for (let j = 0; j <= resolutionSafe; j++) {
        const x = i * stepX;
        const y = j * stepY;
        const voltage = this.simulateStepVoltageAtPoint(x, y, scenario);
        voltageMap.push({ x, y, voltage });
      }
    }
    
    return voltageMap;
  }
}

/**
 * Quick simulation function without class instantiation
 * @param {Object} project - Project configuration
 * @returns {Array} Simulation results
 */
export function quickSimulate(project) {
  const runner = new SimulationRunner(project);
  return runner.runAll();
}

export default SimulationRunner;
