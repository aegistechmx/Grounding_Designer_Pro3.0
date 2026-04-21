// src/data/viakonData.js
// Datos basados en catálogo Viakon y NOM-001-SEDE-2012

export const CONDUCTOR_TABLE = {
  COPPER: {
    '75°C': {
      '6 AWG': { area: 13.3, ampacity: 55, diameter: 7.72 },
      '4 AWG': { area: 21.2, ampacity: 70, diameter: 8.94 },
      '2 AWG': { area: 33.6, ampacity: 95, diameter: 10.5 },
      '1/0 AWG': { area: 53.5, ampacity: 125, diameter: 13.5 },
      '2/0 AWG': { area: 67.4, ampacity: 145, diameter: 14.7 },
      '3/0 AWG': { area: 85.0, ampacity: 165, diameter: 16.0 },
      '4/0 AWG': { area: 107.2, ampacity: 195, diameter: 17.5 },
      '250 kcmil': { area: 127.0, ampacity: 215, diameter: 19.4 },
      '300 kcmil': { area: 152.0, ampacity: 240, diameter: 20.8 },
      '350 kcmil': { area: 177.0, ampacity: 260, diameter: 22.1 },
      '400 kcmil': { area: 203.0, ampacity: 280, diameter: 23.3 },
      '500 kcmil': { area: 253.0, ampacity: 320, diameter: 25.5 },
      '600 kcmil': { area: 304.0, ampacity: 355, diameter: 28.3 },
      '750 kcmil': { area: 380.0, ampacity: 400, diameter: 30.9 },
      '1000 kcmil': { area: 507.0, ampacity: 455, diameter: 34.8 }
    },
    '90°C': {
      '6 AWG': { area: 13.3, ampacity: 75, diameter: 7.72 },
      '4 AWG': { area: 21.2, ampacity: 95, diameter: 8.94 },
      '2 AWG': { area: 33.6, ampacity: 130, diameter: 10.5 },
      '1/0 AWG': { area: 53.5, ampacity: 170, diameter: 13.5 },
      '2/0 AWG': { area: 67.4, ampacity: 195, diameter: 14.7 },
      '3/0 AWG': { area: 85.0, ampacity: 225, diameter: 16.0 },
      '4/0 AWG': { area: 107.2, ampacity: 260, diameter: 17.5 },
      '250 kcmil': { area: 127.0, ampacity: 290, diameter: 19.4 },
      '300 kcmil': { area: 152.0, ampacity: 320, diameter: 20.8 },
      '350 kcmil': { area: 177.0, ampacity: 350, diameter: 22.1 },
      '400 kcmil': { area: 203.0, ampacity: 380, diameter: 23.3 },
      '500 kcmil': { area: 253.0, ampacity: 430, diameter: 25.5 },
      '600 kcmil': { area: 304.0, ampacity: 475, diameter: 28.3 },
      '750 kcmil': { area: 380.0, ampacity: 520, diameter: 30.9 },
      '1000 kcmil': { area: 507.0, ampacity: 580, diameter: 34.8 }
    }
  },
  ALUMINUM: {
    '75°C': {
      '6 AWG': { area: 13.3, ampacity: 40, diameter: 7.72 },
      '4 AWG': { area: 21.2, ampacity: 55, diameter: 8.94 },
      '2 AWG': { area: 33.6, ampacity: 75, diameter: 10.5 },
      '1/0 AWG': { area: 53.5, ampacity: 100, diameter: 13.5 },
      '2/0 AWG': { area: 67.4, ampacity: 115, diameter: 14.7 },
      '3/0 AWG': { area: 85.0, ampacity: 130, diameter: 16.0 },
      '4/0 AWG': { area: 107.2, ampacity: 155, diameter: 17.5 },
      '250 kcmil': { area: 127.0, ampacity: 170, diameter: 19.4 },
      '300 kcmil': { area: 152.0, ampacity: 190, diameter: 20.8 },
      '350 kcmil': { area: 177.0, ampacity: 210, diameter: 22.1 },
      '400 kcmil': { area: 203.0, ampacity: 225, diameter: 23.3 },
      '500 kcmil': { area: 253.0, ampacity: 260, diameter: 25.5 }
    }
  }
};

export const TEMP_CORRECTION_FACTORS = {
  '31-35': 0.94,
  '36-40': 0.88,
  '41-45': 0.82,
  '46-50': 0.75,
  '51-55': 0.67,
  '56-60': 0.58,
  '61-70': 0.33
};

export const GROUPING_FACTORS = {
  1: 1.00,
  2: 0.80,
  3: 0.70,
  4: 0.65,
  5: 0.60,
  6: 0.55,
  7: 0.50,
  8: 0.45,
  9: 0.40
};

export const CONDUIT_SIZES = {
  'PVC Pesado': {
    '16 (1/2")': { diameter: 21.3, area: 78.91 },
    '21 (3/4")': { diameter: 26.7, area: 132.35 },
    '27 (1")': { diameter: 33.4, area: 217.75 },
    '35 (1-1/4")': { diameter: 42.2, area: 358.38 },
    '41 (1-1/2")': { diameter: 48.3, area: 466.59 },
    '53 (2")': { diameter: 60.3, area: 739.10 },
    '63 (2-1/2")': { diameter: 73.0, area: 1070.36 },
    '78 (3")': { diameter: 88.9, area: 1642.80 },
    '91 (3-1/2")': { diameter: 101.6, area: 1913.70 },
    '103 (4")': { diameter: 114.3, area: 3285.20 },
    '129 (5")': { diameter: 139.7, area: 3872.10 },
    '155 (6")': { diameter: 168.3, area: 5591.70 }
  },
  'Metalico Pesado': {
    '16 (1/2")': { diameter: 15.8, area: 58.8 },
    '21 (3/4")': { diameter: 20.9, area: 103.2 },
    '27 (1")': { diameter: 26.6, area: 167.1 },
    '35 (1-1/4")': { diameter: 35.1, area: 289.5 },
    '41 (1-1/2")': { diameter: 40.9, area: 393.9 },
    '53 (2")': { diameter: 52.5, area: 649.5 },
    '63 (2-1/2")': { diameter: 62.7, area: 926.7 },
    '78 (3")': { diameter: 77.9, area: 1428.3 },
    '91 (3-1/2")': { diameter: 90.1, area: 1913.7 },
    '103 (4")': { diameter: 102.3, area: 3285.2 }
  }
};

export const GROUNDING_TABLE = {
  '15': '14 AWG',
  '20': '12 AWG',
  '30': '10 AWG',
  '40': '10 AWG',
  '60': '10 AWG',
  '100': '8 AWG',
  '200': '6 AWG',
  '300': '4 AWG',
  '400': '3 AWG',
  '500': '2 AWG',
  '600': '1 AWG',
  '800': '1/0 AWG',
  '1000': '2/0 AWG',
  '1200': '3/0 AWG',
  '1600': '4/0 AWG',
  '2000': '250 kcmil',
  '2500': '350 kcmil',
  '3000': '400 kcmil',
  '4000': '500 kcmil',
  '5000': '700 kcmil',
  '6000': '800 kcmil'
};