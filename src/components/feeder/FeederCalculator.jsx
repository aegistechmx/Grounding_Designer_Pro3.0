// src/components/feeder/FeederCalculator.jsx
import React, { useState, useMemo } from 'react';
import { Zap, TrendingDown, AlertTriangle, CheckCircle, Battery, Download, Printer } from 'lucide-react';

const FeederCalculator = ({ darkMode }) => {
  // ============================================
  // ESTADO DEL FORMULARIO
  // ============================================
  const [formData, setFormData] = useState({
    // Datos del proyecto
    projectName: 'Palmas Lote 03',
    panelName: 'IP',
    panelModel: 'QO330L200',
    
    // Datos eléctricos
    voltageLL: 220,        // Voltaje línea-línea (V)
    voltageLN: 127,        // Voltaje línea-neutro (V)
    powerFactor: 0.90,     // Factor de potencia
    phaseCount: 3,         // Número de fases
    
    // Cargas
    totalWatts: 201714.01, // Watts totales instalados
    demandFactor: 0.6501,  // Factor de demanda (65.01%)
    
    // Datos del conductor
    conductorType: 'THHW-LS',
    material: 'COPPER',
    temperature: 35,       // Temperatura ambiente (°C)
    insulationTemp: 90,    // Temperatura de aislamiento (°C)
    
    // Distancias
    feederLength: 68,      // Longitud del alimentador (m)
    
    // Factores de corrección
    hasSpareConductors: false,
    conduitType: 'PVC Pesado',
    conductorsPerPhase: 1,
    neutralReduction: 0.5   // Reducción del neutro (50%)
  });

  // ============================================
  // TABLA DE AMPACIDADES (Basada en Viakon/NOM)
  // ============================================
  const AMPACITY_TABLE = {
    COPPER: {
      '90°C': {
        '14 AWG': 25, '12 AWG': 30, '10 AWG': 40, '8 AWG': 55,
        '6 AWG': 75, '4 AWG': 95, '2 AWG': 130, '1 AWG': 145,
        '1/0 AWG': 170, '2/0 AWG': 195, '3/0 AWG': 225, '4/0 AWG': 260,
        '250 kcmil': 290, '300 kcmil': 320, '350 kcmil': 350, '400 kcmil': 380,
        '500 kcmil': 430, '600 kcmil': 475, '750 kcmil': 520, '1000 kcmil': 580
      },
      '75°C': {
        '14 AWG': 20, '12 AWG': 25, '10 AWG': 35, '8 AWG': 50,
        '6 AWG': 65, '4 AWG': 85, '2 AWG': 115, '1 AWG': 130,
        '1/0 AWG': 150, '2/0 AWG': 175, '3/0 AWG': 200, '4/0 AWG': 230,
        '250 kcmil': 255, '300 kcmil': 285, '350 kcmil': 310, '400 kcmil': 335,
        '500 kcmil': 380, '600 kcmil': 420, '750 kcmil': 460, '1000 kcmil': 510
      }
    },
    ALUMINUM: {
      '90°C': {
        '14 AWG': 20, '12 AWG': 25, '10 AWG': 35, '8 AWG': 45,
        '6 AWG': 60, '4 AWG': 75, '2 AWG': 100, '1 AWG': 115,
        '1/0 AWG': 135, '2/0 AWG': 155, '3/0 AWG': 180, '4/0 AWG': 205,
        '250 kcmil': 230, '300 kcmil': 255, '350 kcmil': 280, '400 kcmil': 305,
        '500 kcmil': 350, '600 kcmil': 385, '750 kcmil': 425, '1000 kcmil': 475
      },
      '75°C': {
        '14 AWG': 15, '12 AWG': 20, '10 AWG': 30, '8 AWG': 40,
        '6 AWG': 50, '4 AWG': 65, '2 AWG': 90, '1 AWG': 100,
        '1/0 AWG': 120, '2/0 AWG': 135, '3/0 AWG': 155, '4/0 AWG': 180,
        '250 kcmil': 205, '300 kcmil': 230, '350 kcmil': 250, '400 kcmil': 270,
        '500 kcmil': 310, '600 kcmil': 340, '750 kcmil': 380, '1000 kcmil': 420
      }
    }
  };

  // ============================================
  // TABLA DE FACTORES DE CORRECCIÓN POR TEMPERATURA
  // ============================================
  const TEMP_CORRECTION = {
    '31-35': 0.94, '36-40': 0.88, '41-45': 0.82, '46-50': 0.75,
    '51-55': 0.67, '56-60': 0.58, '61-70': 0.33
  };

  // ============================================
  // TABLA DE FACTORES POR AGRUPAMIENTO (NOM-001)
  // ============================================
  const GROUPING_FACTORS = {
    1: 1.00, 2: 0.80, 3: 0.70, 4: 0.65, 5: 0.60,
    6: 0.55, 7: 0.50, 8: 0.45, 9: 0.40, 10: 0.35
  };

  // ============================================
  // CÁLCULOS PRINCIPALES
  // ============================================
  const calculations = useMemo(() => {
    // 1. Corriente total sin factor de demanda
    const totalCurrentNoDemand = formData.totalWatts / (Math.sqrt(3) * formData.voltageLL * formData.powerFactor);
    
    // 2. Corriente con factor de demanda
    const totalCurrentWithDemand = totalCurrentNoDemand * formData.demandFactor;
    
    // 3. Corriente por fase
    const currentPerPhase = totalCurrentWithDemand / formData.phaseCount;
    
    // 4. Determinar temperatura ambiente range
    let tempRange = '31-35';
    if (formData.temperature <= 30) tempRange = '26-30';
    else if (formData.temperature <= 35) tempRange = '31-35';
    else if (formData.temperature <= 40) tempRange = '36-40';
    else if (formData.temperature <= 45) tempRange = '41-45';
    else if (formData.temperature <= 50) tempRange = '46-50';
    else if (formData.temperature <= 55) tempRange = '51-55';
    else if (formData.temperature <= 60) tempRange = '56-60';
    else tempRange = '61-70';
    
    const tempFactor = TEMP_CORRECTION[tempRange] || 1.0;
    const groupingFactor = GROUPING_FACTORS[formData.conductorsPerPhase] || 0.7;
    
    // 5. Calcular ampacidad requerida
    const requiredAmpacity = totalCurrentWithDemand / (tempFactor * groupingFactor * formData.conductorsPerPhase);
    
    // 6. Seleccionar calibre
    const tempKey = `${formData.insulationTemp}°C`;
    const ampacityTable = AMPACITY_TABLE[formData.material][tempKey];
    
    let selectedGauge = null;
    let selectedAmpacity = 0;
    
    // ✅ Priorizar 4/0 AWG si cumple con los requisitos
    const fourZeroAmpacity = ampacityTable['4/0 AWG'];
    if (fourZeroAmpacity && fourZeroAmpacity >= requiredAmpacity) {
      selectedGauge = '4/0 AWG';
      selectedAmpacity = fourZeroAmpacity;
    } else {
      // Si no, buscar el primero que cumpla
      for (const [gauge, amp] of Object.entries(ampacityTable)) {
        if (amp >= requiredAmpacity) {
          selectedGauge = gauge;
          selectedAmpacity = amp;
          break;
        }
      }
    }
    
    // 7. Calcular caída de tensión
    // Resistencia del conductor (Ω/km) - valores aproximados
    const resistanceTable = {
      '4/0 AWG': 0.160, '250 kcmil': 0.136, '300 kcmil': 0.113,
      '350 kcmil': 0.097, '400 kcmil': 0.085, '500 kcmil': 0.068,
      '600 kcmil': 0.057, '750 kcmil': 0.045, '1000 kcmil': 0.034
    };
    
    const resistance = resistanceTable[selectedGauge] || 0.1;
    const voltageDrop3Phase = (1.732 * totalCurrentWithDemand * resistance * formData.feederLength) / 1000;
    const voltageDropPercent = (voltageDrop3Phase / formData.voltageLL) * 100;
    
    // 8. Calcular neutro
    const neutralCurrent = totalCurrentWithDemand * formData.neutralReduction;
    let neutralGauge = selectedGauge;
    let neutralAmpacity = selectedAmpacity;
    
    if (neutralCurrent < selectedAmpacity * 0.5) {
      // Reducir calibre del neutro
      const gauges = Object.keys(ampacityTable);
      const currentIndex = gauges.indexOf(selectedGauge);
      if (currentIndex > 2) {
        neutralGauge = gauges[currentIndex - 2];
        neutralAmpacity = ampacityTable[neutralGauge];
      }
    }
    
    // 9. Calcular tierra (NOM-001, 250-95)
    let groundGauge = '8 AWG';
    if (selectedAmpacity <= 60) groundGauge = '10 AWG';
    else if (selectedAmpacity <= 100) groundGauge = '8 AWG';
    else if (selectedAmpacity <= 200) groundGauge = '6 AWG';
    else if (selectedAmpacity <= 400) groundGauge = '4 AWG';
    else if (selectedAmpacity <= 600) groundGauge = '2 AWG';
    else if (selectedAmpacity <= 800) groundGauge = '1/0 AWG';
    else groundGauge = '2/0 AWG';
    
    // 10. Calcular conduit size
    const conduitSizes = {
      'PVC Pesado': { '2/0 AWG': 41, '3/0 AWG': 41, '4/0 AWG': 53, '250 kcmil': 53, '300 kcmil': 63, '350 kcmil': 63, '400 kcmil': 78, '500 kcmil': 78, '600 kcmil': 91, '750 kcmil': 103, '1000 kcmil': 129 }
    };
    
    const conduitSize = conduitSizes[formData.conduitType]?.[selectedGauge] || 78;
    
    return {
      totalCurrentNoDemand: totalCurrentNoDemand.toFixed(2),
      totalCurrentWithDemand: totalCurrentWithDemand.toFixed(2),
      currentPerPhase: currentPerPhase.toFixed(2),
      requiredAmpacity: requiredAmpacity.toFixed(2),
      selectedGauge,
      selectedAmpacity,
      voltageDrop: voltageDrop3Phase.toFixed(2),
      voltageDropPercent: voltageDropPercent.toFixed(2),
      complies: voltageDropPercent <= 3,
      neutralGauge,
      neutralAmpacity,
      neutralCurrent: neutralCurrent.toFixed(2),
      groundGauge,
      conduitSize,
      tempFactor,
      groupingFactor,
      tempRange
    };
  }, [formData]);

  // ============================================
  // ACTUALIZAR FORMULARIO
  // ============================================
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ============================================
  // EXPORTAR A CSV
  // ============================================
  const exportToCSV = () => {
    const headers = ['Parámetro', 'Valor', 'Unidad'];
    const rows = [
      ['Proyecto', formData.projectName, ''],
      ['Tablero', formData.panelName, ''],
      ['Modelo', formData.panelModel, ''],
      ['Voltaje L-L', formData.voltageLL, 'V'],
      ['Voltaje L-N', formData.voltageLN, 'V'],
      ['Factor de Potencia', formData.powerFactor, ''],
      ['Watts Totales', formData.totalWatts.toLocaleString(), 'W'],
      ['Factor de Demanda', formData.demandFactor * 100, '%'],
      ['Corriente Total (con FD)', calculations.totalCurrentWithDemand, 'A'],
      ['Calibre Seleccionado', calculations.selectedGauge, ''],
      ['Ampacidad', calculations.selectedAmpacity, 'A'],
      ['Caída de Tensión', calculations.voltageDrop, 'V'],
      ['Caída de Tensión %', calculations.voltageDropPercent, '%'],
      ['Calibre Neutro', calculations.neutralGauge, ''],
      ['Calibre Tierra', calculations.groundGauge, ''],
      ['Tamaño Conduit', calculations.conduitSize, 'mm']
    ];
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alimentador_${formData.projectName}_${new Date().toISOString().slice(0,19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================
  // ESTILOS
  // ============================================
  const colors = darkMode ? {
    bg: 'bg-gray-800',
    card: 'bg-gray-700',
    text: 'text-white',
    textSecondary: 'text-gray-300',
    border: 'border-gray-600',
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400'
  } : {
    bg: 'bg-white',
    card: 'bg-gray-50',
    text: 'text-gray-800',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200',
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600'
  };

  return (
    <div className={`p-4 rounded-lg ${colors.bg} shadow-md`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${colors.text} flex items-center gap-2`}>
          <Zap size={20} /> Calculador de Alimentadores Principales
        </h3>
        <button
          onClick={exportToCSV}
          className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm flex items-center gap-1 hover:bg-blue-700"
        >
          <Download size={14} /> Exportar
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel izquierdo - Datos de entrada */}
        <div className={`p-4 rounded-lg ${colors.card} border ${colors.border}`}>
          <h4 className={`font-semibold ${colors.text} mb-3`}>📋 Datos del Proyecto</h4>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className={`block text-xs ${colors.textSecondary} mb-1`}>Proyecto</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => updateField('projectName', e.target.value)}
                className={`w-full p-2 border rounded text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block text-xs ${colors.textSecondary} mb-1`}>Tablero</label>
              <input
                type="text"
                value={formData.panelName}
                onChange={(e) => updateField('panelName', e.target.value)}
                className={`w-full p-2 border rounded text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
          </div>
          
          <h4 className={`font-semibold ${colors.text} mb-3 mt-4`}>⚡ Datos Eléctricos</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs ${colors.textSecondary} mb-1`}>Voltaje L-L (V)</label>
              <input
                type="number"
                value={formData.voltageLL}
                onChange={(e) => updateField('voltageLL', parseFloat(e.target.value))}
                className={`w-full p-2 border rounded text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block text-xs ${colors.textSecondary} mb-1`}>Voltaje L-N (V)</label>
              <input
                type="number"
                value={formData.voltageLN}
                onChange={(e) => updateField('voltageLN', parseFloat(e.target.value))}
                className={`w-full p-2 border rounded text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block text-xs ${colors.textSecondary} mb-1`}>Factor de Potencia</label>
              <input
                type="number"
                step="0.01"
                value={formData.powerFactor}
                onChange={(e) => updateField('powerFactor', parseFloat(e.target.value))}
                className={`w-full p-2 border rounded text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block text-xs ${colors.textSecondary} mb-1`}>Watts Totales</label>
              <input
                type="number"
                value={formData.totalWatts}
                onChange={(e) => updateField('totalWatts', parseFloat(e.target.value))}
                className={`w-full p-2 border rounded text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block text-xs ${colors.textSecondary} mb-1`}>Factor de Demanda</label>
              <input
                type="number"
                step="0.01"
                value={formData.demandFactor}
                onChange={(e) => updateField('demandFactor', parseFloat(e.target.value))}
                className={`w-full p-2 border rounded text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block text-xs ${colors.textSecondary} mb-1`}>Longitud (m)</label>
              <input
                type="number"
                value={formData.feederLength}
                onChange={(e) => updateField('feederLength', parseFloat(e.target.value))}
                className={`w-full p-2 border rounded text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
          </div>
          
          <h4 className={`font-semibold ${colors.text} mb-3 mt-4`}>🔌 Datos del Conductor</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs ${colors.textSecondary} mb-1`}>Tipo de Cable</label>
              <select
                value={formData.conductorType}
                onChange={(e) => updateField('conductorType', e.target.value)}
                className={`w-full p-2 border rounded text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
              >
                <option>THHW-LS</option>
                <option>THWN-2</option>
                <option>XHHW-2</option>
                <option>USE-2</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs ${colors.textSecondary} mb-1`}>Material</label>
              <select
                value={formData.material}
                onChange={(e) => updateField('material', e.target.value)}
                className={`w-full p-2 border rounded text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
              >
                <option>COPPER</option>
                <option>ALUMINUM</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs ${colors.textSecondary} mb-1`}>Temp. Ambiente (°C)</label>
              <input
                type="number"
                value={formData.temperature}
                onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
                className={`w-full p-2 border rounded text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block text-xs ${colors.textSecondary} mb-1`}>Conductores por Fase</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.conductorsPerPhase}
                onChange={(e) => updateField('conductorsPerPhase', parseInt(e.target.value))}
                className={`w-full p-2 border rounded text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
          </div>
        </div>
        
        {/* Panel derecho - Resultados */}
        <div className={`p-4 rounded-lg ${colors.card} border ${colors.border}`}>
          <h4 className={`font-semibold ${colors.text} mb-3`}>📊 Resultados del Cálculo</h4>
          
          {/* Corrientes */}
          <div className="space-y-3">
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm">Corriente Total (sin FD)</span>
                <span className="text-xl font-bold">{calculations.totalCurrentNoDemand} A</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm">Corriente Total (con FD)</span>
                <span className="text-xl font-bold text-blue-600">{calculations.totalCurrentWithDemand} A</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm">Corriente por Fase</span>
                <span className="text-lg font-semibold">{calculations.currentPerPhase} A</span>
              </div>
            </div>
            
            {/* Conductor seleccionado */}
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm">Calibre Seleccionado</span>
                <span className="text-xl font-bold text-green-600">{calculations.selectedGauge || 'No encontrado'}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm">Ampacidad Base</span>
                <span className="font-semibold">{calculations.selectedAmpacity} A</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs">Factores aplicados:</span>
                <span className="text-xs">Temp: {calculations.tempFactor} | Agrup: {calculations.groupingFactor}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs">Ampacidad Requerida:</span>
                <span className="text-xs font-semibold">{calculations.requiredAmpacity} A</span>
              </div>
            </div>
            
            {/* Caída de tensión */}
            <div className={`p-3 rounded-lg ${calculations.complies ? (darkMode ? 'bg-green-900/30' : 'bg-green-50') : (darkMode ? 'bg-red-900/30' : 'bg-red-50')}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm">Caída de Tensión</span>
                <span className="text-xl font-bold">{calculations.voltageDrop} V</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm">Porcentaje</span>
                <span className={`font-semibold ${calculations.complies ? 'text-green-600' : 'text-red-600'}`}>
                  {calculations.voltageDropPercent}%
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs">Límite NOM-001:</span>
                <span className="text-xs">3% (alimentadores)</span>
              </div>
              {calculations.complies ? (
                <div className="mt-2 text-xs text-green-600">✅ Caída de tensión dentro del límite permitido</div>
              ) : (
                <div className="mt-2 text-xs text-red-600">⚠️ Caída de tensión excede el 3% - Aumentar calibre</div>
              )}
            </div>
            
            {/* Neutro y Tierra */}
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                <div className="text-xs text-gray-500">Conductor Neutro</div>
                <div className="font-bold">{calculations.neutralGauge}</div>
                <div className="text-xs">Corriente: {calculations.neutralCurrent} A</div>
              </div>
              <div className={`p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                <div className="text-xs text-gray-500">Conductor Tierra</div>
                <div className="font-bold">{calculations.groundGauge}</div>
                <div className="text-xs">Según NOM-001-2012</div>
              </div>
            </div>
            
            {/* Conduit */}
            <div className={`p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm">Tamaño de Conduit</span>
                <span className="font-bold">{calculations.conduitSize} mm ({calculations.conduitSize <= 53 ? '2"' : calculations.conduitSize <= 78 ? '3"' : '4"'})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabla resumen de calibres y ampacidades */}
      <div className={`mt-6 p-4 rounded-lg ${colors.card} border ${colors.border}`}>
        <h4 className={`font-semibold ${colors.text} mb-3`}>📋 Resumen de Selección</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={darkMode ? 'bg-gray-600' : 'bg-gray-100'}>
              <tr>
                <th className="p-2 text-left">Conductor</th>
                <th className="p-2 text-left">Calibre</th>
                <th className="p-2 text-left">Cantidad</th>
                <th className="p-2 text-left">Área (mm²)</th>
                <th className="p-2 text-left">Ampacidad (A)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-2">Fase</td>
                <td className="p-2 font-bold">{calculations.selectedGauge || 'N/A'}</td>
                <td className="p-2">{formData.conductorsPerPhase}</td>
                <td className="p-2">-</td>
                <td className="p-2">{calculations.selectedAmpacity * formData.conductorsPerPhase} A</td>
              </tr>
              <tr className="border-t">
                <td className="p-2">Neutro</td>
                <td className="p-2">{calculations.neutralGauge}</td>
                <td className="p-2">1</td>
                <td className="p-2">-</td>
                <td className="p-2">{calculations.neutralAmpacity} A</td>
              </tr>
              <tr className="border-t">
                <td className="p-2">Tierra</td>
                <td className="p-2">{calculations.groundGauge}</td>
                <td className="p-2">1</td>
                <td className="p-2">-</td>
                <td className="p-2">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Notas y recomendaciones */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            <strong>📌 Base normativa:</strong> NOM-001-SEDE-2012, Tablas 310-15(g), 310-16, 250-95.
            Los factores de corrección por temperatura y agrupamiento están basados en la NOM-001.
          </span>
        </p>
      </div>
    </div>
  );
};

export default FeederCalculator;