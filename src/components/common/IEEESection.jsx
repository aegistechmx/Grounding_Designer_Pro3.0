import React from 'react';
import { Shield } from 'lucide-react';

const MetricCard = ({ label, value, highlight, darkMode = true }) => (
  <div className={`p-2 rounded ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
    <div className={`font-semibold mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
      {label}
    </div>
    <div className={`text-lg font-bold ${highlight || (darkMode ? 'text-white' : 'text-blue-900')}`}>
      {value}
    </div>
  </div>
);

const InfoBox = ({ children, darkMode = true, icon = true }) => (
  <div className={`mt-3 p-2 rounded ${darkMode ? 'bg-blue-900/40' : 'bg-blue-200'}`}>
    <p className={`text-xs flex items-start gap-2 ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
      {icon && <Shield size={12} className="mt-0.5 flex-shrink-0" />}
      <span>{children}</span>
    </p>
  </div>
);

const InfoBoxSimple = ({ children, darkMode = true }) => (
  <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-blue-900/40' : 'bg-blue-200'}`}>
    <p className={`text-xs ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
      {children}
    </p>
  </div>
);

const IEEESection = ({ 
  title, 
  metrics = [], 
  info, 
  info2, 
  darkMode = true,
  variant = 'blue',
  icon: Icon = Shield
}) => {
  const variantStyles = {
    blue: {
      container: darkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200',
      inner: darkMode ? 'bg-blue-900/30' : 'bg-blue-100',
      info: darkMode ? 'bg-blue-900/40' : 'bg-blue-200',
      title: darkMode ? 'text-blue-300' : 'text-blue-800',
      label: darkMode ? 'text-blue-300' : 'text-blue-700',
      value: darkMode ? 'text-white' : 'text-blue-900',
      infoText: darkMode ? 'text-blue-200' : 'text-blue-800',
      shadow: darkMode 
        ? '0 0 15px rgba(59, 130, 246, 0.3), inset 0 0 8px rgba(59, 130, 246, 0.15)' 
        : '0 0 15px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.1)'
    },
    green: {
      container: darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200',
      inner: darkMode ? 'bg-green-900/30' : 'bg-green-100',
      info: darkMode ? 'bg-green-900/40' : 'bg-green-200',
      title: darkMode ? 'text-green-300' : 'text-green-800',
      label: darkMode ? 'text-green-300' : 'text-green-700',
      value: darkMode ? 'text-white' : 'text-green-900',
      infoText: darkMode ? 'text-green-200' : 'text-green-800',
      shadow: darkMode 
        ? '0 0 15px rgba(34, 197, 94, 0.3), inset 0 0 8px rgba(34, 197, 94, 0.15)' 
        : '0 0 15px rgba(34, 197, 94, 0.2), inset 0 0 8px rgba(34, 197, 94, 0.1)'
    },
    red: {
      container: darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200',
      inner: darkMode ? 'bg-red-900/30' : 'bg-red-100',
      info: darkMode ? 'bg-red-900/40' : 'bg-red-200',
      title: darkMode ? 'text-red-300' : 'text-red-800',
      label: darkMode ? 'text-red-300' : 'text-red-700',
      value: darkMode ? 'text-white' : 'text-red-900',
      infoText: darkMode ? 'text-red-200' : 'text-red-800',
      shadow: darkMode 
        ? '0 0 15px rgba(239, 68, 68, 0.3), inset 0 0 8px rgba(239, 68, 68, 0.15)' 
        : '0 0 15px rgba(239, 68, 68, 0.2), inset 0 0 8px rgba(239, 68, 68, 0.1)'
    }
  };

  const style = variantStyles[variant] || variantStyles.blue;

  return (
    <div
      className={`p-4 rounded-lg border ${style.container}`}
      style={{ boxShadow: style.shadow }}
    >
      {/* HEADER */}
      <h4 className={`font-semibold mb-3 flex items-center gap-2 ${style.title}`}>
        <Icon size={16} />
        {title}
      </h4>

      {/* GRID EXACTO */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {metrics.map((m, i) => (
          <div key={i} className={`p-2 rounded ${style.inner}`}>
            <div className={`font-semibold mb-1 ${style.label}`}>
              {m.label}
            </div>
            <div className={`text-lg font-bold ${m.highlight || style.value}`}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* INFO BOXES EXACTOS */}
      {info && (
        <div className={style.info}>
          <p className={`text-xs flex items-start gap-2 ${style.infoText}`}>
            {Icon && <Icon size={12} className="mt-0.5 flex-shrink-0" />}
            <span>{info}</span>
          </p>
        </div>
      )}

      {info2 && (
        <div className={`mt-2 p-2 rounded ${style.info}`}>
          <p className={`text-xs ${style.infoText}`}>
            {info2}
          </p>
        </div>
      )}
    </div>
  );
};

export default IEEESection;
