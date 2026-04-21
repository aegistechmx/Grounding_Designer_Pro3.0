import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, TrendingUp, Download, Sliders, Info, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const SensitivityCharts = ({ sensitivityData, darkMode }) => {
  const [selectedMetric, setSelectedMetric] = useState('sensitivity');
  const [chartType, setChartType] = useState('bar');
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);
  const canvasRef = useRef(null);

  const metrics = [
    { key: 'sensitivity', label: 'Sensibilidad', unit: '' },
    { key: 'maxVariationRg', label: 'Variación Máx Rg', unit: 'Ω' },
    { key: 'maxVariationEm', label: 'Variación Máx Em', unit: 'V' },
    { key: 'maxVariationEs', label: 'Variación Máx Es', unit: 'V' }
  ];

  useEffect(() => {
    if (!sensitivityData || !canvasRef.current) return;
    drawChart();
  }, [sensitivityData, selectedMetric, chartType, darkMode]);

  const getMetricValue = (item) => {
    switch (selectedMetric) {
      case 'sensitivity':
        return item.sensitivity;
      case 'maxVariationRg':
        return item.maxVariation?.Rg || 0;
      case 'maxVariationEm':
        return item.maxVariation?.Em || 0;
      case 'maxVariationEs':
        return item.maxVariation?.Es || 0;
      default:
        return 0;
    }
  };

  const getMetricColor = (value) => {
    if (selectedMetric === 'sensitivity') {
      if (value > 100) return '#ef4444';
      if (value > 50) return '#f59e0b';
      if (value > 20) return '#eab308';
      return '#10b981';
    }
    return darkMode ? '#3b82f6' : '#2563eb';
  };

  const drawChart = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = darkMode ? '#1f2937' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    if (!sensitivityData || !sensitivityData.ranking || sensitivityData.ranking.length === 0) {
      ctx.fillStyle = darkMode ? '#9ca3af' : '#6b7280';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No hay datos de análisis de sensibilidad', width / 2, height / 2);
      return;
    }

    const data = sensitivityData.ranking;
    const padding = { top: 40, right: 30, bottom: 80, left: 70 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const values = data.map(item => getMetricValue(item));
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);

    // Draw grid lines
    ctx.strokeStyle = darkMode ? '#374151' : '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      const value = maxValue - (maxValue - minValue) * (i / 5);
      ctx.fillStyle = darkMode ? '#9ca3af' : '#6b7280';
      ctx.font = '11px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(1), padding.left - 10, y + 4);
    }

    // Draw bars
    const barWidth = chartWidth / data.length * 0.6;
    const barGap = chartWidth / data.length * 0.4;

    data.forEach((item, index) => {
      const value = getMetricValue(item);
      const normalizedValue = (value - minValue) / (maxValue - minValue || 1);
      const barHeight = normalizedValue * chartHeight;
      const x = padding.left + index * (barWidth + barGap) + barGap / 2;
      const y = padding.top + chartHeight - barHeight;

      // Bar
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, getMetricColor(value));
      gradient.addColorStop(1, darkMode ? '#1f2937' : '#ffffff');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Border
      ctx.strokeStyle = getMetricColor(value);
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // X-axis labels (rotated)
      ctx.save();
      ctx.translate(x + barWidth / 2, height - padding.bottom + 10);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = darkMode ? '#d1d5db' : '#374151';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(item.label.substring(0, 15), 0, 0);
      ctx.restore();

      // Value on top of bar
      ctx.fillStyle = darkMode ? '#d1d5db' : '#374151';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(value.toFixed(1), x + barWidth / 2, y - 5);
    });

    // Title
    ctx.fillStyle = darkMode ? '#f3f4f6' : '#111827';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    const metric = metrics.find(m => m.key === selectedMetric);
    ctx.fillText(`${metric?.label} por Parámetro (${metric?.unit})`, width / 2, 25);

    // Impact legend
    if (selectedMetric === 'sensitivity') {
      const legendX = width - 150;
      const legendY = 30;
      const legendItems = [
        { color: '#ef4444', label: 'Muy Alto' },
        { color: '#f59e0b', label: 'Alto' },
        { color: '#eab308', label: 'Medio' },
        { color: '#10b981', label: 'Bajo' }
      ];

      legendItems.forEach((item, index) => {
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX, legendY + index * 15, 12, 12);
        ctx.fillStyle = darkMode ? '#d1d5db' : '#374151';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(item.label, legendX + 18, legendY + index * 15 + 10);
      });
    }
  };

  const handleCanvasClick = (e) => {
    if (!sensitivityData || !sensitivityData.ranking) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const padding = { top: 40, right: 30, bottom: 80, left: 70 };
    const chartWidth = canvas.width - padding.left - padding.right;
    const data = sensitivityData.ranking;
    const barWidth = chartWidth / data.length * 0.6;
    const barGap = chartWidth / data.length * 0.4;

    data.forEach((item, index) => {
      const barX = padding.left + index * (barWidth + barGap) + barGap / 2;
      if (x >= barX && x <= barX + barWidth) {
        const value = getMetricValue(item);
        setTooltipData({
          x: e.clientX,
          y: e.clientY,
          label: item.label,
          value: value.toFixed(2),
          impact: item.impact,
          unit: metrics.find(m => m.key === selectedMetric)?.unit
        });
        setShowTooltip(true);
      }
    });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `sensitivity-chart-${selectedMetric}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold flex items-center gap-2">
          <BarChart3 size={18} /> Gráficos de Sensibilidad
        </h4>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="Descargar gráfico"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => setShowTooltip(!showTooltip)}
            className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="Mostrar información"
          >
            <Info size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm font-semibold mb-1 block">Métrica</label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className={`w-full p-2 rounded text-sm ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
          >
            {metrics.map(metric => (
              <option key={metric.key} value={metric.key}>
                {metric.label} ({metric.unit})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold mb-1 block">Tipo de Gráfico</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className={`w-full p-2 rounded text-sm ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
          >
            <option value="bar">Barras</option>
            <option value="line">Líneas</option>
          </select>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full h-auto rounded-lg border cursor-crosshair"
          onClick={handleCanvasClick}
          onMouseLeave={() => setShowTooltip(false)}
        />
        
        {showTooltip && tooltipData && (
          <div
            className="fixed z-10 bg-black/90 text-white text-xs rounded px-3 py-2 pointer-events-none"
            style={{ left: tooltipData.x + 10, top: tooltipData.y - 60 }}
          >
            <div className="font-semibold">{tooltipData.label}</div>
            <div>{tooltipData.value} {tooltipData.unit}</div>
            {tooltipData.impact && (
              <div className={`mt-1 ${
                tooltipData.impact === 'Muy Alto' ? 'text-red-400' :
                tooltipData.impact === 'Alto' ? 'text-orange-400' :
                tooltipData.impact === 'Medio' ? 'text-yellow-400' : 'text-green-400'
              }`}>
                Impacto: {tooltipData.impact}
              </div>
            )}
          </div>
        )}
      </div>

      {sensitivityData && sensitivityData.ranking && (
        <div className="mt-4">
          <h5 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp size={16} /> Ranking de Sensibilidad
          </h5>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {sensitivityData.ranking.map((item, index) => (
              <div
                key={index}
                className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-red-500 text-white' :
                    index === 1 ? 'bg-orange-500 text-white' :
                    index === 2 ? 'bg-yellow-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{getMetricValue(item).toFixed(2)}</span>
                  <span className={`text-xs ${
                    item.impact === 'Muy Alto' ? 'text-red-500' :
                    item.impact === 'Alto' ? 'text-orange-500' :
                    item.impact === 'Medio' ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {item.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SensitivityCharts;
