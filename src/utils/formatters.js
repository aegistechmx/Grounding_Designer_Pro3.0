// src/utils/formatters.js
export const formatNumber = (value, decimals = 2) => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return Number(value).toFixed(decimals);
};

export const formatCurrency = (value, decimals = 0) => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return `$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

export const formatPercentage = (value, decimals = 1) => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return `${Number(value).toFixed(decimals)}%`;
};

export const formatVoltage = (value, decimals = 0) => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return `${Number(value).toFixed(decimals)} V`;
};

export const formatResistance = (value, decimals = 3) => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return `${Number(value).toFixed(decimals)} Ω`;
};

export const formatCurrent = (value, decimals = 0) => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return `${Number(value).toFixed(decimals)} A`;
};

export const formatPower = (value, decimals = 0) => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  if (value >= 1000) {
    return `${(value / 1000).toFixed(decimals)} kW`;
  }
  return `${value.toFixed(decimals)} W`;
};

export const formatDistance = (value, decimals = 1) => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return `${value.toFixed(decimals)} m`;
};