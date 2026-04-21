import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const HeatMap = forwardRef(({ params, calculations, darkMode }, ref) => {
  const canvasRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getCanvasAsBase64: () => {
      const canvas = canvasRef.current;
      if (canvas) {
        return canvas.toDataURL('image/png');
      }
      return null;
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Colores según modo oscuro
    const bgColor = darkMode ? '#1f2937' : '#ffffff';
    const textColor = darkMode ? '#f3f4f6' : '#1f2937';
    const gridColor = darkMode ? '#4b5563' : '#e5e7eb';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Dibujar título
    ctx.fillStyle = textColor;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Mapa de Calor de Tensión de Contacto (Em)', width / 2, 20);

    // Dimensiones del mapa
    const margin = 60;
    const mapWidth = width - 2 * margin;
    const mapHeight = height - 2 * margin - 40;
    const gridSize = 14;

    // Calcular gradiente de colores
    const getColor = (value, minVal, maxVal) => {
      const ratio = (value - minVal) / (maxVal - minVal);
      
      if (ratio <= 0.2) {
        // Verde
        return `rgb(34, ${197 + (94 - 197) * (ratio / 0.2)}, 94)`;
      } else if (ratio <= 0.4) {
        // Amarillo
        const t = (ratio - 0.2) / 0.2;
        return `rgb(234, ${179 + (234 - 179) * t}, 8)`;
      } else if (ratio <= 0.6) {
        // Naranja
        const t = (ratio - 0.4) / 0.2;
        return `rgb(249, ${115 + (249 - 115) * t}, 22)`;
      } else {
        // Rojo
        return `rgb(239, 68, 68)`;
      }
    };

    // Generar datos del mapa de calor
    const gridLength = params?.gridLength || 30;
    const gridWidth = params?.gridWidth || 16;
    const cellsX = Math.min(30, Math.floor(mapWidth / gridSize));
    const cellsY = Math.min(30, Math.floor(mapHeight / gridSize));
    const stepX = gridLength / cellsX;
    const stepY = gridWidth / cellsY;

    const data = [];
    const values = [];

    for (let i = 0; i < cellsX; i++) {
      const row = [];
      for (let j = 0; j < cellsY; j++) {
        const x = i * stepX;
        const y = j * stepY;
        
        // Simular valor de tensión basado en posición
        const centerX = gridLength / 2;
        const centerY = gridWidth / 2;
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
        
        let value = (calculations?.Em || 500) * (1 - distance / maxDistance * 0.5);
        value = Math.max(0, Math.min(calculations?.Em || 500, value));
        
        row.push(value);
        values.push(value);
      }
      data.push(row);
    }

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Dibujar celdas
    const cellWidth = mapWidth / cellsX;
    const cellHeight = mapHeight / cellsY;

    for (let i = 0; i < cellsX; i++) {
      for (let j = 0; j < cellsY; j++) {
        const x = margin + i * cellWidth;
        const y = margin + j * cellHeight;
        const value = data[i][j];
        const color = getColor(value, minValue, maxValue);
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, cellWidth - 1, cellHeight - 1);
        
        // Etiquetas de valores
        if (cellWidth > 20 && cellHeight > 20) {
          ctx.fillStyle = value > 300 ? '#ffffff' : '#000000';
          ctx.font = '9px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(value.toFixed(0), x + cellWidth / 2, y + cellHeight / 2 + 3);
        }
      }
    }

    // Dibujar ejes
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(margin, margin, mapWidth, mapHeight);

    // Etiquetas de ejes
    ctx.fillStyle = textColor;
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    for (let i = 0; i <= 5; i++) {
      const x = margin + (i / 5) * mapWidth;
      const val = (i / 5) * gridLength;
      ctx.fillText(val.toFixed(1), x, margin - 10);
      ctx.fillText(val.toFixed(1), x, margin + mapHeight + 15);
    }
    
    for (let i = 0; i <= 5; i++) {
      const y = margin + (i / 5) * mapHeight;
      const val = (i / 5) * gridWidth;
      ctx.fillText(val.toFixed(1), margin - 25, y + 3);
      ctx.fillText(val.toFixed(1), margin + mapWidth + 10, y + 3);
    }

    // Títulos de ejes
    ctx.fillStyle = textColor;
    ctx.font = 'bold 11px Arial';
    ctx.fillText('Largo (m)', width / 2, margin + mapHeight + 30);
    
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Ancho (m)', 0, 0);
    ctx.restore();

    // Leyenda
    const legendX = width - 100;
    const legendY = height - 120;
    const legendHeight = 100;
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(legendX - 5, legendY - 20, 90, legendHeight + 30);
    
    ctx.fillStyle = textColor;
    ctx.font = '10px Arial';
    ctx.fillText('Tensión (V)', legendX + 35, legendY - 8);
    
    for (let i = 0; i <= 4; i++) {
      const ratio = i / 4;
      const y = legendY + (1 - ratio) * legendHeight;
      const color = getColor(minValue + ratio * (maxValue - minValue), minValue, maxValue);
      const value = (minValue + ratio * (maxValue - minValue)).toFixed(0);
      
      ctx.fillStyle = color;
      ctx.fillRect(legendX, y - 5, 20, 10);
      ctx.fillStyle = textColor;
      ctx.fillText(value, legendX + 25, y);
    }

  }, [params, calculations, darkMode]);

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
      <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        🗺️ Mapa de Calor - Tensión de Contacto (Em)
      </h3>
      <canvas
        ref={canvasRef}
        width={600}
        height={450}
        className="w-full h-auto border rounded-lg"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <div className="mt-3 text-center text-xs text-gray-500">
        💡 Las zonas en rojo indican áreas con mayor tensión de contacto. 
        Verde = seguro, Rojo = peligroso.
      </div>
    </div>
  );
});

HeatMap.displayName = 'HeatMap';

export default HeatMap;