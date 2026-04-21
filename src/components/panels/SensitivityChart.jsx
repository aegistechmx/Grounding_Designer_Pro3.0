import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export const SensitivityChart = ({ data, darkMode }) => {
  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div className={`p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg`}>
        <p className="text-gray-500">Ejecute el análisis de sensibilidad para ver el gráfico</p>
      </div>
    );
  }

  const chartData = data.labels.map((label, index) => ({
    name: label,
    sensibilidad: data.datasets[0].data[index],
    color: data.datasets[0].backgroundColor[index]
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-2 rounded shadow-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
          <p className="font-semibold">{label}</p>
          <p className="text-sm">Sensibilidad: <span className="font-bold">{payload[0].value.toFixed(2)}%</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
          <XAxis 
            type="number" 
            label={{ value: 'Sensibilidad (%)', position: 'insideBottom', offset: -5 }}
            stroke={darkMode ? '#9ca3af' : '#6b7280'}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={100}
            stroke={darkMode ? '#9ca3af' : '#6b7280'}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="sensibilidad" name="Sensibilidad (%)" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SensitivityChart;