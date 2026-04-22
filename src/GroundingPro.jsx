import React, { useState } from 'react';
import { generateGrid } from './core/gridEngine';
import { calculateComplete } from './core/ieee80';
import { validateSystem } from './core/safety';
import { generateMemoryReport, generateShortReport } from './utils/reportGenerator';
import { exportGridToDXF } from './export/cadExporter';
import { formatResistance, formatVoltage } from './utils/formatters';

const GroundingPro = ({ params, darkMode }) => {
  const [results, setResults] = useState(null);
  const [grid, setGrid] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [report, setReport] = useState('');

  const runCalculation = () => {
    setIsCalculating(true);
    
    try {
      // 1. Generar geometría de la malla
      const newGrid = generateGrid({
        gridWidth: params.gridWidth || 30,
        gridLength: params.gridLength || 30,
        nx: params.numParallel || 10,
        ny: params.numParallelY || 10,
        gridDepth: params.gridDepth || 0.6
      });
      setGrid(newGrid);
      
      // 2. Cálculo completo IEEE 80
      const calculationResults = calculateComplete(params);
      setResults(calculationResults);
      
      // 3. Validación de seguridad
      const safetyValidation = validateSystem({
        faultCurrent: calculationResults.currents.gridCurrent,
        Rg: calculationResults.Rg,
        soilResistivity: params.soilResistivity || 100,
        surfaceResistivity: params.surfaceLayer || 10000,
        surfaceDepth: params.surfaceDepth || 0.2,
        faultDuration: params.faultDuration || 0.35
      });
      
      // 4. Generar reporte
      const reportData = {
        projectName: params.projectName,
        location: params.projectLocation,
        engineer: params.engineerName,
        area: calculationResults.geometry.area,
        gridLength: params.gridLength,
        gridWidth: params.gridWidth,
        resistivity: params.soilResistivity,
        surfaceResistivity: params.surfaceLayer,
        surfaceDepth: params.surfaceDepth,
        burialDepth: params.gridDepth,
        length: calculationResults.geometry.totalConductorLength,
        numRods: params.numRods,
        rodLength: params.rodLength,
        Ig: calculationResults.currents.gridCurrent,
        faultDuration: params.faultDuration,
        Rg: calculationResults.Rg,
        GPR: calculationResults.validation.GPR,
        Cs: calculationResults.validation.Cs,
        Vtouch: calculationResults.validation.Em,
        VtouchAllow: calculationResults.validation.VtouchAllow,
        Vstep: calculationResults.validation.Es,
        VstepAllow: calculationResults.validation.VstepAllow,
        touchSafe: calculationResults.validation.touchSafe,
        stepSafe: calculationResults.validation.stepSafe,
        touchMargin: calculationResults.validation.safetyMarginTouch,
        stepMargin: calculationResults.validation.safetyMarginStep,
        complies: calculationResults.complies,
        minArea: calculationResults.minConductorArea,
        selectedConductor: params.conductorGauge || '4/0 AWG',
        thermalComplies: (calculationResults.minConductorArea || 0) <= 107.2
      };
      
      const fullReport = generateMemoryReport(reportData);
      setReport(fullReport);
      
    } catch (error) {
      console.error('Error en cálculo:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExportDXF = () => {
    if (grid) {
      exportGridToDXF(grid, `grounding_${Date.now()}.dxf`);
    }
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(report);
    alert('Reporte copiado al portapapeles');
  };

  return (
    <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">⚡ GroundingPro - Cálculo de Puesta a Tierra</h2>
        <div className="flex gap-3">
          <button
            onClick={runCalculation}
            disabled={isCalculating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isCalculating ? '⚙️ Calculando...' : '🔧 Ejecutar Cálculo'}
          </button>
          <button
            onClick={handleExportDXF}
            disabled={!grid}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            📤 Exportar DXF
          </button>
          <button
            onClick={handleCopyReport}
            disabled={!report}
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 disabled:bg-gray-400"
          >
            📋 Copiar Reporte
          </button>
        </div>
      </div>
      
      {/* Resultados */}
      {results && (
        <div className="space-y-6">
          {/* Tarjetas de resultados */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="text-sm text-gray-500">Resistencia (Rg)</div>
              <div className="text-2xl font-bold text-blue-600">{formatResistance(results.Rg, 2)}</div>
            </div>
            <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="text-sm text-gray-500">GPR</div>
              <div className="text-2xl font-bold text-blue-800">{formatVoltage(results.validation.GPR, 0)}</div>
            </div>
            <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="text-sm text-gray-500">Em (Contacto)</div>
              <div className={`text-2xl font-bold ${results.validation.touchSafe ? 'text-green-600' : 'text-red-600'}`}>
                {formatVoltage(results.validation.Em, 0)}
              </div>
            </div>
            <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="text-sm text-gray-500">Es (Paso)</div>
              <div className={`text-2xl font-bold ${results.validation.stepSafe ? 'text-green-600' : 'text-red-600'}`}>
                {formatVoltage(results.validation.Es, 0)}
              </div>
            </div>
          </div>
          
          {/* Estado de cumplimiento */}
          <div className={`p-4 rounded-lg ${results.complies ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{results.complies ? '✅' : '❌'}</span>
              <span className="font-semibold">
                {results.complies ? 'DISEÑO CUMPLE CON IEEE 80' : 'DISEÑO NO CUMPLE CON IEEE 80'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Reporte */}
      {report && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3">📄 Memoria de Cálculo</h3>
          <pre className={`p-4 rounded-lg text-xs font-mono overflow-auto max-h-96 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
            {report}
          </pre>
        </div>
      )}
      
      {/* Información de la malla */}
      {grid && (
        <div className="mt-4 text-sm text-gray-500">
          Malla generada: {grid.nodes.length} nodos, {grid.conductors.length} conductores
        </div>
      )}
    </div>
  );
};

export default GroundingPro;