/**
 * PDF Utils - Helpers de Formato
 * Grounding Designer Pro - Utility Functions
 */

export const formatNumber = (num) => {
  return Number(num).toFixed(2);
};

export const formatVoltage = (volts) => {
  return `${formatNumber(volts)} V`;
};

export const formatResistance = (ohms) => {
  return `${formatNumber(ohms)} Ω`;
};
