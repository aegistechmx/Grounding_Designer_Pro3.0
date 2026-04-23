/**
 * Curve Chart Section Builder
 * Builds the ETAP-style potential vs distance curve section
 */

import { generatePotentialCurveChart } from '../chartGenerator';
import { generatePotentialCurve } from '../../../utils/curves';

export const buildCurveChartSection = async (doc, { calculations, discreteGrid, yPos }) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Section title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('6. Curva de Potencial vs Distancia', 20, yPos);
  yPos += 10;

  try {
    // Generate curve data from grid
    const curveData = generatePotentialCurve(discreteGrid || []);

    if (curveData.length > 0) {
      // Generate chart image
      const chartBuffer = await generatePotentialCurveChart(curveData, {
        touch: calculations?.Etouch70 || 0,
        step: calculations?.Estep70 || 0
      });

      // Add chart to PDF
      const chartBase64 = `data:image/png;base64,${chartBuffer.toString('base64')}`;
      doc.addImage(chartBase64, 'PNG', 20, yPos, 170, 85);
      yPos += 95;

      // Add legend
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text('Leyenda:', 20, yPos);
      yPos += 5;
      doc.setTextColor(239, 68, 68);
      doc.text('• Línea roja: Potencial calculado', 25, yPos);
      yPos += 4;
      doc.setTextColor(59, 130, 246);
      doc.text('• Línea azul: Límite de contacto (IEEE 80)', 25, yPos);
      yPos += 4;
      doc.setTextColor(34, 197, 94);
      doc.text('• Línea verde: Límite de paso (IEEE 80)', 25, yPos);
      yPos += 10;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('No hay datos de curva disponibles', 20, yPos + 40);
      yPos += 50;
    }
  } catch (error) {
    console.error('Error generating curve chart:', error);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Error al generar gráfica de curva', 20, yPos + 40);
    yPos += 50;
  }

  yPos += 10;

  return yPos;
};
