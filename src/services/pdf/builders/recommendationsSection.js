/**
 * Recommendations Section Builder
 * Builds the AI recommendations section
 */

export const buildRecommendationsSection = (doc, { recommendations, yPos }) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Section title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('6. Recomendaciones', 20, yPos);
  yPos += 10;

  if (!recommendations || recommendations.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('No hay recomendaciones disponibles', 20, yPos);
    yPos += 10;
    return yPos;
  }

  // List recommendations
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  recommendations.forEach((rec, index) => {
    const priority = rec.priority || 'INFO';
    const action = rec.action || rec;
    
    // Priority color
    if (priority === 'CRITICAL') {
      doc.setTextColor(239, 68, 68);
    } else if (priority === 'HIGH') {
      doc.setTextColor(249, 115, 22);
    } else if (priority === 'MEDIUM') {
      doc.setTextColor(234, 179, 8);
    } else {
      doc.setTextColor(34, 197, 94);
    }

    doc.text(`${index + 1}. [${priority}] ${action}`, 25, yPos);
    yPos += 6;

    // Reset color for next iteration
    doc.setTextColor(60, 60, 60);
  });

  yPos += 10;

  return yPos;
};
