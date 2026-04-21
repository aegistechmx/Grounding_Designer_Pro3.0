import React from 'react';
import { Menu, X, Search } from 'lucide-react';

const NavItem = ({ icon, label, active, onClick, darkMode }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      active
        ? 'bg-blue-600 text-white shadow-md'
        : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    <span className="text-xl">{icon}</span>
    <span className="font-medium">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
  </button>
);

export const Sidebar = ({ activeTab, setActiveTab, darkMode, sidebarOpen, setSidebarOpen }) => {
  const navItems = [
    { icon: '📐', label: 'Diseño de Malla', id: 'design' },
    { icon: '📊', label: 'Dashboard', id: 'dashboard' },
    { icon: '🎨', label: 'Visualizaciones', id: 'visualization' },
    { icon: '✅', label: 'Validación', id: 'validation' },
    { icon: '⚡', label: 'Optimización', id: 'optimization' },
    { icon: '🔌', label: 'Alimentadores', id: 'feeders' },
    { icon: '📜', label: 'Normativas', id: 'normatives' },
    { icon: '📄', label: 'Reportes', id: 'reports' }
  ];

  return (
    <>
      {/* Sidebar Desktop */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-6 space-y-1">
          {/* Búsqueda */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="🔍 Buscar parámetro..."
              className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
              }`}
            />
          </div>
          
          {navItems.map(item => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              darkMode={darkMode}
            />
          ))}
        </div>
      </div>

      {/* Botón menú móvil */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed bottom-4 left-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar móvil */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-xl p-4 animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Menú</h3>
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded hover:bg-gray-100">✕</button>
            </div>
            {navItems.map(item => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeTab === item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                darkMode={darkMode}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};