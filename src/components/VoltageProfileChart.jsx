import React from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';

const VoltageProfileChart = ({ 
  profileData, 
  permissibleVoltage, 
  darkMode, 
  title = "Voltage Profile",
  unit = "V" 
}) => {
  if (!profileData || profileData.length === 0) {
    return (
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="text-sm text-gray-500">No profile data available</div>
      </div>
    );
  }

  const maxVoltage = Math.max(...profileData.map(p => p.v));
  const maxExceeded = maxVoltage > permissibleVoltage;
  const chartHeight = 120;
  const chartWidth = 100; // percentage
  const padding = 20;

  // Calculate Y positions
  const getY = (voltage) => {
    const maxVal = Math.max(maxVoltage, permissibleVoltage * 1.2);
    return chartHeight - (voltage / maxVal) * chartHeight;
  };

  // Calculate X positions
  const getX = (index) => {
    return (index / (profileData.length - 1)) * chartWidth;
  };

  // Generate path for the voltage curve
  const pathD = profileData.map((p, i) => {
    const x = getX(i);
    const y = getY(p.v);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Generate area under curve
  const areaD = `${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp size={18} />
          {title}
        </h3>
        {maxExceeded && (
          <div className="flex items-center gap-1 text-red-500 text-sm">
            <AlertTriangle size={14} />
            <span>Exceeds Limit</span>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div className="relative" style={{ height: `${chartHeight + padding * 2}px` }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${chartWidth + padding * 2} ${chartHeight + padding * 2}`}
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
            <line
              key={frac}
              x1={padding}
              y1={padding + (1 - frac) * chartHeight}
              x2={chartWidth + padding}
              y2={padding + (1 - frac) * chartHeight}
              stroke={darkMode ? '#374151' : '#e5e7eb'}
              strokeWidth="0.5"
            />
          ))}

          {/* Permissible voltage line */}
          <line
            x1={padding}
            y1={padding + getY(permissibleVoltage)}
            x2={chartWidth + padding}
            y2={padding + getY(permissibleVoltage)}
            stroke={maxExceeded ? '#ef4444' : '#22c55e'}
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Permissible voltage label */}
          <text
            x={chartWidth + padding - 5}
            y={padding + getY(permissibleVoltage) - 5}
            fontSize="8"
            fill={maxExceeded ? '#ef4444' : '#22c55e'}
            textAnchor="end"
          >
            Limit: {permissibleVoltage.toFixed(1)} {unit}
          </text>

          {/* Area under curve */}
          <path
            d={areaD}
            transform={`translate(${padding}, ${padding})`}
            fill={darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}
          />

          {/* Voltage curve */}
          <path
            d={pathD}
            transform={`translate(${padding}, ${padding})`}
            fill="none"
            stroke={darkMode ? '#3b82f6' : '#2563eb'}
            strokeWidth="2"
          />

          {/* Data points */}
          {profileData.map((p, i) => {
            const x = getX(i);
            const y = getY(p.v);
            const isExceeded = p.v > permissibleVoltage;
            return (
              <circle
                key={i}
                cx={x + padding}
                cy={y + padding}
                r="2"
                fill={isExceeded ? '#ef4444' : darkMode ? '#3b82f6' : '#2563eb'}
              />
            );
          })}

          {/* Max voltage marker */}
          <circle
            cx={getX(profileData.findIndex(p => p.v === maxVoltage)) + padding}
            cy={getY(maxVoltage) + padding}
            r="4"
            fill={maxExceeded ? '#ef4444' : '#22c55e'}
            stroke={darkMode ? '#1f2937' : '#ffffff'}
            strokeWidth="2"
          />

          {/* Max voltage label */}
          <text
            x={getX(profileData.findIndex(p => p.v === maxVoltage)) + padding}
            y={getY(maxVoltage) + padding - 10}
            fontSize="8"
            fill={darkMode ? '#ffffff' : '#000000'}
            textAnchor="middle"
          >
            {maxVoltage.toFixed(1)} {unit}
          </text>

          {/* Axes */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={chartHeight + padding}
            stroke={darkMode ? '#6b7280' : '#9ca3af'}
            strokeWidth="1"
          />
          <line
            x1={padding}
            y1={chartHeight + padding}
            x2={chartWidth + padding}
            y2={chartHeight + padding}
            stroke={darkMode ? '#6b7280' : '#9ca3af'}
            strokeWidth="1"
          />

          {/* Y-axis labels */}
          {[0, 0.5, 1].map((frac) => {
            const val = Math.max(maxVoltage, permissibleVoltage * 1.2) * frac;
            return (
              <text
                key={frac}
                x={padding - 5}
                y={padding + (1 - frac) * chartHeight + 3}
                fontSize="7"
                fill={darkMode ? '#9ca3af' : '#6b7280'}
                textAnchor="end"
              >
                {val.toFixed(0)}
              </text>
            );
          })}

          {/* X-axis labels */}
          {[0, 0.5, 1].map((frac) => (
            <text
              key={frac}
              x={padding + frac * chartWidth}
              y={chartHeight + padding + 12}
              fontSize="7"
              fill={darkMode ? '#9ca3af' : '#6b7280'}
              textAnchor="middle"
            >
              {(frac * 100).toFixed(0)}%
            </text>
          ))}

          {/* Axis labels */}
          <text
            x={padding - 8}
            y={padding - 5}
            fontSize="7"
            fill={darkMode ? '#9ca3af' : '#6b7280'}
            textAnchor="end"
          >
            {unit}
          </text>
          <text
            x={chartWidth + padding + 5}
            y={chartHeight + padding + 12}
            fontSize="7"
            fill={darkMode ? '#9ca3af' : '#6b7280'}
            textAnchor="start"
          >
            Position
          </text>
        </svg>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
          <div className="text-gray-500">Max Voltage</div>
          <div className={`font-semibold ${maxExceeded ? 'text-red-500' : 'text-green-500'}`}>
            {maxVoltage.toFixed(2)} {unit}
          </div>
        </div>
        <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
          <div className="text-gray-500">Limit</div>
          <div className="font-semibold text-blue-500">
            {permissibleVoltage.toFixed(2)} {unit}
          </div>
        </div>
        <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
          <div className="text-gray-500">Margin</div>
          <div className={`font-semibold ${maxExceeded ? 'text-red-500' : 'text-green-500'}`}>
            {((permissibleVoltage - maxVoltage) / permissibleVoltage * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoltageProfileChart;
