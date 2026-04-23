/**
 * Results Section Builder
 * Builds the IEEE 80 calculation results section
 */

export const buildResultsSection = (doc, { calculations, yPos }) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Section title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('3. Resultados IEEE Std 80-2013', 20, yPos);
  yPos += 10;

  // Results table
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  const results = [
    { label: 'Resistencia de Malla (Rg)', value: `${calculations?.Rg?.toFixed(2) || 'N/A'} Ω`, unit: 'Ω' },
    { label: 'Elevación de Potencial (GPR)', value: `${calculations?.GPR?.toFixed(0) || 'N/A'} V`, unit: 'V' },
    { label: 'Corriente en Malla (Ig)', value: `${calculations?.Ig?.toFixed(0) || 'N/A'} A`, unit: 'A' },
    { label: 'Tensión de Contacto (Em)', value: `${calculations?.Em?.toFixed(0) || 'N/A'} V`, unit: 'V' },
    { label: 'Tensión de Paso (Es)', value: `${calculations?.Es?.toFixed(0) || 'N/A'} V`, unit: 'V' },
    { label: 'Tensión de Contacto Permisible (70kg)', value: `${calculations?.Etouch70?.toFixed(0) || 'N/A'} V`, unit: 'V' },
    { label: 'Tensión de Paso Permisible (70kg)', value: `${calculations?.Estep70?.toFixed(0) || 'N/A'} V`, unit: 'V' }
  ];

  results.forEach(result => {
    doc.text(`${result.label}:`, 20, yPos);
    doc.text(result.value, 80, yPos);
    yPos += 6;
  });

  yPos += 10;

  // Compliance status
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Estado de Cumplimiento:', 20, yPos);
  yPos += 7;

  const touchSafe = calculations?.touchSafe70;
  const stepSafe = calculations?.stepSafe70;
  const overallComplies = calculations?.complies;

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`• Tensión de Contacto: ${touchSafe ? 'CUMPLE' : 'NO CUMPLE'}`, 25, yPos);
  yPos += 5;
  doc.text(`• Tensión de Paso: ${stepSafe ? 'CUMPLE' : 'NO CUMPLE'}`, 25, yPos);
  yPos += 5;
  doc.text(`• Estado General: ${overallComplies ? 'CUMPLE' : 'NO CUMPLE'}`, 25, yPos);
  yPos += 15;

  return yPos;
};
