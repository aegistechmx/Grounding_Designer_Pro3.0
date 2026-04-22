import { useEffect, useCallback } from 'react';
import useStore from '../store/useStore';
import { useDebounce } from './useDebounce';
import CalculationEngineAdapter from '../utils/calculationEngineAdapter';

export const useGroundingCalculator = () => {
  const {
    params,
    calculations,
    recommendations,
    savedProfiles,
    darkMode,
    isLoading,
    activeTab,
    notifications,
    setParams,
    updateParam,
    setDarkMode,
    setActiveTab,
    addNotification,
    removeNotification,
    saveProfile,
    loadProfile,
    deleteProfile,
    resetToDefaults
  } = useStore();
  
  // Debounce para cálculos costosos
  const debouncedParams = useDebounce(params, 300);
  
  // Recalcular cuando cambian los parámetros debounced
  useEffect(() => {
    // El store ya maneja el recálculo en setParams
    // Este efecto es para acciones adicionales si es necesario
    if (debouncedParams !== params) {
      // Actualizar parámetros en el store cuando cambien
      setParams(debouncedParams);
    }
  }, [debouncedParams, setParams, params]);
  
  // Verificar cumplimiento y agregar notificaciones automáticas
  useEffect(() => {
    if (!calculations) return;
    
    const newNotifications = [];
    
    if (!calculations.complies && calculations.complies !== undefined) {
      newNotifications.push({
        type: 'error',
        title: 'Diseño No Cumple IEEE 80',
        message: 'Las tensiones de paso o contacto exceden los límites permitidos',
        action: 'Usar "Proponer Malla Optimizada"',
        duration: 8000
      });
    }
    
    if (calculations.Rg && isFinite(calculations.Rg) && calculations.Rg > 5) {
      newNotifications.push({
        type: 'warning',
        title: 'Resistencia de Malla Alta',
        message: `Rg = ${isFinite(calculations.Rg) ? calculations.Rg.toFixed(2) : 'N/A'} Ω > 5 Ω recomendado`,
        action: 'Agregar más varillas',
        duration: 6000
      });
    }
    
    if (calculations.thermalCheck && calculations.thermalCheck.complies !== undefined && !calculations.thermalCheck.complies) {
      newNotifications.push({
        type: 'warning',
        title: 'Verificación Térmica',
        message: calculations.thermalCheck.message,
        duration: 5000
      });
    }
    
    // Limpiar notificaciones antiguas y agregar nuevas
    newNotifications.forEach(notification => {
      addNotification(notification);
    });
  }, [calculations, addNotification]);
  
  // Professional calculation function
  const calculateWithProfessionalEngine = useCallback((inputParams) => {
    try {
      const results = CalculationEngineAdapter.calculate(inputParams || params);
      
      // Check if results are from professional engine
      if (CalculationEngineAdapter.isProfessionalEngine(results)) {
        console.log('Using professional calculation engine v2.0');
        
        // Add professional engine notification
        addNotification({
          type: 'info',
          title: 'Motor Profesional',
          message: 'Cálculo realizado con motor profesional IEEE 80',
          duration: 3000
        });
      }
      
      return results;
    } catch (error) {
      console.error('Professional calculation failed:', error);
      
      // Fallback to old method
      addNotification({
        type: 'warning',
        title: 'Error en Motor Profesional',
        message: 'Usando método de cálculo alternativo',
        duration: 5000
      });
      
      throw error;
    }
  }, [params, addNotification]);

  // Validation function
  const validateParameters = useCallback((inputParams) => {
    return CalculationEngineAdapter.validate(inputParams || params);
  }, [params]);

  // Get recommendations function
  const getEngineRecommendations = useCallback((inputParams) => {
    return CalculationEngineAdapter.getRecommendations(inputParams || params);
  }, [params]);

  // Export results function
  const exportResults = useCallback((results, format = 'json') => {
    return CalculationEngineAdapter.export(results || calculations, format);
  }, [calculations]);

  // Batch calculation function
  const batchCalculate = useCallback((scenarios) => {
    return CalculationEngineAdapter.batchCalculate(scenarios);
  }, []);

  // Get calculation statistics
  const getCalculationStatistics = useCallback((results) => {
    return CalculationEngineAdapter.getStatistics(results || calculations);
  }, [calculations]);

  return {
    // Estado
    params,
    calculations,
    recommendations,
    savedProfiles,
    darkMode,
    isLoading,
    activeTab,
    notifications,
    
    // Acciones existentes
    setParams,
    updateParam,
    setDarkMode,
    setActiveTab,
    addNotification,
    removeNotification,
    saveProfile,
    loadProfile,
    deleteProfile,
    resetToDefaults,
    
    // Nuevas funciones del motor profesional
    calculateWithProfessionalEngine,
    validateParameters,
    getEngineRecommendations,
    exportResults,
    batchCalculate,
    getCalculationStatistics
  };
};

export default useGroundingCalculator;