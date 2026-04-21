import React from 'react';

/**
 * Componente Skeleton para estados de carga
 * @param {object} props - Props del componente
 * @param {string} props.className - Clases CSS adicionales
 * @param {string} props.width - Ancho del skeleton
 * @param {string} props.height - Alto del skeleton
 * @param {boolean} props.circle - Si es circular
 * @param {boolean} props.rounded - Si tiene bordes redondeados
 */
export const Skeleton = ({ 
  className = '', 
  width = '100%', 
  height = '1rem', 
  circle = false,
  rounded = true 
}) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${circle ? 'rounded-full' : rounded ? 'rounded' : ''} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
      role="presentation"
    />
  );
};

/**
 * Componente Skeleton para tarjetas
 */
export const CardSkeleton = () => (
  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
    <div className="flex items-center space-x-4 mb-4">
      <Skeleton width={48} height={48} circle />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton width="100%" height={12} />
      <Skeleton width="100%" height={12} />
      <Skeleton width="80%" height={12} />
    </div>
  </div>
);

/**
 * Componente Skeleton para tablas
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-2">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} width={colIndex === 0 ? '40%' : '15%'} height={12} />
        ))}
      </div>
    ))}
  </div>
);

/**
 * Componente Skeleton para gráficos
 */
export const ChartSkeleton = ({ height = 200 }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton width="30%" height={20} />
      <Skeleton width="20%" height={16} />
    </div>
    <div className="space-y-2">
      <Skeleton width="100%" height={height} rounded={false} />
    </div>
  </div>
);

/**
 * Componente Skeleton para listas
 */
export const ListSkeleton = ({ items = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3">
        <Skeleton width={40} height={40} circle />
        <div className="flex-1 space-y-2">
          <Skeleton width="70%" height={14} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Componente Skeleton para inputs
 */
export const InputSkeleton = ({ width = '100%' }) => (
  <div className="space-y-2">
    <Skeleton width="30%" height={14} />
    <Skeleton width={width} height={40} />
  </div>
);

export default Skeleton;
