import React, { useEffect, useRef, useState } from 'react';
import FemSolver, { drawHeatmap, getEtapColor } from '../core/femSolver';

const FEMHeatmap = ({
  width = 800,
  height = 500,
  gridWidth = 80,
  gridHeight = 50,
  iterations = 100,
  sources = [{ x: 0.5, y: 0.5, voltage: 1 }],
  darkMode = false,
  showLegend = true,
  onValueClick = null
}) => {
  const canvasRef = useRef(null);
  const [solver, setSolver] = useState(null);
  const [hoverValue, setHoverValue] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Inicializar solver
  useEffect(() => {
    const newSolver = new FemSolver(gridWidth, gridHeight, iterations);
    newSolver.initGrid();
    
    // Agregar fuentes
    for (const source of sources) {
      newSolver.addSource(source.x, source.y, source.voltage);
    }
    
    // Resolver campo
    newSolver.solve();
    setSolver(newSolver);
  }, [gridWidth, gridHeight, iterations, sources]);

  // Dibujar heatmap
  useEffect(() => {
    if (!solver || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    drawHeatmap(ctx, solver, width, height);
    
    // Dibujar líneas de contorno (opcional)
    ctx.beginPath();
    ctx.strokeStyle = darkMode ? '#ffffff' : '#000000';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridWidth; i++) {
      ctx.moveTo(i * (width / gridWidth), 0);
      ctx.lineTo(i * (width / gridWidth), height);
      ctx.stroke();
      ctx.moveTo(0, i * (height / gridHeight));
      ctx.lineTo(width, i * (height / gridHeight));
      ctx.stroke();
    }
    
  }, [solver, width, height, gridWidth, gridHeight, darkMode]);

  // Manejar hover para mostrar valor
  const handleMouseMove = (e) => {
    if (!solver || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      const value = solver.getValueAt(x, y);
      const gradient = solver.getGradientAt(x, y);
      setHoverValue({ x, y, value, gradient });
    } else {
      setHoverValue(null);
    }
  };

  const handleClick = (e) => {
    if (!solver || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      const value = solver.getValueAt(x, y);
      const gradient = solver.getGradientAt(x, y);
      setSelectedPoint({ x, y, value, gradient });
      if (onValueClick) onValueClick({ x, y, value, gradient });
    }
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg shadow-lg cursor-crosshair"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={{ backgroundColor: darkMode ? '#0f172a' : '#ffffff' }}
      />
      
      {/* Tooltip con valor */}
      {hoverValue && (
        <div
          className="absolute bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none"
          style={{
            left: Math.max(10, Math.min(width - 10, hoverValue.x * width + 10)),
            top: Math.max(30, Math.min(height - 10, hoverValue.y * height - 20)),
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div>Potencial: {hoverValue.value.toFixed(3)} V</div>
          <div>Ex: {hoverValue.gradient.ex.toFixed(3)}</div>
          <div>Ey: {hoverValue.gradient.ey.toFixed(3)}</div>
        </div>
      )}
      
      {/* Leyenda */}
      {showLegend && (
        <div className={`absolute bottom-2 right-2 p-2 rounded backdrop-blur-sm ${darkMode ? 'bg-black/70' : 'bg-white/70'}`}>
          <div className="text-xs font-semibold mb-1">Potencial</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getEtapColor(0, 0, 1) }} />
            <span className="text-xs">Bajo</span>
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getEtapColor(0.5, 0, 1) }} />
            <span className="text-xs">Medio</span>
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getEtapColor(1, 0, 1) }} />
            <span className="text-xs">Alto</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-1">⚡ Puntos blancos = electrodos</div>
        </div>
      )}
      
      {/* Info del punto seleccionado */}
      {selectedPoint && (
        <div className={`absolute top-2 left-2 p-2 rounded text-xs ${darkMode ? 'bg-black/70 text-white' : 'bg-white/70 text-black'}`}>
          <div>Punto seleccionado</div>
          <div>Pos: ({selectedPoint.x.toFixed(2)}, {selectedPoint.y.toFixed(2)})</div>
          <div>V = {selectedPoint.value.toFixed(3)} V</div>
          <div>E = {Math.hypot(selectedPoint.gradient.ex, selectedPoint.gradient.ey).toFixed(3)} V/m</div>
          <button 
            onClick={() => setSelectedPoint(null)}
            className="mt-1 text-xs text-red-500 hover:text-red-700"
          >
            Limpiar
          </button>
        </div>
      )}
    </div>
  );
};

export default FEMHeatmap;
