// src/components/Projects/ProjectViewer.jsx
import React from 'react';
import { ArrowLeft, Download, Printer } from 'lucide-react';

export const ProjectViewer = ({ darkMode, project, onBack, onExport }) => {
  if (!project) {
    return <div className={`p-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cargando proyecto...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
        >
          <ArrowLeft size={18} />
          Volver
        </button>
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white`}
          >
            <Download size={18} />
            Exportar
          </button>
          <button
            onClick={() => window.print()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            <Printer size={18} />
            Imprimir
          </button>
        </div>
      </div>

      {/* Header del Proyecto */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          🏭 {project.name}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tablero Principal</div>
            <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {project.mainPanel?.model || 'N/A'}
            </div>
          </div>
          <div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ubicación</div>
            <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {project.mainPanel?.location || 'No especificada'}
            </div>
          </div>
          <div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Interruptor Principal</div>
            <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {project.mainPanel?.mainBreaker || 0} A
            </div>
          </div>
          <div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Voltaje</div>
            <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {project.mainPanel?.voltage || 220} V
            </div>
          </div>
        </div>
      </div>

      {/* Resumen de Cargas */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          📊 Resumen de Cargas
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="text-3xl font-bold text-blue-500">
              {((project.totals?.watts || 0) / 1000).toFixed(1)} kW
            </div>
            <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Potencia Total</div>
          </div>
          <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="text-3xl font-bold text-green-500">
              {(project.totals?.current || 0).toFixed(0)} A
            </div>
            <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Corriente Total</div>
          </div>
          <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="text-3xl font-bold text-yellow-500">
              {project.circuits?.length || 0}
            </div>
            <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Circuitos</div>
          </div>
        </div>
      </div>

      {/* Tabla de Circuitos */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <tr>
                <th className={`p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Circuito</th>
                <th className={`p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fases</th>
                <th className={`p-3 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Watts</th>
                <th className={`p-3 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Distancia</th>
                <th className={`p-3 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Breaker</th>
                <th className={`p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Conductor</th>
                <th className={`p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {project.circuits?.map((circuit, idx) => (
                <tr key={idx} className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <td className={`p-3 font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{circuit.name}</td>
                  <td className={`p-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{circuit.phases?.join('-') || 'N/A'}</td>
                  <td className={`p-3 text-right ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{(circuit.watts || 0).toLocaleString()} W</td>
                  <td className={`p-3 text-right ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{circuit.distance || 0} m</td>
                  <td className={`p-3 text-right ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{circuit.breakerSize || 0} A</td>
                  <td className={`p-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {circuit.conductor ? `${circuit.conductor.awg || 'N/A'} (${circuit.conductor.mm2 || 'N/A'} mm²)` : 'N/A'}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      circuit.type === 'motor' 
                        ? 'bg-blue-900 text-blue-300' 
                        : darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {circuit.type === 'motor' ? 'Motor' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} font-bold`}>
              <tr>
                <td colSpan="2" className={`p-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>TOTAL</td>
                <td className={`p-3 text-right ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {(project.totals?.watts || 0).toLocaleString()} W
                </td>
                <td className="p-3 text-right"></td>
                <td className="p-3 text-right"></td>
                <td className="p-3"></td>
                <td className="p-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Diagrama de distribución */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          📐 Diagrama de Distribución
        </h3>
        <div className="relative">
          <div className="text-center mb-4">
            <div className="inline-block bg-blue-600 px-6 py-2 rounded-full text-white">Transformador</div>
            <div className="text-gray-500 my-2">↓</div>
            <div className="inline-block bg-yellow-600 px-6 py-2 rounded-full text-white">
              IP {project.mainPanel?.mainBreaker || 0}A
            </div>
            <div className="text-gray-500 my-2">↓</div>
            <div className="inline-block bg-green-600 px-6 py-2 rounded-full text-white">
              {project.mainPanel?.model || 'Tablero'}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-4">
            {project.circuits?.slice(0, 8).map((circuit, idx) => (
              <div key={idx} className={`p-2 rounded text-center text-sm ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                {circuit.name}
                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{circuit.breakerSize || 0}A</div>
              </div>
            ))}
            {(project.circuits?.length || 0) > 8 && (
              <div className={`p-2 rounded text-center text-sm ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                +{(project.circuits?.length || 0) - 8} más
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exportar JSON */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            const json = JSON.stringify(project, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.name}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          📥 Exportar JSON
        </button>
      </div>
    </div>
  );
};
