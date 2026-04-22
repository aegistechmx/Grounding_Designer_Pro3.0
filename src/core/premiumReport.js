/**
 * Generador de reporte premium para clientes y licitaciones
 * Estructura profesional con portada, resultados y normativas
 */

export const generatePremiumReport = (data) => {
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('es-MX');
  const timeFormatted = now.toLocaleTimeString('es-MX');
  
  return {
    portada: {
      titulo: "MEMORIA DE CÁLCULO - SISTEMA DE PUESTA A TIERRA",
      subtitulo: "Diseño según IEEE Std 80-2013",
      proyecto: data.projectName || 'Sistema de Puesta a Tierra',
      ubicacion: data.location || 'No especificada',
      cliente: data.clientName || 'No especificado',
      fecha: dateFormatted,
      hora: timeFormatted,
      ingeniero: data.engineerName || 'Ingeniero Especialista',
      version: "2.0"
    },
    
    resumen: {
      Rg: data.Rg,
      GPR: data.GPR,
      Em: data.Em,
      Es: data.Es,
      cumplimiento: data.complies,
      score: data.score || 85,
      riesgo: data.risk || 'BAJO'
    },
    
    calculo: {
      metodo: "IEEE Std 80-2013 + Schwarz avanzado",
      parametros: {
        resistividad_suelo: data.soilResistivity,
        area_malla: data.area,
        longitud_total: data.totalLength,
        profundidad: data.burialDepth,
        num_varillas: data.numRods,
        longitud_varillas: data.rodLength,
        corriente_falla: data.faultCurrent,
        tiempo_despeje: data.faultDuration,
        factor_X_R: data.X_R || 5
      },
      formulas: [
        "Rg = (ρ / (4Lt)) × Fs × Fd + Rrod",
        "Em = Ig × Rg × Km × Ki",
        "Es = Ig × Rg × Ks × Ki",
        "Etouch70 = (1000 + 1.5 × Cs × ρs) × (0.157 / √t)"
      ]
    },
    
    resultados: {
      resistencia_malla: {
        valor: data.Rg,
        unidad: "Ω",
        estado: data.Rg <= 5 ? "Adecuada" : "Elevada"
      },
      tension_contacto: {
        calculada: data.Em,
        permisible: data.EtouchAllow,
        margen: data.touchMargin,
        estado: data.touchSafe70 ? "CUMPLE" : "NO CUMPLE"
      },
      tension_paso: {
        calculada: data.Es,
        permisible: data.EstepAllow,
        margen: data.stepMargin,
        estado: data.stepSafe70 ? "CUMPLE" : "NO CUMPLE"
      },
      gpr: {
        valor: data.GPR,
        unidad: "V",
        riesgo: data.GPR > 5000 ? "Alto" : data.GPR > 3000 ? "Medio" : "Bajo"
      }
    },
    
    normativas: [
      {
        nombre: "IEEE Std 80-2013",
        descripcion: "Guide for Safety in AC Substation Grounding",
        cumplimiento: data.complies ? "CUMPLE" : "NO CUMPLE"
      },
      {
        nombre: "CFE 01J00-01",
        descripcion: "Sistema de Tierra para Plantas y Subestaciones Eléctricas",
        cumplimiento: data.Rg <= 5 ? "CUMPLE" : "NO CUMPLE"
      },
      {
        nombre: "NOM-001-SEDE-2012",
        descripcion: "Instalaciones Eléctricas",
        cumplimiento: data.Rg <= 5 && data.GPR < 5000 ? "CUMPLE" : "NO CUMPLE"
      },
      {
        nombre: "IEC 61936-1",
        descripcion: "Power installations exceeding 1 kV AC",
        cumplimiento: data.complies ? "CUMPLE" : "NO CUMPLE"
      }
    ],
    
    recomendaciones: generateRecommendations(data),
    
    firmas: {
      ingeniero: {
        nombre: data.engineerName,
        cedula: data.engineerLicense || "_________________",
        fecha: dateFormatted,
        firma: "_________________________"
      },
      cliente: {
        nombre: data.clientName,
        puesto: "_________________",
        fecha: "_________________",
        firma: "_________________________"
      }
    },
    
    metadata: {
      generado_por: "Grounding Designer Pro",
      version: "2.0",
      timestamp: now.toISOString(),
      reporte_id: `GDP-${now.getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}` 
    }
  };
};

const generateRecommendations = (data) => {
  const recommendations = [];
  
  if (!data.complies) {
    recommendations.push("⚠️ El diseño NO cumple con IEEE 80. Se requieren mejoras:");
    if (!data.touchSafe70) {
      recommendations.push("  • Reducir el espaciamiento entre conductores");
      recommendations.push("  • Mejorar la capa superficial (grava de alta resistividad)");
    }
    if (!data.stepSafe70) {
      recommendations.push("  • Agregar conductor perimetral adicional");
      recommendations.push("  • Aumentar el número de varillas en el perímetro");
    }
    if (data.Rg > 5) {
      recommendations.push("  • Agregar más varillas o tratar el suelo con bentonita");
    }
  } else {
    recommendations.push("✅ El diseño cumple con IEEE 80.");
    if (data.Rg < 2) {
      recommendations.push("✓ La resistencia de malla es excelente (<2Ω).");
    }
    if (data.touchMargin > 50) {
      recommendations.push(`✓ Margen de seguridad de contacto: ${data.touchMargin}%.`);
    }
  }
  
  recommendations.push("");
  recommendations.push("📋 Recomendaciones generales:");
  recommendations.push("• Realizar medición de resistividad in-situ (método Wenner)");
  recommendations.push("• Verificar continuidad de la malla post-construcción");
  recommendations.push("• Documentar todas las conexiones y soldaduras");
  recommendations.push("• Realizar prueba de resistencia de malla (método de caída de potencial)");
  
  return recommendations;
};

export const generatePremiumHTML = (report) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${report.portada.proyecto} - Memoria de Cálculo</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #1e40af; text-align: center; }
    h2 { color: #166534; border-bottom: 2px solid #166534; padding-bottom: 8px; }
    .header { text-align: center; margin-bottom: 30px; }
    .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #666; }
    table { border-collapse: collapse; width: 100%; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #f3f4f6; }
    .status-pass { color: #166534; font-weight: bold; }
    .status-fail { color: #991b1b; font-weight: bold; }
    .signature { margin-top: 40px; display: flex; justify-content: space-between; }
    .signature-box { text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${report.portada.titulo}</h1>
    <p>${report.portada.subtitulo}</p>
    <p><strong>Proyecto:</strong> ${report.portada.proyecto}</p>
    <p><strong>Ubicación:</strong> ${report.portada.ubicacion}</p>
    <p><strong>Fecha:</strong> ${report.portada.fecha}</p>
    <p><strong>Ingeniero:</strong> ${report.portada.ingeniero}</p>
  </div>

  <h2>RESULTADOS PRINCIPALES</h2>
  <table>
    <tr><th>Parámetro</th><th>Valor</th><th>Estado</th></tr>
    <tr><td>Resistencia de Malla (Rg)</td><td>${report.resumen.Rg?.toFixed(2)} Ω</td><td>${report.resumen.Rg <= 5 ? '✓ Adecuada' : '⚠ Elevada'}</td></tr>
    <tr><td>GPR</td><td>${report.resumen.GPR?.toFixed(0)} V</td><td>${report.resumen.GPR < 5000 ? '✓ Aceptable' : '⚠ Elevado'}</td></tr>
    <tr><td>Tensión de Contacto (Em)</td><td>${report.resultados.tension_contacto.calculada?.toFixed(0)} V</td><td class="${report.resultados.tension_contacto.estado === 'CUMPLE' ? 'status-pass' : 'status-fail'}">${report.resultados.tension_contacto.estado}</td></tr>
    <tr><td>Tensión de Paso (Es)</td><td>${report.resultados.tension_paso.calculada?.toFixed(0)} V</td><td class="${report.resultados.tension_paso.estado === 'CUMPLE' ? 'status-pass' : 'status-fail'}">${report.resultados.tension_paso.estado}</td></tr>
  </table>

  <h2>NORMATIVAS APLICADAS</h2>
  <table>
    <tr><th>Norma</th><th>Descripción</th><th>Cumplimiento</th></tr>
    ${report.normativas.map(n => `
      <tr><td>${n.nombre}</td><td>${n.descripcion}</td><td class="${n.cumplimiento === 'CUMPLE' ? 'status-pass' : 'status-fail'}">${n.cumplimiento}</td></tr>
    `).join('')}
  </table>

  <h2>RECOMENDACIONES</h2>
  <ul>
    ${report.recomendaciones.map(r => `<li>${r}</li>`).join('')}
  </ul>

  <div class="signature">
    <div class="signature-box">
      <p><strong>Ingeniero Responsable</strong></p>
      <p>${report.firmas.ingeniero.nombre}</p>
      <p>Cédula: ${report.firmas.ingeniero.cedula}</p>
    </div>
    <div class="signature-box">
      <p><strong>Aprobación Cliente</strong></p>
      <p>${report.firmas.cliente.nombre}</p>
      <p>${report.firmas.cliente.puesto}</p>
    </div>
  </div>

  <div class="footer">
    <p>Documento generado electrónicamente por Grounding Designer Pro</p>
    <p>ID: ${report.metadata.reporte_id}</p>
  </div>
</body>
</html>
  `;
};

export default {
  generatePremiumReport,
  generatePremiumHTML
};
