import React, { useState } from 'react';

export default function MethodComparison({ results }) {
  if (!results || !results.methods) return null;

  const { methods, calibration } = results;
  const [activeTab, setActiveTab] = useState('comparison');

  const calculateDifference = (analytical, discrete) => {
    if (analytical === null || discrete === null) return null;
    if (discrete === 0) return null;
    return ((analytical - discrete) / discrete * 100);
  };

  const getDifferenceColor = (diff) => {
    if (diff === null) return 'text-gray-500';
    if (Math.abs(diff) < 10) return 'text-green-600';
    if (Math.abs(diff) < 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderComparisonTable = () => (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Parameter</th>
              <th className="text-center py-2">Analytical</th>
              <th className="text-center py-2">Discrete</th>
              <th className="text-center py-2">Difference</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2 font-medium">Grid Resistance (×)</td>
              <td className="text-center">{methods.analytical?.gridResistance?.toFixed(3) || 'N/A'}</td>
              <td className="text-center">{methods.discrete?.gridResistance?.toFixed(3) || 'N/A'}</td>
              <td className={`text-center font-medium ${getDifferenceColor(calculateDifference(methods.analytical?.gridResistance, methods.discrete?.gridResistance))}`}>
                {calculateDifference(methods.analytical?.gridResistance, methods.discrete?.gridResistance) !== null
                  ? `${calculateDifference(methods.analytical?.gridResistance, methods.discrete?.gridResistance).toFixed(1)}%`
                  : 'N/A'
                }
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-medium">GPR (V)</td>
              <td className="text-center">{methods.analytical?.gpr?.toFixed(0) || 'N/A'}</td>
              <td className="text-center">{methods.discrete?.gpr?.toFixed(0) || 'N/A'}</td>
              <td className={`text-center font-medium ${getDifferenceColor(calculateDifference(methods.analytical?.gpr, methods.discrete?.gpr))}`}>
                {calculateDifference(methods.analytical?.gpr, methods.discrete?.gpr) !== null
                  ? `${calculateDifference(methods.analytical?.gpr, methods.discrete?.gpr).toFixed(1)}%`
                  : 'N/A'
                }
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-medium">Step Voltage (V)</td>
              <td className="text-center">{methods.analytical?.stepVoltage?.toFixed(0) || 'N/A'}</td>
              <td className="text-center">{methods.discrete?.stepVoltage?.toFixed(0) || 'N/A'}</td>
              <td className={`text-center font-medium ${getDifferenceColor(calculateDifference(methods.analytical?.stepVoltage, methods.discrete?.stepVoltage))}`}>
                {calculateDifference(methods.analytical?.stepVoltage, methods.discrete?.stepVoltage) !== null
                  ? `${calculateDifference(methods.analytical?.stepVoltage, methods.discrete?.stepVoltage).toFixed(1)}%`
                  : 'N/A'
                }
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-medium">Touch Voltage (V)</td>
              <td className="text-center">{methods.analytical?.touchVoltage?.toFixed(0) || 'N/A'}</td>
              <td className="text-center">{methods.discrete?.touchVoltage?.toFixed(0) || 'N/A'}</td>
              <td className={`text-center font-medium ${getDifferenceColor(calculateDifference(methods.analytical?.touchVoltage, methods.discrete?.touchVoltage))}`}>
                {calculateDifference(methods.analytical?.touchVoltage, methods.discrete?.touchVoltage) !== null
                  ? `${calculateDifference(methods.analytical?.touchVoltage, methods.discrete?.touchVoltage).toFixed(1)}%`
                  : 'N/A'
                }
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Method Characteristics */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-semibold text-blue-800 mb-2">Analytical Method</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>IEEE 80 standard compliant</li>
            <li>Fast computation</li>
            <li>Empirical factors</li>
            <li>Suitable for preliminary design</li>
          </ul>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h5 className="font-semibold text-green-800 mb-2">Discrete Method</h5>
          <ul className="text-sm text-green-700 space-y-1">
            <li>Spatial voltage distribution</li>
            <li>Physics-based modeling</li>
            <li>Edge effect analysis</li>
            <li>Detailed voltage gradients</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderCalibrationInfo = () => (
    <div className="space-y-4">
      {calibration ? (
        <>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h5 className="font-semibold text-yellow-800 mb-2">Calibration Applied</h5>
            <p className="text-sm text-yellow-700 mb-3">
              Analytical method calibrated to match discrete solver results
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Grid Resistance Factor:</span>
                <span className="font-medium">{calibration.factors?.gridResistance?.toFixed(3) || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Step Voltage Factor:</span>
                <span className="font-medium">{calibration.factors?.stepVoltage?.toFixed(3) || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Touch Voltage Factor:</span>
                <span className="font-medium">{calibration.factors?.touchVoltage?.toFixed(3) || 'N/A'}</span>
              </div>
            </div>
          </div>

          {calibration.alignment && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h5 className="font-semibold text-purple-800 mb-2">Alignment Metrics</h5>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Grid Resistance:</span>
                  <span className={`font-medium ${getDifferenceColor(calibration.alignment.gridResistance)}`}>
                    {calibration.alignment.gridResistance?.toFixed(1)}% difference
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Step Voltage:</span>
                  <span className={`font-medium ${getDifferenceColor(calibration.alignment.stepVoltage)}`}>
                    {calibration.alignment.stepVoltage?.toFixed(1)}% difference
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Touch Voltage:</span>
                  <span className={`font-medium ${getDifferenceColor(calibration.alignment.touchVoltage)}`}>
                    {calibration.alignment.touchVoltage?.toFixed(1)}% difference
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            No calibration information available for this analysis.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Method Comparison</h3>
      
      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'comparison'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Results Comparison
        </button>
        <button
          onClick={() => setActiveTab('calibration')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'calibration'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Calibration Info
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'comparison' && renderComparisonTable()}
        {activeTab === 'calibration' && renderCalibrationInfo()}
      </div>

      {/* Key Insight */}
      <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
        <div className="flex items-start">
          <div className="text-indigo-600 mr-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm text-indigo-800">
            <strong>Key Insight:</strong> This dual-method analysis provides both fast IEEE 80 standard results and detailed spatial voltage distribution. 
            Differences between methods are expected and provide valuable insight into analysis uncertainty.
          </div>
        </div>
      </div>
    </div>
  );
}
