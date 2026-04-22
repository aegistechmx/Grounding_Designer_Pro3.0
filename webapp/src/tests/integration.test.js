import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Integration Tests - IEEE 80 Grounding Calculator', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('Complete Workflow Tests', () => {
    test('full calculation workflow with dual-method results', async () => {
      const mockResponse = {
        success: true,
        data: {
          timestamp: '2026-04-22T03:36:00.000Z',
          input: {
            soil: { soilResistivity: 100 },
            grid: { gridLength: 50, gridWidth: 30, numParallel: 7, numParallelY: 5 },
            fault: { current: 10000 }
          },
          results: {
            gridResistance: 2.288,
            gpr: 3431,
            stepVoltage: 56,
            touchVoltage: 3431
          },
          methods: {
            analytical: {
              gridResistance: 2.288,
              gpr: 3431,
              stepVoltage: 56,
              touchVoltage: 3431
            },
            discrete: {
              gridResistance: 3.456,
              gpr: 5189,
              stepVoltage: 89,
              touchVoltage: 5189
            }
          },
          calibration: {
            applied: true,
            factors: {
              gridResistance: 1.0,
              stepVoltage: 1.0,
              touchVoltage: 1.0
            },
            alignment: {
              gridResistance: 51.0,
              stepVoltage: 59.0,
              touchVoltage: 51.0
            }
          },
          safety: {
            stepVoltageLimit: 1000,
            touchVoltageLimit: 1000,
            stepVoltageSafe: true,
            touchVoltageSafe: false
          }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      render(<App />);
      
      // Step 1: Fill in form parameters
      const soilInput = screen.getByPlaceholderText('Soil Resistivity');
      fireEvent.change(soilInput, { target: { value: '100' } });
      
      const gridLengthInput = screen.getByPlaceholderText('Grid Length (m)');
      fireEvent.change(gridLengthInput, { target: { value: '50' } });
      
      const gridWidthInput = screen.getByPlaceholderText('Grid Width (m)');
      fireEvent.change(gridWidthInput, { target: { value: '30' } });
      
      const faultCurrentInput = screen.getByPlaceholderText('Fault Current (A)');
      fireEvent.change(faultCurrentInput, { target: { value: '10000' } });
      
      // Step 2: Submit calculation
      const calculateButton = screen.getByText('Calculate Grounding System');
      fireEvent.click(calculateButton);
      
      // Step 3: Verify loading state
      expect(screen.getByText('Calculating...')).toBeInTheDocument();
      
      // Step 4: Wait for complete results
      await waitFor(() => {
        expect(screen.getByText('Analysis Results')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Step 5: Verify primary results
      expect(screen.getByText('2.288')).toBeInTheDocument(); // Grid resistance
      expect(screen.getByText('3,431')).toBeInTheDocument(); // GPR
      expect(screen.getByText('56')).toBeInTheDocument(); // Step voltage
      expect(screen.getByText('3,431')).toBeInTheDocument(); // Touch voltage
      
      // Step 6: Verify dual-method comparison
      expect(screen.getByText('Dual-Method Analysis Comparison')).toBeInTheDocument();
      expect(screen.getByText('2.288')).toBeInTheDocument(); // Analytical
      expect(screen.getByText('3.456')).toBeInTheDocument(); // Discrete
      expect(screen.getByText(/\+51\.0%/)).toBeInTheDocument(); // Difference
      
      // Step 7: Verify voltage visualization
      expect(screen.getByText('Voltage Distribution Visualization')).toBeInTheDocument();
      expect(screen.getByText('Discrete Method Spatial Analysis')).toBeInTheDocument();
      
      // Step 8: Verify safety assessment
      expect(screen.getByText('Safe')).toBeInTheDocument(); // Step voltage
      expect(screen.getByText('Unsafe')).toBeInTheDocument(); // Touch voltage
    });

    test('quick preset workflow', async () => {
      const mockResponse = {
        success: true,
        data: {
          results: { gridResistance: 1.5, gpr: 2000, stepVoltage: 45, touchVoltage: 2000 },
          methods: {
            analytical: { gridResistance: 1.5, gpr: 2000, stepVoltage: 45, touchVoltage: 2000 },
            discrete: { gridResistance: 2.1, gpr: 2800, stepVoltage: 63, touchVoltage: 2800 }
          },
          safety: { stepVoltageSafe: true, touchVoltageSafe: true }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      render(<App />);
      
      // Use quick preset
      const mediumPresetButton = screen.getByText('Medium Grid');
      fireEvent.click(mediumPresetButton);
      
      // Submit calculation
      const calculateButton = screen.getByText('Calculate Grounding System');
      fireEvent.click(calculateButton);
      
      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('Analysis Results')).toBeInTheDocument();
      });
      
      // Verify results
      expect(screen.getByText('1.5')).toBeInTheDocument();
      expect(screen.getByText('2,000')).toBeInTheDocument();
    });
  });

  describe('Error Handling Tests', () => {
    test('API error handling workflow', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Calculation failed: Invalid grid parameters',
        timestamp: '2026-04-22T03:36:00.000Z'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse
      });

      render(<App />);
      
      // Submit form
      const calculateButton = screen.getByText('Calculate Grounding System');
      fireEvent.click(calculateButton);
      
      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
      
      expect(screen.getByText('Calculation failed: Invalid grid parameters')).toBeInTheDocument();
    });

    test('network error handling workflow', async () => {
      fetch.mockRejectedValueOnce(new Error('Network connection failed'));

      render(<App />);
      
      // Submit form
      const calculateButton = screen.getByText('Calculate Grounding System');
      fireEvent.click(calculateButton);
      
      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
      
      expect(screen.getByText('Failed to connect to the API. Please ensure the backend is running.')).toBeInTheDocument();
    });
  });

  describe('Component Integration Tests', () => {
    test('all components render together correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          results: { gridResistance: 2.0, gpr: 3000, stepVoltage: 50, touchVoltage: 3000 },
          methods: {
            analytical: { gridResistance: 2.0, gpr: 3000, stepVoltage: 50, touchVoltage: 3000 },
            discrete: { gridResistance: 3.0, gpr: 4500, stepVoltage: 75, touchVoltage: 4500 }
          },
          input: {
            grid: { gridLength: 40, gridWidth: 25, numParallel: 6, numParallelY: 4 }
          }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      render(<App />);
      
      // Submit form
      const calculateButton = screen.getByText('Calculate Grounding System');
      fireEvent.click(calculateButton);
      
      // Wait for all components
      await waitFor(() => {
        expect(screen.getByText('Analysis Results')).toBeInTheDocument();
        expect(screen.getByText('Dual-Method Analysis Comparison')).toBeInTheDocument();
        expect(screen.getByText('Voltage Distribution Visualization')).toBeInTheDocument();
        expect(screen.getByText('Method Comparison')).toBeInTheDocument();
      });
      
      // Verify all components are present
      expect(screen.getByText('Primary Results')).toBeInTheDocument();
      expect(screen.getByText('Safety Assessment')).toBeInTheDocument();
      expect(screen.getByText('Method Overview')).toBeInTheDocument();
      expect(screen.getByText('Comparison Table')).toBeInTheDocument();
      expect(screen.getByText('Grid Configuration')).toBeInTheDocument();
    });
  });

  describe('Data Flow Tests', () => {
    test('correct data flow from API to UI components', async () => {
      const mockResponse = {
        success: true,
        data: {
          timestamp: '2026-04-22T03:36:00.000Z',
          input: {
            soil: { soilResistivity: 150 },
            grid: { gridLength: 60, gridWidth: 40, numParallel: 8, numParallelY: 6 },
            fault: { current: 15000 }
          },
          results: {
            gridResistance: 1.8,
            gpr: 4500,
            stepVoltage: 65,
            touchVoltage: 4500
          },
          methods: {
            analytical: {
              gridResistance: 1.8,
              gpr: 4500,
              stepVoltage: 65,
              touchVoltage: 4500
            },
            discrete: {
              gridResistance: 2.7,
              gpr: 6750,
              stepVoltage: 98,
              touchVoltage: 6750
            }
          },
          calibration: {
            applied: true,
            factors: { gridResistance: 1.0, stepVoltage: 1.0, touchVoltage: 1.0 },
            alignment: { gridResistance: 50.0, stepVoltage: 51.0, touchVoltage: 50.0 }
          },
          safety: {
            stepVoltageLimit: 1000,
            touchVoltageLimit: 1000,
            stepVoltageSafe: true,
            touchVoltageSafe: false
          }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      render(<App />);
      
      // Submit form
      const calculateButton = screen.getByText('Calculate Grounding System');
      fireEvent.click(calculateButton);
      
      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('Analysis Results')).toBeInTheDocument();
      });
      
      // Verify data flow to ResultsPanel
      expect(screen.getByText('1.8')).toBeInTheDocument(); // Grid resistance
      expect(screen.getByText('4,500')).toBeInTheDocument(); // GPR
      expect(screen.getByText('65')).toBeInTheDocument(); // Step voltage
      expect(screen.getByText('4,500')).toBeInTheDocument(); // Touch voltage
      
      // Verify data flow to DualMethodResults
      expect(screen.getByText('1.800')).toBeInTheDocument(); // Analytical
      expect(screen.getByText('2.700')).toBeInTheDocument(); // Discrete
      expect(screen.getByText(/\+50\.0%/)).toBeInTheDocument(); // Difference
      
      // Verify data flow to VoltageHeatmap
      expect(screen.getByText('60 × 40 m')).toBeInTheDocument(); // Grid dimensions
      expect(screen.getByText('8 × 6')).toBeInTheDocument(); // Conductors
      expect(screen.getByText('48')).toBeInTheDocument(); // Total nodes
      
      // Verify data flow to safety assessment
      expect(screen.getByText('Safe')).toBeInTheDocument(); // Step voltage
      expect(screen.getByText('Unsafe')).toBeInTheDocument(); // Touch voltage
    });
  });
});
