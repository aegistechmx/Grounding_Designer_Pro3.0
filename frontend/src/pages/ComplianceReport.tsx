// src/pages/ComplianceReport.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export const ComplianceReport: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Reporte de Cumplimiento</h1>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">Reporte de cumplimiento normativo para el proyecto: {projectId}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
