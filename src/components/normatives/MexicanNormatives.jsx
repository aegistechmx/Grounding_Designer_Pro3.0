// src/components/normatives/MexicanNormatives.jsx
import React, { useState, useMemo } from 'react';
import { Shield, Zap, AlertTriangle, CheckCircle, XCircle, FileText, Download } from 'lucide-react';

const MexicanNormatives = ({ params, calculations, darkMode }) => {
  const [activeNormative, setActiveNormative] = useState('NOM-022');
  const [showSphereMethod, setShowSphereMethod] = useState(false);
  const [lightningProtectionLevel, setLightningProtectionLevel] = useState('III');

  // ============================================
  // NOM-022-STPS-2015 - Electricidad Estática
  // ============================================
  const nom022Compliance = useMemo(() => {
    const Rg = calculations?.Rg || 999;
    const complies = Rg <= 10; // NOM-022: <10Ω
    const hasGravelLayer = params?.surfaceLayer >= 3000 && params?.surfaceDepth >= 0.10;
    
    return {
      complies,
      Rg,
      requiredResistance: 10,
      margin: (10 - Rg).toFixed(2),
      hasGravelLayer,
      recommendations: []
    };
  }, [calculations, params]);

  // ============================================
  // NMX-J-549-ANCE-2005 - Pararrayos (SPTE)
  // ============================================
  const nmx549Compliance = useMemo(() => {
    const buildingPerimeter = 2 * (params?.gridLength + params?.gridWidth);
    const buildingHeight = params?.buildingHeight || 10;
    const hasLightningRod = params?.hasLightningRod || false;
    
    // Niveles de protección según NMX-J-549
    const protectionLevels = {
      I: { radius: 20, description: 'Máxima protección (edificios con explosivos)' },
      II: { radius: 30, description: 'Alta protección (industrias químicas)' },
      III: { radius: 45, description: 'Protección estándar (edificios comunes)' },
      IV: { radius: 60, description: 'Protección básica (estructuras sin riesgo)' }
    };
    
    const currentLevel = protectionLevels[lightningProtectionLevel];
    
    // Cálculo del radio de protección (método esfera rodante)
    const calculateProtectionRadius = (height, level) => {
      // R = √(2rh - h²) según NMX-J-549
      const r = protectionLevels[level].radius;
      const h = height;
      if (h >= r) return r;
      return Math.sqrt(2 * r * h - Math.pow(h, 2));
    };
    
    const protectionRadius = calculateProtectionRadius(buildingHeight, lightningProtectionLevel);
    
    // Número de electrodos necesarios
    const requiredRods = Math.ceil(buildingPerimeter / 20); // Un electrodo cada 20m
    const hasEnoughRods = (params?.numRods || 0) >= requiredRods;
    
    // Longitud mínima de electrodos: 2.40m según NMX-J-549
    const rodLengthOK = (params?.rodLength || 0) >= 2.40;
    
    // Distancia entre electrodos: mínimo 2× longitud
    const rodSpacing = params?.gridLength / (params?.numRods || 1);
    const spacingOK = rodSpacing >= (params?.rodLength || 3) * 2;
    
    return {
      hasLightningRod,
      protectionLevel: lightningProtectionLevel,
      protectionRadius: protectionRadius.toFixed(2),
      currentLevel,
      requiredRods,
      hasEnoughRods,
      rodLengthOK,
      spacingOK,
      buildingPerimeter,
      buildingHeight,
      recommendations: []
    };
  }, [params, lightningProtectionLevel]);

  // ============================================
  // Cálculo de electrodos según NMX-J-549
  // ============================================
  const calculateRequiredElectrodes = () => {
    const perimeter = 2 * (params?.gridLength + params?.gridWidth);
    const baseRods = Math.ceil(perimeter / 20);
    
    // Ajuste por nivel de protección
    const levelMultiplier = {
      I: 2.0,
      II: 1.5,
      III: 1.0,
      IV: 0.8
    };
    
    const totalRods = Math.ceil(baseRods * levelMultiplier[lightningProtectionLevel]);
    
    return {
      baseRods,
      totalRods,
      multiplier: levelMultiplier[lightningProtectionLevel],
      minRodLength: 2.40,
      minSpacing: 4.80 // 2 × 2.40m
    };
  };

  // ============================================
  // Método de la Esfera Rodante (visualización)
  // ============================================
  const SphereMethodVisualization = () => {
    const canvasRef = React.useRef(null);
    const buildingWidth = params?.gridWidth || 16;
    const buildingHeight = params?.buildingHeight || 10;
    const protectionRadius = nmx549Compliance.protectionRadius;
    
    React.useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const groundY = canvas.height - 50;
      
      // Dibujar edificio
      ctx.fillStyle = darkMode ? '#4b5563' : '#9ca3af';
      ctx.fillRect(centerX - 40, groundY - buildingHeight * 3, 80, buildingHeight * 3);
      
      // Dibujar esfera rodante
      const radius = protectionRadius * 3;
      ctx.beginPath();
      ctx.arc(centerX, groundY - radius, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      
      // Punto de contacto
      ctx.beginPath();
      ctx.arc(centerX, groundY - radius, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      
      ctx.setLineDash([]);
      ctx.fillStyle = darkMode ? '#fff' : '#000';
      ctx.font = '10px sans-serif';
      ctx.fillText(`Esfera de radio R = ${protectionRadius}m`, centerX - 60, groundY - radius - 10);
      ctx.fillText(`Altura del edificio: ${buildingHeight}m`, centerX - 60, groundY - buildingHeight * 3 - 10);
      
    }, [buildingHeight, protectionRadius, darkMode]);
    
    return (
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        className="w-full h-auto border rounded-lg"
        style={{ backgroundColor: darkMode ? '#1f2937' : '#f3f4f6' }}
      />
    );
  };

  // ============================================
  // Generar reporte de cumplimiento NOM
  // ============================================
  const generateComplianceReport = () => {
    const report = `
      INFORME DE CUMPLIMIENTO NORMATIVO MEXICANO
      ===========================================
      
      📅 Fecha: ${new Date().toLocaleDateString()}
      👷 Ingeniero: ${params?.engineerName || 'No especificado'}
      
      1. NOM-022-STPS-2015 (Electricidad Estática)
      --------------------------------------------
      • Resistencia de tierra medida: ${nom022Compliance.Rg?.toFixed(2)} Ω
      • Límite requerido: <10 Ω
      • Estado: ${nom022Compliance.complies ? '✅ CUMPLE' : '❌ NO CUMPLE'}
      • Capa de grava (≥0.10m): ${nom022Compliance.hasGravelLayer ? '✅ Sí' : '❌ No'}
      
      2. NMX-J-549-ANCE-2005 (Pararrayos SPTE)
      ------------------------------------------
      • Sistema de pararrayos: ${nmx549Compliance.hasLightningRod ? '✅ Instalado' : '⚠ No instalado'}
      • Nivel de protección: ${nmx549Compliance.protectionLevel}
      • Radio de protección: ${nmx549Compliance.protectionRadius} m
      • Electrodos requeridos: ${nmx549Compliance.requiredRods}
      • Electrodos instalados: ${params?.numRods || 0}
      • Longitud de electrodos (mín 2.40m): ${nmx549Compliance.rodLengthOK ? '✅' : '❌'}
      
      3. Recomendaciones
      ------------------
      ${!nom022Compliance.complies ? '• Aumentar la resistencia de tierra a <10Ω' : ''}
      ${!nom022Compliance.hasGravelLayer ? '• Instalar capa de grava de 0.10m mínimo' : ''}
      ${!nmx549Compliance.hasLightningRod ? '• Instalar sistema de pararrayos según NMX-J-549' : ''}
      ${!nmx549Compliance.hasEnoughRods ? `• Agregar ${nmx549Compliance.requiredRods - (params?.numRods || 0)} electrodos más` : ''}
      ${!nmx549Compliance.rodLengthOK ? '• Reemplazar electrodos con longitud ≥2.40m' : ''}
    `;
    
    // Crear blob para descargar
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cumplimiento-normativo-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Colores
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
    textSecondary: darkMode ? 'text-gray-100' : 'text-gray-600',
    border: 'border-gray-200',
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600'
  };

  return (
    <div className={`p-4 rounded-lg ${colors.bg} shadow-md`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${colors.text} flex items-center gap-2`}>
          <Shield size={20} /> Cumplimiento Normativo Mexicano
        </h3>
        <button
          onClick={generateComplianceReport}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-2"
        >
          <Download size={14} /> Descargar Reporte
        </button>
      </div>
      
      {/* Pestañas de normas */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveNormative('NOM-022')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            activeNormative === 'NOM-022'
              ? `border-b-2 border-blue-500 text-blue-600 ${darkMode ? 'text-blue-400' : ''}`
              : darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          📋 NOM-022-STPS-2015
        </button>
        <button
          onClick={() => setActiveNormative('NMX-549')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            activeNormative === 'NMX-549'
              ? `border-b-2 border-blue-500 text-blue-600 ${darkMode ? 'text-blue-400' : ''}`
              : darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          ⚡ NMX-J-549-ANCE-2005
        </button>
        <button
          onClick={() => setActiveNormative('IEEE-80')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            activeNormative === 'IEEE-80'
              ? `border-b-2 border-blue-500 text-blue-600 ${darkMode ? 'text-blue-400' : ''}`
              : darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          🔌 IEEE 80-2013
        </button>
      </div>
      
      {/* Contenido NOM-022-STPS-2015 */}
      {activeNormative === 'NOM-022' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            <h4 className={`font-semibold mb-3 ${colors.text}`}>
              Electricidad Estática en Centros de Trabajo
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Resistencia de tierra */}
              <div className={`p-3 rounded-lg ${nom022Compliance.complies ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-black dark:text-white">Resistencia de Tierra</span>
                  {nom022Compliance.complies ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <XCircle className="text-red-600" size={20} />
                  )}
                </div>
                <div className="text-2xl font-bold mt-1 text-black dark:text-white">
                  {nom022Compliance.Rg?.toFixed(2)} Ω
                </div>
                <div className="text-xs mt-1 text-black dark:text-white">
                  Límite NOM-022: &lt;10 Ω
                </div>
                <div className="text-xs mt-1 text-black dark:text-white">
                  Margen: {nom022Compliance.margin} Ω
                </div>
              </div>
              
              {/* Capa de grava */}
              <div className={`p-3 rounded-lg ${nom022Compliance.hasGravelLayer ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-black dark:text-white">Capa Superficial (Grava)</span>
                  {nom022Compliance.hasGravelLayer ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <AlertTriangle className="text-yellow-600" size={20} />
                  )}
                </div>
                <div className="text-lg font-bold mt-1 text-black dark:text-white">
                  {params?.surfaceLayer?.toLocaleString()} Ω·m
                </div>
                <div className="text-xs mt-1 text-black dark:text-white">
                  Espesor: {params?.surfaceDepth} m
                </div>
                <div className="text-xs mt-1 text-black dark:text-white">
                  NOM-022 requiere ≥0.10m de grava
                </div>
              </div>
            </div>
            
            {/* Resumen NOM-022 */}
            <div className={`mt-4 p-3 rounded-lg ${nom022Compliance.complies && nom022Compliance.hasGravelLayer ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              <div className="flex items-center gap-2">
                {nom022Compliance.complies && nom022Compliance.hasGravelLayer ? (
                  <CheckCircle className="text-green-600" size={24} />
                ) : (
                  <XCircle className="text-red-600" size={24} />
                )}
                <div>
                  <div className="font-semibold text-black dark:text-white">
                    {nom022Compliance.complies && nom022Compliance.hasGravelLayer 
                      ? '✅ Instalación CUMPLE con NOM-022-STPS-2015'
                      : '❌ Instalación NO CUMPLE con NOM-022-STPS-2015'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {!nom022Compliance.complies && '• Resistencia de tierra debe ser <10Ω\n'}
                    {!nom022Compliance.hasGravelLayer && '• Instalar capa de grava de 0.10m mínimo'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Requisitos de medición periódica */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            <h4 className={`font-semibold mb-2 ${colors.text}`}>📊 Medición Periódica Obligatoria</h4>
            <p className="text-sm text-gray-500 mb-3">
              Según NOM-022-STPS-2015, se debe medir la resistencia de tierra periódicamente y registrar los valores.
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className={`p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                <span className="text-gray-500">Última medición:</span>
                <span className="ml-2 font-semibold">{new Date().toLocaleDateString()}</span>
              </div>
              <div className={`p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                <span className="text-gray-500">Próxima medición:</span>
                <span className="ml-2 font-semibold">
                  {new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Contenido NMX-J-549-ANCE-2005 */}
      {activeNormative === 'NMX-549' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            <div className="flex justify-between items-center mb-3">
              <h4 className={`font-semibold ${colors.text}`}>
                Sistema de Protección Contra Tormentas Eléctricas (SPTE)
              </h4>
              <label className="flex items-center gap-2">
                <span className="text-sm">Nivel de protección:</span>
                <select
                  value={lightningProtectionLevel}
                  onChange={(e) => setLightningProtectionLevel(e.target.value)}
                  className={`px-2 py-1 text-sm rounded border ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'}`}
                >
                  <option value="I">Nivel I - Máxima (edificios con explosivos)</option>
                  <option value="II">Nivel II - Alta (industrias químicas)</option>
                  <option value="III">Nivel III - Estándar (edificios comunes)</option>
                  <option value="IV">Nivel IV - Básica (estructuras sin riesgo)</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estado del sistema */}
              <div className={`p-3 rounded-lg ${nmx549Compliance.hasLightningRod ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-black dark:text-white">Sistema de Pararrayos</span>
                  {nmx549Compliance.hasLightningRod ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <AlertTriangle className="text-yellow-600" size={20} />
                  )}
                </div>
                <div className="text-lg font-bold mt-1 text-black dark:text-white">
                  {nmx549Compliance.hasLightningRod ? 'INSTALADO' : 'NO INSTALADO'}
                </div>
                <div className="text-xs mt-1 text-black dark:text-white">
                  NMX-J-549 requiere SPTE para estructuras con riesgo
                </div>
              </div>

              {/* Radio de protección */}
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-black dark:text-white">Radio de Protección</span>
                  <Zap size={16} className="text-blue-600" />
                </div>
                <div className="text-2xl font-bold mt-1 text-black dark:text-white">
                  {nmx549Compliance.protectionRadius} m
                </div>
                <div className="text-xs mt-1 text-black dark:text-white">
                  Nivel {nmx549Compliance.protectionLevel}: R = {nmx549Compliance.currentLevel.radius}m
                </div>
                <div className="text-xs text-black dark:text-white">
                  Altura del edificio: {nmx549Compliance.buildingHeight} m
                </div>
              </div>
            </div>

            {/* Electrodos requeridos */}
            <div className="mt-4">
              <h5 className={`font-medium mb-2 ${colors.text}`}>🔧 Electrodos de Puesta a Tierra (NMX-J-549)</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className={`p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                  <span className="text-gray-500">Requeridos:</span>
                  <span className="ml-2 font-bold">{nmx549Compliance.requiredRods}</span>
                </div>
                <div className={`p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                  <span className="text-gray-500">Instalados:</span>
                  <span className={`ml-2 font-bold ${nmx549Compliance.hasEnoughRods ? 'text-green-600' : 'text-red-600'}`}>
                    {params?.numRods || 0}
                  </span>
                </div>
                <div className={`p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                  <span className="text-gray-500">Longitud (mín 2.40m):</span>
                  <span className={`ml-2 font-bold ${nmx549Compliance.rodLengthOK ? 'text-green-600' : 'text-red-600'}`}>
                    {params?.rodLength || 0} m
                  </span>
                </div>
                <div className={`p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                  <span className="text-gray-500">Separación (≥4.80m):</span>
                  <span className={`ml-2 font-bold ${nmx549Compliance.spacingOK ? 'text-green-600' : 'text-red-600'}`}>
                    {(params?.gridLength / (params?.numRods || 1)).toFixed(1)} m
                  </span>
                </div>
              </div>
            </div>

            {/* Botón para ver método esfera rodante */}
            <button
              onClick={() => setShowSphereMethod(!showSphereMethod)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              {showSphereMethod ? '▼ Ocultar' : '▶ Mostrar'} método de esfera rodante
            </button>
            
            {showSphereMethod && (
              <div className="mt-3">
                <SphereMethodVisualization />
                <p className="text-xs text-gray-500 mt-2">
                  La esfera rodante determina las zonas protegidas por el pararrayos según NMX-J-549-ANCE-2005.
                  El radio R = {nmx549Compliance.protectionRadius}m corresponde al nivel de protección {nmx549Compliance.protectionLevel}.
                </p>
              </div>
            )}
          </div>
          
          {/* Cálculo de electrodos */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            <h4 className={`font-semibold mb-2 ${colors.text}`}>📐 Cálculo de Electrodos según NMX-J-549</h4>
            {(() => {
              const electrodes = calculateRequiredElectrodes();
              return (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Perímetro del edificio:</span>
                    <span className="font-semibold">{electrodes.baseRods * 20} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Electrodos base (cada 20m):</span>
                    <span className="font-semibold">{electrodes.baseRods}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Factor por nivel {lightningProtectionLevel}:</span>
                    <span className="font-semibold">{electrodes.multiplier}x</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-bold">Total electrodos requeridos:</span>
                    <span className="font-bold text-blue-600">{electrodes.totalRods}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Longitud mínima por electrodo:</span>
                    <span className="font-semibold">{electrodes.minRodLength} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Separación mínima:</span>
                    <span className="font-semibold">{electrodes.minSpacing} m</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      
      {/* Contenido IEEE 80 */}
      {activeNormative === 'IEEE-80' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            <h4 className={`font-semibold mb-3 ${colors.text}`}>
              IEEE 80-2013 - Subestaciones Eléctricas
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg ${calculations?.complies ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-black dark:text-white">Cumplimiento IEEE 80</span>
                  {calculations?.complies ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <XCircle className="text-red-600" size={20} />
                  )}
                </div>
                <div className="text-lg font-bold mt-1 text-black dark:text-white">
                  {calculations?.complies ? 'CUMPLE' : 'NO CUMPLE'}
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-black dark:text-white">Resistencia de Malla</span>
                </div>
                <div className="text-2xl font-bold mt-1 text-black dark:text-white">
                  {calculations?.Rg?.toFixed(2)} Ω
                </div>
                <div className="text-xs mt-1 text-black dark:text-white">
                  Objetivo: &lt;5 Ω
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className={`p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                <span className="text-gray-500">Tensión de Contacto:</span>
                <span className={`ml-2 font-bold ${calculations?.touchSafe70 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculations?.Em?.toFixed(0)} V
                </span>
                <span className="text-xs text-gray-500"> / {calculations?.Etouch70?.toFixed(0)} V</span>
              </div>
              <div className={`p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                <span className="text-gray-500">Tensión de Paso:</span>
                <span className={`ml-2 font-bold ${calculations?.stepSafe70 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculations?.Es?.toFixed(0)} V
                </span>
                <span className="text-xs text-gray-500"> / {calculations?.Estep70?.toFixed(0)} V</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Nota de obligatoriedad */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
          <FileText size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            <strong>📋 Base normativa:</strong> NOM-022-STPS-2015 (Electricidad Estática), 
            NMX-J-549-ANCE-2005 (Pararrayos SPTE), IEEE 80-2013 (Subestaciones).
            El diseño debe ser validado por un ingeniero electricista con cédula profesional.
          </span>
        </p>
      </div>
    </div>
  );
};

export default MexicanNormatives;