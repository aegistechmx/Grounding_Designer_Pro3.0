/**
 * Pro PDF Generator
 * Advanced PDF generation with all sections (ETAP/DIgSILENT level)
 */

import jsPDF from 'jspdf';
import { buildHeaderSection } from '../builders/headerSection';
import { buildExecutiveSummary } from '../builders/executiveSummary';
import { buildParametersSection } from '../builders/parametersSection';
import { buildResultsSection } from '../builders/resultsSection';
import { buildHeatmapSection } from '../builders/heatmapSection';
import { buildCurveChartSection } from '../builders/curveChartSection';
import { buildComplianceSection } from '../builders/complianceSection';
import { buildRecommendationsSection } from '../builders/recommendationsSection';

export const generateProPDF = async (data) => {
  const {
    project,
    calculations,
    params,
    heatmapImage,
    discreteGrid,
    recommendations = [],
    compliance,
    projectName = 'Grounding Design Project',
    clientName = 'Client',
    engineer = 'Engineer',
    date = new Date().toISOString()
  } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  let yPos = 0;

  // 1. Header Section
  yPos = buildHeaderSection(doc, {
    projectName,
    clientName,
    engineer,
    date,
    yPos
  });

  // 2. Executive Summary
  yPos = buildExecutiveSummary(doc, {
    calculations,
    compliance,
    yPos
  });

  // 3. Parameters Section
  yPos = buildParametersSection(doc, {
    params,
    yPos
  });

  // 4. Results Section (IEEE 80)
  yPos = buildResultsSection(doc, {
    calculations,
    yPos
  });

  // 5. Heatmap Section
  if (heatmapImage) {
    yPos = buildHeatmapSection(doc, {
      heatmapImage,
      yPos
    });
  }

  // 6. Curve Chart Section (ETAP-style)
  yPos = await buildCurveChartSection(doc, {
    calculations,
    discreteGrid,
    yPos
  });

  // 7. Compliance Section
  yPos = buildComplianceSection(doc, {
    calculations,
    compliance,
    yPos
  });

  // 8. Recommendations Section
  if (recommendations.length > 0) {
    yPos = buildRecommendationsSection(doc, {
      recommendations,
      yPos
    });
  }

  console.log('📄 Generando PDF PRO...');

  return doc;
};
