import { useState, useCallback } from 'react';

/**
 * Hook personalizado para gestión de notificaciones
 * @returns {object} Estado y funciones para controlar notificaciones
 */
export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 11);
    const newNotification = {
      id,
      timestamp: new Date().toISOString(),
      ...notification
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-dismiss after 5 seconds if autoDismiss is true
    if (notification.autoDismiss !== false) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const updateNotification = useCallback((id, updates) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, ...updates } : n
    ));
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    updateNotification
  };
};

export default useNotification;
