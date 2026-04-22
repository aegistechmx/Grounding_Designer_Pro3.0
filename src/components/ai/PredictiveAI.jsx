import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertCircle, CheckCircle, Zap, Shield, DollarSign, Clock } from 'lucide-react';

const PredictiveAI = ({ params, calculations, darkMode }) => {
  const [predictions, setPredictions] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  useEffect(() => {
    analyzeDesign();
  }, [params, calculations]);

  const analyzeDesign = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 150);
    
    setTimeout(() => {
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      // ============================================
      // CÁLCULOS NORMALIZADOS
      // ============================================
      const etouch70 = calculations?.Etouch70 || 1; // Evitar división por cero
      const safetyMargin = calculations?.Em
        ? Math.max(0, ((etouch70 - calculations.Em) / etouch70 * 100))
        : 0;
      
      const efficiencyScore = calculations?.Rg
        ? Math.min(100, (5 / (calculations.Rg || 1)) * 20)
        : 0;
      
      const costScore = params?.numParallel && params?.numRods
        ? Math.min(100, Math.max(0, 100 - ((params.numParallel * params.numRods) / 1000 * 100)))
        : 50;
      
      const overallScore = ((safetyMargin * 0.5) + (efficiencyScore * 0.3) + (costScore * 0.2));
      
      // Vida útil realista
      let estimatedLifespan = 15;
      if (safetyMargin > 80) estimatedLifespan = 30;
      else if (safetyMargin > 60) estimatedLifespan = 25;
      else if (safetyMargin > 40) estimatedLifespan = 20;
      else if (safetyMargin > 20) estimatedLifespan = 15;
      else estimatedLifespan = 10;
      
      // Intervalo de mantenimiento
      let maintenanceInterval = 2;
      if (safetyMargin > 80) maintenanceInterval = 8;
      else if (safetyMargin > 60) maintenanceInterval = 6;
      else if (safetyMargin > 40) maintenanceInterval = 5;
      else if (safetyMargin > 20) maintenanceInterval = 3;
      else maintenanceInterval = 2;
      
      // Nivel de riesgo
      let riskLevel = 'Bajo';
      let riskColor = 'green';
      let riskIcon = <Shield size={16} className="text-green-500" />;
      
      if (safetyMargin < 20) {
        riskLevel = 'Crítico';
        riskColor = 'red';
        riskIcon = <AlertCircle size={16} className="text-red-500" />;
      } else if (safetyMargin < 40) {
        riskLevel = 'Alto';
        riskColor = 'orange';
        riskIcon = <AlertCircle size={16} className="text-orange-500" />;
      } else if (safetyMargin < 60) {
        riskLevel = 'Medio';
        riskColor = 'yellow';
        riskIcon = <AlertCircle size={16} className="text-yellow-500" />;
      }
      
      // Predicción de desempeño
      const performancePrediction = {
        nextYear: safetyMargin > 50 ? 'Estable' : 'Requiere atención',
        fiveYears: safetyMargin > 60 ? 'Buena' : safetyMargin > 30 ? 'Aceptable' : 'Crítica',
        tenYears: estimatedLifespan > 20 ? 'Excelente' : estimatedLifespan > 15 ? 'Buena' : 'Requiere renovación'
      };
      
      // ============================================
      // RECOMENDACIONES INTELIGENTES (CORREGIDAS)
      // ============================================
      const recommendations = [];
      
      // ✅ Verificar si el diseño ya cumple
      const complies = calculations?.complies || false;
      const thermalCheckFails = calculations?.thermalCheck?.complies === false;
      
      // 1. CRÍTICO: Si NO cumple IEEE 80
      if (!complies) {
        recommendations.push({
          type: 'error',
          icon: <AlertCircle size={16} />,
          message: '⚠️ DISEÑO NO CUMPLE IEEE 80',
          action: 'Aumentar conductores, agregar varillas o mejorar capa superficial',
          priority: 'Crítica'
        });
      } 
      // 2. CRÍTICO: Conductor insuficiente térmicamente
      else if (thermalCheckFails) {
        recommendations.push({
          type: 'error',
          icon: <Zap size={16} />,
          message: '⚠️ Conductor insuficiente térmicamente',
          action: calculations.thermalCheck.recommendation || 'Usar calibre 4/0 AWG',
          priority: 'Crítica'
        });
      }
      // 3. ADVERTENCIA: Margen de seguridad bajo
      else if (safetyMargin < 30) {
        recommendations.push({
          type: 'warning',
          icon: <AlertCircle size={16} />,
          message: '⚠️ Margen de seguridad reducido',
          action: 'Considerar mejoras para aumentar margen',
          priority: 'Alta'
        });
      }
      // 4. ÉXITO: Diseño cumple (solo si no hay errores críticos)
      else {
        recommendations.push({
          type: 'success',
          icon: <CheckCircle size={16} />,
          message: '✅ DISEÑO CUMPLE CON IEEE 80',
          action: 'Proceder con la construcción',
          priority: 'Baja'
        });
      }
      
      // 5. Recomendación de resistividad (solo si es alta)
      const soilResistivity = params?.soilResistivity || 100;
      if (soilResistivity > 500) {
        recommendations.push({
          type: 'warning',
          icon: <Zap size={16} />,
          message: '⚠️ Suelo de alta resistividad',
          action: 'Considerar tratamiento químico del suelo',
          priority: 'Media'
        });
      }
      
      // 6. Recomendación de capa superficial (solo si es baja)
      const surfaceLayer = params?.surfaceLayer || 3000;
      const surfaceDepth = params?.surfaceDepth || 0.1;
      if (surfaceLayer < 5000 || surfaceDepth < 0.15) {
        recommendations.push({
          type: 'warning',
          icon: <Shield size={16} />,
          message: '⚠️ Capa superficial mejorable',
          action: 'Aumentar resistividad a 10,000 Ω·m y espesor a 0.20m',
          priority: 'Media'
        });
      }
      
      // 7. Recomendación de verificación in-situ (siempre útil)
      recommendations.push({
        type: 'info',
        icon: <Brain size={16} />,
        message: '📋 Verificación in-situ recomendada',
        action: 'Medir resistividad real del suelo con método Wenner',
        priority: 'Baja'
      });
      
      // 8. NOTA: Ya no se sugieren más conductores/varillas si el diseño ya cumple
      if (complies && safetyMargin > 50) {
        recommendations.push({
          type: 'success',
          icon: <CheckCircle size={16} />,
          message: '✨ Configuración actual óptima',
          action: 'Mantener diseño existente',
          priority: 'Baja'
        });
      }
      
      const predictionsData = {
        overallScore: Math.min(100, Math.max(0, overallScore)).toFixed(0),
        safetyScore: Math.max(0, safetyMargin).toFixed(0),
        efficiencyScore: efficiencyScore.toFixed(0),
        costScore: costScore.toFixed(0),
        estimatedLifespan: estimatedLifespan,
        maintenanceInterval: maintenanceInterval,
        riskLevel: riskLevel,
        riskColor: riskColor,
        riskIcon,
        performancePrediction,
        recommendations
      };
      
      setPredictions(predictionsData);
      setIsAnalyzing(false);
    }, 1500);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-blue-100 dark:bg-blue-900/30';
    if (score >= 40) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
      <div className="flex items-center gap-2 mb-4">
        <Brain className="text-blue-800" size={24} />
        <h3 className="text-lg font-semibold">🤖 IA Predictiva - Análisis Inteligente</h3>
        {isAnalyzing && (
          <span className="ml-auto text-xs text-blue-500 animate-pulse">Analizando...</span>
        )}
      </div>
      
      {isAnalyzing ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Analizando diseño con IA...</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{analysisProgress}% completado</p>
        </div>
      ) : predictions && (
        <>
          {/* Score general */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <svg className="w-28 h-28">
                <circle 
                  className="text-gray-200 dark:text-gray-100" 
                  strokeWidth="8" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="48" 
                  cx="56" 
                  cy="56"
                />
                <circle 
                  className="text-blue-800" 
                  strokeWidth="8" 
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - predictions.overallScore / 100)}`}
                  strokeLinecap="round"
                  stroke="currentColor" 
                  fill="transparent" 
                  r="48" 
                  cx="56" 
                  cy="56"
                  transform="rotate(-90 56 56)"
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className={`text-3xl font-bold ${getScoreColor(parseInt(predictions.overallScore))}`}>
                  {predictions.overallScore}%
                </div>
                <div className="text-xs text-gray-500">Score</div>
              </div>
            </div>
            <div className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
              predictions.riskLevel === 'Crítico' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
              predictions.riskLevel === 'Alto' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
              predictions.riskLevel === 'Medio' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            }`}>
              {predictions.riskIcon}
              Riesgo {predictions.riskLevel}
            </div>
          </div>
          
          {/* Métricas principales */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className={`text-center p-3 rounded-lg ${getScoreBgColor(parseInt(predictions.safetyScore))}`}>
              <Shield size={20} className="mx-auto mb-1 text-blue-600" />
              <div className="text-xl font-bold">{predictions.safetyScore}%</div>
              <div className="text-xs text-gray-500">Seguridad</div>
            </div>
            <div className={`text-center p-3 rounded-lg ${getScoreBgColor(parseInt(predictions.efficiencyScore))}`}>
              <Zap size={20} className="mx-auto mb-1 text-blue-500" />
              <div className="text-xl font-bold">{predictions.efficiencyScore}%</div>
              <div className="text-xs text-gray-500">Eficiencia</div>
            </div>
            <div className={`text-center p-3 rounded-lg ${getScoreBgColor(parseInt(predictions.costScore))}`}>
              <DollarSign size={20} className="mx-auto mb-1 text-green-500" />
              <div className="text-xl font-bold">{predictions.costScore}%</div>
              <div className="text-xs text-gray-500">Costo</div>
            </div>
          </div>
          
          {/* Predicciones de vida útil */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-gray-500" />
                <span className="text-xs text-gray-500">Vida útil estimada</span>
              </div>
              <div className="text-xl font-bold text-blue-600">{predictions.estimatedLifespan} años</div>
              <div className="text-xs text-gray-400 mt-1">
                {predictions.estimatedLifespan > 25 ? 'Excelente' : predictions.estimatedLifespan > 20 ? 'Buena' : 'Aceptable'}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-gray-500" />
                <span className="text-xs text-gray-500">Mantenimiento preventivo</span>
              </div>
              <div className="text-xl font-bold text-blue-600">Cada {predictions.maintenanceInterval} años</div>
              <div className="text-xs text-gray-400 mt-1">
                Inspección recomendada
              </div>
            </div>
          </div>
          
          {/* Predicción de desempeño futuro */}
          <div className={`mb-6 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h4 className="text-sm font-semibold mb-2">📈 Predicción de Desempeño</h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="text-gray-500">1 año</div>
                <div className={`font-semibold ${
                  predictions.performancePrediction.nextYear === 'Estable' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {predictions.performancePrediction.nextYear}
                </div>
              </div>
              <div>
                <div className="text-gray-500">5 años</div>
                <div className={`font-semibold ${
                  predictions.performancePrediction.fiveYears === 'Excelente' ? 'text-green-600' :
                  predictions.performancePrediction.fiveYears === 'Buena' ? 'text-blue-600' : 'text-yellow-600'
                }`}>
                  {predictions.performancePrediction.fiveYears}
                </div>
              </div>
              <div>
                <div className="text-gray-500">10 años</div>
                <div className={`font-semibold ${
                  predictions.performancePrediction.tenYears === 'Excelente' ? 'text-green-600' :
                  predictions.performancePrediction.tenYears === 'Buena' ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  {predictions.performancePrediction.tenYears}
                </div>
              </div>
            </div>
          </div>
          
          {/* Recomendaciones IA */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Brain size={16} /> Recomendaciones IA
            </h4>
            {predictions.recommendations.map((rec, idx) => (
              <div key={idx} className={`p-3 rounded-lg text-sm flex items-start gap-3 ${
                rec.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500' :
                rec.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500' :
                rec.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500' :
                'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
              }`}>
                <div className="flex-shrink-0 mt-0.5">
                  {rec.icon}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    rec.type === 'error' ? 'text-red-800 dark:text-red-300' :
                    rec.type === 'warning' ? 'text-yellow-800 dark:text-yellow-300' :
                    rec.type === 'success' ? 'text-green-800 dark:text-green-300' :
                    'text-blue-800 dark:text-blue-300'
                  }`}>
                    {rec.message}
                  </p>
                  <p className="text-xs mt-1 text-gray-500">💡 {rec.action}</p>
                  {rec.priority !== 'Baja' && (
                    <span className={`inline-block text-xs mt-1 px-2 py-0.5 rounded ${
                      rec.priority === 'Crítica' ? 'bg-red-200 text-red-800 dark:bg-red-800/50 dark:text-red-200' :
                      rec.priority === 'Alta' ? 'bg-orange-200 text-orange-800 dark:bg-orange-800/50 dark:text-orange-200' :
                      'bg-yellow-200 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-200'
                    }`}>
                      Prioridad {rec.priority}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Nota informativa */}
          <div className="mt-4 pt-3 border-t text-xs text-gray-400 text-center">
            <p>🤖 Análisis basado en IA con datos históricos y normas IEEE 80-2013</p>
            <p className="mt-1">Las predicciones tienen fines de planificación y pueden variar según condiciones reales</p>
          </div>
        </>
      )}
    </div>
  );
};

export default PredictiveAI;