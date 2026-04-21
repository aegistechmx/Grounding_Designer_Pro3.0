import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';

const ToastNotifications = ({ notifications = [], onClose, darkMode }) => {
  const [visible, setVisible] = useState({});
  const timersRef = useRef([]);
  const animationRef = useRef(null);

  // ============================================
  // FUNCIONES AUXILIARES
  // ============================================
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const closeNotification = useCallback((id) => {
    setVisible(prev => ({ ...prev, [id]: false }));
    setTimeout(() => {
      if (onClose && typeof onClose === 'function') {
        onClose(id);
      }
    }, 300);
  }, [onClose]);

  // ============================================
  // EFECTO PARA MANEJAR NOTIFICACIONES
  // ============================================
  useEffect(() => {
    // Limpiar timers anteriores
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];

    // Mostrar nuevas notificaciones
    safeNotifications.forEach(notif => {
      if (!notif || !notif.id) return;
      
      setVisible(prev => ({ ...prev, [notif.id]: true }));
      
      const timer = setTimeout(() => {
        setVisible(prev => ({ ...prev, [notif.id]: false }));
        setTimeout(() => {
          if (onClose && typeof onClose === 'function') {
            onClose(notif.id);
          }
        }, 300);
      }, notif.duration || 5000);
      
      timersRef.current.push(timer);
    });

    // Cleanup al desmontar
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, [safeNotifications, onClose]);

  // ============================================
  // FUNCIÓN PARA OBTENER ICONO
  // ============================================
  const getIcon = (type) => {
    switch(type) {
      case 'error': return <AlertCircle className="text-red-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'success': return <CheckCircle className="text-green-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  // ============================================
  // FUNCIÓN PARA OBTENER COLOR DE FONDO
  // ============================================
  const getBgColor = (type) => {
    if (darkMode) {
      switch(type) {
        case 'error': return 'bg-red-900/40 border-red-700';
        case 'warning': return 'bg-yellow-900/40 border-yellow-700';
        case 'success': return 'bg-green-900/40 border-green-700';
        default: return 'bg-blue-900/40 border-blue-700';
      }
    } else {
      switch(type) {
        case 'error': return 'bg-red-50 border-red-200';
        case 'warning': return 'bg-yellow-50 border-yellow-200';
        case 'success': return 'bg-green-50 border-green-200';
        default: return 'bg-blue-50 border-blue-200';
      }
    }
  };

  // ============================================
  // FUNCIÓN PARA OBTENER COLOR DE TEXTO
  // ============================================
  const getTextColor = (type) => {
    if (darkMode) {
      switch(type) {
        case 'error': return 'text-red-300';
        case 'warning': return 'text-yellow-300';
        case 'success': return 'text-green-300';
        default: return 'text-blue-300';
      }
    } else {
      switch(type) {
        case 'error': return 'text-red-800';
        case 'warning': return 'text-yellow-800';
        case 'success': return 'text-green-800';
        default: return 'text-blue-800';
      }
    }
  };

  // ============================================
  // FUNCIÓN PARA MANEJAR ACCIÓN
  // ============================================
  const handleAction = (notif) => {
    if (notif.action === 'Usar "Proponer Malla Optimizada"') {
      window.dispatchEvent(new CustomEvent('optimizeGrid'));
    } else if (notif.onAction && typeof notif.onAction === 'function') {
      notif.onAction();
    }
    closeNotification(notif.id);
  };

  // Si no hay notificaciones, no renderizar nada
  if (safeNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 w-80">
      {safeNotifications.map(notif => {
        if (!notif || !notif.id) return null;
        
        return visible[notif.id] && (
          <div
            key={notif.id}
            className={`p-3 rounded-lg border shadow-lg transition-all duration-300 ${getBgColor(notif.type)} animate-slide-in-right`}
            role="alert"
            aria-live="polite"
          >
            <div className="flex gap-2">
              {/* Icono */}
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>
              
              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${getTextColor(notif.type)}`}>
                  {notif.title || 'Notificación'}
                </p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {notif.message || ''}
                </p>
                {notif.action && (
                  <button 
                    onClick={() => handleAction(notif)}
                    className="text-xs font-medium mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline transition"
                  >
                    {notif.action} →
                  </button>
                )}
              </div>
              
              {/* Botón cerrar */}
              <button 
                onClick={() => closeNotification(notif.id)} 
                className={`flex-shrink-0 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition`}
                aria-label="Cerrar notificación"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
      
      {/* Estilos de animación */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ToastNotifications;