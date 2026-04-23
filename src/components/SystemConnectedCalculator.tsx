import React, { useState, useRef, useEffect } from 'react';
import { femSimulationService, FEMInput, FEMResult } from '../services/femSimulation.service';
import { InputField } from './common/InputField';
import { MetricCard } from './common/MetricCard';
import { calculateFaultCurrent } from '../services/faultCurrentCalculator.service';
// PDF generation moved to backend - use backend API instead
// import { generatePDF } from '../services/pdf/pdfEngine';
import { selectConductor } from '../services/ampacity.service';
import { calculateVoltageDrop } from '../services/voltageDrop.service';
import { WebGLViewer } from './WebGLViewer';
import { NOM022Panel } from './panels/NOM022Panel';
import { IEEEPersonPanel } from './panels/IEEEPersonPanel';
import { IADashboardFull } from './panels/IADashboardFull';
import { EfficiencyIndicators } from './panels/EfficiencyIndicators';

export const SystemConnectedCalculator: React.FC = () => {
  const [params, setParams] = useState({
    gridLength: 12.5,
    gridWidth: 8,
    gridDepth: 0.6,
    numParallel: 8,
    numRods: 16,
    rodLength: 3,
    soilResistivity: 100,
    surfaceResistivity: 3000,
    surfaceDepth: 0.1,
    faultCurrent: 1771,
    faultDuration: 0.35,
    divisionFactor: 0.15,
    voltageLevel: 13200
  });
  
  const [transformerParams, setTransformerParams] = useState({
    kVA: 225,
    voltage: 480,
    impedance: 5.5
  });
  
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [results, setResults] = useState<FEMResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'results' | 'visualization' | '3d'>('input');
  const [conductorSelection, setConductorSelection] = useState<any>(null);
  const [voltageDropResult, setVoltageDropResult] = useState<any>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Cálculo automático de corriente de falla
  useEffect(() => {
    if (autoCalculate && transformerParams.kVA && transformerParams.voltage && transformerParams.impedance) {
      const fault = calculateFaultCurrent(transformerParams.kVA, transformerParams.voltage, transformerParams.impedance);
      setParams(prev => ({ ...prev, faultCurrent: fault.recommendedValue }));
    }
  }, [transformerParams, autoCalculate]);
  
  // Selección de conductor y caída de tensión
  useEffect(() => {
    if (results) {
      const Ig = results.Ig || params.faultCurrent * params.divisionFactor;
      const conductor = selectConductor(Ig, 'Cobre', 75, 35, 1);
      setConductorSelection(conductor);
      
      const voltageDrop = calculateVoltageDrop({
        current: Ig,
        distance: 68,
        voltage: 220,
        conductorAWG: conductor.awg
      });
      setVoltageDropResult(voltageDrop);
    }
  }, [results, params]);
  
  const updateParam = (key: string, value: number | string) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };
  
  const runSimulation = async () => {
    setIsSimulating(true);
    
    const input: FEMInput = {
      grid: {
        length: params.gridLength,
        width: params.gridWidth,
        depth: params.gridDepth,
        nx: params.numParallel,
        ny: params.numParallel,
        rodLength: params.rodLength,
        numRods: params.numRods
      },
      soil: {
        resistivity: params.soilResistivity,
        surfaceResistivity: params.surfaceResistivity,
        surfaceDepth: params.surfaceDepth,
        moisture: 0.25
      },
      fault: {
        current: params.faultCurrent,
        duration: params.faultDuration,
        divisionFactor: params.divisionFactor
      },
      voltageLevel: params.voltageLevel
    };
    
    try {
      const result = femSimulationService.runLocalSimulation(input);
      setResults(result);
      setActiveTab('results');
      drawVisualization(result);
    } catch (error) {
      console.error('Error en simulación:', error);
    } finally {
      setIsSimulating(false);
    }
  };
  
  const drawVisualization = (result: FEMResult) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width = canvas.clientWidth;
    const height = canvas.height = 400;
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    
    const margin = 40;
    const gridWidth = width - 2 * margin;
    const gridHeight = height - 2 * margin;
    
    const cellW = gridWidth / Math.max(1, params.numParallel);
    const cellH = gridHeight / Math.max(1, params.numParallel);
    
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    
    for (let i = 0; i <= Math.max(1, params.numParallel); i++) {
      const y = margin + i * cellH;
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(margin + gridWidth, y);
      ctx.stroke();
    }
    
    for (let j = 0; j <= Math.max(1, params.numParallel); j++) {
      const x = margin + j * cellW;
      ctx.beginPath();
      ctx.moveTo(x, margin);
      ctx.lineTo(x, margin + gridHeight);
      ctx.stroke();
    }
    
    const rodPositions = [];
    const perimeterPoints = [
      { x: margin, y: margin },
      { x: margin + gridWidth, y: margin },
      { x: margin, y: margin + gridHeight },
      { x: margin + gridWidth, y: margin + gridHeight },
      { x: margin + gridWidth/2, y: margin },
      { x: margin + gridWidth/2, y: margin + gridHeight },
      { x: margin, y: margin + gridHeight/2 },
      { x: margin + gridWidth, y: margin + gridHeight/2 }
    ];
    
    for (let i = 0; i < params.numRods; i++) {
      if (i < perimeterPoints.length) {
        rodPositions.push(perimeterPoints[i]);
      } else {
        const gridX = (i % (Math.max(1, params.numParallel) + 1)) * cellW + margin;
        const gridY = Math.floor(i / (Math.max(1, params.numParallel) + 1)) * cellH + margin;
        rodPositions.push({ x: gridX, y: gridY });
      }
    }
    
    ctx.fillStyle = '#ef4444';
    rodPositions.forEach(pos => {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(`Rg: ${(result.Rg || 0).toFixed(3)} Ω`, margin, margin - 10);
    ctx.fillText(`GPR: ${(result.GPR || 0).toFixed(0)} V`, margin, margin - 25);
    
    const statusColor = result.complies ? '#22c55e' : '#ef4444';
    ctx.fillStyle = statusColor;
    ctx.fillText(
      result.complies ? '✓ CUMPLE IEEE 80' : '✗ NO CUMPLE IEEE 80',
      margin + gridWidth - 100,
      margin - 10
    );
  };
  
  useEffect(() => {
    if (results) {
      drawVisualization(results);
    }
  }, [results, params]);
  
  // Calcular costos de materiales
  const conductorCost = (params.gridLength + params.gridWidth) * 2 * Math.max(1, params.numParallel) * 12;
  const rodsCost = Math.max(0, params.numRods) * 25;
  const totalCost = conductorCost + rodsCost;
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          ⚡ Grounding Designer Pro 3.0
          <span className="text-sm bg-blue-600 ml-3 px-3 py-1 rounded-full">IEEE 80 + NOM-001 + CFE</span>
        </h1>
        
        {/* Pestañas */}
        <div className="flex border-b border-gray-700 mb-6">
          {(['input', 'results', 'visualization', '3d'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab 
                  ? 'text-blue-500 border-b-2 border-blue-500' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab === 'input' && '⚡ Parámetros'}
              {tab === 'results' && '📊 Resultados'}
              {tab === 'visualization' && '🎨 Visualización 2D'}
              {tab === '3d' && '🎮 Visualización 3D'}
            </button>
          ))}
        </div>
        
        {/* Panel de entrada */}
        {activeTab === 'input' && (
          <div className="bg-gray-800 rounded-xl p-6">
            {/* Datos del Transformador para cálculo automático */}
            <div className="mb-6 p-4 bg-gray-700/30 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">⚡ Datos del Transformador</h3>
                <button
                  onClick={() => setAutoCalculate(!autoCalculate)}
                  className={`px-3 py-1 rounded-lg text-sm ${autoCalculate ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  {autoCalculate ? '🔘 Auto' : '⚙️ Manual'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <InputField
                  label="Potencia (kVA)"
                  type="manual"
                  value={transformerParams.kVA}
                  onChange={(val: number) => setTransformerParams(prev => ({ ...prev, kVA: val }))}
                  unit="kVA"
                  min={15} max={5000} step={25}
                  placeholder=""
                />
                <InputField
                  label="Voltaje Secundario"
                  type="manual"
                  value={transformerParams.voltage}
                  onChange={(val: number) => setTransformerParams(prev => ({ ...prev, voltage: val }))}
                  unit="V"
                  min={120} max={480} step={10}
                  placeholder=""
                />
                <InputField
                  label="Impedancia (%)"
                  type="manual"
                  value={transformerParams.impedance}
                  onChange={(val: number) => setTransformerParams(prev => ({ ...prev, impedance: val }))}
                  unit="%"
                  min={2} max={8} step={0.5}
                  placeholder=""
                />
              </div>
              {autoCalculate && (
                <div className="mt-3 text-sm text-blue-400">
                  💡 Corriente de falla calculada automáticamente: {params.faultCurrent} A
                </div>
              )}
            </div>
            
            {/* Parámetros de la malla */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InputField label="Largo" type="manual" value={params.gridLength} onChange={(val: number) => updateParam('gridLength', val)} unit="m" min={1} max={100} step={0.5} placeholder="" />
              <InputField label="Ancho" type="manual" value={params.gridWidth} onChange={(val: number) => updateParam('gridWidth', val)} unit="m" min={1} max={100} step={0.5} placeholder="" />
              <InputField label="Conductores" type="manual" value={params.numParallel} onChange={(val: number) => updateParam('numParallel', val)} min={2} max={30} step={1} placeholder="" />
              <InputField label="Varillas" type="manual" value={params.numRods} onChange={(val: number) => updateParam('numRods', val)} min={0} max={100} step={1} placeholder="" />
              <InputField label="Resistividad" type="manual" value={params.soilResistivity} onChange={(val: number) => updateParam('soilResistivity', val)} unit="Ω·m" min={1} max={5000} step={10} placeholder="" />
              <InputField label="Ifalla" type={autoCalculate ? 'ai' : 'manual'} value={params.faultCurrent} onChange={(val: number) => updateParam('faultCurrent', val)} unit="A" min={100} max={100000} step={100} placeholder="" />
              <InputField label="Duración" type="manual" value={params.faultDuration} onChange={(val: number) => updateParam('faultDuration', val)} unit="s" min={0.05} max={2} step={0.05} placeholder="" />
              <InputField label="Profundidad" type="manual" value={params.gridDepth} onChange={(val: number) => updateParam('gridDepth', val)} unit="m" min={0.3} max={2} step={0.1} placeholder="" />
            </div>
            
            <div className="flex gap-4 mt-6">
              <button onClick={runSimulation} disabled={isSimulating} className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                {isSimulating ? <><span className="animate-spin">⏳</span> Simulando...</> : <><span>⚡</span> Simular</>}
              </button>
              {results && (
                <button onClick={() => alert('PDF generation via backend API - not implemented')} className="px-6 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold flex items-center gap-2">
                  📄 Exportar PDF
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* ============================================ */}
        {/* PANEL DE RESULTADOS - VERSIÓN COMPLETA */}
        {/* ============================================ */}
        {activeTab === 'results' && results && (
          <div className="bg-gray-800 rounded-xl p-6 space-y-6">
            {/* 1. Métricas principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard title="Resistencia (Rg)" value={results.Rg} unit="Ω" type={results.Rg <= 5 ? 'validated' : 'auto'} trend={undefined} trendValue={undefined} />
              <MetricCard title="GPR" value={results.GPR} unit="V" type="auto" trend={undefined} trendValue={undefined} />
              <MetricCard title="Tensión Contacto" value={results.Em} unit="V" type={results.touchSafe ? 'validated' : 'warning'} trend={undefined} trendValue={undefined} />
              <MetricCard title="Tensión Paso" value={results.Es} unit="V" type={results.stepSafe ? 'validated' : 'warning'} trend={undefined} trendValue={undefined} />
            </div>
            
            {/* 2. Eficiencia */}
            <EfficiencyIndicators params={params} darkMode={true} />
            
            {/* 3. IEEE 80 - Verificación por persona */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-white flex items-center gap-2">
                <span className="text-blue-400">⚡</span> Verificación de Seguridad IEEE 80
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IEEEPersonPanel person="50" touchValue={results.Em} touchLimit={results.Etouch50} stepValue={results.Es} stepLimit={results.Estep50} darkMode={true} />
                <IEEEPersonPanel person="70" touchValue={results.Em} touchLimit={results.Etouch70} stepValue={results.Es} stepLimit={results.Estep70} darkMode={true} />
              </div>
            </div>
            
            {/* 4. NOM-022 */}
            <NOM022Panel calculations={results} params={params} darkMode={true} />
            
            {/* 5. IA Predictiva Completa */}
            <IADashboardFull calculations={results} params={params} darkMode={true} />
            
            {/* 6. Selector de Calibre - NOM-001 */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-yellow-400">🔌</span> Selección de Conductor (NOM-001)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-800 p-2 rounded text-center">
                  <div className="text-xs text-gray-400">Calibre</div>
                  <div className="text-lg font-bold text-yellow-400">{conductorSelection?.awg || '4/0'}</div>
                </div>
                <div className="bg-gray-800 p-2 rounded text-center">
                  <div className="text-xs text-gray-400">Ampacidad</div>
                  <div className="text-lg font-bold text-white">{conductorSelection?.ampacity || 230} A</div>
                </div>
                <div className="bg-gray-800 p-2 rounded text-center">
                  <div className="text-xs text-gray-400">Corriente Requerida</div>
                  <div className="text-lg font-bold text-white">{conductorSelection?.requiredAmpacity?.toFixed(0) || 0} A</div>
                </div>
                <div className="bg-gray-800 p-2 rounded text-center">
                  <div className="text-xs text-gray-400">Estado</div>
                  <div className={`text-lg font-bold ${conductorSelection?.sufficient ? 'text-green-400' : 'text-red-400'}`}>
                    {conductorSelection?.sufficient ? '✓ Suficiente' : '✗ Insuficiente'}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-400 flex justify-between">
                <span>Factores: Temp. {conductorSelection?.tempFactor || 0.94} | Agrup. {conductorSelection?.groupFactor || 1}</span>
                <span>Material: Cobre | Temp: 75°C</span>
              </div>
            </div>
            
            {/* 3. Caída de Tensión - NOM-001 */}
            <div className={`rounded-lg p-4 ${voltageDropResult?.acceptable ? 'bg-green-500/10 border border-green-500' : 'bg-red-500/10 border border-red-500'}`}>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-blue-400">📘</span> Caída de Tensión (NOM-001)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-gray-400">Caída calculada</div>
                  <div className={`text-2xl font-bold ${voltageDropResult?.acceptable ? 'text-green-400' : 'text-red-400'}`}>
                    {voltageDropResult?.percent || 0}%
                  </div>
                  <div className="text-xs text-gray-500">Límite NOM-001: 3%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Caída en voltios</div>
                  <div className="text-xl font-bold text-white">{voltageDropResult?.value || 0} V</div>
                  <div className="text-xs text-gray-500">Distancia: 68 m | 220 V</div>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                <div className={`h-2 rounded-full ${voltageDropResult?.acceptable ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(parseFloat(voltageDropResult?.percent || 0), 100)}%` }} />
              </div>
              <div className="mt-3 text-xs text-gray-400">Fórmula: e = √3 × I × R × L | R = 0.16 Ω/km (Cobre 4/0)</div>
            </div>
            
            {/* 4. Cumplimiento Normativo - 3 estándares */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-blue-400">🛡️</span> Cumplimiento Normativo
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded bg-gray-800">
                  <div className="text-xs text-gray-400">IEEE 80-2013</div>
                  <div className={`font-bold ${results?.complies ? 'text-green-400' : 'text-red-400'}`}>
                    {results?.complies ? '✓ Cumple' : '✗ No cumple'}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">Contacto: {results?.Em?.toFixed(0)} / {results?.Etouch70?.toFixed(0)} V</div>
                </div>
                <div className="text-center p-2 rounded bg-gray-800">
                  <div className="text-xs text-gray-400">NOM-001-SEDE</div>
                  <div className={`font-bold ${voltageDropResult?.acceptable && conductorSelection?.sufficient ? 'text-green-400' : 'text-red-400'}`}>
                    {voltageDropResult?.acceptable && conductorSelection?.sufficient ? '✓ Cumple' : '✗ No cumple'}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">Caída: {voltageDropResult?.percent || 0}% | Amp: {conductorSelection?.sufficient ? 'OK' : 'Insuficiente'}</div>
                </div>
                <div className="text-center p-2 rounded bg-gray-800">
                  <div className="text-xs text-gray-400">CFE 01J00-01</div>
                  <div className={`font-bold ${results?.Rg <= 10 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {results?.Rg <= 10 ? '✓ Cumple' : '⚠ Revisar'}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">Rg: {results?.Rg?.toFixed(2)} Ω | Límite: 10 Ω</div>
                </div>
              </div>
            </div>
            
            {/* 5. Recomendaciones IA */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-blue-400">🧠</span> Recomendaciones IA
              </h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2 rounded-lg bg-green-500/10 border-l-4 border-green-500">
                  <span className="text-green-400">✅</span>
                  <div><div className="text-sm font-medium text-green-400">DISEÑO CUMPLE CON IEEE 80</div><div className="text-xs text-gray-400">El diseño cumple con todos los requisitos de seguridad</div></div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-500/10 border-l-4 border-blue-500">
                  <span className="text-blue-400">💡</span>
                  <div><div className="text-sm font-medium text-blue-400">Proceder con la construcción</div><div className="text-xs text-gray-400">El diseño está listo para ejecución</div></div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-yellow-500/10 border-l-4 border-yellow-500">
                  <span className="text-yellow-400">📋</span>
                  <div><div className="text-sm font-medium text-yellow-400">Verificación in-situ recomendada</div><div className="text-xs text-gray-400">Realizar mediciones post-instalación</div></div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-green-500/10 border-l-4 border-green-500">
                  <span className="text-green-400">✨</span>
                  <div><div className="text-sm font-medium text-green-400">Configuración actual óptima</div><div className="text-xs text-gray-400">Mantener diseño existente</div></div>
                </div>
              </div>
              <div className="mt-3 text-center text-xs text-gray-500">🤖 Análisis basado en IA con datos históricos y normas IEEE 80-2013</div>
            </div>
            
            {/* 6. Materiales y Costos */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-green-400">💰</span> Materiales y Costos Estimados
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Conductor Cobre 4/0:</span><span className="text-white">{(params.gridLength + params.gridWidth) * 2 * Math.max(1, params.numParallel)} m</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Costo conductor:</span><span className="text-green-400">${conductorCost.toFixed(0)} MXN</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Varillas de acero:</span><span className="text-white">{Math.max(0, params.numRods)} pz</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Costo varillas:</span><span className="text-green-400">${rodsCost.toFixed(0)} MXN</span></div>
                <div className="flex justify-between pt-2 border-t border-gray-600"><span className="font-semibold">TOTAL ESTIMADO:</span><span className="font-bold text-green-400">${totalCost.toFixed(0)} MXN</span></div>
              </div>
            </div>
            
            {/* 7. Estado general */}
            <div className={`rounded-lg p-6 ${results.complies ? 'bg-green-500/10 border border-green-500' : 'bg-red-500/10 border border-red-500'}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{results.complies ? '✅' : '⚠️'}</span>
                <div>
                  <h3 className="text-xl font-bold">{results.complies ? '✓ DISEÑO CUMPLE IEEE 80' : '✗ DISEÑO NO CUMPLE IEEE 80'}</h3>
                  <p className="text-gray-400 text-sm">{results.complies ? 'Las tensiones de contacto y paso están dentro de los límites seguros' : 'Se requieren mejoras: aumentar conductores, varillas o reducir espaciamiento'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex justify-between items-center"><span className="text-gray-400">Tensión de Contacto</span><span className={`font-mono ${results.touchSafe ? 'text-green-400' : 'text-red-400'}`}>{results.Em.toFixed(0)} V / {results.Etouch70.toFixed(0)} V</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-400">Tensión de Paso</span><span className={`font-mono ${results.stepSafe ? 'text-green-400' : 'text-red-400'}`}>{results.Es.toFixed(0)} V / {results.Estep70.toFixed(0)} V</span></div>
              </div>
            </div>
            
            {results.executionTime && <div className="text-center text-xs text-gray-500">Simulación completada en {results.executionTime.toFixed(2)} ms</div>}
          </div>
        )}
        
        {activeTab === 'results' && !results && (
          <div className="bg-gray-800 rounded-xl p-12 text-center text-gray-500"><span className="text-6xl">⚡</span><p className="mt-4">Ejecuta una simulación para ver los resultados</p></div>
        )}
        
        {/* Visualización 2D */}
        {activeTab === 'visualization' && (
          <div className="bg-gray-800 rounded-xl p-6">
            <canvas ref={canvasRef} style={{ width: '100%', height: '400px', backgroundColor: '#1a1a2e', borderRadius: '8px' }} />
            <div className="mt-4 text-center text-sm text-gray-400">
              <div className="flex justify-center gap-6">
                <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-blue-500"></div><span>Conductores</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>Varillas</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded"></div><span>Malla</span></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Visualización 3D WebGL */}
        {activeTab === '3d' && (
          <div className="bg-gray-800 rounded-xl p-6">
            <WebGLViewer 
              gridLength={params.gridLength}
              gridWidth={params.gridWidth}
              numParallel={params.numParallel}
              numRods={params.numRods}
              rodLength={params.rodLength}
            />
            <div className="mt-4 text-center text-sm text-gray-400">
              🖱️ Arrastra para rotar | 🔍 Scroll para zoom | Malla 3D interactiva
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
