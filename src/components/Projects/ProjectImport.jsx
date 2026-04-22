// src/components/Projects/ProjectImport.jsx
import React, { useState } from 'react';
import { projectImportService } from '../../services/projectImport.service';

export const ProjectImport = ({ darkMode, onImport }) => {
  const [projectName, setProjectName] = useState('');
  const [tableData, setTableData] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  const handleImport = () => {
    if (!tableData.trim()) {
      setError('Por favor pega los datos del proyecto');
      return;
    }
    if (!projectName.trim()) {
      setError('Por favor ingresa un nombre para el proyecto');
      return;
    }

    try {
      const project = projectImportService.importFromTable(tableData, projectName);
      setPreview(project);
      setError('');
    } catch (err) {
      setError('Error al importar: ' + err.message);
    }
  };

  const handleConfirm = () => {
    if (preview) {
      onImport(preview);
    }
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-6`}>
      <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        📥 Importar Proyecto desde Tabla
      </h2>
      
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Nombre del Proyecto
        </label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className={`w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
          }`}
          placeholder="Ej: Palmas Lote 03"
        />
      </div>

      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Datos del Proyecto (copiar desde Excel/Google Sheets)
        </label>
        <textarea
          value={tableData}
          onChange={(e) => setTableData(e.target.value)}
          rows={10}
          className={`w-full p-2 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
          }`}
          placeholder="Pega aquí los datos del proyecto..."
        />
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleImport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Vista Previa
        </button>
        {preview && (
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Confirmar Importación
          </button>
        )}
      </div>

      {preview && (
        <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Vista Previa del Proyecto
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Nombre:</span>
              <span className="ml-2">{preview.name}</span>
            </div>
            <div>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Tablero Principal:</span>
              <span className="ml-2">{preview.mainPanel?.model}</span>
            </div>
            <div>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Circuitos:</span>
              <span className="ml-2">{preview.circuits?.length || 0}</span>
            </div>
            <div>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Potencia Total:</span>
              <span className="ml-2">{((preview.totals?.watts || 0) / 1000).toFixed(1)} kW</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
