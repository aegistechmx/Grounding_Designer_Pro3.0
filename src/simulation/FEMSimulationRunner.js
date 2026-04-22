// src/simulation/FEMSimulationRunner.js
// Integración del FEM Engine con el sistema existente

import { FEMAssembler } from '../engine/fem/FEMAssembler.js';
import MultiLayerSoilModel from '../engine/soil/MultiLayerSoilModel.js';

export class FEMSimulationRunner {
  constructor(project, options = {}) {
    this.project = project;
    this.options = options;
    this.femAssembler = null;
  }

  /**
   * Ejecuta simulación FEM
   */
  async run() {
    // Configurar modelo de suelo multicapa
    const soilModel = MultiLayerSoilModel.fromIEEE80Params(
      this.project.soil.resistivity,
      this.project.soil.surfaceResistivity,
      this.project.soil.surfaceDepth
    );
    
    // Inicializar FEM Assembler
    this.femAssembler = new FEMAssembler({
      resolution: this.options.resolution || 0.5,
      solverTolerance: this.options.tolerance || 1e-8,
      maxIterations: this.options.maxIterations || 1000,
      soilModel
    });
    
    // Ejecutar simulación
    const results = await this.femAssembler.runSimulation(this.project);
    
    // Mapear resultados al formato esperado por el sistema
    return this.mapResultsToFormat(results);
  }

  /**
   * Mapea resultados FEM al formato existente
   */
  mapResultsToFormat(femResults) {
    const scenario = this.project.scenarios?.[0];
    
    if (!scenario) {
      throw new Error('No hay escenarios disponibles en el proyecto');
    }
    
    // Encontrar tensión máxima de paso y contacto
    const stepVoltageMap = femResults.stepVoltageMap || [];
    const touchVoltageMap = femResults.touchVoltageMap || [];
    const maxStepVoltage = stepVoltageMap.length > 0 ? Math.max(...stepVoltageMap.map(s => s.value)) : 0;
    const maxTouchVoltage = touchVoltageMap.length > 0 ? Math.max(...touchVoltageMap.map(t => t.value)) : 0;
    
    // Calcular límites tolerables (IEEE 80)
    const soilResistivity = this.project.soil?.resistivity || 100;
    const surfaceResistivity = Math.max(1, this.project.soil?.surfaceResistivity || 10000);
    const surfaceDepth = Math.max(0.01, this.project.soil?.surfaceDepth || 0.2);
    const duration = Math.max(0.1, scenario.duration || 0.35);
    
    const Cs = 1 - (0.09 * (1 - soilResistivity / surfaceResistivity)) /
               (2 * surfaceDepth + 0.09);
    
    const Etouch70 = (1000 + 1.5 * Cs * surfaceResistivity) *
                     (0.157 / Math.sqrt(duration));
    const Estep70 = (1000 + 6 * Cs * surfaceResistivity) *
                    (0.157 / Math.sqrt(duration));
    
    return {
      Rg: femResults.groundResistance,
      GPR: Math.max(...femResults.voltageField),
      Em: maxTouchVoltage,
      Es: maxStepVoltage,
      Etouch70,
      Estep70,
      touchOk: maxTouchVoltage <= Etouch70,
      stepOk: maxStepVoltage <= Estep70,
      complies: maxTouchVoltage <= Etouch70 && maxStepVoltage <= Estep70,
      voltageField: femResults.voltageField,
      nodes: femResults.nodes,
      elements: femResults.elements,
      executionTime: femResults.executionTime,
      iterations: femResults.iterations
    };
  }
}

export default FEMSimulationRunner;
