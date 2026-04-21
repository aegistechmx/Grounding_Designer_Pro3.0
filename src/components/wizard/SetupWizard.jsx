import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X, User, Building2, ClipboardList, Settings, Shield, FileText } from 'lucide-react';

const SetupWizard = ({ onComplete, darkMode, onClose }) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    // Datos del Proyecto (NUEVO)
    projectName: '',
    projectLocation: '',
    clientName: '',
    engineerName: '',
    projectDate: new Date().toISOString().split('T')[0],
    
    // Datos del Transformador
    transformerKVA: 75,
    transformerImpedance: 5,
    primaryVoltage: 13200,
    secondaryVoltage: 220,
    
    // Características del Suelo
    soilResistivity: 100,
    surfaceLayer: 3000,
    surfaceDepth: 0.15,
    
    // Corrección de Resistividad (NUEVO)
    temperature: 20,
    humidity: 'normal',
    measureMonth: new Date().getMonth() + 1,
    region: 'templado',
    
    // Configuración de Malla
    gridLength: 30,
    gridWidth: 16,
    gridDepth: 0.6,
    numParallel: 12,
    numRods: 25,
    rodLength: 3,
    faultDuration: 0.3,
    currentDivisionFactor: 0.25
  });

  const steps = [
    { number: 1, title: 'Proyecto', icon: <ClipboardList size={18} /> },
    { number: 2, title: 'Transformador', icon: <Settings size={18} /> },
    { number: 3, title: 'Suelo', icon: <Shield size={18} /> },
    { number: 4, title: 'Malla', icon: <FileText size={18} /> },
    { number: 5, title: 'Verificación', icon: <Check size={18} /> }
  ];

  const handleNext = () => {
    if (step < steps.length) setStep(step + 1);
    else onComplete(config);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const safeParseFloat = (value, defaultValue = 0) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  const safeParseInt = (value, defaultValue = 0) => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList size={24} className="text-blue-500" />
              <h3 className="text-lg font-semibold">Datos del Proyecto</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  📋 Nombre del Proyecto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={config.projectName}
                  onChange={(e) => setConfig({...config, projectName: e.target.value})}
                  placeholder="Ej: Subestación Norte, Planta Industrial, etc."
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
                <p className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-1`}>Identificador único del proyecto</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  📍 Ubicación del Proyecto
                </label>
                <input
                  type="text"
                  value={config.projectLocation}
                  onChange={(e) => setConfig({...config, projectLocation: e.target.value})}
                  placeholder="Ej: Ciudad, Estado, País"
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  🏢 Cliente / Empresa
                </label>
                <input
                  type="text"
                  value={config.clientName}
                  onChange={(e) => setConfig({...config, clientName: e.target.value})}
                  placeholder="Nombre del cliente o empresa"
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    👨‍💻 Ingeniero Responsable <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.engineerName}
                    onChange={(e) => setConfig({...config, engineerName: e.target.value})}
                    placeholder="Nombre completo"
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    📅 Fecha
                  </label>
                  <input
                    type="date"
                    value={config.projectDate}
                    onChange={(e) => setConfig({...config, projectDate: e.target.value})}
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} mt-4`}>
              <p className="text-sm flex items-center gap-2">
                <User size={16} className="text-blue-500" />
                <span>💡 Esta información aparecerá en los reportes y certificados</span>
              </p>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings size={24} className="text-blue-500" />
              <h3 className="text-lg font-semibold">Datos del Transformador</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Potencia (kVA)</label>
                <input
                  type="number"
                  value={config.transformerKVA}
                  onChange={(e) => setConfig({...config, transformerKVA: safeParseFloat(e.target.value, 75)})}
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
                <p className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-1`}>Rango típico: 25 - 10,000 kVA</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Voltaje Primario (V)</label>
                  <input
                    type="number"
                    value={config.primaryVoltage}
                    onChange={(e) => setConfig({...config, primaryVoltage: safeParseFloat(e.target.value, 13200)})}
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Voltaje Secundario (V)</label>
                  <input
                    type="number"
                    value={config.secondaryVoltage}
                    onChange={(e) => setConfig({...config, secondaryVoltage: safeParseFloat(e.target.value, 220)})}
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Impedancia (%Z)</label>
                <input
                  type="number"
                  value={config.transformerImpedance}
                  onChange={(e) => setConfig({...config, transformerImpedance: safeParseFloat(e.target.value, 5)})}
                  step="0.5"
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
                <p className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-1`}>Típico: 5-7% para transformadores de distribución</p>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={24} className="text-blue-500" />
              <h3 className="text-lg font-semibold">Características del Suelo</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Resistividad del suelo (Ω·m)</label>
                <input
                  type="number"
                  value={config.soilResistivity}
                  onChange={(e) => setConfig({...config, soilResistivity: safeParseFloat(e.target.value, 100)})}
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
                <p className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-1`}>Típico: 50-200 (húmedo), 200-1000 (seco)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Resistividad capa superficial (Ω·m)</label>
                <input
                  type="number"
                  value={config.surfaceLayer}
                  onChange={(e) => setConfig({...config, surfaceLayer: safeParseFloat(e.target.value, 3000)})}
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
                <p className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-1`}>Grava: 3000, Asfalto: 2000-5000</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Espesor capa superficial (m)</label>
                <input
                  type="number"
                  value={config.surfaceDepth}
                  onChange={(e) => setConfig({...config, surfaceDepth: safeParseFloat(e.target.value, 0.15)})}
                  step="0.01"
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
                <p className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-1`}>Típico: 0.10 - 0.20 m</p>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-amber-900/30' : 'bg-amber-50'} mt-4`}>
              <p className="text-sm">💡 La capa superficial de alta resistividad protege a las personas contra tensiones de contacto y paso</p>
            </div>
            
            <div className="border-t pt-3 mt-4">
              <h4 className="font-semibold text-sm mb-3">🌡️ Corrección de Resistividad (Opcional)</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Temperatura (°C)</label>
                  <input
                    type="number"
                    value={config.temperature || 20}
                    onChange={(e) => setConfig({...config, temperature: safeParseFloat(e.target.value, 20)})}
                    step="1"
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                  <p className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-1`}>Temperatura durante la medición</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">💧 Humedad</label>
                  <select
                    value={config.humidity || 'normal'}
                    onChange={(e) => setConfig({...config, humidity: e.target.value})}
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  >
                    <option value="seco">Seco</option>
                    <option value="normal">Normal</option>
                    <option value="humedo">Húmedo</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium mb-1">📅 Mes de medición</label>
                  <select
                    value={config.measureMonth || new Date().getMonth() + 1}
                    onChange={(e) => setConfig({...config, measureMonth: safeParseInt(e.target.value, new Date().getMonth() + 1)})}
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  >
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8">Agosto</option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">📍 Región</label>
                  <select
                    value={config.region || 'templado'}
                    onChange={(e) => setConfig({...config, region: e.target.value})}
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  >
                    <option value="tropical">Tropical (Costas, Sureste)</option>
                    <option value="templado">Templado (Centro)</option>
                    <option value="frio">Frío (Norte, Montañas)</option>
                    <option value="seco">Seco (Desierto)</option>
                  </select>
                </div>
              </div>
              
              <div className={`mt-3 p-2 rounded ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} text-xs`}>
                <p>💡 La resistividad medida se corregirá automáticamente según temperatura, humedad y época del año para obtener un valor más representativo para el diseño.</p>
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={24} className="text-blue-500" />
              <h3 className="text-lg font-semibold">Configuración de la Malla</h3>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Largo (m)</label>
                  <input
                    type="number"
                    value={config.gridLength}
                    onChange={(e) => setConfig({...config, gridLength: safeParseFloat(e.target.value, 30)})}
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ancho (m)</label>
                  <input
                    type="number"
                    value={config.gridWidth}
                    onChange={(e) => setConfig({...config, gridWidth: safeParseFloat(e.target.value, 16)})}
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Profundidad de la malla (m)</label>
                <input
                  type="number"
                  value={config.gridDepth}
                  onChange={(e) => setConfig({...config, gridDepth: safeParseFloat(e.target.value, 0.6)})}
                  step="0.1"
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
                <p className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-1`}>Típico: 0.5 - 1.0 m</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Conductores paralelos</label>
                <input
                  type="number"
                  value={config.numParallel}
                  onChange={(e) => setConfig({...config, numParallel: safeParseInt(e.target.value, 12)})}
                  className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
                <p className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-1`}>Mínimo 2, máximo 20</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Número de varillas</label>
                  <input
                    type="number"
                    value={config.numRods}
                    onChange={(e) => setConfig({...config, numRods: safeParseInt(e.target.value, 25)})}
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Longitud de varilla (m)</label>
                  <input
                    type="number"
                    value={config.rodLength}
                    onChange={(e) => setConfig({...config, rodLength: safeParseFloat(e.target.value, 3)})}
                    step="0.3"
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Tiempo de falla (s)</label>
                  <input
                    type="number"
                    value={config.faultDuration}
                    onChange={(e) => setConfig({...config, faultDuration: safeParseFloat(e.target.value, 0.3)})}
                    step="0.05"
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Factor Sf</label>
                  <input
                    type="number"
                    value={config.currentDivisionFactor}
                    onChange={(e) => setConfig({...config, currentDivisionFactor: safeParseFloat(e.target.value, 0.25)})}
                    step="0.01"
                    className={`w-full px-3 py-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Check size={24} className="text-blue-500" />
              <h3 className="text-lg font-semibold">Verificación Final</h3>
            </div>
            
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <ClipboardList size={18} /> Datos del Proyecto
              </h4>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Proyecto:</strong> {config.projectName || 'Sin especificar'}</li>
                <li>• <strong>Ubicación:</strong> {config.projectLocation || 'Sin especificar'}</li>
                <li>• <strong>Cliente:</strong> {config.clientName || 'Sin especificar'}</li>
                <li>• <strong>Ingeniero:</strong> {config.engineerName || 'Sin especificar'}</li>
                <li>• <strong>Fecha:</strong> {config.projectDate}</li>
              </ul>
            </div>
            
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <Settings size={18} /> Parámetros Técnicos
              </h4>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Transformador:</strong> {config.transformerKVA} kVA, {config.primaryVoltage}/{config.secondaryVoltage} V, {config.transformerImpedance}%</li>
                <li>• <strong>Suelo:</strong> {config.soilResistivity} Ω·m, Capa: {config.surfaceLayer} Ω·m / {config.surfaceDepth}m</li>
                <li>• <strong>Malla:</strong> {config.gridLength} × {config.gridWidth} m, {config.numParallel} conductores</li>
                <li>• <strong>Varillas:</strong> {config.numRods} × {config.rodLength} m</li>
                <li>• <strong>Falla:</strong> {config.faultDuration}s, Sf={config.currentDivisionFactor}</li>
              </ul>
            </div>
            
            <button
              onClick={() => onComplete(config)}
              className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Check size={18} /> Aplicar Configuración
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl border-b-2 border-blue-600`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">⚡ Grounding Designer Pro - Asistente de Configuración</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-6">
          {steps.map(s => (
            <div key={s.number} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                step >= s.number 
                  ? 'bg-blue-600 text-white' 
                  : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
              }`}>
                {step > s.number ? <Check size={14} /> : s.icon}
              </div>
              <div className="text-xs mt-1">{s.title}</div>
            </div>
          ))}
        </div>
        
        <div className="min-h-[300px]">
          {renderStep()}
        </div>
        
        <div className="flex justify-between mt-4 pt-4 border-t">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${
              step === 1 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            {step === steps.length ? 'Finalizar' : 'Siguiente'} <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;