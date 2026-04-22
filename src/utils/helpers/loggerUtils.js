/**
 * Utilidades de logging centralizadas para la aplicación
 */

// Niveles de logging
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Configuración del logger
const loggerConfig = {
  level: process.env.NODE_ENV === 'development' ? LOG_LEVELS.WARN : LOG_LEVELS.INFO, // Nivel mínimo de logging
  enableConsole: true,
  enableStorage: false, // Desactivado para producción
  maxStorageLogs: 100
};

/**
 * Logger centralizado con niveles configurables
 */
class Logger {
  constructor(config = {}) {
    this.config = { ...loggerConfig, ...config };
    this.logs = [];
  }

  /**
   * Determina si un nivel de log debe ser mostrado
   */
  shouldLog(level) {
    return level <= this.config.level;
  }

  /**
   * Formatea un mensaje de log
   */
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LOG_LEVELS)[level];
    const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${levelName}] ${message}${dataStr}`;
  }

  /**
   * Guarda logs en localStorage (opcional)
   */
  saveToStorage(logEntry) {
    if (!this.config.enableStorage) return;

    try {
      this.logs.push(logEntry);
      if (this.logs.length > this.config.maxStorageLogs) {
        this.logs = this.logs.slice(-this.config.maxStorageLogs);
      }
      localStorage.setItem('app_logs', JSON.stringify(this.logs));
    } catch (error) {
      // Silencioso para evitar recursión infinita
    }
  }

  /**
   * Log de error
   */
  error(message, data = null) {
    if (!this.shouldLog(LOG_LEVELS.ERROR)) return;

    const formattedMessage = this.formatMessage(LOG_LEVELS.ERROR, message, data);
    
    if (this.config.enableConsole) {
      console.error(formattedMessage);
    }

    this.saveToStorage({
      level: LOG_LEVELS.ERROR,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log de advertencia
   */
  warn(message, data = null) {
    if (!this.shouldLog(LOG_LEVELS.WARN)) return;

    const formattedMessage = this.formatMessage(LOG_LEVELS.WARN, message, data);
    
    if (this.config.enableConsole) {
      console.warn(formattedMessage);
    }

    this.saveToStorage({
      level: LOG_LEVELS.WARN,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log de información
   */
  info(message, data = null) {
    if (!this.shouldLog(LOG_LEVELS.INFO)) return;

    const formattedMessage = this.formatMessage(LOG_LEVELS.INFO, message, data);
    
    if (this.config.enableConsole) {
      console.log(formattedMessage);
    }

    this.saveToStorage({
      level: LOG_LEVELS.INFO,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log de debug
   */
  debug(message, data = null) {
    if (!this.shouldLog(LOG_LEVELS.DEBUG)) return;

    const formattedMessage = this.formatMessage(LOG_LEVELS.DEBUG, message, data);
    
    if (this.config.enableConsole) {
      console.log(formattedMessage);
    }

    this.saveToStorage({
      level: LOG_LEVELS.DEBUG,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Obtiene logs almacenados
   */
  getStoredLogs() {
    return this.logs;
  }

  /**
   * Limpia logs almacenados
   */
  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem('app_logs');
    } catch (error) {
      // Silencioso
    }
  }
}

// Instancia global del logger
export const logger = new Logger();

/**
 * Wrapper para funciones con logging automático
 */
export const withLogging = (fn, options = {}) => {
  const {
    name = 'Function',
    logArgs = false,
    logResult = false,
    logErrors = true,
    logTime = false
  } = options;

  return async (...args) => {
    const startTime = logTime ? performance.now() : null;
    
    if (logArgs) {
      logger.debug(`${name} called with args`, args);
    }

    try {
      const result = await fn(...args);
      
      if (logResult) {
        logger.debug(`${name} returned`, result);
      }
      
      if (logTime && startTime) {
        const duration = performance.now() - startTime;
        logger.debug(`${name} completed in ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      if (logErrors) {
        logger.error(`${name} failed`, { error: error.message, stack: error.stack });
      }
      throw error;
    }
  };
};

/**
 * Logger específico para operaciones de almacenamiento
 */
export const storageLogger = {
  error: (message, data) => logger.error(`[STORAGE] ${message}`, data),
  warn: (message, data) => logger.warn(`[STORAGE] ${message}`, data),
  info: (message, data) => logger.info(`[STORAGE] ${message}`, data),
  debug: (message, data) => logger.debug(`[STORAGE] ${message}`, data)
};

/**
 * Logger específico para operaciones matemáticas
 */
export const mathLogger = {
  error: (message, data) => logger.error(`[MATH] ${message}`, data),
  warn: (message, data) => logger.warn(`[MATH] ${message}`, data),
  info: (message, data) => logger.info(`[MATH] ${message}`, data),
  debug: (message, data) => logger.debug(`[MATH] ${message}`, data)
};

/**
 * Logger específico para operaciones de exportación
 */
export const exportLogger = {
  error: (message, data) => logger.error(`[EXPORT] ${message}`, data),
  warn: (message, data) => logger.warn(`[EXPORT] ${message}`, data),
  info: (message, data) => logger.info(`[EXPORT] ${message}`, data),
  debug: (message, data) => logger.debug(`[EXPORT] ${message}`, data)
};

/**
 * Configura el nivel de logging
 */
export const setLogLevel = (level) => {
  logger.config.level = level;
};

/**
 * Habilita/deshabilita logging en consola
 */
export const setConsoleLogging = (enabled) => {
  logger.config.enableConsole = enabled;
};

/**
 * Habilita/deshabilita logging en almacenamiento
 */
export const setStorageLogging = (enabled) => {
  logger.config.enableStorage = enabled;
};

export default logger;
