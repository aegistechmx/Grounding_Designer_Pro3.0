// src/simulation/index.js
// PUNTO DE ENTRADA PARA SIMULACIONES

export { SimulationRunner, quickSimulate } from './SimulationRunner.js';
export { FaultScenarios, createCustomScenario } from './scenarios/FaultScenarios.js';
export { StepVoltageRunner } from './runners/StepVoltageRunner.js';
