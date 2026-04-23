/**
 * Header Section Builder
 * Builds the corporate header for PDF reports
 */

export const buildHeaderSection = (doc, { projectName, clientName, engineer, date, yPos }) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235);
  doc.text('GROUNDING DESIGNER PRO', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Informe Técnico de Puesta a Tierra', pageWidth / 2, yPos, { align: 'center' });
  yPos += 20;

  // Project info
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Proyecto: ${projectName}`, 20, yPos);
  yPos += 7;
  doc.text(`Cliente: ${clientName}`, 20, yPos);
  yPos += 7;
  doc.text(`Ingeniero: ${engineer}`, 20, yPos);
  yPos += 7;
  doc.text(`Fecha: ${new Date(date).toLocaleDateString('es-MX')}`, 20, yPos);
  yPos += 15;

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 15;

  return yPos;
};
