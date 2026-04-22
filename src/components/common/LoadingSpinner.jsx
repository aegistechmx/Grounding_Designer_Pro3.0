import React from 'react';

const LoadingSpinner = ({ message, progress, steps, darkMode }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-6 rounded-lg shadow-xl w-96 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex flex-col items-center">
          {/* Spinner animado */}
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full animate-spin" style={{ borderTopColor: 'transparent' }}></div>
          </div>
          
          {/* Mensaje */}
          <p className={`text-center font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {message}
          </p>
          
          {/* Barra de progreso */}
          {progress !== undefined && (
            <div className="w-full mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className={`text-xs text-center mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {progress}% completado
              </p>
            </div>
          )}
          
          {/* Pasos */}
          {steps && steps.length > 0 && (
            <div className="w-full mt-3 text-xs">
              {steps.map((step, idx) => {
                const isActive = progress >= (idx / Math.max(1, steps.length)) * 100;
                return (
                  <div key={idx} className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={isActive ? 'text-green-600' : 'text-gray-400'}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;