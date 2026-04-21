import React from 'react';

// Definición de rutas para futura expansión
export const routes = {
  home: '/',
  design: '/design',
  dashboard: '/dashboard',
  visualization: '/visualization',
  validation: '/validation',
  optimization: '/optimization',
  feeders: '/feeders',
  normatives: '/normatives',
  reports: '/reports'
};

export const getRouteTitle = (path) => {
  const titles = {
    [routes.home]: 'Diseño de Malla',
    [routes.design]: 'Diseño de Malla',
    [routes.dashboard]: 'Dashboard',
    [routes.visualization]: 'Visualizaciones',
    [routes.validation]: 'Validación',
    [routes.optimization]: 'Optimización',
    [routes.feeders]: 'Alimentadores',
    [routes.normatives]: 'Normativas',
    [routes.reports]: 'Reportes'
  };
  return titles[path] || 'Grounding Designer Pro';
};