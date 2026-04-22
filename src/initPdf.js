// src/initPdf.js
import { generateFullPDF } from './utils/export/pdfFullPro';

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.generateFullPDF = generateFullPDF;
    console.log('✅ PDF utilities initialized');
    console.log('📄 generateFullPDF está disponible globalmente');
}

export default generateFullPDF;