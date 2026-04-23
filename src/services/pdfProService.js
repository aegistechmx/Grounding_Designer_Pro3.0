import jsPDF from 'jspdf';

export const generateCorporatePDF = ({ calculations, params, heatmapImage }) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  // ===== PORTADA =====
  doc.setFontSize(22);
  doc.text('GROUNDING DESIGN REPORT', 20, 40);

  doc.setFontSize(12);
  doc.text(`Proyecto: ${params.projectName || 'N/A'}`, 20, 60);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 70);

  // ===== NUEVA PÁGINA =====
  doc.addPage();

  doc.setFontSize(16);
  doc.text('Resultados IEEE Std 80', 20, 20);

  doc.setFontSize(10);
  doc.text(`Resistencia: ${calculations.resistance} Ω`, 20, 30);
  doc.text(`Voltaje contacto: ${calculations.touchVoltage} V`, 20, 40);
  doc.text(`Cumple: ${calculations.complies ? 'SI' : 'NO'}`, 20, 50);

  // ===== HEATMAP =====
  doc.addPage();

  doc.setFontSize(16);
  doc.text('Heatmap de Potenciales', 20, 20);

  doc.addImage(heatmapImage, 'PNG', 15, 30, 180, 120);

  // ===== ANÁLISIS =====
  doc.addPage();

  doc.setFontSize(16);
  doc.text('Análisis Técnico', 20, 20);

  doc.setFontSize(10);
  doc.text(
    'El sistema presenta una distribución de potencial acorde al modelo IEEE 80.',
    20,
    30
  );

  // ===== GUARDAR =====
  doc.save(`Grounding_Report_${Date.now()}.pdf`);
};
