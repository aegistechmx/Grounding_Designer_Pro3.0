import React, { useState, useEffect } from 'react';
import InputForm from '../components/InputForm';
import ResultsPanel from '../components/ResultsPanel';
import ComparisonPanel from '../components/ComparisonPanel';
import HeatmapCanvas from '../components/HeatmapCanvas';
import HeatmapControls from '../components/HeatmapControls';
import ContourControls from '../components/ContourControls';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function Home() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Interpolation controls state
  const [interpolationPower, setInterpolationPower] = useState(2);
  const [smoothingLevel, setSmoothingLevel] = useState(0.5);
  
  // Contour controls state
  const [showContours, setShowContours] = useState(true);
  const [numContours, setNumContours] = useState(10);
  const [contourThickness, setContourThickness] = useState(2);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing requests or timers
      setLoading(false);
      setError(null);
    };
  }, []);

  const handleCalculate = async (input) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('http://localhost:3002/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.data);
      } else {
        setError(data.error || 'Calculation failed');
      }
    } catch (err) {
      setError('Failed to connect to the API. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            IEEE 80 Dual-Method Grounding Analysis
          </h2>
          <p className="text-gray-600">
            Compare analytical IEEE 80 method with discrete nodal analysis for comprehensive grounding system evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InputForm onCalculate={handleCalculate} loading={loading} />
          
          <div className="space-y-6">
            {loading && <LoadingSkeleton />}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-800">
                  <strong>Error:</strong> {error}
                </div>
              </div>
            )}

            {results && (
              <ErrorBoundary>
                <ResultsPanel results={results} />
                <ComparisonPanel results={results} />
                
                {/* ETAP Level Visualization Controls */}
                {results.methods?.discrete?.nodes && results.methods?.discrete?.voltages && (
                  <>
                    <HeatmapControls
                      interpolationPower={interpolationPower}
                      smoothingLevel={smoothingLevel}
                      onInterpolationPowerChange={setInterpolationPower}
                      onSmoothingLevelChange={setSmoothingLevel}
                    />
                    
                    <ContourControls
                      showContours={showContours}
                      numContours={numContours}
                      contourThickness={contourThickness}
                      onShowContoursChange={setShowContours}
                      onNumContoursChange={setNumContours}
                      onContourThicknessChange={setContourThickness}
                    />
                    
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">
                        ETAP Level: Spatial Voltage Distribution
                      </h3>
                      <div className="flex flex-col items-center space-y-4">
                        <HeatmapCanvas 
                          nodes={results.methods.discrete.nodes}
                          voltages={results.methods.discrete.voltages}
                          interpolationPower={interpolationPower}
                          smoothingLevel={smoothingLevel}
                          showContours={showContours}
                          numContours={numContours}
                          contourThickness={contourThickness}
                        />
                        <div className="text-sm text-gray-600 text-center max-w-md">
                          Advanced ETAP-level visualization with IDW interpolation and equipotential contour lines.
                          Heatmap + Isolines = Professional Engineering Analysis.
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </ErrorBoundary>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
