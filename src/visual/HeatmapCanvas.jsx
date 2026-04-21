import React, { useEffect, useRef } from 'react';

const HeatmapCanvas = ({ data, width = 500, height = 400, onPointClick }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    // Limpiar canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, w, h);
    
    // Encontrar valores mínimos y máximos
    const potentials = data.map(d => d.potential);
    const minPotential = potentials.length > 0 ? Math.min(...potentials) : 0;
    const maxPotential = potentials.length > 0 ? Math.max(...potentials) : 1000;
    const range = maxPotential - minPotential;
    
    // Dibujar celdas
    const cellW = w / 20;
    const cellH = h / 20;
    
    for (const point of data) {
      if (point.x === undefined || point.y === undefined) continue;
      
      const x = (point.x + 15) * (w / 30);
      const y = (point.y + 15) * (h / 30);
      
      if (x < 0 || x > w || y < 0 || y > h) continue;
      
      // Calcular intensidad de color
      let intensity = range > 0 ? (point.potential - minPotential) / range : 0.5;
      intensity = Math.min(0.95, Math.max(0.05, intensity));
      
      // Mapa de colores: verde -> amarillo -> rojo
      let r, g, b;
      if (intensity < 0.33) {
        // Verde a amarillo
        const t = intensity / 0.33;
        r = 255 * t;
        g = 255;
        b = 0;
      } else if (intensity < 0.66) {
        // Amarillo a naranja
        const t = (intensity - 0.33) / 0.33;
        r = 255;
        g = 255 * (1 - t);
        b = 0;
      } else {
        // Naranja a rojo
        const t = (intensity - 0.66) / 0.34;
        r = 255;
        g = 255 * (1 - t);
        b = 0;
      }
      
      ctx.fillStyle = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
      ctx.fillRect(x - cellW / 2, y - cellH / 2, cellW, cellH);
      
      // Borde de celda
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x - cellW / 2, y - cellH / 2, cellW, cellH);
    }
    
    // Dibujar líneas de la malla
    ctx.beginPath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 20; i++) {
      const x = i * (w / 20);
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      
      const y = i * (h / 20);
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    
    // Dibujar varillas (electrodos)
    const rods = data.filter(d => d.isRod);
    for (const rod of rods) {
      const x = (rod.x + 15) * (w / 30);
      const y = (rod.y + 15) * (h / 30);
      
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px Arial';
      ctx.fillText('', x - 3, y + 4);
    }
    
  }, [data]);

  const handleClick = (e) => {
    if (!canvasRef.current || !onPointClick) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    
    const gridX = (x / w) * 30 - 15;
    const gridY = (y / h) * 30 - 15;
    
    // Encontrar punto más cercano
    let closest = null;
    let minDist = Infinity;
    
    for (const point of data) {
      if (point.x === undefined || point.y === undefined) continue;
      const dist = Math.hypot(point.x - gridX, point.y - gridY);
      if (dist < minDist) {
        minDist = dist;
        closest = point;
      }
    }
    
    if (closest && minDist < 2) {
      onPointClick(closest);
    }
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border rounded-lg shadow-lg cursor-crosshair"
        onClick={handleClick}
      />
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        Low &nbsp;&nbsp; Medium &nbsp;&nbsp; High
      </div>
    </div>
  );
};

export default HeatmapCanvas;
