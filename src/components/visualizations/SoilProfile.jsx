import React, { useState } from 'react';
import { Info, Shield, Zap, TrendingDown, Maximize2, User, ArrowDown } from 'lucide-react';

const SoilProfile = ({ params, darkMode }) => {
  const [showDetails, setShowDetails] = useState(false);
  const { 
    soilResistivity = 100, 
    surfaceLayer = 3000, 
    surfaceDepth = 0.15, 
    gridDepth = 0.6, 
    rodLength = 3,
    gridLength = 30,
    gridWidth = 16
  } = params || {};
  
  // Calcular profundidades correctas
  const maxDepth = Math.max((gridDepth || 0.6) + (rodLength || 3), (surfaceDepth || 0.15) + 2, 5);
  const scale = 220 / Math.max(1, maxDepth);
  
  // Posiciones en píxeles (desde la parte superior)
  const surfaceBottom = (surfaceDepth || 0.15) * scale;           // Fin de capa superficial
  const mallaY = (gridDepth || 0.6) * scale;                     // Posición de la malla
  const varillaBottom = ((gridDepth || 0.6) + (rodLength || 3)) * scale; // Fin de la varilla
  
  // Calcular protección de la capa superficial (IEEE Std 80)
  const safeSurfaceLayer = Math.max(1, surfaceLayer || 3000);
  const safeSurfaceDepth = Math.max(0.01, surfaceDepth || 0.15);
  const safeSoilResistivity = Math.max(1, soilResistivity || 100);
  const Cs = 1 - (0.09 * (1 - safeSoilResistivity / safeSurfaceLayer)) / (2 * safeSurfaceDepth + 0.09);
  const touchLimitIncrease = (1000 + 1.5 * Cs * safeSurfaceLayer) / 1000;
  const protectionIncrease = isFinite(touchLimitIncrease) ? ((touchLimitIncrease - 1) * 100).toFixed(0) : '0';
  
  // Determinar calidad del suelo
  const soilQuality = soilResistivity < 100 ? 'Excelente' : soilResistivity < 300 ? 'Buena' : soilResistivity < 500 ? 'Aceptable' : 'Mejorable';
  const soilColor = soilResistivity < 100 ? 'text-green-600' : soilResistivity < 300 ? 'text-blue-600' : soilResistivity < 500 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold flex items-center gap-2">
          <span>🌍</span> Perfil del Suelo (Corte Transversal)
        </h4>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          title="Mostrar detalles"
        >
          <Info size={16} />
        </button>
      </div>
      
      {/* Gráfico del perfil */}
      <div className="relative w-full h-72 border rounded-lg overflow-hidden shadow-inner">
        
        {/* CAPA SUPERFICIAL - ARRIBA (protege a las personas) */}
        <div 
          className="absolute top-0 left-0 right-0 bg-gradient-to-b from-amber-300 to-amber-500 dark:from-amber-700 dark:to-amber-800"
          style={{ height: `${surfaceBottom}px` }}
        >
          <div className="absolute top-2 left-2 text-xs font-medium text-blue-600 dark:text-blue-300 leading-relaxed">
            <div className="font-bold mb-1">🌟 CAPA SUPERFICIAL</div>
            <div className="mb-0.5">Material: Grava / Asfalto</div>
            <div className="mb-0.5">Resistividad: {isFinite(surfaceLayer) ? surfaceLayer.toLocaleString() : (3000).toLocaleString()} Ω·m</div>
            <div className="mb-0.5">Espesor: {surfaceDepth || 0.15} m</div>
            <div className="text-blue-600 dark:text-blue-300 mt-1">✓ Protege a las personas</div>
          </div>
          
          {/* Indicador de persona en superficie */}
          <div className="absolute top-0 right-3 flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded-full text-xs">
            <User size={12} />
            <span className="font-bold text-blue-600 dark:text-blue-300">🚶 PERSONA EN SUPERFICIE</span>
            <Shield size={10} className="text-green-600" />
          </div>
          
          {/* Patrón de grava decorativo */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 opacity-30">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="w-1 h-1 bg-gray-800 rounded-full" />
            ))}
          </div>
        </div>
        
        {/* Etiqueta de profundidad - límite capa superficial */}
        <div className="absolute left-1/2 transform -translate-x-1/2" style={{ top: `${mallaY - 30}px` }}>
          <span className="text-[9px] text-gray-900 bg-white/80 dark:bg-gray-800/80 px-1 rounded">↑ {surfaceDepth || 0.15}m</span>
        </div>
        
        {/* SUELO NATURAL - DEBAJO DE LA CAPA SUPERFICIAL */}
        <div 
          className="absolute left-0 right-0 bg-gradient-to-t from-amber-800/30 to-amber-600/20 dark:from-amber-900/50 dark:to-amber-800/30"
          style={{ top: `${surfaceBottom}px`, bottom: 0 }}
        >
          {/* Textura del suelo natural */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(50)].map((_, i) => (
              <div 
                key={i} 
                className="absolute w-1 h-1 bg-gray-800 rounded-full" 
                style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
              />
            ))}
          </div>
          
          <div className="absolute left-2/3 transform -translate-x-1/2 text-xs font-medium text-brown-900 dark:text-brown-100 leading-relaxed text-center" style={{ top: `${surfaceBottom + 50}px` }}>
            <div className="font-bold mb-2">🌍 SUELO NATURAL</div>
            <div className="mb-1">Resistividad: {soilResistivity || 100} Ω·m</div>
            <div className="mb-1">Calidad: <span className={soilColor}>{soilQuality}</span></div>
            <div className="text-blue-700 dark:text-blue-300 mt-2">✓ Disipa la corriente de falla</div>
          </div>
        </div>
        
        {/* MALLA DE TIERRA - a profundidad gridDepth */}
        <div 
          className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 shadow-lg z-10"
          style={{ top: `${mallaY}px` }}
        >
          {/* Efecto de brillo */}
          <div className="absolute inset-0 bg-blue-400 blur-sm opacity-50" />
        </div>
        
        {/* Etiqueta de la malla */}
        <div 
          className="absolute left-2/3 transform -translate-x-1/2 text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/70 px-2 py-0.5 rounded whitespace-nowrap z-20"
          style={{ top: `${mallaY + 12}px` }}
        >
          ═════ MALLA DE TIERRA a {gridDepth || 0.6} m ═════
        </div>
        
        {/* VARILLAS - desde la malla hacia abajo */}
        <div 
          className="absolute left-1/2 w-2.5 bg-gradient-to-b from-green-400 to-green-600 rounded-full shadow-md z-10"
          style={{ 
            top: `${mallaY}px`,
            height: `${varillaBottom - mallaY}px`,
            transform: 'translateX(-50%)'
          }}
        >
          {/* Punta de la varilla */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-green-700 rounded-full" />
        </div>
        
        {/* Etiqueta de la varilla */}
        <div 
          className="absolute text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/70 px-1 py-0.5 rounded whitespace-nowrap z-20"
          style={{ left: '42%', top: `${mallaY + (varillaBottom - mallaY) / 2 - 8}px` }}
        >
          Varilla {rodLength || 3}m
        </div>
        
        {/* FLECHA DE CORRIENTE - mostrando el camino seguro */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-100 dark:bg-blue-900/70 px-2 py-2 rounded-lg shadow-md z-20">
          <div className="flex flex-col items-center text-xs">
            <span className="text-blue-700 dark:text-blue-300 font-semibold">Camino de la corriente</span>
            <ArrowDown size={16} className="text-blue-500 my-1" />
            <span className="text-blue-600 dark:text-blue-400">↓ Hacia tierra ↓</span>
            <div className="text-[10px] text-green-600 mt-1">✓ NO pasa por personas</div>
          </div>
        </div>
        
        {/* Escala de profundidades */}
        <div className="absolute left-1 bottom-1 text-[11px] text-gray-900 bg-white/80 dark:bg-gray-800/80 px-1 rounded">
          <div className="flex flex-col items-start gap-0.5">
            <span>0 m (superficie)</span>
            <div className="w-8 h-px bg-gray-400" />
            <span>{surfaceDepth || 0.15} m (fin capa superficial)</span>
            <div className="w-8 h-px bg-gray-400" />
            <span>{gridDepth || 0.6} m (malla)</span>
            <div className="w-8 h-px bg-gray-400" />
            <span>{isFinite((gridDepth || 0.6) + (rodLength || 3)) ? ((gridDepth || 0.6) + (rodLength || 3)).toFixed(1) : 'N/A'} m (fin varilla)</span>
          </div>
        </div>
        
        {/* Indicador de protección */}
        <div className="absolute bottom-2 right-2 text-[10px] bg-green-100 dark:bg-green-900/70 px-2 py-1 rounded-full shadow-md">
          <div className="flex items-center gap-1 text-green-700 dark:text-green-300">
            <Shield size={10} /> Protección activa: +{protectionIncrease}%
          </div>
        </div>
      </div>
      
      {/* Información adicional - colapsable */}
      {showDetails && (
        <div className={`mt-3 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} animate-fade-in`}>
          <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Shield size={14} /> Detalles de protección (IEEE Std 80)
          </h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Factor de reducción Cs:</span>
              <span className="ml-1 font-semibold">{isFinite(Cs) ? Cs.toFixed(3) : 'N/A'}</span>
            </div>
            <div>
              <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Límite de contacto seguro:</span>
              <span className="ml-1 font-semibold text-green-600">{isFinite((touchLimitIncrease || 1) * 3804) ? ((touchLimitIncrease || 1) * 3804).toFixed(0) : 'N/A'} V</span>
            </div>
            <div>
              <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Incremento de seguridad:</span>
              <span className="ml-1 font-semibold text-green-600">+{protectionIncrease}%</span>
            </div>
            <div>
              <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Profundidad efectiva:</span>
              <span className="ml-1 font-semibold">{isFinite((gridDepth || 0.6) + (rodLength || 3)) ? ((gridDepth || 0.6) + (rodLength || 3)).toFixed(1) : 'N/A'} m</span>
            </div>
            <div>
              <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Área de influencia:</span>
              <span className="ml-1 font-semibold">{isFinite((gridLength || 30) * (gridWidth || 16)) ? ((gridLength || 30) * (gridWidth || 16)).toFixed(0) : 'N/A'} m²</span>
            </div>
            <div>
              <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Resistividad equivalente:</span>
              <span className="ml-1 font-semibold">{isFinite(Math.sqrt((soilResistivity || 100) * (surfaceLayer || 3000))) ? Math.sqrt((soilResistivity || 100) * (surfaceLayer || 3000)).toFixed(0) : 'N/A'} Ω·m</span>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-600">
            <p className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>
              💡 La capa superficial de alta resistividad actúa como barrera, 
              aumentando la impedancia del cuerpo-tierra y reduciendo la corriente 
              que puede circular por una persona durante una falla.
            </p>
            <p className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-1`}>
              📐 Según IEEE Std 80, la tensión de contacto tolerable aumenta de 380V a {isFinite(touchLimitIncrease) ? touchLimitIncrease.toFixed(1) : 'N/A'}V
              gracias a la capa de {surfaceDepth || 0.15}m de {(surfaceLayer || 3000).toLocaleString()} Ω·m.
            </p>
          </div>
        </div>
      )}
      
      {/* Leyenda de colores */}
      <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-400 rounded" />
          <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Capa superficial (protección)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-700 rounded" />
          <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Suelo natural (disipación)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 bg-blue-500 rounded" />
          <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Malla de tierra</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Varilla de tierra</span>
        </div>
      </div>
      
      {/* Nota de protección principal */}
      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
          <Shield size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            <strong>✅ ¿Cómo protege la capa superficial?</strong><br />
            La alta resistividad ({(surfaceLayer || 3000).toLocaleString()} Ω·m) de la capa superior <strong>bloquea el paso de corriente</strong> 
            a través del cuerpo de las personas, elevando el límite de tensión de contacto seguro de 380V a más de {isFinite((touchLimitIncrease || 1) * 3804) ? ((touchLimitIncrease || 1) * 3804).toFixed(0) : 'N/A'}V.
          </span>
        </p>
      </div>
      
      {/* Recomendación según calidad del suelo */}
      {soilResistivity > 500 && (
        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
            <Zap size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              <strong>⚠️ Recomendación:</strong> Suelo de alta resistividad ({soilResistivity || 100} Ω·m). 
              Considere tratamiento químico con bentonita, aumento de varillas o malla más densa.
            </span>
          </p>
        </div>
      )}
      
      {/* Nota sobre el orden correcto */}
      <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <p className="text-xs text-green-700 dark:text-green-300 flex items-start gap-2">
          <TrendingDown size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            <strong>✓ Configuración correcta:</strong> La malla va enterrada en el suelo natural a {gridDepth || 0.6}m, 
            no dentro de la capa superficial. La corriente de falla se disipa a través de la malla y las varillas, 
            <strong> sin pasar por las personas</strong> en la superficie.
          </span>
        </p>
      </div>
    </div>
  );
};

export default SoilProfile;