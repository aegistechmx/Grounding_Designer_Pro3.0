// src/components/notifications/ToastNotifications.jsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const safeMessage = message || 'Notification';
    const safeType = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
    const safeDuration = Math.max(0, duration || 3000);
    
    setToasts(prev => [...prev, { id, message: safeMessage, type: safeType }]);
    
    if (safeDuration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, safeDuration);
    }
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onRemove }) => {
  if (!toast) return null;
  
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  };

  const safeType = ['success', 'error', 'warning', 'info'].includes(toast.type) ? toast.type : 'info';
  const safeMessage = toast.message || 'Notification';
  
  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg ${bgColors[safeType]}`}>
      {icons[safeType]}
      <p className="flex-1 text-sm text-gray-800 dark:text-gray-200">{safeMessage}</p>
      <button
        onClick={onRemove}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ToastProvider;
