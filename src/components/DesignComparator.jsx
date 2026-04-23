import React from 'react';
import { TrendingUp, TrendingDown, CheckCircle, XCircle, Zap } from 'lucide-react';
import IEEESection from './common/IEEESection';

const MetricCard = ({ label, value, unit = '', color = 'blue' }) => {
  const colorClasses = {
    blue: { bg: 'bg-gray-800', border: 'border-blue-500', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]', text: 'text-blue-400' },
    green: { bg: 'bg-gray-800', border: 'border-green-500', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]', text: 'text-green-400' },
    red: { bg: 'bg-gray-800', border: 'border-red-500', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]', text: 'text-red-400' },
    yellow: { bg: 'bg-gray-800', border: 'border-yellow-500', glow: 'shadow-[0_0_15px_rgba(234,179,8,0.3)]', text: 'text-yellow-400' }
  };
  
  const classes = colorClasses[color];
  
  return (
    <div className={`p-3 rounded-lg border-2 ${classes.bg} ${classes.border} ${classes.glow}`}>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-xl font-bold text-white">{value} <span className="text-sm text-gray-400">{unit}</span></div>
    </div>
  );
};

const MetricCompare = ({ label, before, after, unit = '', lowerIsBetter = true }) => {
  const diff = after - before;
  const percent = before !== 0 ? (diff / before) * 100 : 0;
  const isImprovement = (lowerIsBetter && diff < 0) || (!lowerIsBetter && diff > 0);
  
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-700">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      <div className="text-right">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 line-through">{isFinite(before) ? before.toFixed(1) : 'N/A'}</span>
          <span className="text-sm font-bold text-green-400">{isFinite(after) ? after.toFixed(1) : 'N/A'}</span>
          <span className={`text-xs ${isImprovement ? 'text-green-400' : 'text-red-400'}`}>
            {isImprovement ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            {isFinite(Math.abs(percent)) ? Math.abs(percent).toFixed(1) : 'N/A'}%
          </span>
        </div>
        <div className="text-xs text-gray-400">{unit}</div>
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
    resistance: base.resistance > 0 && isFinite((base.resistance - optimized.resistance) / base.resistance * 100) ? ((base.resistance - optimized.resistance) / base.resistance * 100).toFixed(1) : '0',
    touch: base.touch > 0 && isFinite((base.touch - optimized.touch) / base.touch * 100) ? ((base.touch - optimized.touch) / base.touch * 100).toFixed(1) : '0',
    step: base.step > 0 && isFinite((base.step - optimized.step) / base.step * 100) ? ((base.step - optimized.step) / base.step * 100).toFixed(1) : '0',
    cost: base.cost > 0 && isFinite((base.cost - optimized.cost) / base.cost * 100) ? ((base.cost - optimized.cost) / base.cost * 100).toFixed(1) : '0'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Diseño Base */}
      <IEEESection
        title="📋 Diseño Original"
        darkMode={darkMode}
        metrics={[
          { label: "Resistencia (Rg)", value: `${isFinite(base.resistance || 0) ? (base.resistance || 0).toFixed(2) : 'N/A'} Ω` },
          { label: "Tensión Contacto", value: `${isFinite(base.touch || 0) ? (base.touch || 0).toFixed(0) : 'N/A'} V`, highlight: base.touchOk ? 'text-green-400' : 'text-red-400' },
          { label: "Tensión Paso", value: `${isFinite(base.step || 0) ? (base.step || 0).toFixed(0) : 'N/A'} V`, highlight: base.stepOk ? 'text-green-400' : 'text-red-400' },
          { label: "Costo Estimado", value: `${isFinite(base.cost || 0) ? (base.cost || 0).toLocaleString() : 'N/A'} MXN` },
          { label: "Estado", value: base.complies ? 'Cumple' : 'No cumple', highlight: base.complies ? 'text-green-400' : 'text-red-400' },
          { label: "Seguridad", value: base.touchOk && base.stepOk ? 'OK' : 'Revisar' }
        ]}
        info={
          <>
            {base.complies ? <CheckCircle size={12} className="flex-shrink-0 mt-0.5 text-green-400" /> : <XCircle size={12} className="flex-shrink-0 mt-0.5 text-red-400" />}
            <strong>Estado:</strong> {base.complies ? '✓ Cumple con IEEE 80' : '✗ No cumple con IEEE 80'}
          </>
        }
        info2={
          <>
            <strong>📐 Verificación:</strong> Diseño base con parámetros iniciales del proyecto.
          </>
        }
      />
      
      {/* Diseño Optimizado */}
      <IEEESection
        title="⚡ Diseño Optimizado"
        darkMode={darkMode}
        variant="green"
        icon={Zap}
        metrics={[
          { label: "Resistencia", value: `${isFinite(optimized.resistance || 0) ? (optimized.resistance || 0).toFixed(2) : 'N/A'} Ω` },
          { label: "Tensión Contacto", value: `${isFinite(optimized.touch || 0) ? (optimized.touch || 0).toFixed(0) : 'N/A'} V` },
          { label: "Tensión Paso", value: `${isFinite(optimized.step || 0) ? (optimized.step || 0).toFixed(0) : 'N/A'} V` },
          { label: "Costo", value: `${isFinite(optimized.cost || 0) ? (optimized.cost || 0).toLocaleString() : 'N/A'} MXN` },
          { label: "Mejora R", value: `${improvements.resistance}%`, highlight: 'text-green-400' },
          { label: "Mejora Total", value: `${((parseFloat(improvements.resistance) + parseFloat(improvements.touch) + parseFloat(improvements.step) + parseFloat(improvements.cost)) / 4).toFixed(0)}%`, highlight: 'text-green-400' }
        ]}
        info={
          <>
            <CheckCircle size={12} className="flex-shrink-0 mt-0.5 text-green-400" />
            <strong>Mejora total:</strong> {((parseFloat(improvements.resistance) + parseFloat(improvements.touch) + parseFloat(improvements.step) + parseFloat(improvements.cost)) / 4).toFixed(0)}% promedio en todas las métricas
          </>
        }
        info2={
          <>
            <strong>📐 Optimización:</strong> Diseño mejorado con algoritmo de optimización IEEE 80.
          </>
        }
      />
      
      {/* Resumen de mejoras */}
      <div className="lg:col-span-2 mt-2">
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`} style={{ boxShadow: darkMode ? '0 0 15px rgba(59, 130, 246, 0.3), inset 0 0 8px rgba(59, 130, 246, 0.15)' : '0 0 15px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.1)' }}>
          <h4 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
            <TrendingUp size={16} /> 📊 Resumen de Mejoras
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className={`p-2 rounded ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
              <div className={`font-semibold mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Resistencia</div>
              <div className={`text-lg font-bold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>↓ {improvements.resistance}%</div>
            </div>
            <div className={`p-2 rounded ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
              <div className={`font-semibold mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Tensión Contacto</div>
              <div className={`text-lg font-bold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>↓ {improvements.touch}%</div>
            </div>
            <div className={`p-2 rounded ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
              <div className={`font-semibold mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Tensión Paso</div>
              <div className={`text-lg font-bold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>↓ {improvements.step}%</div>
            </div>
            <div className={`p-2 rounded ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
              <div className={`font-semibold mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Costo</div>
              <div className={`text-lg font-bold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>↓ {improvements.cost}%</div>
            </div>
          </div>
          <div className={`mt-3 p-2 rounded ${darkMode ? 'bg-blue-900/40' : 'bg-blue-200'}`}>
            <p className={`text-xs flex items-start gap-2 ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
              <TrendingUp size={12} className="flex-shrink-0 mt-0.5" />
              <span>
                <strong>💡 Impacto global:</strong> El diseño optimizado mejora significativamente todos los parámetros de seguridad y eficiencia.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignComparator;
