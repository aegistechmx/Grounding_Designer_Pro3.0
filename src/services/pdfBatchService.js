import { generateFullReport } from '../utils/pdfGenerator';
import JSZip from 'jszip';

/**
 * Generate PDF for a single project
 * @param {object} project - Project object with params, results, recommendations
 * @returns {Promise<Blob>} - PDF as blob
 */
const generateProjectPDF = async (project) => {
  const { params, results, recommendations, heatmapImage } = project;
  
  // Create a modified version of generateFullReport that returns blob instead of saving
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  // ===== PORTADA =====
  doc.setFontSize(20);
  doc.text("GROUNDING SYSTEM REPORT", 20, 40);

  doc.setFontSize(12);
  doc.text(`Project: ${params.projectName || "N/A"}`, 20, 70);
  doc.text(`Client: ${params.clientName || "N/A"}`, 20, 80);
  doc.text(`Location: ${params.projectLocation || "N/A"}`, 20, 90);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 100);
  doc.text("Standard: IEEE 80-2013", 20, 110);
  doc.text(`Report No: ${params.reportNumber || "R-" + Date.now()}`, 20, 120);

  doc.addPage();

  // ===== RESUMEN EJECUTIVO =====
  doc.setFontSize(16);
  doc.text("EXECUTIVE SUMMARY", 20, 20);

  doc.setFontSize(12);
  const status = results?.complies ? "✅ SAFE" : "❌ UNSAFE";
  doc.setTextColor(results?.complies ? 0 : 200, results?.complies ? 100 : 0, 0);
  doc.text(`Status: ${status}`, 20, 40);
  doc.setTextColor(0, 0, 0);

  doc.text(`Rg: ${results?.Rg?.toFixed(2) || 'N/A'} Ω`, 20, 50);
  doc.text(`GPR: ${results?.GPR?.toFixed(2) || 'N/A'} V`, 20, 60);
  doc.text(`Em (Mesh): ${results?.Em?.toFixed(2) || 'N/A'} V`, 20, 70);
  doc.text(`Etouch70: ${results?.Etouch70?.toFixed(2) || 'N/A'} V`, 20, 80);
  doc.text(`Risk Level: ${results?.complies ? 'Low' : 'High'}`, 20, 90);

  doc.addPage();

  // ===== HEATMAP =====
  doc.setFontSize(16);
  doc.text("GROUND POTENTIAL DISTRIBUTION", 20, 20);

  if (heatmapImage) {
    doc.addImage(heatmapImage, "PNG", 10, 30, 190, 140);
  }

  doc.addPage();

  // ===== RECOMENDACIONES =====
  doc.setFontSize(16);
  doc.text("ENGINEERING RECOMMENDATIONS", 20, 20);

  doc.setFontSize(11);
  let y = 40;

  if (recommendations && recommendations.length > 0) {
    recommendations.forEach((rec) => {
      doc.text(`• ${rec}`, 20, y);
      y += 10;
    });
  } else {
    doc.text("• Design complies with IEEE 80 requirements", 20, y);
  }

  // Return as blob
  return doc.output('blob');
};

/**
 * Export multiple projects to PDF as a ZIP file
 * @param {Array} projects - Array of project objects
 * @returns {Promise<void>} - Downloads ZIP file with all PDFs
 */
export const exportBatchToPDF = async (projects) => {
  try {
    const zip = new JSZip();

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const projectName = project.params?.projectName || `Project_${i + 1}`;
      const pdfBlob = await generateProjectPDF(project);
      zip.file(`${projectName}.pdf`, pdfBlob);
      
      // Show progress
      console.log(`Generated PDF ${i + 1}/${projects.length}`);
    }

    // Generate ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    const filename = `grounding_batch_pdfs_${Date.now()}.zip`;

    // Download
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Batch PDF export completed:', filename);
  } catch (error) {
    console.error('Error exporting batch PDF:', error);
    throw error;
  }
};

/**
 * Export single project to PDF
 * @param {object} project - Project object
 * @returns {Promise<void>} - Downloads PDF file
 */
export const exportSingleToPDF = async (project) => {
  try {
    await generateFullReport({
      results: project.results,
      params: project.params,
      recommendations: project.recommendations,
      heatmapImage: project.heatmapImage
    });
  } catch (error) {
    console.error('Error exporting single PDF:', error);
    throw error;
  }
};
