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
