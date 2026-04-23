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

/**
 * Draw corporate cover page
 * @param {PDFDocument} doc - PDFKit document
 * @param {Object} params - Project parameters
 */
export const drawCover = (doc, params) => {
  // Dark blue background
  doc.rect(0, 0, 595, 842).fill('#0f172a');

  // White text - Title
  doc.fillColor('#ffffff')
    .fontSize(24)
    .text('GROUNDING SYSTEM ANALYSIS REPORT', 50, 200, { align: 'center' });

  doc.moveDown();

  // Project information
  doc.fontSize(12)
    .text(`Project: ${params.projectName || 'N/A'}`, 50, 260)
    .text(`Client: ${params.clientName || 'N/A'}`, 50, 280)
    .text(`Engineer: ${params.engineer || 'N/A'}`, 50, 300)
    .text(`Date: ${new Date().toLocaleDateString()}`, 50, 320);

  // Add decorative line
  doc.moveTo(50, 350)
    .lineTo(545, 350)
    .lineWidth(2)
    .stroke('#1E88E5');

  // Engineering standards
  doc.fontSize(12)
    .fillColor('#94a3b8')
    .text('Standard: IEEE 80', 50, 380)
    .text('Grounding System Safety Analysis', 50, 400);

  // Add company logo placeholder
  doc.fontSize(10)
    .fillColor('#64748b')
    .text('Grounding Designer Pro', 50, 750);
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
