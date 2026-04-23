/**
 * ETAP-Style Vector PDF Export Service
 * Professional engineering PDF export with vector contours
 * Grounding Designer Pro - Professional Engineering Visualization
 */

const PDFDocument = require('pdfkit');
const { getContourStyle, getETAPColor } = require('./etapContour.service.js');

/**
 * Generate vector PDF with ETAP-style contours
 * @param {Array} contours - Array of contour lines with level and segments
 * @param {Object} options - PDF generation options
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateVectorPDF(contours, options = {}) {
  const {
    width = 595.28, // A4 width in points
    height = 841.89, // A4 height in points
    margin = 50,
    baseStep = 100,
    majorStep = 500,
    showLabels = true,
    labelStep = 500,
    title = 'Grounding Grid Analysis',
    minValue = 0,
    maxValue = 1000
  } = options;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: margin, bottom: margin, left: margin, right: margin }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Draw title
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text(title, { align: 'center' });
      doc.moveDown();

      // Calculate drawing area
      const drawWidth = width - 2 * margin;
      const drawHeight = height - 2 * margin - 100; // Reserve space for legend

      // Draw contours as vector paths
      contours.forEach(({ level, segments }) => {
        const style = getContourStyle(level, baseStep, majorStep);
        const roundedLevel = Math.round(level);

        // Set line properties
        doc.lineWidth(style.width * 0.5); // Scale down for PDF
        doc.strokeColor(`rgba(0, 0, 0, ${style.alpha})`);

        segments.forEach(seg => {
          if (!seg || seg.length < 2) return;

          doc.moveTo(seg[0].x, seg[0].y);
          for (let i = 1; i < seg.length; i++) {
            doc.lineTo(seg[i].x, seg[i].y);
          }
        });

        doc.stroke();

        // Draw labels on major contours
        if (showLabels && roundedLevel % labelStep === 0) {
          drawPDFLabels(doc, segments, roundedLevel, style);
        }
      });

      // Draw legend
      drawPDFLegend(doc, margin, height - margin - 80, drawWidth, 80, minValue, maxValue);

      // Add metadata
      doc.fontSize(9)
         .font('Helvetica')
         .text(`Generated: ${new Date().toLocaleString()}`, margin, height - 20);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Draw rotated labels on PDF contours
 * @param {PDFDocument} doc - PDFKit document
 * @param {Array} segments - Contour segments
 * @param {number} level - Voltage level
 * @param {Object} style - Contour style
 */
function drawPDFLabels(doc, segments, level, style) {
  const fontSize = 8;

  segments.forEach(seg => {
    if (!seg || seg.length < 10) return;

    const mid = Math.floor(seg.length / 2);
    const midPoint = seg[mid];
    const nextPoint = seg[mid + 1];

    if (!midPoint || !nextPoint) return;

    // Calculate angle
    const angle = Math.atan2(nextPoint.y - midPoint.y, nextPoint.x - midPoint.x);

    // Save current state
    doc.save();

    // Translate and rotate
    doc.translate(midPoint.x, midPoint.y);
    doc.rotate(angle * 180 / Math.PI); // Convert to degrees

    // Draw label
    const label = `${level} V`;
    doc.fontSize(fontSize)
       .fillColor('black')
       .text(label, 5, -fontSize / 2);

    // Restore state
    doc.restore();
  });
}

/**
 * Draw ETAP-style legend on PDF
 * @param {PDFDocument} doc - PDFKit document
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Legend width
 * @param {number} height - Legend height
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 */
function drawPDFLegend(doc, x, y, width, height, min, max) {
  const numTicks = 5;
  const barWidth = 20;

  // Draw gradient bar
  for (let i = 0; i < height; i++) {
    const t = 1 - i / height;
    const color = getETAPColor(t);
    
    // Convert RGB to hex
    const rgb = color.match(/\d+/g);
    const hex = '#' + rgb.map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    
    doc.fillColor(hex)
       .rect(x, y + i, barWidth, 1)
       .fill();
  }

  // Draw border
  doc.strokeColor('black')
     .lineWidth(0.5)
     .rect(x, y, barWidth, height)
     .stroke();

  // Draw ticks and labels
  doc.fontSize(9)
     .fillColor('black')
     .font('Helvetica');

  for (let i = 0; i <= numTicks; i++) {
    const t = i / numTicks;
    const val = min + (1 - t) * (max - min);
    const py = y + t * height;

    // Draw tick mark
    doc.moveTo(x + barWidth, py)
       .lineTo(x + barWidth + 5, py)
       .stroke();

    // Draw label
    doc.text(`${Math.round(val)} V`, x + barWidth + 10, py - 3);
  }

  // Draw title
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text('Voltage (V)', x, y - 12);
}

/**
 * Generate multi-page PDF with multiple contour sets
 * @param {Array} contourSets - Array of contour sets with titles
 * @param {Object} options - PDF generation options
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateMultiPagePDF(contourSets, options = {}) {
  const {
    width = 595.28,
    height = 841.89,
    margin = 50
  } = options;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: margin, bottom: margin, left: margin, right: margin }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      contourSets.forEach((set, index) => {
        if (index > 0) {
          doc.addPage();
        }

        // Draw title
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text(set.title || `Analysis ${index + 1}`, { align: 'center' });
        doc.moveDown();

        // Draw contours
        set.contours.forEach(({ level, segments }) => {
          const style = getContourStyle(level);
          const roundedLevel = Math.round(level);

          doc.lineWidth(style.width * 0.5);
          doc.strokeColor(`rgba(0, 0, 0, ${style.alpha})`);

          segments.forEach(seg => {
            if (!seg || seg.length < 2) return;

            doc.moveTo(seg[0].x, seg[0].y);
            for (let i = 1; i < seg.length; i++) {
              doc.lineTo(seg[i].x, seg[i].y);
            }
          });

          doc.stroke();
        });

        // Draw legend
        if (set.minValue !== undefined && set.maxValue !== undefined) {
          drawPDFLegend(doc, margin, height - margin - 80, width - 2 * margin, 80, set.minValue, set.maxValue);
        }
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateVectorPDF,
  generateMultiPagePDF,
  drawPDFLabels,
  drawPDFLegend
};
