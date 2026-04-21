import React from 'react';
import { FileText, Download } from 'lucide-react';

const PDFReport = ({ params, calculations, recommendations, darkMode }) => {
  
  // ============================================
  // FUNCIÓN PARA GENERAR PDF
  // ============================================
  const generatePDF = () => {
    // Validar que los datos existan
    const safeParams = params || {};
    const safeCalculations = calculations || {};
    const safeRecommendations = recommendations || [];
    
    // Calcular valores adicionales
    const Vsec = safeParams.secondaryVoltage || 220;
    const safeKVA = Math.max(1, safeParams.transformerKVA || 75);
    const safeImpedance = Math.max(0.1, safeParams.transformerImpedance || 5);
    const In = (safeKVA * 1000) / (Math.sqrt(3) * Vsec);
    const faultCurrent = In / (safeImpedance / 100);
    const Ig = faultCurrent * (safeParams.currentDivisionFactor || 0.6);
    
    const gridArea = (safeParams.gridLength || 30) * (safeParams.gridWidth || 16);
    const perimeter = 2 * ((safeParams.gridLength || 30) + (safeParams.gridWidth || 16));
    const totalConductor = perimeter * (safeParams.numParallel || 15);
    const totalRodLength = (safeParams.numRods || 45) * (safeParams.rodLength || 3);
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Grounding Grid Calculation - IEEE 80</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 40px;
            color: #1f2937;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2563eb;
          }
          h1 {
            color: #1e40af;
            font-size: 24px;
            margin-bottom: 10px;
          }
          h2 {
            color: #166534;
            font-size: 18px;
            margin-top: 25px;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #ddd;
          }
          h3 {
            color: #1e40af;
            font-size: 16px;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 15px 0;
            font-size: 14px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6;
            font-weight: 600;
          }
          .safe {
            background-color: #dcfce7;
            color: #166534;
          }
          .unsafe {
            background-color: #fee2e2;
            color: #991b1b;
          }
          .certificate {
            border: 2px solid #1e40af;
            padding: 25px;
            margin-top: 30px;
            text-align: center;
            border-radius: 8px;
            background: #f8fafc;
          }
          .signature {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            text-align: center;
            width: 200px;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
            padding-top: 10px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
          }
          .badge-success {
            background: #22c55e20;
            color: #166534;
            border: 1px solid #22c55e;
          }
          .badge-warning {
            background: #f59e0b20;
            color: #b45309;
            border: 1px solid #f59e0b;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 15px 0;
          }
          .card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            background: #f9fafb;
          }
        </style>
      </head>
      <body>
        <!-- HEADER -->
        <div class="header">
          <h1>⚡ GROUNDING DESIGNER PRO</h1>
          <p>Sistema Profesional de Diseño de Mallas de Puesta a Tierra</p>
          <p>IEEE Std 80-2013 | CFE 01J00-01 | NOM-001-SEDE-2012</p>
          <p style="margin-top: 10px; font-size: 12px;">
            Ingeniería Eléctrica Especializada | Puerto Vallarta, México
          </p>
        </div>
        
        <!-- DATOS DEL PROYECTO -->
        <h2>📋 DATOS DEL PROYECTO</h2>
        <div class="grid">
          <div class="card">
            <strong>Proyecto:</strong> ${safeParams.projectName || 'Proyecto de Puesta a Tierra'}<br>
            <strong>Cliente:</strong> ${safeParams.clientName || 'No especificado'}<br>
            <strong>Ubicación:</strong> ${safeParams.projectLocation || 'Puerto Vallarta, Jalisco, México'}
          </div>
          <div class="card">
            <strong>Ingeniero Responsable:</strong> ${safeParams.engineerName || 'Ingeniero Especialista'}<br>
            <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-MX')}<br>
            <strong>Versión:</strong> 2.0
          </div>
        </div>
        
        <!-- PARÁMETROS DE ENTRADA -->
        <h2>⚙️ PARÁMETROS DE ENTRADA</h2>
        <table>
          <thead>
            <tr><th>Parámetro</th><th>Valor</th><th>Unidad</th></tr>
          </thead>
          <tbody>
            <tr><td>Transformador</td><td>${safeParams.transformerKVA || 75}</td><td>kVA</td></tr>
            <tr><td>Voltaje Primario</td><td>${safeParams.primaryVoltage || 13200}</td><td>V</td></tr>
            <tr><td>Voltaje Secundario</td><td>${safeParams.secondaryVoltage || 220}</td><td>V</td></tr>
            <tr><td>Impedancia</td><td>${safeParams.transformerImpedance || 5}</td><td>%</td></tr>
            <tr><td>Corriente de falla</td><td>${faultCurrent.toFixed(0)}</td><td>A</td></tr>
            <tr><td>Factor Sf</td><td>${safeParams.currentDivisionFactor || 0.6}</td><td>-</td></tr>
            <tr><td>Corriente en malla (Ig)</td><td>${Ig.toFixed(0)}</td><td>A</td></tr>
            <tr><td>Duración de falla</td><td>${safeParams.faultDuration || 0.5}</td><td>s</td></tr>
            <tr><td>Resistividad del suelo</td><td>${safeParams.soilResistivity || 100}</td><td>Ω·m</td></tr>
            <tr><td>Capa superficial</td><td>${safeParams.surfaceLayer || 3000}</td><td>Ω·m</td></tr>
            <tr><td>Espesor capa superficial</td><td>${safeParams.surfaceDepth || 0.1}</td><td>m</td></tr>
            <tr><td>Dimensiones de malla</td><td>${safeParams.gridLength || 30} × ${safeParams.gridWidth || 16}</td><td>m</td></tr>
            <tr><td>Profundidad de malla</td><td>${safeParams.gridDepth || 0.6}</td><td>m</td></tr>
            <tr><td>Conductores paralelos</td><td>${safeParams.numParallel || 15}</td><td>-</td></tr>
            <tr><td>Número de varillas</td><td>${safeParams.numRods || 45}</td><td>-</td></tr>
            <tr><td>Longitud de varilla</td><td>${safeParams.rodLength || 3}</td><td>m</td></tr>
          </tbody>
        </table>
        
        <!-- GEOMETRÍA DE LA MALLA -->
        <h2>📐 GEOMETRÍA DE LA MALLA</h2>
        <table>
          <thead><tr><th>Parámetro</th><th>Valor</th><th>Unidad</th></tr></thead>
          <tbody>
            <tr><td>Área de la malla</td><td>${gridArea.toFixed(0)}</td><td>m²</td></tr>
            <tr><td>Perímetro</td><td>${perimeter.toFixed(0)}</td><td>m</td></tr>
            <tr><td>Longitud total conductores</td><td>${totalConductor.toFixed(0)}</td><td>m</td></tr>
            <tr><td>Longitud total varillas</td><td>${totalRodLength.toFixed(0)}</td><td>m</td></tr>
            <tr><td>Longitud total (LT)</td><td>${(totalConductor + totalRodLength).toFixed(0)}</td><td>m</td></tr>
          </tbody>
        </table>
        
        <!-- RESULTADOS DE CÁLCULOS -->
        <h2>🎯 RESULTADOS DE CÁLCULOS</h2>
        <table>
          <thead><tr><th>Parámetro</th><th>Valor</th><th>Límite (70kg)</th><th>Estado</th></tr></thead>
          <tbody>
            <tr class="${safeCalculations.touchSafe70 ? 'safe' : 'unsafe'}">
              <td>Tensión de Contacto (Em)</td>
              <td>${safeCalculations.Em?.toFixed(0) || 'N/A'} V</td>
              <td>${safeCalculations.Etouch70?.toFixed(0) || 'N/A'} V</td>
              <td>${safeCalculations.touchSafe70 ? '✅ CUMPLE' : '❌ NO CUMPLE'}</td>
            </tr>
            <tr class="${safeCalculations.stepSafe70 ? 'safe' : 'unsafe'}">
              <td>Tensión de Paso (Es)</td>
              <td>${safeCalculations.Es?.toFixed(0) || 'N/A'} V</td>
              <td>${safeCalculations.Estep70?.toFixed(0) || 'N/A'} V</td>
              <td>${safeCalculations.stepSafe70 ? '✅ CUMPLE' : '❌ NO CUMPLE'}</td>
            </tr>
            <tr>
              <td>Resistencia de Malla (Rg)</td>
              <td colspan="3">${safeCalculations.Rg?.toFixed(3) || 'N/A'} Ω</td>
            </tr>
            <tr>
              <td>GPR (Elevación de Potencial)</td>
              <td colspan="3">${safeCalculations.GPR?.toFixed(0) || 'N/A'} V</td>
            </tr>
          </tbody>
        </table>
        
        <!-- VERIFICACIÓN DE SEGURIDAD -->
        <h2>🛡️ VERIFICACIÓN DE SEGURIDAD</h2>
        <div class="${safeCalculations.complies ? 'safe' : 'unsafe'}" style="padding: 15px; border-radius: 8px; margin: 15px 0;">
          <strong style="font-size: 16px;">
            ${safeCalculations.complies ? '✅ DISEÑO CUMPLE CON IEEE 80' : '❌ DISEÑO NO CUMPLE CON IEEE 80'}
          </strong>
          <p style="margin-top: 10px;">
            ${safeCalculations.complies 
              ? 'Los voltajes de paso y contacto están dentro de los límites seguros.' 
              : 'Se requieren mejoras: agregar más varillas, aumentar conductores, reducir Sf, o mejorar capa superficial.'}
          </p>
        </div>
        
        <!-- RECOMENDACIONES -->
        <h2>💡 RECOMENDACIONES</h2>
        <ul>
          ${safeRecommendations.length > 0 
            ? safeRecommendations.map(r => `<li>${r}</li>`).join('') 
            : '<li>✓ Diseño cumple con IEEE 80. Verificar mediciones in-situ.</li>'}
          <li>• Realizar prueba de resistencia después de instalación (método de caída de potencial)</li>
          <li>• Medir resistividad del suelo in-situ (método Wenner de 4 puntas)</li>
        </ul>
        
        <!-- CERTIFICADO DE CUMPLIMIENTO -->
        <div class="certificate">
          <h3>📜 CERTIFICADO DE CUMPLIMIENTO</h3>
          <p>El suscrito, <strong>${safeParams.engineerName || 'Ingeniero Especialista'}</strong>, certifica que el diseño de la malla de puesta a tierra 
          <strong>${safeCalculations.complies ? 'CUMPLE' : 'NO CUMPLE'}</strong> con los requisitos de seguridad de la norma 
          <strong>IEEE Std 80-2013</strong> y <strong>CFE 01J00-01</strong> "Sistema de Tierra para Plantas y Subestaciones Eléctricas".</p>
          <div class="signature">
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>${safeParams.engineerName || 'Ingeniero Especialista'}</p>
              <p style="font-size: 12px;">Ingeniero Responsable</p>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>${safeParams.clientName || 'Nombre del Cliente'}</p>
              <p style="font-size: 12px;">Aprobación Cliente</p>
            </div>
          </div>
          <p style="margin-top: 20px; font-size: 12px;">Fecha: ${new Date().toLocaleDateString('es-MX')}</p>
        </div>
        
        <!-- NOTAS IMPORTANTES -->
        <h2>📝 NOTAS IMPORTANTES</h2>
        <ul>
          <li>• Cálculos según IEEE 80-2013 y CFE 01J00-01</li>
          <li>• Medir resistividad in-situ (método Wenner)</li>
          <li>• Cumplir con NOM-001-SEDE-2012</li>
          <li>• La capa superficial de grava debe tener resistividad ≥ 10,000 Ω·m y espesor ≥ 0.15 m</li>
          <li>• Las conexiones deben realizarse con soldadura exotérmica</li>
        </ul>
        
        <!-- FOOTER -->
        <div class="footer">
          <p>© 2025 Grounding Designer Pro - Todos los derechos reservados</p>
          <p>Documento generado automáticamente - Para validación técnica contactar al ingeniero responsable</p>
        </div>
      </body>
      </html>
    `;
    
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Por favor habilite las ventanas emergentes para generar el PDF');
        return;
      }
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Esperar a que cargue el contenido para imprimir
      setTimeout(() => {
        printWindow.print();
      }, 100);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Por favor intente nuevamente.');
    }
  };

  return (
    <button
      onClick={generatePDF}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 transition-all"
    >
      <FileText size={16} />
      Generar PDF Profesional
    </button>
  );
};

export default PDFReport;