import React from 'react';

export default function ResultsPanel({ results }) {
  if (!results) return null;

  const { results: analysisResults = {}, safety = {} } = results;

  const getSafetyColor = (isSafe) => isSafe ? 'text-green-600' : 'text-red-600';
  const getSafetyIcon = (isSafe) => isSafe ? 'Safe' : 'Unsafe';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Analysis Results</h3>
      
      {/* Primary Results */}
      <div className="space-y-4 mb-6">
        <div className="border-b pb-4">
          <h4 className="text-lg font-semibold text-gray-700 mb-3">Primary Results</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm text-gray-600">Grid Resistance</div>
              <div className="text-lg font-bold text-blue-600">
                {analysisResults.gridResistance?.toFixed(3) || 'N/A'} ×
              </div>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <div className="text-sm text-gray-600">Ground Potential Rise</div>
              <div className="text-lg font-bold text-orange-600">
                {analysisResults.gpr?.toFixed(0) || 'N/A'} V
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <div className="text-sm text-gray-600">Step Voltage</div>
              <div className="text-lg font-bold text-yellow-600">
                {analysisResults.stepVoltage?.toFixed(0) || 'N/A'} V
              </div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="text-sm text-gray-600">Touch Voltage</div>
              <div className="text-lg font-bold text-red-600">
                {analysisResults.touchVoltage?.toFixed(0) || 'N/A'} V
              </div>
            </div>
          </div>
        </div>

        {/* Safety Assessment */}
        <div className="border-b pb-4">
          <h4 className="text-lg font-semibold text-gray-700 mb-3">Safety Assessment</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium">Step Voltage Limit (1000V)</span>
              <span className={`font-bold ${getSafetyColor(safety.stepVoltageSafe)}`}>
                {getSafetyIcon(safety.stepVoltageSafe)} ({analysisResults.stepVoltage?.toFixed(0) || 'N/A'} V)
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium">Touch Voltage Limit (1000V)</span>
              <span className={`font-bold ${getSafetyColor(safety.touchVoltageSafe)}`}>
                {getSafetyIcon(safety.touchVoltageSafe)} ({analysisResults.touchVoltage?.toFixed(0) || 'N/A'} V)
              </span>
            </div>
          </div>
        </div>

        {/* Input Summary */}
        <div>
          <h4 className="text-lg font-semibold text-gray-700 mb-3">Input Summary</h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600">Soil ×</div>
              <div className="font-medium">{results.input?.soil?.soilResistivity || 'N/A'} ×m</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600">Grid Area</div>
              <div className="font-medium">
                {results.input?.grid?.gridLength && results.input?.grid?.gridWidth 
                  ? `${(results.input.grid.gridLength * results.input.grid.gridWidth).toFixed(0)} m²`
                  : 'N/A'
                }
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600">Fault Current</div>
              <div className="font-medium">{results.input?.fault?.current || 'N/A'} A</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-xs text-gray-500 text-center">
        Analysis completed: {results.timestamp ? new Date(results.timestamp).toLocaleString() : 'N/A'}
      </div>
    </div>
  );
}
