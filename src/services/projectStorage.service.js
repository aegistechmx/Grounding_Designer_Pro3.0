// src/services/projectStorage.service.js
import { formatResistance, formatVoltage, formatCurrent } from '../utils/formatters';

export const projectStorageService = {
  /**
   * Guarda el proyecto actual en localStorage
   */
  saveProject(projectData) {
    try {
      const projects = this.getAllProjects();
      const existingIndex = projects.findIndex(p => p.id === projectData.id);
      
      const projectToSave = {
        ...projectData,
        lastModified: new Date().toISOString(),
        version: '3.0'
      };
      
      if (existingIndex >= 0) {
        projects[existingIndex] = projectToSave;
      } else {
        projects.push(projectToSave);
      }
      
      localStorage.setItem('grounding_projects', JSON.stringify(projects));
      localStorage.setItem('grounding_current_project', JSON.stringify(projectToSave));
      
      return { success: true, message: 'Proyecto guardado correctamente' };
    } catch (error) {
      console.error('Error al guardar proyecto:', error);
      return { success: false, message: 'Error al guardar proyecto' };
    }
  },
  
  /**
   * Guarda como (nuevo nombre)
   */
  saveProjectAs(projectData, newName) {
    const newProject = {
      ...projectData,
      id: Date.now().toString(),
      name: newName,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    const projects = this.getAllProjects();
    projects.push(newProject);
    localStorage.setItem('grounding_projects', JSON.stringify(projects));
    localStorage.setItem('grounding_current_project', JSON.stringify(newProject));
    
    return { success: true, message: `Proyecto guardado como "${newName}"` };
  },
  
  /**
   * Obtiene todos los proyectos guardados
   */
  getAllProjects() {
    try {
      const stored = localStorage.getItem('grounding_projects');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error al parsear proyectos:', error);
      return [];
    }
  },
  
  /**
   * Obtiene el proyecto actual
   */
  getCurrentProject() {
    try {
      const stored = localStorage.getItem('grounding_current_project');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error al parsear proyecto actual:', error);
      return null;
    }
  },
  
  /**
   * Carga un proyecto por ID
   */
  loadProject(projectId) {
    const projects = this.getAllProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
      localStorage.setItem('grounding_current_project', JSON.stringify(project));
      return project;
    }
    return null;
  },
  
  /**
   * Elimina un proyecto
   */
  deleteProject(projectId) {
    const projects = this.getAllProjects();
    const filtered = projects.filter(p => p.id !== projectId);
    localStorage.setItem('grounding_projects', JSON.stringify(filtered));
    
    const current = this.getCurrentProject();
    if (current?.id === projectId) {
      localStorage.removeItem('grounding_current_project');
    }
    
    return { success: true, message: 'Proyecto eliminado' };
  },
  
  /**
   * Exporta proyecto a archivo JSON
   */
  exportToFile(projectData) {
    const dataStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectData.name?.replace(/[^a-z0-9]/gi, '_') || 'proyecto'}_${new Date().toISOString().slice(0,19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true, message: 'Proyecto exportado' };
  },
  
  /**
   * Importa proyecto desde archivo JSON
   */
  importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const project = JSON.parse(e.target.result);
          resolve(project);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },
  
  /**
   * Genera backup automático
   */
  autoBackup(projectData) {
    const backups = localStorage.getItem('grounding_backups');
    let backupsList = backups ? JSON.parse(backups) : [];
    
    backupsList.unshift({
      ...projectData,
      backupDate: new Date().toISOString()
    });
    
    // Mantener solo últimos 10 backups
    if (backupsList.length > 10) backupsList = backupsList.slice(0, 10);
    
    localStorage.setItem('grounding_backups', JSON.stringify(backupsList));
  }
};
