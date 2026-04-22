import React from 'react';
import { getError, formatDiff, getInterpretation, getDifferenceColor, getBarColor } from '../utils/comparison';

export default function ComparisonPanel({ results }) {
  if (!results?.analytical || !results?.discrete) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Method Comparison
        </h2>
        <div className="text-sm text-gray-600">
          Comparison data not available. Run a calculation to see method comparison.
        </div>
      </div>
    );
  }

  const metrics = [
    { key: 'resistance', label: 'Grid Resistance', unit: '×' },
    { key: 'gpr', label: 'Ground Potential Rise', unit: 'V' },
    { key: 'step', label: 'Step Voltage', unit: 'V' },
    { key: 'touch', label: 'Touch Voltage', unit: 'V' }
  ];

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-3">
        Method Comparison: Analytical vs Discrete
      </h2>
      
      {/* Comparison Table */}
      <div className="mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b-2 border-gray-200">
              <th className="py-3 px-2 font-semibold text-gray-700">Metric</th>
              <th className="py-3 px-2 text-center font-semibold text-gray-700">Analytical</th>
              <th className="py-3 px-2 text-center font-semibold text-gray-700">Discrete</th>
              <th className="py-3 px-2 text-center font-semibold text-gray-700">Difference</th>
              <th className="py-3 px-2 font-semibold text-gray-700">Visual</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map(({ key, label, unit }) => {
              const a = results.analytical[key];
              const d = results.discrete[key];
              const diff = getError(a, d);
              const diffColor = getDifferenceColor(diff);
              const barColor = getBarColor(diff);
              const barWidth = Math.min(Math.abs(diff), 100);
              
              return (
                <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium text-gray-800">{label}</td>
                  <td className="py-3 px-2 text-center">
                    <span className="font-mono text-blue-600">
                      {a?.toFixed(2)} {unit}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="font-mono text-green-600">
                      {d?.toFixed(2)} {unit}
                    </span>
                  </td>
                  <td className={`py-3 px-2 text-center font-bold ${diffColor}`}>
                    {formatDiff(diff)}
                  </td>
                  <td className="py-3 px-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${barColor} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${barWidth}%` }}
                        title={`Difference: ${formatDiff(diff)}`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Technical Interpretation */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">
          Engineering Interpretation
        </h3>
        <p className="text-sm text-blue-700 leading-relaxed">
          {getInterpretation(results)}
        </p>
      </div>

      {/* Cross Validation Results */}
      {results?.validation && (
        <div className="mt-6">
          <div className={`p-4 rounded-lg border-l-4 ${
            results.validation.confidence === 'high' 
              ? 'bg-green-50 border-green-500' 
              : results.validation.confidence === 'medium'
              ? 'bg-yellow-50 border-yellow-500'
              : 'bg-red-50 border-red-500'
          }`}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span>🔍 Cross Validation</span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                results.validation.confidence === 'high' 
                  ? 'bg-green-200 text-green-800' 
                  : results.validation.confidence === 'medium'
                  ? 'bg-yellow-200 text-yellow-800'
                  : 'bg-red-200 text-red-800'
              }`}>
                Confidence: {results.validation.confidence.toUpperCase()}
              </span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-xs text-gray-600">Average Error</div>
                <div className="text-lg font-bold text-gray-800">
                  {results.validation.avgError?.toFixed(1)}%
                </div>
              </div>
              {results.validation.worstMetric && (
                <div>
                  <div className="text-xs text-gray-600">Worst Metric</div>
                  <div className="text-sm font-bold text-gray-800">
                    {results.validation.worstMetric.absDiff?.toFixed(1)}%
                    <span className="text-xs text-gray-500 ml-1">
                      ({results.validation.worstMetric.status})
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Physical Checks */}
            {results.validation.physicalChecks && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-700 mb-2">Physical Consistency Checks</div>
                <div className="flex gap-4 text-xs">
                  <div className={`flex items-center gap-1 ${
                    results.validation.physicalChecks.touchGreaterThanStep ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {results.validation.physicalChecks.touchGreaterThanStep ? '✓' : '✗'} Touch &gt; Step
                  </div>
                  <div className={`flex items-center gap-1 ${
                    results.validation.physicalChecks.gprConsistency ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {results.validation.physicalChecks.gprConsistency ? '✓' : '✗'} GPR Consistency
                  </div>
                </div>
              </div>
            )}

            {/* Interpretation */}
            {results.validation.interpretation && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-700 leading-relaxed">
                  <strong>Interpretation:</strong> {results.validation.interpretation}
                </div>
              </div>
            )}
          </div>

          {/* Detailed Metrics */}
          {results.validation.metrics && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Detailed Validation Metrics</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(results.validation.metrics).map(([key, metric]) => {
                  if (!metric) return null;
                  const statusColor = 
                    metric.status === 'excellent' ? 'text-green-600' :
                    metric.status === 'acceptable' ? 'text-yellow-600' : 'text-red-600';
                  return (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 capitalize">{key}:</span>
                      <span className={`${statusColor} font-semibold`}>
                        {metric.diff.toFixed(1)}% ({metric.status})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Method Characteristics */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Analytical Method</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>IEEE 80 standard formulas</li>
            <li>Empirical correction factors</li>
            <li>Fast computation</li>
            <li>Industry standard approach</li>
          </ul>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Discrete Method</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>Nodal analysis</li>
            <li>Spatial current distribution</li>
            <li>Physics-based modeling</li>
            <li>Detailed voltage gradients</li>
          </ul>
        </div>
      </div>

      {/* Engineering Recommendation */}
      <div className="mt-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-xs text-gray-700">
          <strong>Recommendation:</strong> For preliminary design, use analytical method for quick IEEE 80 compliance. 
          For detailed analysis, use discrete method to capture spatial effects. 
          Significant differences indicate complex grounding behavior requiring both methods.
        </p>
      </div>
    </div>
  );
}
