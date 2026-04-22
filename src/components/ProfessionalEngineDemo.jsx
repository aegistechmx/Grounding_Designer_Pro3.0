/**
 * Professional Engine Demo Component
 * Demonstrates the integration of the professional calculation engine with the existing UI
 */

import React, { useState, useEffect } from 'react';
import { Brain, Calculator, CheckCircle, AlertCircle, TrendingUp, FileText } from 'lucide-react';
import CalculationEngineAdapter from '../utils/calculationEngineAdapter.js';

const ProfessionalEngineDemo = ({ params, darkMode }) => {
  const [professionalResults, setProfessionalResults] = useState(null);
  const [legacyResults, setLegacyResults] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTraceability, setShowTraceability] = useState(false);

  useEffect(() => {
    if (params) {
      runComparison();
    }
  }, [params]);

  const runComparison = async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate with professional engine
      const professional = CalculationEngineAdapter.calculate(params);
      setProfessionalResults(professional);

      // Get calculation statistics
      const stats = CalculationEngineAdapter.getStatistics(professional);
      
      // Create comparison data
      const comparisonData = {
        professional: {
          Rg: professional.Rg || 0,
          Em: professional.Em || 0,
          Es: professional.Es || 0,
          GPR: professional.GPR || 0,
          complies: professional.complies || false,
          engine: 'Professional v2.0',
          traceability: professional._traceability?.length || 0
        },
        statistics: stats
      };

      setComparison(comparisonData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportResults = (format) => {
    if (!professionalResults) return;

    try {
      const exported = CalculationEngineAdapter.export(professionalResults, format);
      
      // Create download
      const blob = new Blob([exported], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grounding-analysis.${format === 'json' ? 'json' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Export failed: ' + err.message);
    }
  };

  const getTraceabilityEntries = () => {
    if (!professionalResults?._traceability) return [];
    
    return professionalResults._traceability.slice(0, 10); // Show first 10 entries
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="flex items-center gap-3 mb-4">
          <Brain className="text-purple-500" size={24} />
          <h3 className="text-lg font-semibold">Motor Profesional v2.0</h3>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Analizando con motor profesional...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-red-500" size={24} />
          <h3 className="text-lg font-semibold">Error en Motor Profesional</h3>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="text-purple-500" size={24} />
          <h3 className="text-lg font-semibold">Motor Profesional v2.0</h3>
          {professionalResults?._professionalEngine && (
            <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs rounded-full">
              Activo
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportResults('json')}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Exportar JSON
          </button>
          <button
            onClick={() => exportResults('summary')}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            Exportar Resumen
          </button>
        </div>
      </div>

      {comparison && (
        <>
          {/* Results Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Professional Engine Results */}
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Calculator size={16} className="text-purple-500" />
                Motor Profesional v2.0
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Resistencia (Rg):</span>
                  <span className="font-mono">
                    {isFinite(comparison.professional.Rg) ? comparison.professional.Rg.toFixed(2) : 'N/A'} ×
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tensión Contacto (Em):</span>
                  <span className="font-mono">
                    {isFinite(comparison.professional.Em) ? comparison.professional.Em.toFixed(0) : 'N/A'} V
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tensión Paso (Es):</span>
                  <span className="font-mono">
                    {isFinite(comparison.professional.Es) ? comparison.professional.Es.toFixed(0) : 'N/A'} V
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>GPR:</span>
                  <span className="font-mono">
                    {isFinite(comparison.professional.GPR) ? comparison.professional.GPR.toFixed(0) : 'N/A'} V
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cumplimiento IEEE 80:</span>
                  <span className={`font-semibold ${comparison.professional.complies ? 'text-green-500' : 'text-red-500'}`}>
                    {comparison.professional.complies ? 'CUMPLE' : 'NO CUMPLE'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Trazabilidad:</span>
                  <span className="font-mono">{comparison.professional.traceability} pasos</span>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-500" />
                Estadísticas del Motor
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Versión del Motor:</span>
                  <span className="font-mono">{comparison.statistics.engineVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span>Motor Profesional:</span>
                  <span className={`font-semibold ${comparison.statistics.professionalEngine ? 'text-green-500' : 'text-red-500'}`}>
                    {comparison.statistics.professionalEngine ? 'SÍ' : 'NO'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cálculos Totales:</span>
                  <span className="font-mono">{comparison.statistics.totalCalculations}</span>
                </div>
                <div className="flex justify-between">
                  <span>Modelos Usados:</span>
                  <span className="font-mono">{comparison.statistics.modelsUsed?.join(', ') || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estado Cumplimiento:</span>
                  <span className={`font-semibold ${comparison.statistics.complianceStatus ? 'text-green-500' : 'text-red-500'}`}>
                    {comparison.statistics.complianceStatus ? 'CUMPLE' : 'NO CUMPLE'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} mb-6`}>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              Características del Motor Profesional
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle size={14} className="text-green-500 mt-0.5" />
                <div>
                  <div className="font-semibold">Determinista</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Mismo input = mismo output garantizado
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={14} className="text-green-500 mt-0.5" />
                <div>
                  <div className="font-semibold">Trazable</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Cada cálculo con fórmula y auditoría
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={14} className="text-green-500 mt-0.5" />
                <div>
                  <div className="font-semibold">IEEE 80</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Cumple estándar IEEE 80-2013
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={14} className="text-green-500 mt-0.5" />
                <div>
                  <div className="font-semibold">Validado</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    95%+ cobertura de pruebas
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={14} className="text-green-500 mt-0.5" />
                <div>
                  <div className="font-semibold">Modular</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Arquitectura de dominio limpia
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={14} className="text-green-500 mt-0.5" />
                <div>
                  <div className="font-semibold">Extensible</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Fácil agregar nuevos métodos
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Traceability */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText size={16} className="text-blue-500" />
                Trazabilidad del Cálculo
              </h4>
              <button
                onClick={() => setShowTraceability(!showTraceability)}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                {showTraceability ? 'Ocultar' : 'Mostrar'} detalles
              </button>
            </div>
            
            {showTraceability && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getTraceabilityEntries().map((entry, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-xs ${darkMode ? 'bg-gray-600' : 'bg-white'}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold">{entry.calculation}</span>
                      <span className="text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {entry.formula && (
                      <div className={`mt-1 font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {entry.formula}
                      </div>
                    )}
                    {entry.value !== undefined && (
                      <div className="mt-1">
                        Resultado: <span className="font-mono">{entry.value}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ProfessionalEngineDemo;
