import React, { useState, useEffect } from 'react';
import { FolderOpen, FileText, Copy, Download, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { getRiskLevel } from '../services/aiSuggestionService';
import { exportToExcel } from '../services/excelExportService';
import { generateFullReport } from '../utils/pdfGenerator';

const ProjectsDashboard = ({ projects, darkMode, onOpenProject, onDuplicateProject }) => {
  const [sortedProjects, setSortedProjects] = useState([]);

  // Risk color mapping
  const riskColor = {
    SAFE: "text-green-400 border-green-500 bg-green-500/10",
    MARGINAL: "text-yellow-400 border-yellow-500 bg-yellow-500/10",
    HIGH: "text-orange-400 border-orange-500 bg-orange-500/10",
    CRITICAL: "text-red-500 border-red-500 bg-red-500/10",
    UNKNOWN: "text-gray-400 border-gray-500 bg-gray-500/10"
  };

  const riskIcon = {
    SAFE: <CheckCircle size={16} className="text-green-400" />,
    MARGINAL: <AlertCircle size={16} className="text-yellow-400" />,
    HIGH: <AlertTriangle size={16} className="text-orange-400" />,
    CRITICAL: <AlertTriangle size={16} className="text-red-500" />,
    UNKNOWN: <AlertCircle size={16} className="text-gray-400" />
  };

  // Smart ordering by risk
  useEffect(() => {
    const priority = { CRITICAL: 4, HIGH: 3, MARGINAL: 2, SAFE: 1, UNKNOWN: 0 };
    const sorted = [...projects].sort((a, b) => {
      const riskA = getRiskLevel(a.results);
      const riskB = getRiskLevel(b.results);
      return priority[riskB] - priority[riskA];
    });
    setSortedProjects(sorted);
  }, [projects]);

  // Dashboard metrics
  const stats = {
    total: projects.length,
    unsafe: projects.filter(p => !p.results?.complies).length,
    critical: projects.filter(p => getRiskLevel(p.results) === 'CRITICAL').length,
    avgRg: projects.length > 0 
      ? projects.reduce((a, p) => a + (p.results?.Rg || 0), 0) / projects.length 
      : 0
  };

  const handleGeneratePDF = async (project) => {
    try {
      await generateFullReport({
        results: project.results,
        params: project.params,
        recommendations: project.recommendations || [],
        heatmapImage: project.heatmapImage
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF');
    }
  };

  const handleExportExcel = (project) => {
    try {
      exportToExcel(project.params, project.results, project.recommendations || []);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Error exporting Excel');
    }
  };

  return (
    <div className={`p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="text-3xl font-bold text-blue-500">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Projects</div>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="text-3xl font-bold text-red-500">{stats.unsafe}</div>
          <div className="text-sm text-gray-500">Unsafe</div>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="text-3xl font-bold text-orange-500">{stats.critical}</div>
          <div className="text-sm text-gray-500">Critical</div>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="text-3xl font-bold text-green-500">{stats.avgRg.toFixed(2)}</div>
          <div className="text-sm text-gray-500">Avg Rg (Ω)</div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedProjects.map((project, index) => {
          const riskLevel = getRiskLevel(project.results);
          const riskClass = riskColor[riskLevel] || riskColor.UNKNOWN;

          return (
            <div
              key={index}
              className={`p-4 rounded-xl shadow border-l-4 ${riskClass} ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              {/* Project Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">
                    {project.params?.projectName || `Project ${index + 1}`}
                  </h3>
                  <div className="text-xs text-gray-500 mt-1">
                    {project.params?.clientName || 'No client'}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {riskIcon[riskLevel] || riskIcon.UNKNOWN}
                  <span className={`text-sm font-semibold ${riskClass.split(' ')[0]}`}>
                    {riskLevel}
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="text-sm space-y-1 mb-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Rg:</span>
                  <span className="font-semibold">{project.results?.Rg?.toFixed(2) || 'N/A'} Ω</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">GPR:</span>
                  <span className="font-semibold">{project.results?.GPR?.toFixed(0) || 'N/A'} V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Em:</span>
                  <span className="font-semibold">{project.results?.Em?.toFixed(0) || 'N/A'} V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Es:</span>
                  <span className="font-semibold">{project.results?.Es?.toFixed(0) || 'N/A'} V</span>
                </div>
              </div>

              {/* Recommendations Preview */}
              {project.recommendations && project.recommendations.length > 0 && (
                <div className="mb-3 p-2 rounded bg-gray-700/30">
                  <div className="text-xs text-gray-400 mb-1">Top Recommendations:</div>
                  {project.recommendations.slice(0, 2).map((rec, i) => (
                    <p key={i} className="text-xs text-gray-300 truncate">
                      • {rec}
                    </p>
                  ))}
                  {project.recommendations.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{project.recommendations.length - 2} more
                    </div>
                  )}
                </div>
              )}

              {/* Heatmap Preview (if available) */}
              {project.heatmapImage && (
                <div className="mb-3">
                  <img
                    src={project.heatmapImage}
                    alt="Heatmap preview"
                    className="w-full h-24 object-cover rounded"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onOpenProject && onOpenProject(project)}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                >
                  <FolderOpen size={14} />
                  Open
                </button>
                <button
                  onClick={() => handleGeneratePDF(project)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                >
                  <FileText size={14} />
                  PDF
                </button>
                <button
                  onClick={() => handleExportExcel(project)}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                >
                  <Download size={14} />
                  Excel
                </button>
                <button
                  onClick={() => onDuplicateProject && onDuplicateProject(project)}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">No projects found</p>
          <p className="text-sm">Create a new project to get started</p>
        </div>
      )}
    </div>
  );
};

export default ProjectsDashboard;
