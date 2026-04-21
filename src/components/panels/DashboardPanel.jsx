import React, { useState } from 'react';
import { TrendingUp, Shield, DollarSign, Clock, Zap, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';
import DashboardView from '../dashboard/DashboardView';
import PredictiveAI from '../ai/PredictiveAI';

export const DashboardPanel = ({ params, calculations, darkMode }) => {
  const [showPredictions, setShowPredictions] = useState(true);

  if (!calculations) {
    return (
      <div className={`p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
        <p className="text-gray-500">Realice un cálculo para ver el dashboard</p>
      </div>
    );
  }

  // Calcular métricas del dashboard
  const safetyMargin = calculations.Etouch70 && calculations.Etouch70 > 0 && calculations.Em !== undefined
    ? ((calculations.Etouch70 - calculations.Em) / calculations.Etouch70 * 100).toFixed(1)
    : '0';

  const efficiencyScore = calculations.Rg && calculations.Rg > 0
    ? Math.min(100, (5 / calculations.Rg) * 20).toFixed(0)
    : '0';

  const costScore = params.numParallel && params.numRods
    ? Math.min(100, Math.max(0, 100 - ((params.numParallel * params.numRods) / 1000 * 100))).toFixed(0)
    : '50';

  const overallScore = (
    (parseFloat(safetyMargin) * 0.5) +
    (parseFloat(efficiencyScore) * 0.3) +
    (parseFloat(costScore) * 0.2)
  ).toFixed(0);

  return (
    <div className="space-y-6">
      {/* Score Principal */}
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}>
        <div className="text-center">
          <div className="text-5xl font-bold mb-2">{overallScore}%</div>
          <div className="text-sm text-gray-500">Score General de Diseño</div>
          <div className="mt-2 flex justify-center gap-4">
            <span className={`px-2 py-1 rounded-full text-xs ${calculations.complies ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {calculations.complies ? '✓ Cumple IEEE 80' : '✗ No cumple IEEE 80'}
            </span>
          </div>
        </div>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <Shield size={24} className="text-blue-500 mb-2" />
          <div className="text-2xl font-bold">{safetyMargin}%</div>
          <div className="text-xs text-gray-500">Margen Seguridad</div>
          <div className="mt-1 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${safetyMargin}%` }} />
          </div>
        </div>
        
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <Zap size={24} className="text-yellow-500 mb-2" />
          <div className="text-2xl font-bold">{efficiencyScore}%</div>
          <div className="text-xs text-gray-500">Eficiencia</div>
          <div className="mt-1 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${efficiencyScore}%` }} />
          </div>
        </div>
        
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <DollarSign size={24} className="text-green-500 mb-2" />
          <div className="text-2xl font-bold">{costScore}%</div>
          <div className="text-xs text-gray-500">Costo Estimado</div>
          <div className="mt-1 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${costScore}%` }} />
          </div>
        </div>
        
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <Clock size={24} className="text-purple-500 mb-2" />
          <div className="text-2xl font-bold">{calculations.Rg?.toFixed(2)} Ω</div>
          <div className="text-xs text-gray-500">Resistencia Malla</div>
          <div className="mt-1 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (calculations.Rg / 5) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Dashboard Principal */}
      <DashboardView calculations={calculations} params={params} darkMode={darkMode} />
      
      {/* IA Predictiva */}
      {showPredictions && (
        <PredictiveAI params={params} calculations={calculations} darkMode={darkMode} />
      )}
      
      {/* Botón para mostrar/ocultar IA */}
      <div className="text-center">
        <button
          onClick={() => setShowPredictions(!showPredictions)}
          className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {showPredictions ? '▲ Ocultar análisis IA' : '▼ Mostrar análisis IA'}
        </button>
      </div>
    </div>
  );
};