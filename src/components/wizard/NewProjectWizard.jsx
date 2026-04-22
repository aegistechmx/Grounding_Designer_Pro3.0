// src/components/wizard/NewProjectWizard.jsx
import React, { useState } from 'react';
import { 
  Zap, Shield, Activity, Battery, TrendingUp, CheckCircle, 
  ChevronRight, ChevronLeft, X, Home, Building, Factory, 
  Hotel, Database, Cloud, Settings, Save, FileText 
} from 'lucide-react';

const steps = [
  { id: 'welcome', title: 'Bienvenido', icon: Home },
  { id: 'project', title: 'Datos del Proyecto', icon: FileText },
  { id: 'electrical', title: 'Sistema Eléctrico', icon: Zap },
  { id: 'soil', title: 'Características del Suelo', icon: Activity },
  { id: 'grid', title: 'Configuración de Malla', icon: Battery },
  { id: 'review', title: 'Revisión', icon: CheckCircle },
];

const projectTemplates = {
  residential: {
    name: 'Residencial',
    icon: Home,
    description: 'Casa habitación, departamentos',
    params: {
      voltageLevel: 220,
      faultCurrent: 5000,
      faultDuration: 0.5,
      soilResistivity: 150,
      surfaceLayer: 3000,
      surfaceDepth: 0.1,
      gridLength: 8,
      gridWidth: 6,
      gridDepth: 0.5,
      numParallel: 6,
      numRods: 8,
      rodLength: 2.4
    }
  },
  commercial: {
    name: 'Comercial',
    icon: Building,
    description: 'Centro comercial, oficinas',
    params: {
      voltageLevel: 480,
      faultCurrent: 15000,
      faultDuration: 0.35,
      soilResistivity: 100,
      surfaceLayer: 3000,
      surfaceDepth: 0.15,
      gridLength: 12,
      gridWidth: 10,
      gridDepth: 0.6,
      numParallel: 8,
      numRods: 12,
      rodLength: 3
    }
  },
  industrial: {
    name: 'Industrial',
    icon: Factory,
    description: 'Planta industrial, fábrica',
    params: {
      voltageLevel: 13200,
      faultCurrent: 25000,
      faultDuration: 0.25,
      soilResistivity: 80,
      surfaceLayer: 5000,
      surfaceDepth: 0.2,
      gridLength: 20,
      gridWidth: 15,
      gridDepth: 0.8,
      numParallel: 12,
      numRods: 20,
      rodLength: 3.5
    }
  },
  hospital: {
    name: 'Hospital',
    icon: Hotel,
    description: 'Centro médico, clínica',
    params: {
      voltageLevel: 480,
      faultCurrent: 12000,
      faultDuration: 0.2,
      soilResistivity: 120,
      surfaceLayer: 10000,
      surfaceDepth: 0.25,
      gridLength: 15,
      gridWidth: 12,
      gridDepth: 0.7,
      numParallel: 10,
      numRods: 16,
      rodLength: 3
    }
  },
  dataCenter: {
    name: 'Data Center',
    icon: Database,
    description: 'Centro de datos, servidores',
    params: {
      voltageLevel: 480,
      faultCurrent: 20000,
      faultDuration: 0.15,
      soilResistivity: 60,
      surfaceLayer: 10000,
      surfaceDepth: 0.3,
      gridLength: 18,
      gridWidth: 14,
      gridDepth: 0.9,
      numParallel: 14,
      numRods: 24,
      rodLength: 3.5
    }
  },
  substation: {
    name: 'Subestación',
    icon: Zap,
    description: 'Subestación eléctrica',
    params: {
      voltageLevel: 34500,
      faultCurrent: 40000,
      faultDuration: 0.2,
      soilResistivity: 50,
      surfaceLayer: 5000,
      surfaceDepth: 0.3,
      gridLength: 30,
      gridWidth: 25,
      gridDepth: 1.0,
      numParallel: 16,
      numRods: 32,
      rodLength: 4
    }
  }
};

export const NewProjectWizard = ({ isOpen, onClose, onComplete, darkMode }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    engineerName: '',
    clientName: '',
    location: '',
    // Sistema Eléctrico
    voltageLevel: 13200,
    faultCurrent: 1771,
    faultDuration: 0.35,
    currentDivisionFactor: 0.15,
    // Características del Suelo
    soilResistivity: 100,
    surfaceLayer: 3000,
    surfaceDepth: 0.1,
    soilMoisture: 0.25,
    // Configuración de Malla
    gridLength: 12.5,
    gridWidth: 8,
    gridDepth: 0.6,
    numParallel: 8,
    numRods: 16,
    rodLength: 3,
    conductorMaterial: 'Cobre',
    conductorSize: '4/0'
  });
  
  const CurrentStepIcon = steps[currentStep].icon;
  
  const handleTemplateSelect = (templateKey) => {
    setSelectedTemplate(templateKey);
    const template = projectTemplates[templateKey];
    setProjectData(prev => ({
      ...prev,
      ...template.params,
      name: template.name,
      description: template.description
    }));
  };
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finalizar wizard
      onComplete(projectData);
      onClose();
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const updateField = (field, value) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl w-[700px] max-w-[90%] max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <CurrentStepIcon size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Nuevo Proyecto</h2>
                <p className="text-sm text-gray-400">
                  Paso {currentStep + 1} de {steps.length}: {steps[currentStep].title}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-lg transition-colors">
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 flex gap-1">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className={`flex-1 h-1 rounded-full transition-all ${
                  idx <= currentStep ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Zap size={48} className="text-blue-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white">Bienvenido a Grounding Designer Pro</h3>
                <p className="text-gray-400 mt-2">
                  Este asistente te guiará para configurar tu proyecto de puesta a tierra
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(projectTemplates).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => handleTemplateSelect(key)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      selectedTemplate === key
                        ? 'bg-blue-600/20 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : 'bg-gray-700/50 border border-gray-600 hover:border-blue-500'
                    }`}
                  >
                    <template.icon size={24} className="text-blue-400 mb-2" />
                    <div className="font-semibold text-white">{template.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{template.description}</div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentStep(1)}
                className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                Comenzar desde plantilla
              </button>
            </div>
          )}
          
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nombre del Proyecto *</label>
                  <input
                    type="text"
                    value={projectData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Subestación Norte"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ingeniero Responsable</label>
                  <input
                    type="text"
                    value={projectData.engineerName}
                    onChange={(e) => updateField('engineerName', e.target.value)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del ingeniero"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Cliente</label>
                  <input
                    type="text"
                    value={projectData.clientName}
                    onChange={(e) => updateField('clientName', e.target.value)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ubicación</label>
                  <input
                    type="text"
                    value={projectData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ciudad, Estado"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={projectData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción del proyecto"
                />
              </div>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tensión del Sistema (V)</label>
                  <input
                    type="number"
                    value={projectData.voltageLevel}
                    onChange={(e) => updateField('voltageLevel', parseFloat(e.target.value) || 13200)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Ej: 220, 480, 13200, 34500</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Corriente de Falla (A)</label>
                  <input
                    type="number"
                    value={projectData.faultCurrent}
                    onChange={(e) => updateField('faultCurrent', parseFloat(e.target.value) || 1771)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Duración de Falla (s)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={projectData.faultDuration}
                    onChange={(e) => updateField('faultDuration', parseFloat(e.target.value) || 0.35)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Típico: 0.35s - 0.5s</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Factor de División (Sf)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={projectData.currentDivisionFactor}
                    onChange={(e) => updateField('currentDivisionFactor', parseFloat(e.target.value) || 0.15)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Típico: 0.10 - 0.20</p>
                </div>
              </div>
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Resistividad del Suelo (Ω·m)</label>
                  <input
                    type="number"
                    value={projectData.soilResistivity}
                    onChange={(e) => updateField('soilResistivity', parseFloat(e.target.value) || 100)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Típico: 50-200 (húmedo), 200-1000 (seco)</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Resistividad Superficial (Ω·m)</label>
                  <input
                    type="number"
                    value={projectData.surfaceLayer}
                    onChange={(e) => updateField('surfaceLayer', parseFloat(e.target.value) || 3000)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Grava: 3000, Asfalto: 2000-5000</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Espesor Superficial (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={projectData.surfaceDepth}
                    onChange={(e) => updateField('surfaceDepth', parseFloat(e.target.value) || 0.1)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Mínimo NOM-022: 0.10m</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Humedad del Suelo</label>
                  <select
                    value={projectData.soilMoisture}
                    onChange={(e) => updateField('soilMoisture', parseFloat(e.target.value))}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="0.1">Seco (10%)</option>
                    <option value="0.25">Normal (25%)</option>
                    <option value="0.4">Húmedo (40%)</option>
                    <option value="0.6">Muy Húmedo (60%)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Largo de Malla (m)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={projectData.gridLength}
                    onChange={(e) => updateField('gridLength', parseFloat(e.target.value) || 12.5)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ancho de Malla (m)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={projectData.gridWidth}
                    onChange={(e) => updateField('gridWidth', parseFloat(e.target.value) || 8)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Profundidad (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={projectData.gridDepth}
                    onChange={(e) => updateField('gridDepth', parseFloat(e.target.value) || 0.6)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Conductores Paralelos</label>
                  <input
                    type="number"
                    value={projectData.numParallel}
                    onChange={(e) => updateField('numParallel', parseInt(e.target.value) || 8)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Número de Varillas</label>
                  <input
                    type="number"
                    value={projectData.numRods}
                    onChange={(e) => updateField('numRods', parseInt(e.target.value) || 16)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Longitud de Varilla (m)</label>
                  <input
                    type="number"
                    step="0.3"
                    value={projectData.rodLength}
                    onChange={(e) => updateField('rodLength', parseFloat(e.target.value) || 3)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
          
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3">Resumen del Proyecto</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nombre:</span>
                    <span className="text-white font-semibold">{projectData.name || 'Sin nombre'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ingeniero:</span>
                    <span className="text-white">{projectData.engineerName || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cliente:</span>
                    <span className="text-white">{projectData.clientName || 'No especificado'}</span>
                  </div>
                  <div className="border-t border-gray-600 my-2"></div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tensión:</span>
                    <span className="text-white">{isFinite(projectData.voltageLevel) ? projectData.voltageLevel.toLocaleString() : 'N/A'} V</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ifalla:</span>
                    <span className="text-white">{isFinite(projectData.faultCurrent) ? projectData.faultCurrent.toLocaleString() : 'N/A'} A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Resistividad Suelo:</span>
                    <span className="text-white">{projectData.soilResistivity} Ω·m</span>
                  </div>
                  <div className="border-t border-gray-600 my-2"></div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Malla:</span>
                    <span className="text-white">{projectData.gridLength} x {projectData.gridWidth} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Conductores:</span>
                    <span className="text-white">{projectData.numParallel} x {projectData.numParallel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Varillas:</span>
                    <span className="text-white">{projectData.numRods} x {projectData.rodLength}m</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-600/20 rounded-lg p-3 border border-blue-500">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-blue-400" />
                  <span className="text-sm text-blue-300">El proyecto está listo para comenzar</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <Save size={16} /> Crear Proyecto
              </>
            ) : (
              <>
                Siguiente <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
