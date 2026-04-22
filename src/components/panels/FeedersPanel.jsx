import React, { useState, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { ValidatedSection } from '../common/ValidatedSection';
import { InputField } from '../common/InputField';
import { MetricCard } from '../common/MetricCard';

export const FeedersPanel = ({ darkMode }) => {
  const [feederParams, setFeederParams] = useState({ watts: 100000, voltage: 480, pf: 0.9, distance: 68, phaseCount: 3, material: 'Cobre', ambientTemp: 35 });
  const [results, setResults] = useState(null);
  
  const calculate = useCallback(() => {
    const voltageSafe = Math.max(1, feederParams.voltage);
    const pfSafe = Math.max(0.1, feederParams.pf);
    const current = feederParams.watts / (Math.sqrt(3) * voltageSafe * pfSafe);
    const voltageDrop = Math.sqrt(3) * current * 0.16 * (feederParams.distance / 1000);
    const voltageDropPercent = (voltageDrop / voltageSafe) * 100;
    setResults({ current, voltageDrop, voltageDropPercent, complies: voltageDropPercent <= 3 });
  }, [feederParams]);
  
  return (
    <div className="space-y-4">
      <ValidatedSection title="Calculador de Alimentadores" icon={Zap} status="info" darkMode={darkMode}>
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Potencia"
            type="manual"
            value={feederParams.watts}
            onChange={(val) => setFeederParams(prev => ({ ...prev, watts: val }))}
            unit="W"
            min={0} max={1000000} step={1000}
          />
          <InputField
            label="Voltaje"
            type="manual"
            value={feederParams.voltage}
            onChange={(val) => setFeederParams(prev => ({ ...prev, voltage: val }))}
            unit="V"
            min={100} max={34500} step={10}
          />
          <InputField
            label="Factor Potencia"
            type="manual"
            value={feederParams.pf}
            onChange={(val) => setFeederParams(prev => ({ ...prev, pf: val }))}
            unit=""
            min={0.5} max={1} step={0.01}
          />
          <InputField
            label="Distancia"
            type="manual"
            value={feederParams.distance}
            onChange={(val) => setFeederParams(prev => ({ ...prev, distance: val }))}
            unit="m"
            min={0} max={1000} step={10}
          />
          <InputField
            label="Material"
            type="manual"
            value={feederParams.material}
            onChange={(val) => setFeederParams(prev => ({ ...prev, material: val }))}
            unit=""
          />
          <InputField
            label="Temp. Ambiente"
            type="manual"
            value={feederParams.ambientTemp}
            onChange={(val) => setFeederParams(prev => ({ ...prev, ambientTemp: val }))}
            unit="°C"
            min={20} max={60} step={1}
          />
        </div>
        <button onClick={calculate} className="w-full mt-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold flex items-center justify-center gap-2"><Zap size={16} /> Calcular Alimentador</button>
        {results && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard title="Corriente" value={results.current} unit="A" type="auto" />
              <MetricCard title="Caída Tensión" value={results.voltageDropPercent} unit="%" type={results.voltageDropPercent <= 3 ? 'validated' : 'warning'} />
            </div>
            <div className={`p-3 rounded-lg text-center ${results.complies ? 'bg-green-500/10 border border-green-500' : 'bg-red-500/10 border border-red-500'}`}>
              <span className={results.complies ? 'text-green-400' : 'text-red-400'} font-semibold>
                {results.complies ? '✅ Alimentador calculado correctamente' : '❌ Alimentador requiere revisión'}
              </span>
            </div>
          </div>
        )}
      </ValidatedSection>
    </div>
  );
};