/**
 * Unified PDF Service
 * Single entry point for all PDF generation
 */

import { generateBasicPDF } from './generators/pdfBasic';
import { generateProPDF } from './generators/pdfPro';
import { generateBatchPDF } from './generators/pdfBatch';

export const PdfService = {
  /**
   * Generate PDF based on type
   * @param {Object} options - { type: 'basic' | 'pro' | 'batch', data: Object }
   */
  generate({ type = 'pro', data }) {
    switch (type) {
      case 'basic':
        return generateBasicPDF(data);
      case 'batch':
        return generateBatchPDF(data);
      case 'pro':
      default:
        return generateProPDF(data);
    }
  },

  /**
   * Generate basic PDF
   */
  basic(data) {
    return generateBasicPDF(data);
  },

  /**
   * Generate pro PDF
   */
  pro(data) {
    return generateProPDF(data);
  },

  /**
   * Generate batch PDF
   */
  batch(data) {
    return generateBatchPDF(data);
  }
};
