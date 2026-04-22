import React, { useState, useEffect } from 'react';
import { Brain, AlertTriangle, CheckCircle, Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import { generateAIReport, calculateSafetyScore, getRiskLevel } from '../../services/aiSuggestionService';

const AISuggestionsPanel = ({ params, results, darkMode }) => {
  const [aiReport, setAiReport] = useState(null);
  const [expandedSuggestions, setExpandedSuggestions] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params && results) {
      setLoading(true);
      // Simulate AI processing delay
      setTimeout(() => {
        const report = generateAIReport(params, results);
        setAiReport(report);
        setLoading(false);
      }, 500);
    }
  }, [params, results]);

  const toggleSuggestion = (index) => {
    setExpandedSuggestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'high':
        return <AlertTriangle size={16} className="text-orange-500" />;
      case 'medium':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'low':
        return <Info size={16} className="text-blue-500" />;
      case 'info':
        return <CheckCircle size={16} className="text-green-500" />;
      default:
        return <Info size={16} className="text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-500/10';
      case 'high':
        return 'border-orange-500 bg-orange-500/10';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'border-blue-500 bg-blue-500/10';
      case 'info':
        return 'border-green-500 bg-green-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getSafetyScoreColor = (score) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    if (score >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="flex items-center gap-2">
          <Brain className="animate-pulse text-blue-500" size={20} />
          <span className="text-sm">Analizando diseño con IA...</span>
        </div>
      </div>
    );
  }

  if (!aiReport) {
    return null;
  }

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="text-blue-500" size={20} />
          <h3 className="font-semibold">🤖 Análisis IA</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-gray-500">Puntuación:</span>
            <span className={`ml-2 font-bold ${getSafetyScoreColor(aiReport.safetyScore)}`}>
              {aiReport.safetyScore}/100
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Riesgo:</span>
            <span className={`ml-2 font-bold ${getSafetyScoreColor(aiReport.safetyScore)}`}>
              {aiReport.riskLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className={`grid grid-cols-4 gap-2 mb-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">{aiReport.summary.totalSuggestions}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-500">{aiReport.summary.criticalIssues}</div>
          <div className="text-xs text-gray-500">Críticos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-500">{aiReport.summary.highPriority}</div>
          <div className="text-xs text-gray-500">Alta</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">
            {aiReport.summary.overallStatus === 'COMPLIANT' ? '✓' : '✗'}
          </div>
          <div className="text-xs text-gray-500">Estado</div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-2">
        {aiReport.suggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`border-l-4 p-3 rounded-r-lg ${getPriorityColor(suggestion.priority)} ${darkMode ? 'bg-gray-700/50' : 'bg-white'}`}
          >
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() => toggleSuggestion(index)}
            >
              <div className="flex items-start gap-2 flex-1">
                {getPriorityIcon(suggestion.priority)}
                <div className="flex-1">
                  <div className="font-semibold text-sm">{suggestion.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {suggestion.description}
                  </div>
                </div>
              </div>
              {expandedSuggestions[index] ? (
                <ChevronUp size={16} className="text-gray-400" />
              ) : (
                <ChevronDown size={16} className="text-gray-400" />
              )}
            </div>

            {expandedSuggestions[index] && (
              <div className="mt-3 pt-3 border-t border-gray-600/30">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-semibold text-gray-400">Acción:</span>
                    <span className="ml-2">{suggestion.action}</span>
                  </div>
                  {suggestion.expectedImprovement && (
                    <div>
                      <span className="font-semibold text-gray-400">Mejora esperada:</span>
                      <span className="ml-2">{suggestion.expectedImprovement}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-gray-400">Impacto:</span>
                    <span className={`ml-2 ${
                      suggestion.impact === 'critical' ? 'text-red-500' :
                      suggestion.impact === 'high' ? 'text-orange-500' :
                      suggestion.impact === 'medium' ? 'text-yellow-500' :
                      suggestion.impact === 'low' ? 'text-blue-500' :
                      'text-gray-500'
                    }`}>
                      {suggestion.impact.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {aiReport.summary.criticalIssues > 0 && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500 rounded-lg">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle size={16} />
            <span className="font-semibold text-sm">
              {aiReport.summary.criticalIssues} problema(s) crítico(s) detectado(s)
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Se recomienda abordar estos problemas antes de la implementación
          </div>
        </div>
      )}
    </div>
  );
};

export default AISuggestionsPanel;
