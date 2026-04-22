import React, { useMemo } from 'react';
import { X, Printer, Download, FileText } from 'lucide-react';
import { formatNumber, formatDistance } from '../../utils/formatters';

const MaterialListModal = ({ materialList, darkMode, onClose, onExport }) => {
  // ============================================
  // FUNCIONES AUXILIARES
  // ============================================
  const safeValue = (value, defaultValue = 'N/A') => {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'number' && isNaN(value)) return defaultValue;
    return value;
  };

  const safeNumber = (value, decimals = 0) => {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) return 'N/A';
    return value.toFixed(decimals);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!materialList) {
    return null;
  }

  // Datos seguros
  const projectName = safeValue(materialList.projectName, 'Proyecto de Puesta a Tierra');
  const date = useMemo(() => safeValue(materialList.date, new Date().toLocaleDateString('es-MX')), [materialList.date]);
  const gridArea = formatNumber(materialList.gridArea, 0);
  const totalConductor = formatDistance(materialList.totalConductor, 0);
  const numRods = formatNumber(materialList.numRods, 0);
  const rodLength = formatDistance(materialList.rodLength, 1);
  const totalCost = formatNumber(materialList.totalCost, 0);
  const complies = materialList.complies === true;
  const materials = materialList.materials || [];

  // Calcular totales por categoría
  const categoryTotals = materials.map(category => ({
    name: category.category,
    total: category.items?.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0) || 0
  }));

  const grandTotal = categoryTotals.reduce((sum, cat) => sum + cat.total, 0);

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4`}>
      <div className={`max-w-5xl w-full max-h-[85vh] overflow-auto rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
        
        {/* HEADER */}
        <div className={`sticky top-0 flex justify-between items-center p-4 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className="text-xl font-bold text-green-600 flex items-center gap-2">
            <FileText size={20} /> Lista de Materiales
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint} 
              className={`p-2 rounded transition-all ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} 
              title="Imprimir"
            >
              <Printer size={18} />
            </button>
            <button 
              onClick={() => onExport && onExport()} 
              className={`p-2 rounded transition-all ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} 
              title="Exportar CSV"
            >
              <Download size={18} />
            </button>
            <button 
              onClick={onClose} 
              className={`p-2 rounded transition-all ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        {/* CONTENIDO */}
        <div className="p-6" id="material-list-content">
          
          {/* ENCABEZADO */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold">GROUNDING DESIGNER PRO</h3>
            <p className="text-gray-500">Lista de Materiales para Puesta a Tierra</p>
            <p className="text-sm mt-2"><strong>Proyecto:</strong> {projectName}</p>
            <p className="text-sm"><strong>Fecha:</strong> {date}</p>
          </div>
          
          {/* RESUMEN */}
          <div className={`p-4 rounded-lg mb-6 ${complies ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{gridArea} m²</div>
                <div className="text-xs text-gray-500">Área de malla</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{totalConductor}</div>
                <div className="text-xs text-gray-500">Conductor total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{numRods} und</div>
                <div className="text-xs text-gray-500">Varillas de {rodLength}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{formatNumber(grandTotal, 0)} MXN</div>
                <div className="text-xs text-gray-500">Costo estimado</div>
              </div>
            </div>
          </div>
          
          {/* TABLA DE MATERIALES */}
          {materials.length > 0 ? (
            materials.map((category, idx) => {
              const categoryTotal = categoryTotals.find(c => c.name === category.category)?.total || 0;
              const items = category.items || [];
              
              return (
                <div key={idx} className="mb-6">
                  <h4 className={`font-semibold text-lg mb-2 pb-1 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    {category.category}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <tr>
                          <th className="p-2 text-left">Código</th>
                          <th className="p-2 text-left">Producto</th>
                          <th className="p-2 text-left">Descripción</th>
                          <th className="p-2 text-center">Cantidad</th>
                          <th className="p-2 text-center">Precio Unit. (MXN)</th>
                          <th className="p-2 text-center">Total (MXN)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, itemIdx) => {
                          const quantity = formatNumber(item.quantity, 0);
                          const unitPrice = formatNumber(item.unitPrice, 0);
                          const totalPrice = formatNumber(item.totalPrice, 0);
                          
                          return (
                            <tr key={itemIdx} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                              <td className="p-2 font-mono text-xs">{safeValue(item.code, '-')}</td>
                              <td className="p-2 font-medium">{safeValue(item.name, '-')}</td>
                              <td className="p-2 text-xs text-gray-500">{safeValue(item.description, '-')}</td>
                              <td className="p-2 text-center">{quantity} {safeValue(item.unit, 'pza')}</td>
                              <td className="p-2 text-center">${unitPrice}</td>
                              <td className="p-2 text-center font-semibold">${totalPrice}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {categoryTotal > 0 && (
                        <tfoot className={`${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                          <tr>
                            <td colSpan="5" className="p-2 text-right font-semibold">Subtotal {category.category}:</td>
                            <td className="p-2 text-center font-bold">{formatNumber(categoryTotal, 0)} MXN</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={`p-8 text-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
              <p className="text-gray-500">No hay materiales disponibles</p>
            </div>
          )}
          
          {/* TOTAL GENERAL */}
          <div className={`mt-4 p-3 rounded-lg text-right font-bold text-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            TOTAL ESTIMADO: {formatNumber(grandTotal, 0)} MXN
          </div>
          
          {/* NOTAS */}
          <div className="mt-4 text-xs text-gray-500">
            <p>💡 Notas:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Los precios son estimados y pueden variar según proveedor y región</li>
              <li>Se recomienda agregar 10% adicional para contingencias</li>
              <li>Los conectores y accesorios pueden variar según necesidades específicas</li>
              <li>Cotizar con distribuidor autorizado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialListModal;