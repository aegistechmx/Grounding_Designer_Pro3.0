import React from 'react';
import { SafetyIndicator } from '../common/SafetyIndicator';

export const ResultsPanel = ({ calculations, recommendations, darkMode }) => {
  if (!calculations) return null;

  const safetyMarginTouch = calculations.Etouch70 && calculations.Em
    ? ((calculations.Etouch70 - calculations.Em) / calculations.Etouch70 * 100).toFixed(1)
    : '0';

  return (
    <div className={`p-4 md:p-6 rounded-lg mt-6 ${darkMode ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
      <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        🎯 Resultados de Cálculos
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Resistencia de Malla</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{calculations.Rg?.toFixed(2)} Ω</div>
          <div className="text-xs mt-1">
            {calculations.Rg < 2 ? '✓ Excelente' : calculations.Rg < 5 ? '✓ Buena' : '⚠ Mejorar'}
          </div>
        </div>
        
        <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>GPR (Elevación de Potencial)</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{calculations.GPR?.toFixed(0)} V</div>
        </div>
        
        <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Corriente de Falla (Ig)</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{calculations.Ig?.toFixed(0)} A</div>
        </div>
      </div>

      <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          Verificación de Seguridad IEEE 80
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Persona 50 kg:</div>
            <SafetyIndicator 
              safe={calculations.touchSafe50} 
              label={`Contacto: ${calculations.Em?.toFixed(0)}V < ${calculations.Etouch50?.toFixed(0)}V`}
              darkMode={darkMode}
            />
            <SafetyIndicator 
              safe={calculations.stepSafe50} 
              label={`Paso: ${calculations.Es?.toFixed(0)}V < ${calculations.Estep50?.toFixed(0)}V`}
              darkMode={darkMode}
            />
          </div>
          <div>
            <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Persona 70 kg:</div>
            <SafetyIndicator 
              safe={calculations.touchSafe70} 
              label={`Contacto: ${calculations.Em?.toFixed(0)}V < ${calculations.Etouch70?.toFixed(0)}V`}
              darkMode={darkMode}
            />
            <SafetyIndicator 
              safe={calculations.stepSafe70} 
              label={`Paso: ${calculations.Es?.toFixed(0)}V < ${calculations.Estep70?.toFixed(0)}V`}
              darkMode={darkMode}
            />
          </div>
        </div>

        {calculations.complies ? (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 rounded-lg p-3 flex items-start gap-2">
            <span className="text-green-600 text-xl">✓</span>
            <div>
              <div className="font-semibold text-green-800">✓ Diseño CUMPLE con IEEE 80</div>
              <div className="text-sm text-green-700">Los voltajes de paso y contacto están dentro de los límites seguros.</div>
            </div>
          </div>
        ) : (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 rounded-lg p-3 flex items-start gap-2">
            <span className="text-red-600 text-xl">⚠</span>
            <div>
              <div className="font-semibold text-red-800">⚠ Diseño NO CUMPLE con IEEE 80</div>
              <div className="text-sm text-red-700">Se requieren mejoras: agregar más varillas, aumentar conductores, reducir Sf, o mejorar capa superficial.</div>
            </div>
          </div>
        )}
      </div>

      {/* Recomendaciones */}
      {recommendations && recommendations.length > 0 && (
        <div className={`border-l-4 border-yellow-400 p-4 mt-6 ${darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
          <h4 className={`font-semibold mb-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-900'}`}>💡 Recomendaciones:</h4>
          <ul className={`text-sm space-y-1 ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
            {recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};