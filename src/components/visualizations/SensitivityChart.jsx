// src/components/visualizations/SensitivityChart.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

export const SensitivityChart = ({ data, darkMode, onParameterSelect }) => {
  const [chartType, setChartType] = useState('bar');
  const [selectedMetric, setSelectedMetric] = useState('Rg');
  
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>📊 No hay datos de sensibilidad disponibles</p>
        <p className="text-xs mt-2">Ejecuta una simulación para generar el análisis</p>
      </div>
    );
  }
  
  const colors = darkMode
    ? ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6']
    : ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
  
  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              chartType === 'bar' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📊 Barras
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              chartType === 'line' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📈 Líneas
          </button>
        </div>
        
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="px-3 py-1 bg-gray-700 rounded-lg text-sm text-white"
        >
          <option value="Rg">Resistencia (Rg)</option>
          <option value="GPR">GPR</option>
          <option value="Em">Tensión Contacto</option>
          <option value="Es">Tensión Paso</option>
        </select>
      </div>
      
      {/* Gráfico */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#4b5563'} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#4b5563'} />
              <Tooltip 
                contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: 'none' }}
                labelStyle={{ color: darkMode ? '#fff' : '#000' }}
              />
              <Legend />
              <Bar dataKey={selectedMetric} fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]}
                    onClick={() => onParameterSelect?.(entry.name)}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#4b5563'} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#4b5563'} />
              <Tooltip 
                contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: 'none' }}
                labelStyle={{ color: darkMode ? '#fff' : '#000' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      
      {/* Tabla de datos */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={darkMode ? 'bg-gray-700' : 'bg-gray-200'}>
              <th className="p-2 text-left">Parámetro</th>
              <th className="p-2 text-right">Valor Base</th>
              <th className="p-2 text-right">Mínimo</th>
              <th className="p-2 text-right">Máximo</th>
              <th className="p-2 text-right">Sensibilidad (%)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx} className="border-t border-gray-700">
                <td className="p-2 font-medium">{item.name}</td>
                <td className="p-2 text-right">{isFinite(item.baseValue) ? item.baseValue.toFixed(2) : 'N/A'}</td>
                <td className="p-2 text-right text-blue-400">{isFinite(item.minValue) ? item.minValue.toFixed(2) : 'N/A'}</td>
                <td className="p-2 text-right text-red-400">{isFinite(item.maxValue) ? item.maxValue.toFixed(2) : 'N/A'}</td>
                <td className="p-2 text-right font-bold text-yellow-400">{isFinite(item.sensitivity) ? item.sensitivity.toFixed(1) : 'N/A'}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SensitivityChart;
