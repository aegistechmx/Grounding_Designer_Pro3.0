// src/utils/index.js
// PUNTO DE ENTRADA PRINCIPAL - Mantiene compatibilidad con imports existentes

// Re-exportar desde subcarpetas para mantener compatibilidad
export * from './physics/index.js';
export * from './export/index.js';
export * from './validation/index.js';
export * from './ai/index.js';
export * from './helpers/index.js';

// Exportaciones específicas para compatibilidad
export { default as generateFullPDF } from './export/pdfFullPro.js';
export { default as dxfExport } from './export/exportDXF.js';
