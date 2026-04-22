/**
 * PDF Service for Grounding Designer Pro
 * Sends real calculation results and recommendations to backend for PDF generation
 */

import useStore from '../store/useStore';
import { generateSmartRecommendations } from '../core/recommendations';

/**
 * Compute average error between analytical and discrete grid models
 */
const computeError = (gridA, gridB) => {
  if (!gridA || !gridB) return 0;
  
  let sum = 0;
  let count = 0;

  for (let i = 0; i < gridA.length; i++) {
    for (let j = 0; j < gridA[i].length; j++) {
      const diff = (gridA[i][j] || 0) - (gridB[i][j] || 0);
      sum += Math.abs(diff);
      count++;
    }
  }

  return count > 0 ? sum / count : 0;
};

export const generatePDF = async (projectInfo = {}) => {
  try {
    const { results, history } = useStore.getState();

    // Get heatmap from canvas
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      throw new Error('No canvas found for heatmap capture');
    }
    const heatmap = canvas.toDataURL("image/png");

    // Generate AI recommendations
    const recommendations = generateSmartRecommendations(results);

    // Compute error between analytical and discrete models
    const discreteGrid = results?.discreteGrid || [];
    const analyticalGrid = results?.analyticalGrid || [];
    const error = computeError(discreteGrid, analyticalGrid);

    // Default project info if not provided
    const defaultProjectInfo = {
      clientName: projectInfo.clientName || 'N/A',
      projectName: projectInfo.projectName || 'Grounding System Design',
      engineer: projectInfo.engineer || 'N/A',
      date: projectInfo.date || new Date().toLocaleDateString()
    };

    // Get API URL from environment or use localhost
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    // Send data to backend
    const response = await fetch(`${apiUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        heatmap,
        results,
        recommendations,
        history: history || [],
        error,
        projectInfo: defaultProjectInfo
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    // Get PDF blob and open in new tab
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return { success: true };
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

export const generateExcel = async () => {
  try {
    const { results } = useStore.getState();

    // Get API URL from environment or use localhost
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    // Send data to backend
    const response = await fetch(`${apiUrl}/api/generate-excel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results })
    });

    if (!response.ok) {
      throw new Error('Failed to generate Excel');
    }

    // Get Excel blob and download
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grounding-report.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return { success: true };
  } catch (error) {
    console.error('Excel generation error:', error);
    throw error;
  }
};
