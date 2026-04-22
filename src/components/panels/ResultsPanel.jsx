// src/components/panels/ResultsPanel.jsx
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { ValidatedSection } from '../common/ValidatedSection';
import { MetricCard } from '../common/MetricCard';

export const ResultsPanel = ({ calculations, darkMode }) => {
  const Rg = isFinite(calculations?.Rg) ? calculations.Rg : 0;
  const GPR = isFinite(calculations?.GPR) ? calculations.GPR : 0;
  const Em = isFinite(calculations?.Em) ? calculations.Em : 0;
  const Es = isFinite(calculations?.Es) ? calculations.Es : 0;
  const Ig = isFinite(calculations?.Ig) ? calculations.Ig : 0;
  
  return (
    <div className="space-y-4">
      <ValidatedSection title="Resultados de Cálculo" icon={TrendingUp} status="info" darkMode={darkMode}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <MetricCard title="Resistencia (Rg)" value={Rg} unit="Ω" type="auto" />
          <MetricCard title="GPR" value={GPR} unit="V" type="auto" />
          <MetricCard title="Tensión Contacto" value={Em} unit="V" type={calculations?.touchSafe70 ? 'validated' : 'warning'} />
          <MetricCard title="Tensión Paso" value={Es} unit="V" type={calculations?.stepSafe70 ? 'validated' : 'warning'} />
        </div>
        
        <MetricCard title="Corriente de Malla (Ig)" value={Ig} unit="A" type="auto" />
        
        <div className="mt-3 p-3 rounded-lg text-center bg-green-500/10 border border-green-500">
          <span className="text-green-400 font-semibold">
            {calculations?.complies ? '✅ Diseño verificado correctamente' : '❌ Diseño requiere revisión'}
          </span>
        </div>
      </ValidatedSection>
    </div>
  );
};