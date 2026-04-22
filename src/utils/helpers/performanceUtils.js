/**
 * Utilidades de rendimiento y optimización
 */

/**
 * Mide el tiempo de ejecución de una función
 */
export const measurePerformance = (fn, name = 'Function') => {
  return async (...args) => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const end = performance.now();
      const duration = end - start;
      
      if (duration > 100) {
        console.warn(`[PERFORMANCE] ${name} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const end = performance.now();
      const duration = end - start;
      console.error(`[PERFORMANCE] ${name} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };
};

/**
 * Memoización simple para funciones puras
 */
export const memoize = (fn, keyGenerator = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return (...args) => {
    const key = keyGenerator(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limitar cache a 100 entradas para evitar memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
};

/**
 * Debounce para prevenir ejecuciones frecuentes
 */
export const debounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle para limitar frecuencia de ejecución
 */
export const throttle = (func, limit) => {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Verifica si el objeto está en el viewport
 */
export const isInViewport = (element) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

/**
 * Lazy loading para componentes
 */
export const lazyLoad = (callback, options = {}) => {
  const { root = null, rootMargin = '0px', threshold = 0.1 } = options;
  
  return new Promise((resolve) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            callback().then(resolve);
          }
        });
      },
      { root, rootMargin, threshold }
    );
    
    // Crear elemento temporal para observar
    const tempElement = document.createElement('div');
    tempElement.style.height = '1px';
    tempElement.style.position = 'absolute';
    tempElement.style.top = '-9999px';
    document.body.appendChild(tempElement);
    
    observer.observe(tempElement);
  });
};

/**
 * Optimización de cálculos pesados
 */
export const optimizeHeavyCalculations = (calculationFn, chunkSize = 100) => {
  return async (data) => {
    const results = [];
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const chunkResults = chunk.map(item => calculationFn(item));
      results.push(...chunkResults);
      
      // Permitir que el browser respire entre chunks
      if (i + chunkSize < data.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return results;
  };
};

/**
 * Monitoreo de memoria
 */
export const memoryMonitor = {
  getUsage: () => {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      };
    }
    return null;
  },
  
  logUsage: (label = 'Memory') => {
    const usage = memoryMonitor.getUsage();
    if (usage) {
      console.log(`[MEMORY] ${label}: ${usage.used}MB / ${usage.total}MB (${usage.limit}MB limit)`);
    }
  },
  
  checkLeak: (threshold = 100) => {
    const usage = memoryMonitor.getUsage();
    if (usage && usage.used > threshold) {
      console.warn(`[MEMORY] High memory usage detected: ${usage.used}MB`);
      return true;
    }
    return false;
  }
};
