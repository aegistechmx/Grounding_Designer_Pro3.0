import React, { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const GroundingCalculations = () => {
  const [params, setParams] = useState({
    // Datos del sistema
    transformerKVA: 225,
    primaryVoltage: 13200,
    faultCurrent: 0, // Se calculará
    faultDuration: 0.5, // segundos
    
    // Datos del suelo
    soilResistivity: 100, // ohm-m
    surfaceLayer: 3000, // ohm-m (grava)
    surfaceDepth: 0.1, // m
    
    // Datos de la malla
    gridLength: 12.5, // 9.5 + 2(1.5)
    gridWidth: 8.0, // 5.0 + 2(1.5)
    gridDepth: 0.5,
    conductorDiameter: 0.01024, // 2/0 AWG en metros
    numParallel: 2,
    rodLength: 3,
    rodDiameter: 0.015875, // 5/8" en metros
    numRods: 14,
    
    // Datos de persona
    bodyWeight: 70 // kg
  });

  const updateParam = (key, value) => {
    setParams(prev => ({...prev, [key]: parseFloat(value) || value}));
  };

  // Cálculos según IEEE 80
  const calculations = useMemo(() => {
    const results = {};
    
    // 1. Corriente de falla a tierra (simplificado)
    // Para transformador: If ≈ kVA / (√3 × V secundario) × factor
    results.faultCurrent = params.faultCurrent || 
      ((params.transformerKVA * 1000) / (Math.sqrt(3) * 220)) * 3; // Factor conservador
    
    // 2. Corriente máxima de malla (considerando división de corriente)
    // Ig = Df × If (Df = factor de decremento)
    const Df = 1.0; // Simplificado para fallas sostenidas
    results.Ig = Df * results.faultCurrent;
    
    // 3. Voltajes tolerables (Paso y Contacto)
    const Cs = 1 - (0.09 * (1 - params.soilResistivity / params.surfaceLayer)) / 
                (2 * params.surfaceDepth + 0.09);
    
    // Voltaje de paso tolerable
    results.Estep50 = (1000 + 6 * Cs * params.surfaceLayer) * 
                       (0.116 / Math.sqrt(params.faultDuration));
    results.Estep70 = (1000 + 6 * Cs * params.surfaceLayer) * 
                       (0.157 / Math.sqrt(params.faultDuration));
    
    // Voltaje de contacto tolerable
    results.Etouch50 = (1000 + 1.5 * Cs * params.surfaceLayer) * 
                        (0.116 / Math.sqrt(params.faultDuration));
    results.Etouch70 = (1000 + 1.5 * Cs * params.surfaceLayer) * 
                        (0.157 / Math.sqrt(params.faultDuration));
    
    // 4. Resistencia de la malla
    const A = params.gridLength * params.gridWidth;
    const perimeter = 2 * (params.gridLength + params.gridWidth);
    const totalConductorLength = perimeter * params.numParallel;
    const totalRodLength = params.numRods * params.rodLength;
    
    // Resistencia de malla (fórmula simplificada Sverak)
    const LT = totalConductorLength + totalRodLength;
    results.Rg = params.soilResistivity * (1/LT + 1/Math.sqrt(20*A)) * 
                 (1 + 1/(1 + params.gridDepth * Math.sqrt(20/A)));
    
    // 5. Elevación de potencial de malla (GPR)
    results.GPR = results.Ig * results.Rg;
    
    // 6. Voltaje de malla (Em) - método simplificado
    const Km = 1 / (2 * Math.PI) * 
               (Math.log(Math.pow(params.gridLength * params.gridWidth / LT, 2) + 
                (params.gridDepth + params.rodLength) / params.gridDepth) + 
                (params.gridLength / params.gridWidth + params.gridWidth / params.gridLength) / 2);
    
    const Ki = 0.644 + 0.148 * params.numParallel; // Factor geométrico simplificado
    
    results.Em = (params.soilResistivity * results.Ig * Km * Ki) / LT;
    
    // 7. Voltaje de paso (Es) - método simplificado
    const Ks = 1 / Math.PI * (1 / (2 * params.gridDepth) + 
               1 / (params.gridLength + params.gridDepth) + 
               1 / (params.gridWidth + params.gridDepth));
    
    results.Es = (params.soilResistivity * results.Ig * Ks * Ki) / LT;
    
    // 8. Verificaciones de seguridad
    results.touchSafe50 = results.Em < results.Etouch50;
    results.touchSafe70 = results.Em < results.Etouch70;
    results.stepSafe50 = results.Es < results.Estep50;
    results.stepSafe70 = results.Es < results.Estep70;
    
    // 9. Parámetros adicionales
    results.totalConductor = totalConductorLength;
    results.totalRodLength = totalRodLength;
    results.gridArea = A;
    results.Cs = Cs;
    
    return results;
  }, [params]);

  const SafetyIndicator = ({ safe, label }) => (
    <div className={`flex items-center gap-2 p-2 rounded ${safe ? 'bg-green-100' : 'bg-red-100'}`}>
      {safe ? <CheckCircle className="text-green-600" size={20} /> : <XCircle className="text-red-600" size={20} />}
      <span className={`text-sm font-medium ${safe ? 'text-green-800' : 'text-red-800'}`}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Cálculos de Malla de Tierras según IEEE 80
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Panel de entrada - Sistema Eléctrico */}
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">⚡ Sistema Eléctrico</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transformador (kVA)
                  </label>
                  <input
                    type="number"
                    value={params.transformerKVA}
                    onChange={(e) => updateParam('transformerKVA', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voltaje Primario (V)
                  </label>
                  <input
                    type="number"
                    value={params.primaryVoltage}
                    onChange={(e) => updateParam('primaryVoltage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corriente de falla (A) - dejar en 0 para calcular
                  </label>
                  <input
                    type="number"
                    value={params.faultCurrent}
                    onChange={(e) => updateParam('faultCurrent', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0 = auto"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Calculada: {calculations.faultCurrent.toFixed(0)} A
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duración de falla (s)
                  </label>
                  <input
                    type="number"
                    value={params.faultDuration}
                    onChange={(e) => updateParam('faultDuration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    step="0.1"
                    min="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Características del suelo */}
            <div className="bg-amber-50 p-4 rounded-lg">
              <h3 className="font-semibold text-amber-900 mb-3">🌍 Características del Suelo</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resistividad del suelo (Ω·m)
                  </label>
                  <input
                    type="number"
                    value={params.soilResistivity}
                    onChange={(e) => updateParam('soilResistivity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Típico: 50-200 (húmedo), 200-1000 (seco)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resistividad capa superficial (Ω·m)
                  </label>
                  <input
                    type="number"
                    value={params.surfaceLayer}
                    onChange={(e) => updateParam('surfaceLayer', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Grava: 3000, Asfalto: 2000-5000
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Espesor capa superficial (m)
                  </label>
                  <input
                    type="number"
                    value={params.surfaceDepth}
                    onChange={(e) => updateParam('surfaceDepth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Panel de entrada - Configuración de Malla */}
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-3">📐 Configuración de Malla</h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Largo (m)
                    </label>
                    <input
                      type="number"
                      value={params.gridLength}
                      onChange={(e) => updateParam('gridLength', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ancho (m)
                    </label>
                    <input
                      type="number"
                      value={params.gridWidth}
                      onChange={(e) => updateParam('gridWidth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      step="0.5"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profundidad (m)
                  </label>
                  <input
                    type="number"
                    value={params.gridDepth}
                    onChange={(e) => updateParam('gridDepth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conductores paralelos
                  </label>
                  <input
                    type="number"
                    value={params.numParallel}
                    onChange={(e) => updateParam('numParallel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                    max="3"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Núm. Varillas
                    </label>
                    <input
                      type="number"
                      value={params.numRods}
                      onChange={(e) => updateParam('numRods', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Long. Varilla (m)
                    </label>
                    <input
                      type="number"
                      value={params.rodLength}
                      onChange={(e) => updateParam('rodLength', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      step="0.3"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Información del diseño */}
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">📊 Información del Diseño</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Área de malla:</span>
                  <span className="font-semibold">{calculations.gridArea?.toFixed(1)} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conductor total:</span>
                  <span className="font-semibold">{calculations.totalConductor?.toFixed(1)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Long. varillas:</span>
                  <span className="font-semibold">{calculations.totalRodLength?.toFixed(1)} m</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 Resultados de Cálculos</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Resistencia de Malla</div>
              <div className="text-2xl font-bold text-blue-600">{calculations.Rg?.toFixed(2)} Ω</div>
              <div className="text-xs text-gray-500 mt-1">
                {calculations.Rg < 5 ? '✓ Excelente' : calculations.Rg < 10 ? '✓ Buena' : '⚠ Mejorar'}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">GPR (Elevación de Potencial)</div>
              <div className="text-2xl font-bold text-purple-600">{calculations.GPR?.toFixed(0)} V</div>
              <div className="text-xs text-gray-500 mt-1">Ground Potential Rise</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Corriente de Falla</div>
              <div className="text-2xl font-bold text-red-600">{calculations.Ig?.toFixed(0)} A</div>
              <div className="text-xs text-gray-500 mt-1">Corriente máxima de malla</div>
            </div>
          </div>

          {/* Verificación de Seguridad */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-semibold text-gray-800 mb-3">Verificación de Seguridad IEEE 80</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Persona 50 kg:</div>
                <div className="space-y-2">
                  <SafetyIndicator 
                    safe={calculations.touchSafe50} 
                    label={`Contacto: ${calculations.Em?.toFixed(0)}V < ${calculations.Etouch50?.toFixed(0)}V`}
                  />
                  <SafetyIndicator 
                    safe={calculations.stepSafe50} 
                    label={`Paso: ${calculations.Es?.toFixed(0)}V < ${calculations.Estep50?.toFixed(0)}V`}
                  />
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Persona 70 kg:</div>
                <div className="space-y-2">
                  <SafetyIndicator 
                    safe={calculations.touchSafe70} 
                    label={`Contacto: ${calculations.Em?.toFixed(0)}V < ${calculations.Etouch70?.toFixed(0)}V`}
                  />
                  <SafetyIndicator 
                    safe={calculations.stepSafe70} 
                    label={`Paso: ${calculations.Es?.toFixed(0)}V < ${calculations.Estep70?.toFixed(0)}V`}
                  />
                </div>
              </div>
            </div>

            {/* Estado general */}
            {calculations.touchSafe70 && calculations.stepSafe70 ? (
              <div className="bg-green-100 border border-green-400 rounded-lg p-3 flex items-start gap-2">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <div className="font-semibold text-green-800">✓ Diseño CUMPLE con IEEE 80</div>
                  <div className="text-sm text-green-700 mt-1">
                    Los voltajes de paso y contacto están dentro de los límites seguros.
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-100 border border-red-400 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <div className="font-semibold text-red-800">⚠ Diseño NO CUMPLE con IEEE 80</div>
                  <div className="text-sm text-red-700 mt-1">
                    Se requieren mejoras: agregar más varillas, aumentar conductores paralelos, o mejorar resistividad del suelo.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">💡 Recomendaciones:</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Si Rg {'>'} 5Ω: agregar más varillas o tratamiento químico al suelo</li>
            <li>• Si no cumple seguridad: aumentar conductores paralelos o reducir espaciamiento</li>
            <li>• Verificar conexión a neutro del transformador con conductor 2/0 AWG mínimo</li>
            <li>• Realizar prueba de resistencia después de instalación (método de caída de potencial)</li>
            <li>• Considerar electrodos adicionales si resistividad {'>'} 200 Ω·m</li>
            <li>• Instalar registro de inspección para mantenimiento futuro</li>
          </ul>
        </div>

        {/* Notas importantes */}
        <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4">
          <h4 className="font-semibold text-blue-900 mb-2">📝 Notas Importantes:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Estos cálculos son simplificados según IEEE 80</li>
            <li>• Se recomienda estudio completo por ingeniero especializado</li>
            <li>• La resistividad del suelo debe medirse in-situ (método Wenner)</li>
            <li>• Valores de corriente de falla deben obtenerse de estudio de cortocircuito</li>
            <li>• Cumplir con NOM-001-SEDE y códigos locales aplicables</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GroundingCalculations;