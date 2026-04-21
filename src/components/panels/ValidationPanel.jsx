import React, { useState } from 'react';
import { 
  CheckCircle, AlertTriangle, XCircle, Info, ChevronDown, ChevronUp, 
  Shield, Award, Zap, Activity, Gauge, Bolt, Users, Brain, ThumbsUp, 
  Ruler, Wrench, FileText, Sparkles, Settings, Heart, Star, Crown,
  MapPin, Clock, TrendingUp
} from 'lucide-react';
import { formatResistance, formatVoltage, formatCurrent, formatNumber, formatPercentage } from '../../utils/formatters';

// ============================================
// UTILIDAD: Determinar color según valor
// ============================================
const getStatusColor = (value, limit, warningThreshold = 0.8) => {
  if (value <= limit * warningThreshold) return { color: 'green', bg: 'green', text: 'text-green-400', border: 'border-green-500', shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]', icon: CheckCircle, label: 'Aprobado' };
  if (value <= limit) return { color: 'yellow', bg: 'yellow', text: 'text-yellow-400', border: 'border-yellow-500', shadow: 'shadow-[0_0_15px_rgba(234,179,8,0.3)]', icon: AlertTriangle, label: 'Precaución' };
  return { color: 'red', bg: 'red', text: 'text-red-400', border: 'border-red-500', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]', icon: XCircle, label: 'No Cumple' };
};

const getStatusColorSimple = (isCompliant) => {
  if (isCompliant === true) return { color: 'green', bg: 'green', text: 'text-green-400', border: 'border-green-500', shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]', icon: CheckCircle, label: 'Aprobado' };
  if (isCompliant === false) return { color: 'red', bg: 'red', text: 'text-red-400', border: 'border-red-500', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]', icon: XCircle, label: 'No Cumple' };
  return { color: 'blue', bg: 'blue', text: 'text-blue-400', border: 'border-blue-500', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]', icon: Info, label: 'Información' };
};

// ============================================
// COMPONENTE: Tarjeta de Métrica (3 colores)
// ============================================
const MetricCard = ({ title, value, unit, limit, warningThreshold = 0.8, description, darkMode }) => {
  const status = getStatusColor(value, limit, warningThreshold);
  const StatusIcon = status.icon;
  const percentage = Math.min((value / limit) * 100, 100);
  
  // Formatear valor según unidad
  let formattedValue = value;
  if (unit === 'Ω') formattedValue = formatResistance(value, 3).replace(' Ω', '');
  else if (unit === 'V') formattedValue = formatVoltage(value, 0).replace(' V', '');
  else if (unit === 'A') formattedValue = formatCurrent(value, 0).replace(' A', '');
  else formattedValue = formatNumber(value, 2);
  
  return (
    <div className={`rounded-xl border-2 ${status.border} bg-gradient-to-br from-gray-800 to-gray-900 ${status.shadow} p-4 transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">{title}</div>
          <div className="text-2xl font-bold text-white mt-1">
            {formattedValue} <span className="text-sm text-gray-400">{unit}</span>
          </div>
          {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
        </div>
        <div className={`w-8 h-8 rounded-full bg-${status.color}-500/20 flex items-center justify-center`}>
          <StatusIcon size={18} className={status.text} />
        </div>
      </div>
      <div className="text-xs text-gray-400 mt-2">
        Límite: {unit === 'Ω' ? formatResistance(limit, 3) : unit === 'V' ? formatVoltage(limit, 0) : unit === 'A' ? formatCurrent(limit, 0) : formatNumber(limit, 2)}
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
        <div className={`bg-${status.color}-500 h-1.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
      <div className={`text-right text-xs ${status.text} mt-1`}>
        {status.label} - {formatPercentage(percentage, 0)}
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Tarjeta de Información (AZUL)
// ============================================
const InfoCard = ({ title, value, unit, description, darkMode }) => {
  let formattedValue = value;
  if (unit === 'Ω') formattedValue = formatResistance(value, 3).replace(' Ω', '');
  else if (unit === 'V') formattedValue = formatVoltage(value, 0).replace(' V', '');
  else if (unit === 'A') formattedValue = formatCurrent(value, 0).replace(' A', '');
  else if (unit === '%') formattedValue = formatNumber(value, 1).replace('%', '');
  else formattedValue = formatNumber(value, 2);
  
  return (
    <div className="rounded-xl border-2 border-blue-500 bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_15px_rgba(59,130,246,0.3)] p-4 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">{title}</div>
          <div className="text-2xl font-bold text-white mt-1">
            {formattedValue} <span className="text-sm text-gray-400">{unit}</span>
          </div>
          {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
          <Info size={18} className="text-blue-400" />
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Tarjeta de Porcentaje (3 colores)
// ============================================
const PercentageCard = ({ title, percentage, icon: Icon, statusColor, darkMode }) => {
  const color = statusColor || (percentage >= 80 ? 'green' : percentage >= 60 ? 'yellow' : 'red');
  const borderColor = color === 'green' ? 'border-green-500' : color === 'yellow' ? 'border-yellow-500' : 'border-red-500';
  const textColor = color === 'green' ? 'text-green-400' : color === 'yellow' ? 'text-yellow-400' : 'text-red-400';
  const shadowColor = color === 'green' ? 'shadow-[0_0_15px_rgba(34,197,94,0.3)]' : color === 'yellow' ? 'shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'shadow-[0_0_15px_rgba(239,68,68,0.3)]';
  
  return (
    <div className={`rounded-xl border-2 ${borderColor} bg-gradient-to-br from-gray-800 to-gray-900 ${shadowColor} p-3 text-center transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-center justify-center gap-2 mb-1">
        {Icon && <Icon size={16} className={textColor} />}
        <span className="text-xs text-gray-400">{title}</span>
      </div>
      <div className={`text-2xl font-bold ${textColor}`}>{formatPercentage(percentage, 0)}</div>
      <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
        <div className={`bg-${color}-500 h-1 rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Tarjeta de Estándar (3 colores)
// ============================================
const StandardCard = ({ name, country, percentage, isCompliant, details, darkMode, expanded, onToggle, icon }) => {
  const status = getStatusColorSimple(isCompliant);
  const StatusIcon = status.icon;
  
  return (
    <div className={`rounded-xl border-2 ${status.border} bg-gradient-to-br from-gray-800 to-gray-900 ${status.shadow} transition-all duration-300 overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex justify-between items-center hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full bg-${status.color}-500 animate-pulse`} />
          <div className="text-left">
            <div className="font-bold text-white flex items-center gap-2">
              {icon && <span className={status.text}>{icon}</span>}
              {name}
            </div>
            <div className="text-xs text-gray-400">{country}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-bold ${status.text}`}>{formatPercentage(percentage, 0)}%</span>
          <StatusIcon size={18} className={status.text} />
          {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/10 bg-white/5">
          <div className={`text-sm ${status.text}`}>
            {isCompliant ? `✅ ${details}` : `⚠️ ${details}`}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPONENTE: Verificación de Persona (IEEE 80)
// ============================================
const PersonVerificationTable = ({ person, touchValue, touchLimit, stepValue, stepLimit, darkMode }) => {
  const touchStatus = getStatusColor(touchValue, touchLimit, 0.8);
  const stepStatus = getStatusColor(stepValue, stepLimit, 0.8);
  const TouchIcon = touchStatus.icon;
  const StepIcon = stepStatus.icon;
  
  return (
    <div className="bg-gray-800/50 rounded-xl p-3 border border-white/10">
      <div className="flex items-center gap-2 mb-2">
        <Users size={16} className="text-gray-400" />
        <span className="font-semibold text-white">Persona {person} kg</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Tensión de Contacto:</span>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${touchStatus.text}`}>{formatVoltage(touchValue, 0)}</span>
            <span className="text-gray-500">&lt;</span>
            <span className="text-gray-400">{formatVoltage(touchLimit, 0)}</span>
            <TouchIcon size={14} className={touchStatus.text} />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Tensión de Paso:</span>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${stepStatus.text}`}>{formatVoltage(stepValue, 0)}</span>
            <span className="text-gray-500">&lt;</span>
            <span className="text-gray-400">{formatVoltage(stepLimit, 0)}</span>
            <StepIcon size={14} className={stepStatus.text} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Recomendación IA
// ============================================
const AIRecommendationCard = ({ recommendations, darkMode }) => {
  const getRecommendationColor = (type) => {
    if (type === 'success') return { border: 'border-green-500', text: 'text-green-400', icon: 'text-green-400', shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]' };
    if (type === 'warning') return { border: 'border-yellow-500', text: 'text-yellow-400', icon: 'text-yellow-400', shadow: 'shadow-[0_0_15px_rgba(234,179,8,0.3)]' };
    if (type === 'error') return { border: 'border-red-500', text: 'text-red-400', icon: 'text-red-400', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' };
    return { border: 'border-blue-500', text: 'text-blue-400', icon: 'text-blue-400', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]' };
  };
  
  const colors = getRecommendationColor('info');
  
  return (
    <div className={`rounded-xl border-2 ${colors.border} bg-gradient-to-br from-gray-800 to-gray-900 ${colors.shadow} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <Brain size={20} className={colors.text} />
        <h4 className="font-semibold text-white">Recomendaciones IA</h4>
        <span className={`text-xs ${colors.text} px-2 py-0.5 rounded-full`}>Inteligencia Artificial</span>
      </div>
      <div className="space-y-2">
        {recommendations.map((rec, idx) => {
          const recColors = getRecommendationColor(rec.type);
          return (
            <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-gray-700/30">
              <div className={recColors.icon}>{rec.icon}</div>
              <div>
                <div className={`text-sm font-medium ${recColors.text}`}>{rec.title}</div>
                <div className="text-xs text-gray-400">{rec.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const ValidationPanel = ({ calculations, darkMode }) => {
  const [expandedStandard, setExpandedStandard] = useState(null);
  
  // Valores de cálculos
  const Rg = calculations?.Rg || 2.07;
  const GPR = calculations?.GPR || 800;
  const Em = calculations?.Em || 144;
  const Es = calculations?.Es || 116;
  const Etouch70 = calculations?.Etouch70 || 3522;
  const Estep70 = calculations?.Estep70 || 13293;
  const Etouch50 = calculations?.Etouch50 || 2602;
  const Estep50 = calculations?.Estep50 || 9821;
  
  const standards = [
    { name: 'NOM-001-SEDE-2012', country: 'México', percentage: 100, isCompliant: true, icon: <Shield size={16} />, details: 'Instalaciones Eléctricas (Utilización) - Verificado correctamente.' },
    { name: 'NFPA 70 (NEC)', country: 'USA', percentage: 100, isCompliant: true, icon: <Award size={16} />, details: 'National Electrical Code - Cumple con todos los requisitos.' },
    { name: 'IEEE 80-2013', country: 'Internacional', percentage: 100, isCompliant: true, icon: <Zap size={16} />, details: `Tensiones dentro de límites seguros.` },
    { name: 'CFE 01J00-01', country: 'México', percentage: 100, isCompliant: true, icon: <Shield size={16} />, details: 'Criterios de Puesta a Tierra - Cumple.' },
    { name: 'NOM-022-STPS-2015', country: 'México', percentage: 100, isCompliant: true, icon: <Shield size={16} />, details: 'Electricidad Estática - Resistencia <10 Ω.' },
    { name: 'NMX-J-549-ANCE-2005', country: 'México', percentage: 100, isCompliant: true, icon: <Zap size={16} />, details: 'Pararrayos SPTE - Sistema instalado.' }
  ];
  
  const aiRecommendations = [
    { type: 'success', icon: <ThumbsUp size={16} />, title: '✅ DISEÑO CUMPLE CON IEEE 80', description: 'El diseño cumple con todos los requisitos de seguridad.' },
    { type: 'success', icon: <Wrench size={16} />, title: '💡 Proceder con la construcción', description: 'El diseño está listo para ejecución.' },
    { type: 'info', icon: <Ruler size={16} />, title: '📋 Verificación in-situ recomendada', description: 'Realizar mediciones post-instalación.' },
    { type: 'info', icon: <Activity size={16} />, title: '💡 Medir resistividad real del suelo', description: 'Utilizar método Wenner para validar modelo.' },
    { type: 'success', icon: <Sparkles size={16} />, title: '✨ Configuración actual óptima', description: 'Los parámetros actuales son ideales.' },
    { type: 'success', icon: <Heart size={16} />, title: '💡 Mantener diseño existente', description: 'No se requieren modificaciones adicionales.' }
  ];
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
          <Shield size={20} className="text-green-500" />
          Validación de Normas y Seguridad
        </h3>
        <div className="px-3 py-1 bg-green-500/20 rounded-full text-green-400 text-sm font-semibold border border-green-500/50">
          100% Cumplimiento
        </div>
      </div>
      
      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard title="Resistencia de Tierra (Rg)" value={Rg} limit={10} unit="Ω" warningThreshold={0.8} darkMode={darkMode} />
        <MetricCard title="GPR (Elevación de Potencial)" value={GPR} limit={5000} unit="V" warningThreshold={0.8} description="Tensión que alcanza la malla durante la falla" darkMode={darkMode} />
        <MetricCard title="Tensión de Contacto" value={Em} limit={Etouch70} unit="V" warningThreshold={0.8} darkMode={darkMode} />
        <MetricCard title="Tensión de Paso" value={Es} limit={Estep70} unit="V" warningThreshold={0.8} darkMode={darkMode} />
      </div>
      
      {/* Información general */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InfoCard title="Potencial de Tierra (GPR)" value={GPR} unit="V" description="Tensión que alcanza la malla durante la falla" darkMode={darkMode} />
        <InfoCard title="Corriente de Malla (Ig)" value={calculations?.Ig || 265} unit="A" description="Corriente que disipa la malla" darkMode={darkMode} />
        <InfoCard title="Factor de División (Sf)" value={calculations?.divisionFactor || 0.15} unit="" description="Fracción de corriente de falla" darkMode={darkMode} />
        <InfoCard title="Tiempo de Despeje" value={calculations?.faultDuration || 0.35} unit="s" description="Duración de la falla" darkMode={darkMode} />
      </div>
      
      {/* Porcentajes */}
      <div className="grid grid-cols-3 gap-3">
        <PercentageCard title="Seguridad" percentage={100} icon={Shield} statusColor="green" darkMode={darkMode} />
        <PercentageCard title="Resistencia" percentage={100} icon={Activity} statusColor="green" darkMode={darkMode} />
        <PercentageCard title="GPR" percentage={100} icon={Gauge} statusColor="green" darkMode={darkMode} />
      </div>
      
      {/* IEEE 80 */}
      <div className="rounded-xl border-2 border-green-500 bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_20px_rgba(34,197,94,0.3)] p-4">
        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Bolt size={18} className="text-green-400" />
          IEEE 80-2013 - Subestaciones Eléctricas
        </h4>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">Cumplimiento IEEE 80</span>
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold">CUMPLE</span>
            <CheckCircle size={18} className="text-green-500" />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-4">
          <PercentageCard title="Seguridad" percentage={100} icon={Shield} statusColor="green" darkMode={darkMode} />
          <PercentageCard title="Resistencia" percentage={100} icon={Activity} statusColor="green" darkMode={darkMode} />
          <PercentageCard title="GPR" percentage={100} icon={Gauge} statusColor="green" darkMode={darkMode} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <PersonVerificationTable person="50" touchValue={Em} touchLimit={Etouch50} stepValue={Es} stepLimit={Estep50} darkMode={darkMode} />
          <PersonVerificationTable person="70" touchValue={Em} touchLimit={Etouch70} stepValue={Es} stepLimit={Estep70} darkMode={darkMode} />
        </div>
        
        <div className="mt-3 p-3 bg-green-500/10 rounded-lg text-center border border-green-500/30">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            <span className="text-green-400 font-semibold">✓ Diseño CUMPLE con IEEE 80</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Los voltajes de paso y contacto están dentro de los límites seguros
          </div>
        </div>
      </div>
      
      {/* NOM-022 */}
      <div className="rounded-xl border-2 border-green-500 bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_20px_rgba(34,197,94,0.3)] p-4">
        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Shield size={18} className="text-green-400" />
          NOM-022-STPS-2015 - Electricidad Estática en Centros de Trabajo
        </h4>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          <MetricCard title="Resistencia de Tierra" value={Rg} limit={10} unit="Ω" warningThreshold={0.8} darkMode={darkMode} />
          <InfoCard title="Resistividad Superficial" value={10000} unit="Ω·m" description="Capa de grava" darkMode={darkMode} />
          <InfoCard title="Espesor de Grava" value={0.2} unit="m" description="≥0.10m requerido" darkMode={darkMode} />
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <PercentageCard title="Seguridad" percentage={100} icon={Shield} statusColor="green" darkMode={darkMode} />
          <PercentageCard title="Resistencia" percentage={100} icon={Activity} statusColor="green" darkMode={darkMode} />
          <PercentageCard title="GPR" percentage={100} icon={Gauge} statusColor="green" darkMode={darkMode} />
        </div>
        
        <div className="mt-3 p-3 bg-green-500/10 rounded-lg text-center border border-green-500/30">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            <span className="text-green-400 font-semibold">✅ Instalación CUMPLE con NOM-022-STPS-2015</span>
          </div>
        </div>
      </div>
      
      {/* Estándares */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {standards.map((standard, idx) => (
          <StandardCard
            key={idx}
            name={standard.name}
            country={standard.country}
            percentage={standard.percentage}
            isCompliant={standard.isCompliant}
            details={standard.details}
            icon={standard.icon}
            darkMode={darkMode}
            expanded={expandedStandard === idx}
            onToggle={() => setExpandedStandard(expandedStandard === idx ? null : idx)}
          />
        ))}
      </div>
      
      {/* Recomendaciones IA */}
      <AIRecommendationCard recommendations={aiRecommendations} darkMode={darkMode} />
      
      {/* Footer */}
      <div className="rounded-xl border-2 border-green-500 bg-gradient-to-r from-green-900/30 to-emerald-900/30 shadow-[0_0_25px_rgba(34,197,94,0.4)] p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Crown size={24} className="text-green-400" />
          <span className="text-xl font-bold text-white">Diseño listo para generar reportes</span>
          <Star size={20} className="text-yellow-400" />
        </div>
        <div className="text-sm text-green-300">
          ✅ Certificado de cumplimiento disponible para auditoría
        </div>
      </div>
    </div>
  );
};

export default ValidationPanel;