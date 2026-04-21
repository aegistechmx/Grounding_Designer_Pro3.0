import React, { useState, useEffect } from 'react';
import { FileText, Video, Download, X, BookOpen, Calculator, Zap, Shield, ChevronDown, ChevronUp } from 'lucide-react';

const DocumentationViewer = ({ darkMode, onClose }) => {
  const [activeTab, setActiveTab] = useState('manual');
  const [expandedSections, setExpandedSections] = useState({});
  const [manualHtml, setManualHtml] = useState('');

  // Cargar el manual HTML
  useEffect(() => {
    fetch('/Manual de Usuario - Grounding Designer Pro.html')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(html => {
        // Inyectar estilos adicionales para que se vea bien en modo oscuro
        const styledHtml = html.replace(
          '</head>',
          `<style>
            body { 
              font-family: system-ui, -apple-system, sans-serif;
              line-height: 1.5;
            }
            .container { max-width: 100%; margin: 0; padding: 20px; }
            .nav-bar { flex-wrap: wrap; gap: 8px; }
            .nav-bar a { font-size: 12px; padding: 6px 12px; }
            @media (max-width: 768px) {
              .nav-bar a { font-size: 10px; padding: 4px 8px; }
              h2 { font-size: 1.2rem; }
            }
          </style>
          </head>`
        );
        setManualHtml(styledHtml);
      })
      .catch(error => {
        console.error('Error cargando manual:', error);
        setManualHtml('<div class="p-6 text-center"><p>❌ Error al cargar el manual. Verifica que el archivo exista en la carpeta public.</p></div>');
      });
  }, []);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Secciones de metodología de cálculos
  const methodologySteps = [
    {
      id: 1,
      title: '1. Cálculo de la Resistencia de la Malla (Rg)',
      icon: <Calculator size={20} />,
      content: (
        <div className="space-y-3">
          <p className="text-sm">La resistencia de la malla de tierras se calcula utilizando la fórmula de Laurent:</p>
          <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} font-mono text-sm`}>
            Rg = (ρ / (4r)) + (ρ / L)
          </div>
          <ul className="text-sm space-y-1 ml-4">
            <li>• ρ = Resistividad del suelo (Ω·m)</li>
            <li>• r = Radio equivalente de la malla (m)</li>
            <li>• L = Longitud total de conductores (m)</li>
          </ul>
          <p className="text-xs text-gray-500">Esta fórmula considera la contribución de los conductores horizontales y el efecto de la geometría de la malla.</p>
        </div>
      )
    },
    {
      id: 2,
      title: '2. Cálculo de la Corriente de Falla (If)',
      icon: <Zap size={20} />,
      content: (
        <div className="space-y-3">
          <p className="text-sm">La corriente de falla que fluye a través de la malla de tierras se calcula como:</p>
          <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} font-mono text-sm`}>
            Ig = Sf × 3I₀
          </div>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Sf = Factor de división de corriente (0.15 - 0.65)</li>
            <li>• 3I₀ = Corriente de secuencia cero (A)</li>
          </ul>
          <p className="text-xs text-gray-500">El factor Sf depende de la configuración del sistema y de la presencia de neutros conectados a tierra.</p>
        </div>
      )
    },
    {
      id: 3,
      title: '3. Cálculo del GPR (Ground Potential Rise)',
      icon: <BookOpen size={20} />,
      content: (
        <div className="space-y-3">
          <p className="text-sm">El potencial de elevación de tierra se calcula como:</p>
          <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} font-mono text-sm`}>
            GPR = Ig × Rg
          </div>
          <ul className="text-sm space-y-1 ml-4">
            <li>• GPR = Potencial de elevación de tierra (V)</li>
            <li>• Ig = Corriente de falla en la malla (A)</li>
            <li>• Rg = Resistencia de la malla (Ω)</li>
          </ul>
          <div className={`p-2 rounded ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'} text-xs`}>
            ⚠️ El GPR debe ser menor a los niveles de aislamiento de los equipos conectados.
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: '4. Cálculo de Tensiones de Paso y Contacto',
      icon: <Shield size={20} />,
      content: (
        <div className="space-y-3">
          <p className="text-sm">Las tensiones máximas permisibles según IEEE Std 80-2013:</p>
          <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} font-mono text-sm`}>
            Etouch = (1000 + 1.5Cs × ρs) / √(ts)
          </div>
          <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} font-mono text-sm`}>
            Estep = (1000 + 6Cs × ρs) / √(ts)
          </div>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Cs = Factor de capa superficial</li>
            <li>• ρs = Resistividad de la capa superficial (Ω·m)</li>
            <li>• ts = Duración de la falla (s)</li>
          </ul>
          <p className="text-xs text-gray-500">El factor Cs se calcula basándose en la profundidad de la capa superficial y la resistividad del suelo natural.</p>
        </div>
      )
    },
    {
      id: 5,
      title: '5. Factor de Capa Superficial (Cs)',
      icon: <BookOpen size={20} />,
      content: (
        <div className="space-y-3">
          <p className="text-sm">El factor de capa superficial se calcula como:</p>
          <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} font-mono text-sm`}>
            Cs = 1 - (0.09 × (1 - ρ/ρs) / (2hs + 0.09))
          </div>
          <ul className="text-sm space-y-1 ml-4">
            <li>• ρ = Resistividad del suelo natural (Ω·m)</li>
            <li>• ρs = Resistividad de la capa superficial (Ω·m)</li>
            <li>• hs = Profundidad de la capa superficial (m)</li>
          </ul>
          <div className={`p-2 rounded ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} text-xs`}>
            💡 Capas superficiales de alta resistividad (grava, asfalto) aumentan Cs y mejoran la seguridad.
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: '6. Tensiones Calculadas en la Malla',
      icon: <Calculator size={20} />,
      content: (
        <div className="space-y-3">
          <p className="text-sm">Las tensiones reales en la malla se calculan utilizando factores de geometría:</p>
          <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} font-mono text-sm`}>
            Em = Km × Kmρ × Ki × GPR
          </div>
          <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} font-mono text-sm`}>
            Es = Ks × Ksρ × Ki × GPR
          </div>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Km, Ks = Factores de geometría de malla</li>
            <li>• Kmρ, Ksρ = Factores de corrección de resistividad</li>
            <li>• Ki = Factor de irregularidad</li>
          </ul>
          <p className="text-xs text-gray-500">Estos factores dependen de la geometría de la malla, número de conductores, y profundidad de enterramiento.</p>
        </div>
      )
    },
    {
      id: 7,
      title: '7. Verificación de Cumplimiento',
      icon: <Shield size={20} />,
      content: (
        <div className="space-y-3">
          <p className="text-sm">El diseño cumple con IEEE 80-2013 si:</p>
          <ul className="text-sm space-y-2 ml-4">
            <li>✅ Em ≤ Etouch (Tensión de contacto segura)</li>
            <li>✅ Es ≤ Estep (Tensión de paso segura)</li>
            <li>✅ Rg ≤ 5 Ω (Recomendado)</li>
            <li>✅ GPR ≤ Nivel de aislamiento de equipos</li>
          </ul>
          <div className={`p-2 rounded ${darkMode ? 'bg-green-900/30' : 'bg-green-50'} text-xs`}>
            🎯 Si no cumple, se debe: aumentar conductores, agregar varillas, mejorar capa superficial, o reducir el factor Sf.
          </div>
        </div>
      )
    }
  ];

  const references = [
    { title: 'IEEE Std 80-2013', description: 'Guide for Safety in AC Substation Grounding', year: '2013' },
    { title: 'NOM-001-SEDE-2012', description: 'Instalaciones Eléctricas (México)', year: '2012' },
    { title: 'NFPA 70', description: 'National Electrical Code (NEC)', year: '2023' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-5xl w-full max-h-[90vh] overflow-auto rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
        
        {/* Header con pestañas */}
        <div className={`sticky top-0 z-10 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center px-4">
            <div className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('manual')}
                className={`px-4 py-3 font-medium transition-all ${
                  activeTab === 'manual'
                    ? `border-b-2 border-blue-500 text-blue-600 ${darkMode ? 'text-blue-400' : ''}`
                    : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText size={16} className="inline mr-2" />
                📖 Manual de Usuario
              </button>
              <button
                onClick={() => setActiveTab('methodology')}
                className={`px-4 py-3 font-medium transition-all ${
                  activeTab === 'methodology'
                    ? `border-b-2 border-blue-500 text-blue-600 ${darkMode ? 'text-blue-400' : ''}`
                    : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calculator size={16} className="inline mr-2" />
                📐 Metodología de Cálculo
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`px-4 py-3 font-medium transition-all ${
                  activeTab === 'video'
                    ? `border-b-2 border-blue-500 text-blue-600 ${darkMode ? 'text-blue-400' : ''}`
                    : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Video size={16} className="inline mr-2" />
                🎬 Video Tutorial
              </button>
            </div>
            <button onClick={onClose} className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Contenido según pestaña */}
        <div className="p-6">
          
          {/* PESTAÑA 1: Manual de Usuario (HTML) */}
          {activeTab === 'manual' && (
            <div className="manual-container">
              <div className="flex justify-end mb-4">
                <a 
                  href="/Manual de Usuario - Grounding Designer Pro.html" 
                  download
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm flex items-center gap-1 hover:bg-blue-700"
                >
                  <Download size={14} /> Descargar Manual PDF
                </a>
              </div>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: manualHtml }}
                style={{
                  '& img': { maxWidth: '100%', height: 'auto' },
                  '& table': { width: '100%', borderCollapse: 'collapse' },
                  '& th, & td': { border: '1px solid #ddd', padding: '8px', textAlign: 'left' },
                  '& th': { backgroundColor: darkMode ? '#374151' : '#f3f4f6' }
                }}
              />
            </div>
          )}
          
          {/* PESTAÑA 2: Metodología de Cálculo */}
          {activeTab === 'methodology' && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <BookOpen size={24} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                <h2 className="text-xl font-bold">📚 Metodología de Cálculos IEEE 80-2013</h2>
              </div>

              <div className="space-y-4">
                {methodologySteps.map((step) => (
                  <div
                    key={step.id}
                    className={`border rounded-lg overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <button
                      onClick={() => toggleSection(step.id)}
                      className={`w-full p-4 flex items-center justify-between ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={darkMode ? 'text-blue-400' : 'text-blue-600'}>{step.icon}</span>
                        <span className="font-semibold">{step.title}</span>
                      </div>
                      {expandedSections[step.id] ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </button>
                    {expandedSections[step.id] && (
                      <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        {step.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BookOpen size={18} />
                  Referencias Normativas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {references.map((ref, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="font-medium">{ref.title}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{ref.description}</div>
                      <div className="text-xs text-gray-500">{ref.year}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-xs">
                <p className="font-medium mb-1">⚠️ Nota Importante:</p>
                <p>Estos cálculos son aproximaciones basadas en las fórmulas de IEEE Std 80-2013. Para proyectos críticos, se recomienda realizar análisis detallados con software especializado como CDEGS, ETAP, o SKM PowerTools.</p>
              </div>
            </div>
          )}
          
          {/* PESTAÑA 3: Video Tutorial */}
          {activeTab === 'video' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Video Tutorial - Grounding Designer Pro</h3>
                <a 
                  href="/video-tutorial.mp4" 
                  download
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm flex items-center gap-1 hover:bg-blue-700"
                >
                  <Download size={14} /> Descargar Video
                </a>
              </div>
              
              <video 
                controls 
                className="w-full rounded-lg shadow"
                poster="/video-thumbnail.jpg"
              >
                <source src="/video-tutorial.mp4" type="video/mp4" />
                Tu navegador no soporta videos HTML5.
              </video>
              
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Capítulos del video:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>00:00 - Introducción a la aplicación</li>
                  <li>02:30 - Configuración del transformador</li>
                  <li>05:00 - Caracterización del suelo</li>
                  <li>08:00 - Diseño de la malla</li>
                  <li>12:00 - Interpretación de resultados</li>
                  <li>15:00 - Optimización GPR</li>
                  <li>18:00 - Exportación de reportes</li>
                  <li>21:00 - Consejos y mejores prácticas</li>
                </ul>
              </div>
              
              <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm">📌 <strong>Consejo:</strong> Presiona F1 en cualquier pantalla para ver ayuda contextual</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer común */}
        <div className={`p-4 border-t ${darkMode ? 'bg-gray-900/30 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <p className="text-sm text-gray-500">
            💡 ¿Necesitas ayuda adicional? Contacta a soporte: <strong>proyectosintegralespv@gmail.com</strong> | 📞 (322) 245 63 22
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentationViewer;