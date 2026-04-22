import React from 'react';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

const AnalyticalComparison = ({ 
  analyticalResults, 
  discreteResults, 
  darkMode 
}) => {
  if (!analyticalResults || !discreteResults) {
    return (
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="text-sm text-gray-500">Comparison data not available</div>
      </div>
    );
  }

  // Calculate comparison metrics
  const metrics = [
    {
      name: 'Rg (Ω)',
      analytical: analyticalResults.Rg || 0,
      discrete: discreteResults.Rg || 0,
      unit: 'Ω'
    },
    {
      name: 'Em (V)',
      analytical: analyticalResults.Em || 0,
      discrete: discreteResults.Em || 0,
      unit: 'V'
    },
    {
      name: 'Es (V)',
      analytical: analyticalResults.Es || 0,
      discrete: discreteResults.Es || 0,
      unit: 'V'
    },
    {
      name: 'GPR (V)',
      analytical: analyticalResults.GPR || 0,
      discrete: discreteResults.GPR || 0,
      unit: 'V'
    }
  ];

  const calculateError = (analytical, discrete) => {
    if (analytical === 0) return 0;
    return Math.abs((discrete - analytical) / analytical * 100);
  };

  const overallError = metrics.reduce((sum, m) => {
    return sum + calculateError(m.analytical, m.discrete);
  }, 0) / metrics.length;

  const getErrorColor = (error) => {
    if (error < 5) return 'text-green-500';
    if (error < 15) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getErrorLevel = (error) => {
    if (error < 5) return 'EXCELLENT';
    if (error < 15) return 'ACCEPTABLE';
    return 'HIGH';
  };

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <BarChart3 size={18} />
          Analytical vs Discrete Comparison
        </h3>
        <div className={`text-sm font-semibold ${getErrorColor(overallError)}`}>
          {overallError.toFixed(1)}% Error
        </div>
      </div>

      {/* Overall Status */}
      <div className={`mb-4 p-3 rounded-lg ${
        overallError < 5 
          ? 'bg-green-500/10 border border-green-500' 
          : overallError < 15 
          ? 'bg-yellow-500/10 border border-yellow-500' 
          : 'bg-red-500/10 border border-red-500'
      }`}>
        <div className="flex items-center gap-2">
          {overallError < 5 ? (
            <TrendingUp size={16} className="text-green-500" />
          ) : (
            <AlertCircle size={16} className={overallError < 15 ? 'text-yellow-500' : 'text-red-500'} />
          )}
          <span className={`text-sm font-semibold ${
            overallError < 5 ? 'text-green-500' : overallError < 15 ? 'text-yellow-500' : 'text-red-500'
          }`}>
            {getErrorLevel(overallError)} Agreement
          </span>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="space-y-2">
        {metrics.map((metric, index) => {
          const error = calculateError(metric.analytical, metric.discrete);
          const errorColor = getErrorColor(error);
          
          return (
            <div key={index} className={`p-3 rounded ${darkMode ? 'bg-gray-700/50' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{metric.name}</span>
                <span className={`text-sm font-semibold ${errorColor}`}>
                  {error.toFixed(1)}%
                </span>
              </div>
              
              {/* Bar chart comparison */}
              <div className="relative h-6 mb-2">
                {/* Analytical bar */}
                <div
                  className="absolute left-0 top-0 h-full bg-blue-500/30 rounded-l"
                  style={{
                    width: `${(metric.analytical / Math.max(metric.analytical, metric.discrete)) * 100}%`
                  }}
                />
                {/* Discrete bar */}
                <div
                  className="absolute left-0 top-0 h-full bg-green-500/30 rounded-r"
                  style={{
                    width: `${(metric.discrete / Math.max(metric.analytical, metric.discrete)) * 100}%`
                  }}
                />
              </div>

              {/* Values */}
              <div className="flex justify-between text-xs">
                <div>
                  <span className="text-gray-500">Analytical:</span>
                  <span className="ml-1 font-semibold text-blue-500">
                    {metric.analytical.toFixed(2)} {metric.unit}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Discrete:</span>
                  <span className="ml-1 font-semibold text-green-500">
                    {metric.discrete.toFixed(2)} {metric.unit}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500/30 rounded" />
          <span className="text-gray-500">Analytical</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500/30 rounded" />
          <span className="text-gray-500">Discrete</span>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-4 text-xs text-gray-500">
        <div className="font-semibold mb-1">Notes:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>Analytical: IEEE 80 equations (Schwarz, Sverak)</li>
          <li>Discrete: Finite element method (grid simulation)</li>
          <li>Error &lt; 5%: Excellent agreement</li>
          <li>Error 5-15%: Acceptable for engineering</li>
          <li>Error &gt; 15%: Review model assumptions</li>
        </ul>
      </div>
    </div>
  );
};

export default AnalyticalComparison;
