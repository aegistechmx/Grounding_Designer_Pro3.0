import { create } from 'zustand';
import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';

/**
 * Hook for managing projects with Firebase
 * Provides CRUD operations for projects and versions
 * Automatically filters projects by current authenticated user
 */
const useProjects = create((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  /**
   * Load all projects for the current authenticated user
   */
  loadProjects: async () => {
    set({ loading: true, error: null });
    try {
      const user = auth.currentUser;
      if (!user) {
        set({ projects: [], loading: false });
        return [];
      }

      const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      set({ projects, loading: false });
      return projects;
    } catch (error) {
      console.error('Error loading projects:', error);
      set({ error: error.message, loading: false });
      return [];
    }
  },

  /**
   * Save a new project for the current user
   * @param {object} projectData - Project data including params, results, etc.
   */
  saveProject: async (projectData) => {
    set({ loading: true, error: null });
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const docRef = await addDoc(collection(db, 'projects'), {
        ...projectData,
        userId: user.uid,
        userEmail: user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      const newProject = { id: docRef.id, ...projectData, userId: user.uid };
      set(state => ({ 
        projects: [...state.projects, newProject],
        loading: false 
      }));
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error saving project:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Load a specific project by ID (only if belongs to current user)
   * @param {string} projectId - Project ID
   */
  loadProjectById: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const docRef = doc(db, 'projects', projectId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const project = { id: snapshot.id, ...snapshot.data() };
        
        // Verify project belongs to current user
        if (project.userId !== user.uid) {
          throw new Error('Access denied: Project does not belong to current user');
        }
        
        set({ currentProject: project, loading: false });
        return project;
      } else {
        set({ error: 'Project not found', loading: false });
        return null;
      }
    } catch (error) {
      console.error('Error loading project:', error);
      set({ error: error.message, loading: false });
      return null;
    }
  },

  /**
   * Update an existing project (only if belongs to current user)
   * @param {string} projectId - Project ID
   * @param {object} projectData - Updated project data
   */
  updateProject: async (projectId, projectData) => {
    set({ loading: true, error: null });
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const docRef = doc(db, 'projects', projectId);
      await updateDoc(docRef, {
        ...projectData,
        updatedAt: new Date().toISOString()
      });
      set(state => ({
        projects: state.projects.map(p => 
          p.id === projectId ? { ...p, ...projectData } : p
        ),
        currentProject: state.currentProject?.id === projectId 
          ? { ...state.currentProject, ...projectData }
          : state.currentProject,
        loading: false
      }));
      return { success: true };
    } catch (error) {
      console.error('Error updating project:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete a project (only if belongs to current user)
   * @param {string} projectId - Project ID
   */
  deleteProject: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      await deleteDoc(doc(db, 'projects', projectId));
      set(state => ({
        projects: state.projects.filter(p => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
        loading: false
      }));
      return { success: true };
    } catch (error) {
      console.error('Error deleting project:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Set current project
   * @param {object} project - Project object
   */
  setCurrentProject: (project) => {
    set({ currentProject: project });
  },

  /**
   * Clear current project
   */
  clearCurrentProject: () => {
    set({ currentProject: null });
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Clear all projects (useful on logout)
   */
  clearAll: () => {
    set({ projects: [], currentProject: null, error: null });
  }
}));

export default useProjects;
