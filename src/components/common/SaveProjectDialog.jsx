// src/components/common/SaveProjectDialog.jsx
import React, { useState } from 'react';
import { Save, FolderOpen, X, FileText, Download, Upload, CheckCircle } from 'lucide-react';

export const SaveProjectDialog = ({ isOpen, onClose, onSave, onSaveAs, onLoad, onExport, onImport, projects, currentProject }) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [activeTab, setActiveTab] = useState('save'); // 'save', 'load', 'export'
  const [importFile, setImportFile] = useState(null);
  
  if (!isOpen) return null;
  
  const handleSave = () => {
    if (onSave) onSave();
    if (onClose) onClose();
  };
  
  const handleSaveAs = () => {
    if (newProjectName.trim()) {
      if (onSaveAs) onSaveAs(newProjectName);
      if (onClose) onClose();
    }
  };
  
  const handleLoad = () => {
    if (selectedProjectId) {
      if (onLoad) onLoad(selectedProjectId);
      if (onClose) onClose();
    }
  };
  
  const handleExport = () => {
    if (onExport) onExport();
    if (onClose) onClose();
  };
  
  const handleImport = () => {
    if (importFile) {
      if (onImport) onImport(importFile);
      if (onClose) onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl w-[500px] max-w-[90%] shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Guardar Proyecto</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-lg transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('save')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'save' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            <Save size={14} className="inline mr-1" /> Guardar
          </button>
          <button
            onClick={() => setActiveTab('load')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'load' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            <FolderOpen size={14} className="inline mr-1" /> Cargar
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'export' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            <Download size={14} className="inline mr-1" /> Exportar
          </button>
        </div>
        
        {/* Contenido */}
        <div className="p-4">
          {activeTab === 'save' && (
            <div className="space-y-4">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-sm text-gray-400">Proyecto actual</div>
                <div className="text-white font-semibold">{currentProject?.name || 'Nuevo Proyecto'}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Última modificación: {currentProject?.lastModified ? (() => { try { return new Date(currentProject.lastModified).toLocaleString(); } catch { return 'Fecha inválida'; } })() : 'No guardado'}
                </div>
              </div>
              
              <button
                onClick={handleSave}
                className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} /> Guardar Proyecto
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-gray-800 text-gray-500">o</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Guardar como:</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Nombre del proyecto"
                  className="w-full p-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleSaveAs}
                  disabled={!newProjectName.trim()}
                  className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Guardar como "{newProjectName || '...'}"
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'load' && (
            <div className="space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No hay proyectos guardados</p>
                  <p className="text-xs mt-1">Guarda tu primer proyecto</p>
                </div>
              ) : (
                <>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {projects.map(project => (
                      <div
                        key={project.id}
                        onClick={() => setSelectedProjectId(project.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedProjectId === project.id
                            ? 'bg-blue-600/20 border border-blue-500'
                            : 'bg-gray-700/50 hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-white">{project.name}</div>
                            <div className="text-xs text-gray-400">
                              {(() => { try { return new Date(project.lastModified).toLocaleString(); } catch { return 'Fecha inválida'; } })()}
                            </div>
                          </div>
                          {selectedProjectId === project.id && (
                            <CheckCircle size={16} className="text-blue-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleLoad}
                    disabled={!selectedProjectId}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    Cargar Proyecto
                  </button>
                </>
              )}
            </div>
          )}
          
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-sm text-gray-400">Exportar como</div>
                <div className="text-white font-semibold">{currentProject?.name || 'Proyecto'}.json</div>
              </div>
              
              <button
                onClick={handleExport}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Download size={18} /> Exportar a JSON
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-gray-800 text-gray-500">Importar</span>
                </div>
              </div>
              
              <label className="block">
                <div className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <Upload size={20} className="text-gray-400 mr-2" />
                  <span className="text-gray-400">Seleccionar archivo JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    className="hidden"
                  />
                </div>
              </label>
              
              {importFile && (
                <div className="bg-gray-700 rounded-lg p-2 text-sm">
                  <FileText size={14} className="inline mr-1 text-blue-400" />
                  {importFile.name}
                </div>
              )}
              
              <button
                onClick={handleImport}
                disabled={!importFile}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                Importar Proyecto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
