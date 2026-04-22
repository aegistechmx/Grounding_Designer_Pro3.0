import React, { useState, useCallback } from 'react';
import { Play, Plus, Trash2, Download, BarChart3, Layers, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { calculateIEEE80 } from '../../utils/groundingMath_clean';

const MultiScenarioSimulation = ({ baseParams, darkMode, onLoadScenario }) => {
  const [scenarios, setScenarios] = useState([
    { id: 1, name: 'Escenario Base', params: { ...(baseParams || {}) }, results: null, color: '#3b82f6' }
  ]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedScenarios, setSelectedScenarios] = useState([1]);

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const addScenario = useCallback(() => {
    const newId = scenarios.length > 0 ? Math.max(...scenarios.map(s => s.id)) + 1 : 1;
    const newScenario = {
      id: newId,
      name: `Escenario ${newId}`,
      params: { ...(baseParams || {}) },
      results: null,
      color: colors[newId % colors.length]
    };
    setScenarios([...scenarios, newScenario]);
    setSelectedScenarios([...selectedScenarios, newId]);
  }, [scenarios, baseParams, colors, selectedScenarios]);

  const deleteScenario = useCallback((id) => {
    if (scenarios.length <= 1) return;
    setScenarios(scenarios.filter(s => s.id !== id));
    setSelectedScenarios(selectedScenarios.filter(sid => sid !== id));
  }, [scenarios, selectedScenarios]);

  const updateScenarioParams = useCallback((id, newParams) => {
    setScenarios(scenarios.map(s => s.id === id ? { ...s, params: { ...s.params, ...newParams }, results: null } : s));
  }, [scenarios]);

  const duplicateScenario = useCallback((id) => {
    const scenario = scenarios.find(s => s.id === id);
    if (!scenario) return;
    
    const newId = scenarios.length > 0 ? Math.max(...scenarios.map(s => s.id)) + 1 : 1;
    const newScenario = {
      id: newId,
      name: `${scenario.name} (copia)`,
      params: { ...scenario.params },
      results: null,
      color: colors[newId % colors.length]
    };
    setScenarios([...scenarios, newScenario]);
    setSelectedScenarios([...selectedScenarios, newId]);
  }, [scenarios, colors, selectedScenarios]);

  const runSimulation = useCallback(async () => {
    setIsSimulating(true);
    
    try {
      const updatedScenarios = await Promise.all(scenarios.map(async (scenario) => {
        const results = calculateIEEE80(scenario.params);
        if (!results || !results.Rg) {
          console.warn('No se pudieron calcular resultados para escenario:', scenario.name);
          return { ...scenario, results: null };
        }
        return { ...scenario, results };
      }));
      
      setScenarios(updatedScenarios);
    } catch (error) {
      console.error('Error en simulación:', error);
    } finally {
      setIsSimulating(false);
    }
  }, [scenarios]);

  const toggleScenarioSelection = useCallback((id) => {
    if (selectedScenarios.includes(id)) {
      setSelectedScenarios(selectedScenarios.filter(sid => sid !== id));
    } else {
      setSelectedScenarios([...selectedScenarios, id]);
    }
  }, [selectedScenarios]);

  const exportResults = useCallback(() => {
    const csv = [
      ['Escenario', 'Rg (Ω)', 'GPR (V)', 'Em (V)', 'Es (V)', 'Cumple IEEE 80'],
      ...scenarios.filter(s => s.results).map(s => [
        s.name,
        isFinite(s.results.Rg) ? s.results.Rg.toFixed(2) : 'N/A',
        isFinite(s.results.GPR) ? s.results.GPR.toFixed(0) : 'N/A',
        isFinite(s.results.Em) ? s.results.Em.toFixed(0) : 'N/A',
        isFinite(s.results.Es) ? s.results.Es.toFixed(0) : 'N/A',
        s.results.complies ? 'SÍ' : 'NO'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `escenarios-simulacion-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }, [scenarios]);

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Layers size={18} /> Simulación de Escenarios Múltiples
        </h4>
        <div className="flex gap-2">
          <button
            onClick={addScenario}
            className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="Agregar escenario"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className={`p-2 rounded ${isSimulating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            title="Ejecutar simulación"
          >
            <Play size={16} />
          </button>
          <button
            onClick={exportResults}
            className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="Exportar resultados"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h5 className="font-semibold mb-3">Escenarios Configurados</h5>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className={`p-3 rounded border-l-4 ${darkMode ? 'bg-gray-600' : 'bg-white'}`}
                style={{ borderLeftColor: scenario.color }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedScenarios.includes(scenario.id)}
                      onChange={() => toggleScenarioSelection(scenario.id)}
                      className="w-4 h-4"
                    />
                    <input
                      type="text"
                      value={scenario.name}
                      onChange={(e) => setScenarios(scenarios.map(s => s.id === scenario.id ? { ...s, name: e.target.value } : s))}
                      className={`text-sm font-semibold bg-transparent border-b ${darkMode ? 'border-gray-500 text-white' : 'border-gray-300 text-gray-800'} focus:outline-none`}
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => duplicateScenario(scenario.id)}
                      className={`p-1 rounded ${darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-200'}`}
                      title="Duplicar"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={() => deleteScenario(scenario.id)}
                      disabled={scenarios.length <= 1}
                      className={`p-1 rounded ${scenarios.length <= 1 ? 'opacity-50 cursor-not-allowed' : darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-200'}`}
                      title="Eliminar"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Resistividad:</label>
                    <input
                      type="number"
                      value={scenario.params.soilResistivity}
                      onChange={(e) => updateScenarioParams(scenario.id, { soilResistivity: parseFloat(e.target.value) || 100 })}
                      className={`w-full p-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
                    />
                  </div>
                  <div>
                    <label className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Conductores:</label>
                    <input
                      type="number"
                      value={scenario.params.numParallel}
                      onChange={(e) => updateScenarioParams(scenario.id, { numParallel: parseInt(e.target.value) || 4 })}
                      className={`w-full p-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
                    />
                  </div>
                  <div>
                    <label className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Varillas:</label>
                    <input
                      type="number"
                      value={scenario.params.numRods}
                      onChange={(e) => updateScenarioParams(scenario.id, { numRods: parseInt(e.target.value) || 6 })}
                      className={`w-full p-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
                    />
                  </div>
                  <div>
                    <label className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Largo (m):</label>
                    <input
                      type="number"
                      value={scenario.params.gridLength}
                      onChange={(e) => updateScenarioParams(scenario.id, { gridLength: parseFloat(e.target.value) || 30 })}
                      className={`w-full p-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
                    />
                  </div>
                </div>

                {scenario.results && (
                  <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {scenario.results.complies ? (
                        <CheckCircle size={12} className="text-green-500" />
                      ) : (
                        <AlertTriangle size={12} className="text-red-500" />
                      )}
                      <span className="text-xs font-semibold">Resultados:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div>Rg: {isFinite(scenario.results.Rg) ? scenario.results.Rg.toFixed(2) : 'N/A'}Ω</div>
                      <div>Em: {isFinite(scenario.results.Em) ? scenario.results.Em.toFixed(0) : 'N/A'}V</div>
                      <div>Es: {isFinite(scenario.results.Es) ? scenario.results.Es.toFixed(0) : 'N/A'}V</div>
                      <div>GPR: {isFinite(scenario.results.GPR) ? scenario.results.GPR.toFixed(0) : 'N/A'}V</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h5 className="font-semibold mb-3 flex items-center gap-2">
            <BarChart3 size={16} /> Comparación de Resultados
          </h5>
          
          {scenarios.filter(s => s.results).length === 0 ? (
            <p className={`text-sm ${darkMode ? 'text-gray-100' : 'text-gray-600'} text-center py-8`}>
              Ejecuta la simulación para ver los resultados comparativos
            </p>
          ) : (
            <div className="space-y-4">
              {['Rg', 'Em', 'Es', 'GPR'].map(metric => (
                <div key={metric}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>{metric}</span>
                    <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>(Ω/V)</span>
                  </div>
                  <div className="space-y-1">
                    {scenarios.filter(s => s.results && selectedScenarios.includes(s.id)).map((scenario) => {
                      const value = scenario.results[metric] || 0;
                      const maxValue = Math.max(...scenarios.filter(s => s.results).map(s => s.results[metric] || 0), 1);
                      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                      return (
                        <div key={scenario.id} className="flex items-center gap-2">
                          <div className="w-20 text-xs truncate" title={scenario.name}>
                            {scenario.name}
                          </div>
                          <div className="flex-1 h-4 rounded overflow-hidden">
                            <div
                              className="h-full rounded transition-all"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: scenario.color
                              }}
                            />
                          </div>
                          <div className="w-16 text-xs text-right">
                            {isFinite(value) ? value.toFixed(2) : 'N/A'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h6 className="font-semibold mb-2 text-sm">Estado de Cumplimiento</h6>
                <div className="space-y-2">
                  {scenarios.filter(s => s.results && selectedScenarios.includes(s.id)).map((scenario) => (
                    <div key={scenario.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: scenario.color }}
                        />
                        <span className="text-xs">{scenario.name}</span>
                      </div>
                      {scenario.results?.complies ? (
                        <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                          <CheckCircle size={12} /> CUMPLE
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 font-semibold flex items-center gap-1">
                          <AlertTriangle size={12} /> NO CUMPLE
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isSimulating && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Simulando escenarios...
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiScenarioSimulation;
