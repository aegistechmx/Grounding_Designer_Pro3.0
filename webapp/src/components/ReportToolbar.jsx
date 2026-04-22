import React from 'react';
import { FileText, Download, Share2, Printer, FileDown } from 'lucide-react';
import PDFReport from './reports/PDFReport';

const ReportToolbar = ({ results, params }) => {
  const handleDXFExport = () => {
    if (!results?.methods?.discrete?.nodes) {
      alert('No hay datos de malla para exportar. Realice un cálculo primero.');
      return;
    }

    try {
      // Simple DXF export format
      const nodes = results.methods.discrete.nodes;
      let dxfContent = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1009
0
ENDSEC
0
SECTION
2
ENTITIES
`;

      // Add nodes as POINT entities
      nodes.forEach((node, index) => {
        dxfContent += `0
POINT
8
GRID_NODES
10
${node.x}
20
${node.y}
30
0
`;
      });

      dxfContent += `0
ENDSEC
0
EOF
`;

      const blob = new Blob([dxfContent], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'grounding_grid.dxf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting DXF:', error);
      alert('Error al exportar DXF. Por favor intente nuevamente.');
    }
  };

  const handleEmailShare = () => {
    if (!results) {
      alert('No hay resultados para compartir. Realice un cálculo primero.');
      return;
    }

    const subject = encodeURIComponent('Grounding Design Report - IEEE 80 Analysis');
    const body = encodeURIComponent(
      `Grounding Designer Pro - IEEE 80 Analysis Report\n\n` +
      `Project: ${params?.projectName || 'N/A'}\n` +
      `Date: ${new Date().toLocaleDateString()}\n\n` +
      `Results:\n` +
      `Grid Resistance (Rg): ${results?.methods?.discrete?.grid?.resistance?.toFixed(3) || 'N/A'} Ω\n` +
      `GPR: ${results?.methods?.discrete?.gpr?.toFixed(0) || 'N/A'} V\n` +
      `Touch Voltage (Em): ${results?.methods?.discrete?.touchVoltage?.toFixed(1) || 'N/A'} V\n` +
      `Step Voltage (Es): ${results?.methods?.discrete?.stepVoltage?.toFixed(1) || 'N/A'} V\n\n` +
      `Compliance: ${results?.methods?.discrete?.complies ? 'CUMPLE' : 'NO CUMPLE'} IEEE 80\n\n` +
      `Generated with Grounding Designer Pro`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handlePrintPreview = () => {
    if (!results) {
      alert('No hay resultados para imprimir. Realice un cálculo primero.');
      return;
    }

    window.print();
  };

  if (!results) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          📊 Reportes y Documentación
        </h3>
        <p className="text-gray-600 text-sm">
          Realice un cálculo primero para generar reportes y exportaciones.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        📊 Reportes y Documentación
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* PDF Profesional */}
        <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
          <PDFReport 
            params={params} 
            calculations={results?.methods?.discrete || {}}
            recommendations={results?.methods?.discrete?.recommendations || []}
            darkMode={false}
          />
          <span className="text-xs text-gray-600 mt-2 text-center">PDF Profesional</span>
        </div>

        {/* Exportar DXF */}
        <button
          onClick={handleDXFExport}
          className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
        >
          <FileDown size={24} className="text-green-600" />
          <span className="text-xs text-gray-600 mt-2 text-center">Exportar DXF</span>
          <span className="text-xs text-gray-400">AutoCAD / CAD</span>
        </button>

        {/* Compartir por Email */}
        <button
          onClick={handleEmailShare}
          className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <Share2 size={24} className="text-purple-600" />
          <span className="text-xs text-gray-600 mt-2 text-center">Compartir</span>
          <span className="text-xs text-gray-400">Enviar por email</span>
        </button>

        {/* Imprimir */}
        <button
          onClick={handlePrintPreview}
          className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
        >
          <Printer size={24} className="text-orange-600" />
          <span className="text-xs text-gray-600 mt-2 text-center">Imprimir</span>
          <span className="text-xs text-gray-400">Vista previa</span>
        </button>
      </div>
    </div>
  );
};

export default ReportToolbar;
