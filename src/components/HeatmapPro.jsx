import React, { useEffect, useRef, useState } from 'react';
import { generateHeatmap, drawHeatmap, generateContours, drawContours } from '../core/heatmapEngine';

const HeatmapPro = ({ nodes, width = 600, height = 500, theme = 'thermal', showContours = true, darkMode }) => {
  const canvasRef = useRef(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [contours, setContours] = useState([]);
  const [hoverValue, setHoverValue] = useState(null);

  useEffect(() => {
    if (!nodes || nodes.length === 0) return;
    
    // Generar heatmap
    const data = generateHeatmap(nodes, 80, 2);
    setHeatmapData(data);
    
    // Generar curvas equipotenciales
    if (showContours) {
      const contourLines = generateContours(data, 6);
      setContours(contourLines);
    }
  }, [nodes, showContours]);

  useEffect(() => {
    if (!heatmapData || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Dibujar heatmap
    drawHeatmap(ctx, heatmapData, width, height, theme);
    
    // Dibujar curvas
    if (showContours && contours.length > 0) {
      drawContours(ctx, contours, width, height, heatmapData.bounds);
    }
    
    // Dibujar nodos
    ctx.beginPath();
    for (const node of nodes) {
      const scaleX = width / (heatmapData.bounds.maxX - heatmapData.bounds.minX);
      const scaleY = height / (heatmapData.bounds.maxY - heatmapData.bounds.minY);
      const offsetX = -heatmapData.bounds.minX * scaleX;
      const offsetY = -heatmapData.bounds.minY * scaleY;
      
      const x = node.x * scaleX + offsetX;
      const y = node.y * scaleY + offsetY;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = node.isRod ? '#ef4444' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
  }, [heatmapData, contours, nodes, width, height, theme, showContours]);

  const handleMouseMove = (e) => {
    if (!heatmapData || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const scaleX = heatmapData.bounds.maxX - heatmapData.bounds.minX;
    const scaleY = heatmapData.bounds.maxY - heatmapData.bounds.minY;
    const realX = heatmapData.bounds.minX + (x / width) * scaleX;
    const realY = heatmapData.bounds.minY + (y / height) * scaleY;
    
    // Encontrar valor interpolado
    const gridX = Math.floor((x / width) * heatmapData.resolution);
    const gridY = Math.floor((y / height) * heatmapData.resolution);
    
    if (heatmapData.grid[gridY] && heatmapData.grid[gridY][gridX]) {
      setHoverValue(heatmapData.grid[gridY][gridX].value);
    }
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border rounded-lg shadow-lg cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverValue(null)}
      />
      {hoverValue !== null && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          Potencial: {hoverValue.toFixed(0)} V
        </div>
      )}
      <div className="absolute top-2 right-2 flex gap-1">
        <div className="w-3 h-3 bg-green-500 rounded" />
        <span className="text-xs text-gray-500">Bajo</span>
        <div className="w-3 h-3 bg-yellow-500 rounded ml-2" />
        <span className="text-xs text-gray-500">Medio</span>
        <div className="w-3 h-3 bg-red-500 rounded ml-2" />
        <span className="text-xs text-gray-500">Alto</span>
      </div>
    </div>
  );
};

export default HeatmapPro;
