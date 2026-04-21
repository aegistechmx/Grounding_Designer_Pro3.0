import React, { useState } from 'react';
import { Plus, Trash2, Copy, X, CheckCircle, XCircle } from 'lucide-react';
import { calculateIEEE80 } from '../../utils/groundingMath_clean';

const ConfigComparator = ({ currentParams, darkMode, onClose }) => {
  const [configs, setConfigs] = useState([
    { id: 1, name: 'Configuración Actual', params: { ...currentParams }, results: calculateIEEE80(currentParams) },
    { id: 2, name: 'Configuración Optimizada', params: { ...currentParams, numParallel: 18, numRods: 50, currentDivisionFactor: 0.20 }, results: null }
  ]);

  const addConfig = () => {
    const newId = Date.now();
    setConfigs([...configs, {
      id: newId,
      name: `Configuración ${configs.length + 1}`,
      params: { ...currentParams },
      results: null
    }]);
  };

  const updateConfigParams = (configId, key, value) => {
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue)) return;
    
    setConfigs(configs.map(c => {
      if (c.id === configId) {
        const newParams = { ...c.params, [key]: parsedValue };
        const newResults = calculateIEEE80(newParams);
        return { ...c, params: newParams, results: newResults };
      }
      return c;
    }));
  };

  const copyConfig = (configId) => {
    const config = configs.find(c => c.id === configId);
    if (!config) return;
    
    const newId = Date.now();
    setConfigs([...configs, {
      ...config,
      id: newId,
      name: `${config.name} (Copia)`,
      results: config.results ? { ...config.results } : null
    }]);
  };

  const deleteConfig = (configId) => {
    if (configs.length > 1) {
      setConfigs(configs.filter(c => c.id !== configId));
    }
  };

  const getComparisonTable = () => {
    const headers = ['Parámetro', ...configs.map(c => c.name)];
    const rows = [
      { label: 'Resistencia (Ω)', getValue: (c) => c.results?.Rg?.toFixed(2) || '-' },
      { label: 'GPR (V)', getValue: (c) => c.results?.GPR?.toFixed(0) || '-' },
      { label: 'Contacto (V)', getValue: (c) => c.results?.Em?.toFixed(0) || '-' },
      { label: 'Paso (V)', getValue: (c) => c.results?.Es?.toFixed(0) || '-' },
      { label: 'Cumple IEEE 80', getValue: (c) => c.results?.complies ? '✅' : '❌' },
      { label: 'Conductores', getValue: (c) => c.params?.numParallel || '-' },
      { label: 'Varillas', getValue: (c) => c.params?.numRods || '-' },
      { label: 'Sf', getValue: (c) => c.params?.currentDivisionFactor?.toFixed(2) || '-' },
      { label: 'Profundidad (m)', getValue: (c) => c.params?.gridDepth?.toFixed(1) || '-' },
      { label: 'Long. Varilla (m)', getValue: (c) => c.params?.rodLength?.toFixed(1) || '-' }
    ];

    return { headers, rows };
  };

  const { headers, rows } = getComparisonTable();

  // Encontrar la mejor configuración
  const bestConfig = configs.reduce((best, current) => {
    if (!current.results) return best;
    if (!best.results) return current;
    const currentScore = current.results.complies ? 1 : 0;
    const bestScore = best.results.complies ? 1 : 0;
    if (currentScore > bestScore) return current;
    if (currentScore === bestScore && current.results.Rg < best.results.Rg) return current;
    return best;
  }, configs[0]);

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-6xl mx-auto`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">📊 Comparador de Configuraciones</h3>
        <div className="flex gap-2">
          <button
            onClick={addConfig}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1 text-sm"
          >
            <Plus size={16} /> Agregar
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {headers.map((header, idx) => (
                <th key={idx} className="p-2 text-left font-semibold">
                  {header}
                  {idx > 0 && configs[idx - 1] && (
                    <div className="flex gap-1 mt-1">
                      <button 
                        onClick={() => copyConfig(configs[idx - 1].id)} 
                        className="text-blue-500 hover:text-blue-700"
                        title="Copiar configuración"
                      >
                        <Copy size={14} />
                      </button>
                      <button 
                        onClick={() => deleteConfig(configs[idx - 1].id)} 
                        className="text-red-500 hover:text-red-700"
                        title="Eliminar configuración"
                        disabled={configs.length <= 1}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <td className="p-2 font-medium">{row.label}</td>
                {configs.map((config, colIdx) => (
                  <td key={colIdx} className="p-2">
                    {row.label.includes('Cumple') ? (
                      <span className="flex items-center gap-1">
                        {row.getValue(config) === '✅' ? (
                          <CheckCircle className="text-green-500" size={16} />
                        ) : row.getValue(config) === '❌' ? (
                          <XCircle className="text-red-500" size={16} />
                        ) : (
                          row.getValue(config)
                        )}
                      </span>
                    ) : (
                      <input
                        type="number"
                        value={row.getValue(config)}
                        onChange={(e) => {
                          const paramMap = {
                            'Conductores': 'numParallel',
                            'Varillas': 'numRods',
                            'Sf': 'currentDivisionFactor',
                            'Profundidad': 'gridDepth',
                            'Long. Varilla': 'rodLength'
                          };
                          const param = Object.entries(paramMap).find(([key]) => row.label.includes(key));
                          if (param && config.params) {
                            updateConfigParams(config.id, param[1], e.target.value);
                          }
                        }}
                        className={`w-20 px-2 py-1 rounded border ${
                          darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}
                        readOnly={!['Conductores', 'Varillas', 'Sf', 'Profundidad', 'Long. Varilla'].some(k => row.label.includes(k))}
                        step={row.label.includes('Sf') ? '0.01' : '1'}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mejor configuración destacada */}
      {bestConfig && bestConfig.results && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">
            🏆 Mejor configuración: {bestConfig.name}
            {bestConfig.results.complies && ' ✅ Cumple IEEE 80'}
          </p>
          <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
            <div>Rg: {bestConfig.results.Rg?.toFixed(2)} Ω</div>
            <div>Em: {bestConfig.results.Em?.toFixed(0)} V</div>
            <div>Es: {bestConfig.results.Es?.toFixed(0)} V</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigComparator;