import React from 'react';

export const InputField = ({ 
  label, 
  name, 
  value, 
  onChange, 
  min, 
  max, 
  step, 
  unit, 
  tooltip, 
  darkMode 
}) => {
  const handleChange = (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onChange(val);
    }
  };

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {tooltip && <span className="ml-1 text-xs text-gray-400 cursor-help" title={tooltip}>ⓘ</span>}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md ${
            darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
          }`}
          min={min}
          max={max}
          step={step}
        />
        {unit && <span className="text-sm text-gray-500 dark:text-gray-400 w-12">{unit}</span>}
      </div>
    </div>
  );
};