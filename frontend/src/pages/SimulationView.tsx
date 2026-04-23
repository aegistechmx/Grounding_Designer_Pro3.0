// src/pages/SimulationView.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsService } from '../services/projects.service';
import toast from 'react-hot-toast';

export const SimulationView: React.FC = () => {
  const { simulationId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('queued');
  const [results, setResults] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (simulationId) {
      const cleanup = pollStatus();
      return cleanup;
    }
  }, [simulationId]);

  const pollStatus = () => {
    const interval = setInterval(async () => {
      try {
        const data = await projectsService.getSimulationStatus(simulationId!);
        setStatus(data.status);
        setProgress(data.progress || 0);
        
        if (data.status === 'completed') {
          setResults(data.results);
          clearInterval(interval);
          toast.success('Simulación completada');
        } else if (data.status === 'failed') {
          clearInterval(interval);
          toast.error(data.error || 'Error en simulación');
        } else if (data.status === 'not_available' || data.status === 'not_found') {
          clearInterval(interval);
          toast.error(data.error || 'La simulación no está disponible');
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'processing': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'processing': return '⚡';
      default: return '⏳';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Simulación FEM</h1>
          </div>

          <div className="p-6">
            {/* Estado de simulación */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-500">Estado</span>
                  <div className={`text-lg font-semibold ${getStatusColor()}`}>
                    {getStatusIcon()} {status.toUpperCase()}
                  </div>
                </div>
                {status === 'processing' && (
                  <div className="text-sm text-gray-500">
                    Progreso: {Math.round(progress * 100)}%
                  </div>
                )}
              </div>
              {status === 'processing' && (
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* Resultados */}
            {results && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Resistencia de Malla</div>
                    <div className="text-2xl font-bold text-blue-900">{results.Rg?.toFixed(3)} Ω</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium">GPR</div>
                    <div className="text-2xl font-bold text-purple-900">{results.GPR?.toFixed(0)} V</div>
                  </div>
                  <div className={`p-4 rounded-lg ${results.compliance?.globalCompliant ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className={`text-sm font-medium ${results.compliance?.globalCompliant ? 'text-green-600' : 'text-red-600'}`}>
                      Cumplimiento Normativo
                    </div>
                    <div className={`text-2xl font-bold ${results.compliance?.globalCompliant ? 'text-green-900' : 'text-red-900'}`}>
                      {results.compliance?.globalCompliant ? '✓ CUMPLE' : '✗ NO CUMPLE'}
                    </div>
                  </div>
                </div>

                {/* Tensiones */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Verificación de Seguridad</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tensión de Contacto</span>
                      <div>
                        <span className="font-mono">{results.Em?.toFixed(0)} V</span>
                        <span className="mx-2 text-gray-400">/</span>
                        <span className="font-mono text-gray-500">{results.touchVoltage?.limit?.toFixed(0)} V</span>
                        {results.touchVoltage?.safe ? (
                          <span className="ml-2 text-green-600">✓</span>
                        ) : (
                          <span className="ml-2 text-red-600">✗</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tensión de Paso</span>
                      <div>
                        <span className="font-mono">{results.Es?.toFixed(0)} V</span>
                        <span className="mx-2 text-gray-400">/</span>
                        <span className="font-mono text-gray-500">{results.stepVoltage?.limit?.toFixed(0)} V</span>
                        {results.stepVoltage?.safe ? (
                          <span className="ml-2 text-green-600">✓</span>
                        ) : (
                          <span className="ml-2 text-red-600">✗</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Violaciones */}
                {results.compliance && !results.compliance.globalCompliant && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Violaciones Detectadas</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {results.compliance.ieee80?.violations?.map((v: string, i: number) => (
                        <li key={i} className="text-sm text-red-700">{v}</li>
                      ))}
                      {results.compliance.nom001?.violations?.map((v: string, i: number) => (
                        <li key={i} className="text-sm text-red-700">NOM-001: {v}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => navigate(`/compliance/${results.projectId}`)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Ver Reporte Completo
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Volver al Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
