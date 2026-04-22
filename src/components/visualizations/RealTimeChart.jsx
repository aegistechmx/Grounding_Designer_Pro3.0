import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Download, RefreshCw } from 'lucide-react';

const RealTimeChart = ({ data, title, xLabel, yLabel, darkMode, onHover, onPointClick }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, value: 0, label: '' });

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    let animationTime = 0;
    let animationFrameId;
    
    // Detectar hover sobre puntos
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
      
      const values = data.map(d => d.value);
      const maxValue = Math.max(...values, 1);
      const minValue = Math.min(...values, 0);
      const range = maxValue - minValue;
      
      for (let i = 0; i < data.length; i++) {
        const x = 60 + (i * (width - 90) / (data.length - 1));
        const y = height - 40 - ((data[i].value - minValue) / range) * (height - 80);
        const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
        
        if (distance < 10) {
          setTooltip({
            visible: true,
            x: x + 15,
            y: y - 15,
            value: data[i].value,
            label: data[i].label || `Punto ${i + 1}`
          });
          setHoveredPoint(i);
          if (onHover) onHover(data[i]);
          return;
        }
      }
      
      setTooltip({ ...tooltip, visible: false });
      setHoveredPoint(null);
    };
    
    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
      
      const values = data.map(d => d.value);
      const maxValue = Math.max(...values, 1);
      const minValue = Math.min(...values, 0);
      const range = maxValue - minValue;
      
      for (let i = 0; i < data.length; i++) {
        const x = 60 + (i * (width - 90) / (data.length - 1));
        const y = height - 40 - ((data[i].value - minValue) / range) * (height - 80);
        const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
        
        if (distance < 10 && onPointClick) {
          onPointClick(data[i]);
          break;
        }
      }
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    
    const animate = () => {
      if (!isAnimating) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      
      animationTime += 0.02;
      ctx.clearRect(0, 0, width, height);
      
      const colors = darkMode ? {
        grid: '#374151',
        text: '#9ca3af',
        line: '#60a5fa',
        fill: 'rgba(96, 165, 250, 0.1)',
        point: '#3b82f6',
        pointHover: '#60a5fa',
        area: 'rgba(96, 165, 250, 0.05)'
      } : {
        grid: '#e5e7eb',
        text: '#6b7280',
        line: '#2563eb',
        fill: 'rgba(37, 99, 235, 0.1)',
        point: '#1d4ed8',
        pointHover: '#3b82f6',
        area: 'rgba(37, 99, 235, 0.05)'
      };
      
      // Dibujar fondo del área
      ctx.fillStyle = colors.area;
      ctx.fillRect(0, 0, width, height);
      
      // Dibujar grid
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = height - 40 - (i * (height - 80) / 4);
        ctx.beginPath();
        ctx.moveTo(60, y);
        ctx.lineTo(width - 30, y);
        ctx.stroke();
        
        // Etiquetas del eje Y
        const value = minValue + (i * range / 4);
        ctx.fillStyle = colors.text;
        ctx.font = '10px Arial';
        ctx.fillText(isFinite(value) ? value.toFixed(1) : 'N/A', 45, y + 3);
      }
      
      // Dibujar datos con animación
      const values = data.map(d => d.value);
      const maxValue = Math.max(...values, 1);
      const minValue = Math.min(...values, 0);
      const range = maxValue - minValue || 1;
      
      if (data.length > 1) {
        const visiblePoints = isAnimating 
          ? Math.min(data.length, Math.floor(animationTime * 10) + 1)
          : data.length;
        
        // Dibujar área bajo la curva
        ctx.beginPath();
        for (let i = 0; i < visiblePoints; i++) {
          const x = 60 + (i * (width - 90) / (data.length - 1 || 1));
          const y = height - 40 - ((data[i].value - minValue) / range) * (height - 80);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.lineTo(60 + ((visiblePoints - 1) * (width - 90) / (data.length - 1 || 1)), height - 40);
        ctx.lineTo(60, height - 40);
        ctx.fillStyle = colors.fill;
        ctx.fill();
        
        // Dibujar línea
        ctx.beginPath();
        ctx.strokeStyle = colors.line;
        ctx.lineWidth = 2.5;
        
        for (let i = 0; i < visiblePoints; i++) {
          const x = 60 + (i * (width - 90) / (data.length - 1 || 1));
          const y = height - 40 - ((data[i].value - minValue) / range) * (height - 80);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        
        // Dibujar puntos
        for (let i = 0; i < visiblePoints; i++) {
          const x = 60 + (i * (width - 90) / (data.length - 1 || 1));
          const y = height - 40 - ((data[i].value - minValue) / range) * (height - 80);
          const isHovered = hoveredPoint === i;
          
          ctx.fillStyle = isHovered ? colors.pointHover : colors.point;
          ctx.beginPath();
          ctx.arc(x, y, isHovered ? 6 : 4, 0, 2 * Math.PI);
          ctx.fill();
          
          if (isHovered) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = colors.point;
          } else {
            ctx.shadowBlur = 0;
          }
        }
        ctx.shadowBlur = 0;
      }
      
      // Dibujar tooltip
      if (tooltip.visible) {
        ctx.fillStyle = darkMode ? '#1f2937' : '#ffffff';
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.fillRect(tooltip.x - 40, tooltip.y - 30, 80, 25);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = colors.line;
        ctx.strokeRect(tooltip.x - 40, tooltip.y - 30, 80, 25);
        
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`${isFinite(tooltip.value) ? tooltip.value.toFixed(2) : 'N/A'}`, tooltip.x - 35, tooltip.y - 12);
        ctx.font = '9px Arial';
        ctx.fillText(tooltip.label, tooltip.x - 35, tooltip.y - 18);
      }
      
      // Etiquetas de ejes
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 12px Arial';
      ctx.fillText(title, width / 2 - 40, 20);
      ctx.font = '11px Arial';
      ctx.fillText(yLabel, 15, height / 2);
      ctx.fillText(xLabel, width / 2, height - 10);
      
      // Dibujar líneas de ejes
      ctx.beginPath();
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.moveTo(60, height - 40);
      ctx.lineTo(width - 20, height - 40);
      ctx.stroke();
      ctx.moveTo(60, 20);
      ctx.lineTo(60, height - 40);
      ctx.stroke();
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [data, darkMode, title, xLabel, yLabel, isAnimating, hoveredPoint, tooltip, onHover, onPointClick]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `chart_${title.replace(/\s/g, '_')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const toggleFullscreen = () => {
    const container = canvasRef.current?.parentElement?.parentElement;
    if (!container) return;
    
    if (!isFullscreen) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-1">
          <button
            onClick={toggleAnimation}
            className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title={isAnimating ? 'Pausar animación' : 'Reanudar animación'}
          >
            <RefreshCw size={14} className={isAnimating ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleDownload}
            className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="Descargar como imagen"
          >
            <Download size={14} />
          </button>
          <button
            onClick={toggleFullscreen}
            className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title={isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
        {data && data.length > 0 && (
          <div className="text-xs text-gray-300">
            Datos: {data.length} puntos | Rango: {isFinite(Math.min(...data.map(d => d.value || 0))) ? Math.min(...data.map(d => d.value || 0)).toFixed(1) : 'N/A'} - {isFinite(Math.max(...data.map(d => d.value || 0))) ? Math.max(...data.map(d => d.value || 0)).toFixed(1) : 'N/A'}
          </div>
        )}
      </div>
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={700} 
          height={350} 
          className="w-full h-auto rounded-lg border shadow-sm"
          style={{ cursor: 'crosshair' }}
        />
        {isAnimating && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-300 animate-pulse">
            ▶ Animación en curso
          </div>
        )}
      </div>
      <div className="mt-2 text-xs text-center text-gray-300">
        💡 Pasa el mouse sobre los puntos para ver detalles | Haz clic para seleccionar
      </div>
    </div>
  );
};

export default RealTimeChart;