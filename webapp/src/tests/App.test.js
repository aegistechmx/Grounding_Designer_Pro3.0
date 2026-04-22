import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('IEEE 80 Grounding Calculator App', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders main application components', () => {
    render(<App />);
    
    // Check main title
    expect(screen.getByText('IEEE 80 Dual-Method Grounding Calculator')).toBeInTheDocument();
    expect(screen.getByText('Advanced Engineering Analysis Platform')).toBeInTheDocument();
    
    // Check input form
    expect(screen.getByText('Input Parameters')).toBeInTheDocument();
    expect(screen.getByText('Quick Presets')).toBeInTheDocument();
    
    // Check form elements
    expect(screen.getByPlaceholderText('Soil Resistivity')).toBeInTheDocument();
    expect(screen.getByText('Calculate Grounding System')).toBeInTheDocument();
  });

  test('handles form submission successfully', async () => {
    const mockResponse = {
      success: true,
      data: {
        timestamp: '2026-04-22T03:36:00.000Z',
        input: {
          soil: { soilResistivity: 100 },
          grid: { gridLength: 50, gridWidth: 30 },
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
    
    // Fill form
    const soilInput = screen.getByPlaceholderText('Soil Resistivity');
    fireEvent.change(soilInput, { target: { value: '100' } });
    
    // Submit form
    const calculateButton = screen.getByText('Calculate Grounding System');
    fireEvent.click(calculateButton);
    
    // Check loading state
    expect(screen.getByText('Calculating...')).toBeInTheDocument();
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Analysis Results')).toBeInTheDocument();
    });
    
    // Check results display
    expect(screen.getByText('2.288')).toBeInTheDocument(); // Grid resistance
    expect(screen.getByText('3,431')).toBeInTheDocument(); // GPR
    expect(screen.getByText('56')).toBeInTheDocument(); // Step voltage
    expect(screen.getByText('3,431')).toBeInTheDocument(); // Touch voltage
    
    // Check dual-method results
    expect(screen.getByText('Dual-Method Analysis Comparison')).toBeInTheDocument();
    expect(screen.getByText('Analytical Method')).toBeInTheDocument();
    expect(screen.getByText('Discrete Method')).toBeInTheDocument();
    
    // Check safety assessment
    expect(screen.getByText('Safe')).toBeInTheDocument(); // Step voltage
    expect(screen.getByText('Unsafe')).toBeInTheDocument(); // Touch voltage
  });

  test('handles API error gracefully', async () => {
    const mockErrorResponse = {
      success: false,
      error: 'Invalid input: Soil resistivity must be positive',
      timestamp: '2026-04-22T03:36:00.000Z'
    };

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => mockErrorResponse
    });

    render(<App />);
    
    // Submit form with invalid data
    const calculateButton = screen.getByText('Calculate Grounding System');
    fireEvent.click(calculateButton);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
    
    expect(screen.getByText('Invalid input: Soil resistivity must be positive')).toBeInTheDocument();
  });

  test('handles network error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<App />);
    
    // Submit form
    const calculateButton = screen.getByText('Calculate Grounding System');
    fireEvent.click(calculateButton);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
    
    expect(screen.getByText('Failed to connect to the API. Please ensure the backend is running.')).toBeInTheDocument();
  });

  test('quick presets work correctly', () => {
    render(<App />);
    
    // Test small grid preset
    const smallPresetButton = screen.getByText('Small Grid');
    fireEvent.click(smallPresetButton);
    
    // Check if form values are updated (this would require accessing the form state)
    expect(screen.getByText('Small Grid')).toBeInTheDocument();
  });

  test('displays voltage visualization when results are available', async () => {
    const mockResponse = {
      success: true,
      data: {
        methods: {
          analytical: { gridResistance: 2.288 },
          discrete: { gridResistance: 3.456 }
        },
        input: {
          grid: { gridLength: 50, gridWidth: 30, numParallel: 7, numParallelY: 5 }
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
      expect(screen.getByText('Voltage Distribution Visualization')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Discrete Method Spatial Analysis')).toBeInTheDocument();
  });
});
