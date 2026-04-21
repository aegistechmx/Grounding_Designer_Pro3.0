import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, Zap, TrendingUp } from 'lucide-react';

const ThermalWarning = ({ thermalCheck, darkMode, onFix }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!thermalCheck) return null;
  
  const { complies, severity, message, recommendation, minRequiredArea, currentArea, requiredAmpacity, currentAmpacity, recommendedConductor, currentConductor, parallelInfo, needsParallel, thermalComplies, ampacityComplies } = thermalCheck;
  
  // Colores según severidad y modo oscuro
  const getColors = () => {
    if (severity === 'error') {
      return darkMode 
        ? { bg: 'bg-red-900/30', border: 'border-red-500', text: 'text-red-400', icon: 'text-red-500' }
        : { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', icon: 'text-red-600' };
    } else if (severity === 'warning') {
      return darkMode 
        ? { bg: 'bg-yellow-900/30', border: 'border-yellow-500', text: 'text-yellow-400', icon: 'text-yellow-500' }
        : { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700', icon: 'text-yellow-600' };
    }
    return darkMode 
      ? { bg: 'bg-green-900/30', border: 'border-green-500', text: 'text-green-400', icon: 'text-green-500' }
      : { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', icon: 'text-green-600' };
  };
  
  const colors = getColors();
  
  return (
    <div className={`mb-4 p-4 rounded-lg border-l-4 ${colors.bg} ${colors.border} shadow-md`}>
      <div className="flex items-start gap-3">
        {/* Icono */}
        <div className="flex-shrink-0">
          {severity === 'error' && <XCircle size={24} className={colors.icon} />}
          {severity === 'warning' && <AlertTriangle size={24} className={colors.icon} />}
          {severity === 'success' && <CheckCircle size={24} className={colors.icon} />}
        </div>
        
        {/* Contenido principal */}
        <div className="flex-1">
          <div className="flex flex-wrap justify-between items-start gap-2">
            <h4 className={`font-bold ${colors.text}`}>
              {severity === 'error' && '⚠️ VERIFICACIÓN TÉRMICA - NO CUMPLE'}
              {severity === 'warning' && '⚠️ VERIFICACIÓN TÉRMICA - PRECAUCIÓN'}
              {severity === 'success' && '✅ VERIFICACIÓN TÉRMICA - CUMPLE'}
            </h4>
            <button
              onClick={() => setExpanded(!expanded)}
              className={`text-xs px-2 py-1 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
            >
              {expanded ? '▲ Ver menos' : '▼ Ver detalles'}
            </button>
          </div>
          
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {message}
          </p>
          
          {/* Resumen rápido */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
            <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <span className="text-gray-500">Corriente de falla (Ig):</span>
              <div className="font-bold">{thermalCheck.faultCurrent} A</div>
            </div>
            <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <span className="text-gray-500">Duración (t):</span>
              <div className="font-bold">{thermalCheck.faultDuration} s</div>
            </div>
            <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <span className="text-gray-500">Área requerida:</span>
              <div className="font-bold">{minRequiredArea} mm²</div>
            </div>
            <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <span className="text-gray-500">Área actual:</span>
              <div className={`font-bold ${!thermalComplies ? 'text-red-500' : 'text-green-500'}`}>
                {currentArea} mm²
              </div>
            </div>
          </div>
          
          {/* Detalles expandidos */}
          {expanded && (
            <div className={`mt-3 p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'} text-sm`}>
              <h5 className={`font-semibold mb-2 ${colors.text}`}>📐 Detalles del cálculo</h5>
              <p className="font-mono text-xs mb-2">{thermalCheck.formula}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {/* Conductor actual */}
                <div className={`p-2 rounded ${!thermalComplies || !ampacityComplies ? (darkMode ? 'bg-red-900/20' : 'bg-red-50') : (darkMode ? 'bg-green-900/20' : 'bg-green-50')}`}>
                  <div className="font-semibold mb-1">📌 Conductor actual</div>
                  <div className="text-xs space-y-1">
                    <div>Calibre: <strong>{currentConductor?.name || 'N/A'}</strong></div>
                    <div>Área: {currentArea} mm²</div>
                    <div>Ampacidad: {currentAmpacity || 'N/A'} A</div>
                    <div>Área térmica: {thermalComplies ? '✅ Cumple' : '❌ No cumple'}</div>
                    <div>Ampacidad: {ampacityComplies ? '✅ Cumple' : '❌ No cumple'}</div>
                  </div>
                </div>
                
                {/* Recomendación */}
                <div className={`p-2 rounded ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <div className="font-semibold mb-1">🎯 Recomendación para la malla enterrada</div>
                  <div className="text-xs">
                    {recommendedConductor && (
                      <div className="mt-2 pt-2 border-t border-gray-600">
                        <div className="font-mono font-bold">
                          1 × {recommendedConductor?.name || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {recommendedConductor?.area?.toFixed(1)} mm² | 
                          Ampacidad: {recommendedConductor?.ampacity || 'N/A'} A
                        </div>
                        {!ampacityComplies && (
                          <div className="text-xs text-yellow-500 mt-1">
                            ⚠️ Nota: La ampacidad es menor que la corriente de falla, pero para una falla de corta duración (0.35s) 
                            el conductor 4/0 AWG es estándar y aceptado en la práctica según IEEE 80.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Botón de acción */}
          {!complies && onFix && (
            <button
              onClick={() => {
                console.log('Botón clickeado, ejecutando onFix');
                onFix();
              }}
              className="mt-3 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-all"
            >
              Aplicar configuración recomendada
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThermalWarning;
