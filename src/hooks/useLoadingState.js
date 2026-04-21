import { useState, useCallback, useRef } from 'react';

export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingSteps, setLoadingSteps] = useState([]);
  const [loadingType, setLoadingType] = useState('indeterminate'); // 'indeterminate', 'determinate'
  const [loadingError, setLoadingError] = useState(null);
  
  const abortControllerRef = useRef(null);

  /**
   * Inicia el estado de carga
   * @param {string} message - Mensaje principal
   * @param {Array} steps - Pasos a mostrar (opcional)
   * @param {string} type - Tipo de carga ('indeterminate' o 'determinate')
   */
  const startLoading = useCallback((message = 'Procesando...', steps = [], type = 'indeterminate') => {
    // Cancelar carga anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setLoadingMessage(message);
    setLoadingProgress(0);
    setLoadingSteps(steps);
    setLoadingType(type);
    setLoadingError(null);
  }, []);

  /**
   * Actualiza el progreso de carga
   * @param {number} progress - Porcentaje de progreso (0-100)
   * @param {string} stepMessage - Mensaje del paso actual (opcional)
   */
  const updateProgress = useCallback((progress, stepMessage = null) => {
    const clampedProgress = Math.min(100, Math.max(0, progress));
    setLoadingProgress(clampedProgress);
    if (stepMessage) setLoadingMessage(stepMessage);
    
    // Si es carga determinada y el progreso llega a 100, auto-cerrar
    if (loadingType === 'determinate' && clampedProgress === 100) {
      setTimeout(() => {
        stopLoading();
      }, 500);
    }
  }, [loadingType]);

  /**
   * Avanza al siguiente paso
   */
  const nextStep = useCallback(() => {
    if (loadingSteps.length > 0) {
      const currentIndex = Math.floor(loadingProgress / (100 / loadingSteps.length));
      if (currentIndex < loadingSteps.length && loadingSteps[currentIndex]) {
        setLoadingMessage(loadingSteps[currentIndex]);
      }
    }
  }, [loadingProgress, loadingSteps]);

  /**
   * Avanza al siguiente paso con incremento de progreso
   * @param {number} increment - Incremento de progreso (0-100)
   */
  const advanceStep = useCallback((increment = 0) => {
    if (loadingSteps.length > 0) {
      const stepSize = 100 / loadingSteps.length;
      const currentStep = Math.floor(loadingProgress / stepSize);
      
      if (currentStep < loadingSteps.length - 1) {
        const newProgress = (currentStep + 1) * stepSize;
        setLoadingProgress(Math.min(100, newProgress));
        setLoadingMessage(loadingSteps[currentStep + 1]);
      }
    } else if (increment > 0) {
      setLoadingProgress(prev => Math.min(100, prev + increment));
    }
  }, [loadingProgress, loadingSteps]);

  /**
   * Detiene el estado de carga
   */
  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage('');
    setLoadingProgress(0);
    setLoadingSteps([]);
    setLoadingType('indeterminate');
    setLoadingError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Registra un error durante la carga
   * @param {Error} error - Error ocurrido
   */
  const setError = useCallback((error) => {
    setLoadingError(error);
    setLoadingMessage(`Error: ${error.message || 'Ocurrió un error'}`);
  }, []);

  /**
   * Ejecuta una función asíncrona con manejo de estado de carga
   * @param {Function} fn - Función asíncrona a ejecutar
   * @param {string} message - Mensaje de carga
   * @param {Array} steps - Pasos a mostrar
   * @param {Object} options - Opciones adicionales
   * @returns {Promise} Resultado de la función
   */
  const withLoading = useCallback(async (fn, message = 'Procesando...', steps = [], options = {}) => {
    const { type = 'indeterminate', showProgress = true, onError } = options;
    
    startLoading(message, steps, type);
    
    try {
      const result = await fn(updateProgress, nextStep, advanceStep, abortControllerRef.current?.signal);
      return result;
    } catch (error) {
      console.error('Error en operación:', error);
      setError(error);
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    } finally {
      if (!options.keepLoading) {
        stopLoading();
      }
    }
  }, [startLoading, updateProgress, nextStep, advanceStep, stopLoading, setError]);

  /**
   * Crea un loader para múltiples operaciones en paralelo
   * @param {Array} tasks - Array de funciones a ejecutar
   * @param {string} message - Mensaje base
   * @returns {Promise} Resultados de todas las operaciones
   */
  const withParallelLoading = useCallback(async (tasks, message = 'Procesando operaciones...') => {
    startLoading(message, [], 'determinate');
    
    const total = tasks.length;
    let completed = 0;
    
    const results = await Promise.all(
      tasks.map(async (task, index) => {
        try {
          const result = await task();
          completed++;
          updateProgress((completed / total) * 100, `${message} (${completed}/${total})`);
          return { success: true, data: result, index };
        } catch (error) {
          return { success: false, error, index };
        }
      })
    );
    
    stopLoading();
    
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      console.warn(`${failed.length} operaciones fallaron`);
    }
    
    return results;
  }, [startLoading, updateProgress, stopLoading]);

  /**
   * Crea un loader con temporizador (útil para operaciones que pueden tardar)
   * @param {number} duration - Duración estimada en ms
   * @param {string} message - Mensaje de carga
   * @returns {Object} Controlador del temporizador
   */
  const withTimer = useCallback((duration, message = 'Cargando...') => {
    startLoading(message, [], 'determinate');
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      updateProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        stopLoading();
      }
    }, 100);
    
    return {
      stop: () => {
        clearInterval(interval);
        stopLoading();
      }
    };
  }, [startLoading, updateProgress, stopLoading]);

  /**
   * Reinicia el estado de carga
   */
  const reset = useCallback(() => {
    stopLoading();
    setLoadingError(null);
  }, [stopLoading]);

  return {
    // Estados
    isLoading,
    loadingMessage,
    loadingProgress,
    loadingSteps,
    loadingType,
    loadingError,
    
    // Acciones básicas
    startLoading,
    updateProgress,
    nextStep,
    advanceStep,
    stopLoading,
    setError,
    reset,
    
    // Acciones compuestas
    withLoading,
    withParallelLoading,
    withTimer,
    
    // Utilidades
    isDeterminate: loadingType === 'determinate',
    isIndeterminate: loadingType === 'indeterminate',
    hasError: loadingError !== null,
    
    // Abort controller
    abortController: abortControllerRef.current
  };
};

// Hook específico para carga con retry
export const useLoadingWithRetry = (maxRetries = 3) => {
  const loadingState = useLoadingState();
  const [retryCount, setRetryCount] = useState(0);
  
  const withRetry = useCallback(async (fn, message = 'Procesando...', options = {}) => {
    const { retryDelay = 1000, onRetry } = options;
    
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt);
        const result = await loadingState.withLoading(fn, message);
        setRetryCount(0);
        return result;
      } catch (error) {
        lastError = error;
        if (onRetry) onRetry(attempt, error);
        
        if (attempt < maxRetries) {
          loadingState.updateProgress((attempt / maxRetries) * 100, `Reintentando (${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    setRetryCount(0);
    throw lastError;
  }, [loadingState, maxRetries]);
  
  return {
    ...loadingState,
    withRetry,
    retryCount,
    maxRetries
  };
};

export default useLoadingState;