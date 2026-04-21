/**
 * Motor de generación de heatmap realista
 */

export const generateHeatmapData = (calculations, params = {}) => {
  try {
    const size = 30;
    const grid = [];
    
    const GPR = calculations?.GPR || 1000;
    const gridLength = params?.gridLength || 30;
    const gridWidth = params?.gridWidth || 16;
    const soilResistivity = params?.soilResistivity || 100;
    
    const attenuationFactor = 0.4 + (Math.min(1000, Math.max(1, soilResistivity)) / 1000) * 0.3;
    
    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        const x = (i / (size - 1)) * 2 - 1;
        const y = (j / (size - 1)) * 2 - 1;
        const distance = Math.sqrt(x * x + y * y);
        
        let voltage;
        if (distance < 0.35) {
          voltage = GPR * (1 - distance * 0.6);
        } else {
          voltage = GPR * Math.exp(-(distance - 0.35) * attenuationFactor) * 0.5;
        }
        
        const soilFactor = 1 + (Math.min(1000, Math.max(1, soilResistivity)) - 100) / 1500;
        voltage = voltage * soilFactor;
        
        row.push(Math.max(0, Math.min(GPR, voltage)));
      }
      grid.push(row);
    }
    
    return grid;
  } catch (error) {
    console.error('Error generando heatmap:', error);
    return generateEmptyGrid();
  }
};

const generateEmptyGrid = () => {
  const size = 30;
  const grid = [];
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      row.push(0);
    }
    grid.push(row);
  }
  return grid;
};

export const getVoltageAtPoint = (x, y, calculations, params) => {
  try {
    const grid = generateHeatmapData(calculations, params);
    const size = grid.length;
    const ix = Math.floor(((x + 1) / 2) * (size - 1));
    const iy = Math.floor(((y + 1) / 2) * (size - 1));
    return grid[Math.min(size - 1, Math.max(0, ix))][Math.min(size - 1, Math.max(0, iy))];
  } catch (error) {
    console.error('Error obteniendo voltaje:', error);
    return 0;
  }
};

export const drawHeatmapOnCanvas = async (grid, canvas, width = 400, height = 400) => {
  return new Promise((resolve) => {
    try {
      if (!canvas || !grid || !grid.length) {
        resolve(getEmptyHeatmapImage(width, height));
        return;
      }
      
      const ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;
      
      const cellW = width / (grid.length || 1);
      const cellH = height / (grid[0]?.length || 1);
      const allValues = grid && grid.length > 0 ? grid.flat() : [];
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
      console.error('Error dibujando heatmap:', error);
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
  ctx.fillText('No se pudo generar el mapa de calor', width / 2 - 100, height / 2);
  return canvas.toDataURL('image/png');
};

export const generateHeatmapImage = (grid, width = 400, height = 400) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    drawHeatmapOnCanvas(grid, canvas, width, height).then((dataUrl) => {
      resolve(dataUrl);
    });
  });
};

export default {
  generateHeatmapData,
  getVoltageAtPoint,
  drawHeatmapOnCanvas,
  generateHeatmapImage
};