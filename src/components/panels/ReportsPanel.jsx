import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, FileSpreadsheet, FileJson, FileCode, CheckCircle, AlertCircle, BookOpen, Building, BarChart3, LayoutDashboard, Award } from 'lucide-react';
import { generateFullPDF } from '../../utils/pdfFullPro';
import { exportTechnicalMemoryPDF } from '../../utils/pdfTechnicalMemory';
import { generateCFEPDF } from '../../utils/pdfCFE';
import { exportPDFWithCharts } from '../../utils/pdfWithCharts';
import { exportPowerBIPDF } from '../../utils/pdfPowerBI';
import { exportProfessionalCFEPDF } from '../../utils/pdfProfessionalCFE';
import { exportToExcel } from '../../utils/excelExport';
import { exportToWord } from '../../utils/wordExport';
import ComplianceCertificate from '../reports/ComplianceCertificate';
import ExecutiveReport from '../reports/ExecutiveReport';
import MaterialListModal from '../reports/MaterialListModal';
import { generateMaterialList } from '../../utils/materialList';

export const ReportsPanel = ({ params, calculations, recommendations, darkMode }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showExecutiveReport, setShowExecutiveReport] = useState(false);
  const [showMaterialList, setShowMaterialList] = useState(false);
  const [materialList, setMaterialList] = useState(null);

  // Exponer funciones PDF globalmente para pruebas (solo desarrollo)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      window.generateFullPDF = generateFullPDF;
      window.currentParams = params;
      window.currentCalculations = calculations;
      console.log('✅ Funciones PDF disponibles globalmente');
    }
  }, [generateFullPDF, params, calculations]);

  if (!calculations) {
    return (
      <div className={`p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
        <p className="text-gray-500">Realice un cálculo para generar reportes</p>
      </div>
    );
  }

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = await generateFullPDF({
        input: params,
        results: calculations,
        metadata: {
          projectName: params.projectName,
          projectLocation: params.projectLocation,
          clientName: params.clientName,
          engineerName: params.engineerName,
          dateFormatted: new Date().toLocaleDateString('es-MX'),
          reportId: `GDP-${Date.now()}`
        }
      });
      alert('✅ PDF profesional generado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al generar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTechnicalMemory = async () => {
    setIsExporting(true);
    try {
      await exportTechnicalMemoryPDF(params, calculations, recommendations);
      alert('✅ Memoria técnica generada exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al generar memoria técnica');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCFE = async () => {
    setIsExporting(true);
    try {
      const doc = await generateCFEPDF(params, calculations, recommendations);
      doc.save(`Informe_CFE_${params.projectName || 'Proyecto'}_${new Date().toISOString().split('T')[0]}.pdf`);
      alert('✅ PDF para CFE generado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al generar PDF para CFE');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDFWithCharts = async () => {
    setIsExporting(true);
    try {
      await exportPDFWithCharts(params, calculations, recommendations);
      alert('✅ PDF con gráficas Chart.js generado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al generar PDF con gráficas');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPowerBI = async () => {
    setIsExporting(true);
    try {
      await exportPowerBIPDF(params, calculations, recommendations);
      alert('✅ Dashboard Power BI generado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al generar dashboard Power BI');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportProfessionalCFE = async () => {
    setIsExporting(true);
    try {
      await exportProfessionalCFEPDF(params, calculations, []);
      alert('✅ Informe Profesional CFE generado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al generar informe profesional CFE');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const fileName = exportToExcel(params, calculations, recommendations);
      alert(`✅ Excel generado: ${fileName}`);
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al generar Excel');
    }
  };

  const handleExportWord = async () => {
    setIsExporting(true);
    try {
      const fileName = await exportToWord(params, calculations, recommendations);
      alert(`✅ Word generado: ${fileName}`);
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al generar Word');
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateMaterialList = () => {
    const list = generateMaterialList(params, calculations);
    setMaterialList(list);
    setShowMaterialList(true);
  };

  const exportToJSON = () => {
    const data = {
      metadata: {
        project: params.projectName,
        date: new Date().toISOString(),
        engineer: params.engineerName
      },
      parameters: params,
      results: {
        Rg: calculations.Rg,
        GPR: calculations.GPR,
        Em: calculations.Em,
        Es: calculations.Es,
        complies: calculations.complies
      },
      recommendations
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grounding_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">📄 Generación de Reportes</h3>
      
      {/* Tarjetas de exportación */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className={`p-4 rounded-xl text-center transition-all ${
            darkMode ? 'bg-red-900/30 hover:bg-red-900/50' : 'bg-red-50 hover:bg-red-100'
          } border ${darkMode ? 'border-red-800' : 'border-red-200'}`}
        >
          <FileText size={32} className="mx-auto mb-2 text-red-500" />
          <div className="font-semibold">PDF Profesional</div>
          <div className="text-xs text-gray-500 mt-1">Reporte completo con cálculos</div>
        </button>
        
        <button
          onClick={handleExportExcel}
          className={`p-4 rounded-xl text-center transition-all ${
            darkMode ? 'bg-green-900/30 hover:bg-green-900/50' : 'bg-green-50 hover:bg-green-100'
          } border ${darkMode ? 'border-green-800' : 'border-green-200'}`}
        >
          <FileSpreadsheet size={32} className="mx-auto mb-2 text-green-500" />
          <div className="font-semibold">Excel</div>
          <div className="text-xs text-gray-500 mt-1">Datos en hojas de cálculo</div>
        </button>
        
        <button
          onClick={handleExportWord}
          disabled={isExporting}
          className={`p-4 rounded-xl text-center transition-all ${
            darkMode ? 'bg-blue-900/30 hover:bg-blue-900/50' : 'bg-blue-50 hover:bg-blue-100'
          } border ${darkMode ? 'border-blue-800' : 'border-blue-200'}`}
        >
          <FileText size={32} className="mx-auto mb-2 text-blue-500" />
          <div className="font-semibold">Word</div>
          <div className="text-xs text-gray-500 mt-1">Documento editable</div>
        </button>
        
        <button
          onClick={exportToJSON}
          className={`p-4 rounded-xl text-center transition-all ${
            darkMode ? 'bg-purple-900/30 hover:bg-purple-900/50' : 'bg-purple-50 hover:bg-purple-100'
          } border ${darkMode ? 'border-purple-800' : 'border-purple-200'}`}
        >
          <FileJson size={32} className="mx-auto mb-2 text-purple-500" />
          <div className="font-semibold">JSON</div>
          <div className="text-xs text-gray-500 mt-1">Datos estructurados</div>
        </button>
      </div>
      
      {/* Reportes especiales */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <h4 className="font-semibold mb-3">Reportes Especiales</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setShowCertificate(true)}
            className={`p-3 rounded-lg text-center transition-all ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'
            } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
          >
            <CheckCircle size={24} className="mx-auto mb-1 text-green-500" />
            <div className="text-sm font-medium">Certificado de Cumplimiento</div>
            <div className="text-xs text-gray-500">Certificado IEEE 80</div>
          </button>
          
          <button
            onClick={() => setShowExecutiveReport(true)}
            className={`p-3 rounded-lg text-center transition-all ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'
            } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
          >
            <FileText size={24} className="mx-auto mb-1 text-blue-500" />
            <div className="text-sm font-medium">Reporte Ejecutivo</div>
            <div className="text-xs text-gray-500">Informe completo</div>
          </button>
          
          <button
            onClick={handleGenerateMaterialList}
            className={`p-3 rounded-lg text-center transition-all ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'
            } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
          >
            <FileCode size={24} className="mx-auto mb-1 text-orange-500" />
            <div className="text-sm font-medium">Lista de Materiales</div>
            <div className="text-xs text-gray-500">Cantidades y costos</div>
          </button>
        </div>
      </div>

      {/* Reportes avanzados */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <h4 className="font-semibold mb-3">Reportes Avanzados</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={handleExportTechnicalMemory}
            disabled={isExporting}
            className={`p-3 rounded-lg text-center transition-all ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'
            } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
          >
            <BookOpen size={24} className="mx-auto mb-1 text-indigo-500" />
            <div className="text-sm font-medium">Memoria Técnica</div>
            <div className="text-xs text-gray-500">IEEE 80 - Documento completo</div>
          </button>
          
          <button
            onClick={handleExportCFE}
            disabled={isExporting}
            className={`p-3 rounded-lg text-center transition-all ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'
            } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
          >
            <Building size={24} className="mx-auto mb-1 text-amber-500" />
            <div className="text-sm font-medium">Formato CFE</div>
            <div className="text-xs text-gray-500">CFE 01J00-01 - Oficial</div>
          </button>
          
          <button
            onClick={handleExportPDFWithCharts}
            disabled={isExporting}
            className={`p-3 rounded-lg text-center transition-all ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'
            } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
          >
            <BarChart3 size={24} className="mx-auto mb-1 text-teal-500" />
            <div className="text-sm font-medium">PDF con Gráficas</div>
            <div className="text-xs text-gray-500">Chart.js - Alta calidad</div>
          </button>
          
          <button
            onClick={handleExportPowerBI}
            disabled={isExporting}
            className={`p-3 rounded-lg text-center transition-all ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'
            } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
          >
            <LayoutDashboard size={24} className="mx-auto mb-1 text-cyan-500" />
            <div className="text-sm font-medium">Dashboard Power BI</div>
            <div className="text-xs text-gray-500">KPIs - Visual profesional</div>
          </button>
        </div>
      </div>
      
      {/* Reportes Profesionales */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <h4 className="font-semibold mb-3">Reportes Profesionales</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleExportProfessionalCFE}
            disabled={isExporting}
            className={`p-3 rounded-lg text-center transition-all ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'
            } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
          >
            <Award size={24} className="mx-auto mb-1 text-purple-500" />
            <div className="text-sm font-medium">Informe Profesional CFE</div>
            <div className="text-xs text-gray-500">Estructura formal - Documento defendible</div>
          </button>
        </div>
      </div>
      
      {/* Estado del diseño */}
      <div className={`p-4 rounded-lg ${calculations.complies ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
        <div className="flex items-center gap-2">
          {calculations.complies ? (
            <CheckCircle size={20} className="text-green-600" />
          ) : (
            <AlertCircle size={20} className="text-yellow-600" />
          )}
          <span className="font-semibold">
            {calculations.complies 
              ? 'Diseño listo para generar reportes' 
              : 'Diseño con advertencias - revise los resultados antes de generar reportes'}
          </span>
        </div>
      </div>
      
      {/* Modales */}
      {showCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full max-h-[90vh] overflow-auto">
            <ComplianceCertificate params={params} calculations={calculations} darkMode={darkMode} />
            <button
              onClick={() => setShowCertificate(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      
      {showExecutiveReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-5xl w-full max-h-[90vh] overflow-auto">
            <ExecutiveReport
              params={params}
              calculations={calculations}
              recommendations={recommendations}
              darkMode={darkMode}
              onClose={() => setShowExecutiveReport(false)}
            />
          </div>
        </div>
      )}
      
      {showMaterialList && materialList && (
        <MaterialListModal
          materialList={materialList}
          darkMode={darkMode}
          onClose={() => setShowMaterialList(false)}
          onExport={() => {
            const csv = generateMaterialList(params, calculations);
            const blob = new Blob([JSON.stringify(csv, null, 2)], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `materiales_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        />
      )}
    </div>
  );
};