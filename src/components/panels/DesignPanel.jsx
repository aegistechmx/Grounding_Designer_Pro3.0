import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, RefreshCw, Brain, Zap } from 'lucide-react';
import { ValidatedSection } from '../common/ValidatedSection';
import { InputField } from '../common/InputField';
import { MetricCard } from '../common/MetricCard';
import { calculateFaultCurrent, getTypicalFaultCurrent } from '../../services/faultCurrentCalculator.service';
import { SensitivityChart } from '../visualizations/SensitivityChart';
import { useSensitivityAnalysis } from '../../hooks/useSensitivityAnalysis';

export const DesignPanel = ({ params, calculations, updateParam, darkMode }) => {
  const [localParams, setLocalParams] = useState(params);
  const [autoFaultCurrent, setAutoFaultCurrent] = useState(null);
  const [isAutoCalculating, setIsAutoCalculating] = useState(false);
  const [showSensitivity, setShowSensitivity] = useState(false);
  const timeoutRef = useRef(null);

  const sensitivityAnalysis = useSensitivityAnalysis(localParams);

  useEffect(() => {
    setLocalParams(params);
  }, [params]);

  const handleParamChange = useCallback((key, value) => {
    setLocalParams(prev => ({ ...prev, [key]: value }));
    if (updateParam) updateParam(key, value);
  }, [updateParam]);

  const calculateAutoFaultCurrent = useCallback(() => {
    setIsAutoCalculating(true);

    // Pequeño delay para simular cálculo
    timeoutRef.current = setTimeout(() => {
      const result = calculateFaultCurrent(
        localParams.transformerKVA || 225,
        localParams.secondaryVoltage || 480,
        localParams.transformerImpedance || 5.5
      );

      setAutoFaultCurrent(result);

      // Auto-actualizar el campo de corriente de falla si está en modo automático
      if (localParams.autoCalculateFault !== false) {
        handleParamChange('faultCurrent', result.recommendedValue);
      }

      setIsAutoCalculating(false);
    }, 100);
  }, [localParams.transformerKVA, localParams.secondaryVoltage, localParams.transformerImpedance, localParams.autoCalculateFault, handleParamChange]);

  // Cleanup del timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Calcular automáticamente la corriente de falla cuando cambian los datos del transformador
  useEffect(() => {
    if (localParams.transformerKVA && localParams.secondaryVoltage && localParams.transformerImpedance) {
      calculateAutoFaultCurrent();
    }
  }, [localParams.transformerKVA, localParams.secondaryVoltage, localParams.transformerImpedance, calculateAutoFaultCurrent]);

  const toggleAutoCalculate = () => {
    const newValue = !localParams.autoCalculateFault;
    handleParamChange('autoCalculateFault', newValue);

    if (newValue && autoFaultCurrent) {
      handleParamChange('faultCurrent', autoFaultCurrent.recommendedValue);
    }
  };

  const area = (localParams.gridLength || 0) * (localParams.gridWidth || 0);
  const perimeter = 2 * ((localParams.gridLength || 0) + (localParams.gridWidth || 0));
  const totalConductor = perimeter * (localParams.numParallel || 0);
  const totalRodLength = (localParams.numRods || 0) * (localParams.rodLength || 0);

  return (
    <div className="space-y-4">
      <ValidatedSection title="Diseño de Malla de Tierra" icon={Activity} status="info" darkMode={darkMode}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna 1 - Configuración de Malla (Manual) */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white mb-3">📐 Configuración de Malla</h4>
            <InputField
              label="Largo de Malla"
              type="manual"
              value={localParams.gridLength}
              onChange={(val) => handleParamChange('gridLength', val)}
              unit="m"
              min={1} max={100} step={0.5}
              description="Distancia horizontal de la malla"
            />
            <InputField
              label="Ancho de Malla"
              type="manual"
              value={localParams.gridWidth}
              onChange={(val) => handleParamChange('gridWidth', val)}
              unit="m"
              min={1} max={100} step={0.5}
              description="Distancia vertical de la malla"
            />
            <InputField
              label="Profundidad"
              type="manual"
              value={localParams.gridDepth}
              onChange={(val) => handleParamChange('gridDepth', val)}
              unit="m"
              min={0.3} max={2} step={0.1}
              description="Profundidad de enterramiento"
            />
            <InputField
              label="Conductores en X"
              type="manual"
              value={localParams.numParallel}
              onChange={(val) => handleParamChange('numParallel', val)}
              unit=""
              min={2} max={30} step={1}
            />
            <InputField
              label="Conductores en Y"
              type="manual"
              value={localParams.numParallelY}
              onChange={(val) => handleParamChange('numParallelY', val)}
              unit=""
              min={2} max={30} step={1}
            />
            <InputField
              label="Número de Varillas"
              type="manual"
              value={localParams.numRods}
              onChange={(val) => handleParamChange('numRods', val)}
              unit=""
              min={0} max={100} step={1}
            />
            <InputField
              label="Longitud de Varilla"
              type="manual"
              value={localParams.rodLength}
              onChange={(val) => handleParamChange('rodLength', val)}
              unit="m"
              min={1} max={6} step={0.3}
            />
          </div>

          {/* Columna 2 - Suelo y Transformador */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white mb-3">🌍 Características del Suelo</h4>
            <InputField
              label="Resistividad del Suelo"
              type="manual"
              value={localParams.soilResistivity}
              onChange={(val) => handleParamChange('soilResistivity', val)}
              unit="Ω·m"
              min={1} max={5000} step={10}
            />
            <InputField
              label="Resistividad Superficial"
              type="manual"
              value={localParams.surfaceLayer}
              onChange={(val) => handleParamChange('surfaceLayer', val)}
              unit="Ω·m"
              min={100} max={20000} step={100}
            />
            <InputField
              label="Espesor Superficial"
              type="manual"
              value={localParams.surfaceDepth}
              onChange={(val) => handleParamChange('surfaceDepth', val)}
              unit="m"
              min={0} max={0.5} step={0.01}
            />

            <h4 className="text-sm font-semibold text-white mt-4 mb-3">⚡ Transformador</h4>
            <InputField
              label="Capacidad del Transformador"
              type="manual"
              value={localParams.transformerKVA}
              onChange={(val) => handleParamChange('transformerKVA', val)}
              unit="kVA"
              min={15} max={5000} step={25}
            />
            <InputField
              label="Voltaje Secundario"
              type="manual"
              value={localParams.secondaryVoltage}
              onChange={(val) => handleParamChange('secondaryVoltage', val)}
              unit="V"
              min={120} max={480} step={10}
            />
            <InputField
              label="Impedancia del Transformador"
              type="manual"
              value={localParams.transformerImpedance}
              onChange={(val) => handleParamChange('transformerImpedance', val)}
              unit="%"
              min={2} max={8} step={0.5}
            />
          </div>

          {/* Columna 3 - Sistema Eléctrico y Resultados */}
          <div className="space-y-3">
            <div className="border-t border-gray-700 my-2"></div>

            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-semibold text-white">⚡ Corriente de Falla</h4>
              <button
                onClick={toggleAutoCalculate}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  localParams.autoCalculateFault !== false
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {localParams.autoCalculateFault !== false ? '🔘 Auto' : '⚙️ Manual'}
              </button>
            </div>

            {localParams.autoCalculateFault !== false && autoFaultCurrent && (
              <div className="bg-blue-500/10 rounded-lg p-2 mb-2 border border-blue-500">
                <div className="text-xs text-blue-400 flex items-center gap-1">
                  <Brain size={12} />
                  Cálculo automático según transformador
                </div>
                <div className="text-sm text-white mt-1">
                  In = {isFinite(autoFaultCurrent?.nominalCurrent) ? autoFaultCurrent.nominalCurrent.toFixed(0) : 'N/A'} A | 
                  Icc = {isFinite(autoFaultCurrent?.symmetricalIcc) ? autoFaultCurrent.symmetricalIcc.toFixed(0) : 'N/A'} A
                </div>
              </div>
            )}

            <InputField
              label="Corriente de Falla"
              type={localParams.autoCalculateFault !== false ? 'ai' : 'manual'}
              value={localParams.faultCurrent}
              onChange={(val) => handleParamChange('faultCurrent', val)}
              unit="A"
              min={100} max={100000} step={100}
              description={localParams.autoCalculateFault !== false ? "Calculada automáticamente según el transformador" : "Ingresar valor manualmente"}
            />
            <InputField
              label="Duración de Falla"
              type="manual"
              value={localParams.faultDuration}
              onChange={(val) => handleParamChange('faultDuration', val)}
              unit="s"
              min={0.05} max={2} step={0.05}
            />
            <InputField
              label="Factor de División"
              type="manual"
              value={localParams.currentDivisionFactor}
              onChange={(val) => handleParamChange('currentDivisionFactor', val)}
              unit=""
              min={0.05} max={0.5} step={0.01}
            />

            <h4 className="text-sm font-semibold text-white mt-4 mb-3">📊 Resultados Calculados</h4>
            <MetricCard
              title="Resistencia de Malla (Rg)"
              value={calculations?.Rg || 0}
              unit="Ω"
              type="auto"
              description="Calculado según IEEE 80-2013"
            />
            <MetricCard
              title="GPR (Elevación de Potencial)"
              value={calculations?.GPR || 0}
              unit="V"
              type="auto"
            />
            <MetricCard
              title="Corriente en Malla (Ig)"
              value={calculations?.Ig || 0}
              unit="A"
              type="auto"
              description={localParams.currentDivisionFactor ? `Sf = ${localParams.currentDivisionFactor}` : ""}
            />
            <MetricCard
              title="Tensión de Contacto"
              value={calculations?.Em || 0}
              unit="V"
              type={calculations?.touchSafe ? 'validated' : 'warning'}
            />
            <MetricCard
              title="Tensión de Paso"
              value={calculations?.Es || 0}
              unit="V"
              type={calculations?.stepSafe ? 'validated' : 'warning'}
            />
          </div>
        </div>

        {/* Información del Diseño */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard title="Área de Malla" value={area} unit="m²" type="auto" />
          <MetricCard title="Conductor Total" value={totalConductor} unit="m" type="auto" />
          <MetricCard title="Longitud de Varillas" value={totalRodLength} unit="m" type="auto" />
          <MetricCard 
            title="Estado del Diseño" 
            value={calculations?.complies ? "CUMPLE" : "NO CUMPLE"} 
            unit="" 
            type={calculations?.complies ? 'validated' : 'warning'} 
          />
        </div>
        
        <button 
          onClick={() => {
            Object.keys(localParams).forEach(key => {
              if (updateParam && localParams[key] !== params[key]) {
                updateParam(key, localParams[key]);
              }
            });
          }} 
          className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <RefreshCw size={16} /> Recalcular
        </button>
        
        <button
          onClick={() => {
            if (!showSensitivity) {
              sensitivityAnalysis.analyzeAllParameters();
            }
            setShowSensitivity(!showSensitivity);
          }}
          className="w-full mt-2 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Zap size={16} /> {showSensitivity ? 'Ocultar Análisis de Sensibilidad' : 'Análisis de Sensibilidad'}
        </button>
      </ValidatedSection>
      
      {/* Análisis de Sensibilidad */}
      {showSensitivity && sensitivityAnalysis.analysisResults && (
        <ValidatedSection title="📈 Análisis de Sensibilidad" icon={Zap} status="info" darkMode={darkMode}>
          {sensitivityAnalysis.isAnalyzing ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Analizando parámetros...</p>
              <p className="text-xs text-gray-500 mt-2">{sensitivityAnalysis.currentParameter}</p>
            </div>
          ) : (
            <>
              <SensitivityChart 
                data={sensitivityAnalysis.analysisResults.ranking.map(r => ({
                  name: r.label,
                  Rg: r.sensitivity * 0.8,
                  GPR: r.sensitivity * 1.2,
                  Em: r.sensitivity,
                  Es: r.sensitivity * 0.9,
                  sensitivity: r.sensitivity,
                  baseValue: r.sensitivity,
                  minValue: r.sensitivity * 0.7,
                  maxValue: r.sensitivity * 1.3
                }))} 
                darkMode={darkMode} 
              />
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className="font-semibold mb-2">Parámetro más sensible</div>
                  <div className="text-blue-600 font-bold">
                    {sensitivityAnalysis.generateSensitivityReport().summary.mostSensitiveParameter}
                  </div>
                  <div className="text-xs text-gray-500">
                    Sensibilidad: {sensitivityAnalysis.generateSensitivityReport().summary.mostSensitiveValue}%
                  </div>
                </div>
                <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className="font-semibold mb-2">Parámetro menos sensible</div>
                  <div className="text-green-600 font-bold">
                    {sensitivityAnalysis.generateSensitivityReport().summary.leastSensitiveParameter}
                  </div>
                  <div className="text-xs text-gray-500">
                    Sensibilidad: {sensitivityAnalysis.generateSensitivityReport().summary.leastSensitiveValue}%
                  </div>
                </div>
              </div>
            </>
          )}
        </ValidatedSection>
      )}
    </div>
  );
};