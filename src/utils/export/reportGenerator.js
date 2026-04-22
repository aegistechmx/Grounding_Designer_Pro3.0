/**
 * Generador de memoria de cálculo profesional
 */

export const generateMemoryReport = (data) => {
  const date = new Date().toLocaleDateString('es-MX');
  const time = new Date().toLocaleTimeString('es-MX');
  
  return `
================================================================================
                    MEMORIA DE CÁLCULO - SISTEMA DE TIERRAS
                                IEEE Std 80-2013
================================================================================

1. DATOS GENERALES DEL PROYECTO
--------------------------------------------------------------------------------
Proyecto:                     ${data.projectName || 'Sistema de Puesta a Tierra'}
Ubicación:                    ${data.location || 'No especificada'}
Fecha de cálculo:             ${date} ${time}
Ingeniero responsable:        ${data.engineer || 'Ingeniero Especialista'}

2. PARÁMETROS DE ENTRADA
--------------------------------------------------------------------------------
Área de malla (A):            ${data.area?.toFixed(2) || 'N/A'} m²
Dimensiones:                  ${data.gridLength || 'N/A'} m × ${data.gridWidth || 'N/A'} m
Resistividad del suelo (ρ):   ${data.resistivity || 'N/A'} Ω·m
Resistividad capa superficial: ${data.surfaceResistivity || 'N/A'} Ω·m
Espesor capa superficial:     ${data.surfaceDepth || 'N/A'} m
Profundidad de malla (h):     ${data.burialDepth || 'N/A'} m
Longitud total conductores:   ${data.length?.toFixed(2) || 'N/A'} m
Número de varillas:           ${data.numRods || 'N/A'}
Longitud de varillas:         ${data.rodLength || 'N/A'} m
Corriente de falla (Ig):      ${data.Ig?.toFixed(2) || 'N/A'} A
Duración de falla (t):        ${data.faultDuration || 'N/A'} s

3. RESULTADOS DE CÁLCULO
--------------------------------------------------------------------------------
Resistencia de malla (Rg):    ${data.Rg?.toFixed(3) || 'N/A'} Ω
GPR (Elevación de potencial): ${data.GPR?.toFixed(2) || 'N/A'} V
Factor de capa superficial Cs: ${data.Cs?.toFixed(4) || 'N/A'}

4. VERIFICACIÓN DE SEGURIDAD (IEEE 80)
--------------------------------------------------------------------------------
┌─────────────────────────────────────────────────────────────────────────────┐
│ TENSIONES DE CONTACTO                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ Valor calculado (Em):        ${data.Vtouch?.toFixed(2) || 'N/A'} V                         │
│ Límite permisible:           ${data.VtouchAllow?.toFixed(2) || 'N/A'} V                       │
│ Margen de seguridad:         ${data.touchMargin || 'N/A'}%                                   │
│ Estado:                      ${data.touchSafe70 ? '✅ CUMPLE' : '❌ NO CUMPLE'}                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TENSIONES DE PASO                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Valor calculado (Es):        ${data.Vstep?.toFixed(2) || 'N/A'} V                         │
│ Límite permisible:           ${data.VstepAllow?.toFixed(2) || 'N/A'} V                       │
│ Margen de seguridad:         ${data.stepMargin || 'N/A'}%                                    │
│ Estado:                      ${data.stepSafe70 ? '✅ CUMPLE' : '❌ NO CUMPLE'}                     │
└─────────────────────────────────────────────────────────────────────────────┘

5. VERIFICACIÓN TÉRMICA DEL CONDUCTOR
--------------------------------------------------------------------------------
Área mínima requerida:        ${data.minArea?.toFixed(2) || 'N/A'} mm²
Conductor seleccionado:       ${data.selectedConductor || 'N/A'}
Estado:                       ${data.thermalComplies ? '✅ CUMPLE' : '❌ NO CUMPLE'}

6. VALIDACIÓN NORMATIVA
--------------------------------------------------------------------------------
IEEE Std 80-2013:             ${data.complies ? '✅ CUMPLE' : '❌ NO CUMPLE'}
CFE 01J00-01:                 ${data.Rg <= 5 ? '✅ CUMPLE' : '❌ NO CUMPLE'}
NOM-001-SEDE-2012:            ${data.Rg <= 5 && data.GPR < 5000 ? '✅ CUMPLE' : '❌ NO CUMPLE'}

7. CONCLUSIONES Y RECOMENDACIONES
--------------------------------------------------------------------------------
${generateConclusions(data)}

8. FIRMAS
--------------------------------------------------------------------------------
Ingeniero Responsable:        ${data.engineer || '_________________________'}
Fecha:                        ${date}

================================================================================
Documento generado electrónicamente por Grounding Designer Pro
================================================================================
`;
};

const generateConclusions = (data) => {
  const conclusions = [];
  
  if (data.complies) {
    conclusions.push("✓ El sistema de puesta a tierra CUMPLE con los requisitos de seguridad establecidos en IEEE Std 80-2013.");
  } else {
    conclusions.push("✗ El sistema de puesta a tierra NO CUMPLE con los requisitos de seguridad.");
    if (!data.touchSafe70) {
      conclusions.push("  • La tensión de contacto excede el límite permisible. Aumentar conductores o mejorar capa superficial.");
    }
    if (!data.stepSafe70) {
      conclusions.push("  • La tensión de paso excede el límite permisible. Agregar conductor perimetral adicional.");
    }
  }
  
  if (data.Rg > 5) {
    conclusions.push("⚠ La resistencia de malla es elevada (>5Ω). Agregar más varillas o tratar el suelo.");
  } else if (data.Rg < 2) {
    conclusions.push("✓ La resistencia de malla es excelente (<2Ω).");
  }
  
  if (data.GPR > 5000) {
    conclusions.push("⚠ El GPR es elevado (>5000V). Riesgo para equipos electrónicos sensibles.");
  }
  
  conclusions.push("");
  conclusions.push("Recomendaciones generales:");
  conclusions.push("• Realizar mediciones de resistividad in-situ (método Wenner)");
  conclusions.push("• Verificar la continuidad de la malla post-construcción");
  conclusions.push("• Documentar todas las conexiones y soldaduras exotérmicas");
  
  return conclusions.join("\n");
};

export const generateShortReport = (data) => {
  return `
RESUMEN EJECUTIVO - SISTEMA DE TIERRAS
========================================
Rg: ${data.Rg?.toFixed(2) || 'N/A'} Ω
GPR: ${data.GPR?.toFixed(0) || 'N/A'} V
Em: ${data.Vtouch?.toFixed(0) || 'N/A'} V / ${data.VtouchAllow?.toFixed(0) || 'N/A'} V
Es: ${data.Vstep?.toFixed(0) || 'N/A'} V / ${data.VstepAllow?.toFixed(0) || 'N/A'} V
Estado: ${data.complies ? '✅ CUMPLE IEEE 80' : '❌ NO CUMPLE'}
`;
};

export default {
  generateMemoryReport,
  generateShortReport
};