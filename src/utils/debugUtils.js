/**
 * Utilidades de depuración comprehensive para la aplicación
 */

import { logger } from './loggerUtils';
import { memoryMonitor } from './performanceUtils';

/**
 * Clase principal de depuración
 */
export class DebugSuite {
  constructor() {
    this.debugInfo = {
      startTime: Date.now(),
      errors: [],
      warnings: [],
      performance: {},
      memory: {},
      calculations: [],
      userActions: []
    };
    
    this.intervals = [];
    
    this.setupGlobalErrorHandlers();
    this.setupPerformanceMonitoring();
  }

  /**
   * Configura manejadores de errores globales
   */
  setupGlobalErrorHandlers() {
    // Capturar errores no manejados
    window.addEventListener('error', (event) => {
      this.logError('Global Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Capturar promesas rechazadas no manejadas
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  /**
   * Configura monitoreo de rendimiento
   */
  setupPerformanceMonitoring() {
    // Monitorear uso de memoria cada 30 segundos
    const memoryInterval = setInterval(() => {
      const memoryUsage = memoryMonitor.getUsage();
      if (memoryUsage) {
        this.debugInfo.memory[Date.now()] = memoryUsage;
        
        // Alertar si el uso de memoria es alto
        if (memoryUsage.used > 150) {
          this.logWarning('High Memory Usage', memoryUsage);
        }
      }
    }, 30000);
    this.intervals.push(memoryInterval);

    // Monitorear rendimiento de cálculos
    this.monitorCalculationPerformance();
  }

  /**
   * Monitorea rendimiento de cálculos matemáticos
   */
  monitorCalculationPerformance() {
    // Interceptar llamadas a funciones críticas
    const originalCalculateIEEE80 = window.calculateIEEE80;
    if (originalCalculateIEEE80) {
      window.calculateIEEE80 = (...args) => {
        const start = performance.now();
        const result = originalCalculateIEEE80(...args);
        const end = performance.now();
        
        this.debugInfo.calculations.push({
          timestamp: Date.now(),
          duration: end - start,
          args: args.length,
          success: !!result
        });

        // Log si toma mucho tiempo
        if (end - start > 100) {
          this.logWarning('Slow Calculation', {
            duration: end - start,
            args: args.length
          });
        }

        return result;
      };
    }
  }

  /**
   * Registra un error
   */
  logError(type, details) {
    const error = {
      type,
      details,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.debugInfo.errors.push(error);
    logger.error(`[DEBUG] ${type}`, details);
    
    // Enviar a servicio de monitoreo si está disponible
    if (window.Sentry) {
      window.Sentry.captureException(new Error(type), { extra: details });
    }
  }

  /**
   * Registra una advertencia
   */
  logWarning(type, details) {
    const warning = {
      type,
      details,
      timestamp: Date.now()
    };
    
    this.debugInfo.warnings.push(warning);
    logger.warn(`[DEBUG] ${type}`, details);
  }

  /**
   * Registra una acción del usuario
   */
  logUserAction(action, details) {
    const userAction = {
      action,
      details,
      timestamp: Date.now()
    };
    
    this.debugInfo.userActions.push(userAction);
    logger.debug(`[USER] ${action}`, details);
  }

  /**
   * Verifica la salud de la aplicación
   */
  checkHealth() {
    const health = {
      status: 'healthy',
      issues: [],
      metrics: {
        uptime: Date.now() - this.debugInfo.startTime,
        errorCount: this.debugInfo.errors.length,
        warningCount: this.debugInfo.warnings.length,
        calculationCount: this.debugInfo.calculations.length,
        avgCalculationTime: this.getAverageCalculationTime(),
        memoryUsage: memoryMonitor.getUsage()
      }
    };

    // Verificar problemas
    if (health.metrics.errorCount > 0) {
      health.status = 'unhealthy';
      health.issues.push(`${health.metrics.errorCount} errors detected`);
    }

    if (health.metrics.warningCount > 10) {
      health.status = 'degraded';
      health.issues.push(`${health.metrics.warningCount} warnings detected`);
    }

    if (health.metrics.avgCalculationTime > 50) {
      health.status = 'degraded';
      health.issues.push('Slow calculation performance');
    }

    const memoryUsage = health.metrics.memoryUsage;
    if (memoryUsage && memoryUsage.used > 200) {
      health.status = 'degraded';
      health.issues.push('High memory usage');
    }

    return health;
  }

  /**
   * Obtiene tiempo promedio de cálculo
   */
  getAverageCalculationTime() {
    if (this.debugInfo.calculations.length === 0) return 0;
    
    const total = this.debugInfo.calculations.reduce((sum, calc) => sum + calc.duration, 0);
    return total / this.debugInfo.calculations.length;
  }

  /**
   * Genera reporte de depuración
   */
  generateDebugReport() {
    const health = this.checkHealth();
    
    return {
      timestamp: Date.now(),
      health,
      debugInfo: this.debugInfo,
      system: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      },
      performance: {
        timing: performance.timing,
        navigation: performance.navigation
      }
    };
  }

  /**
   * Depura cálculos matemáticos
   */
  debugCalculations() {
    const issues = [];
    
    // Verificar consistencia de cálculos
    this.debugInfo.calculations.forEach((calc, index) => {
      if (calc.duration > 200) {
        issues.push(`Calculation ${index} took ${calc.duration.toFixed(2)}ms`);
      }
      
      if (!calc.success) {
        issues.push(`Calculation ${index} failed`);
      }
    });

    return {
      totalCalculations: this.debugInfo.calculations.length,
      averageTime: this.getAverageCalculationTime(),
      issues,
      recentCalculations: this.debugInfo.calculations.slice(-10)
    };
  }

  /**
   * Depura almacenamiento local
   */
  debugLocalStorage() {
    const issues = [];
    const usage = {};
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        
        usage[key] = {
          size,
          sizeKB: (size / 1024).toFixed(2)
        };
        
        // Verificar datos muy grandes
        if (size > 100000) { // 100KB
          issues.push(`Large data in key: ${key} (${(size / 1024).toFixed(2)}KB)`);
        }
        
        // Verificar datos corruptos
        try {
          JSON.parse(value);
        } catch (e) {
          issues.push(`Corrupt data in key: ${key}`);
        }
      }
    } catch (error) {
      issues.push(`Error accessing localStorage: ${error.message}`);
    }

    return {
      totalKeys: localStorage.length,
      usage,
      issues
    };
  }

  /**
   * Depura componentes de React
   */
  debugReactComponents() {
    const issues = [];
    
    // Verificar si React DevTools está disponible
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const reactHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      const instances = reactHook.renderers?.[0]?.getCurrentFiber()?.child?.child?.child;
      
      if (instances) {
        // Contar componentes renderizados
        let componentCount = 0;
        const traverse = (node) => {
          if (node) {
            componentCount++;
            traverse(node.child);
            traverse(node.sibling);
          }
        };
        
        traverse(instances);
        
        if (componentCount > 1000) {
          issues.push(`Too many components rendered: ${componentCount}`);
        }
      }
    }

    return {
      reactDevToolsAvailable: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__,
      issues
    };
  }

  /**
   * Limpia todos los intervalos para evitar memory leaks
   */
  cleanup() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  /**
   * Ejecuta diagnóstico completo
   */
  async runFullDiagnostics() {
    logger.info('Starting full diagnostic suite...');
    
    const diagnostics = {
      timestamp: Date.now(),
      health: this.checkHealth(),
      calculations: this.debugCalculations(),
      localStorage: this.debugLocalStorage(),
      reactComponents: this.debugReactComponents(),
      memory: memoryMonitor.getUsage(),
      performance: performance.now() - this.debugInfo.startTime
    };

    logger.info('Diagnostic completed', diagnostics);
    
    return diagnostics;
  }
}

// Instancia global de depuración
export const debugSuite = new DebugSuite();

/**
 * Funciones de conveniencia para depuración
 */
export const debug = {
  error: (type, details) => debugSuite.logError(type, details),
  warning: (type, details) => debugSuite.logWarning(type, details),
  userAction: (action, details) => debugSuite.logUserAction(action, details),
  health: () => debugSuite.checkHealth(),
  report: () => debugSuite.generateDebugReport(),
  diagnostics: () => debugSuite.runFullDiagnostics()
};

// Exponer para depuración en navegador
if (typeof window !== 'undefined') {
  window.debugSuite = debugSuite;
  window.debug = debug;
}
