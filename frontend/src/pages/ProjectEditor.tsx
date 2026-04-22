// src/pages/ProjectEditor.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsService, Project, SoilProfile, GridDesign } from '../services/projects.service';
import toast from 'react-hot-toast';

export const ProjectEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    description: '',
    voltageLevel: 13200,
    soilProfile: {
      resistivity: 100,
      surfaceResistivity: 3000,
      surfaceDepth: 0.1,
      moisture: 0.25,
    },
    gridDesign: {
      length: 12.5,
      width: 8,
      depth: 0.6,
      nx: 8,
      ny: 8,
      rodLength: 3,
      numRods: 16,
      conductorMaterial: 'copper',
      conductorSize: '4/0',
    },
  });

  useEffect(() => {
    if (id && id !== 'new') {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const project = await projectsService.getById(id!);
      setFormData(project);
    } catch (error) {
      toast.error('Error al cargar proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (id && id !== 'new') {
        await projectsService.update(id, formData);
        toast.success('Proyecto actualizado');
      } else {
        const project = await projectsService.create(formData);
        navigate(`/projects/${project.id}`);
        toast.success('Proyecto creado');
      }
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSoilChange = (field: keyof SoilProfile, value: number) => {
    setFormData(prev => ({
      ...prev,
      soilProfile: { ...prev.soilProfile!, [field]: value },
    }));
  };

  const handleGridChange = (field: keyof GridDesign, value: any) => {
    setFormData(prev => ({
      ...prev,
      gridDesign: { ...prev.gridDesign!, [field]: value },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              {id && id !== 'new' ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            </h1>
          </div>

          <div className="p-6 space-y-6">
            {/* Información Básica */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre del Proyecto</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tensión del Sistema (V)</label>
                  <input
                    type="number"
                    value={formData.voltageLevel}
                    onChange={(e) => handleChange('voltageLevel', parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Perfil de Suelo */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Perfil de Suelo</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resistividad (Ω·m)</label>
                  <input
                    type="number"
                    value={formData.soilProfile?.resistivity}
                    onChange={(e) => handleSoilChange('resistivity', parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resistividad Superficial (Ω·m)</label>
                  <input
                    type="number"
                    value={formData.soilProfile?.surfaceResistivity}
                    onChange={(e) => handleSoilChange('surfaceResistivity', parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Espesor Superficial (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.soilProfile?.surfaceDepth}
                    onChange={(e) => handleSoilChange('surfaceDepth', parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Humedad del Suelo</label>
                  <select
                    value={formData.soilProfile?.moisture}
                    onChange={(e) => handleSoilChange('moisture', parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="0.1">Seco (10%)</option>
                    <option value="0.25">Normal (25%)</option>
                    <option value="0.4">Húmedo (40%)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Configuración de Malla */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Configuración de Malla</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Largo (m)</label>
                  <input
                    type="number"
                    value={formData.gridDesign?.length}
                    onChange={(e) => handleGridChange('length', parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ancho (m)</label>
                  <input
                    type="number"
                    value={formData.gridDesign?.width}
                    onChange={(e) => handleGridChange('width', parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Profundidad (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.gridDesign?.depth}
                    onChange={(e) => handleGridChange('depth', parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Conductores X</label>
                  <input
                    type="number"
                    value={formData.gridDesign?.nx}
                    onChange={(e) => handleGridChange('nx', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Conductores Y</label>
                  <input
                    type="number"
                    value={formData.gridDesign?.ny}
                    onChange={(e) => handleGridChange('ny', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Número de Varillas</label>
                  <input
                    type="number"
                    value={formData.gridDesign?.numRods}
                    onChange={(e) => handleGridChange('numRods', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Longitud Varilla (m)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.gridDesign?.rodLength}
                    onChange={(e) => handleGridChange('rodLength', parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Material Conductor</label>
                  <select
                    value={formData.gridDesign?.conductorMaterial}
                    onChange={(e) => handleGridChange('conductorMaterial', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="copper">Cobre</option>
                    <option value="aluminum">Aluminio</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Proyecto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
