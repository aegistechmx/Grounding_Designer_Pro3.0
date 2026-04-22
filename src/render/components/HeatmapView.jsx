// src/render/components/HeatmapView.jsx
// Componente de heatmap - SOLO VISUAL, SIN CÁLCULOS

import React, { useRef, useEffect, useState } from 'react';
import RenderEngine from '../RenderEngine.js';

const HeatmapView = ({ 
  data, 
  width = 600, 
  height = 500, 
  title = 'Mapa de Tensiones',
  darkMode = false 
}) => {
  const canvasRef = useRef(null);
  const [renderer, setRenderer] = useState(null);

  useEffect(() => {
    if (canvasRef.current) {
      const engine = new RenderEngine(canvasRef.current, {
        width,
        height,
        backgroundColor: darkMode ? '#1a1a2e' : '#f0f0f0',
        gridColor: darkMode ? '#3b82f6' : '#2563eb',
        voltageColors: darkMode 
          ? ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']
          : ['#fee2e2', '#fecaca', '#fca5a5', '#ef4444', '#dc2626']
      });
      setRenderer(engine);
    }
  }, [width, height, darkMode]);

  useEffect(() => {
    if (renderer && data && renderer.ctx) {
      renderer.render({
        title,
        heatmap: data.heatmap,
        grid: data.gridConfig,
        legend: [
          { color: '#1e3a5f', label: `${isFinite(data.minVoltage) ? data.minVoltage.toFixed(0) : 'N/A'} V` },
          { color: '#3b82f6', label: 'Bajo' },
          { color: '#60a5fa', label: 'Medio' },
          { color: '#ef4444', label: `${isFinite(data.maxVoltage) ? data.maxVoltage.toFixed(0) : 'N/A'} V` }
        ]
      });
    }
  }, [renderer, data, title]);

  return (
    <div className="heatmap-container">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
      />
    </div>
  );
};

export default HeatmapView;
