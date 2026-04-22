import React, { useState } from 'react';
import { Zap, CheckCircle, AlertCircle, TrendingDown, Shield, Battery, Download, FileText } from 'lucide-react';

const TransformerTemplates = ({ onSelectTemplate, darkMode, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);

  // ============================================
  // PLANTILLAS PREDISEÑADAS PARA TRANSFORMADORES
  // 3 Fases 4 Hilos - 13200/220-127V
  // ACTUALIZADAS CON CRITERIO DE MALLA CUADRADA
  // ============================================
  const templates = {
    75: {
      name: 'Transformador 75 kVA',
      description: 'Para pequeñas industrias, edificios comerciales pequeños, o viviendas de hasta 20 unidades.',
      params: {
        transformerKVA: 75,
        primaryVoltage: 13200,
        secondaryVoltage: 220,
        transformerImpedance: 4.5,
        faultDuration: 0.35,
        soilResistivity: 100,
        surfaceLayer: 10000,
        surfaceDepth: 0.2,
        gridLength: 12,
        gridWidth: 12,
        gridDepth: 0.6,
        conductorDiameter: 0.01052,
        numParallel: 4,
        numParallelY: 4,
        rodLength: 2.4,
        rodDiameter: 0.015875,
        numRods: 6,
        currentDivisionFactor: 0.20,
        spacingX: 4.00,
        spacingY: 4.00
      },
      results: {
        Rg: 3.8,
        GPR: 950,
        Em: 320,
        Es: 160,
        complies: true
      },
      icon: '🏢',
      color: 'from-blue-500 to-blue-600',
      rodSpacing: 8.00,
      minRodSpacing: 4.8,
      spacingComplies: true,
      kitMaster: 'KITMASTER-100K'
    },

    112.5: {
      name: 'Transformador 112.5 kVA',
      description: 'Para medianas industrias, edificios comerciales, conjuntos habitacionales de hasta 40 viviendas.',
      params: {
        transformerKVA: 112.5,
        primaryVoltage: 13200,
        secondaryVoltage: 220,
        transformerImpedance: 5.0,
        faultDuration: 0.35,
        soilResistivity: 100,
        surfaceLayer: 10000,
        surfaceDepth: 0.2,
        gridLength: 13,
        gridWidth: 13,
        gridDepth: 0.6,
        conductorDiameter: 0.01052,
        numParallel: 4,
        numParallelY: 4,
        rodLength: 2.4,
        rodDiameter: 0.015875,
        numRods: 6,
        currentDivisionFactor: 0.18,
        spacingX: 4.33,
        spacingY: 4.33
      },
      results: {
        Rg: 3.6,
        GPR: 1100,
        Em: 360,
        Es: 180,
        complies: true
      },
      icon: '🏭',
      color: 'from-green-500 to-green-600',
      rodSpacing: 8.67,
      minRodSpacing: 4.8,
      spacingComplies: true,
      kitMaster: 'KITMASTER-400K'
    },

    150: {
      name: 'Transformador 150 kVA',
      description: 'Para industrias medianas, centros comerciales, hospitales medianos, conjuntos de hasta 60 viviendas.',
      params: {
        transformerKVA: 150,
        primaryVoltage: 13200,
        secondaryVoltage: 220,
        transformerImpedance: 5.0,
        faultDuration: 0.35,
        soilResistivity: 100,
        surfaceLayer: 10000,
        surfaceDepth: 0.2,
        gridLength: 14,
        gridWidth: 14,
        gridDepth: 0.6,
        conductorDiameter: 0.01168,  // 👈 4/0 AWG (11.68 mm)
        numParallel: 4,
        numParallelY: 4,
        rodLength: 3.0,
        rodDiameter: 0.015875,
        numRods: 6,
        currentDivisionFactor: 0.15,
        spacingX: 4.67,
        spacingY: 4.67
      },
      results: {
        Rg: 3.25,    // Ligeramente menor (mejor conductor)
        GPR: 3840,   // Ligeramente menor
        Em: 680,     // Ligeramente menor
        Es: 450,     // Ligeramente menor
        complies: true
      },
      icon: '🏥',
      color: 'from-yellow-500 to-yellow-600',
      rodSpacing: 9.33,
      minRodSpacing: 6.0,
      spacingComplies: true,
      kitMaster: 'KITMASTER-400K'
    }, // <--- COMA AGREGADA

    225: {
      name: 'Transformador 225 kVA',
      description: 'Para grandes industrias, centros comerciales grandes, hospitales, edificios de oficinas, conjuntos de hasta 100 viviendas.',
      params: {
        transformerKVA: 225,
        primaryVoltage: 13200,
        secondaryVoltage: 220,
        transformerImpedance: 5.5,
        faultDuration: 0.35,
        soilResistivity: 100,
        surfaceLayer: 10000,
        surfaceDepth: 0.2,
        gridLength: 16,
        gridWidth: 16,
        gridDepth: 0.6,
        conductorDiameter: 0.01052,
        numParallel: 5,
        numParallelY: 5,
        rodLength: 3.0,
        rodDiameter: 0.015875,
        numRods: 8,
        currentDivisionFactor: 0.15,
        spacingX: 4.00,
        spacingY: 4.00
      },
      results: {
        Rg: 2.9,
        GPR: 2800,
        Em: 520,
        Es: 280,
        complies: true
      },
      icon: '🏬',
      color: 'from-orange-500 to-orange-600',
      rodSpacing: 8.00,
      minRodSpacing: 6.0,
      spacingComplies: true,
      kitMaster: 'KITMASTER-400K'
    },

    300: {
      name: 'Transformador 300 kVA',
      description: 'Para grandes industrias, data centers, hospitales de alta especialidad, conjuntos residenciales de lujo, edificios de gran altura.',
      params: {
        transformerKVA: 300,
        primaryVoltage: 13200,
        secondaryVoltage: 220,
        transformerImpedance: 5.5,
        faultDuration: 0.35,
        soilResistivity: 100,
        surfaceLayer: 10000,
        surfaceDepth: 0.2,
        gridLength: 18,
        gridWidth: 18,
        gridDepth: 0.6,
        conductorDiameter: 0.01052,
        numParallel: 5,
        numParallelY: 5,
        rodLength: 3.0,
        rodDiameter: 0.015875,
        numRods: 10,
        currentDivisionFactor: 0.14,
        spacingX: 4.50,
        spacingY: 4.50
      },
      results: {
        Rg: 2.5,
        GPR: 3200,
        Em: 580,
        Es: 310,
        complies: true
      },
      icon: '🏛️',
      color: 'from-purple-500 to-purple-600',
      rodSpacing: 7.20,
      minRodSpacing: 6.0,
      spacingComplies: true,
      kitMaster: 'KITMASTER-1000K'
    }
  };

  // Kit Master por capacidad
  const getKitMaster = (kva) => {
    if (kva <= 75) return { name: 'KITMASTER-100K', capacity: '100 A' };
    if (kva <= 225) return { name: 'KITMASTER-400K', capacity: '400 A' };
    return { name: 'KITMASTER-1000K', capacity: '1000 A' };
  };

  const handleSelect = (kva) => {
    const template = templates[kva];
    setSelectedTemplate(kva);

    // Mostrar confirmación
    if (template && window.confirm(`¿Cargar plantilla "${template.name}"?\n\n` +
      `📐 Dimensiones de malla: ${template.params.gridLength} x ${template.params.gridWidth} m\n` +
      `🔧 Conductores: ${template.params.numParallel} × ${template.params.numParallelY || template.params.numParallel}\n` +
      `📏 Varillas: ${template.params.numRods} x ${template.params.rodLength} m\n` +
      `📊 Resistencia esperada: ${template.results.Rg} Ω\n` +
      `✅ Cumple IEEE 80: ${template.results.complies ? 'SÍ' : 'NO'}\n\n` +
      `¿Aplicar esta configuración?`)) {
      onSelectTemplate(template);
    }
  };

  const toggleExpand = (kva) => {
    setExpandedCard(expandedCard === kva ? null : kva);
  };

  const colors = darkMode ? {
    bg: 'bg-gray-800',
    card: 'bg-gray-700',
    text: 'text-white',
    textSecondary: 'text-gray-300',
    border: 'border-gray-600'
  } : {
    bg: 'bg-white',
    card: 'bg-white',
    text: 'text-gray-800',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200'
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4`}>
      <div className={`max-w-6xl w-full max-h-[85vh] overflow-auto rounded-xl shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>

        {/* Header */}
        <div className={`sticky top-0 z-10 p-4 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-t-xl`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                <Zap size={24} className="text-yellow-500" />
                Plantillas Prediseñadas para Transformadores
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                3 Fases 4 Hilos | 13,200/220-127V | IEEE 80-2013
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Grid de plantillas */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(templates).map(([kva, template]) => {
            const isSelected = selectedTemplate === parseInt(kva);
            const isExpanded = expandedCard === parseInt(kva);
            const kitInfo = getKitMaster(parseInt(kva));
            const perimeter = 2 * (template.params.gridLength + template.params.gridWidth);
            const actualRodSpacing = (perimeter / Math.max(1, template.params.numRods)).toFixed(2);
            const minSpacing = (template.params.rodLength || 3) * 2;
            const spacingOk = parseFloat(actualRodSpacing || 0) >= minSpacing;

            return (
              <div
                key={kva}
                className={`rounded-xl border transition-all duration-300 ${isSelected ? 'ring-2 ring-blue-500 scale-[1.02]' : ''
                  } ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} shadow-lg hover:shadow-xl`}
              >
                {/* Header de la tarjeta */}
                <div
                  className={`p-4 bg-gradient-to-r ${template.color} rounded-t-xl cursor-pointer`}
                  onClick={() => toggleExpand(parseInt(kva))}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{template.icon}</span>
                      <div>
                        <h3 className="text-lg font-bold text-white">{template.name}</h3>
                        <p className="text-xs text-white/80">{template.description.substring(0, 60)}...</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{kva}</div>
                      <div className="text-xs text-white/80">kVA</div>
                    </div>
                  </div>
                </div>

                {/* Contenido colapsable */}
                {isExpanded && (
                  <div className="p-4 space-y-3">
                    {/* Dimensiones de malla */}
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-gray-50'}`}>
                      <div className="text-xs font-semibold text-gray-500 mb-2">📐 DIMENSIONES DE MALLA</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Largo:</span>
                          <span className="font-semibold ml-2">{template.params.gridLength} m</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Ancho:</span>
                          <span className="font-semibold ml-2">{template.params.gridWidth} m</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Área:</span>
                          <span className="font-semibold ml-2">{template.params.gridLength * template.params.gridWidth} m²</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Profundidad:</span>
                          <span className="font-semibold ml-2">{template.params.gridDepth} m</span>
                        </div>
                      </div>
                    </div>

                    {/* Conductores */}
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-gray-50'}`}>
                      <div className="text-xs font-semibold text-gray-500 mb-2">🔧 CONDUCTORES</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Dirección X:</span>
                          <span className="font-semibold ml-2">{template.params.numParallel}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Dirección Y:</span>
                          <span className="font-semibold ml-2">{template.params.numParallelY || template.params.numParallel}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Espaciamiento X:</span>
                          <span className="font-semibold ml-2">{template.params.spacingX || template.params.spacing} m</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Espaciamiento Y:</span>
                          <span className="font-semibold ml-2">{template.params.spacingY || template.params.spacing} m</span>
                        </div>
                      </div>
                    </div>

                    {/* Varillas */}
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-gray-50'}`}>
                      <div className="text-xs font-semibold text-gray-500 mb-2">📏 VARILLAS (Electrodos)</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Cantidad:</span>
                          <span className="font-semibold ml-2">{template.params.numRods}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Longitud:</span>
                          <span className="font-semibold ml-2">{template.params.rodLength} m</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Espaciamiento actual:</span>
                          <span className={`font-semibold ml-2 ${spacingOk ? 'text-green-600' : 'text-red-600'}`}>
                            {actualRodSpacing} m
                          </span>
                          {!spacingOk && (
                            <span className="text-xs text-red-500 ml-2">
                              (mínimo: {minSpacing}m)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Kit Master */}
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                      <div className="text-xs font-semibold text-purple-600 mb-2">🟣 KIT MASTER</div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{kitInfo.name}</span>
                        <span className="text-sm">{kitInfo.capacity}</span>
                      </div>
                      <div className="text-xs text-purple-600 mt-1">
                        Para transformadores de {kva} kVA
                      </div>
                    </div>

                    {/* Resultados esperados */}
                    <div className={`p-3 rounded-lg ${template.results.complies ? (darkMode ? 'bg-green-900/30' : 'bg-green-50') : (darkMode ? 'bg-red-900/30' : 'bg-red-50')}`}>
                      <div className="text-xs font-semibold mb-2 flex items-center gap-1">
                        {template.results.complies ? (
                          <CheckCircle size={12} className="text-green-600" />
                        ) : (
                          <AlertCircle size={12} className="text-red-600" />
                        )}
                        RESULTADOS ESPERADOS
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Rg:</span>
                          <span className="font-semibold ml-2">{template.results.Rg} Ω</span>
                        </div>
                        <div>
                          <span className="text-gray-500">GPR:</span>
                          <span className="font-semibold ml-2">{template.results.GPR} V</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Em (Contacto):</span>
                          <span className="font-semibold ml-2">{template.results.Em} V</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Es (Paso):</span>
                          <span className="font-semibold ml-2">{template.results.Es} V</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs">
                        {template.results.complies ? (
                          <span className="text-green-600">✅ Cumple con IEEE 80-2013</span>
                        ) : (
                          <span className="text-red-600">⚠️ No cumple con IEEE 80-2013</span>
                        )}
                      </div>
                    </div>

                    {/* Botón de carga */}
                    <button
                      onClick={() => handleSelect(parseInt(kva))}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Cargar Plantilla
                    </button>
                  </div>
                )}

                {/* Indicador de colapsado */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {isExpanded ? '▼ Mostrando detalles' : '▶ Click para expandir'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${template.results.complies ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                    <span className="text-xs">{template.results.complies ? 'Cumple IEEE 80' : 'No cumple IEEE 80'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Notas y recomendaciones */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} rounded-b-xl`}>
          <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
            <Shield size={16} /> Notas importantes
          </h4>
          <ul className="text-xs space-y-1 text-gray-500">
            <li>• Las dimensiones están calculadas para suelo de resistividad 100 Ω·m (suelo de buena calidad).</li>
            <li>• Para suelos de mayor resistividad, se deben ajustar las dimensiones o agregar más varillas.</li>
            <li>• El espaciamiento entre varillas debe ser al menos 2 veces la longitud de la varilla según NMX-J-549.</li>
            <li>• Se recomienda instalar capa superficial de grava de 0.20m y 10,000 Ω·m para protección de personas.</li>
            <li>• El Kit Master es recomendable para transformadores &gt;150 kVA en sistemas con equipos electrónicos sensibles.</li>
          </ul>

          <div className="mt-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Battery size={14} className="text-blue-500" />
              <span className="text-xs text-gray-500">Diseñado según IEEE 80-2013 y NMX-J-549-ANCE-2005</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransformerTemplates;