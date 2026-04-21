/**
 * KPI Cards with Traffic Light Indicators
 * Professional dashboard-style KPI cards for PDF reports with improved context
 */

import { theme, getTrafficLightColor } from './theme';
import { getIndicatorColor } from './trafficLight';

/**
 * Get context message for KPI value
 * @param {number} value - Current value
 * @param {number} limit - Limit value
 * @param {string} unit - Unit
 * @returns {string} Context message
 */
function getKPIContext(value, limit, unit) {
  const ratio = limit > 0 ? value / limit : 0;
  
  if (ratio < 0.5) {
    return `✔ Dentro de rango óptimo (<${limit} ${unit})`;
  } else if (ratio < 0.8) {
    return `✓ Aceptable (<${limit} ${unit})`;
  } else if (ratio < 1.0) {
    return `⚠ Cerca del límite (${limit} ${unit})`;
  } else {
    return `✖ Excede límite (${limit} ${unit})`;
  }
}

/**
 * Draw KPI cards on PDF document
 * @param {Object} doc - jsPDF document
 * @param {Object} report - Report object with calculations
 * @param {Object} options - Options for layout
 */
export function drawKPICards(doc, report, options = {}) {
  const {
    startY = 40,
    cardWidth = 45,
    cardHeight = 35,
    cardSpacing = 5,
    cardsPerRow = 4
  } = options;

  const calculations = report.results || report.calculations;
  
  const kpis = [
    { 
      label: "Resistencia", 
      value: `${(calculations.Rg || calculations.resistance || 0).toFixed(2)} Ω`,
      val: calculations.Rg || calculations.resistance || 0,
      limit: 5,
      unit: 'Ω'
    },
    { 
      label: "GPR", 
      value: `${(calculations.GPR || calculations.gpr || 0).toFixed(0)} V`,
      val: calculations.GPR || calculations.gpr || 0,
      limit: 5000,
      unit: 'V'
    },
    { 
      label: "Contacto", 
      value: `${(calculations.Em || calculations.touchVoltage || 0).toFixed(0)} V`,
      val: calculations.Em || calculations.touchVoltage || 0,
      limit: calculations.Etouch70 || calculations.touchLimit70 || 0,
      unit: 'V'
    },
    { 
      label: "Paso", 
      value: `${(calculations.Es || calculations.stepVoltage || 0).toFixed(0)} V`,
      val: calculations.Es || calculations.stepVoltage || 0,
      limit: calculations.Estep70 || calculations.stepLimit70 || 0,
      unit: 'V'
    }
  ];

  kpis.forEach((kpi, i) => {
    const row = Math.floor(i / cardsPerRow);
    const col = i % cardsPerRow;
    
    const x = 15 + col * (cardWidth + cardSpacing);
    const y = startY + row * (cardHeight + cardSpacing);
    
    const color = getIndicatorColor(kpi.val, kpi.limit);
    const context = getKPIContext(kpi.val, kpi.limit, kpi.unit);
    
    // Card background
    doc.setFillColor(...theme.bgCard);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');
    
    // Border
    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'S');
    
    // Traffic light indicator circle
    doc.setFillColor(...color);
    doc.circle(x + cardWidth - 8, y + 8, 3, 'F');
    
    // Label
    doc.setTextColor(...theme.textLight);
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    if (kpi.label) doc.text(kpi.label, x + 3, y + 8);
    
    // Value
    doc.setTextColor(...theme.text);
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    if (kpi.value !== undefined && kpi.value !== null) doc.text(kpi.value, x + 3, y + 18);
    
    // Context
    doc.setFontSize(6);
    doc.setTextColor(...color);
    doc.setFont(undefined, 'normal');
    if (context) doc.text(context, x + 3, y + 26);
  });
}

/**
 * Draw large KPI cards (2 per row)
 * @param {Object} doc - jsPDF document
 * @param {Object} report - Report object
 * @param {Object} options - Options
 */
export function drawLargeKPICards(doc, report, options = {}) {
  const {
    startY = 40,
    cardWidth = 90,
    cardHeight = 40,
    cardSpacing = 10,
    cardsPerRow = 2
  } = options;

  const calculations = report.results || report.calculations;
  
  const kpis = [
    { 
      label: "Resistencia de Malla", 
      value: `${(calculations.Rg || calculations.resistance || 0).toFixed(3)} Ω`,
      val: calculations.Rg || calculations.resistance || 0,
      limit: 5,
      unit: 'Ω',
      description: 'Límite: 5 Ω'
    },
    { 
      label: "Elevación de Potencial (GPR)", 
      value: `${(calculations.GPR || calculations.gpr || 0).toFixed(0)} V`,
      val: calculations.GPR || calculations.gpr || 0,
      limit: 5000,
      unit: 'V',
      description: 'Límite: 5000 V'
    },
    { 
      label: "Tensión de Contacto", 
      value: `${(calculations.Em || calculations.touchVoltage || 0).toFixed(1)} V`,
      val: calculations.Em || calculations.touchVoltage || 0,
      limit: calculations.Etouch70 || calculations.touchLimit70 || 0,
      unit: 'V',
      description: `Límite: ${(calculations.Etouch70 || calculations.touchLimit70 || 0).toFixed(1)} V`
    },
    { 
      label: "Tensión de Paso", 
      value: `${(calculations.Es || calculations.stepVoltage || 0).toFixed(1)} V`,
      val: calculations.Es || calculations.stepVoltage || 0,
      limit: calculations.Estep70 || calculations.stepLimit70 || 0,
      unit: 'V',
      description: `Límite: ${(calculations.Estep70 || calculations.stepLimit70 || 0).toFixed(1)} V`
    }
  ];

  kpis.forEach((kpi, i) => {
    const row = Math.floor(i / cardsPerRow);
    const col = i % cardsPerRow;
    
    const x = 15 + col * (cardWidth + cardSpacing);
    const y = startY + row * (cardHeight + cardSpacing);
    
    const color = getIndicatorColor(kpi.val, kpi.limit);
    
    // Card background
    doc.setFillColor(...theme.bgCard);
    doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'F');
    
    // Left border indicator
    doc.setFillColor(...color);
    doc.rect(x, y, 4, cardHeight, 'F');
    
    // Label
    doc.setTextColor(...theme.textLight);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(kpi.label, x + 10, y + 12);
    
    // Value
    doc.setTextColor(...theme.text);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(kpi.value, x + 10, y + 26);
    
    // Description
    doc.setFontSize(8);
    doc.setTextColor(...theme.textLight);
    doc.text(kpi.description, x + 10, y + 35);
  });
}

/**
 * Draw single summary KPI card
 * @param {Object} doc - jsPDF document
 * @param {string} label - Label
 * @param {string} value - Value
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Array} color - RGB color
 */
export function drawSingleKPI(doc, label, value, x, y, color = theme.primary) {
  const cardWidth = 50;
  const cardHeight = 30;
  
  // Card background
  doc.setFillColor(...theme.bgCard);
  doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');
  
  // Border
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'S');
  
  // Label
  doc.setTextColor(...theme.textLight);
  doc.setFontSize(8);
  doc.text(label, x + 3, y + 10);
  
  // Value
  doc.setTextColor(...theme.text);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(value, x + 3, y + 22);
}

export default {
  drawKPICards,
  drawLargeKPICards,
  drawSingleKPI
};
