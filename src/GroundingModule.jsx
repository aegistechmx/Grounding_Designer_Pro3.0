import React, { useState, useCallback } from 'react';
import { generateGrid } from './core/gridEngine';
import { solvePotentialField } from './core/solver';
import { calculateIEEE80Complete } from './core/ieee80';
import HeatmapCanvas from './visual/HeatmapCanvas';
import GridRenderer from './visual/GridRenderer';
import { exportDXF } from './export/dxfExporter';
import { importDXF } from './import/dxfImporter';

const GroundingModule = ({ params, darkMode }) => {
  const [grid, setGrid] = useState(null);
  const [potentialData, setPotentialData] = useState([]);
  const [calculations, setCalculations] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  // Generar malla
  const generateMesh = useCallback(() => {
    setIsSimulating(true);
    
    try {
      // Generar geometría
      const newGrid = generateGrid({
        gridWidth: params.gridWidth || 30,
        gridLength: params.gridLength || 30,
        nx: params.numParallel || 10,
        ny: params.numParallelY || 10,
        gridDepth: params.gridDepth || 0.6
      });
      
      // Agregar varillas en el perímetro
      const perimeterNodes = newGrid.nodes.filter(n => n.isBorder);
      const rodCount = Math.min(params.numRods || 10, perimeterNodes.length);
      const step = Math.floor(perimeterNodes.length / rodCount);
      
      for (let i = 0; i < perimeterNodes.length; i += step) {
        if (i < rodCount) {
          perimeterNodes[i].isRod = true;
        }
      }
      
      setGrid(newGrid);
      
      // Calcular campo de potencial
      const rods = newGrid.nodes.filter(n => n.isRod);
      const potentials = solvePotentialField(
        newGrid.nodes,
        rods,
        calculations?.Ig || 1000,
        params.soilResistivity || 100
      );
      setPotentialData(potentials);
      
      // Calcular IEEE 80
      const ieeeResults = calculateIEEE80Complete(params);
      setCalculations(ieeeResults);
      
    } catch (error) {
      console.error('Error generando malla:', error);
    } finally {
      setIsSimulating(false);
    }
  }, [params]);

  // Exportar a DXF
  const handleExportDXF = () => {
    if (grid) {
      exportDXF(grid, `grounding_grid_${Date.now()}.dxf`);
    }
  };

  // Importar DXF
  const handleImportDXF = async (file) => {
    try {
      const imported = await importDXF(file);
      console.log('DXF importado:', imported);
      alert(`DXF importado: ${imported.entityCount} entidades encontradas`);
    } catch (error) {
      console.error('Error importando DXF:', error);
      alert('Error al importar DXF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Botones de control */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={generateMesh}
          disabled={isSimulating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSimulating ? 'Generating...' : 'Generate Mesh'}
        </button>
        
        <button
          onClick={handleExportDXF}
          disabled={!grid}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          Export DXF
        </button>
        
        <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer">
          Import DXF
          <input
            type="file"
            accept=".dxf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files[0]) handleImportDXF(e.target.files[0]);
              e.target.value = '';
            }}
          />
        </label>
      </div>
      
      {/* Visualizaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grid Renderer */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Grid Geometry</h3>
          <GridRenderer
            grid={grid}
            darkMode={darkMode}
            onNodeClick={setSelectedNode}
          />
          {selectedNode && (
            <div className="mt-2 text-sm text-gray-500">
              Selected node: ({selectedNode.x.toFixed(2)}, {selectedNode.y.toFixed(2)})
              {selectedNode.isRod && ' Rod'}
            </div>
          )}
        </div>
        
        {/* Heatmap */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Potential Distribution</h3>
          <HeatmapCanvas
            data={potentialData}
            onPointClick={(point) => console.log('Point:', point)}
          />
        </div>
      </div>
      
      {/* Resultados IEEE 80 */}
      {calculations && (
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <h3 className="text-lg font-semibold mb-3">IEEE 80-2013 Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Rg</div>
              <div className="text-xl font-bold">{(calculations.Rg || 0).toFixed(2)} </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">GPR</div>
              <div className="text-xl font-bold">{(calculations.GPR || 0).toFixed(0)} V</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Em</div>
              <div className={`text-xl font-bold ${calculations.complies ? 'text-green-600' : 'text-red-600'}`}>
                {(calculations.Em || 0).toFixed(0)} V
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Es</div>
              <div className={`text-xl font-bold ${calculations.complies ? 'text-green-600' : 'text-red-600'}`}>
                {(calculations.Es || 0).toFixed(0)} V
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-sm font-semibold ${calculations.complies ? 'text-green-600' : 'text-red-600'}`}>
              {calculations.complies ? 'DESIGN COMPLIES IEEE 80' : 'DESIGN DOES NOT COMPLY IEEE 80'}
            </div>
          </div>
        </div>
      )}
      
      {/* Información de la malla */}
      {grid && (
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <h3 className="text-lg font-semibold mb-3">Grid Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Nodes:</span>
              <span className="ml-2 font-bold">{grid.nodes.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Conductors:</span>
              <span className="ml-2 font-bold">{grid.conductors.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Rods:</span>
              <span className="ml-2 font-bold">{grid.nodes.filter(n => n.isRod).length}</span>
            </div>
            <div>
              <span className="text-gray-500">Total length:</span>
              <span className="ml-2 font-bold">{grid.params.totalConductorLength.toFixed(0)} m</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroundingModule;
