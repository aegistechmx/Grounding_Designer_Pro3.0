import React, { useState } from 'react';
import { 
  Home, Building2, Factory, Zap, Heart, Wifi, Database, 
  Plus, School, Store, Warehouse, ChevronRight
} from 'lucide-react';

const templates = {
  residential: {
    name: 'Residencial',
    icon: <Home size={24} />,
    description: 'Casa habitación, edificio pequeño',
    category: 'Vivienda',
    recommendedFor: 'Casas, departamentos, oficinas pequeñas',
    params: {
      transformerKVA: 25,
      gridLength: 10,
      gridWidth: 8,
      numParallel: 4,
      numRods: 6,
      rodLength: 2.4,
      gridDepth: 0.5,
      currentDivisionFactor: 0.25,
      faultDuration: 0.3,
      soilResistivity: 100,
      surfaceLayer: 3000,
      surfaceDepth: 0.15
    },
    color: 'bg-green-500',
    textColor: 'text-green-600'
  },
  commercial: {
    name: 'Comercial',
    icon: <Building2 size={24} />,
    description: 'Plaza comercial, oficinas',
    category: 'Comercio',
    recommendedFor: 'Centros comerciales, oficinas, restaurantes',
    params: {
      transformerKVA: 150,
      gridLength: 20,
      gridWidth: 15,
      numParallel: 8,
      numRods: 16,
      rodLength: 3,
      gridDepth: 0.6,
      currentDivisionFactor: 0.22,
      faultDuration: 0.35,
      soilResistivity: 100,
      surfaceLayer: 5000,
      surfaceDepth: 0.15
    },
    color: 'bg-blue-500',
    textColor: 'text-blue-600'
  },
  industrial: {
    name: 'Industrial',
    icon: <Factory size={24} />,
    description: 'Planta, fábrica, bodega',
    category: 'Industria',
    recommendedFor: 'Fábricas, plantas de proceso, bodegas',
    params: {
      transformerKVA: 500,
      gridLength: 40,
      gridWidth: 30,
      numParallel: 12,
      numRods: 30,
      rodLength: 3.6,
      gridDepth: 0.8,
      currentDivisionFactor: 0.20,
      faultDuration: 0.4,
      soilResistivity: 100,
      surfaceLayer: 5000,
      surfaceDepth: 0.15
    },
    color: 'bg-purple-500',
    textColor: 'text-purple-600'
  },
  substation: {
    name: 'Subestación',
    icon: <Zap size={24} />,
    description: 'Subestación eléctrica',
    category: 'Energía',
    recommendedFor: 'Subestaciones eléctricas, centros de transformación',
    params: {
      transformerKVA: 1000,
      gridLength: 50,
      gridWidth: 40,
      numParallel: 16,
      numRods: 50,
      rodLength: 4.2,
      gridDepth: 1.0,
      currentDivisionFactor: 0.18,
      faultDuration: 0.5,
      soilResistivity: 100,
      surfaceLayer: 10000,
      surfaceDepth: 0.2
    },
    color: 'bg-red-500',
    textColor: 'text-red-600'
  },
  hospital: {
    name: 'Hospital / Clínica',
    icon: <Heart size={24} />,  // ✅ CORREGIDO: Hospital → Heart
    description: 'Hospital, clínica, centro médico',
    category: 'Salud',
    recommendedFor: 'Hospitales, clínicas, centros de salud',
    params: {
      transformerKVA: 300,
      gridLength: 35,
      gridWidth: 25,
      numParallel: 14,
      numRods: 35,
      rodLength: 3.6,
      gridDepth: 0.8,
      currentDivisionFactor: 0.20,
      faultDuration: 0.35,
      soilResistivity: 100,
      surfaceLayer: 10000,
      surfaceDepth: 0.2
    },
    color: 'bg-teal-500',
    textColor: 'text-teal-600'
  },
  telecom: {
    name: 'Telecomunicaciones',
    icon: <Wifi size={24} />,
    description: 'Torre, sitio de telecomunicaciones',
    category: 'Telecom',
    recommendedFor: 'Torres de telecomunicaciones, antenas, repetidores',
    params: {
      transformerKVA: 75,
      gridLength: 15,
      gridWidth: 15,
      numParallel: 8,
      numRods: 20,
      rodLength: 3,
      gridDepth: 0.6,
      currentDivisionFactor: 0.20,
      faultDuration: 0.3,
      soilResistivity: 100,
      surfaceLayer: 10000,
      surfaceDepth: 0.2
    },
    color: 'bg-cyan-500',
    textColor: 'text-cyan-600'
  },
  dataCenter: {
    name: 'Data Center',
    icon: <Database size={24} />,
    description: 'Centro de datos, servidores',
    category: 'Tecnología',
    recommendedFor: 'Data centers, salas de servidores, CPD',
    params: {
      transformerKVA: 500,
      gridLength: 30,
      gridWidth: 25,
      numParallel: 15,
      numRods: 40,
      rodLength: 3.6,
      gridDepth: 0.8,
      currentDivisionFactor: 0.18,
      faultDuration: 0.3,
      soilResistivity: 100,
      surfaceLayer: 15000,
      surfaceDepth: 0.25
    },
    color: 'bg-indigo-500',
    textColor: 'text-indigo-600'
  },
  educational: {
    name: 'Educativo',
    icon: <School size={24} />,
    description: 'Escuela, universidad',
    category: 'Educación',
    recommendedFor: 'Escuelas, colegios, universidades',
    params: {
      transformerKVA: 150,
      gridLength: 25,
      gridWidth: 20,
      numParallel: 10,
      numRods: 20,
      rodLength: 3,
      gridDepth: 0.6,
      currentDivisionFactor: 0.22,
      faultDuration: 0.35,
      soilResistivity: 100,
      surfaceLayer: 5000,
      surfaceDepth: 0.15
    },
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600'
  },
  retail: {
    name: 'Tienda / Retail',
    icon: <Store size={24} />,
    description: 'Tienda departamental, retail',
    category: 'Comercio',
    recommendedFor: 'Tiendas departamentales, supermercados, retail',
    params: {
      transformerKVA: 100,
      gridLength: 18,
      gridWidth: 15,
      numParallel: 8,
      numRods: 15,
      rodLength: 3,
      gridDepth: 0.6,
      currentDivisionFactor: 0.22,
      faultDuration: 0.35,
      soilResistivity: 100,
      surfaceLayer: 5000,
      surfaceDepth: 0.15
    },
    color: 'bg-pink-500',
    textColor: 'text-pink-600'
  },
  warehouse: {
    name: 'Almacén / Bodega',
    icon: <Warehouse size={24} />,
    description: 'Almacén, bodega industrial',
    category: 'Logística',
    recommendedFor: 'Almacenes, centros de distribución, bodegas',
    params: {
      transformerKVA: 200,
      gridLength: 45,
      gridWidth: 30,
      numParallel: 12,
      numRods: 25,
      rodLength: 3.6,
      gridDepth: 0.7,
      currentDivisionFactor: 0.20,
      faultDuration: 0.4,
      soilResistivity: 100,
      surfaceLayer: 5000,
      surfaceDepth: 0.15
    },
    color: 'bg-orange-500',
    textColor: 'text-orange-600'
  }
};

// Categorías para filtro
const categories = ['Todos', 'Vivienda', 'Comercio', 'Industria', 'Energía', 'Salud', 'Telecom', 'Tecnología', 'Educación', 'Logística'];

const ProjectTemplates = ({ onSelectTemplate, darkMode, onClose, onCustomTemplate }) => {
  const [selected, setSelected] = useState(null);
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [customMode, setCustomMode] = useState(false);

  const filteredTemplates = Object.entries(templates).filter(([key, template]) => 
    filterCategory === 'Todos' || template.category === filterCategory
  );

  const handleSelectTemplate = () => {
    if (selected && templates[selected]) {
      onSelectTemplate(templates[selected].params);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Vivienda': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'Comercio': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'Industria': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'Energía': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'Salud': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
      'Telecom': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
      'Tecnología': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      'Educación': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'Logística': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-4xl mx-auto`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">📋 Plantillas Predefinidas</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCustomMode(!customMode)}
            className={`px-3 py-1 rounded-md text-sm transition-all ${
              customMode 
                ? 'bg-green-600 text-white' 
                : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Plus size={14} className="inline mr-1" />
            {customMode ? 'Ver Plantillas' : 'Configuración Personalizada'}
          </button>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">✕</button>
        </div>
      </div>
      
      {customMode ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🔧</div>
          <p className="text-gray-500 mb-4">Crea tu propia configuración personalizada</p>
          <button
            onClick={() => {
              setCustomMode(false);
              if (onCustomTemplate) onCustomTemplate();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Crear Configuración Personalizada
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <p className="text-sm text-gray-500 mb-4">
            Selecciona una plantilla para cargar una configuración predefinida según el tipo de proyecto
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-h-[60vh] overflow-y-auto">
            {filteredTemplates.map(([key, template]) => (
              <div
                key={key}
                onClick={() => setSelected(key)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selected === key 
                    ? `${template.color} border-opacity-100 shadow-lg transform scale-[1.02]`
                    : `${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} hover:shadow-md hover:scale-[1.01]`
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${template.color} bg-opacity-20 text-white flex-shrink-0`}>
                    {template.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{template.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${getCategoryColor(template.category)}`}>
                        {template.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{template.description}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{template.recommendedFor}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-1 text-xs mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-gray-500">Transformador:</span>
                  <span className="font-medium">{template.params.transformerKVA} kVA</span>
                  <span className="text-gray-500">Malla:</span>
                  <span className="font-medium">{template.params.gridLength}×{template.params.gridWidth}m</span>
                  <span className="text-gray-500">Conductores:</span>
                  <span className="font-medium">{template.params.numParallel}</span>
                  <span className="text-gray-500">Varillas:</span>
                  <span className="font-medium">{template.params.numRods} und</span>
                  <span className="text-gray-500">Sf:</span>
                  <span className="font-medium">{template.params.currentDivisionFactor}</span>
                </div>
              </div>
            ))}
          </div>
          
          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay plantillas en esta categoría
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={handleSelectTemplate}
              disabled={!selected}
              className={`flex-1 py-2 rounded-md font-semibold transition-all ${
                selected 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Cargar Plantilla <ChevronRight size={16} className="inline" />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-all"
            >
              Cancelar
            </button>
          </div>
          
          <div className="mt-3 text-center text-xs text-gray-400">
            💡 Las plantillas incluyen parámetros optimizados según el tipo de proyecto
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectTemplates;