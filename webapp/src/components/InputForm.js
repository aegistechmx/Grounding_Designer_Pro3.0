import React, { useState } from 'react';

export default function InputForm({ onCalculate, loading }) {
  const [formData, setFormData] = useState({
    soil: {
      soilResistivity: 100,
      surfaceLayerResistivity: 0,
      surfaceLayerThickness: 0
    },
    grid: {
      gridLength: 50,
      gridWidth: 30,
      numParallel: 7,
      numParallelY: 5,
      conductorDiameter: 0.01,
      burialDepth: 0.5,
      numRods: 4,
      rodLength: 3,
      rodDiameter: 0.02
    },
    fault: {
      current: 10000,
      faultDuration: 1.0,
      decrementFactor: 0.15,
      divisionFactor: 0.6
    }
  });

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCalculate(formData);
  };

  const handleLoadPreset = (preset) => {
    switch (preset) {
      case 'small':
        setFormData({
          soil: { soilResistivity: 100, surfaceLayerResistivity: 0, surfaceLayerThickness: 0 },
          grid: { gridLength: 20, gridWidth: 20, numParallel: 5, numParallelY: 5, conductorDiameter: 0.01, burialDepth: 0.5, numRods: 4, rodLength: 2, rodDiameter: 0.02 },
          fault: { current: 5000, faultDuration: 1.0, decrementFactor: 0.15, divisionFactor: 0.6 }
        });
        break;
      case 'medium':
        setFormData({
          soil: { soilResistivity: 300, surfaceLayerResistivity: 2000, surfaceLayerThickness: 0.1 },
          grid: { gridLength: 50, gridWidth: 30, numParallel: 7, numParallelY: 5, conductorDiameter: 0.01, burialDepth: 0.5, numRods: 6, rodLength: 3, rodDiameter: 0.02 },
          fault: { current: 10000, faultDuration: 1.0, decrementFactor: 0.15, divisionFactor: 0.6 }
        });
        break;
      case 'large':
        setFormData({
          soil: { soilResistivity: 1000, surfaceLayerResistivity: 5000, surfaceLayerThickness: 0.2 },
          grid: { gridLength: 100, gridWidth: 60, numParallel: 10, numParallelY: 8, conductorDiameter: 0.015, burialDepth: 0.8, numRods: 12, rodLength: 4, rodDiameter: 0.025 },
          fault: { current: 20000, faultDuration: 1.0, decrementFactor: 0.15, divisionFactor: 0.6 }
        });
        break;
      default:
        // Keep current values for unknown preset
        break;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Input Parameters</h3>
      
      {/* Preset Buttons */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Quick Presets</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleLoadPreset('small')}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
          >
            Small Grid
          </button>
          <button
            type="button"
            onClick={() => handleLoadPreset('medium')}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
          >
            Medium Grid
          </button>
          <button
            type="button"
            onClick={() => handleLoadPreset('large')}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
          >
            Large Grid
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Soil Parameters */}
        <div>
          <h4 className="text-lg font-semibold text-gray-700 mb-3">Soil Parameters</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Soil Resistivity (×m)
              </label>
              <input
                type="number"
                value={formData.soil.soilResistivity}
                onChange={(e) => handleInputChange('soil', 'soilResistivity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                step="1"
                placeholder="Soil Resistivity"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Surface Layer Resistivity (×m)
              </label>
              <input
                type="number"
                value={formData.soil.surfaceLayerResistivity}
                onChange={(e) => handleInputChange('soil', 'surfaceLayerResistivity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Surface Layer Thickness (m)
              </label>
              <input
                type="number"
                value={formData.soil.surfaceLayerThickness}
                onChange={(e) => handleInputChange('soil', 'surfaceLayerThickness', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Grid Parameters */}
        <div>
          <h4 className="text-lg font-semibold text-gray-700 mb-3">Grid Parameters</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grid Length (m)
              </label>
              <input
                type="number"
                value={formData.grid.gridLength}
                onChange={(e) => handleInputChange('grid', 'gridLength', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                step="1"
                placeholder="Grid Length (m)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grid Width (m)
              </label>
              <input
                type="number"
                value={formData.grid.gridWidth}
                onChange={(e) => handleInputChange('grid', 'gridWidth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                step="1"
                placeholder="Grid Width (m)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parallel Conductors (X)
              </label>
              <input
                type="number"
                value={formData.grid.numParallel}
                onChange={(e) => handleInputChange('grid', 'numParallel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                step="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parallel Conductors (Y)
              </label>
              <input
                type="number"
                value={formData.grid.numParallelY}
                onChange={(e) => handleInputChange('grid', 'numParallelY', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                step="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Rods
              </label>
              <input
                type="number"
                value={formData.grid.numRods}
                onChange={(e) => handleInputChange('grid', 'numRods', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rod Length (m)
              </label>
              <input
                type="number"
                value={formData.grid.rodLength}
                onChange={(e) => handleInputChange('grid', 'rodLength', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Fault Parameters */}
        <div>
          <h4 className="text-lg font-semibold text-gray-700 mb-3">Fault Parameters</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fault Current (A)
              </label>
              <input
                type="number"
                value={formData.fault.current}
                onChange={(e) => handleInputChange('fault', 'current', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                step="100"
                placeholder="Fault Current (A)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fault Duration (s)
              </label>
              <input
                type="number"
                value={formData.fault.faultDuration}
                onChange={(e) => handleInputChange('fault', 'faultDuration', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0.1"
                step="0.1"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? 'Calculating...' : 'Calculate Grounding System'}
        </button>
      </form>
    </div>
  );
}
