import React from 'react';

const ETAPVisualizationControls = ({
  interpolationPower = 2,
  smoothingLevel = 0.5,
  showContours = true,
  numContours = 10,
  contourThickness = 2,
  onInterpolationPowerChange,
  onSmoothingLevelChange,
  onShowContoursChange,
  onNumContoursChange,
  onContourThicknessChange,
  darkMode = false
}) => {
  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} mb-4`}>
      <h3 className="text-lg font-semibold mb-4">🎨 ETAP Level Visualization Controls</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* IDW Interpolation Controls */}
        <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
          <h4 className="font-medium mb-3 text-sm">IDW Interpolation</h4>
          
          <div className="mb-3">
            <label className="block text-xs mb-1">
              Interpolation Power: {interpolationPower}
            </label>
            <input
              type="range"
              min="1"
              max="4"
              step="0.1"
              value={interpolationPower}
              onChange={(e) => onInterpolationPowerChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-gray-500 mt-1">
              1 = Smooth, 4 = Sharp
            </div>
          </div>
          
          <div>
            <label className="block text-xs mb-1">
              Smoothing Level: {smoothingLevel.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={smoothingLevel}
              onChange={(e) => onSmoothingLevelChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-gray-500 mt-1">
              0 = No smoothing, 1 = Maximum smoothing
            </div>
          </div>
        </div>
        
        {/* Contour Lines Controls */}
        <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
          <h4 className="font-medium mb-3 text-sm">Equipotential Contours</h4>
          
          <div className="mb-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showContours}
                onChange={(e) => onShowContoursChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm">Show Contours</span>
            </label>
          </div>
          
          <div className="mb-3">
            <label className="block text-xs mb-1">
              Number of Levels: {numContours}
            </label>
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={numContours}
              onChange={(e) => onNumContoursChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-xs mb-1">
              Line Thickness: {contourThickness}px
            </label>
            <input
              type="range"
              min="1"
              max="4"
              step="0.5"
              value={contourThickness}
              onChange={(e) => onContourThicknessChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
      
      <div className={`mt-4 p-3 rounded ${darkMode ? 'bg-blue-900' : 'bg-blue-50'}`}>
        <h4 className="font-medium mb-2 text-sm">📊 Engineering Notes</h4>
        <ul className="text-xs space-y-1">
          <li>• IDW Interpolation: Creates smooth continuous voltage fields from discrete node data</li>
          <li>• Equipotential Contours: Marching Squares algorithm for professional ETAP-level visualization</li>
          <li>• Heatmap + Isolines = Professional Engineering Analysis</li>
        </ul>
      </div>
    </div>
  );
};

export default ETAPVisualizationControls;
