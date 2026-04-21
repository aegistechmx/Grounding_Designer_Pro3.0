import React from 'react';
import { Sun, Moon, Settings, BookOpen, FolderOpen, FileText } from 'lucide-react';

export const Header = ({ darkMode, setDarkMode, activeTab, setActiveTab, onOpenWizard, onOpenTemplates, onOpenDocs }) => {
  return (
    <div className="mb-6">
      {/* Logo centrado */}
      <div className="flex justify-center mb-4">
        <img 
          src="/LOGO.png" 
          alt="Proyectos Integrales Logo" 
          className="h-40 w-auto md:h-56 object-contain"
        />
      </div>
      
      {/* Botones de acción */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          title="Modo oscuro"
        >
          {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-600" />}
        </button>
        
        <button
          onClick={onOpenWizard}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          title="Asistente"
        >
          <Settings size={18} />
        </button>
        
        <button
          onClick={onOpenTemplates}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          title="Plantillas"
        >
          <FolderOpen size={18} />
        </button>
        
        <button
          onClick={onOpenDocs}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          title="Documentación"
        >
          <FileText size={18} />
        </button>
      </div>
      
      {/* Texto centrado */}
      <div className="text-center">
        <div className="flex items-center gap-2 justify-center">
          <span className="text-2xl">⚡</span>
          <span className="text-xl font-bold text-blue-700 dark:text-blue-400">
            Grounding Designer Pro
          </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md mx-auto mt-1">
          Sistema Profesional de Diseño de Puesta a Tierra (IEEE 80 &amp; CFE 01J00-01)
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Ingeniería Eléctrica Especializada | Puerto Vallarta, México
        </p>
      </div>
    </div>
  );
};