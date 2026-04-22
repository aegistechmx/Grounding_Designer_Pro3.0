import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToPDF = (results, params) => {
  if (!params || !results) {
    console.error('exportToPDF: params o results son undefined');
    return;
  }
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Título
  doc.setFontSize(20);
  doc.setTextColor(37, 99, 235);
  doc.text('Grounding Designer Pro', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Informe Técnico de Puesta a Tierra', pageWidth / 2, 30, { align: 'center' });
  
  // Datos del proyecto
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Datos del Proyecto', 20, 50);
  
  autoTable(doc, {
    startY: 55,
    body: [
      ['Parámetro', 'Valor'],
      ['Largo de malla', `${params.gridLength || 'N/A'} m`],
      ['Ancho de malla', `${params.gridWidth || 'N/A'} m`],
      ['Conductores', `${params.numParallel || 'N/A'} x ${params.numParallelY || 'N/A'}`],
      ['Varillas', `${params.numRods || 'N/A'} x ${params.rodLength || 'N/A'}m`],
      ['Resistividad del suelo', `${params.soilResistivity || 'N/A'} Ω·m`]
    ],
    theme: 'striped',
    styles: { fontSize: 10 },
    margin: { left: 20 }
  });
  
  // Resultados
  let y = doc.lastAutoTable.finalY + 15;
  doc.text('Resultados de Cálculo', 20, y);
  
  autoTable(doc, {
    startY: y + 5,
    body: [
      ['Resistencia de Malla (Rg)', `${results.Rg?.toFixed(3) || 'N/A'} Ω`],
      ['GPR', `${results.GPR?.toFixed(0) || 'N/A'} V`],
      ['Tensión de Contacto', `${results.Em?.toFixed(0) || 'N/A'} V`],
      ['Tensión de Paso', `${results.Es?.toFixed(0) || 'N/A'} V`],
      ['Cumple IEEE 80', results.complies ? 'SÍ' : 'NO']
    ],
    theme: 'striped',
    styles: { fontSize: 10 },
    margin: { left: 20 }
  });
  
  // Guardar PDF
  doc.save(`informe-malla-${new Date().toISOString().slice(0, 19)}.pdf`);
};

export default { exportToPDF };
