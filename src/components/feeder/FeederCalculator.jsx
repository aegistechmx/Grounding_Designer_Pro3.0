// src/components/feeders/FeederCalculator.jsx
import React, { useState, useEffect } from 'react';
import { 
  Zap, Activity, Gauge, Shield, Battery, TrendingDown, 
  Edit2, Check, Plus, Minus, Save, FileText, Download
} from 'lucide-react';
import { formatCurrent, formatVoltage, formatPercentage, formatNumber, formatCurrency } from '../../utils/formatters';

export const FeederCalculator = ({ params, darkMode }) => {
  const [editMode, setEditMode] = useState({});
  const [feederParams, setFeederParams] = useState({
    // Datos del alimentador
    watts: 100000,
    voltage: 480,
    pf: 0.9,
    distance: 68,
    phaseCount: 3,
    loadType: 'normal',
    material: 'Cobre',
    tempRating: '75°C',
    ambientTemp: 35,
    conductorsPerPhase: 1,
    continuousLoad: true,
    // Datos del transformador
    transformerKVA: 225,
    transformerImpedance: 5.5,
    // Datos del conductor
    conductorSize: '4/0',
    insulationType: 'THHW-LS'
  });
  
  const conductorSizes = ['14', '12', '10', '8', '6', '4', '3', '2', '1', '1/0', '2/0', '3/0', '4/0', '250', '300', '350', '400', '500'];
  
  const [results, setResults] = useState(null);
  
  // Cargar parámetros desde el proyecto si existen
  useEffect(() => {
    if (params) {
      setFeederParams(prev => ({
        ...prev,
        voltage: params.secondaryVoltage || prev.voltage,
        faultCurrent: params.faultCurrent || prev.faultCurrent,
        faultDuration: params.faultDuration || prev.faultDuration
      }));
    }
  }, [params]);
  
  const handleParamChange = (key, value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) || typeof value === 'string') {
      setFeederParams(prev => ({ ...prev, [key]: isNaN(numValue) ? value : numValue }));
    }
  };
  
  const toggleEditMode = (field) => {
    setEditMode(prev => ({ ...prev, [field]: !prev[field] }));
  };
  
  const calculateFeeder = () => {
    // Cálculo de corriente
    let current = 0;
    const { watts, voltage, pf, phaseCount, loadType, continuousLoad, distance, material, ambientTemp, conductorsPerPhase } = feederParams;
    
    if (phaseCount === 1) current = watts / (Math.max(1, voltage) * Math.max(0.1, pf));
    else if (phaseCount === 2) current = watts / (2 * Math.max(1, voltage) * Math.max(0.1, pf));
    else current = watts / (Math.sqrt(3) * Math.max(1, voltage) * Math.max(0.1, pf));
    
    const adjustedCurrent = current * (continuousLoad ? 1.25 : 1);
    
    // Factor de corrección por temperatura
    let tempFactor = 1.0;
    if (ambientTemp <= 30) tempFactor = 1.0;
    else if (ambientTemp <= 35) tempFactor = 0.94;
    else if (ambientTemp <= 40) tempFactor = 0.88;
    else if (ambientTemp <= 45) tempFactor = 0.82;
    else tempFactor = 0.75;
    
    const groupFactor = conductorsPerPhase > 1 ? 0.8 : 1.0;
    const requiredAmpacity = adjustedCurrent / Math.max(0.1, tempFactor * groupFactor);
    
    // Tabla de ampacidades simplificada
    const ampacityTable = {
      'Cobre': {
        '14': 25, '12': 30, '10': 40, '8': 55, '6': 75, '4': 95, '3': 110,
        '2': 130, '1': 150, '1/0': 170, '2/0': 195, '3/0': 225, '4/0': 260,
        '250': 290, '300': 320, '350': 350, '400': 380, '500': 430
      },
      'Aluminio': {
        '14': 20, '12': 25, '10': 30, '8': 40, '6': 55, '4': 70, '3': 85,
        '2': 100, '1': 115, '1/0': 135, '2/0': 155, '3/0': 180, '4/0': 205,
        '250': 230, '300': 255, '350': 280, '400': 305, '500': 350
      }
    };
    
    // Seleccionar calibre
    const table = ampacityTable[material] || ampacityTable['Cobre'];
    let selectedAWG = '4/0';
    let selectedAmpacity = 260;
    
    for (const [awg, amp] of Object.entries(table)) {
      if (amp >= requiredAmpacity) {
        selectedAWG = awg;
        selectedAmpacity = amp;
        break;
      }
    }
    
    // Caída de tensión
    const resistancePerKm = material === 'Cobre' ? 0.16 : 0.26;
    const lengthKm = distance / 1000;
    const voltageDrop = Math.sqrt(3) * adjustedCurrent * resistancePerKm * lengthKm;
    const voltageDropPercent = (voltageDrop / Math.max(1, voltage)) * 100;
    
    setResults({
      current: current,
      adjustedCurrent: adjustedCurrent,
      requiredAmpacity: requiredAmpacity,
      selectedAWG: selectedAWG,
      selectedAmpacity: selectedAmpacity,
      tempFactor: tempFactor,
      groupFactor: groupFactor,
      voltageDrop: voltageDrop,
      voltageDropPercent: voltageDropPercent,
      complies: voltageDropPercent <= 3 && selectedAmpacity >= requiredAmpacity
    });
  };
  
  const RenderInput = ({ field, label, value, unit, min, max, step, options }) => {
    const isEditing = editMode[field];
    const currentValue = value !== undefined ? value : '';
    
    return (
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs text-gray-400">{label}</label>
          <button
            onClick={() => toggleEditMode(field)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            {isEditing ? <Check size={12} className="text-green-400" /> : <Edit2 size={12} className="text-gray-500" />}
          </button>
        </div>
        
        {isEditing ? (
          options ? (
            <select
              value={currentValue}
              onChange={(e) => handleParamChange(field, e.target.value)}
              className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleParamChange(field, Math.max(0, (parseFloat(currentValue) || 0) - (step || 1)))}
                className="p-1 bg-gray-700 rounded hover:bg-gray-600"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                value={currentValue}
                onChange={(e) => handleParamChange(field, e.target.value)}
                step={step || 1}
                min={min}
                max={max}
                className="w-full p-2 bg-gray-700 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleParamChange(field, (parseFloat(currentValue) || 0) + (step || 1))}
                className="p-1 bg-gray-700 rounded hover:bg-gray-600"
              >
                <Plus size={14} />
              </button>
            </div>
          )
        ) : (
          <div 
            className="w-full p-2 bg-gray-700/50 rounded-lg text-white text-center cursor-pointer"
            onClick={() => toggleEditMode(field)}
          >
            {typeof currentValue === 'number' ? formatNumber(isNaN(currentValue) ? 0 : currentValue, 1) : currentValue || ''} {unit || ''}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap size={20} className="text-yellow-400" />
          Calculador de Alimentadores
        </h3>
        <div className="text-xs text-gray-500">
          ℹ️ Haz clic en el lápiz para editar cada campo
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de entrada */}
        <div className="rounded-xl border-2 border-blue-500 bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_15px_rgba(59,130,246,0.3)] p-4">
          <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            Datos del Alimentador
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <RenderInput field="watts" label="Potencia (W)" value={feederParams.watts} min={0} max={1000000} step={1000} />
            <RenderInput field="voltage" label="Voltaje (V)" value={feederParams.voltage} min={100} max={34500} step={10} />
            <RenderInput field="pf" label="Factor Potencia" value={feederParams.pf} min={0.5} max={1} step={0.01} />
            <RenderInput field="distance" label="Distancia (m)" value={feederParams.distance} min={0} max={1000} step={10} />
            <RenderInput 
              field="phaseCount" 
              label="Fases" 
              value={feederParams.phaseCount} 
              options={[1, 2, 3]} 
            />
            <RenderInput 
              field="loadType" 
              label="Tipo Carga" 
              value={feederParams.loadType} 
              options={['normal', 'motor', 'continua']} 
            />
            <RenderInput 
              field="material" 
              label="Material" 
              value={feederParams.material} 
              options={['Cobre', 'Aluminio']} 
            />
            <RenderInput 
              field="tempRating" 
              label="Temp. Aislamiento" 
              value={feederParams.tempRating} 
              options={['60°C', '75°C', '90°C']} 
            />
            <RenderInput 
              field="conductorSize" 
              label="Calibre Conductor" 
              value={feederParams.conductorSize} 
              options={['14', '12', '10', '8', '6', '4', '3', '2', '1', '1/0', '2/0', '3/0', '4/0', '250', '300', '350', '400', '500'].map(s => `${s} AWG`)} 
            />
            <RenderInput field="ambientTemp" label="Temp. Ambiente (°C)" value={feederParams.ambientTemp} min={20} max={60} step={1} />
            <RenderInput field="conductorsPerPhase" label="Conductores x Fase" value={feederParams.conductorsPerPhase} min={1} max={4} step={1} />
          </div>
          
          <div className="mt-4 flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={feederParams.continuousLoad}
                onChange={(e) => setFeederParams(prev => ({ ...prev, continuousLoad: e.target.checked }))}
                className="w-4 h-4"
              />
              Carga continua (125%)
            </label>
          </div>
          
          <button
            onClick={calculateFeeder}
            className="w-full mt-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Zap size={16} />
            Calcular Alimentador
          </button>
        </div>
        
        {/* Panel de resultados */}
        <div className="rounded-xl border-2 border-green-500 bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_0_15px_rgba(34,197,94,0.3)] p-4">
          <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Gauge size={16} className="text-green-400" />
            Resultados del Cálculo
          </h4>
          
          {results ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400">Corriente Calculada</div>
                  <div className="text-lg font-bold text-white">{formatCurrent(results.current, 0)}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400">Corriente Ajustada</div>
                  <div className="text-lg font-bold text-yellow-400">{formatCurrent(results.adjustedCurrent, 0)}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400">Ampacidad Requerida</div>
                  <div className="text-lg font-bold text-white">{formatCurrent(results.requiredAmpacity, 0)}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400">Calibre Seleccionado</div>
                  <div className="text-lg font-bold text-green-400">{results.selectedAWG}</div>
                </div>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Caída de Tensión</span>
                  <span className={`text-lg font-bold ${results.voltageDropPercent <= 3 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercentage(results.voltageDropPercent, 2)}
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1 mt-1">
                  <div 
                    className={`h-1 rounded-full ${results.voltageDropPercent <= 3 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(results.voltageDropPercent, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Límite NOM-001: 3%
                </div>
              </div>
              
              <div className={`rounded-lg p-2 text-center ${results.complies ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'}`}>
                <div className="text-sm font-semibold">
                  {results.complies ? '✅ Alimentador calculado correctamente' : '❌ Alimentador requiere revisión'}
                </div>
              </div>
              
              <button
                onClick={() => {
                  const report = `ALIMENTADOR CALCULADO\n\nCorriente: ${formatCurrent(results.current, 0)}\nCalibre: ${results.selectedAWG}\nCaída: ${formatPercentage(results.voltageDropPercent, 2)}\nEstado: ${results.complies ? 'CUMPLE' : 'NO CUMPLE'}`;
                  alert(report);
                }}
                className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                Ver Reporte
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Zap size={48} className="mx-auto mb-2 opacity-50" />
              <p>Ingresa los datos y haz clic en "Calcular Alimentador"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};