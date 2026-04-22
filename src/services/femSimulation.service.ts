// src/services/femSimulation.service.ts
// Servicio que conecta el frontend con el backend FEM

export interface FEMInput {
  grid: {
    length: number;
    width: number;
    depth: number;
    nx: number;
    ny: number;
    rodLength: number;
    numRods: number;
  };
  soil: {
    resistivity: number;
    surfaceResistivity: number;
    surfaceDepth: number;
    moisture: number;
  };
  fault: {
    current: number;
    duration: number;
    divisionFactor: number;
  };
  voltageLevel: number;
}

export interface FEMResult {
  Rg: number;
  GPR: number;
  Ig: number;
  Em: number;
  Es: number;
  Etouch50: number;
  Etouch70: number;
  Estep50: number;
  Estep70: number;
  touchSafe: boolean;
  stepSafe: boolean;
  complies: boolean;
  voltageField?: number[];
  executionTime?: number;
}

export const femSimulationService = {
  /**
   * Ejecuta simulación FEM vía API
   */
  async runSimulation(input: FEMInput): Promise<FEMResult> {
    const response = await fetch('/api/simulation/fem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    return response.json();
  },
  
  /**
   * Ejecuta simulación local (para desarrollo sin backend)
   */
  runLocalSimulation(input: FEMInput): FEMResult {
    console.log('🔹 Ejecutando simulación FEM local...');
    const startTime = performance.now();
    
    // Calcular área y perímetro con protección contra división por cero
    const gridLength = Math.max(1, input.grid.length || 30);
    const gridWidth = Math.max(1, input.grid.width || 16);
    const area = gridLength * gridWidth;
    const perimeter = 2 * (gridLength + gridWidth);
    
    // Longitud total de conductores
    const nx = Math.max(1, input.grid.nx || 8);
    const ny = Math.max(1, input.grid.ny || 8);
    const totalConductorLength = perimeter * Math.max(nx, ny);
    const totalRodLength = (input.grid.numRods || 0) * (input.grid.rodLength || 0);
    const LT = Math.max(0.1, totalConductorLength + totalRodLength);
    
    // Resistencia de malla (IEEE 80)
    const soilResistivity = input.soil?.resistivity || 100;
    const gridDepth = Math.max(0.1, input.grid.depth || 0.6);
    const Rg = soilResistivity * (1/LT + 1/Math.sqrt(20 * area)) * 
               (1 + 1/(1 + gridDepth * Math.sqrt(20 / area)));
    
    // Corrientes
    const faultCurrent = input.fault?.current || 0;
    const divisionFactor = input.fault?.divisionFactor || 0.5;
    const Ig = faultCurrent * divisionFactor;
    const GPR = Ig * Rg;
    
    // Factor de capa superficial con protección
    const surfaceResistivity = Math.max(1, input.soil?.surfaceResistivity || 10000);
    const surfaceDepth = Math.max(0.01, input.soil?.surfaceDepth || 0.2);
    const Cs = 1 - (0.09 * (1 - soilResistivity / surfaceResistivity)) /
               (2 * surfaceDepth + 0.09);
    
    // Límites IEEE 80 (70 kg) con protección contra división por cero
    const k70 = 0.157;
    const k50 = 0.116;
    const faultDuration = Math.max(0.1, input.fault?.duration || 0.35);
    const Etouch70 = (1000 + 1.5 * Cs * surfaceResistivity) * (k70 / Math.sqrt(faultDuration));
    const Estep70 = (1000 + 6 * Cs * surfaceResistivity) * (k70 / Math.sqrt(faultDuration));
    const Etouch50 = (1000 + 1.5 * Cs * surfaceResistivity) * (k50 / Math.sqrt(faultDuration));
    const Estep50 = (1000 + 6 * Cs * surfaceResistivity) * (k50 / Math.sqrt(faultDuration));
    
    // Tensiones reales (aproximación FEM)
    const Em = GPR * 0.18;
    const Es = GPR * 0.10;
    
    const endTime = performance.now();
    
    return {
      Rg,
      GPR,
      Ig,
      Em,
      Es,
      Etouch50,
      Etouch70,
      Estep50,
      Estep70,
      touchSafe: Em <= Etouch70,
      stepSafe: Es <= Estep70,
      complies: Em <= Etouch70 && Es <= Estep70,
      executionTime: endTime - startTime
    };
  }
};
