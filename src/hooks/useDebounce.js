import { useEffect, useState } from 'react';

/**
 * Hook de debounce para retrasar la ejecución de cálculos costosos
 * @param {any} value - Valor a debounce
 * @param {number} delay - Retraso en milisegundos (default: 300ms)
 * @returns {any} Valor debounced
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;