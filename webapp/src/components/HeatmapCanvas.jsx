import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { interpolateIDW, createInterpolatedGrid, isWithinGridBounds } from '../utils/interpolation';
import { generateContourLines, generateContourLevels, createInterpolatedField } from '../utils/contourLines';
import { computeGradientField, normalizeGradientField } from '../utils/fieldGradient';
import ParticleFlow from '../webgl/ParticleFlow';

export default function HeatmapCanvas({ 
  nodes, 
  voltages, 
  interpolationPower = 2, 
  smoothingLevel = 0.5,
  showContours = true,
  numContours = 10,
  contourThickness = 2,
  criticalPoints = null,
  showParticles = true,
  engineeringMode = false,
  riskThresholds = null,
  discreteGrid = null,
  analyticalGrid = null,
  overlayMode = 'discrete', // 'discrete' | 'analytical' | 'overlay' | 'difference' | 'gradient' | 'magnitude' | 'risk'
  overlayOpacity = 0.5,
  onProbeDataChange = null // Callback to expose probe data
}) {
  const canvasRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [particleFlow, setParticleFlow] = useState(null);
  const [probe, setProbe] = useState({
    x: 0,
    y: 0,
    active: false,
    Vd: 0,
    Va: 0,
    error: 0
  });
  const [bookmarks, setBookmarks] = useState([]);

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

  // Risk color function for dangerous voltage zones
  const getRiskColor = (voltage) => {
    if (voltage > 500) return 'rgba(255, 0, 0, 0.3)'; // Red for >500V
    if (voltage > 250) return 'rgba(255, 165, 0, 0.3)'; // Orange for >250V
    return 'transparent'; // No overlay for safe zones
  };

  // Compute difference grid for validation
  const computeDifferenceGrid = (gridA, gridB) => {
    if (!gridA || !gridB || gridA.length !== gridB.length) return null;
    
    return gridA.map((row, y) =>
      row.map((v, x) => v - (gridB[y]?.[x] || 0))
    );
  };

  // Bilinear interpolation for probe
  const bilinear = (grid, x, y) => {
    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const y0 = Math.floor(y);
    const y1 = y0 + 1;

    if (!grid[y0] || !grid[y1]) return 0;

    const q11 = grid[y0][x0] ?? 0;
    const q21 = grid[y0][x1] ?? 0;
    const q12 = grid[y1][x0] ?? 0;
    const q22 = grid[y1][x1] ?? 0;

    const tx = x - x0;
    const ty = y - y0;

    return (
      q11 * (1 - tx) * (1 - ty) +
      q21 * tx * (1 - ty) +
      q12 * (1 - tx) * ty +
      q22 * tx * ty
    );
  };

  // Get horizontal slice for mini chart
  const getSliceX = (grid, y) => {
    const row = Math.floor(y);
    return grid[row] || [];
  };

  // Get vertical slice for mini chart
  const getSliceY = (grid, x) => {
    const col = Math.floor(x);
    return grid.map(row => row[col] || 0);
  };

  // Add bookmark at current probe position
  const addBookmark = () => {
    if (!probe.active) return;
    const newBookmark = {
      id: Date.now(),
      x: probe.x,
      y: probe.y,
      Vd: probe.Vd,
      Va: probe.Va,
      error: probe.error,
      timestamp: new Date().toLocaleTimeString()
    };
    setBookmarks(prev => [...prev, newBookmark]);
  };

  // Remove bookmark by id
  const removeBookmark = (id) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  // Draw mini oscilloscope chart
  const drawMiniChart = (ctx, data, x, y) => {
    const w = 150;
    const h = 60;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const pos = y + (i / 4) * h;
      ctx.beginPath();
      ctx.moveTo(x, pos);
      ctx.lineTo(x + w, pos);
      ctx.stroke();
    }

    // Data line
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    data.forEach((v, i) => {
      const px = x + (i / data.length) * w;
      const py = y + h - ((v - min) / range) * h;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });

    ctx.stroke();

    // Labels
    ctx.fillStyle = '#0f0';
    ctx.font = '10px monospace';
    ctx.fillText(`${max.toFixed(1)}V`, x + 2, y + 12);
    ctx.fillText(`${min.toFixed(1)}V`, x + 2, y + h - 2);
  };

  // Critical points drawing method
  const drawCriticalPoints = (ctx, criticalPoints, size) => {
    if (!criticalPoints) return;

    const { maxTouch, maxStep } = criticalPoints;
    const scale = size / 50; // Convert world coordinates (50x50m) to canvas pixels

    // 🔴 TOUCH (red) - Maximum touch voltage location
    if (maxTouch && maxTouch.x !== undefined) {
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(maxTouch.x * scale, maxTouch.y * scale, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Add glow effect
      ctx.shadowColor = 'red';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 🟠 STEP (orange) - Maximum step voltage location
    if (maxStep && maxStep.x !== undefined) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.arc(maxStep.x * scale, maxStep.y * scale, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Add glow effect
      ctx.shadowColor = 'orange';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  };

  // Initialize particle flow when surface grid is available
  useEffect(() => {
    if (!canvasRef.current || !nodes || !voltages || !showParticles) return;

    const canvas = canvasRef.current;
    const size = 400;

    // Generate surface grid for gradient field
    const xValues = nodes.map(n => n.x);
    const yValues = nodes.map(n => n.y);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    const resolution = 50; // 50x50 grid for gradient field
    const surfaceGrid = [];

    for (let i = 0; i < resolution; i++) {
      const row = [];
      const y = minY + (i / resolution) * (maxY - minY);

      for (let j = 0; j < resolution; j++) {
        const x = minX + (j / resolution) * (maxX - minX);
        const voltage = interpolateIDW(x, y, nodes, voltages, interpolationPower);
        row.push({ x, y, voltage });
      }

      surfaceGrid.push(row);
    }

    // Compute gradient field (real ∇V in V/m)
    const gradientField = computeGradientField(surfaceGrid, 1); // 1m spacing

    // Initialize particle flow with gradient field, engineering mode, and risk thresholds
    const flow = new ParticleFlow(canvas, 300, engineeringMode, riskThresholds);
    flow.setFlowField(gradientField);
    setParticleFlow(flow);

    return () => {
      if (flow) flow.destroy();
    };
  }, [nodes, voltages, interpolationPower, showParticles, engineeringMode, riskThresholds]);

  // Expose probe data and bookmarks to parent component
  useEffect(() => {
    if (onProbeDataChange) {
      onProbeDataChange({
        probe: probe.active ? probe : null,
        bookmarks: bookmarks
      });
    }
  }, [probe, bookmarks, onProbeDataChange]);

  // Memoize interpolated field for performance
  const interpolatedField = useMemo(() => {
    if (!nodes || !voltages) return [];
    
    const resolution = Math.floor(50 + smoothingLevel * 100);
    const field = [];
    
    for (let i = 0; i < resolution; i++) {
      field[i] = [];
      for (let j = 0; j < resolution; j++) {
        const worldX = (i / resolution) * 50;
        const worldY = (j / resolution) * 50;
        
        if (isWithinGridBounds(worldX, worldY, nodes)) {
          field[i][j] = interpolateIDW(worldX, worldY, nodes, voltages, interpolationPower);
        } else {
          field[i][j] = null;
        }
      }
    }
    
    return field;
  }, [nodes, voltages, interpolationPower, smoothingLevel]);

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

    const max = Math.max(...voltages);
    const min = Math.min(...voltages);
    const range = max - min || 1;

    // Calculate resolution based on smoothing level
    const resolution = Math.floor(50 + smoothingLevel * 100); // 50-150 resolution
    const cellSize = size / resolution;

    // Draw function
    const draw = () => {
      // Clear with trail effect
      ctx.fillStyle = 'rgba(243, 244, 246, 0.3)';
      ctx.fillRect(0, 0, size, size);

      // Determine which grid to use based on mode
      let gridToRender = interpolatedField;
      let gridMin = min;
      let gridMax = max;

      if (overlayMode === 'analytical' && analyticalGrid) {
        // Use analytical grid
        gridToRender = analyticalGrid;
        gridMin = Math.min(...analyticalGrid.flat());
        gridMax = Math.max(...analyticalGrid.flat());
      } else if (overlayMode === 'difference' && discreteGrid && analyticalGrid) {
        // Use difference grid
        const diffGrid = computeDifferenceGrid(discreteGrid, analyticalGrid);
        gridToRender = diffGrid;
        gridMin = Math.min(...diffGrid.flat());
        gridMax = Math.max(...diffGrid.flat());
      } else if (overlayMode === 'gradient' && particleFlow?.flowField) {
        // Use gradient magnitude
        const gradientGrid = particleFlow.flowField.map(row =>
          row.map(cell => cell?.mag || 0)
        );
        gridToRender = gradientGrid;
        gridMin = 0;
        gridMax = particleFlow.flowField.maxMagnitude || 1;
      } else if (overlayMode === 'magnitude' && discreteGrid && analyticalGrid) {
        // Use magnitude of both grids
        const magGrid = discreteGrid.map((row, i) =>
          row.map((val, j) => Math.sqrt(val * val + (analyticalGrid[i]?.[j] || 0) ** 2))
        );
        gridToRender = magGrid;
        gridMin = Math.min(...magGrid.flat());
        gridMax = Math.max(...magGrid.flat());
      } else if (overlayMode === 'risk' && riskThresholds && discreteGrid) {
        // Use risk-based coloring (thresholds)
        const riskGrid = discreteGrid.map(row =>
          row.map(val => {
            if (val >= riskThresholds.high) return 2; // High risk
            if (val >= riskThresholds.medium) return 1; // Medium risk
            return 0; // Safe
          })
        );
        gridToRender = riskGrid;
        gridMin = 0;
        gridMax = 2;
      }

      // Draw heatmap
      for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
          const value = gridToRender[i]?.[j];
          
          if (value !== null && value !== undefined) {
            const t = (value - gridMin) / (gridMax - gridMin || 1);

            let r, g, b;

            if (overlayMode === 'risk') {
              // Risk mode: discrete colors for risk levels
              if (value >= 1.5) { // High risk
                r = 255; g = 0; b = 0;
              } else if (value >= 0.5) { // Medium risk
                r = 255; g = 165; b = 0;
              } else { // Safe
                r = 0; g = 255; b = 0;
              }
            } else {
              // Standard gradient coloring
              r = Math.floor(255 * t);
              g = Math.floor(100 * (1 - Math.abs(t - 0.5) * 2));
              b = Math.floor(255 * (1 - t));
            }

            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);

            // Risk overlay only for discrete mode
            if (overlayMode === 'discrete') {
              const riskColor = getRiskColor(value);
              if (riskColor !== 'transparent') {
                ctx.fillStyle = riskColor;
                ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
              }
            }
          }
        }
      }

      // Draw discrete contour lines
      if (showContours && overlayMode !== 'analytical') {
        const fieldData = createInterpolatedField(nodes, voltages, resolution, interpolationPower);
        const contourLevels = generateContourLevels(min, max, numContours);
        drawContourLines(ctx, fieldData, contourLevels, resolution, size, contourThickness);
      }

      // Draw analytical contour overlay (dashed green lines)
      if (overlayMode === 'overlay' && analyticalGrid) {
        ctx.save();
        ctx.globalAlpha = overlayOpacity;
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;

        const analyticalMin = Math.min(...analyticalGrid.flat());
        const analyticalMax = Math.max(...analyticalGrid.flat());
        const analyticalLevels = generateContourLevels(analyticalMin, analyticalMax, numContours);
        
        // Create field data from analytical grid
        const analyticalFieldData = analyticalGrid.map((row, y) =>
          row.map((v, x) => ({ x, y, value: v }))
        );

        drawContourLines(ctx, analyticalFieldData, analyticalLevels, resolution, size, contourThickness);
        
        ctx.restore();
      }

      // Draw grid overlay
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i <= 10; i++) {
        const pos = (i / 10) * size;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, size);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(pos, size);
        ctx.stroke();
      }

      // Draw engineering overlay
      drawEngineeringOverlay(ctx, nodes, size);

      // Draw critical points
      drawCriticalPoints(ctx, criticalPoints, size);

      // Update and render particle flow
      if (particleFlow && showParticles) {
        particleFlow.update(0.016);
        particleFlow.render(ctx);
      }

      // Draw oscilloscope crosshair
      if (probe.active && discreteGrid) {
        const gridWidth = discreteGrid[0]?.length || 50;
        const gridHeight = discreteGrid.length || 50;
        
        const cx = (probe.x / (gridWidth - 1)) * size;
        const cy = (probe.y / (gridHeight - 1)) * size;

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, size);
        ctx.moveTo(0, cy);
        ctx.lineTo(size, cy);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw mini oscilloscope charts
        if (discreteGrid) {
          // Horizontal slice (X-axis profile)
          const sliceX = getSliceX(discreteGrid, probe.y);
          if (sliceX.length > 0) {
            drawMiniChart(ctx, sliceX, 20, 20);
          }

          // Vertical slice (Y-axis profile)
          const sliceY = getSliceY(discreteGrid, probe.x);
          if (sliceY.length > 0) {
            drawMiniChart(ctx, sliceY, 20, 90);
          }
        }
      }

      // Draw bookmarks
      if (discreteGrid && bookmarks.length > 0) {
        const gridWidth = discreteGrid[0]?.length || 50;
        const gridHeight = discreteGrid.length || 50;

        bookmarks.forEach((bookmark, index) => {
          const bx = (bookmark.x / (gridWidth - 1)) * size;
          const by = (bookmark.y / (gridHeight - 1)) * size;

          // Draw bookmark marker
          ctx.fillStyle = '#ff0';
          ctx.beginPath();
          ctx.arc(bx, by, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#f00';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw bookmark number
          ctx.fillStyle = '#000';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(index + 1, bx, by);
        });
      }
    };

    // Animation loop
    let animationFrame;
    const animate = () => {
      draw();
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    // Add hover event listener for oscilloscope probe
    const handleMouseMove = useCallback((e) => {
      const rect = canvas.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      const gridWidth = discreteGrid?.[0]?.length || 50;
      const gridHeight = discreteGrid?.length || 50;

      const gx = px * (gridWidth - 1);
      const gy = py * (gridHeight - 1);

      const Vd = discreteGrid ? bilinear(discreteGrid, gx, gy) : 0;
      const Va = analyticalGrid ? bilinear(analyticalGrid, gx, gy) : 0;

      const error = Va !== 0
        ? Math.abs(Vd - Va) / Math.max(Math.abs(Vd), Math.abs(Va))
        : 0;

      setProbe({
        x: gx,
        y: gy,
        active: true,
        Vd,
        Va,
        error,
        mouseX: e.clientX,
        mouseY: e.clientY
      });

      // Also update regular tooltip for compatibility
      const worldX = (px) * 50;
      const worldY = (py) * 50;

      if (isWithinGridBounds(worldX, worldY, nodes)) {
        const voltage = interpolateIDW(worldX, worldY, nodes, voltages, interpolationPower);
        setTooltip({
          x: e.clientX,
          y: e.clientY,
          value: voltage.toFixed(2),
          worldX: worldX.toFixed(1),
          worldY: worldY.toFixed(1)
        });
      } else {
        setTooltip(null);
      }
    }, [discreteGrid, analyticalGrid, nodes, voltages, interpolationPower]);

    const handleMouseLeave = useCallback(() => {
      setTooltip(null);
      setProbe(prev => ({ ...prev, active: false }));
    }, []);

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrame);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };

  }, [nodes, voltages, interpolationPower, smoothingLevel, showContours, numContours, contourThickness, criticalPoints, particleFlow, showParticles, discreteGrid, analyticalGrid, overlayMode, overlayOpacity]);

  return (
    <div className="relative">
      <canvas 
        ref={canvasRef} 
        className="border rounded-lg shadow-lg"
        style={{ width: '400px', height: '400px' }}
      />
      
      {/* Oscilloscope-style Tooltip */}
      {tooltip && (
        <div 
          style={{
            position: 'fixed',
            left: tooltip.x + 15,
            top: tooltip.y + 15,
            backgroundColor: '#000',
            color: '#0f0',
            padding: '8px 12px',
            fontSize: '12px',
            fontFamily: 'monospace',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          <div>Voltage: {tooltip.value} V</div>
          <div style={{ color: '#888', fontSize: '10px' }}>
            X: {tooltip.worldX}m, Y: {tooltip.worldY}m
          </div>
        </div>
      )}
      
      {/* Professional Oscilloscope Probe Tooltip */}
      {probe.active && (
        <div 
          style={{
            position: 'fixed',
            left: probe.mouseX + 15,
            top: probe.mouseY + 15,
            background: 'rgba(0,0,0,0.9)',
            color: '#0f0',
            padding: '10px',
            fontFamily: 'monospace',
            fontSize: '12px',
            border: '1px solid #0f0',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 1001,
            boxShadow: '0 4px 12px rgba(0,255,0,0.3)',
            minWidth: '180px'
          }}
        >
          <div style={{ borderBottom: '1px solid #0f0', paddingBottom: '4px', marginBottom: '4px', fontWeight: 'bold' }}>
            📊 PROBE DATA
          </div>
          <div>X: {probe.x.toFixed(2)} m</div>
          <div>Y: {probe.y.toFixed(2)} m</div>
          <div style={{ color: '#4a9eff', marginTop: '4px' }}>🔵 Vd: {probe.Vd.toFixed(1)} V</div>
          <div style={{ color: '#00ff00' }}>🟢 Va: {probe.Va.toFixed(1)} V</div>
          <div style={{ color: probe.error > 0.1 ? '#ff4444' : '#0f0', marginTop: '4px' }}>
            🔴 Error: {(probe.error * 100).toFixed(1)} %
          </div>
          <div style={{ color: '#888', fontSize: '10px', marginTop: '4px' }}>
            Discrete vs Analytical
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const csvContent = [
                ['X (m)', 'Y (m)', 'V_discrete (V)', 'V_analytical (V)', 'Error (%)'],
                [probe.x.toFixed(2), probe.y.toFixed(2), probe.Vd.toFixed(1), probe.Va.toFixed(1), (probe.error * 100).toFixed(1)]
              ].map(row => row.join(',')).join('\n');
              
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `probe_data_${Date.now()}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              background: '#0f0',
              color: '#000',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 'bold'
            }}
          >
            📥 Export CSV
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              addBookmark();
            }}
            style={{
              marginTop: '4px',
              padding: '4px 8px',
              background: '#ff0',
              color: '#000',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 'bold'
            }}
          >
            🔖 Bookmark
          </button>
        </div>
      )}
      
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
      
      {/* Critical Points Legend */}
      {criticalPoints && (
        <div className="mt-2 flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              Max Touch: {criticalPoints.maxTouch?.value?.toFixed(1)} V
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              Max Step: {criticalPoints.maxStep?.value?.toFixed(1)} V
            </span>
          </div>
        </div>
      )}

      {/* Bookmarks List */}
      {bookmarks.length > 0 && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-gray-700">🔖 Bookmarks ({bookmarks.length})</h4>
            <button
              onClick={() => setBookmarks([])}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {bookmarks.map((bookmark, index) => (
              <div key={bookmark.id} className="flex items-center justify-between text-xs bg-white p-2 rounded">
                <div>
                  <span className="font-bold text-yellow-600">#{index + 1}</span>
                  <span className="ml-2 text-gray-600">
                    ({bookmark.x.toFixed(1)}, {bookmark.y.toFixed(1)}) Vd: {bookmark.Vd.toFixed(1)}V
                  </span>
                </div>
                <button
                  onClick={() => removeBookmark(bookmark.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Engineering Scale Legend */}
      {particleFlow && (
        <div className="mt-2 text-center text-sm text-gray-600">
          <div className="font-semibold mb-1">
            Mode: {overlayMode.toUpperCase()}
            {overlayMode === 'overlay' && ` (Opacity: ${(overlayOpacity * 100).toFixed(0)}%)`}
          </div>
          <div>Voltage Range: {Math.min(...voltages).toFixed(0)} - {Math.max(...voltages).toFixed(0)} V</div>
          <div>Max Gradient: {particleFlow.flowField?.maxMagnitude?.toFixed(1) || '0'} V/m</div>
        </div>
      )}
    </div>
  );
}
