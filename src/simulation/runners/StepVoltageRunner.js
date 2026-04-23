// src/simulation/runners/StepVoltageRunner.js
// Specific step voltage calculation

import { calcGridResistance, calcTouchVoltage } from '../../core/ieee80.js';

const DEFAULT_RESOLUTION = 30;
const HIGH_RESOLUTION = 50;
const DECAY_FACTOR = 3;
const DEFAULT_BODY_WEIGHT = 70;
const SURFACE_FACTOR_COEFFICIENT = 0.09;
const TOLERABLE_VOLTAGE_COEFFICIENT = 1000;
const TOLERABLE_VOLTAGE_MULTIPLIER = 6;
const TOLERABLE_VOLTAGE_DIVISOR = 0.157;

export class StepVoltageRunner {
  constructor(project) {
    this.project = project;
  }

  /**
   * Calculates step voltage profile across entire grid
   * @param {number} resolution - Grid resolution
   * @returns {Array} Array of voltage points
   */
  calculateProfile(resolution = DEFAULT_RESOLUTION) {
    const { grid, soil } = this.project;
    const scenario = this.project.scenarios[0];
    
    if (!scenario) return [];
    
    const gridResistance = this.calculateGridResistance(grid, soil);
    const gridCurrent = this.calculateGridCurrent(scenario);
    const { GPR: groundPotentialRise } = calcTouchVoltage({ faultCurrent: gridCurrent, Rg: gridResistance });
    
    return this.generateVoltageProfile(grid, groundPotentialRise, resolution);
  }

  /**
   * Calculates grid resistance
   */
  calculateGridResistance(grid, soil) {
    return calcGridResistance({
      soilResistivity: soil.resistivity,
      gridArea: grid.area,
      totalConductorLength: grid.totalConductorLength,
      burialDepth: grid.depth
    });
  }

  /**
   * Calculates grid current
   */
  calculateGridCurrent(scenario) {
    return scenario.Ig ?? scenario.current * scenario.divisionFactor;
  }

  /**
   * Generates voltage profile grid
   */
  generateVoltageProfile(grid, groundPotentialRise, resolution) {
    const profile = [];
    const stepX = grid.length / resolution;
    const stepY = grid.width / resolution;
    
    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const x = i * stepX;
        const y = j * stepY;
        const voltage = this.calculateVoltageAtPoint(x, y, grid, groundPotentialRise);
        profile.push({ x, y, voltage });
      }
    }
    
    return profile;
  }

  /**
   * Calculates voltage at a specific point with exponential decay
   */
  calculateVoltageAtPoint(x, y, grid, groundPotentialRise) {
    const distance = this.calculateDistanceFromCenter(x, y, grid);
    const maxDistance = Math.max(grid.length, grid.width) / 2;
    
    let voltage = groundPotentialRise * Math.exp(-DECAY_FACTOR * distance / maxDistance);
    return Math.max(0, Math.min(voltage, groundPotentialRise));
  }

  /**
   * Calculates distance from grid center
   */
  calculateDistanceFromCenter(x, y, grid) {
    const centerX = grid.length / 2;
    const centerY = grid.width / 2;
    return Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
  }

  /**
   * Finds point of maximum step voltage
   * @returns {Object} Maximum voltage and location
   */
  findMaxStepVoltage() {
    const profile = this.calculateProfile(HIGH_RESOLUTION);
    return this.findMaximumVoltagePoint(profile);
  }

  /**
   * Finds maximum voltage point in profile
   */
  findMaximumVoltagePoint(profile) {
    let maxVoltage = 0;
    let maxPoint = null;
    
    for (const point of profile) {
      if (point.voltage > maxVoltage) {
        maxVoltage = point.voltage;
        maxPoint = point;
      }
    }
    
    return { maxVoltage, location: maxPoint };
  }

  /**
   * Verifies if step voltage is safe
   * @returns {Object} Safety assessment
   */
  isStepVoltageSafe() {
    const { maxVoltage } = this.findMaxStepVoltage();
    const { soil } = this.project;
    const scenario = this.project.scenarios[0];
    
    const surfaceLayerFactor = this.calculateSurfaceLayerFactor(soil);
    const tolerableVoltage = this.calculateTolerableVoltage(surfaceLayerFactor, soil, scenario);
    const safetyMargin = this.calculateSafetyMargin(tolerableVoltage, maxVoltage);
    
    return {
      safe: maxVoltage <= tolerableVoltage,
      maxVoltage,
      tolerable: tolerableVoltage,
      margin: safetyMargin
    };
  }

  /**
   * Calculates surface layer factor
   */
  calculateSurfaceLayerFactor(soil) {
    return 1 - (SURFACE_FACTOR_COEFFICIENT * (1 - soil.resistivity / soil.surfaceResistivity)) / 
               (2 * soil.surfaceDepth + SURFACE_FACTOR_COEFFICIENT);
  }

  /**
   * Calculates tolerable voltage per IEEE 80
   */
  calculateTolerableVoltage(surfaceLayerFactor, soil, scenario) {
    return (TOLERABLE_VOLTAGE_COEFFICIENT + TOLERABLE_VOLTAGE_MULTIPLIER * surfaceLayerFactor * soil.surfaceResistivity) * 
           (TOLERABLE_VOLTAGE_DIVISOR / Math.sqrt(scenario.duration));
  }

  /**
   * Calculates safety margin percentage
   */
  calculateSafetyMargin(tolerableVoltage, actualVoltage) {
    return ((tolerableVoltage - actualVoltage) / tolerableVoltage) * 100;
  }
}

export default StepVoltageRunner;
