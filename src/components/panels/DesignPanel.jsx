import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, RefreshCw, Brain, Zap, Settings, Download, FileText } from 'lucide-react';
import { ValidatedSection } from '../common/ValidatedSection';
import { InputField } from '../common/InputField';
import { MetricCard } from '../common/MetricCard';
import { FeatureGate, ProBadge } from '../common/FeatureGate';
import { FEATURES } from '../../constants/plans';
import { calculateFaultCurrent } from '../../services/faultCurrentCalculator.service';
import { SensitivityChart } from '../visualizations/SensitivityChart';
import { useSensitivityAnalysis } from '../../hooks/useSensitivityAnalysis';
import { useDesignOptimizer } from '../../hooks/useDesignOptimizer';
import { runCompletePipeline } from '../../core/groundingEngine';
import { generateReport, downloadReportJSON } from '../../core/report';
import { generateFullReport } from '../../utils/pdfGenerator';
import { HeatmapCanvas, exportCanvasImage } from '../../visual';
import { generateCorporatePDF } from '../../services/pdf/pdfEngine';
import { saveProject } from '../../services/projectService';
import { auth } from '../../firebase';
import { generateAISuggestions } from '../../services/aiSuggestionService';
import useStore from '../../store/useStore';
import { TEXT_COLORS, ACCENT_COLORS, BG_COLORS, BORDERS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/designTokens';
import { simulationApi } from '../../api/simulation.api';
import { reportsApi } from '../../api/reports.api';


export const DesignPanel = ({ params, calculations, updateParam, darkMode, recalculate }) => {
  const [localParams, setLocalParams] = useState(params);
  const [autoFaultCurrent, setAutoFaultCurrent] = useState(null);
  const [isAutoCalculating, setIsAutoCalculating] = useState(false);
  const [showSensitivity, setShowSensitivity] = useState(true);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [pipelineResults, setPipelineResults] = useState(null);
  const [loadingSimulation, setLoadingSimulation] = useState(false);
  const timeoutRef = useRef(null);
  const heatmapCanvasRef = useRef(null);
  const heatmapRef = useRef(null);

  const handleRunIEEE80Simulation = async () => {
    try {
      setLoadingSimulation(true);
      const result = await simulationApi.runIEEE80(localParams);
      
      // Update calculations with API results
      if (updateParam && result.results) {
        Object.entries(result.results).forEach(([key, value]) => {
          // Map API results to local calculation structure
          if (key === 'Rg') updateParam('Rg', value);
          if (key === 'GPR') updateParam('GPR', value);
          if (key === 'Em') updateParam('Em', value);
          if (key === 'Es') updateParam('Es', value);
          if (key === 'Etouch70') updateParam('Etouch70', value);
          if (key === 'Estep70') updateParam('Estep70', value);
          if (key === 'touchSafe70') updateParam('touchSafe70', value);
          if (key === 'stepSafe70') updateParam('stepSafe70', value);
          if (key === 'complies') updateParam('complies', value);
        });
      }
      
      return result;
    } catch (error) {
      console.error('IEEE 80 simulation API error:', error);
      // Fall back to local calculation
      if (recalculate) recalculate();
    } finally {
      setLoadingSimulation(false);
    }
  };

  const handleExportPDF = async () => {
    const heatmapImage = heatmapRef.current?.exportImage();

    if (!heatmapImage) {
      console.error('No se pudo exportar el heatmap');
      return;
    }

    try {
      // Use SaaS reports API
      const result = await reportsApi.generatePDF({
        calculations,
        params: localParams,
        heatmapImage,
        projectName: localParams.projectName || 'Untitled Project',
        clientName: localParams.clientName || 'N/A',
        engineer: localParams.engineerName || 'Engineer',
        date: new Date().toISOString()
      });

      // If job is queued, show status
      if (result.jobId) {
        alert('PDF generation queued. Job ID: ' + result.jobId);
        // Poll for status (simplified - in production would use proper polling)
        const checkStatus = setInterval(async () => {
          const status = await reportsApi.getJobStatus(result.jobId);
          if (status.status === 'completed') {
            clearInterval(checkStatus);
            alert('PDF generation completed!');
            // Download would happen here
          } else if (status.status === 'failed') {
            clearInterval(checkStatus);
            alert('PDF generation failed');
          }
        }, 2000);
      }
    } catch (error) {
      console.error('SaaS PDF API error, falling back to local:', error);
      // Fall back to local generation
      await generateCorporatePDF({
        calculations,
        params,
        heatmapImage
      });
    }
  };

  const sensitivityAnalysis = useSensitivityAnalysis(localParams);
  const optimizer = useDesignOptimizer();

  useEffect(() => {
    setLocalParams(params);
  }, [params]);

  const handleParamChange = useCallback((key, value) => {
    setLocalParams(prev => ({ ...prev, [key]: value }));
    if (updateParam) updateParam(key, value);
  }, [updateParam]);

  const calculateAutoFaultCurrent = useCallback(() => {
    setIsAutoCalculating(true);

    timeoutRef.current = setTimeout(() => {
      const result = calculateFaultCurrent(
        localParams.transformerKVA || 225,
        localParams.secondaryVoltage || 480,
        localParams.transformerImpedance || 5.5
      );

      setAutoFaultCurrent(result);

      if (localParams.autoCalculateFault !== false) {
        handleParamChange('faultCurrent', result.recommendedValue);
      }

      setIsAutoCalculating(false);
    }, 100);
  }, [localParams.transformerKVA, localParams.secondaryVoltage, localParams.transformerImpedance, localParams.autoCalculateFault, handleParamChange]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (localParams.transformerKVA && localParams.secondaryVoltage && localParams.transformerImpedance) {
      calculateAutoFaultCurrent();
    }
  }, [localParams.transformerKVA, localParams.secondaryVoltage, localParams.transformerImpedance, calculateAutoFaultCurrent]);

  const toggleAutoCalculate = () => {
    const newValue = !localParams.autoCalculateFault;
    handleParamChange('autoCalculateFault', newValue);

    if (newValue && autoFaultCurrent) {
      handleParamChange('faultCurrent', autoFaultCurrent.recommendedValue);
    }
  };

  const handleRunPipeline = async () => {
    setIsRunningPipeline(true);
    try {
      const pipeline = runCompletePipeline(localParams, {
        optimize: true,
        guidedOptimization: false,
        transientAnalysis: true
      });
      setPipelineResults(pipeline);
      alert('Pipeline completado exitosamente');
    } catch (error) {
      console.error('Error en pipeline:', error);
      alert('Error en pipeline: ' + error.message);
    } finally {
      setIsRunningPipeline(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const heatmapImage = exportCanvasImage(heatmapCanvasRef);

      if (!heatmapImage) {
        alert('Error: heatmap no disponible');
        return;
      }

      const result = await reportsApi.generatePDF({
        calculations,
        params: localParams,
        heatmapImage,
        projectName: localParams.projectName || 'Project',
        clientName: localParams.clientName || 'Client',
        engineer: localParams.engineerName || 'Engineer'
      });

      if (result.jobId) {
        alert('📄 Generación iniciada...');

        const interval = setInterval(async () => {
          const status = await reportsApi.getJobStatus(result.jobId);

          if (status.status === 'completed') {
            clearInterval(interval);

            // 🔥 DESCARGA REAL
            window.open(status.downloadUrl, '_blank');
          }

          if (status.status === 'failed') {
            clearInterval(interval);
            alert('❌ Error generando PDF');
          }
        }, 2000);
      }

    } catch (error) {
      console.error(error);
      alert('Error en generación PDF');
    }
  };

  const area = (localParams.gridLength || 0) * (localParams.gridWidth || 0);
  const perimeter = 2 * ((localParams.gridLength || 0) + (localParams.gridWidth || 0));
  const totalConductor = perimeter * (localParams.numParallel || 0);
  const totalRodLength = (localParams.numRods || 0) * (localParams.rodLength || 0);

  return (
    <div className="space-y-4">
      <ValidatedSection title="Diseño de Malla de Tierra" icon={Activity} status="info" darkMode={darkMode}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna 1 - Configuración de Malla */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold mb-3" style={{ color: TEXT_COLORS.primary }}>📐 Configuración de Malla</h4>
            <InputField label="Largo de Malla" type="manual" value={localParams.gridLength} onChange={(val) => handleParamChange('gridLength', val)} unit="m" min={1} max={100} step={0.5} />
            <InputField label="Ancho de Malla" type="manual" value={localParams.gridWidth} onChange={(val) => handleParamChange('gridWidth', val)} unit="m" min={1} max={100} step={0.5} />
            <InputField label="Profundidad" type="manual" value={localParams.gridDepth} onChange={(val) => handleParamChange('gridDepth', val)} unit="m" min={0.3} max={2} step={0.1} />
            <InputField label="Conductores en X" type="manual" value={localParams.numParallel} onChange={(val) => handleParamChange('numParallel', val)} min={2} max={30} step={1} />
            <InputField label="Conductores en Y" type="manual" value={localParams.numParallelY} onChange={(val) => handleParamChange('numParallelY', val)} min={2} max={30} step={1} />
            <InputField label="Número de Varillas" type="manual" value={localParams.numRods} onChange={(val) => handleParamChange('numRods', val)} min={0} max={100} step={1} />
            <InputField label="Longitud de Varilla" type="manual" value={localParams.rodLength} onChange={(val) => handleParamChange('rodLength', val)} unit="m" min={1} max={6} step={0.3} />
          </div>

          {/* Columna 2 - Suelo y Transformador */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold mb-3" style={{ color: TEXT_COLORS.primary }}>🌍 Características del Suelo</h4>
            <InputField label="Resistividad del Suelo" type="manual" value={localParams.soilResistivity} onChange={(val) => handleParamChange('soilResistivity', val)} unit="Ω·m" min={1} max={5000} step={10} />
            <InputField label="Resistividad Superficial" type="manual" value={localParams.surfaceLayer} onChange={(val) => handleParamChange('surfaceLayer', val)} unit="Ω·m" min={100} max={20000} step={100} />
            <InputField label="Espesor Superficial" type="manual" value={localParams.surfaceDepth} onChange={(val) => handleParamChange('surfaceDepth', val)} unit="m" min={0} max={0.5} step={0.01} />

            <h4 className="text-sm font-semibold mt-4 mb-3" style={{ color: TEXT_COLORS.primary }}>⚡ Transformador</h4>
            <InputField label="Capacidad del Transformador" type="manual" value={localParams.transformerKVA} onChange={(val) => handleParamChange('transformerKVA', val)} unit="kVA" min={15} max={5000} step={25} />
            <InputField label="Voltaje Secundario" type="manual" value={localParams.secondaryVoltage} onChange={(val) => handleParamChange('secondaryVoltage', val)} unit="V" min={120} max={480} step={10} />
            <InputField label="Impedancia del Transformador" type="manual" value={localParams.transformerImpedance} onChange={(val) => handleParamChange('transformerImpedance', val)} unit="%" min={2} max={8} step={0.5} />
          </div>

          {/* Columna 3 - Sistema Eléctrico y Resultados */}
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-semibold" style={{ color: TEXT_COLORS.primary }}>⚡ Corriente de Falla</h4>
              <button 
                onClick={toggleAutoCalculate} 
                className="text-xs px-2 py-1 rounded transition-colors"
                style={{
                  backgroundColor: localParams.autoCalculateFault !== false ? ACCENT_COLORS.blue : BG_COLORS.secondary,
                  color: localParams.autoCalculateFault !== false ? '#ffffff' : TEXT_COLORS.muted
                }}
              >
                {localParams.autoCalculateFault !== false ? '🔘 Auto' : '⚙️ Manual'}
              </button>
            </div>

            {localParams.autoCalculateFault !== false && autoFaultCurrent && (
              <div 
                className="rounded-lg p-2 mb-2 border border-blue-500"
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  borderColor: ACCENT_COLORS.blue,
                  boxShadow: SHADOWS.glow.blue
                }}
              >
                <div className="text-xs flex items-center gap-1" style={{ color: ACCENT_COLORS.blue }}><Brain size={12} /> Cálculo automático según transformador</div>
                <div className="text-sm mt-1" style={{ color: TEXT_COLORS.primary }}>In = {autoFaultCurrent?.nominalCurrent?.toFixed(0) || 'N/A'} A | Icc = {autoFaultCurrent?.symmetricalIcc?.toFixed(0) || 'N/A'} A</div>
              </div>
            )}

            <InputField label="Corriente de Falla" type={localParams.autoCalculateFault !== false ? 'ai' : 'manual'} value={localParams.faultCurrent} onChange={(val) => handleParamChange('faultCurrent', val)} unit="A" min={100} max={100000} step={100} />
            <InputField label="Duración de Falla" type="manual" value={localParams.faultDuration} onChange={(val) => handleParamChange('faultDuration', val)} unit="s" min={0.05} max={2} step={0.05} />
            <InputField label="Factor de División" type="manual" value={localParams.currentDivisionFactor} onChange={(val) => handleParamChange('currentDivisionFactor', val)} min={0.05} max={0.5} step={0.01} />

            <h4 className="text-sm font-semibold mt-4 mb-3" style={{ color: TEXT_COLORS.primary }}>📊 Resultados Calculados</h4>
            <MetricCard title="Resistencia de Malla (Rg)" value={calculations?.Rg || 0} unit="Ω" type="auto" />
            <MetricCard title="GPR (Elevación de Potencial)" value={calculations?.GPR || 0} unit="V" type="auto" />
            <MetricCard title="Corriente en Malla (Ig)" value={calculations?.Ig || 0} unit="A" type="auto" />
            <MetricCard title="Tensión de Contacto" value={calculations?.Em || 0} unit="V" type={calculations?.touchSafe ? 'validated' : 'warning'} />
            <MetricCard title="Tensión de Paso" value={calculations?.Es || 0} unit="V" type={calculations?.stepSafe ? 'validated' : 'warning'} />
          </div>
        </div>

        {/* Información del Diseño */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard title="Área de Malla" value={area} unit="m²" type="auto" />
          <MetricCard title="Conductor Total" value={totalConductor} unit="m" type="auto" />
          <MetricCard title="Longitud de Varillas" value={totalRodLength} unit="m" type="auto" />
          <MetricCard title="Estado del Diseño" value={calculations?.complies ? "CUMPLE" : "NO CUMPLE"} type={calculations?.complies ? 'validated' : 'warning'} />
        </div>

        {/* Botones de acción */}
        <button onClick={() => {
          if (loadingSimulation) return;
          handleRunIEEE80Simulation();
        }} disabled={loadingSimulation} className="w-full mt-3 py-2 border rounded-lg font-semibold flex items-center justify-center gap-2 text-white transition-all"
          style={{
            backgroundColor: darkMode ? 'bg-blue-900/30' : 'bg-blue-50',
            borderColor: darkMode ? 'border-blue-700' : 'border-blue-200',
            boxShadow: darkMode
              ? '0 0 15px rgba(59, 130, 246, 0.3), inset 0 0 8px rgba(59, 130, 246, 0.15)'
              : '0 0 15px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.1)'
          }}
        >
          <RefreshCw size={16} className={loadingSimulation ? 'animate-spin' : ''} />
          {loadingSimulation ? 'Calculando...' : 'Recalcular (SaaS)'}
        </button>

        <button onClick={() => {
          alert(showSensitivity ? 'Ocultando análisis...' : 'Mostrando análisis...');
          if (!showSensitivity && sensitivityAnalysis.analyzeAllParameters) {
            sensitivityAnalysis.analyzeAllParameters();
          }
          setShowSensitivity(!showSensitivity);
        }} className="w-full mt-2 py-2 border rounded-lg font-semibold flex items-center justify-center gap-2 text-white transition-all"
          style={{
            backgroundColor: darkMode ? 'bg-blue-900/30' : 'bg-blue-50',
            borderColor: darkMode ? 'border-blue-700' : 'border-blue-200',
            boxShadow: darkMode
              ? '0 0 15px rgba(59, 130, 246, 0.3), inset 0 0 8px rgba(59, 130, 246, 0.15)'
              : '0 0 15px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.1)'
          }}
        >
          <Zap size={16} /> {showSensitivity ? 'Ocultar Análisis de Sensibilidad' : 'Análisis de Sensibilidad'}
        </button>

        <FeatureGate feature={FEATURES.AI_OPTIMIZATION}>
          <button onClick={async () => {
            alert('Iniciando optimización...');
            optimizer.setDangerZonesData(calculations?.riskStats?.recommendations || []);
            const completeInput = {
              soil: { soilResistivity: localParams.soilResistivity || 100, surfaceResistivity: localParams.surfaceLayer || 3000, surfaceDepth: localParams.surfaceDepth || 0.1 },
              grid: { gridLength: localParams.gridLength || 50, gridWidth: localParams.gridWidth || 50, numParallel: localParams.numParallel || 10, numRods: localParams.numRods || 4, rodLength: localParams.rodLength || 2.4, gridDepth: localParams.gridDepth || 0.5 },
              fault: { faultCurrent: localParams.faultCurrent || 1500, faultDuration: localParams.faultDuration || 0.5 }
            };
            const optimized = await optimizer.optimize(completeInput, 50);
            if (optimized?.grid) {
              if (optimized.grid.gridLength) handleParamChange('gridLength', optimized.grid.gridLength);
              if (optimized.grid.gridWidth) handleParamChange('gridWidth', optimized.grid.gridWidth);
              if (optimized.grid.numParallel) handleParamChange('numParallel', optimized.grid.numParallel);
              if (optimized.grid.numRods) handleParamChange('numRods', optimized.grid.numRods);
              if (optimized.grid.rodLength) handleParamChange('rodLength', optimized.grid.rodLength);
            }
            alert('Optimización completada');
          }} disabled={optimizer.isOptimizing} className="w-full mt-2 py-2 border rounded-lg font-semibold flex items-center justify-center gap-2 text-white transition-all disabled:opacity-50"
            style={{
              backgroundColor: darkMode ? 'bg-green-900/30' : 'bg-green-50',
              borderColor: darkMode ? 'border-green-700' : 'border-green-200',
              boxShadow: darkMode
                ? '0 0 15px rgba(34, 197, 94, 0.3), inset 0 0 8px rgba(34, 197, 94, 0.15)'
                : '0 0 15px rgba(34, 197, 94, 0.2), inset 0 0 8px rgba(34, 197, 94, 0.1)'
            }}
          >
            <Settings size={16} /> {optimizer.isOptimizing ? 'Optimizando...' : '🎯 Optimizar Diseño'}
          </button>
        </FeatureGate>

        <button onClick={handleRunPipeline} disabled={isRunningPipeline} className="w-full mt-2 py-2 border rounded-lg font-semibold flex items-center justify-center gap-2 text-white transition-all disabled:opacity-50"
          style={{
            backgroundColor: darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50',
            borderColor: darkMode ? 'border-indigo-700' : 'border-indigo-200',
            boxShadow: darkMode
              ? '0 0 15px rgba(99, 102, 241, 0.3), inset 0 0 8px rgba(99, 102, 241, 0.15)'
              : '0 0 15px rgba(99, 102, 241, 0.2), inset 0 0 8px rgba(99, 102, 241, 0.1)'
          }}
        >
          <Brain size={16} /> {isRunningPipeline ? 'Ejecutando Pipeline...' : '🚀 Pipeline Completo (Avanzado)'}
        </button>

        <FeatureGate feature={FEATURES.PDF_PRO}>
          <button onClick={handleGenerateReport} className="w-full mt-2 py-2 border rounded-lg font-semibold flex items-center justify-center gap-2 text-white transition-all"
            style={{
              backgroundColor: darkMode ? 'bg-orange-900/30' : 'bg-orange-50',
              borderColor: darkMode ? 'border-orange-700' : 'border-orange-200',
              boxShadow: darkMode
                ? '0 0 15px rgba(249, 115, 22, 0.3), inset 0 0 8px rgba(249, 115, 22, 0.15)'
                : '0 0 15px rgba(249, 115, 22, 0.2), inset 0 0 8px rgba(249, 115, 22, 0.1)'
            }}
          >
            <FileText size={16} /> 📄 Generar Reporte Ingeniería
          </button>
        </FeatureGate>

        {/* Optimization Progress */}
        {optimizer.isOptimizing && (
          <div 
            className="mt-3 p-3 rounded-lg"
            style={{
              backgroundColor: BG_COLORS.secondary,
              borderRadius: BORDERS.radius.md
            }}
          >
            <div className="flex justify-between text-sm"><span style={{ color: TEXT_COLORS.muted }}>Iteración:</span><span className="font-bold" style={{ color: TEXT_COLORS.primary }}>{optimizer.currentIteration}/50</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: TEXT_COLORS.muted }}>Mejor Score:</span><span className="font-bold" style={{ color: ACCENT_COLORS.green }}>{optimizer.bestScore.toFixed(2)}</span></div>
            {optimizer.optimizationProgress.length > 0 && (
              <div className="mt-2 text-xs" style={{ color: TEXT_COLORS.muted }}>
                Última: Touch {optimizer.optimizationProgress[optimizer.optimizationProgress.length - 1].touchMargin?.toFixed(1)}% | Step {optimizer.optimizationProgress[optimizer.optimizationProgress.length - 1].stepMargin?.toFixed(1)}%
              </div>
            )}
          </div>
        )}

        {/* Análisis de Sensibilidad */}
        {showSensitivity && sensitivityAnalysis.analysisResults && (
          <div 
            className="mt-4 p-4 rounded-lg"
            style={{
              backgroundColor: BG_COLORS.secondary,
              borderRadius: BORDERS.radius.lg
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: TEXT_COLORS.primary }}>📈 Análisis de Sensibilidad</h3>
            <SensitivityChart data={sensitivityAnalysis.analysisResults.ranking?.map(r => ({ name: r.label, sensitivity: r.sensitivity })) || []} darkMode={darkMode} />
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div 
                className="p-3 rounded"
                style={{ backgroundColor: BG_COLORS.tertiary, borderRadius: BORDERS.radius.md }}
              >
                <div className="font-semibold mb-2" style={{ color: TEXT_COLORS.secondary }}>Parámetro más sensible</div>
                <div className="font-bold" style={{ color: ACCENT_COLORS.blue }}>{sensitivityAnalysis.generateSensitivityReport?.().summary.mostSensitiveParameter || 'N/A'}</div>
              </div>
              <div 
                className="p-3 rounded"
                style={{ backgroundColor: BG_COLORS.tertiary, borderRadius: BORDERS.radius.md }}
              >
                <div className="font-semibold mb-2" style={{ color: TEXT_COLORS.secondary }}>Parámetro menos sensible</div>
                <div className="font-bold" style={{ color: ACCENT_COLORS.green }}>{sensitivityAnalysis.generateSensitivityReport?.().summary.leastSensitiveParameter || 'N/A'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Heatmap Canvas para exportación en reportes */}
        <div
          className="mt-4 p-4 rounded-lg border"
          style={{
            backgroundColor: darkMode ? 'bg-blue-900/20' : 'bg-blue-50',
            borderColor: darkMode ? 'border-blue-700' : 'border-blue-200',
            borderRadius: BORDERS.radius.lg,
            boxShadow: darkMode
              ? '0 0 15px rgba(59, 130, 246, 0.3), inset 0 0 8px rgba(59, 130, 246, 0.15)'
              : '0 0 15px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.1)'
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: darkMode ? 'text-white' : 'text-blue-800' }}>🌡️ Distribución de Potencial (Heatmap)</h3>
          <div className="w-full">
            <HeatmapCanvas
              ref={heatmapRef}
              data={calculations?.discreteGrid || []}
              width={600}
              height={400}
              darkMode={darkMode}
            />
          </div>
          <button
            onClick={handleExportPDF}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
          >
            📄 Generar PDF PRO
          </button>
        </div>
      </ValidatedSection>
    </div>
  );
};
