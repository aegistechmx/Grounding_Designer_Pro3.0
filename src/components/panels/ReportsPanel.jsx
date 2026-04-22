import React from 'react';
import { FileText, Download, Printer, Share2, CheckCircle } from 'lucide-react';
import { ValidatedSection } from '../common/ValidatedSection';

export const ReportsPanel = ({ params, calculations, recommendations, darkMode }) => {
  const generatePDF = () => { alert('Generando PDF profesional...'); };
  
  return (
    <div className="space-y-4">
      <ValidatedSection title="Reportes y Documentación" icon={FileText} status="info" darkMode={darkMode}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <button onClick={generatePDF} className="p-4 bg-gradient-to-br from-red-600 to-red-700 rounded-xl text-center hover:scale-[1.02] transition-all"><FileText size={24} className="mx-auto mb-2" /><div className="font-semibold">PDF Profesional</div><div className="text-xs opacity-75">Informe técnico completo</div></button>
          <button className="p-4 bg-gradient-to-br from-green-600 to-green-700 rounded-xl text-center hover:scale-[1.02] transition-all"><Download size={24} className="mx-auto mb-2" /><div className="font-semibold">Exportar DXF</div><div className="text-xs opacity-75">AutoCAD / CAD</div></button>
          <button className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl text-center hover:scale-[1.02] transition-all"><Share2 size={24} className="mx-auto mb-2" /><div className="font-semibold">Compartir</div><div className="text-xs opacity-75">Enviar por email</div></button>
          <button className="p-4 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl text-center hover:scale-[1.02] transition-all"><Printer size={24} className="mx-auto mb-2" /><div className="font-semibold">Imprimir</div><div className="text-xs opacity-75">Vista previa</div></button>
        </div>
        <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30"><div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-400" /><span className="text-green-400 font-semibold">Diseño listo para generar reportes</span></div><div className="text-xs text-gray-400 mt-1">Certificado de cumplimiento disponible para auditoría</div></div>
      </ValidatedSection>
    </div>
  );
};