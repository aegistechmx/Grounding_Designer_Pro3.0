/**
 * PDF Layout - Estilos Corporativos ETAP
 * Grounding Designer Pro - Professional PDF Layout
 */

export const COLORS = {
  primary: '#0B3D91',
  accent: '#1E88E5',
  danger: '#D32F2F',
  success: '#2E7D32',
  text: '#1a1a1a',
  gray: '#666'
};

export const drawHeader = (doc, title) => {
  doc
    .fillColor(COLORS.primary)
    .fontSize(18)
    .text('GROUNDING DESIGNER PRO', 50, 40);

  doc
    .fontSize(12)
    .fillColor(COLORS.gray)
    .text(title, 50, 65);

  doc.moveTo(50, 80).lineTo(550, 80).stroke();
};

export const drawFooter = (doc, page) => {
  doc
    .fontSize(8)
    .fillColor('#999')
    .text(`Page ${page}`, 500, 750);
};
