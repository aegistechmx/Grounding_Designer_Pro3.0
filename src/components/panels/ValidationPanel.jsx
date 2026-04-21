import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Shield, Zap, FileText } from 'lucide-react';
import useStore from '../../store/useStore';
import { validateDesign, getComplianceScoreByCategory } from '../../core/validationEngine';

export const ValidationPanel = ({ calculations, darkMode }) => {
  const { params } = useStore();
  const [validationReport, setValidationReport] = useState(null);
  const [categoryScores, setCategoryScores] = useState(null);
  const [expandedNorm, setExpandedNorm] = useState(null);

  useEffect(() => {
    if (calculations) {
      const report = validateDesign(calculations, params);
      const scores = getComplianceScoreByCategory(calculations);
      setValidationReport(report);
      setCategoryScores(scores);
    }
  }, [calculations, params]);

  if (!calculations || !validationReport) {
    return (
      <div className={`p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
        <p className="text-gray-500">Realice un cálculo para ver la validación normativa</p>
      </div>
    );
  }

  const getStatusColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getBgColor = (score) => {
    if (score >= 80) return darkMode ? 'bg-green-900/30' : 'bg-green-50';
    if (score >= 60) return darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50';
    return darkMode ? 'bg-red-900/30' : 'bg-red-50';
  };

  return (
    <div className="space-y-6">
      {/* Score General */}
      <div className={`p-6 rounded-xl ${getBgColor(parseFloat(validationReport.overallScore))}`}>
        <div className="text-center">
          <div className="text-4xl font-bold mb-2">{validationReport.overallScore}%</div>
          <div className="text-sm text-gray-500">Score General de Cumplimiento</div>
          <div className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold ${
            validationReport.summary.statusColor === 'green' ? 'bg-green-100 text-green-700' :
            validationReport.summary.statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {validationReport.summary.status}
          </div>
        </div>
      </div>

      {/* Resumen de cumplimiento por categoría */}
      {categoryScores && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-3 rounded-lg text-center ${getBgColor(categoryScores.seguridad.score)}`}>
            <Shield size={24} className={`mx-auto mb-1 ${getStatusColor(categoryScores.seguridad.score)}`} />
            <div className="text-xl font-bold">{categoryScores.seguridad.score}%</div>
            <div className="text-xs text-gray-500">Seguridad</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${getBgColor(categoryScores.resistencia.score)}`}>
            <Zap size={24} className={`mx-auto mb-1 ${getStatusColor(categoryScores.resistencia.score)}`} />
            <div className="text-xl font-bold">{categoryScores.resistencia.score}%</div>
            <div className="text-xs text-gray-500">Resistencia</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${getBgColor(categoryScores.gpr.score)}`}>
            <TrendingUp size={24} className={`mx-auto mb-1 ${getStatusColor(categoryScores.gpr.score)}`} />
            <div className="text-xl font-bold">{categoryScores.gpr.score}%</div>
            <div className="text-xs text-gray-500">GPR</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${getBgColor(categoryScores.conductor.score)}`}>
            <FileText size={24} className={`mx-auto mb-1 ${getStatusColor(categoryScores.conductor.score)}`} />
            <div className="text-xl font-bold">{categoryScores.conductor.score}%</div>
            <div className="text-xs text-gray-500">Conductor</div>
          </div>
        </div>
      )}

      {/* Mensaje de resumen */}
      <div className={`p-4 rounded-lg relative overflow-hidden ${
        validationReport.summary.criticalIssues.length > 0 
          ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700' 
          : 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600'
      } ${validationReport.summary.criticalIssues.length === 0 && validationReport.summary.recommendations.length === 0 ? 'shadow-lg shadow-green-500/50' : ''}`}>
        {/* Efecto de brillo cuando cumple con todo */}
        {validationReport.summary.criticalIssues.length === 0 && validationReport.summary.recommendations.length === 0 && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-200/30 to-transparent animate-pulse"></div>
        )}
        <div className="flex items-start gap-3 relative z-10">
          {validationReport.summary.criticalIssues.length > 0 ? (
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle size={20} className={`flex-shrink-0 mt-0.5 ${validationReport.summary.recommendations.length === 0 ? 'text-green-600 animate-bounce' : 'text-green-500'}`} />
          )}
          <div className="relative z-10">
            <p className={`text-sm font-medium ${
              validationReport.summary.criticalIssues.length === 0 && validationReport.summary.recommendations.length === 0 
                ? 'text-black dark:text-white font-bold' 
                : 'text-gray-800 dark:text-gray-200'
            }`}>
              {validationReport.summary.message}
            </p>
            {validationReport.summary.criticalIssues.length > 0 && (
              <div className="mt-2 text-sm">
                <strong>Incumplimientos críticos:</strong>
                <ul className="list-disc pl-5 mt-1">
                  {validationReport.summary.criticalIssues.map((issue, idx) => (
                    <li key={idx} className="text-xs">
                      {issue.normative}: {issue.requirement}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detalle por norma */}
      <div className="space-y-3">
        <h4 className="font-semibold">Detalle por Normativa</h4>
        {Object.entries(validationReport.normatives).map(([key, norm]) => (
          <div key={key} className={`rounded-lg border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setExpandedNorm(expandedNorm === key ? null : key)}
              className={`w-full p-4 flex justify-between items-center ${getBgColor(norm.score)} transition-colors`}
            >
              <div className="flex items-center gap-3">
                {norm.complies ? (
                  <CheckCircle size={20} className="text-green-500" />
                ) : (
                  <XCircle size={20} className="text-red-500" />
                )}
                <div>
                  <div className="font-semibold">{norm.name}</div>
                  <div className="text-xs text-gray-500">{norm.country}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${getStatusColor(norm.score)}`}>
                  {norm.score.toFixed(0)}%
                </span>
                <span className="text-gray-400">{expandedNorm === key ? '▲' : '▼'}</span>
              </div>
            </button>
            
            {expandedNorm === key && (
              <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className="text-sm text-gray-500 mb-3">{norm.description}</p>
                <div className="space-y-2">
                  {norm.requirements.map((req, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {req.passed ? (
                          <CheckCircle size={14} className="text-green-500" />
                        ) : (
                          <XCircle size={14} className="text-red-500" />
                        )}
                        <span className="text-sm">
                          {req.name}
                          {req.isRecommendation && <span className="text-xs text-gray-400 ml-1">(recomendado)</span>}
                          {req.isInfo && <span className="text-xs text-gray-400 ml-1">(informativo)</span>}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};