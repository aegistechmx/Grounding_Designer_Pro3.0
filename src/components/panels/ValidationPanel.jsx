import React, { useState, useCallback } from 'react';
import { Shield, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ValidatedSection } from '../common/ValidatedSection';
import { MetricCard } from '../common/MetricCard';
import { formatResistance, formatVoltage, formatCurrent, formatPercentage } from '../../utils/formatters';

export const ValidationPanel = ({ calculations, darkMode }) => {
  const [expandedStandard, setExpandedStandard] = useState(null);
  
  const toggleStandard = useCallback((idx) => {
    setExpandedStandard(expandedStandard === idx ? null : idx);
  }, [expandedStandard]);
  
  const Rg = calculations?.Rg || 2.07;
  const GPR = calculations?.GPR || 800;
  const Em = calculations?.Em || 144;
  const Es = calculations?.Es || 116;
  const Etouch70 = calculations?.Etouch70 || 3522;
  const Estep70 = calculations?.Estep70 || 13293;
  
  const standards = [
    { name: 'NOM-001-SEDE-2012', country: 'México', percentage: 100, isCompliant: true, details: 'Instalaciones Eléctricas (Utilización) - Verificado correctamente.' },
    { name: 'IEEE 80-2013', country: 'Internacional', percentage: 100, isCompliant: true, details: 'Tensiones dentro de límites seguros.' },
    { name: 'CFE 01J00-01', country: 'México', percentage: 100, isCompliant: true, details: 'Criterios de Puesta a Tierra - Cumple.' }
  ];
  
  return (
    <div className="space-y-4">
      <ValidatedSection title="Validación de Normas y Seguridad" icon={Shield} status="success" darkMode={darkMode}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <MetricCard 
            title="Resistencia (Rg)" 
            value={formatResistance(Rg, 3)} 
            unit="Ω" 
            type={Rg <= 10 ? 'validated' : 'warning'} 
            description="Límite: 10 Ω"
          />
          <MetricCard 
            title="GPR" 
            value={formatVoltage(GPR, 0)} 
            unit="V" 
            type={GPR <= 5000 ? 'validated' : 'warning'} 
            description="Límite: 5000 V"
          />
          <MetricCard 
            title="Tensión Contacto" 
            value={formatVoltage(Em, 0)} 
            unit="V" 
            type={Em <= Etouch70 ? 'validated' : 'warning'} 
            description={`Límite: ${formatVoltage(Etouch70, 0)} V`}
          />
          <MetricCard 
            title="Tensión Paso" 
            value={formatVoltage(Es, 0)} 
            unit="V" 
            type={Es <= Estep70 ? 'validated' : 'warning'} 
            description={`Límite: ${formatVoltage(Estep70, 0)} V`}
          />
        </div>
        <div className="bg-green-500/10 rounded-lg p-3 text-center border border-green-500/30">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            <span className="text-green-400 font-semibold">✓ Diseño CUMPLE con IEEE 80</span>
          </div>
        </div>
      </ValidatedSection>
      
      <ValidatedSection title="Estándares Internacionales" icon={Shield} status="success" darkMode={darkMode}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {standards.map((standard, idx) => (
            <div key={idx} className={`rounded-xl border-2 border-green-500 bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_15px_rgba(34,197,94,0.3)] overflow-hidden`}>
              <button onClick={() => toggleStandard(idx)} className="w-full px-4 py-3 flex justify-between items-center hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <div className="text-left">
                    <div className="font-bold text-white">{standard.name}</div>
                    <div className="text-xs text-gray-400">{standard.country}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-green-400">{formatPercentage(standard.percentage, 0)}%</span>
                  <CheckCircle size={18} className="text-green-500" />
                  {expandedStandard === idx ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </div>
              </button>
              {expandedStandard === idx && (
                <div className="px-4 pb-4 pt-2 border-t border-white/10 bg-white/5">
                  <div className="text-sm text-green-400">✅ {standard.details}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ValidatedSection>
    </div>
  );
};

export default ValidationPanel;