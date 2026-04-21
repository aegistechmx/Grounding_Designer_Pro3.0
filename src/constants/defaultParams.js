export const DEFAULT_PARAMS = {
  // Sistema Eléctrico
  transformerKVA: 75,
  primaryVoltage: 13200,
  secondaryVoltage: 220,
  transformerImpedance: 5,
  faultDuration: 0.35,
  currentDivisionFactor: 0.20,
  
  // Suelo
  soilResistivity: 100,
  surfaceLayer: 10000,
  surfaceDepth: 0.2,
  
  // Malla
  gridLength: 30,
  gridWidth: 16,
  gridDepth: 0.6,
  conductorDiameter: 0.01168,  // 4/0 AWG
  numParallel: 8,
  numParallelY: 8,
  
  // Varillas
  numRods: 8,
  rodLength: 3,
  rodDiameter: 0.015875,
  
  // Proyecto
  projectName: 'Proyecto de Puesta a Tierra',
  projectLocation: 'Puerto Vallarta, Jalisco, México',
  clientName: '',
  engineerName: 'Ingeniero Especialista',
  
  // Material
  materialType: 'COPPER_SOFT',
  
  // Avanzados
  temperature: 20,
  humidity: 'normal',
  measureMonth: new Date().getMonth() + 1,
  region: 'templado'
};

export const PARAM_RANGES = {
  transformerKVA: { min: 1, max: 10000, step: 1, unit: 'kVA' },
  primaryVoltage: { min: 120, max: 50000, step: 100, unit: 'V' },
  secondaryVoltage: { min: 100, max: 1000, step: 10, unit: 'V' },
  transformerImpedance: { min: 1, max: 15, step: 0.5, unit: '%' },
  faultDuration: { min: 0.1, max: 10, step: 0.05, unit: 's' },
  soilResistivity: { min: 1, max: 10000, step: 10, unit: 'Ω·m' },
  surfaceLayer: { min: 100, max: 50000, step: 500, unit: 'Ω·m' },
  surfaceDepth: { min: 0.01, max: 2, step: 0.01, unit: 'm' },
  gridLength: { min: 1, max: 100, step: 1, unit: 'm' },
  gridWidth: { min: 1, max: 100, step: 1, unit: 'm' },
  gridDepth: { min: 0.1, max: 5, step: 0.1, unit: 'm' },
  numParallel: { min: 2, max: 30, step: 1, unit: '' },
  numParallelY: { min: 2, max: 30, step: 1, unit: '' },
  numRods: { min: 0, max: 100, step: 1, unit: '' },
  rodLength: { min: 0.5, max: 10, step: 0.5, unit: 'm' },
  currentDivisionFactor: { min: 0.1, max: 0.8, step: 0.01, unit: '' }
};
