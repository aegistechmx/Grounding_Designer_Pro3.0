/**
 * Compliance Section Builder
 * Builds the compliance analysis section
 */

export const buildComplianceSection = (doc, { calculations, compliance, yPos }) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Section title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('5. Análisis de Cumplimiento', 20, yPos);
  yPos += 10;

  // Compliance details
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  const touchSafe = calculations?.touchSafe70;
  const stepSafe = calculations?.stepSafe70;
  const overallComplies = calculations?.complies;

  // Touch voltage analysis
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Tensión de Contacto:', 20, yPos);
  yPos += 7;

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`• Valor calculado: ${calculations?.Em?.toFixed(0) || 'N/A'} V`, 25, yPos);
  yPos += 5;
  doc.text(`• Valor permisible (70kg): ${calculations?.Etouch70?.toFixed(0) || 'N/A'} V`, 25, yPos);
  yPos += 5;
  doc.text(`• Estado: ${touchSafe ? 'CUMPLE' : 'NO CUMPLE'}`, 25, yPos);
  yPos += 10;

  // Step voltage analysis
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Tensión de Paso:', 20, yPos);
  yPos += 7;

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`• Valor calculado: ${calculations?.Es?.toFixed(0) || 'N/A'} V`, 25, yPos);
  yPos += 5;
  doc.text(`• Valor permisible (70kg): ${calculations?.Estep70?.toFixed(0) || 'N/A'} V`, 25, yPos);
  yPos += 5;
  doc.text(`• Estado: ${stepSafe ? 'CUMPLE' : 'NO CUMPLE'}`, 25, yPos);
  yPos += 10;

  // Overall compliance
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Conclusión:', 20, yPos);
  yPos += 7;

  doc.setFontSize(9);
  if (overallComplies) {
    doc.setTextColor(34, 197, 94);
    doc.text('✓ El diseño CUMPLE con los requisitos de seguridad IEEE Std 80-2013', 25, yPos);
  } else {
    doc.setTextColor(239, 68, 68);
    doc.text('✗ El diseño NO CUMPLE con los requisitos de seguridad IEEE Std 80-2013', 25, yPos);
  }
  yPos += 15;

  return yPos;
};
