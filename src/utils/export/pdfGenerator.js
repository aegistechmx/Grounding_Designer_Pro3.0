import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';

export const generatePDFWithHeatmap = async (params, calculations, recommendations, heatmapElementId = 'dashboard-heatmap') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;
  
  // Portada
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235);
  doc.text('GROUNDING DESIGNER PRO', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Informe Técnico de Puesta a Tierra', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Proyecto: ${params.projectName || 'Proyecto de Puesta a Tierra'}`, 20, yPos + 10);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 20, yPos + 20);
  doc.text(`Ingeniero: ${params.engineerName || 'Ingeniero Especialista'}`, 20, yPos + 30);
  yPos += 50;
  
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 15;
  
  // Capturar heatmap
  try {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      doc.text('Mapa de Distribución de Potencial', 20, yPos);
      yPos += 10;

      const image = canvas.toDataURL('image/png');
      doc.addImage(image, 'PNG', 40, yPos, 500, 300);
      yPos += 110;
    }
  } catch (error) {
    console.error('Error capturando heatmap:', error);
    doc.text('No se pudo generar el mapa de calor', 20, yPos);
    yPos += 20;
  }
  
  // Resultados
  doc.addPage();
  yPos = 20;
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.text('Resultados de Cálculos', 20, yPos);
  yPos += 10;
  
  const resultsData = [
    ['Resistencia de Malla (Rg)', `${calculations?.Rg?.toFixed(2) || 'N/A'} Ω`],
    ['GPR', `${calculations?.GPR?.toFixed(0) || 'N/A'} V`],
    ['Tensión de Contacto (Em)', `${calculations?.Em?.toFixed(0) || 'N/A'} V`],
    ['Tensión de Paso (Es)', `${calculations?.Es?.toFixed(0) || 'N/A'} V`],
    ['Estado', calculations?.complies ? 'CUMPLE IEEE 80' : 'NO CUMPLE IEEE 80']
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Parámetro', 'Valor']],
    body: resultsData,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 20 },
    tableWidth: 170
  });
  
  // Pie de página
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    doc.text('Grounding Designer Pro • IEEE 80-2013', pageWidth / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
  }
  
  return doc;
};

export default generatePDFWithHeatmap;
