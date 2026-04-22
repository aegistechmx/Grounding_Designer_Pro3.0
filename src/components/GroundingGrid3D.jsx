import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, Move, Settings, X, Check, Sun, Moon, AlertTriangle, Camera, Palette, Layers, Sliders } from 'lucide-react';

const GroundingGrid3D = ({ params = {}, darkMode }) => {
  // Early return if params is not available
  if (!params || typeof params !== 'object') {
    return (
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <p className={`text-sm ${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>Cargando visualización 3D...</p>
      </div>
    );
  }
  
  // Estado de cámara y controles
  const [rotation, setRotation] = useState({ x: -25, y: 35, z: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showRods, setShowRods] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showDepthLines, setShowDepthLines] = useState(true);
  const [showKitMaster, setShowKitMaster] = useState(true);
  const [showGroundGrid, setShowGroundGrid] = useState(true);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(0);
  const [selectedView, setSelectedView] = useState('perspective');
  const [hoveredElement, setHoveredElement] = useState(null);
  const [showRodSpacing, setShowRodSpacing] = useState(true);
  const [showMinSpacingWarning, setShowMinSpacingWarning] = useState(true);
  const [gridOpacity, setGridOpacity] = useState(0.8);
  const [rodsOpacity, setRodsOpacity] = useState(1);
  const [nodeSize, setNodeSize] = useState(6);
  const [voltageVisualization, setVoltageVisualization] = useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const canvasRef = useRef(null);

  const {
    gridLength = 30,
    gridWidth = 16,
    numParallel = 15,
    numParallelY = null,
    numRods = 45,
    rodLength = 3,
    gridDepth = 0.6,
    transformerKVA = 75
  } = params;

  // Determinar kit master según potencia
  const getKitInfo = () => {
    if (transformerKVA <= 75) return { name: 'KITMASTER-100K', capacity: '100 A', color: '#8b5cf6' };
    if (transformerKVA <= 225) return { name: 'KITMASTER-400K', capacity: '400 A', color: '#a855f7' };
    return { name: 'KITMASTER-1000K', capacity: '1000 A', color: '#c084fc' };
  };

  const kitInfo = getKitInfo();

  // Calcular conductores en X y Y
  const nx = numParallel || 15;
  const ny = numParallelY || Math.max(3, Math.floor((numParallel || 15) * (gridLength || 30) / (gridWidth || 16)));
  
  // Espaciamientos de conductores
  const spacingX = (gridWidth || 16) / Math.max(1, nx - 1);
  const spacingY = (gridLength || 30) / Math.max(1, ny - 1);
  
  // ============================================
  // 👈 ESPACIAMIENTO ENTRE VARILLAS (ELECTRODOS)
  // ============================================
  const perimeter = 2 * (gridWidth + gridLength);
  const rodSpacing = numRods > 0 ? perimeter / numRods : perimeter;
  const rodSpacingMeters = isFinite(rodSpacing) ? rodSpacing.toFixed(2) : 'N/A';
  
  // 👈 Espaciamiento mínimo requerido según NMX-J-549-ANCE-2005
  // La distancia mínima entre electrodos debe ser 2 veces la longitud de la varilla
  const minRequiredSpacing = rodLength * 2;
  const spacingComplies = rodSpacing >= minRequiredSpacing;
  const spacingShortage = spacingComplies ? 0 : (isFinite(minRequiredSpacing - rodSpacing) ? (minRequiredSpacing - rodSpacing).toFixed(2) : 'N/A');
  const compliancePercent = spacingComplies ? 100 : (minRequiredSpacing > 0 && isFinite(rodSpacing / minRequiredSpacing) ? (rodSpacing / minRequiredSpacing * 100).toFixed(0) : '0');
  
  // 👈 Número máximo de varillas permitido por el espaciamiento mínimo
  const maxRodsBySpacing = Math.floor(perimeter / minRequiredSpacing);
  const rodsExceedLimit = numRods > maxRodsBySpacing;

  // Colores profesionales
  const colors = darkMode ? {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    grid: '#60a5fa',
    gridDark: '#3b82f6',
    gridHighlight: '#93c5fd',
    rods: '#34d399',
    rodsDark: '#10b981',
    rodsHighlight: '#6ee7b7',
    text: '#f3f4f6',
    textSecondary: '#9ca3af',
    border: '#334155',
    borderLight: '#475569',
    ground: '#a78bfa',
    groundDark: '#8b5cf6',
    shadow: 'rgba(0,0,0,0.3)',
    glow: 'rgba(96,165,250,0.3)',
    kit: getKitInfo().color,
    kitDark: '#6d28d9',
    measurementLine: '#fbbf24',
    warning: '#ef4444',
    warningBg: 'rgba(239, 68, 68, 0.2)',
    success: '#10b981',
    successBg: 'rgba(16, 185, 129, 0.2)'
  } : {
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    grid: '#2563eb',
    gridDark: '#1d4ed8',
    gridHighlight: '#3b82f6',
    rods: '#10b981',
    rodsDark: '#059669',
    rodsHighlight: '#34d399',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#cbd5e1',
    borderLight: '#e2e8f0',
    ground: '#8b5cf6',
    groundDark: '#7c3aed',
    shadow: 'rgba(0,0,0,0.1)',
    glow: 'rgba(37,99,235,0.2)',
    kit: getKitInfo().color,
    kitDark: '#6d28d9',
    measurementLine: '#f59e0b',
    warning: '#dc2626',
    warningBg: 'rgba(220, 38, 38, 0.1)',
    success: '#059669',
    successBg: 'rgba(5, 150, 105, 0.1)'
  };

  // Manejo de mouse
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMouse.x;
    const deltaY = e.clientY - lastMouse.y;
    
    if (e.shiftKey) {
      setPan(prev => ({
        x: prev.x + deltaX * 0.5,
        y: prev.y + deltaY * 0.5
      }));
    } else {
      setRotation(prev => ({
        x: Math.min(45, Math.max(-60, prev.x + deltaY * 0.5)),
        y: prev.y + deltaX * 0.5,
        z: prev.z
      }));
    }
    
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    // Solo prevenir si no es un evento pasivo
    if (e.cancelable) {
      e.preventDefault();
    }
    setZoom(prev => Math.min(2, Math.max(0.5, prev - e.deltaY * 0.005)));
  };

  // Vistas predefinidas
  const setView = (view) => {
    setSelectedView(view);
    switch(view) {
      case 'top':
        setRotation({ x: -90, y: 0, z: 0 });
        setZoom(1);
        break;
      case 'front':
        setRotation({ x: 0, y: 0, z: 0 });
        setZoom(1);
        break;
      case 'side':
        setRotation({ x: 0, y: -90, z: 0 });
        setZoom(1);
        break;
      case 'iso':
        setRotation({ x: -35, y: 45, z: 0 });
        setZoom(1);
        break;
      case 'perspective':
        setRotation({ x: -25, y: 35, z: 0 });
        setZoom(1);
        break;
      default:
        break;
    }
  };

  const resetView = () => {
    setRotation({ x: -25, y: 35, z: 0 });
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedView('perspective');
  };

  useEffect(() => {
    if (animationSpeed > 0) {
      animationRef.current = setInterval(() => {
        setRotation(prev => ({
          ...prev,
          y: prev.y + animationSpeed
        }));
      }, 50);
    } else if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [animationSpeed]);

  // Fix memory leak by creating styleSheet in useEffect
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      @keyframes pulse-border {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Generar cuadrícula de referencia en el suelo
  const generateGroundGrid = () => {
    if (!showGroundGrid) return null;
    
    const groundLines = [];
    const widthPercent = 90;
    const heightPercent = 80;
    
    for (let i = 0; i <= 10; i++) {
      const yPercent = (i / 10) * heightPercent;
      groundLines.push(
        <div
          key={`ground-h-${i}`}
          style={{
            position: 'absolute',
            left: '5%',
            top: `${10 + yPercent}%`,
            width: `${widthPercent}%`,
            height: '1px',
            background: `rgba(156, 163, 175, 0.3)`,
            borderTop: i % 2 === 0 ? 'none' : '1px dashed rgba(156, 163, 175, 0.2)',
            transform: 'translateZ(-60px)',
            pointerEvents: 'none'
          }}
        />
      );
    }
    
    for (let i = 0; i <= 10; i++) {
      const xPercent = (i / 10) * widthPercent;
      groundLines.push(
        <div
          key={`ground-v-${i}`}
          style={{
            position: 'absolute',
            left: `${5 + xPercent}%`,
            top: '10%',
            width: '1px',
            height: `${heightPercent}%`,
            background: `rgba(156, 163, 175, 0.3)`,
            borderLeft: i % 2 === 0 ? 'none' : '1px dashed rgba(156, 163, 175, 0.2)',
            transform: 'translateZ(-60px)',
            pointerEvents: 'none'
          }}
        />
      );
    }
    
    return groundLines;
  };

  // Generar líneas de medición en los ejes
  const generateMeasurementLines = () => {
    if (!showLabels) return null;
    
    const widthPercent = 90;
    const heightPercent = 80;
    
    return (
      <>
        <div
          style={{
            position: 'absolute',
            left: '5%',
            top: '5%',
            width: `${widthPercent}%`,
            height: '2px',
            background: colors.measurementLine,
            transform: 'translateZ(-20px)',
            opacity: 0.7
          }}
        >
          {[...Array(6)].map((_, i) => {
            const xPercent = (i / 5) * widthPercent;
            const value = (i / 5) * gridWidth;
            return (
              <div key={`mark-x-${i}`}>
                <div style={{ position: 'absolute', left: `${xPercent}%`, top: '-5px', width: '1px', height: '10px', background: colors.measurementLine }} />
                <div style={{ position: 'absolute', left: `${xPercent}%`, top: '-18px', fontSize: '8px', color: colors.textSecondary, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                  {isFinite(value) ? value.toFixed(1) : 'N/A'}m
                </div>
              </div>
            );
          })}
        </div>
        
        <div
          style={{
            position: 'absolute',
            left: '2%',
            top: '10%',
            width: '2px',
            height: `${heightPercent}%`,
            background: colors.measurementLine,
            transform: 'translateZ(-20px)',
            opacity: 0.7
          }}
        >
          {[...Array(6)].map((_, i) => {
            const yPercent = (i / 5) * heightPercent;
            const value = (i / 5) * gridLength;
            return (
              <div key={`mark-y-${i}`}>
                <div style={{ position: 'absolute', left: '-5px', top: `${yPercent}%`, width: '10px', height: '1px', background: colors.measurementLine }} />
                <div style={{ position: 'absolute', left: '-35px', top: `${yPercent}%`, fontSize: '8px', color: colors.textSecondary, transform: 'translateY(-50%)', whiteSpace: 'nowrap', textAlign: 'right' }}>
                  {isFinite(value) ? value.toFixed(1) : 'N/A'}m
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // 👈 NUEVO: Visualización del espaciamiento entre varillas con advertencia
  const generateRodSpacingVisualization = () => {
    if (!showRodSpacing || numRods === 0) return null;
    
    const rodPositions = [];
    let currentDistance = 0;
    
    for (let i = 0; i < Math.min(numRods, 40); i++) {
      let pos = currentDistance;
      let leftPercent = 0;
      let topPercent = 0;
      let side = '';
      
      if (pos < gridWidth) {
        leftPercent = (pos / gridWidth) * 90 + 5;
        topPercent = 92;
        side = 'bottom';
      } else if (pos < gridWidth + gridLength) {
        leftPercent = 97;
        topPercent = 90 - ((pos - gridWidth) / gridLength) * 80;
        side = 'right';
      } else if (pos < 2 * gridWidth + gridLength) {
        leftPercent = 95 - ((pos - (gridWidth + gridLength)) / gridWidth) * 90;
        topPercent = 8;
        side = 'top';
      } else {
        leftPercent = 3;
        topPercent = 10 + ((pos - (2 * gridWidth + gridLength)) / gridLength) * 80;
        side = 'left';
      }
      
      rodPositions.push({ leftPercent, topPercent, side, index: i });
      currentDistance += rodSpacing;
      if (currentDistance > perimeter) currentDistance -= perimeter;
    }
    
    const spacingLines = [];
    for (let i = 0; i < rodPositions.length - 1; i++) {
      const p1 = rodPositions[i];
      const p2 = rodPositions[i + 1];
      
      if (p1.side === p2.side) {
        const lineColor = spacingComplies ? colors.measurementLine : colors.warning;
        spacingLines.push(
          <div
            key={`spacing-${i}`}
            style={{
              position: 'absolute',
              left: `${Math.min(parseFloat(p1.leftPercent), parseFloat(p2.leftPercent))}%`,
              top: `${Math.min(parseFloat(p1.topPercent), parseFloat(p2.topPercent))}%`,
              width: `${Math.abs(parseFloat(p2.leftPercent) - parseFloat(p1.leftPercent))}%`,
              height: `${Math.abs(parseFloat(p2.topPercent) - parseFloat(p1.topPercent))}%`,
              borderTop: p1.side === 'top' || p1.side === 'bottom' ? `2px dashed ${lineColor}` : 'none',
              borderLeft: p1.side === 'left' || p1.side === 'right' ? `2px dashed ${lineColor}` : 'none',
              transform: p1.side === 'bottom' ? 'translateY(-20px)' : 'translateY(0)',
              pointerEvents: 'none',
              zIndex: 25
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: p1.side === 'top' ? '15px' : p1.side === 'bottom' ? '-15px' : '50%',
                transform: p1.side === 'left' || p1.side === 'right' ? 'translate(-50%, -50%)' : 'translateX(-50%)',
                fontSize: '7px',
                color: lineColor,
                background: darkMode ? '#1f2937' : '#fff',
                padding: '1px 3px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                fontWeight: spacingComplies ? 'normal' : 'bold'
              }}
            >
              {rodSpacingMeters}m {!spacingComplies && `⚠️ min:${isFinite(minRequiredSpacing) ? minRequiredSpacing.toFixed(1) : 'N/A'}m`}
            </div>
          </div>
        );
      }
    }
    
    return spacingLines;
  };

  // 👈 NUEVO: Advertencia visual de espaciamiento mínimo
  const generateMinSpacingWarningOverlay = () => {
    if (!spacingComplies && showMinSpacingWarning) {
      return (
        <div
          style={{
            position: 'absolute',
            left: '5%',
            top: '10%',
            width: '90%',
            height: '80%',
            border: `3px solid ${colors.warning}`,
            borderRadius: '4px',
            transform: 'translateZ(-5px)',
            opacity: 0.7,
            pointerEvents: 'none',
            animation: 'pulse-border 1.5s infinite',
            zIndex: 30
          }}
        />
      );
    }
    return null;
  };

  // Generar líneas de la malla 3D
  const generateGridLines = () => {
    const lines = [];
    const widthPercent = 90;
    const heightPercent = 80;
    
    for (let i = 0; i < ny; i++) {
      const yPercent = (i / (ny - 1)) * heightPercent;
      const isBorder = i === 0 || i === ny - 1;
      lines.push(
        <div
          key={`h-${i}`}
          className="grid-line"
          style={{
            position: 'absolute',
            left: '5%',
            top: `${10 + yPercent}%`,
            width: `${widthPercent}%`,
            height: isBorder ? '3px' : '2px',
            background: `linear-gradient(90deg, ${colors.gridDark}, ${colors.grid}, ${colors.gridDark})`,
            transform: 'translateZ(0)',
            boxShadow: isBorder ? `0 0 8px ${colors.glow}` : 'none',
            opacity: isBorder ? 1 : 0.7,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={() => setHoveredElement(`h-${i}`)}
          onMouseLeave={() => setHoveredElement(null)}
        />
      );
    }
    
    for (let i = 0; i < nx; i++) {
      const xPercent = (i / (nx - 1)) * widthPercent;
      const isBorder = i === 0 || i === nx - 1;
      lines.push(
        <div
          key={`v-${i}`}
          className="grid-line"
          style={{
            position: 'absolute',
            left: `${5 + xPercent}%`,
            top: '10%',
            width: isBorder ? '3px' : '2px',
            height: `${heightPercent}%`,
            background: `linear-gradient(180deg, ${colors.gridDark}, ${colors.grid}, ${colors.gridDark})`,
            transform: 'translateZ(0)',
            boxShadow: isBorder ? `0 0 8px ${colors.glow}` : 'none',
            opacity: isBorder ? 1 : 0.7,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={() => setHoveredElement(`v-${i}`)}
          onMouseLeave={() => setHoveredElement(null)}
        />
      );
    }
    
    return lines;
  };

  // Generar nodos de intersección
  const generateNodes = () => {
    if (!showGrid) return null;
    
    const nodes = [];
    const widthPercent = 90;
    const heightPercent = 80;
    
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const xPercent = (i / (nx - 1)) * widthPercent;
        const yPercent = (j / (ny - 1)) * heightPercent;
        const isBorder = i === 0 || i === nx - 1 || j === 0 || j === ny - 1;
        
        nodes.push(
          <div
            key={`node-${i}-${j}`}
            className="grid-node"
            style={{
              position: 'absolute',
              left: `${5 + xPercent}%`,
              top: `${10 + yPercent}%`,
              width: isBorder ? '8px' : '5px',
              height: isBorder ? '8px' : '5px',
              backgroundColor: isBorder ? colors.gridHighlight : colors.grid,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 10px ${colors.glow}`,
              opacity: 0.8,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={() => setHoveredElement(`node-${i}-${j}`)}
            onMouseLeave={() => setHoveredElement(null)}
          />
        );
      }
    }
    return nodes;
  };

  // 👈 MODIFICADO: Generar varillas con color de advertencia si no cumplen
  const generateRods = () => {
    if (!showRods) return null;
    
    const rods = [];
    const rodHeightPercent = Math.min(12, (rodLength / 5) * 10);
    let currentDistance = 0;
    
    for (let i = 0; i < Math.min(numRods, 40); i++) {
      let pos = currentDistance;
      let leftPercent = 0;
      let topPercent = 0;
      let side = '';
      
      if (pos < gridWidth) {
        leftPercent = (pos / gridWidth) * 90 + 5;
        topPercent = 90;
        side = 'bottom';
      } else if (pos < gridWidth + gridLength) {
        leftPercent = 95;
        topPercent = 90 - ((pos - gridWidth) / gridLength) * 80;
        side = 'right';
      } else if (pos < 2 * gridWidth + gridLength) {
        leftPercent = 95 - ((pos - (gridWidth + gridLength)) / gridWidth) * 90;
        topPercent = 10;
        side = 'top';
      } else {
        leftPercent = 5;
        topPercent = 10 + ((pos - (2 * gridWidth + gridLength)) / gridLength) * 80;
        side = 'left';
      }
      
      const isHovered = hoveredElement === `rod-${i}`;
      // 👈 Color rojo si no cumple con espaciamiento mínimo
      const rodColor = spacingComplies ? colors.rods : colors.warning;
      const rodDarkColor = spacingComplies ? colors.rodsDark : colors.warning;
      
      rods.push(
        <div
          key={`rod-${i}`}
          className="rod"
          style={{
            position: 'absolute',
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
            width: isHovered ? '6px' : '4px',
            height: `${rodHeightPercent}%`,
            background: `linear-gradient(180deg, ${rodColor}, ${rodDarkColor})`,
            transform: side === 'top' ? 'translateY(-100%)' : 'translateY(0)',
            borderRadius: '3px',
            boxShadow: isHovered ? `0 0 15px ${rodColor}` : `0 0 5px ${rodDarkColor}`,
            zIndex: 10,
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={() => setHoveredElement(`rod-${i}`)}
          onMouseLeave={() => setHoveredElement(null)}
        >
          {isHovered && (
            <div
              style={{
                position: 'absolute',
                left: side === 'right' ? '-80px' : '10px',
                top: '-30px',
                backgroundColor: spacingComplies ? colors.border : colors.warning,
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                whiteSpace: 'nowrap',
                zIndex: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              <div>📏 Varilla {rodLength}m</div>
              <div>Espaciamiento: {rodSpacingMeters}m</div>
              {!spacingComplies && (
                <div style={{ color: '#ffcccc' }}>
                  ⚠️ Mínimo requerido: {isFinite(minRequiredSpacing) ? minRequiredSpacing.toFixed(2) : 'N/A'}m
                </div>
              )}
              {rodsExceedLimit && (
                <div style={{ color: '#ffcccc' }}>
                  ⚠️ Máximo varillas: {maxRodsBySpacing}
                </div>
              )}
            </div>
          )}
        </div>
      );
      
      currentDistance += rodSpacing;
      if (currentDistance > perimeter) currentDistance -= perimeter;
    }
    
    return rods;
  };

  // Generar Kit Master en 3D
  const generateKitMaster3D = () => {
    if (!showKitMaster) return null;
    
    const kitX = gridWidth / 2 + 2;
    const kitZ = -gridLength / 2 - 1.5;
    const isHovered = hoveredElement === 'kit';
    
    return (
      <div
        key="kit-3d"
        style={{
          position: 'absolute',
          left: `${55 + (kitX / (gridWidth + 3)) * 40}%`,
          top: `${45 - (kitZ / (gridLength + 2)) * 40}%`,
          width: '70px',
          height: '55px',
          backgroundColor: colors.kit,
          borderRadius: '8px',
          border: `2px solid ${colors.kitDark}`,
          boxShadow: isHovered ? '0 8px 20px rgba(0,0,0,0.3)' : '0 4px 10px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          transition: 'all 0.2s ease',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          cursor: 'pointer'
        }}
        onMouseEnter={() => setHoveredElement('kit')}
        onMouseLeave={() => setHoveredElement(null)}
      >
        <div
          style={{
            position: 'absolute',
            top: '5px',
            right: '8px',
            width: '8px',
            height: '8px',
            backgroundColor: '#22c55e',
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }}
        />
        
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>KIT</div>
        <div style={{ fontSize: '10px', color: '#fff' }}>MASTER</div>
        <div style={{ fontSize: '9px', color: '#e9d5ff', marginTop: '4px', fontWeight: 'bold' }}>
          {kitInfo.name.split('-')[1]}
        </div>
        <div style={{ fontSize: '7px', color: '#e9d5ff', marginTop: '2px' }}>{kitInfo.capacity}</div>
        
        <div
          style={{
            position: 'absolute',
            left: '-30px',
            top: '22px',
            width: '30px',
            height: '2px',
            background: `repeating-linear-gradient(90deg, #f59e0b, #f59e0b 5px, transparent 5px, transparent 10px)`
          }}
        />
        
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              top: '-35px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#1f2937',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              zIndex: 30,
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}
          >
            ⚡ {kitInfo.name} - Electrodo Magnetoactivo
          </div>
        )}
      </div>
    );
  };

  // Indicadores de profundidad con representación 3D
  const generateDepthIndicators = () => {
    if (!showDepthLines || !gridDepth) return null;
    
    const depthLevels = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0];
    
    return (
      <>
        <div
          style={{
            position: 'absolute',
            left: '2%',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            zIndex: 15
          }}
        >
          <div
            style={{
              width: '3px',
              height: `${Math.min(gridDepth * 50, 100)}px`,
              background: `linear-gradient(180deg, ${colors.ground}, ${colors.groundDark})`,
              borderLeft: `2px solid ${colors.ground}`,
              position: 'relative',
              borderRadius: '2px'
            }}
          >
            {depthLevels.map(level => {
              if (level <= gridDepth) {
                return (
                  <div
                    key={`depth-mark-${level}`}
                    style={{
                      position: 'absolute',
                      left: '8px',
                      top: `${(level / gridDepth) * 100}%`,
                      width: '20px',
                      height: '1px',
                      background: colors.ground,
                      opacity: 0.6
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: '22px',
                        top: '-4px',
                        fontSize: '8px',
                        color: colors.ground,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isFinite(level) ? level.toFixed(1) : 'N/A'}m
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
          <div style={{ fontSize: '10px', color: colors.textSecondary, fontWeight: 'bold' }}>
            Profundidad: {isFinite(gridDepth) ? gridDepth.toFixed(1) : 'N/A'}m
          </div>
        </div>
        
        <div
          style={{
            position: 'absolute',
            left: '5%',
            top: '10%',
            width: '90%',
            height: '80%',
            transform: `translateZ(${-gridDepth * 15}px)`,
            background: `linear-gradient(180deg, ${colors.ground}11, ${colors.ground}33)`,
            border: `1px dashed ${colors.ground}`,
            borderRadius: '4px',
            opacity: 0.4,
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '10px',
              top: '10px',
              fontSize: '9px',
              color: colors.ground,
              background: darkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
          >
            🌍 Nivel de tierra firme
          </div>
        </div>
      </>
    );
  };

  // Generar etiquetas de ejes con mediciones
  const generateAxisLabels = () => {
    if (!showLabels) return null;
    
    return (
      <>
        <div
          style={{
            position: 'absolute',
            bottom: '2%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '11px',
            color: colors.textSecondary,
            backgroundColor: `${colors.border}80`,
            padding: '2px 8px',
            borderRadius: '12px',
            backdropFilter: 'blur(4px)',
            zIndex: 15
          }}
        >
          X: {isFinite(gridWidth) ? gridWidth.toFixed(1) : 'N/A'} m | Espaciamiento: {isFinite(spacingX) ? spacingX.toFixed(2) : 'N/A'} m
        </div>
        
        <div
          style={{
            position: 'absolute',
            left: '2%',
            bottom: '50%',
            transform: 'translateY(50%) rotate(-90deg)',
            fontSize: '11px',
            color: colors.textSecondary,
            backgroundColor: `${colors.border}80`,
            padding: '2px 8px',
            borderRadius: '12px',
            backdropFilter: 'blur(4px)',
            whiteSpace: 'nowrap',
            zIndex: 15
          }}
        >
          Y: {isFinite(gridLength) ? gridLength.toFixed(1) : 'N/A'} m | Espaciamiento: {isFinite(spacingY) ? spacingY.toFixed(2) : 'N/A'} m
        </div>
        
        <div
          style={{
            position: 'absolute',
            right: '2%',
            bottom: '50%',
            transform: 'translateY(50%)',
            fontSize: '11px',
            color: colors.textSecondary,
            backgroundColor: `${colors.border}80`,
            padding: '2px 8px',
            borderRadius: '12px',
            backdropFilter: 'blur(4px)',
            zIndex: 15
          }}
        >
          Z: {isFinite(gridDepth) ? gridDepth.toFixed(1) : 'N/A'} m
        </div>
      </>
    );
  };

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          🎮 Visualización 3D Interactiva
        </h3>
        <button
          onClick={() => setShowControls(!showControls)}
          className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          title="Mostrar/Ocultar controles"
        >
          <Settings size={16} />
        </button>
      </div>

      {showControls && (
        <div className={`mb-3 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} text-sm`}>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2 mb-2">
            <div className="flex items-center gap-1">
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="w-3 h-3" />
              <span className="text-xs">Mostrar Malla</span>
            </div>
            <div className="flex items-center gap-1">
              <input type="checkbox" checked={showRods} onChange={(e) => setShowRods(e.target.checked)} className="w-3 h-3" />
              <span className="text-xs">Mostrar Varillas</span>
            </div>
            <div className="flex items-center gap-1">
              <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} className="w-3 h-3" />
              <span className="text-xs">Mostrar Etiquetas</span>
            </div>
            <div className="flex items-center gap-1">
              <input type="checkbox" checked={showDepthLines} onChange={(e) => setShowDepthLines(e.target.checked)} className="w-3 h-3" />
              <span className="text-xs">Mostrar Profundidad</span>
            </div>
            <div className="flex items-center gap-1">
              <input type="checkbox" checked={showKitMaster} onChange={(e) => setShowKitMaster(e.target.checked)} className="w-3 h-3" />
              <span className="text-xs">🟣 Kit Master</span>
            </div>
            <div className="flex items-center gap-1">
              <input type="checkbox" checked={showGroundGrid} onChange={(e) => setShowGroundGrid(e.target.checked)} className="w-3 h-3" />
              <span className="text-xs">📐 Cuadrícula Suelo</span>
            </div>
            <div className="flex items-center gap-1">
              <input type="checkbox" checked={showRodSpacing} onChange={(e) => setShowRodSpacing(e.target.checked)} className="w-3 h-3" />
              <span className="text-xs">📏 Espaciamiento Varillas</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <div className="flex gap-1">
              <button onClick={() => setView('top')} className={`px-2 py-1 text-xs rounded ${selectedView === 'top' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>Vista Superior</button>
              <button onClick={() => setView('front')} className={`px-2 py-1 text-xs rounded ${selectedView === 'front' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>Frontal</button>
              <button onClick={() => setView('side')} className={`px-2 py-1 text-xs rounded ${selectedView === 'side' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>Lateral</button>
              <button onClick={() => setView('iso')} className={`px-2 py-1 text-xs rounded ${selectedView === 'iso' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>Isométrica</button>
            </div>
            
            <div className="flex gap-1">
              <button onClick={() => setZoom(prev => Math.min(2, prev + 0.1))} className={`p-1 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}><ZoomIn size={14} /></button>
              <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))} className={`p-1 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}><ZoomOut size={14} /></button>
              <button onClick={resetView} className={`p-1 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}><RotateCcw size={14} /></button>
              <div className="w-px h-4 bg-gray-500 mx-1" />
              <div className="flex items-center gap-1">
                <span className="text-xs">Animación:</span>
                <input type="range" min="-2" max="2" step="0.2" value={animationSpeed} onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))} className="w-20 h-1" />
                <span className="text-xs w-8">{animationSpeed !== 0 ? `${Math.abs(animationSpeed)}°` : 'Off'}</span>
              </div>
              <button onClick={() => setShowAdvancedControls(!showAdvancedControls)} className={`p-1 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`} title="Controles avanzados"><Sliders size={14} /></button>
            </div>
          </div>

          {showAdvancedControls && (
            <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} space-y-2`}>
              <div className="flex items-center gap-2">
                <span className="text-xs w-16">Opacidad Malla:</span>
                <input type="range" min="0.1" max="1" step="0.1" value={gridOpacity} onChange={(e) => setGridOpacity(parseFloat(e.target.value))} className="w-24 h-1" />
                <span className="text-xs w-8">{Math.round(gridOpacity * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-16">Opacidad Varillas:</span>
                <input type="range" min="0.1" max="1" step="0.1" value={rodsOpacity} onChange={(e) => setRodsOpacity(parseFloat(e.target.value))} className="w-24 h-1" />
                <span className="text-xs w-8">{Math.round(rodsOpacity * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-16">Tamaño Nodos:</span>
                <input type="range" min="3" max="12" step="1" value={nodeSize} onChange={(e) => setNodeSize(parseInt(e.target.value))} className="w-24 h-1" />
                <span className="text-xs w-8">{nodeSize}px</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={voltageVisualization} onChange={(e) => setVoltageVisualization(e.target.checked)} className="w-3 h-3" />
                <span className="text-xs">Visualizar Tensiones (Colores por gradiente)</span>
              </div>
            </div>
          )}
          
          <div className={`mt-2 text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>
            💡 <strong>Controles:</strong> Arrastra para rotar | Shift + Arrastra para mover | Scroll para zoom
            {!showKitMaster && <span className="ml-2 text-purple-500">🔘 Kit Master desactivado</span>}
            {showRodSpacing && numRods > 0 && (
              <span className={`ml-2 ${spacingComplies ? 'text-green-500' : 'text-red-500'}`}>
                📏 Espaciamiento varillas: {rodSpacingMeters}m 
                {!spacingComplies && ` (mínimo: ${isFinite(minRequiredSpacing) ? minRequiredSpacing.toFixed(2) : 'N/A'}m)`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 👈 ADVERTENCIA DE ESPACIAMIENTO MÍNIMO */}
      {!spacingComplies && showMinSpacingWarning && (
        <div className={`mb-3 p-3 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-50'} border-l-4 border-red-500`}>
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-700 dark:text-red-400">
                ⚠️ Espaciamiento insuficiente entre electrodos (varillas)
              </div>
              <div className="text-xs text-red-600 dark:text-red-300">
                Según <strong>NMX-J-549-ANCE-2005</strong>, la distancia mínima entre electrodos debe ser <strong>2 × longitud de varilla</strong> = {isFinite(minRequiredSpacing) ? minRequiredSpacing.toFixed(2) : 'N/A'}m.
                <br />
                Espaciamiento actual: <strong>{rodSpacingMeters}m</strong> ({compliancePercent}% del mínimo).
                {rodsExceedLimit && (
                  <span> Se recomienda reducir el número de varillas a máximo <strong>{maxRodsBySpacing}</strong>.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative cursor-grab active:cursor-grabbing overflow-hidden rounded-lg"
        style={{
          width: '100%',
          height: '450px',
          background: colors.background,
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: `translate(${pan.x}px, ${pan.y}px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          {generateGroundGrid()}
          {generateMeasurementLines()}
          {generateRodSpacingVisualization()}
          {generateMinSpacingWarningOverlay()}
          
          <div
            style={{
              position: 'absolute',
              width: '90%',
              height: '80%',
              left: '5%',
              top: '10%',
              background: `radial-gradient(circle at center, ${colors.grid}11, ${colors.grid}22)`,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              transform: 'translateZ(-40px)',
              opacity: 0.5
            }}
          />
          
          <div
            style={{
              position: 'absolute',
              width: '90%',
              height: '80%',
              left: '5%',
              top: '10%',
              transform: `translateZ(${gridDepth * 20}px)`,
              border: wireframeMode ? 'none' : `2px solid ${colors.borderLight}`,
              borderRadius: '4px',
              background: `linear-gradient(135deg, ${colors.grid}08, ${colors.grid}22)`,
              backdropFilter: wireframeMode ? 'none' : 'blur(1px)'
            }}
          >
            {showGrid && generateGridLines()}
            {generateNodes()}
            {generateRods()}
          </div>
          
          {generateKitMaster3D()}
          {generateDepthIndicators()}
          {generateAxisLabels()}
          
          {hoveredElement && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                boxShadow: `inset 0 0 50px ${colors.glow}`,
                borderRadius: '8px'
              }}
            />
          )}
        </div>
      </div>
      
      <div className={`mt-3 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow-sm`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-blue-50'}`}>
            <div className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Rotación X</div>
            <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{isFinite(rotation.x) ? rotation.x.toFixed(0) : 'N/A'}°</div>
          </div>
          <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-green-50'}`}>
            <div className={`font-semibold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Rotación Y</div>
            <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{isFinite(rotation.y) ? rotation.y.toFixed(0) : 'N/A'}°</div>
          </div>
          <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-purple-50'}`}>
            <div className={`font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>Zoom</div>
            <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{isFinite(zoom) ? zoom.toFixed(1) : 'N/A'}x</div>
          </div>
          <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-orange-50'}`}>
            <div className={`font-semibold ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>Vista</div>
            <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {selectedView === 'perspective' ? 'Perspectiva' : 
               selectedView === 'top' ? 'Superior' :
               selectedView === 'front' ? 'Frontal' :
               selectedView === 'side' ? 'Lateral' : 'Isométrica'}
            </div>
          </div>
        </div>
        
        <div className={`text-center text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-2`}>
          📐 Malla: {nx}×{ny} conductores | Espaciamiento X: {isFinite(spacingX) ? spacingX.toFixed(2) : 'N/A'}m | Espaciamiento Y: {isFinite(spacingY) ? spacingY.toFixed(2) : 'N/A'}m
          | Profundidad: {isFinite(gridDepth) ? gridDepth.toFixed(1) : 'N/A'}m | Varillas: {numRods} × {isFinite(rodLength) ? rodLength : 'N/A'}m
          | <span className={spacingComplies ? 'text-green-600' : 'text-red-600 font-semibold'}>
              Espaciamiento varillas: {rodSpacingMeters}m
              {!spacingComplies && ` (mínimo: ${isFinite(minRequiredSpacing) ? minRequiredSpacing.toFixed(2) : 'N/A'}m)`}
            </span>
          {showKitMaster && ` | 🟣 Kit: ${kitInfo.name} (${kitInfo.capacity})`}
        </div>
        
        <div className="text-center text-xs text-gray-300 mt-1">
          💡 Pasa el mouse sobre elementos para resaltarlos | Shift + arrastrar para mover la vista
          {!spacingComplies && " | ⚠️ Espaciamiento entre varillas NO cumple NMX-J-549"}
          {showKitMaster && " | El Kit Master solo afecta respuesta a impulso (rayos)"}
        </div>
      </div>
    </div>
  );
};

export default GroundingGrid3D;