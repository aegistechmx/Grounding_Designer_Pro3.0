import React from 'react';

export default function HeatmapControls({ 
  interpolationPower, 
  smoothingLevel, 
  onInterpolationPowerChange, 
  onSmoothingLevelChange 
}) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Visualization Controls</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Interpolation Method Control */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interpolation Method
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="4"
              step="0.5"
              value={interpolationPower}
              onChange={(e) => onInterpolationPowerChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Smooth (1)</span>
              <span>Power: {interpolationPower.toFixed(1)}</span>
              <span>Sharp (4)</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Lower values create smoother gradients, higher values preserve local variations
            </div>
          </div>
        </div>

        {/* Smoothing Level Control */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Smoothing Level
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={smoothingLevel}
              onChange={(e) => onSmoothingLevelChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Precise (0)</span>
              <span>Level: {smoothingLevel.toFixed(1)}</span>
              <span>Smooth (1)</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Controls grid resolution and blur effect for continuous field visualization
            </div>
          </div>
        </div>
      </div>

      {/* Engineering Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Engineering Notes</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>Interpolation uses Inverse Distance Weighting (IDW) algorithm</li>
          <li>Grid bounds enforced to prevent extrapolation artifacts</li>
          <li>Near-node constraint avoids unrealistic values</li>
          <li>Higher resolution = smoother visualization but slower rendering</li>
        </ul>
      </div>
    </div>
  );
}
