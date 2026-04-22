import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Undo, Redo, Save, ZoomIn, ZoomOut, Grid, Square, Circle, Line, Layers, Trash2, MousePointer } from 'lucide-react';

const DXFEditor = ({ darkMode, onSave, initialData = null }) => {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('select');
  const [entities, setEntities] = useState(initialData?.entities || []);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showGrid, setShowGrid] = useState(true);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    renderCanvas(ctx);
  }, [entities, scale, pan, showGrid]);

  const renderCanvas = (ctx) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = darkMode ? '#1e293b' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(scale, scale);

    // Draw grid
    if (showGrid) {
      drawGrid(ctx, width, height);
    }

    // Draw entities
    entities.forEach((entity, index) => {
      ctx.strokeStyle = entity.layer === 'GRID' ? '#3b82f6' : 
                      entity.layer === 'RODS' ? '#ef4444' : 
                      entity.layer === 'CONTOURS' ? '#22c55e' : '#000000';
      ctx.lineWidth = entity.layer === 'GRID' ? 2 : 1;
      
      if (entity.selected) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
      }

      if (entity.type === 'LINE') {
        ctx.beginPath();
        ctx.moveTo(entity.x1, entity.y1);
        ctx.lineTo(entity.x2, entity.y2);
        ctx.stroke();
      } else if (entity.type === 'CIRCLE') {
        ctx.beginPath();
        ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (entity.type === 'RECT') {
        ctx.strokeRect(entity.x, entity.y, entity.width, entity.height);
      }
    });

    // Draw current drawing
    if (isDrawing && startPoint && currentPoint) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      if (currentTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
      } else if (currentTool === 'rect') {
        ctx.strokeRect(startPoint.x, startPoint.y, currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
      } else if (currentTool === 'circle') {
        const radius = Math.sqrt(Math.pow(currentPoint.x - startPoint.x, 2) + Math.pow(currentPoint.y - startPoint.y, 2));
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
    }

    ctx.restore();
  };

  const drawGrid = (ctx, width, height) => {
    ctx.strokeStyle = darkMode ? '#334155' : '#e2e8f0';
    ctx.lineWidth = 0.5;
    
    const gridSize = Math.max(1, 50 * scale);
    const offsetX = pan.x % gridSize;
    const offsetY = pan.y % gridSize;

    for (let x = offsetX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = offsetY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleSafe = Math.max(0.1, scale);
    const x = (e.clientX - rect.left - pan.x) / scaleSafe;
    const y = (e.clientY - rect.top - pan.y) / scaleSafe;

    if (currentTool === 'select') {
      // Check if clicking on an entity
      const clicked = entities.find(entity => {
        if (entity.type === 'LINE') {
          return isPointNearLine(x, y, entity.x1, entity.y1, entity.x2, entity.y2);
        } else if (entity.type === 'CIRCLE') {
          const dist = Math.sqrt((x - entity.x) ** 2 + (y - entity.y) ** 2);
          return dist <= entity.radius;
        }
        return false;
      });

      if (clicked) {
        setSelectedEntity(clicked);
        setEntities(entities.map(e => ({ ...e, selected: e === clicked })));
      } else {
        setIsPanning(true);
        setSelectedEntity(null);
        setEntities(entities.map(e => ({ ...e, selected: false })));
      }
    } else if (['line', 'rect', 'circle'].includes(currentTool)) {
      setIsDrawing(true);
      setStartPoint({ x, y });
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleSafe = Math.max(0.1, scale);
    const x = (e.clientX - rect.left - pan.x) / scaleSafe;
    const y = (e.clientY - rect.top - pan.y) / scaleSafe;

    if (isPanning) {
      setPan({ x: pan.x + e.movementX, y: pan.y + e.movementY });
    } else if (isDrawing) {
      setCurrentPoint({ x, y });
    }
  };

  const handleMouseUp = (e) => {
    if (isPanning) {
      setIsPanning(false);
    } else if (isDrawing && startPoint) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleSafe = Math.max(0.1, scale);
      const x = (e.clientX - rect.left - pan.x) / scaleSafe;
      const y = (e.clientY - rect.top - pan.y) / scaleSafe;

      let newEntity = null;
      
      if (currentTool === 'line') {
        newEntity = {
          type: 'LINE',
          layer: 'GRID',
          x1: startPoint.x,
          y1: startPoint.y,
          x2: x,
          y2: y,
          selected: false
        };
      } else if (currentTool === 'rect') {
        newEntity = {
          type: 'RECT',
          layer: 'GRID',
          x: startPoint.x,
          y: startPoint.y,
          width: x - startPoint.x,
          height: y - startPoint.y,
          selected: false
        };
      } else if (currentTool === 'circle') {
        const radius = Math.sqrt((x - startPoint.x) ** 2 + (y - startPoint.y) ** 2);
        newEntity = {
          type: 'CIRCLE',
          layer: 'RODS',
          x: startPoint.x,
          y: startPoint.y,
          radius,
          selected: false
        };
      }

      if (newEntity) {
        const newEntities = [...entities, newEntity];
        setEntities(newEntities);
        addToHistory(newEntities);
      }

      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoint(null);
    }
  };

  const isPointNearLine = (px, py, x1, y1, x2, y2, tolerance = 5) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (Math.abs(lenSq) > 1e-10) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy) < tolerance;
  };

  const addToHistory = (newEntities) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newEntities]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setEntities([...history[historyIndex - 1]]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setEntities([...history[historyIndex + 1]]);
    }
  };

  const handleDelete = () => {
    if (selectedEntity) {
      const newEntities = entities.filter(e => e !== selectedEntity);
      setEntities(newEntities);
      setSelectedEntity(null);
      addToHistory(newEntities);
    }
  };

  const handleZoomIn = () => setScale(s => Math.min(5, Math.max(0.1, s) * 1.2));
  const handleZoomOut = () => setScale(s => Math.max(0.1, Math.max(0.1, s) / 1.2));
  const handleResetView = () => { setScale(1); setPan({ x: 0, y: 0 }); };

  const handleSave = () => {
    if (onSave) {
      onSave({ entities, bounds: calculateBounds(entities) });
    }
  };

  const calculateBounds = (ents) => {
    if (ents.length === 0) return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    ents.forEach(e => {
      if (e.type === 'LINE') {
        minX = Math.min(minX, e.x1, e.x2);
        maxX = Math.max(maxX, e.x1, e.x2);
        minY = Math.min(minY, e.y1, e.y2);
        maxY = Math.max(maxY, e.y1, e.y2);
      } else if (e.type === 'CIRCLE') {
        minX = Math.min(minX, e.x - e.radius);
        maxX = Math.max(maxX, e.x + e.radius);
        minY = Math.min(minY, e.y - e.radius);
        maxY = Math.max(maxY, e.y + e.radius);
      } else if (e.type === 'RECT') {
        minX = Math.min(minX, e.x, e.x + e.width);
        maxX = Math.max(maxX, e.x, e.x + e.width);
        minY = Math.min(minY, e.y, e.y + e.height);
        maxY = Math.max(maxY, e.y, e.y + e.height);
      }
    });
    
    return { minX, maxX, minY, maxY };
  };

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Toolbar */}
      <div className={`p-2 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'}`}>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tools */}
          <div className="flex gap-1 border-r pr-2">
            <button
              onClick={() => setCurrentTool('select')}
              className={`p-2 rounded ${currentTool === 'select' ? 'bg-blue-600 text-white' : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              title="Seleccionar"
            >
              <MousePointer size={18} />
            </button>
            <button
              onClick={() => setCurrentTool('line')}
              className={`p-2 rounded ${currentTool === 'line' ? 'bg-blue-600 text-white' : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              title="Línea"
            >
              <Line size={18} />
            </button>
            <button
              onClick={() => setCurrentTool('rect')}
              className={`p-2 rounded ${currentTool === 'rect' ? 'bg-blue-600 text-white' : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              title="Rectángulo"
            >
              <Square size={18} />
            </button>
            <button
              onClick={() => setCurrentTool('circle')}
              className={`p-2 rounded ${currentTool === 'circle' ? 'bg-blue-600 text-white' : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              title="Círculo"
            >
              <Circle size={18} />
            </button>
          </div>

          {/* View controls */}
          <div className="flex gap-1 border-r pr-2">
            <button onClick={handleZoomIn} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Zoom In">
              <ZoomIn size={18} />
            </button>
            <button onClick={handleZoomOut} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Zoom Out">
              <ZoomOut size={18} />
            </button>
            <button onClick={handleResetView} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Reset View">
              <Grid size={18} />
            </button>
          </div>

          {/* History */}
          <div className="flex gap-1 border-r pr-2">
            <button onClick={handleUndo} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Deshacer">
              <Undo size={18} />
            </button>
            <button onClick={handleRedo} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Rehacer">
              <Redo size={18} />
            </button>
          </div>

          {/* Layer */}
          <div className="flex gap-1 border-r pr-2">
            <button className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Capas">
              <Layers size={18} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            <button onClick={handleDelete} className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600" title="Eliminar">
              <Trash2 size={18} />
            </button>
            <button onClick={handleSave} className="p-2 rounded hover:bg-green-100 dark:hover:bg-green-900 text-green-600" title="Guardar">
              <Save size={18} />
            </button>
          </div>

          {/* Toggle grid */}
          <div className="ml-auto">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded ${showGrid ? 'bg-blue-600 text-white' : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              title="Mostrar Grid"
            >
              <Grid size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {/* Info overlay */}
        <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs ${darkMode ? 'bg-black/70 text-white' : 'bg-white/70 text-black'}`}>
          Zoom: {(scale * 100).toFixed(0)}% | Entidades: {entities.length} | Herramienta: {currentTool}
        </div>
      </div>
    </div>
  );
};

export default DXFEditor;
