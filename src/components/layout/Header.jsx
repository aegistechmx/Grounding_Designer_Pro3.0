import React, { useState } from 'react';
import { Sun, Moon, Settings, BookOpen, FolderOpen, FileText, Save, Download, CheckCircle, Plus } from 'lucide-react';
import { SaveProjectDialog } from '../common/SaveProjectDialog';
import { NewProjectWizard } from '../wizard/NewProjectWizard';
import { projectStorageService } from '../../services/projectStorage.service';

export const Header = ({ darkMode, setDarkMode, activeTab, setActiveTab, onOpenWizard, onOpenTemplates, onOpenDocs, params, calculations, onLoadProject, onNewProject }) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showNewProjectWizard, setShowNewProjectWizard] = useState(false);
  const [currentProject, setCurrentProject] = useState(projectStorageService.getCurrentProject());

  const handleSave = () => {
    try {
      const projectData = {
        id: currentProject?.id || Date.now().toString(),
        name: currentProject?.name || 'Nuevo Proyecto',
        params: params || {},
        calculations: calculations || {},
        activeTab: activeTab || 'design',
        createdAt: currentProject?.createdAt || new Date().toISOString()
      };

      const result = projectStorageService.saveProject(projectData);
      setCurrentProject(projectData);

      // Show notification
      alert(result?.message || 'Proyecto guardado');
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error al guardar proyecto');
    }
  };

  const handleSaveAs = (newName) => {
    if (!newName) {
      alert('Por favor ingrese un nombre para el proyecto');
      return;
    }

    try {
      const projectData = {
        id: Date.now().toString(),
        name: newName,
        params: params || {},
        calculations: calculations || {},
        activeTab: activeTab || 'design',
        createdAt: new Date().toISOString()
      };

      const result = projectStorageService.saveProjectAs(projectData, newName);
      setCurrentProject(projectData);
      alert(result?.message || 'Proyecto guardado como');
    } catch (error) {
      console.error('Error saving project as:', error);
      alert('Error al guardar proyecto como');
    }
  };

  const handleLoad = (projectId) => {
    if (!projectId) {
      alert('ID de proyecto inválido');
      return;
    }

    try {
      const project = projectStorageService.loadProject(projectId);
      if (project && onLoadProject) {
        onLoadProject(project);
        setCurrentProject(project);
      } else {
        alert('No se pudo cargar el proyecto');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      alert('Error al cargar proyecto');
    }
  };

  const handleExport = () => {
    try {
      const projectData = {
        name: currentProject?.name || 'Proyecto',
        params: params || {},
        calculations: calculations || {},
        activeTab: activeTab || 'design',
        exportDate: new Date().toISOString()
      };
      projectStorageService.exportToFile(projectData);
      alert('Proyecto exportado correctamente');
    } catch (error) {
      console.error('Error exporting project:', error);
      alert('Error al exportar proyecto');
    }
  };

  const handleImport = async (file) => {
    try {
      const project = await projectStorageService.importFromFile(file);
      if (onLoadProject) {
        onLoadProject(project);
        setCurrentProject(project);
      }
      alert('Proyecto importado correctamente');
    } catch (error) {
      console.error('Error importing project:', error);
      alert('Error al importar proyecto');
    }
  };

  const projects = (() => {
    try {
      return projectStorageService.getAllProjects() || [];
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  })();

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
        {/* Project buttons */}
        <button
          onClick={() => setShowNewProjectWizard(true)}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
        >
          <Plus size={14} /> Nuevo Proyecto
        </button>

        <button
          onClick={handleSave}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          title="Guardar proyecto (Ctrl+S)"
        >
          <Save size={18} />
        </button>

        <button
          onClick={() => setShowSaveDialog(true)}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          title="Abrir proyecto (Ctrl+O)"
        >
          <FolderOpen size={18} />
        </button>

        <button
          onClick={handleExport}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          title="Exportar proyecto"
        >
          <Download size={18} />
        </button>

        {/* Current project name */}
        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm flex items-center gap-1">
          <CheckCircle size={12} className="text-green-500" />
          {currentProject?.name || 'Nuevo Proyecto'}
        </div>

        <div className="w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

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
      
      <SaveProjectDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onLoad={handleLoad}
        onExport={handleExport}
        onImport={handleImport}
        projects={projects}
        currentProject={currentProject}
      />
      
      <NewProjectWizard
        isOpen={showNewProjectWizard}
        onClose={() => setShowNewProjectWizard(false)}
        onComplete={onNewProject}
        darkMode={darkMode}
      />
    </div>
  );
};