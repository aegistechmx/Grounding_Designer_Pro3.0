import { useEffect, useCallback } from 'react';
import useStore from '../store/useStore';
import { useDebounce } from './useDebounce';

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
        message: `Rg = ${calculations.Rg?.toFixed(2)} Ω > 5 Ω recomendado`,
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
    
    // Acciones
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
  };
};

export default useGroundingCalculator;