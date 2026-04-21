import React, { useState, useMemo } from 'react';
import { localToUTM, utmToLocal, PUERTO_VALLARTA_UTM } from '../core/geoSpatialEngine';
import { ZoomIn, ZoomOut, RotateCw, Ruler, MapPin } from 'lucide-react';

const GroundingGridSVG = ({ params, darkMode, dxfData = null }) => {
  if (!params || typeof params !== 'object') {
    return <div className="p-4">Cargando...</div>;
  }

  const [hoveredRod, setHoveredRod] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showScale, setShowScale] = useState(true);
  const [showCoordinates, setShowCoordinates] = useState(false);

  const {
    gridLength = 30,
    gridWidth = 16,
    numParallel = 15,
    numParallelY,
    numRods = 45,
    rodLength = 3,
    gridDepth = 0.6,
    transformerKVA = 75,
    projectLocation = 'Puerto Vallarta'
  } = params;

  // 🔹 Derivados seguros
  const nx = Math.max(2, numParallel);
  const ny = Math.max(2, numParallelY || Math.floor((numParallel * gridLength) / gridWidth));

  const svgWidth = 800;
  const svgHeight = 600;
  const padding = 60;

  // Real-world scaling (meters to pixels)
  const pixelsPerMeter = useMemo(() => {
    const scaleX = (svgWidth - padding * 2) / gridWidth;
    const scaleY = (svgHeight - padding * 2) / gridLength;
    return Math.min(scaleX, scaleY);
  }, [gridWidth, gridLength]);

  const actualWidth = gridWidth * pixelsPerMeter;
  const actualHeight = gridLength * pixelsPerMeter;

  const offsetX = (svgWidth - actualWidth) / 2;
  const offsetY = (svgHeight - actualHeight) / 2;

  // UTM origin (default to Puerto Vallarta)
  const utmOrigin = useMemo(() => {
    return projectLocation.toLowerCase().includes('vallarta') 
      ? PUERTO_VALLARTA_UTM.utm
      : { zone: 14, easting: 500000, northing: 2200000, hemisphere: 'N' };
  }, [projectLocation]);

  // Convert local to UTM
  const getUTMCoordinates = (x, y) => {
    return localToUTM(x, y, utmOrigin, rotation);
  };

  // 🔹 Generación optimizada de líneas con coordenadas reales
  const horizontalLines = useMemo(() => {
    const spacing = actualHeight / (ny - 1);
    return Array.from({ length: ny }, (_, i) => {
      const y = offsetY + i * spacing;
      const realY = (i / (ny - 1)) * gridLength;
      
      // Get UTM coordinates for this line
      const utmStart = getUTMCoordinates(0, realY);
      const utmEnd = getUTMCoordinates(gridWidth, realY);
      
      return (
        <line
          key={`h-${i}`}
          x1={offsetX}
          y1={y}
          x2={offsetX + actualWidth}
          y2={y}
          stroke={darkMode ? '#60a5fa' : '#3b82f6'}
          strokeWidth={i === 0 || i === ny - 1 ? 3 : 1.5}
          data-utm-start={`${utmStart.easting.toFixed(1)}, ${utmStart.northing.toFixed(1)}`}
          data-utm-end={`${utmEnd.easting.toFixed(1)}, ${utmEnd.northing.toFixed(1)}`}
        />
      );
    });
  }, [ny, actualHeight, offsetX, gridLength, gridWidth, utmOrigin, rotation, darkMode]);

  const verticalLines = useMemo(() => {
    const spacing = actualWidth / (nx - 1);
    return Array.from({ length: nx }, (_, i) => {
      const x = offsetX + i * spacing;
      const realX = (i / (nx - 1)) * gridWidth;
      
      // Get UTM coordinates for this line
      const utmStart = getUTMCoordinates(realX, 0);
      const utmEnd = getUTMCoordinates(realX, gridLength);
      
      return (
        <line
          key={`v-${i}`}
          x1={x}
          y1={offsetY}
          x2={x}
          y2={offsetY + actualHeight}
          stroke={darkMode ? '#3b82f6' : '#2563eb'}
          strokeWidth={i === 0 || i === nx - 1 ? 3 : 1.5}
          data-utm-start={`${utmStart.easting.toFixed(1)}, ${utmStart.northing.toFixed(1)}`}
          data-utm-end={`${utmEnd.easting.toFixed(1)}, ${utmEnd.northing.toFixed(1)}`}
        />
      );
    });
  }, [nx, actualWidth, offsetX, gridWidth, gridLength, utmOrigin, rotation, darkMode]);

  // 🔹 Varillas con posición real
  const rods = useMemo(() => {
    const rodsArray = [];
    const perSide = Math.ceil(numRods / 4);

    for (let i = 0; i < perSide; i++) {
      const t = i / (perSide - 1);

      // Bottom
      const realX1 = t * gridWidth;
      const realY1 = gridLength;
      rodsArray.push({
        x: offsetX + realX1 * pixelsPerMeter,
        y: offsetY + realY1 * pixelsPerMeter,
        realX: realX1,
        realY: realY1,
        utm: getUTMCoordinates(realX1, realY1)
      });

      // Top
      const realX2 = t * gridWidth;
      const realY2 = 0;
      rodsArray.push({
        x: offsetX + realX2 * pixelsPerMeter,
        y: offsetY + realY2 * pixelsPerMeter,
        realX: realX2,
        realY: realY2,
        utm: getUTMCoordinates(realX2, realY2)
      });

      // Left
      const realX3 = 0;
      const realY3 = t * gridLength;
      rodsArray.push({
        x: offsetX + realX3 * pixelsPerMeter,
        y: offsetY + realY3 * pixelsPerMeter,
        realX: realX3,
        realY: realY3,
        utm: getUTMCoordinates(realX3, realY3)
      });

      // Right
      const realX4 = gridWidth;
      const realY4 = t * gridLength;
      rodsArray.push({
        x: offsetX + realX4 * pixelsPerMeter,
        y: offsetY + realY4 * pixelsPerMeter,
        realX: realX4,
        realY: realY4,
        utm: getUTMCoordinates(realX4, realY4)
      });
    }

    return rodsArray.slice(0, numRods);
  }, [numRods, gridWidth, gridLength, pixelsPerMeter, offsetX, offsetY, utmOrigin, rotation]);

  // Render DXF entities if imported
  const renderDXFEntities = () => {
    if (!dxfData || !dxfData.conductors) return null;
    
    return dxfData.conductors.map((cond, i) => {
      const fromNode = dxfData.nodes?.[cond.from];
      const toNode = dxfData.nodes?.[cond.to];
      
      if (!fromNode || !toNode) return null;
      
      // Convert to SVG coordinates
      const x1 = offsetX + fromNode.x * pixelsPerMeter;
      const y1 = offsetY + fromNode.y * pixelsPerMeter;
      const x2 = offsetX + toNode.x * pixelsPerMeter;
      const y2 = offsetY + toNode.y * pixelsPerMeter;
      
      return (
        <line
          key={`dxf-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#10b981"
          strokeWidth={2}
          strokeDasharray="5,5"
        />
      );
    });
  };

  // Scale bar length in meters
  const scaleBarLength = 10; // 10 meters
  const scaleBarPixels = scaleBarLength * pixelsPerMeter;

  return (
    <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button 
            onClick={() => setZoom(z => Math.min(z + 0.2, 3))}
            className={`p-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button 
            onClick={() => setZoom(z => Math.max(z - 0.2, 0.3))}
            className={`p-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <button 
            onClick={() => setRotation(r => (r + 90) % 360)}
            className={`p-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            title="Rotate 90°"
          >
            <RotateCw size={18} />
          </button>
          <button 
            onClick={() => setShowScale(!showScale)}
            className={`p-2 rounded ${showScale ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            title="Toggle Scale"
          >
            <Ruler size={18} />
          </button>
          <button 
            onClick={() => setShowCoordinates(!showCoordinates)}
            className={`p-2 rounded ${showCoordinates ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            title="Toggle Coordinates"
          >
            <MapPin size={18} />
          </button>
        </div>
        
        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Zoom: {(zoom * 100).toFixed(0)}% | Rotación: {rotation}°
        </div>
      </div>

      <div className="relative">
        <svg
          width={svgWidth * zoom}
          height={svgHeight * zoom}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ background: darkMode ? '#1e293b' : '#ffffff' }}
          className="border border-gray-300 dark:border-gray-600 rounded"
        >
          {/* Grid lines */}
          {horizontalLines}
          {verticalLines}
          
          {/* DXF entities overlay */}
          {renderDXFEntities()}

          {/* 🔹 Varillas */}
          {rods.map((rod, i) => (
            <g key={i}>
              <line
                x1={rod.x}
                y1={rod.y}
                x2={rod.x}
                y2={rod.y + 20}
                stroke={hoveredRod === i ? '#34d399' : '#059669'}
                strokeWidth={4}
                onMouseEnter={() => setHoveredRod(i)}
                onMouseLeave={() => setHoveredRod(null)}
              />
              {showCoordinates && hoveredRod === i && (
                <text
                  x={rod.x + 5}
                  y={rod.y - 5}
                  fontSize="10"
                  fill={darkMode ? '#fff' : '#000'}
                >
                  {rod.utm.easting.toFixed(1)}, {rod.utm.northing.toFixed(1)}
                </text>
              )}
            </g>
          ))}

          {/* 🔹 Scale bar */}
          {showScale && (
            <g transform={`translate(${svgWidth - 120}, ${svgHeight - 30})`}>
              <rect x={0} y={0} width={scaleBarPixels} height={4} fill={darkMode ? '#fff' : '#000'} />
              <text x={0} y={-5} fontSize="10" fill={darkMode ? '#fff' : '#000'}>
                {scaleBarLength}m
              </text>
              <line x1={0} y1={0} x2={0} y2={8} stroke={darkMode ? '#fff' : '#000'} />
              <line x1={scaleBarPixels} y1={0} x2={scaleBarPixels} y2={8} stroke={darkMode ? '#fff' : '#000'} />
            </g>
          )}

          {/* 🔹 Info overlay */}
          <g>
            <text x={20} y={25} fontSize="14" fontWeight="bold" fill={darkMode ? '#fff' : '#000'}>
              Malla de Puesta a Tierra
            </text>
            <text x={20} y={45} fontSize="11" fill={darkMode ? '#aaa' : '#666'}>
              Dimensiones: {gridWidth}m × {gridLength}m
            </text>
            <text x={20} y={60} fontSize="11" fill={darkMode ? '#aaa' : '#666'}>
              Conductores: {nx} × {ny} | Varillas: {numRods}
            </text>
            <text x={20} y={75} fontSize="11" fill={darkMode ? '#aaa' : '#666'}>
              Escala: 1:{(1 / pixelsPerMeter).toFixed(2)}
            </text>
            {showCoordinates && (
              <text x={20} y={90} fontSize="10" fill={darkMode ? '#888' : '#888'}>
                UTM Zona {utmOrigin.zone} | {utmOrigin.hemisphere}
              </text>
            )}
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className={`mt-4 p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1" style={{ background: darkMode ? '#60a5fa' : '#3b82f6' }} />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Conductores</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1" style={{ background: '#059669' }} />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Varillas</span>
          </div>
          {dxfData && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-green-500" style={{ background: '#10b981', strokeDasharray: '4,2' }} />
              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>DXF Importado</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroundingGridSVG;