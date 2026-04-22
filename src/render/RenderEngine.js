// src/render/RenderEngine.js
// Motor de renderizado base - SOLO VISUALIZACIÓN, SIN CÁLCULOS

export class RenderEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) {
      console.error('No se pudo obtener contexto 2D del canvas');
      return;
    }
    this.width = options.width || 800;
    this.height = options.height || 600;
    this.backgroundColor = options.backgroundColor || '#1a1a2e';
    this.gridColor = options.gridColor || '#3b82f6';
    this.voltageColors = options.voltageColors || ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];
    
    this.setSize(this.width, this.height);
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawGrid(gridConfig) {
    if (!gridConfig || typeof gridConfig !== 'object') return;
    const { rows = 10, cols = 10, cellWidth = 50, cellHeight = 50, offsetX = 0, offsetY = 0 } = gridConfig;
    
    this.ctx.save();
    this.ctx.strokeStyle = this.gridColor;
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 0.5;
    
    for (let i = 0; i <= rows; i++) {
      const y = offsetY + i * cellHeight;
      this.ctx.beginPath();
      this.ctx.moveTo(offsetX, y);
      this.ctx.lineTo(offsetX + cols * cellWidth, y);
      this.ctx.stroke();
    }
    
    for (let j = 0; j <= cols; j++) {
      const x = offsetX + j * cellWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(x, offsetY);
      this.ctx.lineTo(x, offsetY + rows * cellHeight);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  drawConductors(conductors, gridConfig) {
    if (!conductors || !Array.isArray(conductors) || !gridConfig) return;
    const { cellWidth = 50, cellHeight = 50, offsetX = 0, offsetY = 0 } = gridConfig;
    
    this.ctx.save();
    this.ctx.strokeStyle = this.gridColor;
    this.ctx.lineWidth = 2;
    
    for (const conductor of conductors) {
      const x1 = offsetX + conductor.x1 * cellWidth;
      const y1 = offsetY + conductor.y1 * cellHeight;
      const x2 = offsetX + conductor.x2 * cellWidth;
      const y2 = offsetY + conductor.y2 * cellHeight;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  drawRods(rods, gridConfig) {
    if (!rods || !Array.isArray(rods) || !gridConfig) return;
    const { cellWidth = 50, cellHeight = 50, offsetX = 0, offsetY = 0 } = gridConfig;
    
    this.ctx.save();
    this.ctx.fillStyle = '#ef4444';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
    
    for (const rod of rods) {
      const x = offsetX + rod.x * cellWidth;
      const y = offsetY + rod.y * cellHeight;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
      this.ctx.fill();
    }
    
    this.ctx.restore();
  }

  drawHeatmap(heatmapData, gridConfig) {
    const { rows, cols, cellWidth, cellHeight, offsetX = 0, offsetY = 0 } = gridConfig;
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const value = heatmapData[i]?.[j] || 0;
        const color = this.getVoltageColor(value, heatmapData.minValue || 0, heatmapData.maxValue || 1);
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
          offsetX + j * cellWidth,
          offsetY + i * cellHeight,
          cellWidth,
          cellHeight
        );
      }
    }
  }

  getVoltageColor(voltage, minVoltage, maxVoltage) {
    const range = maxVoltage - minVoltage;
    const normalized = range > 0 ? (voltage - minVoltage) / range : 0;
    const colorIndex = Math.min(Math.floor(normalized * this.voltageColors.length), this.voltageColors.length - 1);
    return this.voltageColors[colorIndex];
  }

  drawText(text, x, y, options = {}) {
    this.ctx.save();
    this.ctx.font = options.font || '12px Arial';
    this.ctx.fillStyle = options.color || '#ffffff';
    this.ctx.textAlign = options.align || 'left';
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  drawLegend(legendItems, x, y) {
    this.ctx.save();
    let currentY = y;
    
    for (const item of legendItems) {
      this.ctx.fillStyle = item.color;
      this.ctx.fillRect(x, currentY, 20, 12);
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '10px Arial';
      this.ctx.fillText(item.label, x + 25, currentY + 10);
      
      currentY += 20;
    }
    
    this.ctx.restore();
  }

  drawTitle(title, x, y) {
    this.ctx.save();
    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(title, x, y);
    this.ctx.restore();
  }

  render(renderConfig) {
    if (!this.ctx) return;
    this.clear();
    
    if (renderConfig.title) {
      this.drawTitle(renderConfig.title, this.width / 2, 30);
    }
    
    if (renderConfig.heatmap) {
      this.drawHeatmap(renderConfig.heatmap, renderConfig.grid);
    }
    
    if (renderConfig.grid) {
      this.drawGrid(renderConfig.grid);
    }
    
    if (renderConfig.conductors) {
      this.drawConductors(renderConfig.conductors, renderConfig.grid);
    }
    
    if (renderConfig.rods) {
      this.drawRods(renderConfig.rods, renderConfig.grid);
    }
    
    if (renderConfig.legend) {
      this.drawLegend(renderConfig.legend, 20, 60);
    }
    
    if (renderConfig.annotations) {
      for (const annotation of renderConfig.annotations) {
        this.drawText(annotation.text, annotation.x, annotation.y, annotation.options);
      }
    }
  }
}

export default RenderEngine;
