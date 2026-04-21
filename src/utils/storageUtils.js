/**
 * Utilidades seguras para manejo de localStorage con manejo de errores y cuota
 */

import { storageLogger } from './loggerUtils';

const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB máximo
const MAX_ATTEMPTS = 3;
const CLEANUP_BATCH_SIZE = 5;

/**
 * Verifica si hay espacio disponible en localStorage
 */
const checkStorageQuota = () => {
  try {
    const testKey = '__storage_test__';
    const testValue = 'test';
    localStorage.setItem(testKey, testValue);
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Obtiene el tamaño estimado de los datos en localStorage
 */
const getStorageSize = () => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return total;
};

/**
 * Limpia datos antiguos del proyecto para liberar espacio
 */
const cleanupOldData = () => {
  try {
    const keys = Object.keys(localStorage);
    const projectKeys = keys.filter(k => k.includes('groundingCalculator'));
    
    // Ordenar por timestamp si está disponible
    projectKeys.sort((a, b) => {
      const aTime = localStorage.getItem(`${a}_timestamp`) || '0';
      const bTime = localStorage.getItem(`${b}_timestamp`) || '0';
      return parseInt(aTime) - parseInt(bTime);
    });

    // Eliminar los más antiguos
    const toRemove = projectKeys.slice(0, CLEANUP_BATCH_SIZE);
    toRemove.forEach(key => {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
    });

    storageLogger.info(`Limpiados ${toRemove.length} elementos antiguos de localStorage`);
  } catch (error) {
    console.warn('Error limpiando datos antiguos:', error);
  }
};

/**
 * Guarda datos en localStorage de forma segura
 * @param {string} key - Clave del dato
 * @param {any} value - Valor a guardar
 * @param {number} attempts - Número de intentos (interno)
 * @returns {boolean} True si se guardó correctamente
 */
export const safeLocalStorageSet = (key, value, attempts = 0) => {
  try {
    // Validar que localStorage esté disponible
    if (typeof window === 'undefined' || !window.localStorage) {
      storageLogger.warn('localStorage no disponible');
      return false;
    }

    // Validar entrada
    if (typeof key !== 'string' || key.length === 0) {
      storageLogger.error('Clave inválida para localStorage', { key });
      return false;
    }

    // Serializar valor
    const serializedValue = JSON.stringify(value);
    
    // Verificar tamaño
    if (serializedValue.length > MAX_STORAGE_SIZE) {
      storageLogger.error('Datos demasiado grandes para localStorage', { size: serializedValue.length });
      return false;
    }

    // Intentar guardar
    localStorage.setItem(key, serializedValue);
    
    // Guardar timestamp para limpieza
    localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError' && attempts < MAX_ATTEMPTS) {
      storageLogger.warn('localStorage lleno, limpiando datos antiguos...');
      cleanupOldData();
      return safeLocalStorageSet(key, value, attempts + 1);
    } else {
      storageLogger.error('Error guardando en localStorage', { error: error.message, key });
    }
    return false;
  }
};

/**
 * Obtiene datos de localStorage de forma segura
 * @param {string} key - Clave del dato
 * @param {any} defaultValue - Valor por defecto si no existe
 * @returns {any} Valor recuperado o defaultValue
 */
export const safeLocalStorageGet = (key, defaultValue = null) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultValue;
    }

    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    try {
      return JSON.parse(item);
    } catch (error) {
      console.warn('Error parsing stored item:', error);
      return null;
    }
  } catch (error) {
    storageLogger.error('Error leyendo de localStorage', { error: error.message, key });
    
    // Intentar limpiar dato corrupto
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
    } catch (cleanupError) {
      storageLogger.warn('Error limpiando dato corrupto', { error: cleanupError.message, key });
    }
    
    return defaultValue;
  }
};

/**
 * Elimina un dato de localStorage de forma segura
 * @param {string} key - Clave del dato a eliminar
 * @returns {boolean} True si se eliminó correctamente
 */
export const safeLocalStorageRemove = (key) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_timestamp`);
    return true;
  } catch (error) {
    storageLogger.error('Error eliminando de localStorage', { error: error.message, key });
    return false;
  }
};

/**
 * Limpia todos los datos del proyecto de localStorage
 */
export const clearProjectData = () => {
  try {
    const keys = Object.keys(localStorage);
    const projectKeys = keys.filter(k => k.includes('groundingCalculator'));
    
    projectKeys.forEach(key => {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
    });

    storageLogger.info(`Eliminados ${projectKeys.length} elementos del proyecto de localStorage`);
  } catch (error) {
    storageLogger.error('Error limpiando datos del proyecto', { error: error.message });
  }
};

/**
 * Obtiene estadísticas del uso de localStorage
 */
export const getStorageStats = () => {
  try {
    const totalSize = getStorageSize();
    const keys = Object.keys(localStorage);
    const projectKeys = keys.filter(k => k.includes('groundingCalculator'));
    
    return {
      totalSize,
      totalKeys: keys.length,
      projectKeys: projectKeys.length,
      availableSpace: MAX_STORAGE_SIZE - totalSize,
      usagePercentage: MAX_STORAGE_SIZE > 0 ? ((totalSize / MAX_STORAGE_SIZE) * 100).toFixed(2) : '0'
    };
  } catch (error) {
    storageLogger.error('Error obteniendo estadísticas de localStorage', { error: error.message });
    return null;
  }
};
