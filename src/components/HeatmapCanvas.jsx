import React, { useEffect, useRef } from 'react';
import { generateHeatmap, getHeatmapColor } from '../core/heatmapEngine';

const HeatmapCanvas = ({ nodes, width = 500, height = 400, opacity = 0.7, showLegend = true }) => {
  const canvasRef = useRef();

  useEffect(() => {
    if (!nodes || nodes.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Generar heatmap con interpolación IDW
    const heatmapData = generateHeatmap(nodes, 80, 2);
    
    if (!heatmapData || !heatmapData.grid) return;
    
    ctx.clearRect(0, 0, width, height);
    
    const { grid } = heatmapData;
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    
    const cellW = width / cols;
    const cellH = height / rows;
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const cell = grid[i][j];
        if (!cell) continue;
        
        const color = getHeatmapColor(cell.normalized, 'thermal');
        ctx.fillStyle = color;
        ctx.fillRect(j * cellW, i * cellH, cellW + 1, cellH + 1);
      }
    }
    
  }, [nodes, width, height]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 pointer-events-none rounded-lg"
        style={{ opacity }}
      />
      {showLegend && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>Bajo</span>
            <div className="w-3 h-3 bg-yellow-500 rounded ml-2" />
            <span>Medio</span>
            <div className="w-3 h-3 bg-red-500 rounded ml-2" />
            <span>Alto</span>
          </div>
          <div className="text-center text-[10px] text-gray-300">Potencial eléctrico</div>
        </div>
      )}
    </div>
  );
};

export default HeatmapCanvas;
