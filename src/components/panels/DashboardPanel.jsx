import React from 'react';
import { TrendingUp } from 'lucide-react';
import { ValidatedSection } from '../common/ValidatedSection';
import { MetricCard } from '../common/MetricCard';

export const DashboardPanel = ({ params, calculations, darkMode }) => {
  const Rg = calculations?.Rg || 3.35;
  const GPR = calculations?.GPR || 3957;
  const Em = calculations?.Em || 680;
  const Es = calculations?.Es || 463;
  const Ig = calculations?.Ig || 0;
  const faultCurrent = params?.faultCurrent || 0;
  const safetyMargin = calculations?.Etouch70 ? Math.max(0, ((calculations.Etouch70 - Em) / Math.max(1, calculations.Etouch70) * 100)) : 80;
  const currentDivisionFactor = params?.currentDivisionFactor || 0.1;
  const IgValue = Ig / Math.max(1, currentDivisionFactor);
  
  return (
    <div className="space-y-4">
      <ValidatedSection title="Dashboard de Rendimiento" icon={TrendingUp} status="info" darkMode={darkMode}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <MetricCard title="Resistencia de Malla" value={Rg} unit="Ω" type="auto" />
          <MetricCard title="GPR" value={GPR} unit="V" type="auto" />
          <MetricCard title="Margen de Seguridad" value={safetyMargin} unit="%" type={safetyMargin > 70 ? 'validated' : 'warning'} />
          <MetricCard title="Estado" value={calculations?.complies ? "CUMPLE" : "NO CUMPLE"} unit="" type={calculations?.complies ? 'validated' : 'warning'} />
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <MetricCard title="Tensión de Contacto" value={Em} unit="V" type={calculations?.touchSafe70 ? 'validated' : 'warning'} />
          <MetricCard title="Tensión de Paso" value={Es} unit="V" type={calculations?.stepSafe70 ? 'validated' : 'warning'} />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <MetricCard title="Corriente de Falla" value={faultCurrent} unit="A" type="auto" description="Según transformador" />
          <MetricCard title="Corriente en Malla (Ig)" value={Ig} unit="A" type="auto" description={`Sf = ${params?.currentDivisionFactor || 0.1}`} />
        </div>
      </ValidatedSection>
    </div>
  );
};