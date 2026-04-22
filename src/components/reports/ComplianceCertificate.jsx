import React from 'react';
import { Shield, CheckCircle, XCircle, FileText, User, Calendar, Activity, Award } from 'lucide-react';
import { formatResistance, formatVoltage, formatPercentage } from '../../utils/formatters';

const ComplianceCertificate = ({ params, calculations, darkMode }) => {
  // ============================================
  // FUNCIONES AUXILIARES
  // ============================================
  const safeValue = (value, defaultValue = 'N/A') => {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'number' && isNaN(value)) return defaultValue;
    return value;
  };

  const safeNumber = (value, decimals = 2) => {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) return 'N/A';
    return value.toFixed(decimals);
  };

  // Datos seguros
  const projectName = safeValue(params?.projectName, 'Proyecto de Puesta a Tierra');
  const clientName = safeValue(params?.clientName, 'No especificado');
  const engineerName = safeValue(params?.engineerName, 'Ingeniero Especialista');
  const projectLocation = safeValue(params?.projectLocation, 'Puerto Vallarta, Jalisco, México');
  const date = new Date().toLocaleDateString('es-MX');
  
  const complies = calculations?.complies === true;
  const Rg = formatResistance(calculations?.Rg, 3);
  const Em = formatVoltage(calculations?.Em, 0);
  const Es = formatVoltage(calculations?.Es, 0);
  const Etouch70 = formatVoltage(calculations?.Etouch70, 0);
  const Estep70 = formatVoltage(calculations?.Estep70, 0);
  const GPR = formatVoltage(calculations?.GPR, 0);
  
  // Valores numéricos para comparaciones (manejar 'N/A')
  const EmValue = parseFloat(Em) || 0;
  const Etouch70Value = parseFloat(Etouch70) || Infinity;
  const EsValue = parseFloat(Es) || 0;
  const Estep70Value = parseFloat(Estep70) || Infinity;
  
  // Calcular márgenes de seguridad
  const touchMargin = calculations?.Etouch70 && calculations?.Em 
    ? formatPercentage((calculations.Etouch70 - calculations.Em) / calculations.Etouch70 * 100, 1)
    : 'N/A';
  const stepMargin = calculations?.Estep70 && calculations?.Es
    ? formatPercentage((calculations.Estep70 - calculations.Es) / calculations.Estep70 * 100, 1)
    : 'N/A';
  
  // Número de certificado
  const certificateNumber = `GDP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  
  // Válido hasta (10 años después)
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 10);
  const validUntilDate = validUntil.toLocaleDateString('es-MX');

  // Colores según modo oscuro
  const colors = darkMode ? {
    bg: 'bg-gray-800',
    border: 'border-gray-700',
    text: 'text-white',
    textSecondary: 'text-gray-300',
    successBg: 'bg-green-900/30',
    successBorder: 'border-green-500',
    successText: 'text-green-400',
    errorBg: 'bg-red-900/30',
    errorBorder: 'border-red-500',
    errorText: 'text-red-400'
  } : {
    bg: 'bg-white',
    border: 'border-gray-200',
    text: 'text-gray-800',
    textSecondary: 'text-gray-600',
    successBg: 'bg-green-50',
    successBorder: 'border-green-500',
    successText: 'text-green-700',
    errorBg: 'bg-red-50',
    errorBorder: 'border-red-500',
    errorText: 'text-red-700'
  };

  return (
    <div className={`p-6 rounded-xl border-2 ${colors.bg} ${colors.border} shadow-xl`}>
      
      {/* ENCABEZADO */}
      <div className="text-center border-b pb-4 mb-4">
        <div className="flex justify-center mb-2">
          <Shield size={48} className="text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-blue-600">CERTIFICADO DE CUMPLIMIENTO</h2>
        <p className="text-sm text-gray-500">IEEE Std 80-2013 - Seguridad en Subestaciones</p>
        <p className="text-xs text-gray-400 mt-1">Certificado N°: {certificateNumber}</p>
      </div>
      
      {/* DATOS DEL PROYECTO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={14} className="text-gray-500" />
            <span className="text-xs text-gray-500">Proyecto</span>
          </div>
          <p className="font-semibold">{projectName}</p>
        </div>
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2 mb-1">
            <User size={14} className="text-gray-500" />
            <span className="text-xs text-gray-500">Cliente</span>
          </div>
          <p className="font-semibold">{clientName}</p>
        </div>
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={14} className="text-gray-500" />
            <span className="text-xs text-gray-500">Fecha de Emisión</span>
          </div>
          <p className="font-semibold">{date}</p>
        </div>
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Award size={14} className="text-gray-500" />
            <span className="text-xs text-gray-500">Válido hasta</span>
          </div>
          <p className="font-semibold">{validUntilDate}</p>
        </div>
      </div>
      
      {/* ESTADO DEL CERTIFICADO */}
      <div className={`p-4 rounded-lg mb-4 text-center border ${complies ? colors.successBorder : colors.errorBorder} ${complies ? colors.successBg : colors.errorBg}`}>
        <div className="flex justify-center mb-2">
          {complies ? (
            <CheckCircle size={48} className="text-green-600" />
          ) : (
            <XCircle size={48} className="text-red-600" />
          )}
        </div>
        <div className={`font-bold text-xl ${complies ? colors.successText : colors.errorText}`}>
          {complies ? 'DISEÑO CERTIFICADO' : 'DISEÑO NO CERTIFICADO'}
        </div>
        <div className={`text-sm mt-1 ${complies ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
          {complies 
            ? 'El diseño cumple con todos los requisitos de seguridad IEEE 80-2013'
            : 'El diseño requiere mejoras para cumplir con IEEE 80-2013'}
        </div>
      </div>
      
      {/* RESULTADOS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center mb-4">
        <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="text-xs text-gray-500">Resistencia (Rg)</div>
          <div className="text-xl font-bold text-blue-600">{Rg}</div>
          <div className="text-xs">Objetivo: &lt;5 Ω</div>
        </div>
        <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="text-xs text-gray-500">GPR</div>
          <div className="text-xl font-bold text-blue-600">{GPR}</div>
        </div>
        <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="text-xs text-gray-500">Contacto (Em)</div>
          <div className={`text-xl font-bold ${EmValue < Etouch70Value ? 'text-green-600' : 'text-red-600'}`}>
            {Em}
          </div>
          <div className="text-xs">Límite: {Etouch70}</div>
        </div>
        <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="text-xs text-gray-500">Paso (Es)</div>
          <div className={`text-xl font-bold ${EsValue < Estep70Value ? 'text-green-600' : 'text-red-600'}`}>
            {Es}
          </div>
          <div className="text-xs">Límite: {Estep70}</div>
        </div>
      </div>
      
      {/* MÁRGENES DE SEGURIDAD */}
      <div className={`p-3 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div className="text-sm font-semibold mb-2">📊 Márgenes de Seguridad</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Tensión de Contacto:</span>
            <span className={`ml-2 font-semibold ${(parseFloat(touchMargin) || 0) > 50 ? 'text-green-600' : 'text-yellow-600'}`}>
              {touchMargin}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Tensión de Paso:</span>
            <span className={`ml-2 font-semibold ${(parseFloat(stepMargin) || 0) > 50 ? 'text-green-600' : 'text-yellow-600'}`}>
              {stepMargin}
            </span>
          </div>
        </div>
      </div>
      
      {/* UBICACIÓN E INGENIERO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Ubicación</p>
          <p className="text-sm font-medium">{projectLocation}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Ingeniero Responsable</p>
          <p className="text-sm font-semibold">{engineerName}</p>
          <p className="text-xs text-gray-500">Cédula profesional: _________________</p>
        </div>
      </div>
      
      {/* FIRMAS */}
      <div className="border-t pt-4 mt-2">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="border-t border-gray-400 pt-2 mt-8">
              <p className="text-sm font-semibold">{engineerName}</p>
              <p className="text-xs text-gray-500">Ingeniero Responsable</p>
            </div>
          </div>
          <div>
            <div className="border-t border-gray-400 pt-2 mt-8">
              <p className="text-sm font-semibold">_________________</p>
              <p className="text-xs text-gray-500">Sello de la Empresa</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* NOTA LEGAL */}
      <div className="mt-4 pt-3 border-t text-center">
        <p className="text-xs text-gray-400">
          Este certificado es válido únicamente para el proyecto especificado. 
          Cualquier modificación al diseño original invalida esta certificación.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Documento generado electrónicamente por Grounding Designer Pro
        </p>
      </div>
    </div>
  );
};

export default ComplianceCertificate;