import React from 'react';

const ProfileChart = ({ data, mode = 'x' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-gray-800 rounded-lg text-gray-400">
        No profile data available
      </div>
    );
  }

  const width = 400;
  const height = 200;
  const padding = 40;
  
  const maxValue = Math.max(...data.map(d => d.v));
  const minValue = Math.min(...data.map(d => d.v));
  const valueRange = maxValue - minValue || 1;
  
  const maxDistance = data.length - 1;
  
  const xScale = (index) => padding + (index / maxDistance) * (width - 2 * padding);
  const yScale = (value) => height - padding - ((value - minValue) / valueRange) * (height - 2 * padding);
  
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h4 className="text-white font-semibold mb-2">
        Voltage Profile - {mode === 'x' ? 'Horizontal Slice' : 'Vertical Slice'}
      </h4>
      <svg width={width} height={height} className="w-full">
        {/* Axes */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#666"
          strokeWidth={1}
        />
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#666"
          strokeWidth={1}
        />
        
        {/* Y-axis labels */}
        <text x={padding - 5} y={padding} fill="#888" fontSize="10" textAnchor="end">
          {maxValue.toFixed(0)}V
        </text>
        <text x={padding - 5} y={height - padding} fill="#888" fontSize="10" textAnchor="end">
          {minValue.toFixed(0)}V
        </text>
        
        {/* X-axis labels */}
        <text x={padding} y={height - padding + 15} fill="#888" fontSize="10" textAnchor="middle">
          0m
        </text>
        <text x={width - padding} y={height - padding + 15} fill="#888" fontSize="10" textAnchor="middle">
          {maxDistance}m
        </text>
        
        {/* Profile line */}
        <polyline
          points={data.map((d, i) => `${xScale(i)},${yScale(d.v)}`).join(' ')}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
        />
        
        {/* Data points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={xScale(i)}
            cy={yScale(d.v)}
            r={3}
            fill="#3b82f6"
          />
        ))}
      </svg>
      
      <div className="mt-2 text-xs text-gray-400">
        Max: {maxValue.toFixed(1)}V | Min: {minValue.toFixed(1)}V
      </div>
    </div>
  );
};

export default ProfileChart;
