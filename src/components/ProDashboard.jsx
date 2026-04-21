import React, { useState } from 'react';
import FEMHeatmap from './FEMHeatmap';
import { Zap, Shield, TrendingUp, DollarSign } from 'lucide-react';

const ProDashboard = ({ params, calculations, darkMode }) => {
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Definir fuentes (electrodos) basados en las varillas
  const sources = [
    { x: 0.3, y: 0.3, voltage: 1 },
    { x: 0.7, y: 0.3, voltage: 1 },
    { x: 0.5, y: 0.7, voltage: 1 },
    { x: 0.2, y: 0.8, voltage: 0.8 },
    { x: 0.8, y: 0.8, voltage: 0.8 }
  ];

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">🗺️ Simulación de Campo Eléctrico (FEM)</h2>
        <div className="text-sm text-gray-500">
          Solver: Gauss-Seidel | Malla: 80×50 | Iteraciones: 100
        </div>
      </div>
      
      {/* Heatmap ETAP */}
      <FEMHeatmap
        width={800}
        height={500}
        gridWidth={80}
        gridHeight={50}
        iterations={120}
        sources={sources}
        darkMode={darkMode}
        showLegend={true}
        onValueClick={(point) => setSelectedPoint(point)}
      />
      
      {/* Resultados en tiempo real */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Shield size={20} className="mx-auto mb-1 text-blue-500" />
          <div className="text-xl font-bold">{calculations?.Rg?.toFixed(2) || 'N/A'} Ω</div>
          <div className="text-xs text-gray-500">Resistencia de Malla</div>
        </div>
        <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Zap size={20} className="mx-auto mb-1 text-yellow-500" />
          <div className="text-xl font-bold">{calculations?.GPR?.toFixed(0) || 'N/A'} V</div>
          <div className="text-xs text-gray-500">GPR</div>
        </div>
        <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <TrendingUp size={20} className="mx-auto mb-1 text-green-500" />
          <div className="text-xl font-bold">{calculations?.Em?.toFixed(0) || 'N/A'} V</div>
          <div className="text-xs text-gray-500">Tensión Contacto</div>
        </div>
        <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <DollarSign size={20} className="mx-auto mb-1 text-purple-500" />
          <div className="text-xl font-bold">
            ${((calculations?.totalConductor || 0) * 12).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Costo Estimado</div>
        </div>
      </div>
      
      {/* Info del punto seleccionado en el heatmap */}
      {selectedPoint && (
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <h4 className="font-semibold mb-2">🔍 Punto seleccionado en el mapa</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Posición:</span>
              <span className="ml-2 font-medium">({selectedPoint.x.toFixed(2)}, {selectedPoint.y.toFixed(2)})</span>
            </div>
            <div>
              <span className="text-gray-500">Potencial:</span>
              <span className="ml-2 font-medium text-blue-600">{selectedPoint.value.toFixed(3)} V</span>
            </div>
            <div>
              <span className="text-gray-500">Campo Ex:</span>
              <span className="ml-2 font-medium">{selectedPoint.gradient.ex.toFixed(3)} V/m</span>
            </div>
            <div>
              <span className="text-gray-500">Campo Ey:</span>
              <span className="ml-2 font-medium">{selectedPoint.gradient.ey.toFixed(3)} V/m</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Nota del solver */}
      <div className="text-xs text-gray-500 text-center">
        🔬 Solución numérica de la ecuación de Laplace mediante método de Gauss-Seidel.
        Las líneas blancas representan equipotenciales. Puntos blancos = electrodos.
      </div>
    </div>
  );
};

export default ProDashboard;
