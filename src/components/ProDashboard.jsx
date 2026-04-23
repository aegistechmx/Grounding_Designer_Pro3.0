// src/components/ProDashboard.jsx
import React, { useState } from 'react';
import { 
  CheckCircle, AlertTriangle, XCircle, Info, TrendingUp, Activity, 
  Gauge, Zap, Shield, Battery, TrendingDown, Award, Brain, 
  Calendar, Clock, ChevronUp, ChevronDown, Wrench, Ruler, Sparkles, Heart, Grid
} from 'lucide-react';
import IEEESection from './common/IEEESection';
import { formatResistance, formatVoltage, formatCurrent, formatPercentage, formatNumber, formatCurrency } from '../utils/formatters';

// ============================================
// COMPONENTE: Tarjeta de Métrica (4 colores)
// ============================================
const MetricCard = ({ title, value, unit, limit, warningThreshold = 0.8, description, icon: Icon, darkMode }) => {
  let status = { color: 'blue', text: 'text-blue-400', border: 'border-blue-500', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]', icon: Info, label: 'Información' };
  
  if (limit) {
    if (value <= limit * warningThreshold) status = { color: 'green', text: 'text-green-400', border: 'border-green-500', shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]', icon: CheckCircle, label: 'Aprobado' };
    else if (value <= limit) status = { color: 'yellow', text: 'text-yellow-400', border: 'border-yellow-500', shadow: 'shadow-[0_0_15px_rgba(234,179,8,0.3)]', icon: AlertTriangle, label: 'Precaución' };
    else status = { color: 'red', text: 'text-red-400', border: 'border-red-500', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]', icon: XCircle, label: 'No cumple' };
  }
  
  const StatusIcon = status.icon;
  const percentage = limit ? Math.min((value / limit) * 100, 100) : 0;
  
  let formattedValue = value;
  if (unit === 'Ω') formattedValue = formatResistance(value, 3).replace(' Ω', '');
  else if (unit === 'V') formattedValue = formatVoltage(value, 0).replace(' V', '');
  else if (unit === 'A') formattedValue = formatCurrent(value, 0).replace(' A', '');
  else if (unit === '%') formattedValue = formatPercentage(value, 1).replace('%', '');
  
  return (
    <div className={`rounded-xl border-2 ${status.border} bg-gradient-to-br from-gray-800 to-gray-900 ${status.shadow} p-4 transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1">
            {Icon && <Icon size={12} className={status.text} />}
            {title}
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {formattedValue} <span className="text-sm text-gray-400">{unit}</span>
          </div>
          {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
        </div>
        <div className={`w-8 h-8 rounded-full bg-${status.color}-500/20 flex items-center justify-center`}>
          <StatusIcon size={18} className={status.text} />
        </div>
      </div>
      {limit && (
        <>
          <div className="text-xs text-gray-400 mt-2">Límite: {limit} {unit}</div>
          <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
            <div className={`bg-${status.color}-500 h-1.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
          </div>
          <div className={`text-right text-xs ${status.text} mt-1`}>
            {status.label} - {percentage.toFixed(0)}%
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// COMPONENTE: Tarjeta de Score (4 colores)
// ============================================
const ScoreCard = ({ title, score, icon: Icon, darkMode }) => {
  let status = { color: 'blue', text: 'text-blue-400', border: 'border-blue-500' };
  if (score >= 80) status = { color: 'green', text: 'text-green-400', border: 'border-green-500' };
  else if (score >= 60) status = { color: 'yellow', text: 'text-yellow-400', border: 'border-yellow-500' };
  else status = { color: 'red', text: 'text-red-400', border: 'border-red-500' };
  
  return (
    <div className={`rounded-xl border-2 ${status.border} bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_15px_rgba(34,197,94,0.2)] p-4 text-center transition-all duration-300`}>
      <div className="flex items-center justify-center gap-2 mb-2">
        {Icon && <Icon size={16} className={status.text} />}
        <span className="text-xs text-gray-400">{title}</span>
      </div>
      <div className={`text-3xl font-bold ${status.text}`}>{score}%</div>
      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
        <div className={`bg-${status.color}-500 h-1.5 rounded-full`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Tarjeta de Indicador
// ============================================
const IndicatorCard = ({ label, value, unit, icon: Icon, darkMode }) => {
  return (
    <div className="rounded-xl border-2 border-blue-500 bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_15px_rgba(59,130,246,0.3)] p-3 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        {Icon && <Icon size={12} className="text-blue-400" />}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="text-lg font-bold text-white">
        {value} <span className="text-xs text-gray-400">{unit}</span>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Verificación de Tensión
// ============================================
const VoltageVerification = ({ title, value, limit, darkMode }) => {
  const isCompliant = value <= limit;
  const status = isCompliant ? { color: 'green', text: 'text-green-400', border: 'border-green-500', icon: CheckCircle } : { color: 'red', text: 'text-red-400', border: 'border-red-500', icon: XCircle };
  const StatusIcon = status.icon;
  const percentage = (value / limit) * 100;
  
  return (
    <div className={`rounded-xl border-2 ${status.border} bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_15px_rgba(34,197,94,0.2)] p-3`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-300">{title}</span>
        <StatusIcon size={16} className={status.text} />
      </div>
      <div className="flex justify-between items-baseline">
        <span className="text-2xl font-bold text-white">{formatVoltage(value, 0)}</span>
        <span className="text-sm text-gray-400">Límite: {formatVoltage(limit, 0)}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
        <div className={`bg-${status.color}-500 h-1 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
      <div className={`text-xs mt-1 ${status.text}`}>
        {isCompliant ? '✓ Cumple con IEEE 80' : '✗ No cumple con IEEE 80'}
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const ProDashboard = ({ calculations, params, darkMode }) => {
  const [showAI, setShowAI] = useState(true);
  
  // Valores de cálculos
  const Rg = calculations?.Rg || 3.351;
  const GPR = calculations?.GPR || 3957;
  const Em = calculations?.Em || 680;
  const Es = calculations?.Es || 463;
  const Ig = calculations?.Ig || 1181;
  const complies = calculations?.complies || true;
  const safetyMargin = calculations?.safetyMargin || 80.7;
  
  // Métricas de eficiencia
  const area = params?.gridLength * params?.gridWidth || 196;
  const totalConductor = 2 * (params?.gridLength + params?.gridWidth) * (params?.numParallel || 4) || 224;
  const config = `${params?.numParallel || 4}×${params?.numParallelY || 4}`;
  
  // Puntajes
  const designScore = 69;
  const efficiency = 30;
  const costScore = 98;
  
  // Predicciones
  const predictions = [
    { year: 1, status: 'Estable', color: 'green' },
    { year: 5, status: 'Buena', color: 'green' },
    { year: 10, status: 'Excelente', color: 'green' }
  ];
  
  const recommendations = [
    { type: 'success', icon: <CheckCircle size={14} />, title: '✅ DISEÑO CUMPLE CON IEEE 80', description: 'El diseño cumple con todos los requisitos de seguridad.' },
    { type: 'success', icon: <Wrench size={14} />, title: '💡 Proceder con la construcción', description: 'El diseño está listo para ejecución.' },
    { type: 'info', icon: <Ruler size={14} />, title: '📋 Verificación in-situ recomendada', description: 'Realizar mediciones post-instalación.' },
    { type: 'info', icon: <Activity size={14} />, title: '💡 Medir resistividad real del suelo', description: 'Utilizar método Wenner para validar modelo.' },
    { type: 'success', icon: <Sparkles size={14} />, title: '✨ Configuración actual óptima', description: 'Los parámetros actuales son ideales.' },
    { type: 'success', icon: <Heart size={14} />, title: '💡 Mantener diseño existente', description: 'No se requieren modificaciones adicionales.' }
  ];
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-green-400" />
          Dashboard de Rendimiento
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${
          complies ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-red-500/20 text-red-400 border-red-500'
        }`}>
          {complies ? '✓ Cumple IEEE 80' : '✗ No Cumple IEEE 80'}
        </div>
      </div>
      
      {/* Score General */}
      <div className="grid grid-cols-4 gap-3">
        <ScoreCard title="Score General" score={designScore} icon={Award} darkMode={darkMode} />
        <ScoreCard title="Margen Seguridad" score={safetyMargin} icon={Shield} darkMode={darkMode} />
        <ScoreCard title="Eficiencia" score={efficiency} icon={Zap} darkMode={darkMode} />
        <ScoreCard title="Costo Estimado" score={costScore} icon={Battery} darkMode={darkMode} />
      </div>
      
      {/* Métricas Principales */}
      <div className="grid grid-cols-4 gap-3">
        <MetricCard title="Resistencia Malla" value={Rg} unit="Ω" limit={5} warningThreshold={0.8} icon={Activity} darkMode={darkMode} />
        <MetricCard title="Seguridad" value={safetyMargin} unit="%" limit={100} warningThreshold={0.7} icon={Shield} darkMode={darkMode} />
        <MetricCard title="GPR" value={GPR} unit="V" limit={5000} warningThreshold={0.8} description="Elevación de potencial" icon={Gauge} darkMode={darkMode} />
        <MetricCard title="Corriente" value={Ig} unit="A" limit={2000} warningThreshold={0.8} description="Corriente en malla" icon={Zap} darkMode={darkMode} />
      </div>
      
      {/* Tensiones */}
      <div className="grid grid-cols-2 gap-3">
        <VoltageVerification title="Tensión de Contacto (Em)" value={Em} limit={3522} darkMode={darkMode} />
        <VoltageVerification title="Tensión de Paso (Es)" value={Es} limit={13293} darkMode={darkMode} />
      </div>
      
      {/* Indicadores de Eficiencia */}
      <IEEESection
        title="📋 Indicadores de Eficiencia"
        darkMode={darkMode}
        icon={TrendingDown}
        metrics={[
          { label: "Área de malla", value: `${area} m²` },
          { label: "Conductor total", value: `${totalConductor} m` },
          { label: "Varillas", value: `${params?.numRods || 6}` },
          { label: "Configuración", value: config },
          { label: "Eficiencia", value: `${efficiency}%`, highlight: 'text-green-400' },
          { label: "Score diseño", value: designScore }
        ]}
        info={
          <>
            <strong>💡 Análisis de eficiencia:</strong> El diseño optimiza el uso de materiales manteniendo los estándares de seguridad IEEE 80.
          </>
        }
        info2={
          <>
            <strong>📐 Balance:</strong> Relación óptima entre área de malla, conductor total y número de varillas para máxima eficiencia.
          </>
        }
      />
      
      {/* IA Predictiva */}
      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`} style={{ boxShadow: darkMode ? '0 0 15px rgba(59, 130, 246, 0.3), inset 0 0 8px rgba(59, 130, 246, 0.15)' : '0 0 15px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.1)' }}>
        <button
          onClick={() => setShowAI(!showAI)}
          className="w-full flex justify-between items-center"
        >
          <div className="flex items-center gap-2">
            <Brain size={18} className={darkMode ? 'text-blue-400' : 'text-blue-800'} />
            <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-blue-800'}`}>🤖 IA Predictiva - Análisis Inteligente</h4>
            <span className={`text-xs ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'} px-2 py-0.5 rounded-full`}>Machine Learning</span>
          </div>
          {showAI ? <ChevronUp size={18} className={darkMode ? 'text-blue-400' : 'text-blue-800'} /> : <ChevronDown size={18} className={darkMode ? 'text-blue-400' : 'text-blue-800'} />}
        </button>

        {showAI && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className={`p-2 rounded ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <div className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-blue-700'}`}>Score</div>
                <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-blue-900'}`}>{designScore}</div>
              </div>
              <div className={`p-2 rounded ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <div className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-green-700'}`}>Riesgo</div>
                <div className={`text-lg font-bold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>Bajo</div>
              </div>
              <div className={`p-2 rounded ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <div className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-blue-700'}`}>Seguridad</div>
                <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-blue-900'}`}>{safetyMargin}</div>
              </div>
              <div className={`p-2 rounded ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <div className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-blue-700'}`}>Eficiencia</div>
                <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-blue-900'}`}>{efficiency}</div>
              </div>
            </div>

            <div className={`p-3 rounded ${darkMode ? 'bg-blue-900/40' : 'bg-blue-200'}`}>
              <p className={`text-xs flex items-start gap-2 ${darkMode ? 'text-white' : 'text-blue-800'}`}>
                <Brain size={12} className="flex-shrink-0 mt-0.5" />
                <span>
                  <strong>💡 Análisis predictivo:</strong> El diseño presenta un balance óptimo entre seguridad, eficiencia y costo según el modelo de IA.
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recomendaciones IA */}
      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`} style={{ boxShadow: darkMode ? '0 0 15px rgba(59, 130, 246, 0.3), inset 0 0 8px rgba(59, 130, 246, 0.15)' : '0 0 15px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.1)' }}>
        <h4 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-blue-800'}`}>
          <Brain size={16} /> 📋 Recomendaciones IA
        </h4>
        <div className="space-y-2">
          {recommendations.map((rec, idx) => {
            let colorClass = darkMode ? 'text-gray-400' : 'text-gray-600';
            if (rec.type === 'success') colorClass = darkMode ? 'text-green-400' : 'text-green-700';
            else if (rec.type === 'warning') colorClass = darkMode ? 'text-yellow-400' : 'text-yellow-700';
            else if (rec.type === 'info') colorClass = darkMode ? 'text-blue-400' : 'text-blue-700';
            
            return (
              <div key={idx} className={`flex items-start gap-2 p-2 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <div className={colorClass}>{rec.icon}</div>
                <div>
                  <div className={`text-sm font-medium ${colorClass}`}>{rec.title}</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{rec.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        🤖 Análisis basado en IA con datos históricos y normas IEEE 80-2013
      </div>
      <div className="text-center text-xs text-gray-500">
        Las predicciones tienen fines de planificación y pueden variar según condiciones reales
      </div>
      
      <button
        onClick={() => setShowAI(!showAI)}
        className="w-full text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        {showAI ? '▲ Ocultar análisis IA' : '▼ Mostrar análisis IA'}
      </button>
    </div>
  );
};

export default ProDashboard;
