import React, { useState, useMemo } from 'react';
import { Maximize2, Download, Grid, Layout, BarChart3 } from 'lucide-react';

const ProfileView = ({ params, calculations, darkMode }) => {
  const [cutPosition, setCutPosition] = useState(0.5);
  const [viewMode, setViewMode] = useState('heatmap'); // 'heatmap', 'profile', '3d'
  const [showLabels, setShowLabels] = useState(true);
  
  const { gridLength, gridWidth, gridDepth, numParallel, numRods, rodLength, soilResistivity, surfaceLayer } = params;
  const { Em, Etouch70, Es, Estep70, Rg } = calculations;
  
  const tensionRatio = Math.min(1, (Em || 0) / (Etouch70 || 1));
  const stepRatio = Math.min(1, (Es || 0) / (Estep70 || 1));
  
  // Generar datos para el perfil de tensión
  const profileData = useMemo(() => {
    const points = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * gridLength;
      // Simular distribución de tensión
      const tension = tensionRatio * Math.sin(Math.PI * x / gridLength);
      points.push({ x, tension: tension * 100 });
    }
    return points;
  }, [gridLength, tensionRatio]);

  const getHeatMapColor = (ratio) => {
    if (ratio < 0.3) return 'from-green-500 to-green-400';
    if (ratio < 0.6) return 'from-yellow-500 to-yellow-400';
    if (ratio < 0.8) return 'from-orange-500 to-orange-400';
    return 'from-red-500 to-red-600';
  };

  const handleExportImage = () => {
    const element = document.getElementById('profile-view-container');
    if (element) {
      // Simular exportación
      alert('Funcionalidad de exportación en desarrollo');
    }
  };

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold flex items-center gap-2">
          <BarChart3 size={18} /> Vista de Perfil y Corte Transversal
        </h4>
        <div className="flex gap-1">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="Mostrar/ocultar etiquetas"
          >
            <Layout size={14} />
          </button>
          <button
            onClick={handleExportImage}
            className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="Exportar imagen"
          >
            <Download size={14} />
          </button>
        </div>
      </div>
      
      {/* Selector de modo */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setViewMode('heatmap')}
          className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-all ${
            viewMode === 'heatmap' 
              ? 'bg-blue-600 text-white shadow-md' 
              : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Grid size={14} /> Mapa de Calor
        </button>
        <button
          onClick={() => setViewMode('profile')}
          className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-all ${
            viewMode === 'profile' 
              ? 'bg-blue-600 text-white shadow-md' 
              : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Layout size={14} /> Perfil de Malla
        </button>
        <button
          onClick={() => setViewMode('3d')}
          className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-all ${
            viewMode === '3d' 
              ? 'bg-blue-600 text-white shadow-md' 
              : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Maximize2 size={14} /> Vista 3D
        </button>
      </div>
      
      {/* Contenido según modo */}
      <div id="profile-view-container">
        {viewMode === 'heatmap' && (
          <div className="space-y-3">
            <div className={`relative h-72 rounded-lg overflow-hidden bg-gradient-to-b ${getHeatMapColor(tensionRatio)}`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`text-center ${darkMode ? 'bg-gray-900/70' : 'bg-white/70'} p-3 rounded-lg shadow-md backdrop-blur-sm`}>
                  <p className="font-bold text-lg">Distribución de Tensión de Contacto</p>
                  <p className="text-sm mt-1">
                    Máxima: <span className="font-bold">{Em?.toFixed(0) || 0} V</span> 
                    <span className="mx-2">/</span>
                    Límite: {Etouch70?.toFixed(0) || 0} V
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${tensionRatio * 100}%` }}
                    />
                  </div>
                  <p className="text-xs mt-1">({(tensionRatio * 100).toFixed(0)}% del límite)</p>
                </div>
              </div>
              
              {/* Leyenda de colores */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="flex text-xs text-white justify-between">
                  <span>🟢 Seguro</span>
                  <span>🟡 Precaución</span>
                  <span>🟠 Alerta</span>
                  <span>🔴 Peligro</span>
                </div>
              </div>
            </div>
            
            {/* Gráfico de perfil de tensión */}
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h5 className="text-xs font-semibold mb-2">Perfil de Tensión a lo largo de la malla</h5>
              <div className="relative h-24">
                <svg className="w-full h-full" viewBox="0 0 100 30">
                  <polyline
                    points={profileData.map((p, i) => `${(i / (profileData.length - 1)) * 100},${30 - p.tension / 5}`).join(' ')}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  <polygon
                    points={`0,30 ${profileData.map((p, i) => `${(i / (profileData.length - 1)) * 100},${30 - p.tension / 5}`).join(' ')} 100,30`}
                    fill="rgba(59, 130, 246, 0.2)"
                  />
                </svg>
              </div>
              <div className={`flex justify-between text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-1`}>
                <span>Borde malla</span>
                <span>Centro</span>
                <span>Borde malla</span>
              </div>
            </div>
          </div>
        )}
        
        {viewMode === 'profile' && (
          <div className="space-y-3">
            <div className="relative h-72 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border">
              {/* Suelo Natural */}
              <div className="absolute bottom-0 left-0 right-0" style={{ height: '45%' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-amber-700 to-amber-600 dark:from-amber-800 dark:to-amber-700">
                  <div className="absolute top-2 left-2 text-xs text-white font-medium">
                    🌍 Suelo Natural
                    <div className="text-[10px] opacity-80">ρ = {soilResistivity} Ω·m</div>
                  </div>
                </div>
              </div>
              
              {/* Capa superficial */}
              <div className="absolute bottom-[45%] left-0 right-0" style={{ height: '15%' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-amber-500 to-amber-400 dark:from-amber-700 dark:to-amber-600">
                  <div className="absolute top-1 left-2 text-xs text-white font-medium">
                    🪨 Capa Superficial
                    <div className="text-[10px] opacity-80">ρ = {surfaceLayer} Ω·m | h = {params.surfaceDepth} m</div>
                  </div>
                </div>
              </div>
              
              {/* Malla */}
              <div 
                className="absolute left-0 right-0 h-0.5 bg-blue-500 shadow-lg"
                style={{ bottom: `${gridDepth * 45 + 15}%` }}
              >
                <div className="absolute -top-5 left-3 text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/50 px-2 py-0.5 rounded">
                  ═══ MALLA a {gridDepth} m ═══
                </div>
              </div>
              
              {/* Varillas */}
              <div 
                className="absolute w-2 bg-gradient-to-b from-green-400 to-green-600 rounded-full shadow-md"
                style={{ 
                  left: `${cutPosition * 100}%`,
                  bottom: `${gridDepth * 45 + 15}%`,
                  height: `${rodLength * 12}px`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="absolute -right-7 top-1/2 text-[10px] font-bold text-green-600 whitespace-nowrap bg-green-50 dark:bg-green-900/50 px-1 py-0.5 rounded">
                  Varilla {rodLength}m
                </div>
              </div>
              
              {/* Línea de corte */}
              <div 
                className="absolute top-0 bottom-0 w-px bg-red-500 border-l border-red-500 border-dashed"
                style={{ left: `${cutPosition * 100}%` }}
              >
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 -translate-y-full text-[10px] font-bold text-red-500 whitespace-nowrap bg-red-50 dark:bg-red-900/50 px-1 rounded">
                  Corte {Math.round(cutPosition * 100)}%
                </div>
              </div>
              
              {/* Control deslizante */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={cutPosition}
                onChange={(e) => setCutPosition(parseFloat(e.target.value))}
                className="absolute bottom-2 left-4 right-4 w-auto z-10"
              />
            </div>
            
            <div className={`text-center text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>
              💡 Arrastra el control deslizante para mover el corte transversal
            </div>
          </div>
        )}
        
        {viewMode === '3d' && (
          <div className="space-y-3">
            <div className="relative h-72 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden">
              {/* Representación 3D simplificada */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-2">🔲</div>
                  <p className="text-white text-sm">Malla de {gridLength}×{gridWidth} m</p>
                  <p className="text-gray-300 text-xs mt-1">{numParallel} conductores | {numRods} varillas</p>
                  <p className={`${darkMode ? 'text-gray-100' : 'text-gray-600'} text-xs mt-2`}>Vista 3D interactiva disponible en la pestaña principal</p>
                </div>
              </div>
              
              {/* Indicadores de profundidad */}
              <div className={`absolute bottom-2 left-2 text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>
                Profundidad: {gridDepth}m
              </div>
              <div className={`absolute top-2 right-2 text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'`}>
                Área: {(gridLength * gridWidth).toFixed(0)} m²
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Resistencia:</span>
                <span className="ml-1 font-semibold">{Rg?.toFixed(2)} Ω</span>
              </div>
              <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Tensión paso:</span>
                <span className="ml-1 font-semibold">{Es?.toFixed(0)} V</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Estadísticas rápidas */}
      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Tensión Contacto</div>
            <div className={`font-bold ${tensionRatio > 0.8 ? 'text-red-600' : tensionRatio > 0.6 ? 'text-yellow-600' : 'text-green-600'}`}>
              {Em?.toFixed(0)} / {Etouch70?.toFixed(0)} V
            </div>
          </div>
          <div>
            <div className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Tensión Paso</div>
            <div className={`font-bold ${stepRatio > 0.8 ? 'text-red-600' : stepRatio > 0.6 ? 'text-yellow-600' : 'text-green-600'}`}>
              {Es?.toFixed(0)} / {Estep70?.toFixed(0)} V
            </div>
          </div>
          <div>
            <div className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Nivel de Riesgo</div>
            <div className={`font-bold ${tensionRatio > 0.7 ? 'text-red-600' : tensionRatio > 0.5 ? 'text-yellow-600' : 'text-green-600'}`}>
              {tensionRatio > 0.7 ? 'ALTO' : tensionRatio > 0.5 ? 'MODERADO' : 'BAJO'}
            </div>
          </div>
        </div>
      </div>
      
      {showLabels && (
        <div className="mt-2 text-xs text-gray-300 text-center">
          💡 Los colores indican el nivel de tensión | Verde=Seguro, Rojo=Peligro
        </div>
      )}
    </div>
  );
};

export default ProfileView;