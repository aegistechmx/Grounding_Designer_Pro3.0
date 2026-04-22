/**
 * Generador de gráficas profesionales para reportes
 */

export const generateChart = (report) => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 700;
      canvas.height = 350;
      const ctx = canvas.getContext('2d');

      // Verificar datos
      if (!report || !report.results) {
        console.warn('Reporte sin datos para gráfica');
        resolve(getEmptyChartImage());
        return;
      }

      const results = report.results || {};
      const limits = results.limits || {};

      // Fondo
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 700, 350);

      // Título
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#1f2937';
      ctx.fillText('Verificación de Seguridad IEEE 80', 20, 30);

      // Datos con valores seguros
      const data = [
        { 
          label: 'Tensión de Contacto (Em)', 
          value: results.Em || 0, 
          limit: limits.touch || 1, 
          color: '#3b82f6' 
        },
        { 
          label: 'Tensión de Paso (Es)', 
          value: results.Es || 0, 
          limit: limits.step || 1, 
          color: '#10b981' 
        }
      ];

      const maxLimit = Math.max(...data.map(d => d.limit), 1);
      const chartHeight = 180;
      const startX = 100;
      const startY = 280;
      const barWidth = 160;
      const spacing = 60;

      // Dibujar ejes
      ctx.beginPath();
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.moveTo(startX - 20, startY);
      ctx.lineTo(startX - 20, startY - chartHeight);
      ctx.lineTo(startX + (barWidth + spacing) * 2 + 50, startY - chartHeight);
      ctx.stroke();

      // Etiquetas de ejes Y
      ctx.fillStyle = '#6b7280';
      ctx.font = '9px Arial';
      for (let i = 0; i <= 4; i++) {
        const value = (maxLimit * i / 4).toFixed(0);
        const y = startY - (i / 4) * chartHeight;
        ctx.fillText(value, startX - 28, y + 3);
      }
      ctx.fillText('Tensión (V)', startX - 45, startY - chartHeight / 2);

      // Etiquetas de ejes X
      ctx.fillText('Parámetro', startX + (barWidth + spacing), startY + 20);

      // Dibujar barras
      data.forEach((item, index) => {
        const x = startX + index * (barWidth + spacing);
        const barHeight = (item.value / maxLimit) * chartHeight;
        const limitHeight = (item.limit / maxLimit) * chartHeight;

        // Línea del límite (roja punteada)
        ctx.beginPath();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(x - 10, startY - limitHeight);
        ctx.lineTo(x + barWidth + 10, startY - limitHeight);
        ctx.stroke();
        ctx.setLineDash([]);

        // Barra del valor calculado
        ctx.fillStyle = item.color;
        ctx.fillRect(x, startY - barHeight, barWidth, barHeight);

        // Etiqueta de valor
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 11px Arial';
        ctx.fillText(item.label, x, startY + 15);
        
        ctx.fillStyle = '#ef4444';
        ctx.font = '10px Arial';
        ctx.fillText(`Límite: ${item.limit.toFixed(0)} V`, x, startY - limitHeight - 5);
        
        ctx.fillStyle = item.color;
        ctx.font = 'bold 11px Arial';
        ctx.fillText(`${item.value.toFixed(0)} V`, x + barWidth / 2 - 15, startY - barHeight - 5);
      });

      // Leyenda
      ctx.fillStyle = '#1f2937';
      ctx.font = '10px Arial';
      ctx.fillRect(startX + (barWidth + spacing) * 2 + 20, 50, 12, 12);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(startX + (barWidth + spacing) * 2 + 20, 70, 12, 12);
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px Arial';
      ctx.fillText('Valor calculado', startX + (barWidth + spacing) * 2 + 40, 60);
      ctx.fillText('Límite permisible', startX + (barWidth + spacing) * 2 + 40, 80);

      resolve(canvas.toDataURL('image/png'));
    } catch (error) {
      console.error('Error generando gráfica:', error);
      resolve(getEmptyChartImage());
    }
  });
};

const getEmptyChartImage = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 700;
  canvas.height = 350;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 700, 350);
  ctx.fillStyle = '#ef4444';
  ctx.font = '14px Arial';
  ctx.fillText('No se pudo generar la gráfica', 250, 180);
  return canvas.toDataURL('image/png');
};

export const generateGaugeChart = (score, width = 200, height = 150) => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height - 20;
      const radius = Math.min(width, height) / 2.5;
      const startAngle = -Math.PI / 2;
      const endAngle = Math.PI / 2;

      // Arco de fondo
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 15;
      ctx.stroke();

      // Arco de progreso
      const safeScore = Math.min(100, Math.max(0, score || 0));
      const angle = startAngle + (safeScore / 100) * Math.PI;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, angle);
      ctx.strokeStyle = safeScore >= 70 ? '#22c55e' : safeScore >= 50 ? '#f59e0b' : '#ef4444';
      ctx.lineWidth = 15;
      ctx.stroke();

      // Texto del score
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#1f2937';
      ctx.fillText(`${Math.round(safeScore)}%`, centerX - 25, centerY - 10);
      
      ctx.font = '9px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('Score General', centerX - 25, centerY + 15);

      resolve(canvas.toDataURL('image/png'));
    } catch (error) {
      console.error('Error generando gauge:', error);
      resolve(getEmptyGaugeImage());
    }
  });
};

const getEmptyGaugeImage = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 150;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 200, 150);
  ctx.fillStyle = '#ef4444';
  ctx.font = '10px Arial';
  ctx.fillText('Error', 80, 80);
  return canvas.toDataURL('image/png');
};

export const generateHeatmapImage = (grid, width = 400, height = 400) => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!grid || !grid.length || !grid[0]) {
        resolve(getEmptyHeatmapImage(width, height));
        return;
      }

      const cellW = width / grid.length;
      const cellH = height / grid[0].length;
      const allValues = grid.flat();
      const maxVoltage = Math.max(...allValues, 1);

      for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[0].length; j++) {
          const value = grid[i][j] || 0;
          const ratio = Math.min(1, Math.max(0, value / maxVoltage));
          
          let color;
          if (ratio <= 0.15) color = '#22c55e';
          else if (ratio <= 0.35) color = '#84cc16';
          else if (ratio <= 0.55) color = '#eab308';
          else if (ratio <= 0.75) color = '#f97316';
          else color = '#ef4444';
          
          ctx.fillStyle = color;
          ctx.fillRect(i * cellW, j * cellH, cellW, cellH);
        }
      }

      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, width, height);

      resolve(canvas.toDataURL('image/png'));
    } catch (error) {
      console.error('Error generando heatmap image:', error);
      resolve(getEmptyHeatmapImage(width, height));
    }
  });
};

const getEmptyHeatmapImage = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.fillText('Heatmap no disponible', width / 2 - 60, height / 2);
  return canvas.toDataURL('image/png');
};

export default {
  generateChart,
  generateGaugeChart,
  generateHeatmapImage
};