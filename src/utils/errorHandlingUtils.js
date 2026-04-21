/**
 * Utilidades estandarizadas para manejo de errores
 */

/**
 * Clase base para errores de la aplicación
 */
export class AppError extends Error {
  constructor(message, code = 'APP_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Error de validación de parámetros
 */
export class ValidationError extends AppError {
  constructor(message, field = null, value = null) {
    super(message, 'VALIDATION_ERROR', { field, value });
    this.name = 'ValidationError';
  }
}

/**
 * Error de cálculo matemático
 */
export class CalculationError extends AppError {
  constructor(message, operation = null, parameters = null) {
    super(message, 'CALCULATION_ERROR', { operation, parameters });
    this.name = 'CalculationError';
  }
}

/**
 * Error de almacenamiento
 */
export class StorageError extends AppError {
  constructor(message, operation = null, key = null) {
    super(message, 'STORAGE_ERROR', { operation, key });
    this.name = 'StorageError';
  }
}

/**
 * Error de red o API
 */
export class NetworkError extends AppError {
  constructor(message, url = null, status = null) {
    super(message, 'NETWORK_ERROR', { url, status });
    this.name = 'NetworkError';
  }
}

/**
 * Wrapper para ejecutar funciones con manejo de errores estandarizado
 * @param {Function} fn - Función a ejecutar
 * @param {Object} options - Opciones de manejo de errores
 * @returns {Function} Función wrapper con manejo de errores
 */
export const withErrorHandling = (fn, options = {}) => {
  const {
    rethrow = true,
    logErrors = true,
    fallbackValue = null,
    onError = null
  } = options;

  return async (...args) => {
    try {
      const result = await fn(...args);
      return result;
    } catch (error) {
      // Estandarizar el error si no es de tipo AppError
      const standardError = error instanceof AppError 
        ? error 
        : new AppError(error.message || 'Error desconocido', 'UNKNOWN_ERROR');

      // Log del error
      if (logErrors) {
        console.error(`[${standardError.code}] ${standardError.message}`, {
          error: standardError,
          args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg)
        });
      }

      // Callback personalizado
      if (onError && typeof onError === 'function') {
        onError(standardError, args);
      }

      // Manejo del error
      if (rethrow) {
        throw standardError;
      }

      return fallbackValue;
    }
  };
};

/**
 * Validador de parámetros con manejo de errores
 * @param {Object} schema - Esquema de validación
 * @returns {Function} Función de validación
 */
export const createValidator = (schema) => {
  return (data) => {
    const errors = [];
    const validatedData = {};

    for (const [key, rules] of Object.entries(schema)) {
      const value = data[key];

      // Validación de requerido
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(new ValidationError(`${key} es requerido`, key, value));
        continue;
      }

      // Si no es requerido y está vacío, saltar validaciones adicionales
      if (!rules.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Validación de tipo
      if (rules.type && typeof value !== rules.type) {
        errors.push(new ValidationError(`${key} debe ser de tipo ${rules.type}`, key, value));
        continue;
      }

      // Validación de rango (para números)
      if (rules.type === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(new ValidationError(`${key} debe ser >= ${rules.min}`, key, value));
          continue;
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(new ValidationError(`${key} debe ser <= ${rules.max}`, key, value));
          continue;
        }
      }

      // Validación de longitud (para strings)
      if (rules.type === 'string') {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push(new ValidationError(`${key} debe tener al menos ${rules.minLength} caracteres`, key, value));
          continue;
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push(new ValidationError(`${key} debe tener máximo ${rules.maxLength} caracteres`, key, value));
          continue;
        }
      }

      // Validación de valores permitidos
      if (rules.allowedValues && !rules.allowedValues.includes(value)) {
        errors.push(new ValidationError(`${key} debe ser uno de: ${rules.allowedValues.join(', ')}`, key, value));
        continue;
      }

      // Validación personalizada
      if (rules.validate && typeof rules.validate === 'function') {
        const customResult = rules.validate(value);
        if (customResult !== true) {
          errors.push(new ValidationError(customResult || `${key} no es válido`, key, value));
          continue;
        }
      }

      // Si pasó todas las validaciones, guardar el valor
      validatedData[key] = value;
    }

    if (errors.length > 0) {
      throw new ValidationError('Validación fallida', null, errors);
    }

    return validatedData;
  };
};

/**
 * Manejador de errores asíncrono para Express/React
 * @param {Function} fn - Función asíncrona
 * @returns {Function} Middleware con manejo de errores
 */
export const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Logger de errores con contexto
 * @param {Error} error - Error a loguear
 * @param {Object} context - Contexto adicional
 */
export const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    code: error.code || 'UNKNOWN',
    timestamp: new Date().toISOString(),
    context
  };

  // Log a consola con formato estructurado
  console.error('ERROR:', JSON.stringify(errorInfo, null, 2));

  // Aquí se podría agregar logging a servicios externos (Sentry, LogRocket, etc.)
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(error, { extra: context });
  }
};

/**
 * Recupera de errores con retry
 * @param {Function} fn - Función a reintentar
 * @param {number} maxRetries - Máximo de reintentos
 * @param {number} delay - Retraso entre reintentos (ms)
 * @returns {Promise} Resultado de la función
 */
export const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }

      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
};

/**
 * Formatea errores para mostrar al usuario
 * @param {Error} error - Error a formatear
 * @returns {string} Mensaje formateado
 */
export const formatErrorForUser = (error) => {
  if (error instanceof ValidationError) {
    return error.details?.field 
      ? `Error en ${error.details.field}: ${error.message}`
      : error.message;
  }

  if (error instanceof CalculationError) {
    return `Error en cálculo: ${error.message}`;
  }

  if (error instanceof StorageError) {
    return `Error de almacenamiento: ${error.message}`;
  }

  if (error instanceof NetworkError) {
    return `Error de conexión: ${error.message}`;
  }

  // Error genérico
  return 'Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo.';
};
