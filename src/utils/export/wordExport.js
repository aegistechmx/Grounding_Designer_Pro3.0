import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';

/**
 * Exporta los datos del proyecto a un archivo Word
 * @param {Object} params - Parámetros del proyecto
 * @param {Object} calculations - Cálculos realizados
 * @param {Object} recommendations - Recomendaciones
 * @param {string} fileName - Nombre del archivo (opcional)
 */
export const exportToWord = async (params, calculations, recommendations, fileName = null) => {
  // Crear un nuevo documento
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Título Principal
        new Paragraph({
          text: 'GROUNDING DESIGNER PRO',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          text: 'Informe Técnico Completo de Malla de Puesta a Tierra',
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),

        // Sección 1: Datos del Proyecto
        new Paragraph({
          text: '1. DATOS DEL PROYECTO',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Nombre del Proyecto: ', bold: true }),
            new TextRun(params.projectName || 'N/A')
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Ubicación: ', bold: true }),
            new TextRun(params.location || 'N/A')
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Ingeniero Responsable: ', bold: true }),
            new TextRun(params.engineerName || 'N/A')
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Cliente: ', bold: true }),
            new TextRun(params.clientName || 'N/A')
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Fecha de Diseño: ', bold: true }),
            new TextRun(new Date().toLocaleDateString('es-MX'))
          ],
          spacing: { after: 300 }
        }),

        // Sección 2: Parámetros de Diseño
        new Paragraph({
          text: '2. PARÁMETROS DE DISEÑO',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Resistividad del Suelo (ρ): ', bold: true }),
            new TextRun(`${params.soilResistivity} Ω·m`)
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Resistividad Capa Superficial (ρs): ', bold: true }),
            new TextRun(`${params.surfaceResistivity || 100} Ω·m`)
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Espesor Capa Superficial (hs): ', bold: true }),
            new TextRun(`${params.surfaceDepth || 0.15} m`)
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Corriente de Falla (If): ', bold: true }),
            new TextRun(`${params.faultCurrent} A`)
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Duración de Falla: ', bold: true }),
            new TextRun(`${params.faultDuration} s`)
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Frecuencia: ', bold: true }),
            new TextRun(`${params.frequency || 60} Hz`)
          ],
          spacing: { after: 300 }
        }),

        // Sección 3: Geometría de la Malla
        new Paragraph({
          text: '3. GEOMETRÍA DE LA MALLA',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Longitud de Malla: ', bold: true }),
            new TextRun(`${params.gridLength} m`)
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Ancho de Malla: ', bold: true }),
            new TextRun(`${params.gridWidth} m`)
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Profundidad de Malla: ', bold: true }),
            new TextRun(`${params.gridDepth} m`)
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Conductores Paralelos (nx): ', bold: true }),
            new TextRun(params.numParallel?.toString() || '15')
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Número de Varillas: ', bold: true }),
            new TextRun(params.numRods?.toString() || '45')
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Longitud de Varillas: ', bold: true }),
            new TextRun(`${params.rodLength} m`)
          ],
          spacing: { after: 300 }
        }),

        // Sección 4: Cálculos IEEE 80-2013
        new Paragraph({
          text: '4. CÁLCULOS IEEE 80-2013',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Parámetro', bold: true })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: 'Valor', bold: true })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: 'Unidad', bold: true })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: 'Referencia', bold: true })], width: { size: 30, type: WidthType.PERCENTAGE } }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Área de la Malla')] }),
                new TableCell({ children: [new Paragraph(calculations.gridArea?.toFixed(2) || 'N/A')] }),
                new TableCell({ children: [new Paragraph('m²')] }),
                new TableCell({ children: [new Paragraph('A = L × W')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Resistencia de Malla (Rg)')] }),
                new TableCell({ children: [new Paragraph(calculations.Rg?.toFixed(3) || 'N/A')] }),
                new TableCell({ children: [new Paragraph('Ω')] }),
                new TableCell({ children: [new Paragraph('Schwarz Eq.')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Tensión de Contacto (Em)')] }),
                new TableCell({ children: [new Paragraph(calculations.Em?.toFixed(2) || 'N/A')] }),
                new TableCell({ children: [new Paragraph('V')] }),
                new TableCell({ children: [new Paragraph('IEEE 80')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Tensión de Paso (Es)')] }),
                new TableCell({ children: [new Paragraph(calculations.Es?.toFixed(2) || 'N/A')] }),
                new TableCell({ children: [new Paragraph('V')] }),
                new TableCell({ children: [new Paragraph('IEEE 80')] }),
              ],
            }),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
        new Paragraph({ text: '', spacing: { after: 300 } }),

        // Sección 5: Verificación de Seguridad
        new Paragraph({
          text: '5. VERIFICACIÓN DE SEGURIDAD',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Límite de Contacto (Etouch70): ', bold: true }),
            new TextRun(`${calculations.Etouch70?.toFixed(2) || 'N/A'} V`)
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Límite de Paso (Estep70): ', bold: true }),
            new TextRun(`${calculations.Estep70?.toFixed(2) || 'N/A'} V`)
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Estado de Contacto: ', bold: true }),
            new TextRun(calculations.Em <= calculations.Etouch70 ? 'CUMPLE' : 'NO CUMPLE'),
            calculations.Em <= calculations.Etouch70 ? new TextRun({ text: ' ✓', color: '008000' }) : new TextRun({ text: ' ✗', color: 'FF0000' })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Estado de Paso: ', bold: true }),
            new TextRun(calculations.Es <= calculations.Estep70 ? 'CUMPLE' : 'NO CUMPLE'),
            calculations.Es <= calculations.Estep70 ? new TextRun({ text: ' ✓', color: '008000' }) : new TextRun({ text: ' ✗', color: 'FF0000' })
          ],
          spacing: { after: 300 }
        }),

        // Sección 6: Recomendaciones
        new Paragraph({
          text: '6. RECOMENDACIONES',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        ...recommendations.map((rec, index) => 
          new Paragraph({
            children: [
              new TextRun({ text: `${index + 1}. `, bold: true }),
              new TextRun(rec)
            ],
            spacing: { after: 100 }
          })
        ),

        // Sección 7: Conclusiones
        new Paragraph({
          text: '7. CONCLUSIONES',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun('El diseño de la malla de puesta a tierra ha sido desarrollado utilizando metodología avanzada del IEEE Std 80-2013. ')
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun('Se recomienda realizar mediciones de resistividad in situ y pruebas de verificación una vez construida la malla.')
          ],
          spacing: { after: 300 }
        }),

        // Sección 8: Referencias Normativas
        new Paragraph({
          text: '8. REFERENCIAS NORMATIVAS',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          text: '• IEEE Std 80-2013: IEEE Guide for Safety in AC Substation Grounding',
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: '• CFE 01J00-01: Sistema de Tierra para Plantas y Subestaciones Eléctricas',
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: '• NOM-001-SEDE-2012: Instalaciones Eléctricas',
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: '• IEEE Std 142: IEEE Recommended Practice for Grounding of Industrial and Commercial Power Systems',
          spacing: { after: 300 }
        }),
      ],
    }],
  });

  // Generar el documento
  const blob = await Packer.toBlob(doc);

  // Generar el nombre del archivo
  const finalFileName = fileName || `Informe_Malla_Tierra_${new Date().toISOString().slice(0, 10)}.docx`;

  // Descargar el archivo
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return finalFileName;
};
