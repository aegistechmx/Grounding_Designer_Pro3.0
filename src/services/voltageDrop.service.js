export const calculateVoltageDrop = (params) => {
  const {
    current,
    distance,
    voltage,
    phaseCount = 3,
    powerFactor = 0.9,
    conductorMaterial = 'Cobre',
    conductorAWG = '4/0',
    conductorsPerPhase = 1
  } = params;
  
  // Validar parámetros para evitar división por cero
  const voltageSafe = Math.max(1, voltage || 220);
  const distanceSafe = distance || 0;
  const currentSafe = current || 0;
  const conductorsPerPhaseSafe = Math.max(1, conductorsPerPhase || 1);
  
  // Resistencia del conductor (Ω/km)
  const resistanceTable = {
    'Cobre': { '4/0': 0.16, '250': 0.14, '300': 0.11, '350': 0.10, '400': 0.09, '500': 0.07 },
    'Aluminio': { '4/0': 0.26, '250': 0.23, '300': 0.18, '350': 0.16, '400': 0.14, '500': 0.11 }
  };
  
  const R = resistanceTable[conductorMaterial]?.[conductorAWG] || 0.16;
  const lengthKm = distanceSafe / 1000;
  const resistanceTotal = R * lengthKm / conductorsPerPhaseSafe;
  
  let voltageDrop = 0;
  if (phaseCount === 1) {
    voltageDrop = 2 * currentSafe * resistanceTotal;
  } else {
    voltageDrop = Math.sqrt(3) * currentSafe * resistanceTotal * powerFactor;
  }
  
  const voltageDropPercent = (voltageDrop / voltageSafe) * 100;
  
  return {
    value: voltageDrop.toFixed(2),
    percent: voltageDropPercent.toFixed(2),
    acceptable: voltageDropPercent <= 3,
    limit: 3
  };
};

export default { calculateVoltageDrop };
