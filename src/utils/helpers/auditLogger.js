/**
 * Sistema de Auditoría y Logging
 * Registra todas las acciones del usuario para trazabilidad y depuración
 */

import { logger } from './loggerUtils';

// Almacenamiento en memoria de los logs
let auditLogs = [];

// Configuración
const MAX_MEMORY_LOGS = 2000;
const MAX_STORAGE_LOGS = 1000;
const STORAGE_KEY = 'auditLogs';

/**
 * Función segura para clonar objetos
 * Maneja circular references y objetos no serializables
 * @param {any} data - Datos a clonar
 * @returns {any} Datos clonados o versión simplificada
 */
const safeClone = (data) => {
  if (data === null || data === undefined) return null;
  
  // Manejar tipos primitivos
  if (typeof data !== 'object') return data;
  
  // Manejar Date
  if (data instanceof Date) return data.toISOString();
  
  // Manejar Error
  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack?.split('\n')[0]
    };
  }
  
  // Manejar arrays
  if (Array.isArray(data)) {
    return data.map(item => safeClone(item));
  }
  
  try {
    // Intentar clonar con JSON
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    // Si falla (por circular references), retornar una versión simplificada
    logger.warn('No se pudo clonar el objeto para audit log:', error.message);
    
    // Intentar extraer información útil
    const simplified = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        if (typeof value !== 'function' && value !== undefined) {
          try {
            simplified[key] = typeof value === 'object' ? '[Object]' : String(value).substring(0, 100);
          } catch (e) {
            simplified[key] = '[Unserializable]';
          }
        }
      }
    }
    
    return {
      error: 'Non-serializable data',
      type: typeof data,
      simplified,
      originalError: error.message
    };
  }
};

/**
 * Genera un ID único para el log
 * @returns {string} ID único
 */
const generateLogId = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 6)}`;
};

/**
 * Registra un evento en el log de auditoría
 * @param {string} level - Nivel del log ('info', 'warn', 'error', 'action', 'debug')
 * @param {string} message - Mensaje descriptivo
 * @param {any} data - Datos adicionales (opcional)
 * @returns {Object} Entrada de log creada
 */
export const auditLog = (level, message, data = null) => {
  // Validar nivel
  const validLevels = ['info', 'warn', 'error', 'action', 'debug'];
  if (!validLevels.includes(level)) {
    logger.warn(`Nivel de log inválido: ${level}, usando 'info'`);
    level = 'info';
  }
  
  const logEntry = {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    level: level,
    message: message,
    data: safeClone(data),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    referrer: typeof document !== 'undefined' ? document.referrer : 'unknown',
    screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown'
  };
  
  // Agregar a memoria
  auditLogs.push(logEntry);
  
  // Mantener solo últimos MAX_MEMORY_LOGS logs
  if (auditLogs.length > MAX_MEMORY_LOGS) {
    auditLogs = auditLogs.slice(-MAX_MEMORY_LOGS);
  }
  
  // Guardar en localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      const savedLogs = localStorage.getItem(STORAGE_KEY);
      let logs = savedLogs ? JSON.parse(savedLogs) : [];
      
      // Verificar que logs es un array
      if (!Array.isArray(logs)) logs = [];
      
      logs.push(logEntry);
      
      // Mantener solo últimos MAX_STORAGE_LOGS logs
      if (logs.length > MAX_STORAGE_LOGS) {
        logs = logs.slice(-MAX_STORAGE_LOGS);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      logger.warn('No se pudo guardar log en localStorage:', error);
    }
  }
  
  // También mostrar en consola según nivel
  if (level === 'error') {
    logger.error(`[AUDIT] ${message}`, data);
  } else if (level === 'warn') {
    logger.warn(`[AUDIT] ${message}`, data);
  } else {
    logger.info(`[AUDIT] ${message}`, data);
  }
  
  return logEntry;
};

/**
 * Obtiene los logs de auditoría con filtros
 * @param {Object} filter - Filtros a aplicar
 * @param {string} filter.level - Nivel del log
 * @param {string} filter.fromDate - Fecha inicial (ISO string)
 * @param {string} filter.toDate - Fecha final (ISO string)
 * @param {string} filter.search - Texto a buscar en mensaje
 * @param {number} filter.limit - Límite de resultados
 * @returns {Array} Logs filtrados
 */
export const getAuditLogs = (filter = {}) => {
  let logs = [...auditLogs];
  
  // Cargar logs de localStorage si no hay en memoria
  if (logs.length === 0 && typeof localStorage !== 'undefined') {
    try {
      const savedLogs = localStorage.getItem(STORAGE_KEY);
      if (savedLogs) {
        const parsed = JSON.parse(savedLogs);
        if (Array.isArray(parsed)) {
          logs = parsed;
          auditLogs = [...logs];
        }
      }
    } catch (error) {
      logger.warn('Error cargando logs de localStorage:', error);
    }
  }
  
  if (filter.level) {
    logs = logs.filter(l => l.level === filter.level);
  }
  
  if (filter.fromDate) {
    const fromDate = new Date(filter.fromDate);
    logs = logs.filter(l => new Date(l.timestamp) >= fromDate);
  }
  
  if (filter.toDate) {
    const toDate = new Date(filter.toDate);
    logs = logs.filter(l => new Date(l.timestamp) <= toDate);
  }
  
  if (filter.search) {
    const searchTerm = filter.search.toLowerCase();
    logs = logs.filter(l => 
      l.message.toLowerCase().includes(searchTerm) ||
      JSON.stringify(l.data).toLowerCase().includes(searchTerm)
    );
  }
  
  if (filter.limit && filter.limit > 0) {
    logs = logs.slice(-filter.limit);
  }
  
  return logs;
};

/**
 * Exporta los logs de auditoría a diferentes formatos
 * @param {string} format - Formato de exportación ('json', 'csv', 'html')
 * @param {Object} filter - Filtros para los logs
 * @returns {string} Contenido exportado
 */
export const exportAuditLogs = (format = 'json', filter = {}) => {
  const logs = getAuditLogs(filter);
  
  if (format === 'csv') {
    const headers = ['ID', 'Timestamp', 'Level', 'Message', 'Data', 'UserAgent', 'URL'];
    const rows = logs.map(log => [
      log.id,
      log.timestamp,
      log.level,
      `"${log.message.replace(/"/g, '""')}"`,
      `"${JSON.stringify(log.data).replace(/"/g, '""')}"`,
      log.userAgent,
      log.url
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  if (format === 'html') {
    const rows = logs.map(log => `
      <tr>
        <td>${log.id}</td>
        <td>${log.timestamp}</td>
        <td><span class="level-${log.level}">${log.level}</span></td>
        <td>${log.message}</td>
        <td><pre>${JSON.stringify(log.data, null, 2)}</pre></td>
      </tr>
    `).join('');
    
    return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Audit Logs - Grounding Designer Pro</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #1e40af; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f3f4f6; }
        .level-info { color: #3b82f6; }
        .level-warn { color: #f59e0b; }
        .level-error { color: #ef4444; }
        .level-action { color: #10b981; }
        pre { margin: 0; font-size: 10px; max-width: 300px; overflow-x: auto; }
      </style>
    </head>
    <body>
      <h1>Grounding Designer Pro - Auditoría</h1>
      <p>Generado: ${new Date().toLocaleString()}</p>
      <p>Total de registros: ${logs.length}</p>
      <table>
        <thead><tr><th>ID</th><th>Timestamp</th><th>Level</th><th>Message</th><th>Data</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
    </html>`;
  }
  
  // Default: JSON
  return JSON.stringify(logs, null, 2);
};

/**
 * Limpia todos los logs de auditoría
 * @returns {boolean} Éxito de la operación
 */
export const clearAuditLogs = () => {
  auditLogs = [];
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  auditLog('action', 'Audit logs cleared by user');
  return true;
};

/**
 * Obtiene estadísticas de los logs
 * @returns {Object} Estadísticas
 */
export const getAuditStats = () => {
  const logs = getAuditLogs();
  const stats = {
    total: logs.length,
    byLevel: {
      info: logs.filter(l => l.level === 'info').length,
      warn: logs.filter(l => l.level === 'warn').length,
      error: logs.filter(l => l.level === 'error').length,
      action: logs.filter(l => l.level === 'action').length,
      debug: logs.filter(l => l.level === 'debug').length
    },
    last24h: logs.filter(l => new Date(l.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
    last7d: logs.filter(l => new Date(l.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    oldestLog: logs.length > 0 ? logs[0]?.timestamp : null,
    newestLog: logs.length > 0 ? logs[logs.length - 1]?.timestamp : null
  };
  
  return stats;
};

/**
 * Exporta logs y los descarga como archivo
 * @param {string} format - Formato de exportación ('json', 'csv', 'html')
 * @param {Object} filter - Filtros para los logs
 */
export const downloadAuditLogs = (format = 'json', filter = {}) => {
  const content = exportAuditLogs(format, filter);
  const blob = new Blob([format === 'csv' ? '\uFEFF' + content : content], { type: format === 'csv' ? 'text/csv;charset=utf-8;' : format === 'html' ? 'text/html' : 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${format === 'csv' ? 'csv' : format === 'html' ? 'html' : 'json'}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default {
  auditLog,
  getAuditLogs,
  exportAuditLogs,
  downloadAuditLogs,
  clearAuditLogs,
  getAuditStats
};