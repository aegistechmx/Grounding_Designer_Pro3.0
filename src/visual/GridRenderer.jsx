import React, { useEffect, useRef } from 'react';

const GridRenderer = ({ grid, darkMode, width = 500, height = 400, onNodeClick }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !grid) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    // Limpiar canvas
    ctx.fillStyle = darkMode ? '#1f2937' : '#ffffff';
    ctx.fillRect(0, 0, w, h);
    
    // Escalar coordenadas
    const minX = grid.nodes && grid.nodes.length > 0 ? Math.min(...grid.nodes.map(n => n.x)) : 0;
    const maxX = grid.nodes && grid.nodes.length > 0 ? Math.max(...grid.nodes.map(n => n.x)) : 100;
    const minY = grid.nodes && grid.nodes.length > 0 ? Math.min(...grid.nodes.map(n => n.y)) : 0;
    const maxY = grid.nodes && grid.nodes.length > 0 ? Math.max(...grid.nodes.map(n => n.y)) : 100;
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    const scaleX = (w - 60) / rangeX;
    const scaleY = (h - 60) / rangeY;
    const offsetX = 30 - minX * scaleX;
    const offsetY = 30 - minY * scaleY;
    
    // Dibujar conductores
    ctx.beginPath();
    ctx.strokeStyle = darkMode ? '#60a5fa' : '#2563eb';
    ctx.lineWidth = 2;
    
    for (const conductor of grid.conductors) {
      const fromNode = grid.nodes?.find(n => n.id === conductor.from);
      const toNode = grid.nodes?.find(n => n.id === conductor.to);
      
      if (fromNode && toNode) {
        const x1 = fromNode.x * scaleX + offsetX;
        const y1 = fromNode.y * scaleY + offsetY;
        const x2 = toNode.x * scaleX + offsetX;
        const y2 = toNode.y * scaleY + offsetY;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    
    // Dibujar nodos
    for (const node of grid.nodes) {
      const x = node.x * scaleX + offsetX;
      const y = node.y * scaleY + offsetY;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = node.isBorder ? (darkMode ? '#fbbf24' : '#f59e0b') : (darkMode ? '#34d399' : '#10b981');
      ctx.fill();
      ctx.strokeStyle = darkMode ? '#ffffff' : '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Etiqueta de nodo
      if (node.isBorder) {
        ctx.fillStyle = darkMode ? '#ffffff' : '#000000';
        ctx.font = '8px Arial';
        ctx.fillText(`${node.i},${node.j}`, x + 5, y - 5);
      }
    }
    
    // Dibujar varillas
    const rods = grid.nodes.filter(n => n.isRod);
    for (const rod of rods) {
      const x = rod.x * scaleX + offsetX;
      const y = rod.y * scaleY + offsetY;
      
      ctx.beginPath();
      ctx.rect(x - 6, y - 2, 12, 4);
      ctx.fillStyle = darkMode ? '#ef4444' : '#dc2626';
      ctx.fill();
    }
    
  }, [grid, darkMode]);

  const handleClick = (e) => {
    if (!canvasRef.current || !onNodeClick || !grid) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    
    // Encontrar nodo más cercano
    const minX = grid.nodes && grid.nodes.length > 0 ? Math.min(...grid.nodes.map(n => n.x)) : 0;
    const maxX = grid.nodes && grid.nodes.length > 0 ? Math.max(...grid.nodes.map(n => n.x)) : 100;
    const minY = grid.nodes && grid.nodes.length > 0 ? Math.min(...grid.nodes.map(n => n.y)) : 0;
    const maxY = grid.nodes && grid.nodes.length > 0 ? Math.max(...grid.nodes.map(n => n.y)) : 100;
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    const scaleX = (w - 60) / rangeX;
    const scaleY = (h - 60) / rangeY;
    const offsetX = 30 - minX * scaleX;
    const offsetY = 30 - minY * scaleY;
    
    let closest = null;
    let minDist = Infinity;
    
    for (const node of grid.nodes) {
      const x = node.x * scaleX + offsetX;
      const y = node.y * scaleY + offsetY;
      const dist = Math.hypot(clickX - x, clickY - y);
      if (dist < minDist && dist < 15) {
        minDist = dist;
        closest = node;
      }
    }
    
    if (closest) {
      onNodeClick(closest);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border rounded-lg shadow-lg cursor-pointer"
      onClick={handleClick}
    />
  );
};

export default GridRenderer;
