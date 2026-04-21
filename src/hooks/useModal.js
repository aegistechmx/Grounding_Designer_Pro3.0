import { useState, useCallback } from 'react';

/**
 * Hook personalizado para gestión de modales
 * @param {boolean} initialValue - Estado inicial del modal (default: false)
 * @returns {object} Estado y funciones para controlar el modal
 */
export const useModal = (initialValue = false) => {
  const [isOpen, setIsOpen] = useState(initialValue);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen
  };
};

export default useModal;
