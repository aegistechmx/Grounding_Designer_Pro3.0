import React, { useState, useEffect, useCallback } from 'react';
import { useGroundingCalculator } from './hooks/useGroundingCalculator';
import { Header, Sidebar, DesignPanel, DashboardPanel, VisualizationPanel, ValidationPanel, OptimizationPanel, NormativesPanel, ReportsPanel, ResultsPanel, PredictiveAI, ScenarioSimulator, ToastNotifications, SetupWizard, TransformerTemplates, DocumentationViewer } from './components';
import { ProjectManager } from './components/Projects/ProjectManager';
import { projectStorageService } from './services/projectStorage.service';
import './utils/export/pdfFullPro';

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
    resetToDefaults,
    recalculate
  } = useGroundingCalculator();

  const [showWizard, setShowWizard] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);

  const handleLoadProject = (project) => {
    if (!project || typeof project !== 'object') {
      console.error('Invalid project data');
      return;
    }
    if (project.params && typeof project.params === 'object') {
      Object.keys(project.params).forEach(key => {
        if (project.params[key] !== undefined && project.params[key] !== null) {
          updateParam(key, project.params[key]);
        }
      });
    }
    if (project.activeTab && typeof project.activeTab === 'string') {
      setActiveTab(project.activeTab);
    }
  };

  const handleNewProject = (projectData) => {
    if (!projectData || typeof projectData !== 'object') {
      console.error('Invalid project data');
      return;
    }
    Object.keys(projectData).forEach(key => {
      if (projectData[key] !== undefined && projectData[key] !== null) {
        updateParam(key, projectData[key]);
      }
    });
    setActiveTab('design');
  };

  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      try {
        const currentProject = projectStorageService.getCurrentProject();
        const projectData = {
          id: currentProject?.id || Date.now().toString(),
          name: currentProject?.name || 'Nuevo Proyecto',
          params: params,
          calculations: calculations,
          activeTab: activeTab,
          createdAt: currentProject?.createdAt || new Date().toISOString()
        };
        const result = projectStorageService.saveProject(projectData);
        // Use toast notification instead of alert
        console.log('Project saved:', result.message);
      } catch (error) {
        console.error('Error saving project:', error);
      }
    }
  }, [params, calculations, activeTab]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'design':
        return <DesignPanel params={params} calculations={calculations} updateParam={updateParam} darkMode={darkMode} recalculate={recalculate} />;
      case 'dashboard':
        return <DashboardPanel params={params} calculations={calculations} darkMode={darkMode} />;
      case 'visualization':
        return <VisualizationPanel params={params} calculations={calculations} darkMode={darkMode} />;
      case 'validation':
        return <ValidationPanel calculations={calculations} darkMode={darkMode} />;
      case 'optimization':
        return <OptimizationPanel params={params} calculations={calculations} updateParam={updateParam} darkMode={darkMode} />;
      case 'normatives':
        return <NormativesPanel params={params} calculations={calculations} darkMode={darkMode} />;
      case 'ai':
        return <PredictiveAI params={params} calculations={calculations} darkMode={darkMode} />;
      case 'reports':
        return <ReportsPanel params={params} calculations={calculations} recommendations={recommendations} darkMode={darkMode} />;
      case 'projects':
        return <ProjectManager darkMode={darkMode} onLoadProject={handleLoadProject} onNewProject={handleNewProject} />;
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
            params={params}
            calculations={calculations}
            onLoadProject={handleLoadProject}
            onNewProject={handleNewProject}
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
              
              {activeTab === 'design' && (
                <div className="mt-8 space-y-4">
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <h3 className="text-lg font-semibold mb-4">🎲 Simulación de Escenarios</h3>
                  <ScenarioSimulator baseParams={params} darkMode={darkMode} />
                </div>
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