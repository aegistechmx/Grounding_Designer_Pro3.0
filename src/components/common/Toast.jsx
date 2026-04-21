import React, { useState, useEffect } from 'react';

const Toast = ({ darkMode }) => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleShowToast = (event) => {
      const newToast = {
        id: Date.now(),
        ...event.detail,
        visible: true
      };
      setToasts(prev => [...prev, newToast]);
      
      // Auto-ocultar después de 5 segundos
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 5000);
    };

    window.addEventListener('showToast', handleShowToast);
    return () => window.removeEventListener('showToast', handleShowToast);
  }, []);

  const getIcon = (type) => {
    switch(type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '📌';
    }
  };

  const getBgColor = (type) => {
    if (darkMode) {
      switch(type) {
        case 'error': return 'bg-red-900/80 border-red-700';
        case 'warning': return 'bg-yellow-900/80 border-yellow-700';
        case 'success': return 'bg-green-900/80 border-green-700';
        default: return 'bg-blue-900/80 border-blue-700';
      }
    } else {
      switch(type) {
        case 'error': return 'bg-red-100 border-red-300';
        case 'warning': return 'bg-yellow-100 border-yellow-300';
        case 'success': return 'bg-green-100 border-green-300';
        default: return 'bg-blue-100 border-blue-300';
      }
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`p-3 rounded-lg border shadow-lg min-w-[280px] max-w-sm animate-slide-in-right ${getBgColor(toast.type)}`}
        >
          <div className="flex gap-2">
            <span className="text-xl">{getIcon(toast.type)}</span>
            <div className="flex-1">
              <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {toast.title}
              </p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Toast;