// src/simulation/SimulationRunner.js
// ORQUESTADOR DE SIMULACIONES - USA CORE + DATA MODEL

import { 
  calcGridResistance, 
  calcSurfaceLayerFactor, 
  allowableTouchVoltage, 
  allowableStepVoltage,
  calcTouchVoltage,
  validateSystem 
} from '../core/ieee80.js';

/**
 * Runner principal de simulación
 * NO contiene UI, NO contiene React
 */
export class SimulationRunner {
  constructor(project) {
    this.project = project;
    this.results = [];
  }

  /**
   * Ejecuta simulación para todos los escenarios
   */
  runAll() {
    const results = [];
    
    for (const scenario of this.project.scenarios) {
      const result = this.runScenario(scenario);
      results.push(result);
    }
    
    this.results = results;
    return results;
  }

  /**
   * Ejecuta simulación para un escenario específico
   */
  runScenario(scenario) {
    const { grid, soil } = this.project;
    
    // Validar datos de entrada
    if (!grid || !soil || !scenario) {
      throw new Error('Datos incompletos para simulación');
    }
    
    // 1. Resistencia de malla
    const Rg = calcGridResistance({
      soilResistivity: soil.resistivity,
      gridArea: grid.area,
      totalConductorLength: grid.totalConductorLength,
      burialDepth: grid.depth,
      numRods: grid.numRods,
      rodLength: grid.rodLength
    });
    
    // 2. Corriente de malla y GPR
    const currentSafe = Math.max(0.1, scenario.current || 0);
    const divisionFactorSafe = Math.max(0.1, scenario.divisionFactor || 0.2);
    const Ig = scenario.Ig || (currentSafe * divisionFactorSafe);
    const { GPR: gpr, Em: em } = calcTouchVoltage({ faultCurrent: Ig, Rg });
    
    // 3. Factor de capa superficial
    const Cs = calcSurfaceLayerFactor({
      soilResistivity: soil.resistivity,
      surfaceResistivity: soil.surfaceResistivity,
      surfaceDepth: soil.surfaceDepth
    });
    
    // 4. Tensiones tolerables
    const Etouch70 = allowableTouchVoltage({
      surfaceResistivity: soil.surfaceResistivity,
      Cs: Cs,
      faultDuration: scenario.duration,
      bodyWeight: 70
    });
    
    const Estep70 = allowableStepVoltage({
      surfaceResistivity: soil.surfaceResistivity,
      Cs: Cs,
      faultDuration: scenario.duration,
      bodyWeight: 70
    });
    
    // 5. Tensiones reales (aproximación práctica)
    const Em = gpr * 0.18;
    const Es = gpr * 0.10;
    
    // 6. Verificación de cumplimiento
    const validation = validateSystem({
      faultCurrent: Ig,
      Rg,
      soilResistivity: soil.resistivity,
      surfaceResistivity: soil.surfaceResistivity,
      surfaceDepth: soil.surfaceDepth,
      faultDuration: scenario.duration,
      bodyWeight: 70
    });
    
    return {
      scenarioId: scenario.id,
      timestamp: new Date().toISOString(),
      Rg,
      GPR: gpr,
      Ig,
      Cs,
      Em,
      Es,
      Etouch70,
      Estep70,
      ...validation
    };
  }

  /**
   * Simula tensión de paso en un punto específico
   */
  simulateStepVoltageAtPoint(x, y, scenario) {
    const { grid, soil } = this.project;
    const gridLength = Math.max(1, grid?.length || 30);
    const gridWidth = Math.max(1, grid?.width || 16);
    const Rg = calcGridResistance({
      soilResistivity: soil?.resistivity || 100,
      gridArea: grid?.area || 1,
      totalConductorLength: grid?.totalConductorLength || 0,
      burialDepth: grid?.depth || 0.6
    });
    const Ig = scenario.Ig || scenario.current * scenario.divisionFactor;
    const { GPR: gpr } = calcTouchVoltage({ faultCurrent: Ig, Rg });
    
    // Decaimiento de tensión con distancia
    const centerX = gridLength / 2;
    const centerY = gridWidth / 2;
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    const maxDistance = Math.max(gridLength, gridWidth) / 2;
    
    let voltage = gpr * (1 - distance / maxDistance);
    voltage = Math.max(0, voltage);
    
    return voltage;
  }

  /**
   * Simula tensión de contacto en un punto específico
   */
  simulateTouchVoltageAtPoint(x, y, scenario) {
    const stepVoltage = this.simulateStepVoltageAtPoint(x, y, scenario);
    // Tensión de contacto ≈ 60-80% de tensión de paso
    return stepVoltage * 0.7;
  }

  /**
   * Genera mapa de tensiones para toda la malla
   */
  generateVoltageMap(resolution = 20) {
    const { grid } = this.project;
    const scenario = this.project.scenarios?.[0];
    if (!scenario) return [];
    
    const gridLength = Math.max(1, grid?.length || 30);
    const gridWidth = Math.max(1, grid?.width || 16);
    const resolutionSafe = Math.max(1, resolution || 20);
    
    const map = [];
    const stepX = gridLength / resolutionSafe;
    const stepY = gridWidth / resolutionSafe;
    
    for (let i = 0; i <= resolutionSafe; i++) {
      for (let j = 0; j <= resolutionSafe; j++) {
        const x = i * stepX;
        const y = j * stepY;
        const voltage = this.simulateStepVoltageAtPoint(x, y, scenario);
        map.push({ x, y, voltage });
      }
    }
    
    return map;
  }
}

/**
 * Función rápida para simular sin instanciar clase
 */
export function quickSimulate(project) {
  const runner = new SimulationRunner(project);
  return runner.runAll();
}

export default SimulationRunner;
