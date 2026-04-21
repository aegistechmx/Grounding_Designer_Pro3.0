import { useState, useCallback, useMemo } from 'react';
import { runGroundingCalculation } from '../core/groundingEngine';

export const useSensitivityAnalysis = (baseParams) => {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentParameter, setCurrentParameter] = useState(null);
  const [progress, setProgress] = useState(0);

  // Parámetros a analizar
  const parameters = useMemo(() => [
    { name: 'soilResistivity', label: 'Resistividad del suelo', unit: 'Ω·m', min: 0.5, max: 2.0 },
    { name: 'gridLength', label: 'Largo de malla', unit: 'm', min: 0.5, max: 1.5 },
    { name: 'gridWidth', label: 'Ancho de malla', unit: 'm', min: 0.5, max: 1.5 },
    { name: 'numParallel', label: 'Conductores X', unit: '', min: 0.5, max: 1.5 },
    { name: 'numParallelY', label: 'Conductores Y', unit: '', min: 0.5, max: 1.5 },
    { name: 'numRods', label: 'Número de varillas', unit: '', min: 0.5, max: 1.5 },
    { name: 'rodLength', label: 'Longitud de varilla', unit: 'm', min: 0.5, max: 1.5 },
    { name: 'gridDepth', label: 'Profundidad de malla', unit: 'm', min: 0.5, max: 1.5 },
    { name: 'currentDivisionFactor', label: 'Factor Sf', unit: '', min: 0.5, max: 1.5 },
    { name: 'surfaceLayer', label: 'Capa superficial', unit: 'Ω·m', min: 0.5, max: 1.5 },
    { name: 'surfaceDepth', label: 'Espesor capa', unit: 'm', min: 0.5, max: 1.5 },
    { name: 'faultDuration', label: 'Duración de falla', unit: 's', min: 0.5, max: 1.5 }
  ], []);

  // Calcular sensibilidad para un parámetro
  const analyzeParameter = useCallback((paramName, variations = [-30, -15, 0, 15, 30]) => {
    if (!baseParams || baseParams[paramName] === undefined) {
      return { results: [], sensitivity: 0, error: true };
    }

    const baseResults = runGroundingCalculation(baseParams);
    const baseValue = baseParams[paramName];
    const baseEm = baseResults?.Em || 0;
    const baseRg = baseResults?.Rg || 0;
    
    const results = [];
    
    for (const variation of variations) {
      const factor = 1 + variation / 100;
      const newValue = baseValue * factor;
      const testParams = { ...baseParams, [paramName]: newValue };
      const testResults = runGroundingCalculation(testParams);
      
      results.push({
        variation,
        factor,
        value: newValue,
        Em: testResults?.Em || 0,
        Rg: testResults?.Rg || 0,
        GPR: testResults?.GPR || 0,
        complies: testResults?.complies || false
      });
    }
    
    // Calcular sensibilidad normalizada
    const maxEm = results.length > 0 ? Math.max(...results.map(r => r.Em)) : 0;
    const minEm = results.length > 0 ? Math.min(...results.map(r => r.Em)) : 0;
    const emVariation = baseEm > 0 ? ((maxEm - minEm) / baseEm) * 100 : 0;
    
    const maxRg = results.length > 0 ? Math.max(...results.map(r => r.Rg)) : 0;
    const minRg = results.length > 0 ? Math.min(...results.map(r => r.Rg)) : 0;
    const rgVariation = baseRg > 0 ? ((maxRg - minRg) / baseRg) * 100 : 0;
    
    return {
      results,
      sensitivity: {
        Em: emVariation,
        Rg: rgVariation,
        average: (emVariation + rgVariation) / 2
      },
      baseValue,
      parameterName: paramName
    };
  }, [baseParams]);

  // Analizar todos los parámetros
  const analyzeAllParameters = useCallback(async (onProgress) => {
    setIsAnalyzing(true);
    setProgress(0);
    
    const allResults = {};
    const impactRanking = [];
    let completed = 0;
    
    for (const param of parameters) {
      setCurrentParameter(param.label);
      
      const analysis = analyzeParameter(param.name);
      allResults[param.name] = { ...analysis, label: param.label, unit: param.unit };
      
      const sensitivity = analysis.sensitivity?.average || 0;
      
      let impact = 'Bajo';
      let impactColor = 'green';
      if (sensitivity > 50) {
        impact = 'Muy Alto';
        impactColor = 'red';
      } else if (sensitivity > 30) {
        impact = 'Alto';
        impactColor = 'orange';
      } else if (sensitivity > 15) {
        impact = 'Medio';
        impactColor = 'yellow';
      }
      
      impactRanking.push({
        parameter: param.name,
        label: param.label,
        unit: param.unit,
        sensitivity,
        impact,
        impactColor,
        maxVariation: {
          Em: analysis.sensitivity?.Em || 0,
          Rg: analysis.sensitivity?.Rg || 0
        }
      });
      
      completed++;
      const newProgress = (completed / parameters.length) * 100;
      setProgress(newProgress);
      if (onProgress) onProgress(newProgress);
    }
    
    impactRanking.sort((a, b) => b.sensitivity - a.sensitivity);
    
    setAnalysisResults({
      parameters: allResults,
      ranking: impactRanking,
      date: new Date().toISOString(),
      totalParameters: parameters.length,
      analyzedParameters: impactRanking.length
    });
    
    setIsAnalyzing(false);
    setCurrentParameter(null);
    
    return { allResults, impactRanking };
  }, [parameters, analyzeParameter]);

  // Generar reporte
  const generateSensitivityReport = useCallback(() => {
    if (!analysisResults?.ranking) {
      return {
        summary: {
          mostSensitiveParameter: 'N/A',
          mostSensitiveValue: 'N/A',
          leastSensitiveParameter: 'N/A',
          leastSensitiveValue: 'N/A',
          totalParametersAnalyzed: 0
        },
        ranking: [],
        recommendations: []
      };
    }
    
    const mostSensitive = analysisResults.ranking[0];
    const leastSensitive = analysisResults.ranking[analysisResults.ranking.length - 1];
    
    const recommendations = [];
    
    for (const item of analysisResults.ranking) {
      if (item.impact === 'Muy Alto') {
        recommendations.push({
          severity: 'CRÍTICO',
          parameter: item.label,
          message: `${item.label} tiene un impacto MUY ALTO. Validar con precisión este parámetro.`
        });
      } else if (item.impact === 'Alto') {
        recommendations.push({
          severity: 'ALTO',
          parameter: item.label,
          message: `${item.label} tiene un impacto ALTO. Prestar atención a su valor.`
        });
      }
    }
    
    return {
      summary: {
        mostSensitiveParameter: mostSensitive?.label || 'N/A',
        mostSensitiveValue: mostSensitive?.sensitivity?.toFixed(2) || 'N/A',
        leastSensitiveParameter: leastSensitive?.label || 'N/A',
        leastSensitiveValue: leastSensitive?.sensitivity?.toFixed(2) || 'N/A',
        totalParametersAnalyzed: analysisResults.ranking.length
      },
      ranking: analysisResults.ranking.map(r => ({
        ...r,
        sensitivityFormatted: r.sensitivity?.toFixed(2) || '0.00'
      })),
      recommendations
    };
  }, [analysisResults]);

  // Datos para gráfico
  const getSensitivityChartData = useCallback(() => {
    if (!analysisResults?.ranking) return null;
    
    return {
      labels: analysisResults.ranking.map(r => r.label),
      datasets: [
        {
          label: 'Sensibilidad (%)',
          data: analysisResults.ranking.map(r => r.sensitivity || 0),
          backgroundColor: analysisResults.ranking.map(r => 
            r.impact === 'Muy Alto' ? '#ef4444' :
            r.impact === 'Alto' ? '#f59e0b' :
            r.impact === 'Medio' ? '#eab308' : '#10b981'
          )
        }
      ]
    };
  }, [analysisResults]);

  // Exportar a CSV
  const exportToCSV = useCallback(() => {
    if (!analysisResults?.ranking) return null;
    
    const headers = ['Parámetro', 'Sensibilidad (%)', 'Impacto', 'Variación Em', 'Variación Rg'];
    const rows = analysisResults.ranking.map(r => [
      r.label,
      r.sensitivity?.toFixed(2) || '0',
      r.impact || 'Bajo',
      r.maxVariation?.Em?.toFixed(2) || '0',
      r.maxVariation?.Rg?.toFixed(2) || '0'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    return '\uFEFF' + csvContent;
  }, [analysisResults]);

  return {
    analysisResults,
    isAnalyzing,
    currentParameter,
    progress,
    parameters,
    analyzeParameter,
    analyzeAllParameters,
    generateSensitivityReport,
    getSensitivityChartData,
    exportToCSV
  };
};

export default useSensitivityAnalysis;