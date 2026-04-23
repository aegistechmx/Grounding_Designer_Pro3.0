import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { interpolateIDW, isWithinGridBounds } from '../../utils/interpolation';
import { generateContourLines, generateContourLevels, createInterpolatedField } from '../../utils/contourLines';
import { drawHeatmap } from '../../heatmap/render/drawHeatmap';
import { generateField } from '../../heatmap/core/generateField';
import { generateContours, drawContoursCanvas, drawLabelsCanvas, drawLegendCanvas } from '../../etap';

// 🔥 REFACTORED VERSION
const HeatmapCanvas = forwardRef(({
  data,
  width = 500,
  height = 400,
  onPointClick,
  onSliceChange,
  interpolationPower = 2,
  smoothingLevel = 0.5,
  showContours = true,
  numContours = 10,
  contourThickness = 2
}, ref) => {
  const canvasRef = useRef(null);

  useImperativeHandle(ref, () => ({
    exportImage: () => {
      if (!canvasRef.current) return null;
      return canvasRef.current.toDataURL('image/png', 1.0);
    }
  }));
  
  // Zoom + Pan state
  const viewRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [last, setLast] = useState({ x: 0, y: 0 });
  
  // Slice state
  const [slice, setSlice] = useState({ mode: 'none', position: 0 });
  const [profileData, setProfileData] = useState([]);
  
  // Compute profile data from interpolated field
  const computeProfile = (sliceMode, slicePos, resolution, gridValues) => {
    const data = [];
    
    if (sliceMode === 'x') {
      const j = Math.floor((slicePos / 400) * resolution);
      for (let i = 0; i < resolution; i++) {
        if (gridValues[i] && gridValues[i][j] !== undefined) {
          data.push({ x: i, v: gridValues[i][j] });
        }
      }
    } else if (sliceMode === 'y') {
      const i = Math.floor((slicePos / 500) * resolution);
      for (let j = 0; j < resolution; j++) {
        if (gridValues[i] && gridValues[i][j] !== undefined) {
          data.push({ x: j, v: gridValues[i][j] });
        }
      }
    }
    
    return data;
  };
  
  // Compute risk grid based on IEEE 80 permissible voltages
  const computeRiskGrid = (gridValues, permissible) => {
    const riskGrid = [];
    for (let i = 0; i < gridValues.length; i++) {
      riskGrid[i] = [];
      for (let j = 0; j < gridValues[i].length; j++) {
        const v = gridValues[i][j];
        const margin = (permissible - v) / permissible;
        let level = 'safe';
        if (margin < 0) level = 'danger';
        else if (margin < 0.2) level = 'warning';
        riskGrid[i][j] = { v, margin, level };
      }
    }
    return riskGrid;
  };
  
  // Count dangerous zones
  const countDangerZones = (riskGrid) => {
    let count = 0;
    for (let i = 0; i < riskGrid.length; i++) {
      for (let j = 0; j < riskGrid[i].length; j++) {
        if (riskGrid[i][j].level === 'danger') {
          count++;
        }
      }
    }
    return count;
  };
  
  // Draw risk overlay on canvas
  const drawRiskOverlay = (ctx, riskGrid, cell) => {
    for (let i = 0; i < riskGrid.length; i++) {
      for (let j = 0; j < riskGrid[i].length; j++) {
        const { level } = riskGrid[i][j];
        if (level === 'danger') {
          ctx.fillStyle = 'rgba(255,0,0,0.4)';
        } else if (level === 'warning') {
          ctx.fillStyle = 'rgba(255,165,0,0.3)';
        } else {
          continue;
        }
        ctx.fillRect(i * cell, j * cell, cell, cell);
      }
    }
  };
  
  // Find max voltage point for highlighting
  const findMaxVoltagePoint = (riskGrid) => {
    let maxV = -Infinity;
    let maxPoint = null;
    for (let i = 0; i < riskGrid.length; i++) {
      for (let j = 0; j < riskGrid[i].length; j++) {
        const v = riskGrid[i][j].v;
        if (v > maxV) {
          maxV = v;
          maxPoint = { i, j, v };
        }
      }
    }
    return maxPoint;
  };
  
  // Zoom handler
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const newScale = e.deltaY < 0 ? viewRef.current.scale * zoomFactor : viewRef.current.scale / zoomFactor;
    viewRef.current = {
      ...viewRef.current,
      scale: Math.min(Math.max(newScale, 0.5), 5)
    };
    setZoomLevel(viewRef.current.scale);
  };
  
  // Pan handlers
  const onMouseDown = (e) => {
    setDragging(true);
    setLast({ x: e.clientX, y: e.clientY });
  };
  
  const onMouseMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    
    viewRef.current = {
      ...viewRef.current,
      offsetX: viewRef.current.offsetX + dx,
      offsetY: viewRef.current.offsetY + dy
    };
    setLast({ x: e.clientX, y: e.clientY });
  };
  
  const onMouseUp = () => setDragging(false);
  
  // Slice handler
  const handleSliceClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - viewRef.current.offsetX) / viewRef.current.scale;
    const y = (e.clientY - rect.top - viewRef.current.offsetY) / viewRef.current.scale;
    
    const newSlice = {
      mode: slice.mode === 'none' ? 'x' : (slice.mode === 'x' ? 'y' : 'none'),
      position: y
    };
    
    setSlice(newSlice);
    if (onSliceChange) {
      onSliceChange(newSlice);
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !data?.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, w, h);

    ctx.setTransform(
      viewRef.current.scale,
      0,
      0,
      viewRef.current.scale,
      viewRef.current.offsetX,
      viewRef.current.offsetY
    );

    const resolution = Math.floor(50 + smoothingLevel * 100);

    // Encontrar valores mínimos y máximos
    const potentials = data.map(d => isFinite(d.potential) ? d.potential : 0);
    const minPotential = potentials.length > 0 ? Math.min(...potentials) : 0;
    const maxPotential = potentials.length > 0 ? Math.max(...potentials) : 1000;

    const nodes = data.map(d => ({ x: d.x, y: d.y }));
    const values = data.map(d => d.potential);

    const field = generateField({
      resolution,
      size: 30,
      nodes,
      values,
      interpolationPower,
      min: minPotential,
      max: maxPotential
    });

    drawHeatmap(ctx, field, w, h);

    // Apply smoothing effect
    if (smoothingLevel > 0.3) {
      ctx.globalAlpha = 0.1 * smoothingLevel;
      ctx.drawImage(canvas, 0, 0);
      ctx.globalAlpha = 1;
    }
    
    // Draw contour lines (equipotentials) with ETAP Engine
    if (showContours && data && data.length > 0) {
      // Use ETAP Engine to generate contours
      const { contours, min, max } = generateContours(data, {
        gridSize: resolution,
        idwPower: interpolationPower,
        contourStepMinor: 100,
        contourStepMajor: 500,
        smoothSegments: Math.floor(10 + smoothingLevel * 10)
      });
      
      // Draw contours with hierarchy
      drawContoursCanvas(ctx, contours);
      
      // Draw rotated labels on major contours
      drawLabelsCanvas(ctx, contours);
      
      // Draw ETAP-style legend
      drawLegendCanvas(ctx, min, max, w - 80, 20, 150, 20);
      
      ctx.globalAlpha = 1;
    }
    
    // Draw slice line
    if (slice.mode !== 'none') {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      if (slice.mode === 'x') {
        ctx.beginPath();
        ctx.moveTo(0, slice.position);
        ctx.lineTo(w, slice.position);
        ctx.stroke();
      } else if (slice.mode === 'y') {
        ctx.beginPath();
        ctx.moveTo(slice.position, 0);
        ctx.lineTo(slice.position, h);
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
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
    if (data && Array.isArray(data)) {
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
        console.timeEnd("render");
      }
    }
    
  }, [data, interpolationPower, smoothingLevel, showContours, numContours, contourThickness, slice]);

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
    
    if (data && Array.isArray(data)) {
      for (const point of data) {
        if (point.x === undefined || point.y === undefined) continue;
        const dist = Math.hypot(point.x - gridX, point.y - gridY);
        if (dist < minDist) {
          minDist = dist;
          closest = point;
        }
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
        onClick={(e) => {
          handleClick(e);
          handleSliceClick(e);
        }}
        onWheel={(e) => handleWheel(e)}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        Low &nbsp;&nbsp; Medium &nbsp;&nbsp; High
      </div>
      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        Zoom: {zoomLevel.toFixed(2)}x | Slice: {slice.mode}
      </div>
    </div>
  );
});

// Export function for PDF generation
export const exportCanvasImage = (canvasRef) => {
  if (!canvasRef || !canvasRef.current) return null;
  try {
    return canvasRef.current.toDataURL("image/png");
  } catch (error) {
    console.error('Error exporting canvas:', error);
    return null;
  }
};

HeatmapCanvas.displayName = 'HeatmapCanvas';
export default HeatmapCanvas;
