/**
 * Heatmap Section Builder
 * Builds the heatmap visualization section
 */

export const buildHeatmapSection = (doc, { heatmapImage, yPos }) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Section title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('4. Distribución de Potencial (Heatmap)', 20, yPos);
  yPos += 10;

  // Add heatmap image
  if (heatmapImage) {
    try {
      // Check if heatmapImage is base64 or URL
      if (typeof heatmapImage === 'string' && heatmapImage.startsWith('data:image')) {
        // Base64 image
        doc.addImage(heatmapImage, 'PNG', 20, yPos, 170, 100);
      } else {
        // URL or other format - would need to fetch
        doc.text('[Heatmap image would be rendered here]', 20, yPos + 50);
      }
      yPos += 110;
    } catch (error) {
      console.error('Error adding heatmap to PDF:', error);
      doc.text('[Error rendering heatmap]', 20, yPos + 50);
      yPos += 60;
    }
  } else {
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('No se proporcionó imagen de heatmap', 20, yPos + 50);
    yPos += 60;
  }

  yPos += 10;

  return yPos;
};
