/**
 * Parameters Section Builder
 * Builds the design parameters section
 */

export const buildParametersSection = (doc, { params, yPos }) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Section title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('2. Parámetros de Diseño', 20, yPos);
  yPos += 10;

  // Parameters table
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  const paramGroups = [
    {
      title: 'Parámetros de Suelo',
      params: [
        { label: 'Resistividad', value: `${params?.soilResistivity || 'N/A'} Ω·m` },
        { label: 'Capa superficial', value: `${params?.surfaceLayerResistivity || 0} Ω·m` },
        { label: 'Profundidad capa', value: `${params?.surfaceLayerDepth || 0} m` }
      ]
    },
    {
      title: 'Parámetros de Falla',
      params: [
        { label: 'Corriente de falla', value: `${params?.faultCurrent || 'N/A'} A` },
        { label: 'Duración de falla', value: `${params?.faultDuration || 'N/A'} s` },
        { label: 'Factor de división', value: params?.currentDivisionFactor || 'N/A' }
      ]
    },
    {
      title: 'Parámetros de Malla',
      params: [
        { label: 'Dimensiones', value: `${params?.gridLength || 0} x ${params?.gridWidth || 0} m` },
        { label: 'Profundidad', value: `${params?.burialDepth || 0} m` },
        { label: 'Conductores paralelos', value: params?.numParallel || 0 },
        { label: 'Conductores perpendiculares', value: params?.numParallelY || 0 },
        { label: 'Varillas', value: params?.numRods || 0 },
        { label: 'Longitud varillas', value: `${params?.rodLength || 0} m` }
      ]
    }
  ];

  paramGroups.forEach(group => {
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(group.title, 20, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    group.params.forEach(param => {
      doc.text(`${param.label}: ${param.value}`, 25, yPos);
      yPos += 5;
    });
    yPos += 5;
  });

  yPos += 5;

  return yPos;
};
