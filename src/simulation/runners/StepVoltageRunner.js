// src/simulation/runners/StepVoltageRunner.js
// CÁLCULO ESPECÍFICO DE TENSIÓN DE PASO

import { calcGridResistance, calcTouchVoltage } from '../../core/ieee80.js';

export class StepVoltageRunner {
  constructor(project) {
    this.project = project;
  }

  /**
   * Calcula perfil de tensión de paso en toda la malla
   */
  calculateProfile(resolution = 30) {
    const { grid, soil } = this.project;
    const scenario = this.project.scenarios[0];
    
    if (!scenario) return [];
    
    const Rg = calcGridResistance({
      soilResistivity: soil.resistivity,
      gridArea: grid.area,
      totalConductorLength: grid.totalConductorLength,
      burialDepth: grid.depth
    });
    const Ig = scenario.Ig || scenario.current * scenario.divisionFactor;
    const { GPR: gpr } = calcTouchVoltage({ faultCurrent: Ig, Rg });
    
    const profile = [];
    const stepX = grid.length / resolution;
    const stepY = grid.width / resolution;
    
    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const x = i * stepX;
        const y = j * stepY;
        
        // Distancia al centro
        const centerX = grid.length / 2;
        const centerY = grid.width / 2;
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        const maxDistance = Math.max(grid.length, grid.width) / 2;
        
        // Decaimiento exponencial
        let voltage = gpr * Math.exp(-3 * distance / maxDistance);
        voltage = Math.max(0, Math.min(voltage, gpr));
        
        profile.push({ x, y, voltage });
      }
    }
    
    return profile;
  }

  /**
   * Encuentra el punto de máxima tensión de paso
   */
  findMaxStepVoltage() {
    const profile = this.calculateProfile(50);
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
   * Verifica si la tensión de paso es segura
   */
  isStepVoltageSafe() {
    const { maxVoltage } = this.findMaxStepVoltage();
    const { soil } = this.project;
    const scenario = this.project.scenarios[0];
    
    const Cs = 1 - (0.09 * (1 - soil.resistivity / soil.surfaceResistivity)) / 
               (2 * soil.surfaceDepth + 0.09);
    const tolerable = (1000 + 6 * Cs * soil.surfaceResistivity) * (0.157 / Math.sqrt(scenario.duration));
    
    return {
      safe: maxVoltage <= tolerable,
      maxVoltage,
      tolerable,
      margin: ((tolerable - maxVoltage) / tolerable) * 100
    };
  }
}

export default StepVoltageRunner;
