import React from 'react';
import { FileText, Download, Printer, Share2, CheckCircle } from 'lucide-react';
import { ValidatedSection } from '../common/ValidatedSection';
import PDFReport from '../reports/PDFReport';

export const ReportsPanel = ({ params, calculations, recommendations, darkMode, probeData }) => {
  const generatePDF = () => {
    // PDF generation is handled by the PDFReport component
  };

  const exportDXF = () => {
    if (!calculations?.gridNodes) {
      alert('No hay datos de malla para exportar');
      return;
    }

    // Generate DXF content
    const dxfContent = generateDXFContent(calculations.gridNodes);
    const blob = new Blob([dxfContent], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grounding_grid_${Date.now()}.dxf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateDXFContent = (nodes) => {
    let dxf = `0\nSECTION\n2\nHEADER\n0\nENDSEC\n`;
    dxf += `0\nSECTION\n2\nENTITIES\n`;

    // Add grid lines
    nodes.forEach((node, i) => {
      dxf += `0\nPOINT\n8\n0\n10\n${node.x}\n20\n${node.y}\n30\n0\n`;
    });

    dxf += `0\nENDSEC\n0\nEOF\n`;
    return dxf;
  };

  const shareReport = () => {
    if (!calculations) {
      alert('No hay datos para compartir');
      return;
    }

    const subject = 'Reporte de Diseño de Malla de Tierra';
    const body = `
Resultados del Diseño de Malla de Tierra:
- Resistencia de Malla (Rg): ${calculations.Rg?.toFixed(2) || 'N/A'} Ω
- GPR: ${calculations.GPR?.toFixed(2) || 'N/A'} V
- Tensión de Contacto: ${calculations.Em?.toFixed(2) || 'N/A'} V
- Tensión de Paso: ${calculations.Es?.toFixed(2) || 'N/A'} V
- Estado: ${calculations.complies ? 'CUMPLE' : 'NO CUMPLE'}
    `;

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const printReport = () => {
    window.print();
  };

  const exportProbeData = () => {
    if (!probeData?.bookmarks || probeData.bookmarks.length === 0) {
      alert('No hay bookmarks para exportar');
      return;
    }

    const csvContent = [
      ['ID', 'X (m)', 'Y (m)', 'V_discrete (V)', 'V_analytical (V)', 'Error (%)', 'Timestamp'],
      ...probeData.bookmarks.map((b, i) => [
        i + 1,
        b.x.toFixed(2),
        b.y.toFixed(2),
        b.Vd.toFixed(1),
        b.Va.toFixed(1),
        (b.error * 100).toFixed(1),
        b.timestamp
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `probe_bookmarks_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-4">
      <ValidatedSection title="Reportes y Documentación" icon={FileText} status="info" darkMode={darkMode}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="p-4 bg-gradient-to-br from-red-600 to-red-700 rounded-xl text-center hover:scale-[1.02] transition-all">
            {calculations && (
              <PDFReport 
                params={params} 
                calculations={calculations} 
                recommendations={recommendations || []}
                darkMode={darkMode}
              />
            )}
            <FileText size={24} className="mx-auto mb-2" />
            <div className="font-semibold">PDF Profesional</div>
            <div className="text-xs opacity-75">Informe técnico completo</div>
          </div>
          <button onClick={exportDXF} className="p-4 bg-gradient-to-br from-green-600 to-green-700 rounded-xl text-center hover:scale-[1.02] transition-all"><Download size={24} className="mx-auto mb-2" /><div className="font-semibold">Exportar DXF</div><div className="text-xs opacity-75">AutoCAD / CAD</div></button>
          <button onClick={shareReport} className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl text-center hover:scale-[1.02] transition-all"><Share2 size={24} className="mx-auto mb-2" /><div className="font-semibold">Compartir</div><div className="text-xs opacity-75">Enviar por email</div></button>
          <button onClick={printReport} className="p-4 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl text-center hover:scale-[1.02] transition-all"><Printer size={24} className="mx-auto mb-2" /><div className="font-semibold">Imprimir</div><div className="text-xs opacity-75">Vista previa</div></button>
        </div>

        {/* Probe Data Export */}
        {probeData?.bookmarks && probeData.bookmarks.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-yellow-400" />
                <span className="text-yellow-400 font-semibold">Datos del Probe Disponibles</span>
              </div>
              <span className="text-xs text-gray-400">{probeData.bookmarks.length} bookmarks</span>
            </div>
            <button
              onClick={exportProbeData}
              className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Download size={16} /> Exportar Bookmarks CSV
            </button>
          </div>
        )}
        <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30"><div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-400" /><span className="text-green-400 font-semibold">Diseño listo para generar reportes</span></div><div className="text-xs text-gray-400 mt-1">Certificado de cumplimiento disponible para auditoría</div></div>
      </ValidatedSection>
    </div>
  );
};