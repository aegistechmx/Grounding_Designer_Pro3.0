/**
 * PDF Vectorial Engine - ETAP Style
 * Vector PDF export with paths (not images) - Professional Engineering
 * Grounding Designer Pro - Professional Engineering Simulation
 */

/**
 * Draw contours as vector paths in PDF
 * @param {Object} doc - PDFKit document
 * @param {Array} contours - Contour data
 * @param {Object} offset - Offset for positioning
 * @param {number} scale - Scale factor
 */
export function drawContoursPDF(doc, contours, offset = { x: 0, y: 0 }, scale = 1) {
  contours.forEach(({ level, segments, thickness, alpha }) => {
    doc.lineWidth(thickness * scale);
    doc.opacity(alpha);
    doc.strokeColor('black');

    segments.forEach(seg => {
      if (!seg || seg.length < 2) return;
      
      doc.moveTo(offset.x + seg[0].x * scale, offset.y + seg[0].y * scale);
      for (let i = 1; i < seg.length; i++) {
        doc.lineTo(offset.x + seg[i].x * scale, offset.y + seg[i].y * scale);
      }
    });

    doc.stroke();
  });
  
  doc.opacity(1); // Reset opacity
}

/**
 * Draw rotated labels on contours in PDF
 * @param {Object} doc - PDFKit document
 * @param {Array} contours - Contour data
 * @param {Object} offset - Offset for positioning
 * @param {number} scale - Scale factor
 */
export function drawLabelsPDF(doc, contours, offset = { x: 0, y: 0 }, scale = 1) {
  doc.fontSize(8);
  doc.fillColor('black');

  contours.forEach(({ level, segments, isMajor }) => {
    if (!isMajor) return; // Only label major contours

    segments.forEach(seg => {
      if (!seg || seg.length < 6) return;

      const mid = Math.floor(seg.length / 2);
      const p = seg[mid];
      const q = seg[mid + 1];

      if (!p || !q) return;

      const angle = Math.atan2(q.y - p.y, q.x - p.x);

      doc.save();
      doc.rotate(angle * 180 / Math.PI, {
        origin: [offset.x + p.x * scale, offset.y + p.y * scale]
      });
      doc.text(`${Math.round(level)} V`, offset.x + p.x * scale, offset.y + p.y * scale);
      doc.restore();
    });
  });
}

/**
 * Draw ETAP-style legend in PDF
 * @param {Object} doc - PDFKit document
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {Object} position - Legend position
 * @param {Object} size - Legend size
 */
export function drawLegendPDF(doc, min, max, position = { x: 20, y: 20 }, size = { width: 20, height: 200 }) {
  const { x, y } = position;
  const { width, height } = size;

  // Draw gradient bar
  for (let i = 0; i < height; i++) {
    const t = 1 - i / height;
    const color = getETAPColor(t);
    doc.fillColor(color);
    doc.rect(x, y + i, width, 1).fill();
  }

  // Draw border
  doc.strokeColor('black');
  doc.lineWidth(0.5);
  doc.rect(x, y, width, height).stroke();

  // Draw ticks and labels
  doc.fillColor('black');
  doc.fontSize(9);
  doc.font('Helvetica');

  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const val = min + (1 - t) * (max - min);
    const py = y + t * height;

    // Draw tick mark
    doc.moveTo(x + width, py);
    doc.lineTo(x + width + 5, py);
    doc.stroke();

    // Draw label
    doc.text(`${Math.round(val)} V`, x + width + 8, py - 3);
  }

  // Draw title
  doc.fontSize(10);
  doc.font('Helvetica-Bold');
  doc.text('Voltage (V)', x, y - 12);
}

/**
 * Get ETAP-style color
 * @param {number} t - Normalized value (0-1)
 * @returns {string} RGB color string
 */
function getETAPColor(t) {
  if (t < 0.33) {
    const k = t / 0.33;
    return `rgb(${Math.floor(255 * k)}, 255, 0)`;
  } else if (t < 0.66) {
    const k = (t - 0.33) / 0.33;
    return `rgb(255, ${Math.floor(255 * (1 - k))}, 0)`;
  } else {
    const k = (t - 0.66) / 0.34;
    return `rgb(255, ${Math.floor(255 * (1 - k))}, 0)`;
  }
}

/**
 * Generate complete ETAP-style PDF report
 * @param {Object} doc - PDFKit document
 * @param {Object} simulation - Simulation results
 * @param {Object} options - PDF generation options
 */
export function generateETAPReport(doc, simulation, options = {}) {
  const { mesh, solution, isoCurves, levels, statistics } = simulation;
  const {
    title = 'Grounding Grid Analysis',
    offset = { x: 50, y: 100 },
    scale = 10
  } = options;

  // Title
  doc.fontSize(18);
  doc.font('Helvetica-Bold');
  doc.text(title, 50, 50, { align: 'center' });

  // Draw contours
  drawContoursPDF(doc, isoCurves, offset, scale);

  // Draw labels
  drawLabelsPDF(doc, isoCurves, offset, scale);

  // Draw legend
  drawLegendPDF(doc, statistics.min, statistics.max, {
    x: 500,
    y: 100
  });

  // Statistics table
  doc.fontSize(12);
  doc.font('Helvetica');
  doc.text('Statistics', 50, 400);
  
  doc.fontSize(10);
  doc.text(`Min: ${statistics.min.toFixed(2)} V`, 50, 420);
  doc.text(`Max: ${statistics.max.toFixed(2)} V`, 50, 435);
  doc.text(`Mean: ${statistics.mean.toFixed(2)} V`, 50, 450);
  doc.text(`Std Dev: ${statistics.stdDev.toFixed(2)} V`, 50, 465);

  // Mesh information
  doc.text('Mesh Information', 50, 500);
  doc.text(`Nodes: ${mesh.nodes.length}`, 50, 520);
  doc.text(`Elements: ${mesh.elements.length}`, 50, 535);
}

export default {
  drawContoursPDF,
  drawLabelsPDF,
  drawLegendPDF,
  generateETAPReport
};
