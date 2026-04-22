import React from 'react';
import { Clock, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import useStore from '../store/useStore';

const ProjectTimeline = ({ darkMode, onLoadVersion }) => {
  const history = useStore(state => state.history);
  const loadVersion = useStore(state => state.loadVersion);

  const getVersionStatus = (results) => {
    if (!results) return 'UNKNOWN';
    if (results.complies) return 'SAFE';
    return 'UNSAFE';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SAFE':
        return 'border-green-500 bg-green-500/10 text-green-400';
      case 'UNSAFE':
        return 'border-red-500 bg-red-500/10 text-red-400';
      default:
        return 'border-gray-500 bg-gray-500/10 text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SAFE':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'UNSAFE':
        return <AlertTriangle size={16} className="text-red-400" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const handleVersionClick = (version) => {
    if (loadVersion) {
      loadVersion(version.id);
    }
    if (onLoadVersion) {
      onLoadVersion(version);
    }
  };

  if (!history || history.length === 0) {
    return (
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock size={16} />
          <span>No design history available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock size={18} />
          Design History
        </h3>
        <span className="text-xs text-gray-500">{history.length} versions</span>
      </div>

      <div className="space-y-2">
        {history.slice(0, 10).map((version, index) => {
          const status = getVersionStatus(version.results);
          const statusClass = getStatusColor(status);
          const statusIcon = getStatusIcon(status);
          const date = new Date(version.timestamp);
          const timeAgo = getTimeAgo(date);

          return (
            <div
              key={version.id}
              onClick={() => handleVersionClick(version)}
              className={`border-l-4 p-3 rounded-r-lg cursor-pointer transition-all hover:opacity-80 ${statusClass} ${darkMode ? 'bg-gray-700/50' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {statusIcon}
                    <span className="text-sm font-semibold">
                      v{history.length - index}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {timeAgo}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Rg:</span>
                  <span className="ml-1 font-semibold">
                    {version.results?.Rg?.toFixed(2) || 'N/A'} Ω
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Em:</span>
                  <span className="ml-1 font-semibold">
                    {version.results?.Em?.toFixed(2) || 'N/A'} V
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className={`ml-1 font-semibold ${status === 'SAFE' ? 'text-green-400' : status === 'UNSAFE' ? 'text-red-400' : 'text-gray-400'}`}>
                    {status}
                  </span>
                </div>
              </div>

              {/* Version summary */}
              {version.summary && (
                <div className="mt-2 text-xs text-gray-400">
                  {version.summary.status === 'SAFE' ? '✅' : '❌'} {version.summary.status}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {history.length > 10 && (
        <div className="mt-3 text-center text-xs text-gray-500">
          +{history.length - 10} more versions
        </div>
      )}
    </div>
  );
};

// Helper function to get time ago string
const getTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default ProjectTimeline;
