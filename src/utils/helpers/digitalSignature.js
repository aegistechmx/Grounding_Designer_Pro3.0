/**
 * Firma digital para reportes profesionales
 * Basado en hash SHA-256 simulado (para demostración)
 * En producción, usar librería criptográfica real
 */

/**
 * Genera un hash simple para verificación de integridad
 * @param {string} text - Texto a hashear
 * @returns {string} Hash en hexadecimal
 */
const generateSimpleHash = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

/**
 * Genera datos de firma digital para el reporte
 * @param {Object} params - Parámetros del proyecto
 * @param {Object} calculations - Resultados de cálculos
 * @param {string} engineerName - Nombre del ingeniero
 * @param {string} certificateId - ID de certificado (opcional)
 * @returns {Object} Datos de firma
 */
export const generateSignatureData = (params, calculations, engineerName, certificateId = null) => {
  // Validar entradas
  if (!params || !calculations) {
    console.warn('Firma digital: Parámetros inválidos');
    return {
      valid: false,
      error: 'Datos insuficientes para generar firma'
    };
  }

  const signatureData = {
    version: '1.0',
    project: params.projectName || 'Proyecto de Puesta a Tierra',
    projectLocation: params.projectLocation || '',
    client: params.clientName || '',
    engineer: engineerName || params.engineerName || 'Ingeniero Especialista',
    date: new Date().toISOString(),
    rg: calculations.Rg,
    em: calculations.Em,
    es: calculations.Es,
    gpr: calculations.GPR,
    ig: calculations.Ig,
    faultCurrent: calculations.faultCurrent,
    complies: calculations.complies,
    standard: 'IEEE Std 80-2013',
    certificateId: certificateId || `GDP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    timestamp: Date.now(),
    hash: ''
  };
  
  // Generar hash para verificación de integridad
  const hashString = JSON.stringify({
    project: signatureData.project,
    engineer: signatureData.engineer,
    date: signatureData.date,
    rg: signatureData.rg,
    em: signatureData.em,
    es: signatureData.es,
    gpr: signatureData.gpr,
    complies: signatureData.complies,
    certificateId: signatureData.certificateId
  });
  
  signatureData.hash = generateSimpleHash(hashString);
  
  return signatureData;
};

/**
 * Verifica la integridad de la firma digital
 * @param {Object} signatureData - Datos de firma a verificar
 * @returns {Object} Resultado de la verificación
 */
export const verifySignature = (signatureData) => {
  if (!signatureData || !signatureData.hash) {
    return {
      valid: false,
      message: '❌ Datos de firma inválidos o incompletos',
      integrity: false,
      timestamp: null
    };
  }
  
  const { hash, ...dataWithoutHash } = signatureData;
  
  // Reconstruir string para verificación
  const hashString = JSON.stringify({
    project: dataWithoutHash.project,
    engineer: dataWithoutHash.engineer,
    date: dataWithoutHash.date,
    rg: dataWithoutHash.rg,
    em: dataWithoutHash.em,
    es: dataWithoutHash.es,
    gpr: dataWithoutHash.gpr,
    complies: dataWithoutHash.complies,
    certificateId: dataWithoutHash.certificateId
  });
  
  const calculatedHash = generateSimpleHash(hashString);
  const isValid = hash === calculatedHash;
  
  // Verificar antigüedad de la firma (opcional)
  const signatureDate = new Date(signatureData.date);
  const daysOld = Math.floor((Date.now() - signatureDate.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysOld > 365; // La firma expira después de 1 año
  
  let message = '';
  if (isValid && !isExpired) {
    message = '✅ Firma válida - Documento no alterado y dentro del periodo de validez';
  } else if (isValid && isExpired) {
    message = '⚠️ Firma válida pero periodo de validez expirado (más de 1 año)';
  } else {
    message = '❌ Firma inválida - El documento ha sido modificado o está corrupto';
  }
  
  return {
    valid: isValid && !isExpired,
    integrity: isValid,
    expired: isExpired,
    daysOld,
    message,
    timestamp: signatureData.timestamp,
    certificateId: signatureData.certificateId,
    signedBy: signatureData.engineer,
    signedDate: signatureData.date
  };
};

/**
 * Agrega firma digital a un documento PDF (usando jsPDF)
 * @param {Object} pdfDoc - Instancia de jsPDF
 * @param {Object} signatureData - Datos de firma
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @returns {Object} pdfDoc modificado
 */
export const addDigitalSignatureToPDF = (pdfDoc, signatureData, x = 20, y = 250) => {
  if (!pdfDoc || !signatureData) return pdfDoc;
  
  const date = new Date(signatureData.date).toLocaleString();
  const qrData = JSON.stringify({
    id: signatureData.certificateId,
    hash: signatureData.hash,
    date: signatureData.date,
    engineer: signatureData.engineer
  });
  
  // Dibujar recuadro de firma
  pdfDoc.setDrawColor(100, 100, 100);
  pdfDoc.setLineWidth(0.5);
  pdfDoc.rect(x, y, 170, 45);
  
  // Título
  pdfDoc.setFontSize(10);
  pdfDoc.setTextColor(0, 0, 0);
  pdfDoc.text('FIRMA DIGITAL', x + 5, y + 5);
  
  // Línea separadora
  pdfDoc.setDrawColor(200, 200, 200);
  pdfDoc.line(x + 5, y + 8, x + 165, y + 8);
  
  // Datos de firma
  pdfDoc.setFontSize(8);
  pdfDoc.setTextColor(80, 80, 80);
  pdfDoc.text(`Firmado por: ${signatureData.engineer}`, x + 5, y + 14);
  pdfDoc.text(`Fecha: ${date}`, x + 5, y + 20);
  pdfDoc.text(`Certificado: ${signatureData.certificateId}`, x + 5, y + 26);
  pdfDoc.text(`Hash: ${signatureData.hash}`, x + 5, y + 32);
  pdfDoc.text(`Norma: ${signatureData.standard || 'IEEE Std 80-2013'}`, x + 5, y + 38);
  
  // Espacio para sello (opcional)
  pdfDoc.setDrawColor(150, 150, 150);
  pdfDoc.setLineWidth(0.3);
  pdfDoc.rect(x + 130, y + 10, 35, 30);
  pdfDoc.setFontSize(7);
  pdfDoc.setTextColor(100, 100, 100);
  pdfDoc.text('SELLO', x + 147, y + 28, { align: 'center' });
  
  return pdfDoc;
};

/**
 * Genera un código QR con los datos de la firma
 * @param {Object} signatureData - Datos de firma
 * @returns {string} URL del código QR (data URL)
 */
export const generateSignatureQR = async (signatureData) => {
  const qrData = JSON.stringify({
    id: signatureData.certificateId,
    hash: signatureData.hash,
    date: signatureData.date,
    engineer: signatureData.engineer,
    project: signatureData.project
  });
  
  // Nota: Se requiere librería qrcode para implementar
  // return await QRCode.toDataURL(qrData);
  return qrData; // Placeholder
};

/**
 * Exporta la firma digital a formato JSON
 * @param {Object} signatureData - Datos de firma
 * @returns {string} JSON con la firma
 */
export const exportSignatureToJSON = (signatureData) => {
  return JSON.stringify({
    signature: signatureData,
    exportDate: new Date().toISOString(),
    validator: 'Grounding Designer Pro'
  }, null, 2);
};

/**
 * Valida un certificado digital (simulado)
 * @param {string} certificateId - ID del certificado
 * @returns {Object} Estado del certificado
 */
export const validateCertificate = (certificateId) => {
  // Simulación de validación de certificado
  const isValid = certificateId && certificateId.startsWith('GDP-');
  const parts = certificateId?.split('-') || [];
  const issueDate = isValid && parts[1] ? new Date(parseInt(parts[1])) : null;
  const expiryDate = issueDate ? new Date(issueDate.getTime() + 365 * 24 * 60 * 60 * 1000) : null;
  
  return {
    valid: isValid,
    certificateId,
    issuedBy: 'Grounding Designer Pro',
    issueDate: issueDate?.toISOString(),
    expiryDate: expiryDate?.toISOString(),
    isValidNow: expiryDate ? new Date() < expiryDate : false,
    message: isValid ? 'Certificado válido' : 'Certificado inválido o no reconocido'
  };
};

/**
 * Genera un reporte de verificación de firma
 * @param {Object} signatureData - Datos de firma
 * @param {Object} verification - Resultado de verificación
 * @returns {string} Reporte HTML
 */
export const generateVerificationReport = (signatureData, verification) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Verificación de Firma Digital</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .valid { color: #22c55e; }
        .invalid { color: #ef4444; }
        .warning { color: #f59e0b; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .signature-info { background: #f8fafc; padding: 15px; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Grounding Designer Pro</h1>
        <h2>Verificación de Firma Digital</h2>
      </div>
      
      <div class="card">
        <h3>Resultado de la Verificación</h3>
        <div class="${verification.valid ? 'valid' : verification.expired ? 'warning' : 'invalid'}">
          <p><strong>${verification.message}</strong></p>
        </div>
      </div>
      
      <div class="card">
        <h3>Información de la Firma</h3>
        <div class="signature-info">
          <p><strong>Documento:</strong> ${signatureData.project}</p>
          <p><strong>Firmado por:</strong> ${signatureData.engineer}</p>
          <p><strong>Fecha:</strong> ${new Date(signatureData.date).toLocaleString()}</p>
          <p><strong>Certificado:</strong> ${signatureData.certificateId}</p>
          <p><strong>Hash:</strong> ${signatureData.hash}</p>
          <p><strong>Norma:</strong> ${signatureData.standard}</p>
        </div>
      </div>
      
      <div class="card">
        <h3>Resultados del Documento</h3>
        <ul>
          <li>Resistencia de malla (Rg): ${signatureData.rg} Ω</li>
          <li>GPR: ${signatureData.gpr} V</li>
          <li>Tensión de contacto (Em): ${signatureData.em} V</li>
          <li>Tensión de paso (Es): ${signatureData.es} V</li>
          <li>Estado: ${signatureData.complies ? 'CUMPLE IEEE 80' : 'NO CUMPLE IEEE 80'}</li>
        </ul>
      </div>
      
      <div class="card">
        <p><em>Documento verificado electrónicamente. Este reporte es generado automáticamente por Grounding Designer Pro.</em></p>
        <p><em>Fecha de verificación: ${new Date().toLocaleString()}</em></p>
      </div>
    </body>
    </html>
  `;
};

export default {
  generateSignatureData,
  verifySignature,
  addDigitalSignatureToPDF,
  exportSignatureToJSON,
  validateCertificate,
  generateVerificationReport,
  generateSignatureQR
};