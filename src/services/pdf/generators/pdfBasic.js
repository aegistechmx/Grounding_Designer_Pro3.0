/**
 * Basic PDF Generator
 * Simple PDF generation for basic reports
 */

import jsPDF from 'jspdf';

export const generateBasicPDF = async (data) => {
  const { calculations, params, projectName = 'Project' } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  let yPos = 20;

  // Title
  doc.setFontSize(20);
  doc.text('Grounding Design Report', 105, yPos, { align: 'center' });
  yPos += 15;

  doc.setFontSize(12);
  doc.text(projectName, 105, yPos, { align: 'center' });
  yPos += 20;

  // Results
  doc.setFontSize(14);
  doc.text('Results', 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.text(`Grid Resistance (Rg): ${calculations?.Rg?.toFixed(2) || 'N/A'} Ω`, 20, yPos);
  yPos += 7;
  doc.text(`GPR: ${calculations?.GPR?.toFixed(0) || 'N/A'} V`, 20, yPos);
  yPos += 7;
  doc.text(`Touch Voltage (Em): ${calculations?.Em?.toFixed(0) || 'N/A'} V`, 20, yPos);
  yPos += 7;
  doc.text(`Step Voltage (Es): ${calculations?.Es?.toFixed(0) || 'N/A'} V`, 20, yPos);
  yPos += 7;
  doc.text(`Compliance: ${calculations?.complies ? 'PASS' : 'FAIL'}`, 20, yPos);

  return doc;
};
