// src/components/Projects/ProjectList.jsx
import React from 'react';
import { Folder, Trash2, Eye, Calendar } from 'lucide-react';

export const ProjectList = ({ projects, onSelect, onDelete, loading, darkMode }) => {
  if (loading) {
    return <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cargando proyectos...</div>;
  }

  if (projects.length === 0) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-12 text-center`}>
        <Folder size={48} className={`mx-auto ${darkMode ? 'text-gray-600' : 'text-gray-400'} mb-4`} />
        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No hay proyectos guardados</p>
        <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Importa tu primer proyecto desde el botón "Importar Proyecto"
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <div 
          key={project.id} 
          className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-lg p-4 transition-colors border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <Folder size={20} className="text-blue-400" />
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{project.name}</h3>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onSelect(project)}
                className={`p-1 hover:${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}
                title="Ver proyecto"
              >
                <Eye size={16} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
              </button>
              <button
                onClick={() => onDelete(project.id)}
                className={`p-1 hover:bg-red-600 rounded text-red-400`}
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          
          <div className={`space-y-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="flex justify-between">
              <span>Tablero:</span>
              <span className={darkMode ? 'text-white' : 'text-gray-800'}>{project.mainPanel?.model || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Circuitos:</span>
              <span className={darkMode ? 'text-white' : 'text-gray-800'}>{project.circuits?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Potencia:</span>
              <span className={darkMode ? 'text-white' : 'text-gray-800'}>{((project.totals?.watts || 0) / 1000).toFixed(1)} kW</span>
            </div>
            <div className="flex justify-between">
              <span>Corriente:</span>
              <span className={darkMode ? 'text-white' : 'text-gray-800'}>{(project.totals?.current || 0).toFixed(0)} A</span>
            </div>
            <div className={`flex justify-between text-xs mt-2 pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <span className="flex items-center gap-1">
                <Calendar size={12} /> {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
