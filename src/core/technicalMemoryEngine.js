/**
 * Motor de Memoria Técnica Automática
 * Genera documentación técnica estructurada conforme a normas IEEE 80
 */

export function generateTechnicalMemory(report) {
  const r = report.results;
  const i = report.input;
  const m = report.metadata;

  return {
    sections: [
      // 1. OBJETIVO
      {
        title: "1. OBJETIVO",
        content: `
El presente documento tiene como objetivo desarrollar el diseño del sistema de puesta a tierra conforme a los criterios de seguridad establecidos en IEEE Std 80-2013, garantizando la protección de personas y equipos ante condiciones de falla.

El estudio evalúa la resistencia de malla, elevación de potencial de tierra (GPR), tensiones de paso y contacto, y verifica el cumplimiento con las normas vigentes.
        `.trim()
      },

      // 2. ALCANCE
      {
        title: "2. ALCANCE",
        content: `
Este estudio comprende el análisis de la malla de puesta a tierra para el proyecto "${m.project}", incluyendo:

• Cálculo de resistencia de malla (Rg)
• Determinación de elevación de potencial (GPR)
• Evaluación de tensiones de paso y contacto
• Verificación de cumplimiento normativo IEEE 80
• Análisis de seguridad para personas de 50 kg y 70 kg

El análisis se realiza considerando condiciones críticas de operación y parámetros de diseño especificados.
        `.trim()
      },

      // 3. MARCO NORMATIVO
      {
        title: "3. MARCO NORMATIVO",
        content: `
El diseño se fundamenta en las siguientes normas y estándares:

• IEEE Std 80-2013: Guide for Safety in AC Substation Grounding
• CFE 01J00-01: Diseño de Sistemas de Puesta a Tierra
• NOM-001-SEDE-2012: Instalaciones Eléctricas
• NOM-022-STPS-2015: Electricidad estática en los centros de trabajo

Se aplican los criterios más conservadores entre las normas aplicables.
        `.trim()
      },

      // 4. METODOLOGÍA
      {
        title: "4. METODOLOGÍA DE CÁLCULO",
        content: `
El análisis se realiza conforme a la metodología establecida en IEEE Std 80-2013, considerando:

a) Modelo de resistividad del suelo:
   - Resistividad aparente: ${i.soil.resistivity} Ω·m
   - Capa superficial: ${i.soil.surfaceLayer} Ω·m
   - Espesor capa superficial: ${i.soil.surfaceDepth} m

b) Geometría de la malla:
   - Área: ${r.gridArea.toFixed(2)} m²
   - Longitud: ${i.grid.length} m
   - Ancho: ${i.grid.width} m
   - Profundidad: ${i.grid.depth} m
   - Conductores paralelos X: ${i.grid.numParallel}
   - Conductores paralelos Y: ${i.grid.numParallelY}
   - Número de varillas: ${i.grid.numRods}
   - Longitud de varillas: ${i.grid.rodLength} m

c) Corriente de falla:
   - Duración de falla: ${i.fault.duration} s
   - Factor de división de corriente: ${i.fault.currentDivisionFactor}
   - Corriente de falla: ${r.faultCurrent.toFixed(2)} A
   - Corriente en malla: ${r.gridCurrent.toFixed(2)} A

d) Factores de corrección:
   - Factor de capa superficial (Cs)
   - Factor de malla (Km)
   - Factor de irregularidad (Ki)
   - Factor de profundidad (Kh)
   - Factor de paso (Ks)

Los cálculos consideran condiciones críticas de operación y factores de seguridad conforme a IEEE 80.
        `.trim()
      },

      // 5. RESULTADOS
      {
        title: "5. RESULTADOS DEL ANÁLISIS",
        content: `
Resultados principales obtenidos del cálculo:

RESISTENCIA DE MALLA:
• Resistencia de malla (Rg): ${r.resistance.toFixed(4)} Ω
• Valor objetivo: ≤ 5 Ω (CFE 01J00-01)
• Estado: ${r.resistance <= 5 ? 'CUMPLE' : 'NO CUMPLE'}

ELEVACIÓN DE POTENCIAL:
• Elevación de potencial (GPR): ${r.gpr.toFixed(2)} V
• Corriente en malla (Ig): ${r.gridCurrent.toFixed(2)} A

TENSIONES DE CONTACTO:
• Tensión de contacto (Em): ${r.touchVoltage.toFixed(2)} V
• Límite 70 kg: ${r.touchLimit70.toFixed(2)} V
• Límite 50 kg: ${r.touchLimit50.toFixed(2)} V
• Estado 70 kg: ${r.touchSafe70 ? 'CUMPLE' : 'NO CUMPLE'}
• Estado 50 kg: ${r.touchSafe50 ? 'CUMPLE' : 'NO CUMPLE'}

TENSIONES DE PASO:
• Tensión de paso (Es): ${r.stepVoltage.toFixed(2)} V
• Límite 70 kg: ${r.stepLimit70.toFixed(2)} V
• Límite 50 kg: ${r.stepLimit50.toFixed(2)} V
• Estado 70 kg: ${r.stepSafe70 ? 'CUMPLE' : 'NO CUMPLE'}
• Estado 50 kg: ${r.stepSafe50 ? 'CUMPLE' : 'NO CUMPLE'}

GEOMETRÍA:
• Área de malla: ${r.gridArea.toFixed(2)} m²
• Longitud total conductor: ${r.totalConductor.toFixed(2)} m
• Longitud total varillas: ${r.totalRodLength.toFixed(2)} m
        `.trim()
      },

      // 6. EVALUACIÓN DE SEGURIDAD
      {
        title: "6. EVALUACIÓN DE SEGURIDAD",
        content: `
ANÁLISIS DE CUMPLIMIENTO IEEE 80:

Tensión de contacto:
• Calculado: ${r.touchVoltage.toFixed(2)} V
• Límite permisible (70 kg): ${r.touchLimit70.toFixed(2)} V
• Margen de seguridad: ${((r.touchLimit70 - r.touchVoltage) / r.touchLimit70 * 100).toFixed(1)}%
• Estado: ${r.touchSafe70 ? 'CUMPLE' : 'NO CUMPLE'}

Tensión de paso:
• Calculado: ${r.stepVoltage.toFixed(2)} V
• Límite permisible (70 kg): ${r.stepLimit70.toFixed(2)} V
• Margen de seguridad: ${((r.stepLimit70 - r.stepVoltage) / r.stepLimit70 * 100).toFixed(1)}%
• Estado: ${r.stepSafe70 ? 'CUMPLE' : 'NO CUMPLE'}

RESISTENCIA DE MALLA:
• Calculado: ${r.resistance.toFixed(4)} Ω
• Límite CFE: 5 Ω
• Estado: ${r.resistance <= 5 ? 'CUMPLE' : 'NO CUMPLE'}

CONCLUSIÓN GENERAL:
El sistema ${r.complies ? 'CUMPLE' : 'NO CUMPLE'} con los criterios de seguridad establecidos en IEEE Std 80-2013.
        `.trim()
      },

      // 7. ANÁLISIS TÉCNICO
      {
        title: "7. ANÁLISIS TÉCNICO",
        content: `
ANÁLISIS DE RESISTENCIA:
${r.resistance < 2 ? 'El valor de resistencia de malla es excelente, muy por debajo del límite recomendado, lo que indica una buena disipación de corriente.' : 
 r.resistance <= 5 ? 'El valor de resistencia de malla es adecuado para disipación de corriente conforme a CFE 01J00-01.' :
 'El valor de resistencia de malla excede el límite recomendado, lo que puede afectar la disipación de corriente.'}

ANÁLISIS DE GPR:
${r.gpr < 3000 ? 'La elevación de potencial es baja, minimizando riesgos de transferencia de potencial.' :
 r.gpr < 10000 ? 'La elevación de potencial es moderada. Se recomienda verificar equipotencialización.' :
 'La elevación de potencial es alta. Se requieren medidas adicionales de protección.'}

ANÁLISIS DE CAPA SUPERFICIAL:
${i.soil.surfaceLayer >= 10000 && i.soil.surfaceDepth >= 0.15 ? 'La capa superficial cumple con los requisitos de resistividad y espesor para mitigar tensiones de paso.' :
 'La capa superficial no cumple con los requisitos mínimos. Se recomienda aumentar espesor o resistividad.'}

MARGEN DE SEGURIDAD:
${report.safety.margin > 80 ? 'El sistema presenta un margen de seguridad alto, garantizando operación confiable.' :
 report.safety.margin > 50 ? 'El sistema presenta un margen de seguridad aceptable.' :
 'El margen de seguridad es bajo y requiere atención.'}
        `.trim()
      },

      // 8. RECOMENDACIONES
      {
        title: "8. RECOMENDACIONES",
        content: `
RECOMENDACIONES GENERALES:

1. Validación de campo:
   • Realizar pruebas de resistividad (método Wenner) antes de la construcción
   • Verificar condiciones reales del suelo en el sitio
   • Comparar valores medidos con valores de diseño

2. Construcción:
   • Utilizar soldadura exotérmica para todas las conexiones
   • Asegurar profundidad de instalación conforme a diseño
   • Verificar continuidad eléctrica de la malla

3. Pruebas post-construcción:
   • Medir resistencia de malla post-construcción
   • Comparar con valores de diseño (tolerancia ±20%)
   • Documentar resultados en reporte as-built

4. Mantenimiento:
   • Implementar programa de inspección periódica
   • Verificar integridad de conexiones anualmente
   • Reparar daños identificados oportunamente

5. Documentación:
   • Mantener planos as-built actualizados
   • Registrar todas las modificaciones
   • Conservar reportes de pruebas

${!r.complies ? '\nRECOMENDACIONES ESPECÍFICAS:\n\nEl diseño actual NO CUMPLE con IEEE 80. Se recomienda:\n• Aumentar el número de conductores\n• Incrementar longitud de varillas\n• Mejorar capa superficial\n• Considerar tratamiento de suelo' : ''}
        `.trim()
      },

      // 9. CONCLUSIÓN
      {
        title: "9. CONCLUSIÓN",
        content: `
CONCLUSIÓN GENERAL:

${r.complies ? 
'El diseño del sistema de puesta a tierra es técnicamente viable y cumple con los criterios de seguridad establecidos en IEEE Std 80-2013 y CFE 01J00-01. Los valores calculados de resistencia, GPR, tensiones de paso y contacto se encuentran dentro de los límites permisibles. El sistema es apto para su implementación conforme a los parámetros de diseño especificados.' :
'El diseño del sistema de puesta a tierra requiere modificaciones para alcanzar el cumplimiento normativo completo. Se recomienda rediseñar el sistema considerando las recomendaciones especificadas en la sección 8. Una vez implementadas las mejoras, se deberá realizar una nueva evaluación para verificar el cumplimiento con IEEE Std 80-2013.'}

DATOS DEL PROYECTO:
• Proyecto: ${m.project}
• Ubicación: ${m.location}
• Cliente: ${m.client}
• Ingeniero responsable: ${m.engineer}
• Fecha de elaboración: ${new Date(m.date).toLocaleDateString('es-MX')}
• ID del reporte: ${m.reportId}
        `.trim()
      }
    ]
  };
}

export default { generateTechnicalMemory };
