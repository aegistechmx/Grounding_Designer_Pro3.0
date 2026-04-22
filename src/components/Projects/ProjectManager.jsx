// src/components/Projects/ProjectManager.jsx
import React, { useState, useEffect } from 'react';
import { FolderOpen, Upload, Folder, Plus } from 'lucide-react';
import { ProjectViewer } from './ProjectViewer';
import { ProjectList } from './ProjectList';
import { ProjectImport } from './ProjectImport';

export const ProjectManager = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState('list');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar proyectos guardados
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const saved = localStorage.getItem('grounding_projects');
    if (saved) {
      setProjects(JSON.parse(saved));
    }
    setLoading(false);
  };

  const saveProject = (project) => {
    const updated = [...projects, { ...project, id: Date.now(), createdAt: new Date().toISOString() }];
    setProjects(updated);
    localStorage.setItem('grounding_projects', JSON.stringify(updated));
    return project;
  };

  const deleteProject = (id) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem('grounding_projects', JSON.stringify(updated));
    if (selectedProject?.id === id) setSelectedProject(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          📁 Gestión de Proyectos
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            <Upload size={18} />
            Importar Proyecto
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            <Folder size={18} />
            Mis Proyectos
          </button>
        </div>
      </div>

      {activeTab === 'import' && (
        <ProjectImport 
          darkMode={darkMode}
          onImport={(project) => {
            saveProject(project);
            setSelectedProject(project);
            setActiveTab('view');
          }} 
        />
      )}

      {activeTab === 'list' && (
        <ProjectList 
          darkMode={darkMode}
          projects={projects} 
          onSelect={(project) => {
            setSelectedProject(project);
            setActiveTab('view');
          }}
          onDelete={deleteProject}
          loading={loading}
        />
      )}

      {activeTab === 'view' && selectedProject && (
        <ProjectViewer 
          darkMode={darkMode}
          project={selectedProject} 
          onBack={() => setActiveTab('list')}
          onExport={() => {}}
        />
      )}
    </div>
  );
};
