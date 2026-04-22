import React, { useState } from 'react';
import { Eye, Upload, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { ValidatedSection } from '../common/ValidatedSection';
import GroundingGridSVG from '../GroundingGridSVG';
import GroundingGrid3D from '../GroundingGrid3D';
import SoilProfile from '../visualizations/SoilProfile';
import FaultAnimation from '../visualizations/FaultAnimation';
import HeatMap from '../visualizations/HeatMap';
import HeatmapCanvas from '../../visual/HeatmapCanvas';
import ETAPVisualizationControls from '../ETAPVisualizationControls';
import ProfileChart from '../ProfileChart';
import { importDXF, extractGridFromDXF } from '../../import/dxfImporter';

export const VisualizationPanel = ({ params, calculations, darkMode, updateParams }) => {
  const [dxfData, setDxfData] = useState(null);
  const [dxfValidation, setDxfValidation] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // ETAP Visualization State
  const [interpolationPower, setInterpolationPower] = useState(2);
  const [smoothingLevel, setSmoothingLevel] = useState(0.5);
  const [showContours, setShowContours] = useState(true);
  const [numContours, setNumContours] = useState(10);
  const [contourThickness, setContourThickness] = useState(2);
  
  // Professional Analysis Mode State
  const [analysisMode, setAnalysisMode] = useState('discrete'); // 'discrete' | 'analytical' | 'overlay' | 'difference'
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  
  // Slice/Profile State
  const [slice, setSlice] = useState({ mode: 'none', position: 0 });
  const [profileData, setProfileData] = useState([]);
  
  // Risk Stats State
  const [riskStats, setRiskStats] = useState({ dangerCount: 0, maxVoltage: 0, status: 'SAFE', recommendations: [] });

  const handleRiskStatsChange = (stats) => {
    setRiskStats(stats);
  };

  const handleSliceChange = (newSlice) => {
    setSlice(newSlice);
    if (newSlice.mode !== 'none') {
      const sampleData = calculations ? generateSampleData(calculations) : [];
      const resolution = 100;
      const gridValues = [];
      
      // Simple interpolated field for profile
      for (let i = 0; i < resolution; i++) {
        gridValues[i] = [];
        for (let j = 0; j < resolution; j++) {
          const x = (i / resolution) * 30 - 15;
          const y = (j / resolution) * 30 - 15;
          const distance = Math.sqrt(x * x + y * y);
          const potential = (calculations?.Em || 500) * Math.exp(-distance / 3) + (calculations?.Es || 300) * 0.3;
          gridValues[i][j] = potential;
        }
      }
      
      const data = [];
      if (newSlice.mode === 'x') {
        const j = Math.floor((newSlice.position / 400) * resolution);
        for (let i = 0; i < resolution; i++) {
          data.push({ x: i, v: gridValues[i][j] });
        }
      } else if (newSlice.mode === 'y') {
        const i = Math.floor((newSlice.position / 500) * resolution);
        for (let j = 0; j < resolution; j++) {
          data.push({ x: j, v: gridValues[i][j] });
        }
      }
      setProfileData(data);
    } else {
      setProfileData([]);
    }
  };

  const handleDXFImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const parsed = await importDXF(file);
      setDxfValidation({ errors: [], warnings: [], valid: true });
      setDxfData(parsed);
      
      if (parsed.bounds) {
        const width = parsed.bounds.width || 0;
        const height = parsed.bounds.height || 0;
        
        if (width > 0 && height > 0 && width <= 1000 && height <= 1000) {
          if (updateParams) {
            updateParams('gridLength', width);
            updateParams('gridWidth', height);
          }
        }
      }
    } catch (error) {
      console.error('Error importing DXF:', error);
      setDxfValidation({ errors: ['Error al importar archivo DXF'], warnings: [], valid: false });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <ValidatedSection title="Visualización de Malla de Tierra" icon={Eye} status="info" darkMode={darkMode}>
        <div className={`p-4 rounded-lg bg-gray-800/50`}>
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Upload size={18} />Importar DXF</h3>
          <div className="flex gap-3 items-center">
            <label className="flex-1">
              <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all border-gray-600 hover:border-blue-500">
                <FileText size={24} className="mx-auto mb-2 text-gray-500" />
                <span className="text-sm text-gray-500">{isImporting ? 'Importando...' : 'Seleccionar archivo DXF'}</span>
              </div>
              <input type="file" accept=".dxf" onChange={handleDXFImport} className="hidden" disabled={isImporting} />
            </label>
          </div>
          {dxfValidation && (
            <div className="mt-3 space-y-2">
              {dxfValidation.valid ? (
                <div className="flex items-center gap-2 text-green-600 text-sm"><CheckCircle size={16} /><span>DXF importado correctamente - {dxfData?.nodes?.length || 0} nodos, {dxfData?.conductors?.length || 0} conductores</span></div>
              ) : (
                dxfValidation.errors.map((error, i) => (
                  <div key={i} className="flex items-center gap-2 text-red-600 text-sm"><AlertTriangle size={16} /><span>{error}</span></div>
                ))
              )}
              {dxfValidation.warnings.map((warning, i) => (
                <div key={i} className="flex items-center gap-2 text-yellow-600 text-sm"><AlertTriangle size={16} /><span>{warning}</span></div>
              ))}
            </div>
          )}
        </div>
        <SoilProfile params={params} darkMode={darkMode} />
        <HeatMap params={params} calculations={calculations} darkMode={darkMode} />
        
        {/* ETAP Level Visualization */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} mb-4`}>
          <h3 className="text-lg font-bold mb-4">🎨 ETAP Level: Advanced Voltage Visualization</h3>
          
          <ETAPVisualizationControls
            interpolationPower={interpolationPower}
            smoothingLevel={smoothingLevel}
            showContours={showContours}
            numContours={numContours}
            contourThickness={contourThickness}
            onInterpolationPowerChange={setInterpolationPower}
            onSmoothingLevelChange={setSmoothingLevel}
            onShowContoursChange={setShowContours}
            onNumContoursChange={setNumContours}
            onContourThicknessChange={setContourThickness}
            darkMode={darkMode}
          />
          
          {/* 🎯 Professional Analysis Mode Controls */}
          <div className="mt-4 p-3 rounded-lg bg-gray-700">
            <h4 className="text-white font-semibold mb-3">🔬 Professional Analysis Mode</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Analysis Mode</label>
                <select
                  value={analysisMode}
                  onChange={(e) => setAnalysisMode(e.target.value)}
                  className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm"
                >
                  <option value="discrete">🔵 Discrete (Solver)</option>
                  <option value="analytical">🟢 Analytical (IEEE)</option>
                  <option value="overlay">🎯 Overlay (Both)</option>
                  <option value="difference">🔴 Difference (Debug)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Overlay Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-400">{Math.round(overlayOpacity * 100)}%</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              {analysisMode === 'discrete' && '🔵 Shows discrete solver results (source of truth)'}
              {analysisMode === 'analytical' && '🟢 Shows analytical IEEE model for comparison'}
              {analysisMode === 'overlay' && '🎯 Overlay: discrete heatmap + analytical contours'}
              {analysisMode === 'difference' && '🔴 Difference: red = discrete > analytical, blue = discrete < analytical'}
            </div>
          </div>
          
          {calculations && calculations.Em && (
            <>
              <HeatmapCanvas
                data={generateSampleData(calculations)}
                width={500}
                height={400}
                interpolationPower={interpolationPower}
                smoothingLevel={smoothingLevel}
                showContours={showContours}
                numContours={numContours}
                contourThickness={contourThickness}
                onSliceChange={handleSliceChange}
                onRiskStatsChange={handleRiskStatsChange}
                permissibleVoltage={calculations.permissible?.Etouch70 || 50}
                discreteGrid={calculations?.discreteGrid || null}
                analyticalGrid={calculations?.analyticalGrid || null}
                mode={analysisMode}
                overlayOpacity={overlayOpacity}
              />
              <div className="mt-4 p-3 rounded-lg bg-gray-700">
                <h4 className="text-white font-semibold mb-2">🛡️ IEEE 80 Risk Analysis</h4>
                <div className="flex gap-4 text-sm">
                  <span className={`font-bold ${riskStats.status === 'UNSAFE' ? 'text-red-400' : 'text-green-400'}`}>
                    Status: {riskStats.status}
                  </span>
                  <span className="text-gray-300">
                    Danger Zones: {riskStats.dangerCount}
                  </span>
                  <span className="text-gray-300">
                    Max Voltage: {riskStats.maxVoltage.toFixed(1)}V
                  </span>
                </div>
              </div>
              {riskStats.recommendations && riskStats.recommendations.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-gray-700">
                  <h4 className="text-white font-semibold mb-3">🎯 Engineering Recommendations</h4>
                  {riskStats.recommendations.map((rec, idx) => (
                    <div key={idx} className="mb-3 p-2 bg-gray-600 rounded">
                      <p className="text-yellow-400 font-semibold text-sm mb-2">
                        {rec.title} ({rec.count} zones)
                      </p>
                      <ul className="list-disc ml-4 text-xs text-gray-300 space-y-1">
                        {rec.sample.actions.map((action, i) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
              {profileData.length > 0 && (
                <div className="mt-4">
                  <ProfileChart data={profileData} mode={slice.mode} />
                </div>
              )}
            </>
          )}
        </div>
        
        <GroundingGridSVG params={params} darkMode={darkMode} dxfData={dxfData} />
        <GroundingGrid3D params={params} darkMode={darkMode} />
        <FaultAnimation params={params} darkMode={darkMode} />
      </ValidatedSection>
    </div>
  );
};

// Helper function to generate sample data for ETAP visualization
function generateSampleData(calculations) {
  const data = [];
  const gridSize = 10;
  const Em = calculations.Em || 500;
  const Es = calculations.Es || 300;
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = i - gridSize / 2;
      const y = j - gridSize / 2;
      const distance = Math.sqrt(x * x + y * y);
      
      const potential = Em * Math.exp(-distance / 3) + Es * 0.3;
      
      data.push({
        x: x,
        y: y,
        potential: potential,
        isRod: (i === 0 && j === 0)
      });
    }
  }
  
  return data;
}