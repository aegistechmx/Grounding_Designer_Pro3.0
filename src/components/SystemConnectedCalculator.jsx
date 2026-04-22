// src/components/SystemConnectedCalculator.jsx
// Componente de ejemplo usando el nuevo sistema

import React, { useState, useRef, useEffect } from 'react';
import { useGroundingSystem } from '../hooks/useGroundingSystem';
import { Loader, FileText, Zap } from 'lucide-react';

const SystemConnectedCalculator = () => {
  const {
    project,
    results,
    isSimulating,
    progress,
    error,
    initProject,
    runSimulation,
    exportToPDF,
    renderToCanvas
  } = useGroundingSystem();

  const canvasRef = useRef(null);
  const [params, setParams] = useState({
    name: 'Proyecto Industrial',
    gridLength: 12.5,
    gridWidth: 8,
    gridDepth: 0.5,
    numParallel: 8,
    numParallelY: 8,
    numRods: 16,
    rodLength: 3,
    soilResistivity: 100,
    surfaceLayer: 3000,
    surfaceDepth: 0.1,
    faultCurrent: 1771,
    faultDuration: 0.5,
    currentDivisionFactor: 0.15
  });

  useEffect(() => {
    if (canvasRef.current && results) {
      renderToCanvas(canvasRef.current, 'grid', {
        title: `Malla - ${project?.name || 'Proyecto'}` 
      });
    }
  }, [results, project, renderToCanvas]);

  const handleInitProject = () => {
    initProject(params);
  };

  const handleRunSimulation = async () => {
    await runSimulation(false); // false = simulación rápida
  };

  const handleExportPDF = async () => {
    await exportToPDF();
  };

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Grounding Designer Pro 3.0</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          ❌ Error: {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de entrada */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">⚡ Parámetros</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Largo (m)</label>
              <input
                type="number"
                value={params.gridLength}
                onChange={(e) => updateParam('gridLength', e.target.value)}
                className="w-full p-2 bg-gray-700 rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Ancho (m)</label>
              <input
                type="number"
                value={params.gridWidth}
                onChange={(e) => updateParam('gridWidth', e.target.value)}
                className="w-full p-2 bg-gray-700 rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Conductores</label>
              <input
                type="number"
                value={params.numParallel}
                onChange={(e) => updateParam('numParallel', e.target.value)}
                className="w-full p-2 bg-gray-700 rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Varillas</label>
              <input
                type="number"
                value={params.numRods}
                onChange={(e) => updateParam('numRods', e.target.value)}
                className="w-full p-2 bg-gray-700 rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Resistividad (Ω·m)</label>
              <input
                type="number"
                value={params.soilResistivity}
                onChange={(e) => updateParam('soilResistivity', e.target.value)}
                className="w-full p-2 bg-gray-700 rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Ifalla (A)</label>
              <input
                type="number"
                value={params.faultCurrent}
                onChange={(e) => updateParam('faultCurrent', e.target.value)}
                className="w-full p-2 bg-gray-700 rounded"
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleInitProject}
              className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold"
            >
              Inicializar Proyecto
            </button>
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating || !project}
              className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded font-semibold disabled:opacity-50"
            >
              {isSimulating ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader size={16} className="animate-spin" />
                  Simulando {Math.round(progress * 100)}%
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Zap size={16} />
                  Simular
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Panel de resultados */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">📊 Resultados</h2>
          
          {results && results[0] && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-sm text-gray-400">Resistencia (Rg)</div>
                  <div className="text-2xl font-bold">{isFinite(results[0].Rg || 0) ? (results[0].Rg || 0).toFixed(2) : 'N/A'} Ω</div>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-sm text-gray-400">GPR</div>
                  <div className="text-2xl font-bold">{isFinite(results[0].GPR || 0) ? (results[0].GPR || 0).toFixed(0) : 'N/A'} V</div>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-sm text-gray-400">Tensión Contacto</div>
                  <div className="text-lg">{isFinite(results[0].Em || 0) ? (results[0].Em || 0).toFixed(0) : 'N/A'} / {isFinite(results[0].Etouch70 || 0) ? (results[0].Etouch70 || 0).toFixed(0) : 'N/A'} V</div>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-sm text-gray-400">Estado</div>
                  <div className={`text-lg font-bold ${results[0].complies ? 'text-green-500' : 'text-red-500'}`}>
                    {results[0].complies ? '✓ CUMPLE' : '✗ NO CUMPLE'}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleExportPDF}
                className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                Exportar PDF
              </button>
            </div>
          )}
          
          {!results && !isSimulating && project && (
            <div className="text-center text-gray-400 py-8">
              Haz clic en "Simular" para ver resultados
            </div>
          )}
        </div>
      </div>
      
      {/* Canvas para visualización */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">🎨 Visualización</h2>
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={400}
          style={{ width: '100%', height: 'auto', backgroundColor: '#1a1a2e', borderRadius: '8px' }}
        />
      </div>
    </div>
  );
};

export default SystemConnectedCalculator;
