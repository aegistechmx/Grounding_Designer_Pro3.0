/**
 * Tabla de ampacidades según NOM-001-SEDE-2012
 */

export const ampacityTable = {
  'Cobre': {
    60: { '14': 20, '12': 25, '10': 30, '8': 40, '6': 55, '4': 70, '3': 85, '2': 95, '1': 110, '1/0': 125, '2/0': 145, '3/0': 165, '4/0': 195, '250': 215, '300': 240, '350': 260, '400': 280, '500': 320 },
    75: { '14': 25, '12': 30, '10': 35, '8': 50, '6': 65, '4': 85, '3': 100, '2': 115, '1': 130, '1/0': 150, '2/0': 175, '3/0': 200, '4/0': 230, '250': 255, '300': 285, '350': 310, '400': 335, '500': 380 },
    90: { '14': 30, '12': 40, '10': 45, '8': 60, '6': 80, '4': 100, '3': 115, '2': 135, '1': 155, '1/0': 175, '2/0': 200, '3/0': 230, '4/0': 265, '250': 290, '300': 325, '350': 355, '400': 385, '500': 435 }
  },
  'Aluminio': {
    60: { '14': 15, '12': 20, '10': 25, '8': 30, '6': 40, '4': 55, '3': 65, '2': 75, '1': 85, '1/0': 100, '2/0': 115, '3/0': 130, '4/0': 150, '250': 170, '300': 190, '350': 210, '400': 225, '500': 260 },
    75: { '14': 20, '12': 25, '10': 30, '8': 40, '6': 50, '4': 65, '3': 75, '2': 90, '1': 100, '1/0': 120, '2/0': 135, '3/0': 155, '4/0': 180, '250': 205, '300': 230, '350': 255, '400': 280, '500': 320 },
    90: { '14': 25, '12': 30, '10': 35, '8': 45, '6': 60, '4': 80, '3': 90, '2': 105, '1': 120, '1/0': 140, '2/0': 160, '3/0': 185, '4/0': 210, '250': 235, '300': 265, '350': 290, '400': 320, '500': 365 }
  }
};

export const temperatureFactors = {
  30: 1.00, 31: 0.94, 32: 0.94, 33: 0.94, 34: 0.94, 35: 0.94,
  36: 0.88, 37: 0.88, 38: 0.88, 39: 0.88, 40: 0.88,
  41: 0.82, 42: 0.82, 43: 0.82, 44: 0.82, 45: 0.82,
  46: 0.75, 47: 0.75, 48: 0.75, 49: 0.75, 50: 0.75
};

export const selectConductor = (current, material = 'Cobre', tempRating = 75, ambientTemp = 35, conductorsPerPhase = 1) => {
  const tempFactor = temperatureFactors[Math.floor(ambientTemp)] || 1.00;
  const groupFactor = conductorsPerPhase > 1 ? 0.8 : 1.0;
  const requiredAmpacity = current / (tempFactor * groupFactor);
  
  const table = ampacityTable[material][tempRating];
  let selectedAWG = '4/0';
  let selectedAmpacity = 230;
  
  for (const [awg, amp] of Object.entries(table)) {
    if (amp >= requiredAmpacity) {
      selectedAWG = awg;
      selectedAmpacity = amp;
      break;
    }
  }
  
  return {
    awg: selectedAWG,
    ampacity: selectedAmpacity,
    requiredAmpacity: requiredAmpacity,
    tempFactor,
    groupFactor,
    sufficient: selectedAmpacity >= requiredAmpacity
  };
};

export default { ampacityTable, temperatureFactors, selectConductor };
