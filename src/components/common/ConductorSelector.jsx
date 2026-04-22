// src/components/common/ConductorSelector.jsx
import React, { useState, useEffect } from 'react';
import { Cable, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { CONDUCTOR_TABLE } from '../../data/viakonData';

const ConductorSelector = ({ 
  params, 
  calculations, 
  darkMode, 
  onSelectConductor,
  className = "" 
}) => {
  const [selectedGauge, setSelectedGauge] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'copper', 'aluminum'

  // Obtener corriente de falla (Ig) y temperatura nominal
  const Ig = calculations?.Ig || params?.faultCurrent || 0;
  const tempRating = params?.insulationTemp || 75;
  const tempRatingStr = tempRating.toString();
  const material = params?.materialType === 'ALUMINUM' ? 'ALUMINUM' : 'COPPER';
  
  // Determinar ampacidad requerida
  const requiredAmpacity = Ig;
  
  // Calcular área mínima requerida (térmica)
  const t = params?.faultDuration || 0.35;
  const k = material === 'COPPER' ? 7.0 : 4.5;
  const minRequiredArea = (Ig * Math.sqrt(t)) / k;
  
  // Seleccionar conductor recomendado
  // Para MALLA ENTERRADA: solo importa el área térmica según IEEE 80
  const getRecommendedConductor = () => {
    const catalog = CONDUCTOR_TABLE[material]?.[tempRatingStr] || {};
    
    for (const [gauge, data] of Object.entries(catalog)) {
      const areaOk = data.area >= minRequiredArea;
      if (areaOk) {
        return { gauge, ...data, recommended: true };
      }
    }
    return null;
  };
  
  // Encontrar conductor actual
  const getCurrentConductor = () => {
    const currentDiameter = params?.conductorDiameter;
    const catalog = CONDUCTOR_TABLE[material]?.[tempRatingStr] || {};
    
    if (!currentDiameter) {
      // Si no hay diámetro, devolver 4/0 AWG por defecto
      const defaultGauge = catalog['4/0 AWG'] || catalog['2/0 AWG'];
      if (defaultGauge) {
        return { gauge: '4/0 AWG', area: defaultGauge.area, diameter: defaultGauge.diameter, ampacity75: defaultGauge.ampacity };
      }
      return { gauge: '4/0 AWG', area: 107.2, diameter: 11.68, ampacity75: 230, ampacity90: 260 };
    }
    
    for (const [gauge, data] of Object.entries(catalog)) {
      if (Math.abs(data.diameter - currentDiameter) < 0.5) {
        return { gauge, ...data };
      }
    }
    
    // Si no se encuentra en el catálogo, devolver el primero disponible
    const firstGauge = Object.keys(catalog)[0];
    if (firstGauge) {
      return { gauge: firstGauge, ...catalog[firstGauge] };
    }
    
    return { gauge: '4/0 AWG', area: 107.2, diameter: 11.68, ampacity75: 230, ampacity90: 260 };
  };
  
  const recommended = getRecommendedConductor();
  const current = getCurrentConductor();
  const catalog = CONDUCTOR_TABLE[material]?.[tempRatingStr] || {};
  const catalogList = Object.entries(catalog);
  
  // Verificar si el conductor actual cumple
  // Para MALLA ENTERRADA: solo importa el área térmica según IEEE 80
  // La ampacidad NO es relevante para una falla de corta duración (0.35s)
  const currentComplies = current ? 
    (current.area >= minRequiredArea) : false;
  
  const handleSelect = (gauge, data) => {
    setSelectedGauge(gauge);
    if (onSelectConductor) {
      onSelectConductor({
        gauge,
        area: data.area,
        diameter: data.diameter,
        ampacity: data.ampacity,
        material: material
      });
    }
  };
  
  const colors = darkMode ? {
    bg: 'bg-gray-800',
    card: 'bg-gray-700',
    text: 'text-white',
    textSecondary: 'text-gray-300',
    border: 'border-gray-600',
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400'
  } : {
    bg: 'bg-white',
    card: 'bg-gray-50',
    text: 'text-gray-800',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200',
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600'
  };

  return (
    <div className={`p-4 rounded-lg ${colors.bg} border ${colors.border} ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <h4 className={`font-semibold ${colors.text} flex items-center gap-2`}>
          <Cable size={18} /> Selector de Conductor
        </h4>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`text-xs px-2 py-1 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
        >
          {showDetails ? '▲ Ocultar' : '▼ Mostrar'} tabla
        </button>
      </div>
      
      {/* Resumen de requerimientos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-sm">
        <div className={`p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
          <div className="text-xs text-gray-500">Corriente (Ig)</div>
          <div className="font-bold">{(requiredAmpacity || 0).toFixed(0)} A</div>
        </div>
        <div className={`p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
          <div className="text-xs text-gray-500">Duración (t)</div>
          <div className="font-bold">{t} s</div>
        </div>
        <div className={`p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
          <div className="text-xs text-gray-500">Área térmica mín.</div>
          <div className="font-bold">{(minRequiredArea || 0).toFixed(2)} mm²</div>
        </div>
        <div className={`p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
          <div className="text-xs text-gray-500">Temp. aislamiento</div>
          <div className="font-bold">{tempRating}°C</div>
        </div>
      </div>
      
      {/* Conductor recomendado */}
      {recommended && (
        <div className={`p-3 rounded-lg mb-3 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} border border-blue-500`}>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-blue-600 dark:text-blue-400">🎯 CONDUCTOR RECOMENDADO</div>
              <div className="text-xl font-bold">{recommended.gauge}</div>
              <div className="text-xs mt-1">
                Área: {recommended.area} mm² | Ampacidad: {recommended.ampacity} A ({tempRating}°C)
              </div>
            </div>
            <button
              onClick={() => handleSelect(recommended.gauge, recommended)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Seleccionar
            </button>
          </div>
        </div>
      )}
      
      {/* Conductor actual */}
      {current && (
        <div className={`p-3 rounded-lg mb-3 ${currentComplies ? (darkMode ? 'bg-green-900/30' : 'bg-green-50') : (darkMode ? 'bg-red-900/30' : 'bg-red-50')}`}>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs">📌 CONDUCTOR ACTUAL</div>
              <div className="text-lg font-bold">{current.gauge}</div>
              <div className="text-xs mt-1">
                Área: {current.area} mm² | Ampacidad: {current.ampacity} A ({tempRating}°C)
              </div>
              <div className="text-xs mt-1">
                {currentComplies ? (
                  <span className="text-green-600">✅ Cumple (área térmica suficiente para falla de {t}s)</span>
                ) : (
                  <span className="text-red-600">❌ Área insuficiente para falla de {t}s</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabla de conductores */}
      {showDetails && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={darkMode ? 'bg-gray-600' : 'bg-gray-100'}>
              <tr>
                <th className="p-2 text-left">Calibre</th>
                <th className="p-2 text-left">Área (mm²)</th>
                <th className="p-2 text-left">Diámetro (mm)</th>
                <th className="p-2 text-left">Ampacidad ({tempRating}°C)</th>
                <th className="p-2 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {catalogList.map(([gauge, data]) => {
                const isRecommended = recommended?.gauge === gauge;
                const isCurrent = current?.gauge === gauge;
                // Para MALLA ENTERRADA: solo importa el área térmica
                const meetsArea = data.area >= minRequiredArea;
                const isAdequate = meetsArea;
                
                return (
                  <tr 
                    key={gauge} 
                    className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${
                      isRecommended ? (darkMode ? 'bg-blue-900/20' : 'bg-blue-50') : ''
                    }`}
                  >
                    <td className="p-2 font-medium">
                      {gauge}
                      {isRecommended && <span className="ml-1 text-xs text-blue-600">★</span>}
                    </td>
                    <td className="p-2">{data.area}</td>
                    <td className="p-2">{data.diameter}</td>
                    <td className="p-2 text-gray-600">
                      {data.ampacity} A
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => handleSelect(gauge, data)}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        Seleccionar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Nota IEEE 80 */}
      <div className="mt-3 p-2 rounded bg-blue-100 dark:bg-blue-900/30 text-xs text-black dark:text-white">
        <AlertCircle size={12} className="inline mr-1" />
        <strong>Nota IEEE 80:</strong> Para malla enterrada, el criterio principal es el área térmica para soportar la falla durante {t}s.
        La ampacidad continua no es relevante para fallas de corta duración.
      </div>
    </div>
  );
};

export default ConductorSelector;
