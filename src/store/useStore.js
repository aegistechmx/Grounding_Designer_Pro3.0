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
      
      // Acciones
      setParams: (newParams) => {
        set({ params: newParams, isLoading: true });
        
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
        const { params, savedProfiles } = get();
        const newProfile = {
          id: Date.now(),
          name,
          data: { ...params },
          date: new Date().toISOString(),
          summary: `Trafo: ${params.transformerKVA}kVA, Malla: ${params.gridLength}x${params.gridWidth}m`
        };
        set({ savedProfiles: [...savedProfiles, newProfile] });
      },
      
      loadProfile: (profile) => {
        const { setParams } = get();
        setParams(profile.data);
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
      // OPTIMIZACIONES
      // ============================================
      reduceGPR: (targetGPR) => {
        const { params, setParams, calculations } = get();
        const currentGPR = calculations?.GPR || 0;
        
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