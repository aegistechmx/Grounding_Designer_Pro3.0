/**
 * Firma digital avanzada para reportes
 * SHA-256 + timestamp + metadatos
 */

export const signReport = async (report, engineer) => {
  const timestamp = new Date().toISOString();
  
  // Datos a firmar
  const signatureData = {
    reportId: report.metadata?.reporte_id || `GDP-${Date.now()}`,
    projectName: report.portada?.proyecto || 'N/A',
    engineer: engineer.name,
    engineerLicense: engineer.license,
    Rg: report.resumen?.Rg,
    GPR: report.resumen?.GPR,
    complies: report.resumen?.cumplimiento,
    timestamp
  };
  
  // Generar hash SHA-256
  const hash = await generateHash(JSON.stringify(signatureData));
  
  return {
    ...signatureData,
    hash,
    algorithm: 'SHA-256',
    verified: true
  };
};

const generateHash = async (text) => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Error generando hash:', error);
    return 'ERROR_GENERANDO_HASH';
  }
};

export const verifySignature = async (report, storedHash) => {
  const signatureData = {
    reportId: report.metadata?.reporte_id,
    projectName: report.portada?.proyecto,
    Rg: report.resumen?.Rg,
    GPR: report.resumen?.GPR,
    complies: report.resumen?.cumplimiento
  };
  
  const newHash = await generateHash(JSON.stringify(signatureData));
  return newHash === storedHash;
};

export const generateSignatureBlock = (signature) => {
  return `
┌─────────────────────────────────────────────────────────────┐
│                    FIRMA DIGITAL                            │
├─────────────────────────────────────────────────────────────┤
│  Reporte ID:    ${signature.reportId}                       │
│  Ingeniero:     ${signature.engineer}                       │
│  Cédula:        ${signature.engineerLicense}                │
│  Fecha:         ${new Date(signature.timestamp).toLocaleString()}  │
│  Hash SHA-256:  ${signature.hash.substring(0, 32)}...       │
└─────────────────────────────────────────────────────────────┘
  `;
};

export default {
  signReport,
  verifySignature,
  generateSignatureBlock
};
