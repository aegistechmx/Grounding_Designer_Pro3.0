// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsService, Project } from '../services/projects.service';
import { getUser } from '../services/auth.service';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectsService.getAll();
      setProjects(data);
    } catch (error) {
      toast.error('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    navigate('/projects/new');
  };

  const handleRunSimulation = async (projectId: string) => {
    try {
      const result = await projectsService.runSimulation(projectId);
      toast.success(`Simulación iniciada: ${result.simulationId}`);
      navigate(`/simulation/${result.simulationId}`);
    } catch (error) {
      toast.error('Error al iniciar simulación');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Cumple Normas</span>;
      case 'non_compliant':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">No Cumple</span>;
      case 'active':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Activo</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Borrador</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Grounding Designer Pro</h1>
              <p className="text-sm text-gray-500 mt-1">
                Bienvenido, {user?.firstName} {user?.lastName}
              </p>
            </div>
            <button
              onClick={handleCreateProject}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              + Nuevo Proyecto
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Proyectos</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{projects.length}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Cumplen Normas</dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">
                {projects.filter(p => p.status === 'compliant').length}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">No Cumplen</dt>
              <dd className="mt-1 text-3xl font-semibold text-red-600">
                {projects.filter(p => p.status === 'non_compliant').length}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Plan</dt>
              <dd className="mt-1 text-xl font-semibold text-gray-900 capitalize">{user?.subscriptionTier}</dd>
            </div>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {loading ? (
              <li className="px-6 py-4 text-center text-gray-500">Cargando proyectos...</li>
            ) : projects.length === 0 ? (
              <li className="px-6 py-4 text-center text-gray-500">
                No hay proyectos. Crea uno para comenzar.
              </li>
            ) : (
              projects.map((project) => (
                <li key={project.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <p className="text-sm font-medium text-blue-600 truncate">{project.name}</p>
                        {getStatusBadge(project.status)}
                      </div>
                      <p className="mt-1 text-sm text-gray-500 truncate">{project.description || 'Sin descripción'}</p>
                      <div className="mt-2 flex space-x-4 text-xs text-gray-400">
                        <span>Tensión: {project.voltageLevel.toLocaleString()} V</span>
                        <span>Resistividad: {project.soilProfile.resistivity} Ω·m</span>
                        <span>Actualizado: {new Date(project.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleRunSimulation(project.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        Simular
                      </button>
                      <button
                        onClick={() => navigate(`/compliance/${project.id}`)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Reporte
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
