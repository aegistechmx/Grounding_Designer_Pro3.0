import React from 'react';
import { TrendingUp, TrendingDown, CheckCircle, XCircle, Zap } from 'lucide-react';

const MetricCard = ({ label, value, unit = '', color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800'
  };
  
  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-bold">{value} {unit}</div>
    </div>
  );
};

const MetricCompare = ({ label, before, after, unit = '', lowerIsBetter = true }) => {
  const diff = after - before;
  const percent = before !== 0 ? (diff / before) * 100 : 0;
  const isImprovement = (lowerIsBetter && diff < 0) || (!lowerIsBetter && diff > 0);
  
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
      <span className="text-sm font-medium">{label}</span>
      <div className="text-right">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 line-through">{before.toFixed(1)}</span>
          <span className="text-sm font-bold text-green-600">{after.toFixed(1)}</span>
          <span className={`text-xs ${isImprovement ? 'text-green-600' : 'text-red-600'}`}>
            {isImprovement ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            {Math.abs(percent).toFixed(1)}%
          </span>
        </div>
        <div className="text-xs text-gray-500">{unit}</div>
      </div>
    </div>
  );
};

const DesignComparator = ({ base, optimized, darkMode }) => {
  if (!base || !optimized) {
    return (
      <div className={`p-8 text-center rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <p className="text-gray-500">Ejecute una optimización para ver la comparación</p>
      </div>
    );
  }

  const improvements = {
    resistance: base.resistance > 0 ? ((base.resistance - optimized.resistance) / base.resistance * 100).toFixed(1) : '0',
    touch: base.touch > 0 ? ((base.touch - optimized.touch) / base.touch * 100).toFixed(1) : '0',
    step: base.step > 0 ? ((base.step - optimized.step) / base.step * 100).toFixed(1) : '0',
    cost: base.cost > 0 ? ((base.cost - optimized.cost) / base.cost * 100).toFixed(1) : '0'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Diseño Base */}
      <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <h3 className="font-semibold">Diseño Original</h3>
        </div>
        
        <div className="space-y-3">
          <MetricCard label="Resistencia (Rg)" value={base.resistance.toFixed(2)} unit="Ω" color="blue" />
          <MetricCard label="Tensión Contacto" value={base.touch.toFixed(0)} unit="V" color={base.touchOk ? 'green' : 'red'} />
          <MetricCard label="Tensión Paso" value={base.step.toFixed(0)} unit="V" color={base.stepOk ? 'green' : 'red'} />
          <MetricCard label="Costo Estimado" value={base.cost.toLocaleString()} unit="MXN" color="yellow" />
          
          <div className={`mt-3 p-2 rounded-lg ${base.complies ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            <div className="flex items-center gap-2 text-sm">
              {base.complies ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-600" />}
              <span>{base.complies ? 'Cumple IEEE 80' : 'No cumple IEEE 80'}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Diseño Optimizado */}
      <div className={`p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-lg border-2 border-green-500`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="font-semibold flex items-center gap-2">
            <Zap size={16} className="text-green-500" />
            Diseño Optimizado
          </h3>
          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Recomendado</span>
        </div>
        
        <div className="space-y-3">
          <MetricCompare label="Resistencia" before={base.resistance} after={optimized.resistance} unit="Ω" lowerIsBetter />
          <MetricCompare label="Tensión Contacto" before={base.touch} after={optimized.touch} unit="V" lowerIsBetter />
          <MetricCompare label="Tensión Paso" before={base.step} after={optimized.step} unit="V" lowerIsBetter />
          <MetricCompare label="Costo" before={base.cost} after={optimized.cost} unit="MXN" lowerIsBetter />
          
          <div className="mt-3 p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={16} className="text-green-600" />
              <span>Cumple IEEE 80</span>
              <span className="ml-auto text-xs text-green-600">
                Mejora total: {(
                  (improvements.resistance + improvements.touch + improvements.step + improvements.cost) / 4
                ).toFixed(0)}% promedio
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Resumen de mejoras */}
      <div className="lg:col-span-2 mt-2">
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <h4 className="font-semibold text-sm mb-2">Resumen de mejoras</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="text-center">
              <div className="text-green-600 font-bold">↓ {improvements.resistance}%</div>
              <div className="text-xs text-gray-500">Resistencia</div>
            </div>
            <div className="text-center">
              <div className="text-green-600 font-bold">↓ {improvements.touch}%</div>
              <div className="text-xs text-gray-500">Contacto</div>
            </div>
            <div className="text-center">
              <div className="text-green-600 font-bold">↓ {improvements.step}%</div>
              <div className="text-xs text-gray-500">Paso</div>
            </div>
            <div className="text-center">
              <div className="text-green-600 font-bold">↓ {improvements.cost}%</div>
              <div className="text-xs text-gray-500">Costo</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignComparator;
