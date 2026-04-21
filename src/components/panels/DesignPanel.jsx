import React from 'react';
import { InputField } from '../common/InputField';

export const DesignPanel = ({ params, calculations, updateParam, darkMode }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Panel Sistema Eléctrico */}
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
          <h3 className={`font-semibold mb-3 ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
            ⚡ Sistema Eléctrico
          </h3>
          
          <InputField
            label="Transformador (kVA)"
            name="transformerKVA"
            value={params.transformerKVA}
            onChange={(val) => updateParam('transformerKVA', val)}
            min={1}
            max={10000}
            step={10}
            unit="kVA"
            darkMode={darkMode}
          />
          
          <InputField
            label="Voltaje Primario (V)"
            name="primaryVoltage"
            value={params.primaryVoltage}
            onChange={(val) => updateParam('primaryVoltage', val)}
            min={120}
            max={50000}
            step={100}
            unit="V"
            darkMode={darkMode}
          />
          
          <InputField
            label="Voltaje Secundario (V)"
            name="secondaryVoltage"
            value={params.secondaryVoltage}
            onChange={(val) => updateParam('secondaryVoltage', val)}
            min={100}
            max={1000}
            step={10}
            unit="V"
            darkMode={darkMode}
          />
          
          <InputField
            label="Impedancia (%Z)"
            name="transformerImpedance"
            value={params.transformerImpedance}
            onChange={(val) => updateParam('transformerImpedance', val)}
            min={1}
            max={15}
            step={0.5}
            unit="%"
            darkMode={darkMode}
          />
          
          <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} mb-3`}>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Corriente de falla (Auto)
            </label>
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              {calculations?.faultCurrent?.toFixed(0) || 'N/A'} A
            </div>
          </div>
          
          <InputField
            label="Duración de falla (s)"
            name="faultDuration"
            value={params.faultDuration}
            onChange={(val) => updateParam('faultDuration', val)}
            min={0.1}
            max={10}
            step={0.05}
            unit="s"
            tooltip="Tiempo de despeje de la protección"
            darkMode={darkMode}
          />
          
          <InputField
            label="Factor Sf"
            name="currentDivisionFactor"
            value={params.currentDivisionFactor}
            onChange={(val) => updateParam('currentDivisionFactor', val)}
            min={0.1}
            max={0.8}
            step={0.01}
            unit=""
            tooltip="Fracción de corriente de falla que entra a la malla"
            darkMode={darkMode}
          />
        </div>

        <div className={`p-4 rounded-lg ${darkMode ? 'bg-amber-900/30' : 'bg-amber-50'}`}>
          <h3 className={`font-semibold mb-3 ${darkMode ? 'text-amber-300' : 'text-amber-900'}`}>
            🌍 Características del Suelo
          </h3>
          
          <InputField
            label="Resistividad del suelo (Ω·m)"
            name="soilResistivity"
            value={params.soilResistivity}
            onChange={(val) => updateParam('soilResistivity', val)}
            min={1}
            max={10000}
            step={10}
            unit="Ω·m"
            tooltip="Típico: 50-200 (húmedo), 200-1000 (seco)"
            darkMode={darkMode}
          />
          
          <InputField
            label="Resistividad capa superficial (Ω·m)"
            name="surfaceLayer"
            value={params.surfaceLayer}
            onChange={(val) => updateParam('surfaceLayer', val)}
            min={100}
            max={50000}
            step={500}
            unit="Ω·m"
            tooltip="Grava: 3000, Asfalto: 2000-5000"
            darkMode={darkMode}
          />
          
          <InputField
            label="Espesor capa superficial (m)"
            name="surfaceDepth"
            value={params.surfaceDepth}
            onChange={(val) => updateParam('surfaceDepth', val)}
            min={0.01}
            max={2}
            step={0.01}
            unit="m"
            darkMode={darkMode}
          />
        </div>
      </div>

      {/* Panel Configuración de Malla */}
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
          <h3 className={`font-semibold mb-3 ${darkMode ? 'text-green-300' : 'text-green-900'}`}>
            📐 Configuración de Malla
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Largo (m)"
              name="gridLength"
              value={params.gridLength}
              onChange={(val) => updateParam('gridLength', val)}
              min={1}
              max={100}
              step={1}
              unit="m"
              darkMode={darkMode}
            />
            <InputField
              label="Ancho (m)"
              name="gridWidth"
              value={params.gridWidth}
              onChange={(val) => updateParam('gridWidth', val)}
              min={1}
              max={100}
              step={1}
              unit="m"
              darkMode={darkMode}
            />
          </div>
        </div>

        <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
          <h3 className={`font-semibold mb-3 ${darkMode ? 'text-green-300' : 'text-green-900'}`}>
            📐 Configuración de Conductores
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Conductores en X"
              name="numParallel"
              value={params.numParallel}
              onChange={(val) => updateParam('numParallel', val)}
              min={2}
              max={30}
              step={1}
              unit=""
              tooltip="Número de conductores en dirección X"
              darkMode={darkMode}
            />
            <InputField
              label="Conductores en Y"
              name="numParallelY"
              value={params.numParallelY}
              onChange={(val) => updateParam('numParallelY', val)}
              min={2}
              max={30}
              step={1}
              unit=""
              tooltip="Número de conductores en dirección Y"
              darkMode={darkMode}
            />
          </div>
          
          <InputField
            label="Profundidad de malla (m)"
            name="gridDepth"
            value={params.gridDepth}
            onChange={(val) => updateParam('gridDepth', val)}
            min={0.1}
            max={5}
            step={0.1}
            unit="m"
            tooltip="Profundidad de enterramiento de la malla"
            darkMode={darkMode}
          />
        </div>

        <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
          <h3 className={`font-semibold mb-3 ${darkMode ? 'text-green-300' : 'text-green-900'}`}>
            📐 Configuración de Varillas
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Número de Varillas"
              name="numRods"
              value={params.numRods}
              onChange={(val) => updateParam('numRods', val)}
              min={0}
              max={100}
              step={5}
              unit=""
              tooltip="Cantidad de electrodos verticales"
              darkMode={darkMode}
            />
            <InputField
              label="Longitud de Varilla (m)"
              name="rodLength"
              value={params.rodLength}
              onChange={(val) => updateParam('rodLength', val)}
              min={0.5}
              max={10}
              step={0.3}
              unit="m"
              tooltip="Longitud de cada electrodo vertical"
              darkMode={darkMode}
            />
          </div>
          
          <div className="text-xs text-gray-500 mt-2">
            💡 Espaciamiento entre varillas: {((params.gridLength + params.gridWidth) * 2 / (params.numRods || 1)).toFixed(2)} m
          </div>
        </div>

        {/* Información del Diseño */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className={`font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            📊 Información del Diseño
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Área:</span>
            <span className="font-semibold">{calculations?.gridArea?.toFixed(1) || 'N/A'} m²</span>
            
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Conductor total:</span>
            <span className="font-semibold">{calculations?.totalConductor?.toFixed(0) || 'N/A'} m</span>
            
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Long. varillas:</span>
            <span className="font-semibold">{calculations?.totalRodLength?.toFixed(0) || 'N/A'} m</span>
            
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Sección mín. cond:</span>
            <span className="font-bold text-blue-600">{calculations?.minConductorArea?.toFixed(2) || 'N/A'} mm²</span>
          </div>
        </div>
      </div>
    </div>
  );
};