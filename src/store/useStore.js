import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_PARAMS } from '../constants/defaultParams';
import { runGroundingCalculation, generateRecommendations } from '../core/groundingEngine';

const useStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // ESTADO INICIAL
      // ============================================
      params: DEFAULT_PARAMS,
      calculations: null,
      recommendations: [],
      savedProfiles: [],
      darkMode: false,
      isLoading: false,
      activeTab: 'design',
      notifications: [],
      optimizationHistory: [],
      validationReport: null,
      paramErrors: { errors: [], warnings: [] },
      history: [], // Timeline de versiones tipo Git
      
      // Acciones
      setParams: (newParams) => {
        const currentHistory = get().history;
        const currentParams = get().params;
        const currentCalculations = get().calculations;
        
        // Guardar versión actual en historial antes de cambiar
        if (currentCalculations) {
          const newHistory = [...currentHistory, {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            params: { ...currentParams },
            results: { ...currentCalculations }
          }];
          set({ params: newParams, isLoading: true, history: newHistory });
        } else {
          set({ params: newParams, isLoading: true });
        }
        
        try {
          const calculations = runGroundingCalculation(newParams);
          const recommendations = generateRecommendations(calculations);
          
          set({ 
            calculations, 
            recommendations,
            isLoading: false 
          });
        } catch (error) {
          console.error('Error en cálculos:', error);
          set({ isLoading: false });
          // Notificar al usuario del error
          get().addNotification({
            type: 'error',
            title: 'Error en cálculos',
            message: error.message || 'Ocurrió un error al procesar los parámetros'
          });
        }
      },
      
      updateParam: (key, value) => {
        const { params, setParams } = get();
        const newParams = { ...params, [key]: value };
        setParams(newParams);
      },
      
      updateMultipleParams: (updates) => {
        const { params, setParams } = get();
        const newParams = { ...params, ...updates };
        setParams(newParams);
      },
      
      setDarkMode: (darkMode) => set({ darkMode }),
      
      setActiveTab: (activeTab) => set({ activeTab }),
      
      addNotification: (notification) => {
        const { notifications } = get();
        set({ notifications: [...notifications, { ...notification, id: Date.now() }] });
      },
      
      removeNotification: (id) => {
        const { notifications } = get();
        set({ notifications: notifications.filter(n => n.id !== id) });
      },
      
      clearNotifications: () => set({ notifications: [] }),
      
      // ============================================
      // PERFILES
      // ============================================
      saveProfile: (name) => {
        if (!name || typeof name !== 'string' || name.trim() === '') {
          get().addNotification({
            type: 'error',
            title: 'Error al guardar perfil',
            message: 'El nombre del perfil no puede estar vacío'
          });
          return { success: false, message: 'Nombre inválido' };
        }
        const { params, savedProfiles } = get();
        const newProfile = {
          id: Date.now(),
          name: name.trim(),
          data: { ...params },
          date: new Date().toISOString(),
          summary: `Trafo: ${params.transformerKVA}kVA, Malla: ${params.gridLength}x${params.gridWidth}m`
        };
        set({ savedProfiles: [...savedProfiles, newProfile] });
        get().addNotification({
          type: 'success',
          title: 'Perfil guardado',
          message: `Perfil "${name}" guardado exitosamente`
        });
        return { success: true, message: 'Perfil guardado' };
      },
      
      loadProfile: (profile) => {
        if (!profile || !profile.data || typeof profile.data !== 'object') {
          get().addNotification({
            type: 'error',
            title: 'Error al cargar perfil',
            message: 'El perfil no tiene datos válidos'
          });
          return { success: false, message: 'Perfil inválido' };
        }
        const { setParams } = get();
        setParams(profile.data);
        get().addNotification({
          type: 'success',
          title: 'Perfil cargado',
          message: `Perfil "${profile.name}" cargado exitosamente`
        });
        return { success: true, message: 'Perfil cargado' };
      },
      
      deleteProfile: (id) => {
        const { savedProfiles } = get();
        set({ savedProfiles: savedProfiles.filter(p => p.id !== id) });
      },
      
      resetToDefaults: () => {
        const { setParams } = get();
        setParams(DEFAULT_PARAMS);
      },
      
      // ============================================
      // HISTORIAL / TIMELINE (Versioning tipo Git)
      // ============================================
      loadVersion: (versionId) => {
        const { history, setParams } = get();
        const version = history.find(v => v.id === versionId);
        if (version) {
          setParams(version.params);
          get().addNotification({
            type: 'success',
            title: 'Versión cargada',
            message: `Versión del ${new Date(version.timestamp).toLocaleString()} cargada`
          });
        }
      },
      
      clearHistory: () => {
        set({ history: [] });
        get().addNotification({
          type: 'info',
          title: 'Historial limpiado',
          message: 'El historial de versiones ha sido eliminado'
        });
      },
      
      // ============================================
      // OPTIMIZACIONES
      // ============================================
      reduceGPR: (targetGPR) => {
        if (targetGPR === undefined || targetGPR === null || targetGPR < 0) {
          get().addNotification({
            type: 'error',
            title: 'Error en optimización',
            message: 'El valor objetivo de GPR no es válido'
          });
          return { success: false, message: 'Valor objetivo inválido' };
        }
        const { params, setParams, calculations } = get();
        const currentGPR = isFinite(calculations?.GPR) ? calculations.GPR : 0;
        
        if (currentGPR <= targetGPR) {
          return { success: true, message: 'GPR ya dentro del objetivo' };
        }
        
        const optimizedParams = { ...params };
        const improvements = [];
        
        if (params.currentDivisionFactor > 0.25) {
          optimizedParams.currentDivisionFactor = 0.20;
          improvements.push('Sf reducido a 0.20');
        }
        
        if (params.numParallel < 18) {
          optimizedParams.numParallel = 18;
          optimizedParams.numParallelY = 18;
          improvements.push('Conductores aumentados a 18×18');
        }
        
        if (params.numRods < 50) {
          optimizedParams.numRods = 50;
          improvements.push('Varillas aumentadas a 50');
        }
        
        setParams(optimizedParams);
        get().addNotification({
          type: 'success',
          title: 'Optimización aplicada',
          message: `Optimización aplicada: ${improvements.join(', ')}`
        });
        
        return { 
          success: true, 
          improvements,
          message: `Optimización aplicada: ${improvements.join(', ')}`
        };
      },
      
      proposeOptimizedGrid: () => {
        const { params, setParams } = get();
        
        const optimizedParams = {
          ...params,
          numParallel: 18,
          numParallelY: 18,
          numRods: 50,
          rodLength: 3,
          gridDepth: 0.6,
          currentDivisionFactor: 0.20,
          surfaceLayer: 10000,
          surfaceDepth: 0.2
        };
        
        setParams(optimizedParams);
        
        return { success: true, message: 'Malla optimizada aplicada' };
      }
    }),
    {
      name: 'grounding-calculator-storage',
      partialize: (state) => ({ 
        params: state.params, 
        savedProfiles: state.savedProfiles, 
        darkMode: state.darkMode,
        activeTab: state.activeTab
      })
    }
  )
);

export default useStore;