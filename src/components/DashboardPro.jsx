import React, { useState, useEffect, useRef } from 'react';
import GroundingGridSVG from './GroundingGridSVG';
import HeatmapCanvas from './HeatmapCanvas';
import DesignComparator from './DesignComparator';
import { generatePDFWithHeatmap } from '../utils/pdfGenerator';
import { exportDXF } from '../export/dxfExporter';
import { quickOptimize } from '../engine/optimizerNSGA2';
import { Loader, FileText, Download, Zap, TrendingUp, DollarSign, Shield, AlertCircle } from 'lucide-react';

const DashboardPro = ({ params, calculations, gridData, darkMode, onApplyOptimization }) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [baseDesign, setBaseDesign] = useState(null);
  const [optimizedDesign, setOptimizedDesign] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const heatmapRef = useRef(null);

  // Evaluar diseño base
  useEffect(() => {
    if (calculations) {
      setBaseDesign({
        resistance: calculations.Rg || 0,
        touch: calculations.Em || 0,
        step: calculations.Es || 0,
        cost: ((calculations.totalConductor || 0) * 12 + (params?.numRods || 0) * 25),
        complies: calculations.complies || false,
        touchOk: calculations.touchSafe70 || false,
        stepOk: calculations.stepSafe70 || false
      });
    }
  }, [calculations]);

  const runOptimization = async () => {
    setIsOptimizing(true);
    
    try {
      const result = quickOptimize({
        soilResistivity: params.soilResistivity || 100,
        area: (params.gridLength || 30) * (params.gridWidth || 16),
        burialDepth: params.gridDepth || 0.6,
        faultCurrent: calculations?.faultCurrent || 5000,
        X_R: 10,
        faultDuration: params.faultDuration || 0.35,
        surfaceResistivity: params.surfaceLayer || 10000,
        surfaceDepth: params.surfaceDepth || 0.2
      });
      
      if (result.bestSolution) {
        const best = result.bestSolution;
        
        setOptimizedDesign({
          resistance: best.resistance || 0,
          touch: best.constraints?.Em || 0,
          step: best.constraints?.Es || 0,
          cost: best.cost || 0,
          complies: best.constraints?.feasible || false,
          touchOk: best.constraints?.touchOk || false,
          stepOk: best.constraints?.stepOk || false,
          params: {
            numParallel: best.nx,
            numParallelY: best.ny,
            numRods: best.numRods,
            rodLength: best.rodLength
          }
        });
        
        setOptimizationResult(result);
      }
    } catch (error) {
      console.error('Error en optimización:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const applyOptimization = () => {
    if (optimizedDesign?.params && onApplyOptimization) {
      onApplyOptimization(optimizedDesign.params);
    }
  };

  const handleExportPDF = async () => {
    await generatePDFWithHeatmap(params, calculations, [], 'dashboard-heatmap');
  };

  const handleExportDXF = () => {
    if (gridData) {
      exportDXF(gridData, `grounding_${Date.now()}.dxf`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              showHeatmap
                ? 'bg-blue-600 text-white'
                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {showHeatmap ? 'Ocultar Heatmap' : 'Mostrar Heatmap'}
          </button>
          <button
            onClick={runOptimization}
            disabled={isOptimizing}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-1"
          >
            {isOptimizing ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />}
            Auto-optimizar
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-1"
          >
            <FileText size={14} /> PDF
          </button>
          <button
            onClick={handleExportDXF}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"
          >
            <Download size={14} /> DXF
          </button>
        </div>
      </div>
      
      {/* Visualización con heatmap superpuesto */}
      <div id="dashboard-heatmap" className="relative" ref={heatmapRef}>
        <GroundingGridSVG params={params} darkMode={darkMode} />
        {showHeatmap && gridData?.nodes && (
          <HeatmapCanvas nodes={gridData.nodes} width={500} height={400} opacity={0.6} />
        )}
      </div>
      
      {/* Comparador de diseños */}
      {optimizedDesign && baseDesign && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingUp size={18} /> Comparación de Diseños
          </h3>
          <DesignComparator base={baseDesign} optimized={optimizedDesign} darkMode={darkMode} />
          
          {optimizedDesign.params && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={applyOptimization}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
              >
                <Zap size={16} />
                Aplicar Diseño Optimizado
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Métricas rápidas */}
      {calculations && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Shield size={20} className="mx-auto mb-1 text-blue-500" />
            <div className="text-xl font-bold">{isFinite(calculations.Rg) ? calculations.Rg?.toFixed(2) : 'N/A'}</div>
            <div className="text-xs text-gray-500">Resistencia</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Zap size={20} className="mx-auto mb-1 text-yellow-500" />
            <div className="text-xl font-bold">{isFinite(calculations.GPR) ? calculations.GPR?.toFixed(0) : 'N/A'} V</div>
            <div className="text-xs text-gray-500">GPR</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <TrendingUp size={20} className="mx-auto mb-1 text-green-500" />
            <div className="text-xl font-bold">{isFinite(calculations.Em) ? calculations.Em?.toFixed(0) : 'N/A'} V</div>
            <div className="text-xs text-gray-500">Contacto</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <DollarSign size={20} className="mx-auto mb-1 text-purple-500" />
            <div className="text-xl font-bold">
              ${(((calculations.totalConductor || 0) * 12 + (params?.numRods || 0) * 25)).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Costo estimado</div>
          </div>
        </div>
      )}
      
      {/* Estado de cumplimiento */}
      {calculations && (
        <div className={`p-3 rounded-lg ${calculations.complies ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
          <div className="flex items-center gap-2">
            {calculations.complies ? (
              <Shield size={18} className="text-green-600" />
            ) : (
              <AlertCircle size={18} className="text-red-600" />
            )}
            <span className="font-medium">
              {calculations.complies ? '✓ Diseño cumple con IEEE 80' : '✗ Diseño no cumple con IEEE 80'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPro;
