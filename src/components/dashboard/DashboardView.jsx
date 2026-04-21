import React from 'react';
import { TrendingUp, TrendingDown, Shield, Zap, Activity, Gauge } from 'lucide-react';

const DashboardView = ({ calculations, params, darkMode }) => {
  if (!calculations) {
    return (
      <div className={`p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
        <p className="text-gray-500">Realice un cálculo para ver el dashboard</p>
      </div>
    );
  }

  const safetyMargin = calculations.Etouch70 && calculations.Em
    ? ((calculations.Etouch70 - calculations.Em) / calculations.Etouch70 * 100).toFixed(1)
    : '0';

  const getStatusColor = (value, goodValue, badValue) => {
    if (value <= goodValue) return 'text-green-600';
    if (value <= badValue) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressWidth = (value, max) => {
    return `${Math.min(100, (value / max) * 100)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between mb-2">
            <Shield size={24} className="text-blue-500" />
            <span className="text-xs text-gray-500">Seguridad</span>
          </div>
          <div className="text-2xl font-bold">{safetyMargin}%</div>
          <div className="text-sm text-gray-500">Margen de seguridad</div>
          <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${safetyMargin}%` }} />
          </div>
        </div>

        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between mb-2">
            <Zap size={24} className="text-yellow-500" />
            <span className="text-xs text-gray-500">Resistencia</span>
          </div>
          <div className="text-2xl font-bold">{calculations.Rg?.toFixed(2)} Ω</div>
          <div className="text-sm text-gray-500">Resistencia de malla</div>
          <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 rounded-full" style={{ width: getProgressWidth(calculations.Rg, 10) }} />
          </div>
        </div>

        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between mb-2">
            <Gauge size={24} className="text-purple-500" />
            <span className="text-xs text-gray-500">GPR</span>
          </div>
          <div className="text-2xl font-bold">{calculations.GPR?.toFixed(0)} V</div>
          <div className="text-sm text-gray-500">Elevación de potencial</div>
          <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: getProgressWidth(calculations.GPR, 15000) }} />
          </div>
        </div>

        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between mb-2">
            <Activity size={24} className="text-green-500" />
            <span className="text-xs text-gray-500">Corriente</span>
          </div>
          <div className="text-2xl font-bold">{calculations.Ig?.toFixed(0)} A</div>
          <div className="text-sm text-gray-500">Corriente en malla</div>
        </div>
      </div>

      {/* Gráficos de tensiones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} /> Tensión de Contacto (Em)
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Valor calculado</span>
              <span className="font-bold">{calculations.Em?.toFixed(0)} V</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Límite permisible</span>
              <span>{calculations.Etouch70?.toFixed(0)} V</span>
            </div>
            <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${calculations.touchSafe70 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${(calculations.Em / calculations.Etouch70) * 100}%` }}
              />
            </div>
            <div className={`text-sm font-semibold ${calculations.touchSafe70 ? 'text-green-600' : 'text-red-600'}`}>
              {calculations.touchSafe70 ? '✓ Cumple con IEEE 80' : '✗ No cumple con IEEE 80'}
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingDown size={18} /> Tensión de Paso (Es)
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Valor calculado</span>
              <span className="font-bold">{calculations.Es?.toFixed(0)} V</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Límite permisible</span>
              <span>{calculations.Estep70?.toFixed(0)} V</span>
            </div>
            <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${calculations.stepSafe70 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${(calculations.Es / calculations.Estep70) * 100}%` }}
              />
            </div>
            <div className={`text-sm font-semibold ${calculations.stepSafe70 ? 'text-green-600' : 'text-red-600'}`}>
              {calculations.stepSafe70 ? '✓ Cumple con IEEE 80' : '✗ No cumple con IEEE 80'}
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores de eficiencia */}
      <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <h4 className="font-semibold mb-3">📊 Indicadores de Eficiencia</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {((params.gridLength * params.gridWidth) || 0).toFixed(0)} m²
            </div>
            <div className="text-xs text-gray-500">Área de malla</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {calculations.totalConductor?.toFixed(0) || 0} m
            </div>
            <div className="text-xs text-gray-500">Conductor total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {params.numRods || 0}
            </div>
            <div className="text-xs text-gray-500">Varillas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {params.numParallel || 0}×{params.numParallelY || 0}
            </div>
            <div className="text-xs text-gray-500">Configuración</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;