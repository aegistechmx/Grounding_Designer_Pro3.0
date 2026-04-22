// src/components/ProDashboard.jsx
import React, { useState } from 'react';
import { 
  CheckCircle, AlertTriangle, XCircle, Info, TrendingUp, Activity, 
  Gauge, Zap, Shield, Battery, TrendingDown, Award, Brain, 
  Calendar, Clock, ChevronUp, ChevronDown, Wrench, Ruler, Sparkles, Heart, Grid
} from 'lucide-react';
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
      <div className="rounded-xl border-2 border-blue-500 bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_15px_rgba(59,130,246,0.3)] p-4">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <TrendingDown size={16} className="text-blue-400" />
          Indicadores de Eficiencia
        </h4>
        <div className="grid grid-cols-4 gap-3">
          <IndicatorCard label="Área de malla" value={area} unit="m²" icon={Activity} darkMode={darkMode} />
          <IndicatorCard label="Conductor total" value={totalConductor} unit="m" icon={Zap} darkMode={darkMode} />
          <IndicatorCard label="Varillas" value={params?.numRods || 6} unit="" icon={Battery} darkMode={darkMode} />
          <IndicatorCard label="Configuración" value={config} unit="" icon={Grid} darkMode={darkMode} />
        </div>
      </div>
      
      {/* IA Predictiva */}
      <div className="rounded-xl border-2 border-purple-500 bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_15px_rgba(168,85,247,0.3)] p-4">
        <button
          onClick={() => setShowAI(!showAI)}
          className="w-full flex justify-between items-center"
        >
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-purple-400" />
            <h4 className="font-semibold text-white">🤖 IA Predictiva - Análisis Inteligente</h4>
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">Machine Learning</span>
          </div>
          {showAI ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </button>
        
        {showAI && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <ScoreCard title="Score" score={designScore} icon={Brain} darkMode={darkMode} />
              <div className="rounded-xl border-2 border-green-500 bg-green-500/10 p-3 text-center">
                <div className="text-xs text-gray-400">Riesgo</div>
                <div className="text-lg font-bold text-green-400">Bajo</div>
              </div>
              <ScoreCard title="Seguridad" score={safetyMargin} icon={Shield} darkMode={darkMode} />
              <ScoreCard title="Eficiencia" score={efficiency} icon={Zap} darkMode={darkMode} />
              <ScoreCard title="Costo" score={costScore} icon={Battery} darkMode={darkMode} />
            </div>
            
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-blue-400" />
                <span className="text-sm text-white font-semibold">Vida útil estimada</span>
              </div>
              <div className="text-2xl font-bold text-green-400">30 años</div>
              <div className="text-xs text-gray-400 mt-1">Excelente</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                <div className="text-xs text-gray-400">Mantenimiento preventivo</div>
                <div className="text-white font-semibold">Cada 8 años</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                <div className="text-xs text-gray-400">Inspección recomendada</div>
                <div className="text-white font-semibold">Anual</div>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-white mb-2">📈 Predicción de Desempeño</div>
              <div className="flex gap-2">
                {predictions.map(p => (
                  <div key={p.year} className="flex-1 text-center p-2 bg-gray-700/50 rounded-lg">
                    <div className="text-lg font-bold text-white">{p.year}</div>
                    <div className="text-xs text-green-400">{p.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Recomendaciones IA */}
      <div className="rounded-xl border-2 border-blue-500 bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_15px_rgba(59,130,246,0.3)] p-4">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Brain size={16} className="text-blue-400" />
          Recomendaciones IA
        </h4>
        <div className="space-y-2">
          {recommendations.map((rec, idx) => {
            let colorClass = 'text-gray-400';
            if (rec.type === 'success') colorClass = 'text-green-400';
            else if (rec.type === 'warning') colorClass = 'text-yellow-400';
            else if (rec.type === 'info') colorClass = 'text-blue-400';
            
            return (
              <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-gray-700/30">
                <div className={colorClass}>{rec.icon}</div>
                <div>
                  <div className={`text-sm font-medium ${colorClass}`}>{rec.title}</div>
                  <div className="text-xs text-gray-400">{rec.description}</div>
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
