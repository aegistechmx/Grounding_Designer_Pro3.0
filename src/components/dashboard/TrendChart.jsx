import React, { useEffect, useRef } from 'react';

const TrendChart = ({ data, title, darkMode }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const colors = darkMode ? {
      grid: '#374151',
      text: '#9ca3af',
      line: '#60a5fa',
      fill: 'rgba(96, 165, 250, 0.1)'
    } : {
      grid: '#e5e7eb',
      text: '#6b7280',
      line: '#2563eb',
      fill: 'rgba(37, 99, 235, 0.1)'
    };
    
    // Dibujar grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = height - 20 - (i * (height - 40) / 4);
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();
    }
    
    // Dibujar datos
    const values = data.map(d => d.value);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = Math.max(1, maxValue - minValue);
    
    if (data.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 2;
      
      data.forEach((point, i) => {
        const x = 40 + (i * (width - 60) / Math.max(1, data.length - 1));
        const y = height - 20 - ((point.value - minValue) / range) * (height - 40);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      
      // Rellenar área
      ctx.lineTo(width - 20, height - 20);
      ctx.lineTo(40, height - 20);
      ctx.fillStyle = colors.fill;
      ctx.fill();
    }
    
    // Etiquetas
    ctx.fillStyle = colors.text;
    ctx.font = '10px Arial';
    ctx.fillText(title, width / 2 - 30, 15);
    
  }, [data, darkMode, title]);

  return (
    <div className="p-2">
      <canvas 
        ref={canvasRef} 
        width={500} 
        height={200} 
        className="w-full h-auto"
      />
    </div>
  );
};

export default TrendChart;