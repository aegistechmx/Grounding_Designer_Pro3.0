/**
 * Executive Summary Builder
 * Builds the executive summary section
 */

export const buildExecutiveSummary = (doc, { calculations, compliance, yPos }) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Section title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('1. Resumen Ejecutivo', 20, yPos);
  yPos += 10;

  // Summary content
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  const summary = `Este informe presenta el análisis técnico del sistema de puesta a tierra 
según la norma IEEE Std 80-2013. El diseño ha sido evaluado para garantizar 
la seguridad del personal y equipos.`;

  const lines = doc.splitTextToSize(summary, pageWidth - 40);
  doc.text(lines, 20, yPos);
  yPos += lines.length * 5 + 10;

  // Key metrics
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Métricas Clave:', 20, yPos);
  yPos += 7;

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`• Resistencia de Malla: ${calculations?.Rg?.toFixed(2) || 'N/A'} Ω`, 25, yPos);
  yPos += 5;
  doc.text(`• GPR: ${calculations?.GPR?.toFixed(0) || 'N/A'} V`, 25, yPos);
  yPos += 5;
  doc.text(`• Estado de Cumplimiento: ${compliance?.complies ? 'CUMPLE' : 'NO CUMPLE'}`, 25, yPos);
  yPos += 15;

  return yPos;
};
