import React from 'react';

export default function ContourControls({ 
  showContours, 
  numContours, 
  contourThickness,
  onShowContoursChange, 
  onNumContoursChange, 
  onContourThicknessChange 
}) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Equipotential Controls</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Show Contours Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Show Equipotential Lines
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={showContours}
                onChange={(e) => onShowContoursChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {showContours ? 'Enabled' : 'Disabled'}
              </span>
            </label>
            <div className="text-xs text-gray-600 mt-1">
              Toggle equipotential contour lines overlay
            </div>
          </div>
        </div>

        {/* Number of Contours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Contours
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={numContours}
              onChange={(e) => onNumContoursChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={!showContours}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Few (5)</span>
              <span>Levels: {numContours}</span>
              <span>Many (20)</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Number of equipotential levels to display
            </div>
          </div>
        </div>

        {/* Contour Thickness */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Line Thickness
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="4"
              step="0.5"
              value={contourThickness}
              onChange={(e) => onContourThicknessChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={!showContours}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Thin (1)</span>
              <span>Width: {contourThickness.toFixed(1)}px</span>
              <span>Thick (4)</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Line thickness for contour visualization
            </div>
          </div>
        </div>
      </div>

      {/* Engineering Info */}
      <div className="mt-4 p-3 bg-purple-50 rounded-lg">
        <h4 className="text-sm font-semibold text-purple-800 mb-2">Engineering Notes</h4>
        <ul className="text-xs text-purple-700 space-y-1">
          <li>Contour lines represent equipotential voltage levels</li>
          <li>Uses Marching Squares algorithm for accurate contour generation</li>
          <li>Color-coded to match voltage gradient (blue=low, red=high)</li>
          <li>Essential for identifying voltage concentration zones</li>
        </ul>
      </div>
    </div>
  );
}
