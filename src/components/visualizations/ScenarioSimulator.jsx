import React, { useState } from 'react';
import { Play, Plus, Trash2, Download, BarChart3, Layers } from 'lucide-react';
import { runGroundingCalculation } from '../../core/groundingEngine';

export const ScenarioSimulator = ({ baseParams, darkMode }) => {
  const [scenarios, setScenarios] = useState([
    {
      id: 1,
      name: 'Escenario Base',
      params: { ...baseParams },
      results: null,
      isBase: true
    }
  ]);
  const [selectedScenario, setSelectedScenario] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);

  const addScenario = () => {
    const newId = Math.max(...scenarios.map(s => s.id), 0) + 1;
    setScenarios([
      ...scenarios,
      {
        id: newId,
        name: `Escenario ${newId}`,
        params: { ...baseParams },
        results: null,
        isBase: false
      }
    ]);
  };

  const removeScenario = (id) => {
    if (scenarios.find(s => s.id === id)?.isBase) return;
    setScenarios(scenarios.filter(s => s.id !== id));
    if (selectedScenario === id) {
      setSelectedScenario(scenarios.find(s => s.isBase)?.id || 1);
    }
  };

  const updateScenarioParam = (id, param, value) => {
    setScenarios(scenarios.map(s =>
      s.id === id ? { ...s, params: { ...s.params, [param]: parseFloat(value) } } : s
    ));
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    
    const updatedScenarios = await Promise.all(
      scenarios.map(async (scenario) => {
        const results = runGroundingCalculation(scenario.params);
        return { ...scenario, results };
      })
    );
    
    setScenarios(updatedScenarios);
    setIsSimulating(false);
  };

  const getComparisonData = () => {
    const baseScenario = scenarios.find(s => s.isBase);
    if (!baseScenario?.results) return [];
    
    return scenarios
      .filter(s => s.results)
      .map(scenario => ({
        name: scenario.name,
        Rg: scenario.results.Rg,
        Em: scenario.results.Em,
        Es: scenario.results.Es,
        GPR: scenario.results.GPR,
        improvement: baseScenario.results.Rg > 0 ? ((baseScenario.results.Rg - scenario.results.Rg) / baseScenario.results.Rg * 100).toFixed(1) : '0'
      }));
  };

  const exportResults = () => {
    const data = getComparisonData();
    const csvContent = [
      ['Escenario', 'Rg (Ω)', 'Em (V)', 'Es (V)', 'GPR (V)', 'Mejora (%)'],
      ...data.map(s => [s.name, s.Rg?.toFixed(2), s.Em?.toFixed(0), s.Es?.toFixed(0), s.GPR?.toFixed(0), s.improvement])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `escenarios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const comparisonData = getComparisonData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">📊 Simulación de Escenarios Múltiples</h3>
        <div className="flex gap-2">
          <button
            onClick={addScenario}
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm flex items-center gap-1 hover:bg-blue-700"
          >
            <Plus size={14} /> Agregar Escenario
          </button>
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 ${
              isSimulating ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Play size={14} /> {isSimulating ? 'Simulando...' : 'Simular Todos'}
          </button>
          <button
            onClick={exportResults}
            className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm flex items-center gap-1 hover:bg-purple-700"
          >
            <Download size={14} /> Exportar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lista de escenarios */}
        <div className="space-y-3">
          <h4 className="font-semibold">Escenarios Configurados</h4>
          {scenarios.map(scenario => (
            <div
              key={scenario.id}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedScenario === scenario.id
                  ? darkMode ? 'bg-blue-900/50 border border-blue-500' : 'bg-blue-50 border border-blue-500'
                  : darkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
              onClick={() => setSelectedScenario(scenario.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {scenario.name}
                    {scenario.isBase && <span className="ml-2 text-xs text-blue-500">(base)</span>}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {scenario.results?.Rg ? `${scenario.results.Rg.toFixed(2)} Ω` : 'Sin simular'}
                  </div>
                </div>
                {!scenario.isBase && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeScenario(scenario.id); }}
                    className="p-1 rounded hover:bg-red-500/20"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Parámetros del escenario seleccionado */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <h4 className="font-semibold mb-3">
            Parámetros - {scenarios.find(s => s.id === selectedScenario)?.name}
          </h4>
          
          {scenarios.find(s => s.id === selectedScenario) && (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-500">Resistividad suelo (Ω·m)</label>
                <input
                  type="number"
                  value={scenarios.find(s => s.id === selectedScenario)?.params.soilResistivity || 100}
                  onChange={(e) => updateScenarioParam(selectedScenario, 'soilResistivity', e.target.value)}
                  className={`w-full p-1 border rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Conductores</label>
                  <input
                    type="number"
                    value={scenarios.find(s => s.id === selectedScenario)?.params.numParallel || 8}
                    onChange={(e) => updateScenarioParam(selectedScenario, 'numParallel', e.target.value)}
                    className={`w-full p-1 border rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white'}`}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Varillas</label>
                  <input
                    type="number"
                    value={scenarios.find(s => s.id === selectedScenario)?.params.numRods || 8}
                    onChange={(e) => updateScenarioParam(selectedScenario, 'numRods', e.target.value)}
                    className={`w-full p-1 border rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white'}`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resultados del escenario seleccionado */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <h4 className="font-semibold mb-3">Resultados</h4>
          {scenarios.find(s => s.id === selectedScenario)?.results ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Resistencia (Rg):</span>
                <span className="font-bold">{scenarios.find(s => s.id === selectedScenario)?.results.Rg?.toFixed(3)} Ω</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GPR:</span>
                <span className="font-bold">{scenarios.find(s => s.id === selectedScenario)?.results.GPR?.toFixed(0)} V</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Em (Contacto):</span>
                <span className={`font-bold ${
                  scenarios.find(s => s.id === selectedScenario)?.results.touchSafe70 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {scenarios.find(s => s.id === selectedScenario)?.results.Em?.toFixed(0)} V
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Es (Paso):</span>
                <span className={`font-bold ${
                  scenarios.find(s => s.id === selectedScenario)?.results.stepSafe70 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {scenarios.find(s => s.id === selectedScenario)?.results.Es?.toFixed(0)} V
                </span>
              </div>
              <div className="pt-2 mt-2 border-t">
                <div className={`text-center p-2 rounded ${
                  scenarios.find(s => s.id === selectedScenario)?.results.complies 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700'
                }`}>
                  {scenarios.find(s => s.id === selectedScenario)?.results.complies ? '✓ CUMPLE IEEE 80' : '✗ NO CUMPLE IEEE 80'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Ejecute la simulación para ver resultados</p>
            </div>
          )}
        </div>
      </div>

      {/* Comparación de resultados */}
      {comparisonData.length > 1 && (
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Layers size={16} /> Comparación de Resultados
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className="text-left py-2">Escenario</th>
                  <th className="text-right py-2">Rg (Ω)</th>
                  <th className="text-right py-2">Em (V)</th>
                  <th className="text-right py-2">Es (V)</th>
                  <th className="text-right py-2">GPR (V)</th>
                  <th className="text-right py-2">Mejora</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((scenario, idx) => (
                  <tr key={idx} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className="py-2 font-medium">{scenario.name}</td>
                    <td className="text-right py-2">{scenario.Rg?.toFixed(2)}</td>
                    <td className="text-right py-2">{scenario.Em?.toFixed(0)}</td>
                    <td className="text-right py-2">{scenario.Es?.toFixed(0)}</td>
                    <td className="text-right py-2">{scenario.GPR?.toFixed(0)}</td>
                    <td className={`text-right py-2 font-semibold ${parseFloat(scenario.improvement) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {parseFloat(scenario.improvement) > 0 ? `↓${scenario.improvement}%` : `↑${Math.abs(scenario.improvement)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioSimulator;