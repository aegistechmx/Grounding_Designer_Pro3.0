import React from 'react';

export default function DualMethodResults({ results }) {
  if (!results || !results.methods) return null;

  const { methods, calibration } = results;

  const calculateDifference = (analytical, discrete) => {
    if (analytical === null || discrete === null) return null;
    if (discrete === 0) return null;
    const diff = ((analytical - discrete) / discrete * 100);
    return diff;
  };

  const getDifferenceColor = (diff) => {
    if (diff === null) return 'text-gray-500';
    if (Math.abs(diff) < 10) return 'text-green-600';
    if (Math.abs(diff) < 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDifference = (diff) => {
    if (diff === null) return 'N/A';
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}%`;
  };

  const getMethodExplanation = (diff) => {
    if (diff === null) return 'No comparison available';
    
    const absDiff = Math.abs(diff);
    if (absDiff < 10) {
      return 'Excellent agreement between methods. Results are highly reliable.';
    } else if (absDiff < 30) {
      return 'Good agreement with expected methodological differences. Both methods provide valid insights.';
    } else {
      return 'Significant methodological differences. Consider both results for comprehensive analysis.';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Dual-Method Analysis Comparison
      </h3>
      
      {/* Method Overview */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Analytical Method</h4>
          <p className="text-sm text-blue-700">IEEE 80 standard with empirical factors</p>
          <p className="text-xs text-blue-600 mt-1">Fast computation, industry standard</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Discrete Method</h4>
          <p className="text-sm text-green-700">Nodal analysis with spatial distribution</p>
          <p className="text-xs text-green-600 mt-1">Physics-based, detailed voltage gradients</p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-3 border">Parameter</th>
              <th className="text-center p-3 border">Analytical</th>
              <th className="text-center p-3 border">Discrete</th>
              <th className="text-center p-3 border">Difference</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-50">
              <td className="p-3 border font-medium">Grid Resistance (×)</td>
              <td className="text-center p-3 border">
                {methods.analytical?.gridResistance?.toFixed(3) || 'N/A'}
              </td>
              <td className="text-center p-3 border">
                {methods.discrete?.gridResistance?.toFixed(3) || 'N/A'}
              </td>
              <td className={`text-center p-3 border font-bold ${getDifferenceColor(calculateDifference(methods.analytical?.gridResistance, methods.discrete?.gridResistance))}`}>
                {formatDifference(calculateDifference(methods.analytical?.gridResistance, methods.discrete?.gridResistance))}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="p-3 border font-medium">GPR (V)</td>
              <td className="text-center p-3 border">
                {methods.analytical?.gpr?.toFixed(0) || 'N/A'}
              </td>
              <td className="text-center p-3 border">
                {methods.discrete?.gpr?.toFixed(0) || 'N/A'}
              </td>
              <td className={`text-center p-3 border font-bold ${getDifferenceColor(calculateDifference(methods.analytical?.gpr, methods.discrete?.gpr))}`}>
                {formatDifference(calculateDifference(methods.analytical?.gpr, methods.discrete?.gpr))}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="p-3 border font-medium">Step Voltage (V)</td>
              <td className="text-center p-3 border">
                {methods.analytical?.stepVoltage?.toFixed(0) || 'N/A'}
              </td>
              <td className="text-center p-3 border">
                {methods.discrete?.stepVoltage?.toFixed(0) || 'N/A'}
              </td>
              <td className={`text-center p-3 border font-bold ${getDifferenceColor(calculateDifference(methods.analytical?.stepVoltage, methods.discrete?.stepVoltage))}`}>
                {formatDifference(calculateDifference(methods.analytical?.stepVoltage, methods.discrete?.stepVoltage))}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="p-3 border font-medium">Touch Voltage (V)</td>
              <td className="text-center p-3 border">
                {methods.analytical?.touchVoltage?.toFixed(0) || 'N/A'}
              </td>
              <td className="text-center p-3 border">
                {methods.discrete?.touchVoltage?.toFixed(0) || 'N/A'}
              </td>
              <td className={`text-center p-3 border font-bold ${getDifferenceColor(calculateDifference(methods.analytical?.touchVoltage, methods.discrete?.touchVoltage))}`}>
                {formatDifference(calculateDifference(methods.analytical?.touchVoltage, methods.discrete?.touchVoltage))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Method Analysis */}
      <div className="bg-indigo-50 p-4 rounded-lg mb-6">
        <h4 className="font-semibold text-indigo-800 mb-2">Method Analysis</h4>
        <p className="text-sm text-indigo-700">
          {getMethodExplanation(calculateDifference(
            methods.analytical?.gridResistance, 
            methods.discrete?.gridResistance
          ))}
        </p>
        <div className="mt-3 text-xs text-indigo-600">
          <p><strong>Key Insight:</strong> Differences arise from spatial current distribution modeling. 
          Analytical method uses IEEE 80 empirical factors, while discrete method calculates exact nodal voltages.</p>
        </div>
      </div>

      {/* Calibration Information */}
      {calibration && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">Calibration Applied</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-yellow-700">Grid Resistance Factor:</span>
              <span className="ml-2 font-medium">{calibration.factors?.gridResistance?.toFixed(3) || 'N/A'}</span>
            </div>
            <div>
              <span className="text-yellow-700">Step Voltage Factor:</span>
              <span className="ml-2 font-medium">{calibration.factors?.stepVoltage?.toFixed(3) || 'N/A'}</span>
            </div>
            <div>
              <span className="text-yellow-700">Touch Voltage Factor:</span>
              <span className="ml-2 font-medium">{calibration.factors?.touchVoltage?.toFixed(3) || 'N/A'}</span>
            </div>
          </div>
          <p className="text-xs text-yellow-600 mt-2">
            Analytical method calibrated to align with discrete solver spatial reference
          </p>
        </div>
      )}

      {/* Engineering Recommendation */}
      <div className="mt-6 p-4 border-l-4 border-blue-500 bg-blue-50">
        <h4 className="font-semibold text-blue-800 mb-2">Engineering Recommendation</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>For preliminary design: Use analytical method for quick IEEE 80 compliance</p>
          <p>For detailed analysis: Use discrete method for spatial voltage distribution</p>
          <p>For critical applications: Consider both methods and analyze differences</p>
        </div>
      </div>
    </div>
  );
}
