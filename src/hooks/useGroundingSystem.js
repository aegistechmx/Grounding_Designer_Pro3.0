// src/hooks/useGroundingSystem.js
// Hook para conectar componentes React con el sistema

import { useState, useEffect, useCallback, useRef } from 'react';
import { systemOrchestrator } from '../core/SystemOrchestrator.js';

export const useGroundingSystem = () => {
  const [state, setState] = useState({
    project: null,
    results: null,
    isSimulating: false,
    progress: 0,
    error: null
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    // Suscribirse a eventos del orquestador
    const updateState = (newState) => {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, ...newState }));
      }
    };
    
    const unsubscribers = [];
    
    const handleProjectChanged = systemOrchestrator.subscribe('projectChanged', (project) => {
      updateState({ project, results: null, error: null });
    });
    unsubscribers.push(handleProjectChanged);
    
    const handleSimulationStart = systemOrchestrator.subscribe('simulationStart', () => {
      updateState({ isSimulating: true, progress: 0, error: null });
    });
    unsubscribers.push(handleSimulationStart);
    
    const handleSimulationProgress = systemOrchestrator.subscribe('simulationProgress', (progress) => {
      updateState({ progress });
    });
    unsubscribers.push(handleSimulationProgress);
    
    const handleSimulationComplete = systemOrchestrator.subscribe('simulationComplete', (results) => {
      updateState({ results, isSimulating: false, progress: 1 });
    });
    unsubscribers.push(handleSimulationComplete);
    
    const handleSimulationError = systemOrchestrator.subscribe('simulationError', (error) => {
      updateState({ error: error.message, isSimulating: false });
    });
    unsubscribers.push(handleSimulationError);
    
    return () => {
      mountedRef.current = false;
      // Cleanup de suscripciones
      unsubscribers.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, []);

  /**
   * Inicializa proyecto
   */
  const initProject = useCallback((params) => {
    const project = systemOrchestrator.initProject(params);
    setState(prev => ({ ...prev, project }));
    return project;
  }, []);

  /**
   * Ejecuta simulación
   */
  const runSimulation = useCallback(async (useWorker = false) => {
    try {
      const results = await systemOrchestrator.runSimulation(useWorker);
      return results;
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  /**
   * Genera heatmap
   */
  const generateHeatmap = useCallback(async (resolution = 50) => {
    try {
      return await systemOrchestrator.generateHeatmap(resolution);
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  /**
   * Ejecuta optimización
   */
  const runOptimization = useCallback(async (params, onProgress) => {
    try {
      return await systemOrchestrator.runOptimization(params, onProgress);
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  /**
   * Exporta a PDF
   */
  const exportToPDF = useCallback(async () => {
    try {
      await systemOrchestrator.exportToPDF();
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  /**
   * Renderiza en canvas
   */
  const renderToCanvas = useCallback((canvas, type, options) => {
    systemOrchestrator.renderToCanvas(canvas, type, options);
  }, []);

  return {
    ...state,
    initProject,
    runSimulation,
    generateHeatmap,
    runOptimization,
    exportToPDF,
    renderToCanvas
  };
};

export default useGroundingSystem;
