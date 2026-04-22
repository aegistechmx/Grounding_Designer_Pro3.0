import { useEffect, useRef } from 'react';
import { interpolateIDW, createInterpolatedGrid, isWithinGridBounds } from '../utils/interpolation';
import { generateContourLines, generateContourLevels, createInterpolatedField } from '../utils/contourLines';

export default function HeatmapCanvas({ 
  nodes, 
  voltages, 
  interpolationPower = 2, 
  smoothingLevel = 0.5,
  showContours = true,
  numContours = 10,
  contourThickness = 2
}) {
  const canvasRef = useRef(null);

  // Contour lines drawing method
  const drawContourLines = (ctx, fieldData, contourLevels, resolution, size, thickness) => {
    const contourLines = generateContourLines(fieldData, contourLevels, resolution);
    
    contourLines.forEach(contour => {
      ctx.strokeStyle = contour.color;
      ctx.lineWidth = thickness;
      ctx.globalAlpha = 0.8;
      
      contour.lines.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line[0][0], line[0][1]);
        ctx.lineTo(line[1][0], line[1][1]);
        ctx.stroke();
      });
    });
    
    ctx.globalAlpha = 1;
  };

  // Engineering overlay drawing method
  const drawEngineeringOverlay = (ctx, nodes, size) => {
    // Draw conductors as lines between adjacent nodes
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 2;
    
    // Simple grid conductor visualization
    const gridSize = Math.sqrt(nodes.length);
    const spacing = size / (gridSize - 1);
    
    // Draw horizontal conductors
    for (let row = 0; row < gridSize; row++) {
      ctx.beginPath();
      for (let col = 0; col < gridSize; col++) {
        const x = col * spacing;
        const y = row * spacing;
        if (col === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    
    // Draw vertical conductors
    for (let col = 0; col < gridSize; col++) {
      ctx.beginPath();
      for (let row = 0; row < gridSize; row++) {
        const x = col * spacing;
        const y = row * spacing;
        if (row === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    
    // Draw nodes as points
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    nodes.forEach(node => {
      const x = (node.x / 50) * size;
      const y = (node.y / 50) * size;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.stroke();
    });
    
    // Draw ground rods (corner nodes - typical placement)
    ctx.fillStyle = 'rgba(139, 69, 19, 0.8)'; // Brown color for rods
    const cornerNodes = [
      nodes[0], // Top-left
      nodes[gridSize - 1], // Top-right
      nodes[nodes.length - gridSize], // Bottom-left
      nodes[nodes.length - 1] // Bottom-right
    ];
    
    cornerNodes.forEach(node => {
      if (node) {
        const x = (node.x / 50) * size;
        const y = (node.y / 50) * size;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.stroke();
      }
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nodes || !voltages || nodes.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    
    const size = 400;
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, size, size);

    const max = Math.max(...voltages);
    const min = Math.min(...voltages);
    const range = max - min || 1;

    // Calculate resolution based on smoothing level
    const resolution = Math.floor(50 + smoothingLevel * 100); // 50-150 resolution
    const cellSize = size / resolution;

    // Create smooth interpolated field
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const worldX = (i / resolution) * 50; // Convert to world coordinates (50x50m grid)
        const worldY = (j / resolution) * 50;
        
        // Only interpolate within grid bounds
        if (isWithinGridBounds(worldX, worldY, nodes)) {
          const interpolatedValue = interpolateIDW(worldX, worldY, nodes, voltages, interpolationPower);
          
          // Normalize voltage to 0-1 range
          const t = (interpolatedValue - min) / range;

          // Enhanced color scale: blue (cold) -> green (medium) -> red (hot)
          const r = Math.floor(255 * t);
          const g = Math.floor(100 * (1 - Math.abs(t - 0.5) * 2)); // Peak at middle
          const b = Math.floor(255 * (1 - t));

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }
    }

    // Apply smoothing effect (cheap blur)
    if (smoothingLevel > 0.3) {
      ctx.globalAlpha = 0.1 * smoothingLevel;
      ctx.drawImage(canvas, 0, 0);
      ctx.globalAlpha = 1;
    }

    // Draw contour lines (equipotentials)
    if (showContours && nodes && voltages) {
      const fieldData = createInterpolatedField(nodes, voltages, resolution, interpolationPower);
      const contourLevels = generateContourLevels(min, max, numContours);
      drawContourLines(ctx, fieldData, contourLevels, resolution, size, contourThickness);
    }

    // Draw grid overlay
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 0.5;
    
    // Draw grid lines every 50 pixels (representing 5m)
    for (let i = 0; i <= 10; i++) {
      const pos = (i / 10) * size;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
    }

    // Draw engineering overlay
    drawEngineeringOverlay(ctx, nodes, size);

  }, [nodes, voltages, interpolationPower, smoothingLevel, showContours, numContours, contourThickness]);

  return (
    <div className="relative">
      <canvas 
        ref={canvasRef} 
        className="border rounded-lg shadow-lg"
        style={{ width: '400px', height: '400px' }}
      />
      
      {/* Color Legend */}
      <div className="mt-4 flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-600">Low Voltage</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">Medium</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-600">High Voltage</span>
        </div>
      </div>
      
      {/* Voltage Range Display */}
      {voltages && voltages.length > 0 && (
        <div className="mt-2 text-center text-sm text-gray-500">
          Range: {Math.min(...voltages).toFixed(0)}V - {Math.max(...voltages).toFixed(0)}V
        </div>
      )}
    </div>
  );
}
