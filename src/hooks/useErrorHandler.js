import { useState, useCallback, useEffect } from 'react';

// Tipos de error predefinidos
export const ErrorTypes = {
  CALCULATION: 'calculation',
  NETWORK: 'network',
  VALIDATION: 'validation',
  LOCAL_STORAGE: 'localStorage',
  EXPORT: 'export',
  IMPORT: 'import',
  API: 'api',
  PERMISSION: 'permission',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown'
};

// Mapeo de mensajes de error por tipo
const ERROR_MESSAGES = {
  [ErrorTypes.CALCULATION]: {
    title: 'Error de cálculo',
    defaultSolution: 'Verifique que los valores de entrada sean correctos (positivos y dentro de rangos válidos).'
  },
  [ErrorTypes.NETWORK]: {
    title: 'Error de conexión',
    defaultSolution: 'Verifique su conexión a internet y recargue la página.'
  },
  [ErrorTypes.VALIDATION]: {
    title: 'Datos de entrada inválidos',
    defaultSolution: 'Revise que todos los campos numéricos tengan valores correctos (positivos).'
  },
  [ErrorTypes.LOCAL_STORAGE]: {
    title: 'Error al guardar datos locales',
    defaultSolution: 'Intente limpiar la caché del navegador o verifique el espacio disponible.'
  },
  [ErrorTypes.EXPORT]: {
    title: 'Error al exportar',
    defaultSolution: 'Intente nuevamente o exporte en otro formato.'
  },
  [ErrorTypes.IMPORT]: {
    title: 'Error al importar',
    defaultSolution: 'Verifique que el archivo tenga el formato correcto (JSON).'
  },
  [ErrorTypes.API]: {
    title: 'Error en la comunicación con el servidor',
    defaultSolution: 'Intente nuevamente más tarde.'
  },
  [ErrorTypes.PERMISSION]: {
    title: 'Error de permisos',
    defaultSolution: 'Verifique que tenga los permisos necesarios.'
  },
  [ErrorTypes.TIMEOUT]: {
    title: 'Tiempo de espera agotado',
    defaultSolution: 'La operación tardó demasiado. Intente con menos datos.'
  },
  [ErrorTypes.UNKNOWN]: {
    title: 'Error inesperado',
    defaultSolution: 'Recargue la página o contacte a soporte técnico.'
  }
};

export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [errorHistory, setErrorHistory] = useState([]);
  const [errorCount, setErrorCount] = useState(0);

  /**
   * Detecta el tipo de error basado en el mensaje
   * @param {Error} err - Error capturado
   * @returns {string} Tipo de error
   */
  const detectErrorType = useCallback((err) => {
    const message = err.message?.toLowerCase() || '';
    
    if (message.includes('division by zero') || message.includes('nan') || message.includes('infinity')) {
      return ErrorTypes.CALCULATION;
    }
    if (message.includes('localstorage') || message.includes('quota') || message.includes('storage')) {
      return ErrorTypes.LOCAL_STORAGE;
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return ErrorTypes.NETWORK;
    }
    if (message.includes('invalid') || message.includes('validation') || message.includes('required')) {
      return ErrorTypes.VALIDATION;
    }
    if (message.includes('export') || message.includes('pdf') || message.includes('dxf')) {
      return ErrorTypes.EXPORT;
    }
    if (message.includes('import') || message.includes('json') || message.includes('parse')) {
      return ErrorTypes.IMPORT;
    }
    if (message.includes('timeout') || message.includes('slow')) {
      return ErrorTypes.TIMEOUT;
    }
    if (message.includes('permission') || message.includes('denied') || message.includes('forbidden')) {
      return ErrorTypes.PERMISSION;
    }
    if (message.includes('api') || message.includes('server') || message.includes('http')) {
      return ErrorTypes.API;
    }
    
    return ErrorTypes.UNKNOWN;
  }, []);

  /**
   * Obtiene solución específica para el error según contexto
   * @param {Error} err - Error capturado
   * @param {string} type - Tipo de error
   * @returns {string} Solución accionable
   */
  const getActionableSolution = useCallback((err, type) => {
    const message = err.message?.toLowerCase() || '';
    
    switch (type) {
      case ErrorTypes.CALCULATION:
        if (message.includes('division by zero')) {
          return 'Verifique que los valores de entrada (resistividad, dimensiones) sean mayores a cero.';
        }
        if (message.includes('nan')) {
          return 'Algún valor de entrada no es un número válido. Revise los campos numéricos.';
        }
        return ERROR_MESSAGES[type].defaultSolution;
        
      case ErrorTypes.LOCAL_STORAGE:
        if (message.includes('quota')) {
          return 'El almacenamiento local está lleno. Elimine perfiles antiguos o limpie la caché.';
        }
        return ERROR_MESSAGES[type].defaultSolution;
        
      case ErrorTypes.EXPORT:
        if (message.includes('pdf')) {
          return 'Error al generar PDF. Permita ventanas emergentes o intente con otro formato.';
        }
        if (message.includes('dxf')) {
          return 'Error al generar DXF. Verifique que los datos de la malla sean correctos.';
        }
        return ERROR_MESSAGES[type].defaultSolution;
        
      case ErrorTypes.NETWORK:
        return 'Verifique su conexión a internet. Si el problema persiste, contacte a soporte.';
        
      default:
        return ERROR_MESSAGES[type].defaultSolution;
    }
  }, []);

  /**
   * Maneja el error y actualiza el estado
   * @param {Error} err - Error capturado
   * @param {string} context - Contexto donde ocurrió el error
   * @returns {Object} Información del error
   */
  const handleError = useCallback((err, context = '') => {
    const errorType = detectErrorType(err);
    const errorConfig = ERROR_MESSAGES[errorType];
    const userMessage = errorConfig.title;
    const actionableSolution = getActionableSolution(err, errorType);
    
    const errorInfo = {
      id: Date.now(),
      type: errorType,
      message: userMessage,
      context,
      originalMessage: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
      solution: actionableSolution
    };
    
    setError({ message: userMessage, context, original: err.message, type: errorType });
    setErrorDetails({ solution: actionableSolution, timestamp: new Date().toISOString(), type: errorType });
    setErrorHistory(prev => [errorInfo, ...prev].slice(0, 50)); // Guardar últimos 50 errores
    setErrorCount(prev => prev + 1);
    
    // Log para debugging
    console.error(`[ERROR] ${context}:`, err);
    console.error(`[ERROR TYPE] ${errorType}`);
    
    return { 
      userMessage, 
      actionableSolution, 
      errorType,
      errorId: errorInfo.id
    };
  }, [detectErrorType, getActionableSolution]);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setError(null);
    setErrorDetails(null);
  }, []);

  /**
   * Limpia todo el historial de errores
   */
  const clearErrorHistory = useCallback(() => {
    setErrorHistory([]);
    setErrorCount(0);
  }, []);

  /**
   * Muestra un toast con el error
   * @param {Error} err - Error capturado
   * @param {string} context - Contexto del error
   */
  const showErrorToast = useCallback((err, context) => {
    const { userMessage, actionableSolution, errorType } = handleError(err, context);
    
    // Disparar evento para mostrar toast
    window.dispatchEvent(new CustomEvent('showToast', { 
      detail: { 
        type: 'error', 
        title: userMessage, 
        message: actionableSolution,
        errorType,
        timestamp: new Date().toISOString()
      }
    }));
  }, [handleError]);

  /**
   * Obtiene el último error del historial
   * @returns {Object|null} Último error o null
   */
  const getLastError = useCallback(() => {
    return errorHistory[0] || null;
  }, [errorHistory]);

  /**
   * Obtiene errores por tipo
   * @param {string} type - Tipo de error
   * @returns {Array} Errores del tipo especificado
   */
  const getErrorsByType = useCallback((type) => {
    return errorHistory.filter(e => e.type === type);
  }, [errorHistory]);

  /**
   * Genera un reporte de errores
   * @returns {Object} Reporte de errores
   */
  const generateErrorReport = useCallback(() => {
    const errorsByType = {};
    for (const type of Object.values(ErrorTypes)) {
      errorsByType[type] = errorHistory.filter(e => e.type === type).length;
    }
    
    return {
      totalErrors: errorCount,
      errorsByType,
      lastError: getLastError(),
      recentErrors: errorHistory.slice(0, 10),
      generatedAt: new Date().toISOString()
    };
  }, [errorCount, errorHistory, getLastError]);

  /**
   * Exporta el reporte de errores a CSV
   * @returns {string} CSV con el reporte
   */
  const exportErrorReport = useCallback(() => {
    const headers = ['ID', 'Timestamp', 'Type', 'Context', 'Message', 'Solution'];
    const rows = errorHistory.map(e => [
      e.id,
      e.timestamp,
      e.type,
      e.context,
      e.message,
      e.solution
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }, [errorHistory]);

  return {
    error,
    errorDetails,
    errorHistory,
    errorCount,
    handleError,
    clearError,
    clearErrorHistory,
    showErrorToast,
    getLastError,
    getErrorsByType,
    generateErrorReport,
    exportErrorReport,
    hasError: error !== null,
    ErrorTypes
  };
};

// Hook específico para manejo de errores de formulario
export const useFormErrorHandler = () => {
  const [fieldErrors, setFieldErrors] = useState({});
  const { showErrorToast } = useErrorHandler();

  const setFieldError = useCallback((field, message) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearFieldError = useCallback((field) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const hasFieldErrors = useCallback(() => {
    return Object.keys(fieldErrors).length > 0;
  }, [fieldErrors]);

  const validateRequired = useCallback((value, fieldName) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      setFieldError(fieldName, `${fieldName} es requerido`);
      return false;
    }
    clearFieldError(fieldName);
    return true;
  }, [setFieldError, clearFieldError]);

  const validateNumber = useCallback((value, fieldName, min, max) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      setFieldError(fieldName, `${fieldName} debe ser un número válido`);
      return false;
    }
    if (min !== undefined && num < min) {
      setFieldError(fieldName, `${fieldName} debe ser mayor o igual a ${min}`);
      return false;
    }
    if (max !== undefined && num > max) {
      setFieldError(fieldName, `${fieldName} debe ser menor o igual a ${max}`);
      return false;
    }
    clearFieldError(fieldName);
    return true;
  }, [setFieldError, clearFieldError]);

  return {
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    hasFieldErrors,
    validateRequired,
    validateNumber,
    showErrorToast
  };
};

export default useErrorHandler;