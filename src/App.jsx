import React, { useState, useEffect } from 'react';
import { useGroundingCalculator } from './hooks/useGroundingCalculator';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DesignPanel } from './components/panels/DesignPanel';
import { DashboardPanel } from './components/panels/DashboardPanel';
import { VisualizationPanel } from './components/panels/VisualizationPanel';
import { ValidationPanel } from './components/panels/ValidationPanel';
import { OptimizationPanel } from './components/panels/OptimizationPanel';
import { FeedersPanel } from './components/panels/FeedersPanel';
import { NormativesPanel } from './components/panels/NormativesPanel';
import { ReportsPanel } from './components/panels/ReportsPanel';
import { ResultsPanel } from './components/panels/ResultsPanel';
import SensitivityChart from './components/visualizations/SensitivityChart';
import ScenarioSimulator from './components/visualizations/ScenarioSimulator';
import ToastNotifications from './components/common/ToastNotifications';
import SetupWizard from './components/wizard/SetupWizard';
import TransformerTemplates from './components/templates/TransformerTemplates';
import DocumentationViewer from './components/docs/DocumentationViewer';
import { useSensitivityAnalysis } from './hooks/useSensitivityAnalysis';
import './utils/pdfFullPro';

const App = () => {
  const {
    params,
    calculations,
    recommendations,
    darkMode,
    isLoading,
    activeTab,
    notifications,
    updateParam,
    setDarkMode,
    setActiveTab,
    removeNotification,
    saveProfile,
    loadProfile,
    resetToDefaults
  } = useGroundingCalculator();

  const sensitivityAnalysis = useSensitivityAnalysis(params);
  const [showWizard, setShowWizard] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSensitivity, setShowSensitivity] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);

  // Ejecutar análisis de sensibilidad automáticamente
  useEffect(() => {
    if (calculations && !sensitivityAnalysis.analysisResults && !sensitivityAnalysis.isAnalyzing) {
      sensitivityAnalysis.analyzeAllParameters();
    }
  }, [calculations]);

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'design':
        return <DesignPanel params={params} calculations={calculations} updateParam={updateParam} darkMode={darkMode} />;
      case 'dashboard':
        return <DashboardPanel params={params} calculations={calculations} darkMode={darkMode} />;
      case 'visualization':
        return <VisualizationPanel params={params} calculations={calculations} darkMode={darkMode} />;
      case 'validation':
        return <ValidationPanel calculations={calculations} darkMode={darkMode} />;
      case 'optimization':
        return <OptimizationPanel params={params} calculations={calculations} updateParam={updateParam} darkMode={darkMode} />;
      case 'feeders':
        return <FeedersPanel params={params} darkMode={darkMode} />;
      case 'normatives':
        return <NormativesPanel params={params} calculations={calculations} darkMode={darkMode} />;
      case 'reports':
        return <ReportsPanel params={params} calculations={calculations} recommendations={recommendations} darkMode={darkMode} />;
      default:
        return <DesignPanel params={params} calculations={calculations} updateParam={updateParam} darkMode={darkMode} />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="w-full max-w-7xl mx-auto p-4">
        <div className={`rounded-lg shadow-lg p-4 md:p-6 transition-colors duration-300 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
          
          <Header 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenWizard={() => setShowWizard(true)}
            onOpenTemplates={() => setShowTemplates(true)}
            onOpenDocs={() => setShowDocs(true)}
          />
          
          {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-300">Calculando...</p>
              </div>
            </div>
          )}
          
          <div className="flex flex-col lg:flex-row gap-6">
            <Sidebar 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              darkMode={darkMode}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
            
            <div className="flex-1">
              {renderActivePanel()}
              <ResultsPanel calculations={calculations} recommendations={recommendations} darkMode={darkMode} />
              
              {/* Sección de Análisis Avanzado - Solo en Diseño de Malla */}
              {activeTab === 'design' && (
                <div className="mt-8 space-y-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSensitivity(!showSensitivity)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        showSensitivity
                          ? 'bg-blue-600 text-white'
                          : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      📊 Análisis de Sensibilidad
                    </button>
                    <button
                      onClick={() => setShowScenarios(!showScenarios)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        showScenarios
                          ? 'bg-blue-600 text-white'
                          : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      🎲 Simulación de Escenarios
                    </button>
                  </div>
                
                {showSensitivity && sensitivityAnalysis.analysisResults && (
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <h3 className="text-lg font-semibold mb-4">📈 Análisis de Sensibilidad</h3>
                    <SensitivityChart 
                      data={sensitivityAnalysis.getSensitivityChartData()} 
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
                  </div>
                )}
                
                {showScenarios && (
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <ScenarioSimulator baseParams={params} darkMode={darkMode} />
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <ToastNotifications notifications={notifications} onClose={removeNotification} darkMode={darkMode} />
      
      {showWizard && (
        <SetupWizard 
          onComplete={(config) => {
            Object.keys(config).forEach(key => updateParam(key, config[key]));
            setShowWizard(false);
          }} 
          darkMode={darkMode} 
          onClose={() => setShowWizard(false)} 
        />
      )}
      
      {showTemplates && (
        <TransformerTemplates 
          onSelectTemplate={(template) => {
            Object.keys(template.params).forEach(key => updateParam(key, template.params[key]));
            setShowTemplates(false);
          }}
          darkMode={darkMode}
          onClose={() => setShowTemplates(false)}
        />
      )}
      
      {showDocs && (
        <DocumentationViewer darkMode={darkMode} onClose={() => setShowDocs(false)} />
      )}
    </div>
  );
};

export default App;