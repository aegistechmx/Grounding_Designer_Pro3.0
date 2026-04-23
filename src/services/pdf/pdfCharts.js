/**
 * PDF Charts - Gráficos y Visualizaciones
 * Grounding Designer Pro - Heatmap and Charts
 */

export const addHeatmap = (doc, heatmapImage) => {
  if (!heatmapImage) return;

  doc.addPage();

  doc.fontSize(14).text('Potential Distribution Heatmap');

  doc.image(heatmapImage, {
    fit: [500, 300],
    align: 'center'
  });
};
