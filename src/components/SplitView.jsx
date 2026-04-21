import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Comparador visual con slider (tipo ETAP)
 * Permite comparar dos diseños antes/después
 */
export default function SplitView({ left, right, leftLabel = 'Antes', rightLabel = 'Optimizado', height = 500 }) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPos = (x / rect.width) * 100;
    setPosition(Math.max(5, Math.min(95, newPos)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const newPos = (x / rect.width) * 100;
    setPosition(Math.max(5, Math.min(95, newPos)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="relative w-full border rounded-lg overflow-hidden shadow-lg"
      style={{ height }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Panel izquierdo (antes) */}
      <div 
        className="absolute top-0 left-0 h-full overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <div className="relative w-full h-full">
          {left}
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {leftLabel}
          </div>
        </div>
      </div>

      {/* Panel derecho (después) - fondo completo */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="relative w-full h-full opacity-30">
          {right}
        </div>
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {rightLabel}
        </div>
      </div>

      {/* Panel derecho visible (después) - overlay */}
      <div 
        className="absolute top-0 h-full overflow-hidden"
        style={{ 
          left: `${position}%`,
          right: '0',
          width: `${100 - position}%`
        }}
      >
        <div className="relative w-full h-full">
          {right}
        </div>
      </div>

      {/* Slider handle */}
      <div
        className={`absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize z-10 flex items-center justify-center ${isDragging ? 'w-2' : ''}`}
        style={{ left: `${position}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="bg-white rounded-full shadow-lg p-1 cursor-col-resize">
          {isDragging ? (
            <div className="flex gap-1">
              <ChevronLeft size={16} className="text-gray-600" />
              <ChevronRight size={16} className="text-gray-600" />
            </div>
          ) : (
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
          )}
        </div>
      </div>

      {/* Indicador de porcentaje */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded">
        {position.toFixed(0)}%
      </div>
    </div>
  );
}

/**
 * Versión simple de split view (50/50 fijo)
 */
export function SplitViewSimple({ left, right, height = 500 }) {
  return (
    <div className="flex w-full h-full border rounded-lg overflow-hidden shadow-lg" style={{ height }}>
      <div className="w-1/2 border-r relative">
        {left}
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          Antes
        </div>
      </div>
      <div className="w-1/2 relative">
        {right}
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          Optimizado
        </div>
      </div>
    </div>
  );
}
