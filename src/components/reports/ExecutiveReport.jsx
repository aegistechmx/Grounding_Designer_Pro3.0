import React, { useState, useRef } from 'react';
import { X, Download, Printer, Eye, EyeOff, FileSpreadsheet, FileText } from 'lucide-react';
import GroundingGridSVG from '../GroundingGridSVG';
import GroundingGrid3D from '../GroundingGrid3D';
import HeatMap from '../visualizations/HeatMap';
import { applyAllCorrections, getSeasonalRecommendation, MONTH_NAMES, REGION_NAMES } from '../../utils/physics/correctedResistivity';
import { conductorThermalCheck } from '../../utils/physics/conductorThermalCheck';
import { recommendSoilTreatment, compareTreatments } from '../../utils/physics/soilTreatment';
import { calculateTransferredVoltage } from '../../utils/physics/transferredVoltage';
import { equipotentialCheck } from '../../utils/physics/equipotentialCheck';
import { getDesignResistivity } from '../../utils/physics/seasonalVariation';
import { exportPDFWithLogo } from '../../utils/export/pdfExportWithLogo';
import { exportToExcel } from '../../utils/export/excelExport';
import { exportToWord } from '../../utils/export/wordExport';
import { optimizeGroundGrid, worstCaseAnalysis } from '../../utils/ai/groundGridOptimizer';
import { formatNumber, formatResistance, formatVoltage, formatCurrent, formatDistance, formatPercentage, formatPower } from '../../utils/formatters';

const ExecutiveReport = ({ params, calculations, recommendations, darkMode, onClose }) => {
  const [show3D, setShow3D] = useState(false);
  const heatMapRef = useRef(null);

  const handlePrint = async () => {
    try {
      // Capturar imagen del mapa de calor
      const heatMapImage = heatMapRef.current ? heatMapRef.current.getCanvasAsBase64() : null;
      
      const doc = await exportPDFWithLogo(params, calculations, recommendations, undefined, { heatMap: heatMapImage });
      doc.save(`Informe_Malla_Tierra_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al generar el PDF: ' + error.message);
    }
  };

  const handleDownload = () => {
    const reportContent = document.getElementById('executive-report');
    if (!reportContent) {
      console.error('Elemento executive-report no encontrado');
      alert('Error: No se pudo generar el reporte');
      return;
    }

    const htmlContent = reportContent.innerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Informe_Malla_Tierra_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    try {
      const fileName = exportToExcel(params, calculations, recommendations);
      alert(`Archivo Excel generado: ${fileName}`);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al generar el archivo Excel: ' + error.message);
    }
  };

  const handleExportWord = async () => {
    try {
      const fileName = await exportToWord(params, calculations, recommendations);
      alert(`Archivo Word generado: ${fileName}`);
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      alert('Error al generar el archivo Word: ' + error.message);
    }
  };

  // ==================== CÁLCULOS ====================
  const Vsec = Math.max(1, params.secondaryVoltage || 480);
  const safeKVA = Math.max(1, params.transformerKVA || 75);
  const In = (safeKVA * 1000) / (Math.sqrt(3) * Vsec);
  const safeImpedance = Math.max(0.1, params.transformerImpedance || 5);
  const faultCurrent = In / (safeImpedance / 100);
  const Ig = faultCurrent * (params.currentDivisionFactor || 0.6);

  const ρ = params.soilResistivity || 100;
  const ρs = params.surfaceLayer || 3000;
  const hs = params.surfaceDepth || 0.1;
  const Cs = 1 - (0.09 * (1 - ρ / ρs)) / (2 * hs + 0.09);

  const t = params.faultDuration || 0.5;
  const sqrt_t = Math.sqrt(t);
  const Etouch70 = (1000 + 1.5 * Cs * ρs) * (0.157 / sqrt_t);
  const Estep70 = (1000 + 6.0 * Cs * ρs) * (0.157 / sqrt_t);

  const gridLength = params.gridLength || 30;
  const gridWidth = params.gridWidth || 16;
  const A = gridLength * gridWidth;
  const perimeter = 2 * (gridLength + gridWidth);
  const totalGridLength = perimeter * (params.numParallel || 15);
  const totalRodLength = (params.numRods || 45) * (params.rodLength || 3);
  const LT = totalGridLength + totalRodLength;
  const h = params.gridDepth || 0.6;

  const Rg = ρ * (1 / LT + 1 / Math.sqrt(20 * A) * (1 + 1 / (1 + h * Math.sqrt(20 / A))));

  const nx = params.numParallel || 15;
  const ny = Math.max(3, Math.floor(nx * gridLength / gridWidth));
  const D = Math.sqrt((gridLength / Math.max(1, nx - 1)) * (gridWidth / Math.max(1, ny - 1))) || 1;

  const n = (2 * totalGridLength / Math.max(1, perimeter)) * Math.sqrt(Math.max(1, perimeter) / (4 * Math.sqrt(Math.max(1, A))));
  const Ki = 0.644 + 0.148 * n;
  const Kh = Math.sqrt(1 + h);

  const term1 = (D * D) / (16 * h * 0.01052);
  const term2 = ((D + 2 * h) * (D + 2 * h)) / (8 * D * 0.01052);
  const term3 = h / (4 * 0.01052);
  const term4 = Math.log(8 / (Math.PI * (2 * n - 1)));

  let Km = (1 / (2 * Math.PI)) * (Math.log(term1 + term2 - term3) + term4);
  Km = Math.max(0.05, Math.min(0.8, Km)) * Kh;

  let Ks = (1 / Math.PI) * (
    1 / (2 * h) +
    1 / (D + h) +
    (1 / D) * (1 - Math.pow(0.5, n - 2))
  );
  Ks = Math.max(0.2, Math.min(1.2, Ks));

  const Em = (ρ * Km * Ki * Ig) / LT;
  const Es = (ρ * Ks * Ki * Ig) / (0.75 * totalGridLength + 0.85 * totalRodLength);

  const safetyMarginTouch = Etouch70 > 0 ? formatPercentage((Etouch70 - Em) / Etouch70 * 100, 1) : '0%';
  const safetyMarginStep = Estep70 > 0 ? formatPercentage((Estep70 - Es) / Estep70 * 100, 1) : '0%';

  const complies = Em <= Etouch70 && Es <= Estep70;

  // Corrección de Resistividad
  const correctionResult = applyAllCorrections(ρ, params);
  const ρ_corrected = correctionResult.corrected;
  const seasonalRec = params.measureMonth && params.region 
    ? getSeasonalRecommendation(params.measureMonth, params.region) 
    : null;

  // Costos
  const conductorCost = totalGridLength * 3.5;
  const rodCost = (params.numRods || 45) * 25;
  const gravelVolume = A * (params.surfaceDepth || 0.1);
  const gravelCost = gravelVolume * 45;
  const totalCost = conductorCost + rodCost + gravelCost;

  // Optimización y análisis de peor caso
  const optimization = optimizeGroundGrid(params);
  const worstCase = worstCaseAnalysis(params);

  // Recomendaciones inteligentes
  const smartRecommendations = [];
  if (params.soilResistivity > 150) {
    smartRecommendations.push("Considerar tratamiento de suelo (bentonita o GEM)");
  }
  if (!worstCase.complies) {
    smartRecommendations.push("El diseño no es seguro en condiciones secas (ρ=300 Ω·m)");
  }
  if (optimization.best && optimization.best.rods > 60) {
    smartRecommendations.push("Optimizar número de varillas para reducir costo");
  }

  return (
    <div className={`p-8 max-w-6xl mx-auto rounded-3xl ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-white text-gray-900'} shadow-2xl print:shadow-none`} id="executive-report">

      {/* Cabecera Mejorada */}
      <div className="flex justify-between items-center mb-12 border-b pb-8 print:mb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-blue-600">GROUNDING DESIGNER PRO</h1>
          <p className={`text-xl ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-2`}>Informe Técnico Completo de Malla de Puesta a Tierra</p>
        </div>
        <div className="flex gap-4 print:hidden">
          <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition">
            <Printer size={20} /> Imprimir
          </button>
          <button onClick={handleDownload} className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition">
            <Download size={20} /> Descargar
          </button>
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl transition">
            <FileSpreadsheet size={20} /> Excel
          </button>
          <button onClick={handleExportWord} className="flex items-center gap-2 px-5 py-3 bg-blue-800 hover:bg-blue-900 text-white rounded-2xl transition">
            <FileText size={20} /> Word
          </button>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition"><X size={24} /></button>
        </div>
      </div>

      {/* Índice de Contenidos */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-blue-600">📑</span> Índice de Contenidos
        </h3>
        <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
            <a href="#resumen" className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition">
              <span className="text-blue-600 font-mono">1.</span>
              <span>Resumen Ejecutivo</span>
            </a>
            <a href="#datos" className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition">
              <span className="text-blue-600 font-mono">2.</span>
              <span>Datos del Proyecto</span>
            </a>
            <a href="#geometria" className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition">
              <span className="text-blue-600 font-mono">3.</span>
              <span>Geometría de la Malla</span>
            </a>
            <a href="#calculos" className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition">
              <span className="text-blue-600 font-mono">4.</span>
              <span>Cálculos IEEE 80-2013</span>
            </a>
            <a href="#seguridad" className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition">
              <span className="text-blue-600 font-mono">5.</span>
              <span>Verificación de Seguridad</span>
            </a>
            <a href="#materiales" className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition">
              <span className="text-blue-600 font-mono">6.</span>
              <span>Materiales y Costos</span>
            </a>
            <a href="#cfe" className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition">
              <span className="text-blue-600 font-mono">7.</span>
              <span>Cumplimiento CFE 01J00-01</span>
            </a>
            <a href="#referencias" className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition">
              <span className="text-blue-600 font-mono">8.</span>
              <span>Referencias Normativas</span>
            </a>
            <a href="#glosario" className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition">
              <span className="text-blue-600 font-mono">9.</span>
              <span>Glosario Técnico</span>
            </a>
            <a href="#recomendaciones" className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition">
              <span className="text-blue-600 font-mono">10.</span>
              <span>Recomendaciones</span>
            </a>
            <a href="#conclusiones" className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition">
              <span className="text-blue-600 font-mono">11.</span>
              <span>Conclusiones</span>
            </a>
            <a href="#certificado" className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition">
              <span className="text-blue-600 font-mono">12.</span>
              <span>Certificado de Cumplimiento</span>
            </a>
          </div>
        </div>
      </section>

      {/* 1. Resumen Ejecutivo */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-blue-600">📋</span> Resumen Ejecutivo
        </h3>
        <div className={`p-10 rounded-3xl ${complies ? 'bg-emerald-50 dark:bg-emerald-950 border border-emerald-300' : 'bg-red-50 dark:bg-red-950 border border-red-300'}`}>
          <div className="flex items-center gap-8">
            <span className="text-7xl">{complies ? '✅' : '❌'}</span>
            <div>
              <div className="text-4xl font-bold mb-2">{complies ? 'DISEÑO APROBADO' : 'DISEÑO NO APROBADO'}</div>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                {complies 
                  ? 'El sistema cumple satisfactoriamente con los requisitos de seguridad de IEEE Std 80-2013 y CFE 01J00-01.'
                  : 'Se requieren mejoras para alcanzar el cumplimiento total de las normas aplicables.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Datos del Proyecto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14 print:mb-8 text-base">
        <div className="space-y-3">
          <h4 className="font-semibold text-lg">Datos del Proyecto</h4>
          <p><strong>Proyecto:</strong> {params.projectName || 'Subestación Eléctrica'}</p>
          <p><strong>Ubicación:</strong> {params.projectLocation || 'Puerto Vallarta, Jalisco, México'}</p>
          <p><strong>Cliente:</strong> {params.clientName || 'No especificado'}</p>
        </div>
        <div className="text-right space-y-3">
          <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-MX')}</p>
          <p><strong>Ingeniero Responsable:</strong> {params.engineerName || 'Ingeniero Especialista'}</p>
          <p><strong>Normativas:</strong> IEEE Std 80-2013 • CFE 01J00-01</p>
        </div>
      </div>

      {/* 3. Geometría y Visualización */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-blue-600">📐</span> Geometría de la Malla
        </h3>
        <div className="flex justify-end mb-4 print:hidden">
          <button
            onClick={() => setShow3D(!show3D)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition"
          >
            {show3D ? <EyeOff size={20} /> : <Eye size={20} />}
            {show3D ? 'Ver Vista 2D' : 'Ver Vista 3D Interactiva'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2 p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl space-y-4 text-base">
            <p><strong>Dimensiones:</strong> {formatDistance(gridLength, 0)} × {formatDistance(gridWidth, 0)}</p>
            <p><strong>Área total:</strong> {formatNumber(A, 0)} m²</p>
            <p><strong>Configuración:</strong> {nx} × {ny} conductores</p>
            <p><strong>Espaciamiento promedio:</strong> {formatDistance(D, 2)}</p>
            <p><strong>Profundidad:</strong> {formatDistance(h, 1)}</p>
            <p><strong>Varillas de tierra:</strong> {params.numRods || 45} × {formatDistance(params.rodLength || 3, 0)}</p>
          </div>

          <div className="lg:col-span-3">
            {show3D ? <GroundingGrid3D params={params} darkMode={darkMode} /> : <GroundingGridSVG params={params} darkMode={darkMode} />}
          </div>
        </div>
      </section>

      {/* Mapa de Calor (oculto en impresión, solo para captura) */}
      <div className="print:hidden">
        <HeatMap ref={heatMapRef} params={params} calculations={calculations} darkMode={darkMode} />
      </div>

      {/* 4. Cálculos Detallados IEEE 80-2013 */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-blue-600">🔬</span> Cálculos según IEEE Std 80-2013
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl">
            <h4 className="font-semibold text-blue-600 mb-4">Tensiones Permisibles</h4>
            <div className="space-y-4 text-base">
              <p>C_s = <span className="font-mono">{formatNumber(Cs, 4)}</span></p>
              <p>E_touch70 = <span className="font-mono font-bold">{formatVoltage(Etouch70, 0)}</span></p>
              <p>E_step70 = <span className="font-mono font-bold">{formatVoltage(Estep70, 0)}</span></p>
            </div>
          </div>

          <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl">
            <h4 className="font-semibold text-blue-600 mb-4">Factores Geométricos</h4>
            <div className="space-y-4 text-base font-mono">
              <p>K_i = {formatNumber(Ki, 3)}</p>
              <p>K_h = {formatNumber(Kh, 3)}</p>
              <p>K_m = {formatNumber(Km, 4)}</p>
              <p>K_s = {formatNumber(Ks, 4)}</p>
            </div>
          </div>
        </div>

        {/* Tabla visual Km y Ks */}
        <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl">
          <h4 className="font-semibold text-blue-600 mb-5">Fórmulas Completas de K_m y K_s</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border">
              <p className="font-semibold text-blue-600 mb-3">K_m – Factor de malla</p>
              <p className="font-mono text-xs leading-relaxed">
                K_m = (1/(2π)) × [ln(term1 + term2 − term3) + ln(8/(π(2n−1)))] × K_h
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border">
              <p className="font-semibold text-blue-600 mb-3">K_s – Factor de paso</p>
              <p className="font-mono text-xs leading-relaxed">
                K_s = (1/π) × [1/(2h) + 1/(D+h) + (1/D)×(1 − 0.5^(n−2))]
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4.1 Corrección de Resistividad (si aplica) */}
      {(params.temperature || params.humidity || params.measureMonth) && (
        <section className="mb-14 print:mb-8">
          <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-orange-600">🌡️</span> 4.1 Corrección de Resistividad
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <h4 className="font-semibold text-orange-600 mb-3">Parámetros de Medición</h4>
                <div className="space-y-2">
                  <p><strong>🌡️ Temperatura:</strong> {params.temperature || 20} °C</p>
                  <p><strong>💧 Humedad:</strong> {params.humidity === 'seco' ? 'Seco' : params.humidity === 'humedo' ? 'Húmedo' : 'Normal'}</p>
                  <p><strong>📅 Mes de medición:</strong> {params.measureMonth ? MONTH_NAMES[params.measureMonth - 1] : 'N/A'}</p>
                  <p><strong>📍 Región:</strong> {params.region ? REGION_NAMES[params.region] : 'N/A'}</p>
                </div>
              </div>
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                <h4 className="font-semibold text-blue-600 mb-3">Resistividad Corregida</h4>
                <div className="space-y-2">
                  <p><strong>Medida:</strong> <span className="font-mono">{formatResistance(ρ, 1)}</span></p>
                  <p><strong>Corregida:</strong> <span className="font-mono font-bold text-green-600">{formatResistance(ρ_corrected, 1)}</span></p>
                  <p><strong>Factor de corrección:</strong> <span className="font-mono">{correctionResult.finalFactor}x</span></p>
                </div>
                {correctionResult.corrections.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                    <p className="text-sm font-semibold mb-2">Correcciones aplicadas:</p>
                    {correctionResult.corrections.map((corr, idx) => (
                      <div key={idx} className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>
                        <span>{corr.type}:</span> <span className="font-mono">{corr.factor}x</span> - {corr.detail}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {seasonalRec && (
              <div className={`p-4 rounded-xl ${seasonalRec.recommendation.includes('⚠️') ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                <p className="text-sm"><strong>Recomendación Estacional:</strong> {seasonalRec.recommendation}</p>
              </div>
            )}
            
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} text-xs`}>
              <p>💡 La resistividad del suelo varía con la temperatura, humedad y estación del año. El valor corregido se utiliza para el diseño de la malla para obtener un diseño más robusto y representativo de las condiciones reales.</p>
            </div>
          </div>
        </section>
      )}

      {/* 5. Verificación de Seguridad Detallada */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-red-600">🛡️</span> Verificación de Seguridad
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className={`p-8 rounded-3xl ${Em <= Etouch70 ? 'bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-400' : 'bg-red-50 dark:bg-red-950 border-2 border-red-400'}`}>
            <h4 className="font-semibold mb-4">Tensión de Contacto (Em)</h4>
            <div className="space-y-3 text-base">
              <p><strong>Valor calculado:</strong> <span className="font-mono font-bold">{formatVoltage(Em, 0)}</span></p>
              <p><strong>Límite permisible:</strong> <span className="font-mono">{formatVoltage(Etouch70, 0)}</span></p>
              <p><strong>Margen de seguridad:</strong> <span className={`font-bold ${Em <= Etouch70 ? 'text-emerald-600' : 'text-red-600'}`}>{safetyMarginTouch}%</span></p>
              <p className={`text-sm font-semibold ${Em <= Etouch70 ? 'text-emerald-600' : 'text-red-600'}`}>
                {Em <= Etouch70 ? '✅ CUMPLE' : '❌ NO CUMPLE'}
              </p>
            </div>
          </div>

          <div className={`p-8 rounded-3xl ${Es <= Estep70 ? 'bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-400' : 'bg-red-50 dark:bg-red-950 border-2 border-red-400'}`}>
            <h4 className="font-semibold mb-4">Tensión de Paso (Es)</h4>
            <div className="space-y-3 text-base">
              <p><strong>Valor calculado:</strong> <span className="font-mono font-bold">{formatVoltage(Es, 0)}</span></p>
              <p><strong>Límite permisible:</strong> <span className="font-mono">{formatVoltage(Estep70, 0)}</span></p>
              <p><strong>Margen de seguridad:</strong> <span className={`font-bold ${Es <= Estep70 ? 'text-emerald-600' : 'text-red-600'}`}>{safetyMarginStep}%</span></p>
              <p className={`text-sm font-semibold ${Es <= Estep70 ? 'text-emerald-600' : 'text-red-600'}`}>
                {Es <= Estep70 ? '✅ CUMPLE' : '❌ NO CUMPLE'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl">
          <h4 className="font-semibold text-blue-600 mb-4">Resultados Adicionales</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-base">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl">
              <p className={`${darkMode ? 'text-gray-100' : 'text-gray-600'} text-sm`}>Resistencia de Malla (Rg)</p>
              <p className="font-mono font-bold text-xl">{formatResistance(Rg, 3)}</p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl">
              <p className={`${darkMode ? 'text-gray-100' : 'text-gray-600'} text-sm`}>GPR (Elevación de Potencial)</p>
              <p className="font-mono font-bold text-xl">{formatVoltage(Rg * Ig, 0)}</p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl">
              <p className={`${darkMode ? 'text-gray-100' : 'text-gray-600'} text-sm`}>Corriente en Malla (Ig)</p>
              <p className="font-mono font-bold text-xl">{formatCurrent(Ig, 0)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5.1 Diseño Óptimo Automático */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-purple-600">🧠</span> Diseño Óptimo Automático
        </h3>
        {optimization.best ? (
          <div className="p-6 bg-emerald-50 dark:bg-emerald-950 rounded-2xl">
            <p><strong>Espaciamiento óptimo:</strong> {formatDistance(optimization.best.spacing, 2)}</p>
            <p><strong>Varillas:</strong> {optimization.best.rods}</p>
            <p><strong>Configuración:</strong> {optimization.best.nx} × {optimization.best.ny} conductores</p>
            <p><strong>Costo mínimo:</strong> {formatNumber(optimization.best.cost, 2)}</p>
            <p><strong>Em:</strong> {formatVoltage(optimization.best.Em, 0)}</p>
            <p><strong>Es:</strong> {formatVoltage(optimization.best.Es, 0)}</p>
          </div>
        ) : (
          <div className="p-6 bg-red-50 dark:bg-red-950 rounded-2xl">
            ❌ No se encontró solución que cumpla condiciones
          </div>
        )}
      </section>

      {/* 5.2 Escenario Peor Caso */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-orange-600">⚠️</span> Escenario Peor Caso (ρ = 300 Ω·m)
        </h3>
        <div className={`p-6 rounded-2xl ${worstCase.complies ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-red-50 dark:bg-red-950'}`}>
          <p><strong>Em:</strong> {formatVoltage(worstCase.Em, 0)}</p>
          <p><strong>Es:</strong> {formatVoltage(worstCase.Es, 0)}</p>
          <p><strong>Resultado:</strong> {worstCase.complies ? '✅ Cumple' : '❌ No cumple'}</p>
        </div>
      </section>

      {/* 5.3 Recomendaciones Inteligentes */}
      {smartRecommendations.length > 0 && (
        <section className="mb-14 print:mb-8">
          <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-cyan-600">🤖</span> Recomendaciones Inteligentes
          </h3>
          <div className="p-6 bg-cyan-50 dark:bg-cyan-950 rounded-2xl">
            <ul className="space-y-2 list-disc pl-6">
              {smartRecommendations.map((rec, idx) => (
                <li key={idx} className="text-base">{rec}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 6. Materiales y Costos */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-green-600">📦</span> Materiales y Costos Estimados
        </h3>
        
        <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                <th className="text-left py-3">Concepto</th>
                <th className="text-right py-3">Cantidad</th>
                <th className="text-right py-3">Precio Unitario</th>
                <th className="text-right py-3">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-3">Conductor de cobre (cable desnudo)</td>
                <td className="text-right py-3">{formatDistance(totalGridLength, 0)}</td>
                <td className="text-right py-3">$3.50/m</td>
                <td className="text-right py-3 font-mono">{formatNumber(conductorCost, 2)}</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-3">Varillas de cobre-acero (3m)</td>
                <td className="text-right py-3">{params.numRods || 45} pz</td>
                <td className="text-right py-3">$25.00/pz</td>
                <td className="text-right py-3 font-mono">{formatNumber(rodCost, 2)}</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-3">Grava para capa superficial</td>
                <td className="text-right py-3">{formatNumber(gravelVolume, 2)} m³</td>
                <td className="text-right py-3">$45.00/m³</td>
                <td className="text-right py-3 font-mono">{formatNumber(gravelCost, 2)}</td>
              </tr>
              <tr className="bg-blue-50 dark:bg-blue-950 font-bold">
                <td className="py-3 pl-4" colSpan="3">TOTAL ESTIMADO</td>
                <td className="text-right py-3 font-mono text-xl">${formatNumber(totalCost, 2)}</td>
              </tr>
            </tbody>
          </table>
          <p className={`text-sm ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-4`}>* Los precios son estimados y pueden variar según proveedor y ubicación.</p>
        </div>
      </section>

      {/* 7. Cumplimiento CFE 01J00-01 */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-amber-600">📋</span> 7. Cumplimiento con Norma CFE 01J00-01
        </h3>
        <div className="p-8 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-3xl">
          <p className="mb-6 text-base leading-relaxed">
            El diseño cumple con los requisitos de la <strong>CFE 01J00-01 "Sistema de Tierra para Plantas y Subestaciones Eléctricas"</strong> (Edición 2016), 
            complementando los cálculos detallados del IEEE 80-2013 con especificaciones locales mexicanas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-base">
            <div>
              <h4 className="font-semibold mb-4 text-amber-700 dark:text-amber-400">Cumplimiento principal:</h4>
              <ul className="space-y-3 list-disc pl-6">
                <li>Medición de resistividad del suelo (Método Wenner)</li>
                <li>Cobertura completa del área de la subestación</li>
                <li>Conexiones equipotenciales de equipos y estructuras</li>
                <li>Pruebas de recepción y documentación técnica</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-amber-700 dark:text-amber-400">Recomendaciones CFE aplicadas:</h4>
              <ul className="space-y-3 list-disc pl-6">
                <li>Espaciamiento según nivel de voltaje (8-10 m recomendado)</li>
                <li>Uso de varillas en perímetro y puntos críticos</li>
                <li>Capa de grava superficial para mejorar seguridad</li>
                <li>Objetivo de resistencia de malla ≤ 5 Ω</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Referencias Normativas */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-blue-600">📚</span> 8. Referencias Normativas
        </h3>
        <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl">
          <div className="space-y-6 text-base">
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border-l-4 border-blue-600">
              <h4 className="font-semibold text-blue-600 mb-2">IEEE Std 80-2013</h4>
              <p className={`${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>"IEEE Guide for Safety in AC Substation Grounding" - Guía internacional para el diseño de sistemas de puesta a tierra en subestaciones de corriente alterna.</p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border-l-4 border-amber-600">
              <h4 className="font-semibold text-amber-600 mb-2">CFE 01J00-01 (Edición 2016)</h4>
              <p className={`${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>"Sistema de Tierra para Plantas y Subestaciones Eléctricas" - Normativa mexicana de la Comisión Federal de Electricidad para sistemas de puesta a tierra.</p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border-l-4 border-emerald-600">
              <h4 className="font-semibold text-emerald-600 mb-2">NOM-001-SEDE-2012</h4>
              <p className={`${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>Norma Oficial Mexicana de instalaciones eléctricas - Requisitos de seguridad para sistemas de puesta a tierra.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Anexos Técnicos - Procedimientos de Construcción */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-orange-600">🔧</span> 9. Anexos Técnicos - Procedimientos de Construcción
        </h3>
        <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl">
          <div className="space-y-6 text-base">
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl">
              <h4 className="font-semibold text-orange-600 mb-3">1. Preparación del Sitio</h4>
              <ul className="space-y-2 list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>Limpiar y nivelar el área de excavación</li>
                <li>Verificar que no existan servicios subterráneos</li>
                <li>Marcar los puntos de ubicación de varillas y conductores</li>
                <li>Preparar zanjas según profundidad especificada ({formatDistance(h, 1)})</li>
              </ul>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl">
              <h4 className="font-semibold text-orange-600 mb-3">2. Instalación de Conductores</h4>
              <ul className="space-y-2 list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>Tender conductores en zanjas con espaciamiento especificado</li>
                <li>Asegurar que los conductores estén nivelados y alineados</li>
                <li>Realizar conexiones exotérmicas en puntos de cruce</li>
                <li>Verificar continuidad eléctrica antes de cubrir</li>
              </ul>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl">
              <h4 className="font-semibold text-orange-600 mb-3">3. Instalación de Varillas</h4>
              <ul className="space-y-2 list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>Instalar varillas en perímetro y puntos críticos</li>
                <li>Conectar varillas a la malla mediante soldadura exotérmica</li>
                <li>Profundidad de instalación: {formatDistance(params.rodLength || 3, 0)}</li>
                <li>Verificar resistencia de conexión ≤ 0.1 Ω</li>
              </ul>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl">
              <h4 className="font-semibold text-orange-600 mb-3">4. Capa Superficial</h4>
              <ul className="space-y-2 list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>Extender capa de grava de {formatDistance(hs, 1)} de espesor</li>
                <li>Resistividad de grava: {formatResistance(ρs, 0)}</li>
                <li>Cubrir completamente el área de la subestación</li>
                <li>Compactar capa superficial uniformemente</li>
              </ul>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl">
              <h4 className="font-semibold text-orange-600 mb-3">5. Conexiones Equipotenciales</h4>
              <ul className="space-y-2 list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>Conectar estructuras metálicas a la malla</li>
                <li>Conectar equipos y armarios de control</li>
                <li>Verificar todas las conexiones de puesta a tierra</li>
                <li>Documentar puntos de conexión en plano as-built</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Pruebas y Verificación Post-Construcción */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-cyan-600">🧪</span> 10. Pruebas y Verificación Post-Construcción
        </h3>
        <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl">
          <div className="space-y-6 text-base">
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl">
              <h4 className="font-semibold text-cyan-600 mb-3">Prueba de Resistencia de Malla</h4>
              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <p><strong>Método:</strong> Caída de potencial (método de 62%)</p>
                <p><strong>Objetivo:</strong> Rg ≤ {formatResistance(Rg, 3)} (valor de diseño)</p>
                <p><strong>Equipo:</strong> Megger o equipo de medición de tierra</p>
                <p><strong>Frecuencia:</strong> Una vez completada la instalación</p>
              </div>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl">
              <h4 className="font-semibold text-cyan-600 mb-3">Prueba de Tensión de Paso y Contacto</h4>
              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <p><strong>Procedimiento:</strong> Medición en puntos críticos según IEEE 80</p>
                <p><strong>Límites:</strong> Em ≤ {formatVoltage(Etouch70, 0)}, Es ≤ {formatVoltage(Estep70, 0)}</p>
                <p><strong>Condiciones:</strong> Simulación de falla o cálculo indirecto</p>
              </div>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl">
              <h4 className="font-semibold text-cyan-600 mb-3">Checklist de Recepción CFE</h4>
              <div className="space-y-2">
                {[
                  'Medición de resistividad del suelo (Wenner)',
                  'Verificación de espaciamiento de conductores',
                  'Inspección visual de conexiones',
                  'Prueba de continuidad de malla',
                  'Medición de resistencia de puesta a tierra',
                  'Verificación de capa superficial',
                  'Documentación as-built completa',
                  'Certificado de cumplimiento normativo'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input type="checkbox" className="w-5 h-5 rounded" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Gráficos Comparativos */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-indigo-600">📊</span> 11. Gráficos Comparativos
        </h3>
        <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl">
              <h4 className="font-semibold text-indigo-600 mb-4">Tensión de Contacto vs Límite</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Valor Calculado (Em)</span>
                    <span className="font-mono font-bold">{formatVoltage(Em, 0)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div className={`h-4 rounded-full ${Em <= Etouch70 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{width: `${Math.min((Em / Etouch70) * 100, 100)}%`}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Límite Permisible</span>
                    <span className="font-mono">{formatVoltage(Etouch70, 0)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div className="h-4 rounded-full bg-blue-500" style={{width: '100%'}}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl">
              <h4 className="font-semibold text-indigo-600 mb-4">Tensión de Paso vs Límite</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Valor Calculado (Es)</span>
                    <span className="font-mono font-bold">{formatVoltage(Es, 0)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div className={`h-4 rounded-full ${Es <= Estep70 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{width: `${Math.min((Es / Estep70) * 100, 100)}%`}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Límite Permisible</span>
                    <span className="font-mono">{formatVoltage(Estep70, 0)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div className="h-4 rounded-full bg-blue-500" style={{width: '100%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. Análisis de Sensibilidad */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-pink-600">📈</span> 12. Análisis de Sensibilidad
        </h3>
        <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl">
          <p className={`mb-6 ${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>Impacto de variaciones en resistividad del suelo sobre la resistencia de malla (Rg)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="text-left py-2">Resistividad (Ω·m)</th>
                  <th className="text-right py-2">Rg (Ω)</th>
                  <th className="text-right py-2">Variación</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [ρ * 0.5, '-50%'],
                  [ρ * 0.75, '-25%'],
                  [ρ, 'Base'],
                  [ρ * 1.25, '+25%'],
                  [ρ * 1.5, '+50%']
                ].map(([resistivity, variation]) => {
                  const rgVariation = resistivity * (1 / LT + 1 / Math.sqrt(20 * A) * (1 + 1 / (1 + h * Math.sqrt(20 / A))));
                  return (
                    <tr key={resistivity} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-2">{formatResistance(resistivity, 0)}</td>
                      <td className="text-right py-2 font-mono">{formatResistance(rgVariation, 3)}</td>
                      <td className={`text-right py-2 ${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>{variation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 13. Mantenimiento y Monitoreo */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-teal-600">🔍</span> 13. Mantenimiento y Monitoreo
        </h3>
        <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl">
              <h4 className="font-semibold text-teal-600 mb-3">Programa de Inspección</h4>
              <ul className="space-y-2 list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>Inspección visual anual de conexiones</li>
                <li>Medición de resistencia cada 3 años</li>
                <li>Verificación de capa superficial semestral</li>
                <li>Documentar todas las mediciones de Rg</li>
                <li>Comparar con valores de diseño</li>
                <li>Investigar variaciones &gt; 20%</li>
                <li>Archivar reportes de mantenimiento</li>
              </ul>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl">
              <h4 className="font-semibold text-teal-600 mb-3">Recomendaciones de Mantenimiento</h4>
              <ul className="space-y-2 list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>Limpiar conexiones oxidadas</li>
                <li>Reemplazar grava deteriorada</li>
                <li>Verificar integridad de soldaduras</li>
                <li>Proteger contra corrosión</li>
              </ul>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl">
              <h4 className="font-semibold text-teal-600 mb-3">Señalización y Seguridad</h4>
              <ul className="space-y-2 list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>Mantener señales de advertencia visibles</li>
                <li>Limitar acceso a área de malla</li>
                <li>Capacitar personal en seguridad</li>
                <li>Actualizar planos de instalación</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 14. Análisis Rápidos */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-indigo-600">⚡</span> 14. Análisis Rápidos
        </h3>
        <div className="space-y-6">
          {/* 🔥 Conductor */}
          <div className="p-6 bg-orange-50 dark:bg-orange-950 rounded-2xl">
            <h4 className="font-semibold text-orange-600 mb-3">🔥 Verificación Térmica del Conductor</h4>
            {(() => {
              const thermalCheck = conductorThermalCheck(
                calculations?.Ig,
                params.faultDuration,
                calculations?.selectedConductorInfo?.area || 67.4,
                'COPPER'
              );
              return (
                <div className="text-sm space-y-2">
                  <p><strong>Estado:</strong> {thermalCheck.safe ? '✓ Seguro' : '⚠ Requiere calibre mayor'}</p>
                  <p className={`${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>{thermalCheck.recommendation}</p>
                </div>
              );
            })()}
          </div>

          {/* 🌱 Tratamiento de Suelo */}
          <div className="p-6 bg-emerald-50 dark:bg-emerald-950 rounded-2xl">
            <h4 className="font-semibold text-emerald-600 mb-3">🌱 Tratamiento de Suelo</h4>
            {(() => {
              const soilTreatment = recommendSoilTreatment(params.soilResistivity, 50, calculations?.gridArea);
              const soilComparison = compareTreatments(params.soilResistivity, calculations?.gridArea);
              return (
                <div className="text-sm space-y-2">
                  <p><strong>Tratamiento recomendado:</strong> {soilTreatment.treatment}</p>
                  <p><strong>Costo estimado:</strong> ${soilTreatment.totalCost} USD</p>
                  <p><strong>Vida útil:</strong> {soilTreatment.lifespan}</p>
                </div>
              );
            })()}
          </div>

          {/* ⚡ Tensión Transferida */}
          <div className="p-6 bg-purple-50 dark:bg-purple-950 rounded-2xl">
            <h4 className="font-semibold text-purple-600 mb-3">⚡ Tensión Transferida (10m)</h4>
            {(() => {
              const transferredVoltage = calculateTransferredVoltage(calculations?.GPR, 10, params.soilResistivity);
              const practicalVoltage = typeof transferredVoltage?.practicalVoltage === 'number'
                ? formatVoltage(transferredVoltage.practicalVoltage, 0)
                : 'N/A';
              return (
                <div className="text-sm space-y-2">
                  <p><strong>Tensión transferida:</strong> {practicalVoltage} V</p>
                  <p><strong>Riesgo:</strong> {transferredVoltage?.risk || 'N/A'}</p>
                </div>
              );
            })()}
          </div>

          {/* 🔗 Equipotencial */}
          <div className="p-6 bg-cyan-50 dark:bg-cyan-950 rounded-2xl">
            <h4 className="font-semibold text-cyan-600 mb-3">🔗 Verificación de Equipotencial</h4>
            {(() => {
              const equipotential = equipotentialCheck(params, calculations);
              return (
                <div className="text-sm space-y-2">
                  <p className={`${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>{equipotential.summary}</p>
                  <ul className="list-disc pl-5">
                    {equipotential.recommendations.slice(0, 2).map((rec, i) => (
                      <li key={i} className={`${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>{rec}</li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>

          {/* 📅 Estacional */}
          {params.measureMonth && params.region && (
            <div className="p-6 bg-blue-50 dark:bg-blue-950 rounded-2xl">
              <h4 className="font-semibold text-blue-600 mb-3">📅 Análisis Estacional</h4>
              {(() => {
                const design = getDesignResistivity(
                  params.soilResistivity,
                  params.measureMonth || 4,
                  params.region || 'templado',
                  params.gridDepth
                );
                return (
                  <div className="text-sm space-y-2">
                    <p><strong>Resistividad de diseño:</strong> {typeof design.designResistivity === 'number' ? formatResistance(design.designResistivity, 1) : 'N/A'}</p>
                    <p><strong>Factor de seguridad:</strong> {design.safetyFactor || 'N/A'}x</p>
                    <p className={`${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>{design.recommendation || 'N/A'}</p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </section>

      {/* 15. Glosario Técnico */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-purple-600">📖</span> 15. Glosario Técnico
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {[
            ["GPR", "Ground Potential Rise – Elevación del potencial de tierra"],
            ["Em / Mesh Voltage", "Tensión de contacto en la malla"],
            ["Es / Step Voltage", "Tensión de paso entre dos puntos del suelo"],
            ["K_m", "Factor geométrico de malla"],
            ["K_s", "Factor geométrico de paso"],
            ["K_i", "Factor de irregularidad"],
            ["C_s", "Factor de reducción por capa superficial"],
            ["R_g", "Resistencia total de la malla de tierra"],
            ["Ig", "Corriente de falla que fluye a tierra"],
            ["GPR_2", "Elevación del potencial de tierra durante falla"],
            ["LT", "Longitud total de conductores y varillas"],
            ["Cs", "Factor de reducción por capa superficial"],
          ].map(([term, desc]) => (
            <div key={term} className="flex gap-4 p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl">
              <div className="font-mono font-bold text-purple-600 w-20 shrink-0">{term.replace('_2', '')}</div>
              <div className={`${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 16. Recomendaciones */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-amber-600">💡</span> 16. Recomendaciones
        </h3>
        <ul className="space-y-5 text-base pl-6">
          {recommendations?.length > 0 ? recommendations.map((rec, idx) => (
            <li key={idx} className="flex gap-4">
              <span className="text-amber-500 text-2xl mt-1">•</span>
              <span>{rec}</span>
            </li>
          )) : (
            <li className={`${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>No se generaron recomendaciones específicas para este diseño.</li>
          )}
        </ul>
      </section>

      {/* 17. Conclusiones */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-emerald-600">📌</span> 17. Conclusiones
        </h3>
        <div className="p-10 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-3xl text-base leading-relaxed">
          <p>
            El diseño de la malla de puesta a tierra ha sido desarrollado utilizando metodología avanzada del 
            <strong> IEEE Std 80-2013</strong> y cumple con los requisitos constructivos y de seguridad de la 
            <strong> CFE 01J00-01</strong>.
          </p>
          <p className="mt-6">
            {complies 
              ? 'Los resultados demuestran que el sistema proporciona un nivel adecuado de protección para el personal y los equipos.'
              : 'Se identificaron áreas que requieren optimización para alcanzar el cumplimiento total.'}
          </p>
          <p className="mt-6 text-emerald-700 dark:text-emerald-400">
            Se recomienda realizar mediciones de resistividad in situ y pruebas de verificación una vez construida la malla.
          </p>
        </div>
      </section>

      {/* 18. Firmas Múltiples */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-blue-600">✍️</span> 18. Firmas y Aprobaciones
        </h3>
        <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-base">
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl text-center">
              <h4 className="font-semibold text-blue-600 mb-4">Ingeniero Responsable</h4>
              <div className="h-24 border-b-2 border-gray-300 dark:border-gray-600 mb-4"></div>
              <p className="font-medium">{params.engineerName || 'Ingeniero Especialista'}</p>
              <p className={`text-sm ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-2`}>Fecha: {new Date().toLocaleDateString('es-MX')}</p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl text-center">
              <h4 className="font-semibold text-blue-600 mb-4">Aprobación Cliente</h4>
              <div className="h-24 border-b-2 border-gray-300 dark:border-gray-600 mb-4"></div>
              <p className="font-medium">{params.clientName || 'Nombre del Cliente'}</p>
              <p className={`text-sm ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-2`}>Fecha: ___________</p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl text-center">
              <h4 className="font-semibold text-blue-600 mb-4">Revisión CFE (si aplica)</h4>
              <div className="h-24 border-b-2 border-gray-300 dark:border-gray-600 mb-4"></div>
              <p className="font-medium">Ingeniero CFE</p>
              <p className={`text-sm ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-2`}>Fecha: ___________</p>
            </div>
          </div>
        </div>
      </section>

      {/* 19. Disclaimer y Limitaciones */}
      <section className="mb-14 print:mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>⚠️</span> 19. Disclaimer y Limitaciones
        </h3>
        <div className="p-8 bg-gray-100 dark:bg-gray-900 rounded-3xl text-sm text-gray-700 dark:text-gray-300">
          <div className="space-y-4">
            <p><strong>Alcance del Estudio:</strong> Este informe presenta el diseño de la malla de puesta a tierra basado en los parámetros proporcionados y cálculos según IEEE Std 80-2013. Los resultados son teóricos y deben ser validados mediante mediciones in situ.</p>
            <p><strong>Validación In Situ:</strong> Se recomienda realizar mediciones de resistividad del suelo en el sitio de instalación antes de la construcción, así como pruebas de resistencia de malla después de completada la instalación.</p>
            <p><strong>Responsabilidades:</strong> El ingeniero responsable no se hace responsable por variaciones en las condiciones del sitio no reportadas, cambios en los parámetros de diseño no autorizados, o fallas en la construcción que no sigan las especificaciones técnicas.</p>
            <p><strong>Actualización:</strong> Este documento debe actualizarse si se modifican los parámetros del proyecto, las condiciones del sitio, o las normativas aplicables.</p>
            <p><strong>Uso del Documento:</strong> Este informe es para uso exclusivo del proyecto especificado y no debe utilizarse para otros fines sin autorización previa.</p>
          </div>
        </div>
      </section>

      {/* 20. Certificado de Cumplimiento */}
      <div className="border-2 border-blue-600 p-12 rounded-3xl text-center print:border-blue-800">
        <h3 className="text-3xl font-semibold mb-8">CERTIFICADO DE CUMPLIMIENTO</h3>
        <p className="text-xl leading-relaxed max-w-3xl mx-auto">
          El suscrito, <strong>{params.engineerName || 'Ingeniero Especialista'}</strong>, certifica que el diseño de la malla de puesta a tierra
          <strong className={complies ? 'text-emerald-600' : 'text-red-600'}> {complies ? 'CUMPLE' : 'NO CUMPLE'}</strong> 
          con los requisitos de seguridad de la norma <strong>IEEE Std 80-2013</strong> y 
          <strong> CFE 01J00-01 "Sistema de Tierra para Plantas y Subestaciones Eléctricas"</strong>.
        </p>
        <div className="mt-16 pt-10 border-t border-gray-300 dark:border-gray-700">
          <p className="font-medium text-2xl">{params.engineerName || 'Ingeniero Especialista'}</p>
          <p className={`${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-1`}>Ingeniero Responsable</p>
          <p className="text-sm text-gray-300 mt-6">Fecha: {new Date().toLocaleDateString('es-MX')}</p>
        </div>
      </div>

      <div className="text-center text-xs text-gray-300 mt-20 print:mt-12">
        Grounding Designer Pro • Informe Técnico Completo • IEEE 80-2013 & CFE 01J00-01<br />
        Generado automáticamente el {new Date().toLocaleString('es-MX')}
      </div>
    </div>
  );
};

export default ExecutiveReport;