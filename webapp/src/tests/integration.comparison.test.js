import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Comparison Integration Tests', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('complete workflow with comparison panel', async () => {
    const mockResponse = {
      success: true,
      data: {
        timestamp: '2026-04-22T03:55:00.000Z',
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
            resistance: 2.288,
            gpr: 3431,
            step: 56,
            touch: 3431
          },
          discrete: {
            resistance: 3.456,
            gpr: 5189,
            step: 89,
            touch: 5189
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
    
    // Step 1: Fill form
    const soilInput = screen.getByPlaceholderText('Soil Resistivity');
    fireEvent.change(soilInput, { target: { value: '100' } });
    
    // Step 2: Submit calculation
    const calculateButton = screen.getByText('Calculate Grounding System');
    fireEvent.click(calculateButton);
    
    // Step 3: Wait for results
    await waitFor(() => {
      expect(screen.getByText('Analysis Results')).toBeInTheDocument();
    });
    
    // Step 4: Verify ComparisonPanel appears
    await waitFor(() => {
      expect(screen.getByText('Method Comparison: Analytical vs Discrete')).toBeInTheDocument();
    });
    
    // Step 5: Verify comparison data is displayed
    expect(screen.getByText('2.29 ×')).toBeInTheDocument(); // Analytical resistance
    expect(screen.getByText('3.46 ×')).toBeInTheDocument(); // Discrete resistance
    expect(screen.getByText(/\+51\.0%/)).toBeInTheDocument(); // Resistance difference
    
    // Step 6: Verify visual bars are rendered
    const bars = document.querySelectorAll('.bg-yellow-500'); // 51% difference = yellow
    expect(bars.length).toBeGreaterThan(0);
    
    // Step 7: Verify interpretation is displayed
    expect(screen.getByText('Engineering Interpretation')).toBeInTheDocument();
    expect(screen.getByText(/Good agreement with expected methodological differences/)).toBeInTheDocument();
    
    // Step 8: Verify method characteristics
    expect(screen.getByText('Analytical Method')).toBeInTheDocument();
    expect(screen.getByText('Discrete Method')).toBeInTheDocument();
    expect(screen.getByText('IEEE 80 standard formulas')).toBeInTheDocument();
    expect(screen.getByText('Nodal analysis')).toBeInTheDocument();
  });

  test('comparison panel handles missing method data gracefully', async () => {
    const mockResponse = {
      success: true,
      data: {
        timestamp: '2026-04-22T03:55:00.000Z',
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
            resistance: 2.288,
            gpr: 3431,
            step: 56,
            touch: 3431
          },
          discrete: null // Missing discrete data
        },
        safety: {
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
    
    // Submit calculation
    const calculateButton = screen.getByText('Calculate Grounding System');
    fireEvent.click(calculateButton);
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Analysis Results')).toBeInTheDocument();
    });
    
    // Verify comparison panel shows no data message
    await waitFor(() => {
      expect(screen.getByText('Comparison data not available. Run a calculation to see method comparison.')).toBeInTheDocument();
    });
  });

  test('comparison calculations are accurate', async () => {
    const mockResponse = {
      success: true,
      data: {
        timestamp: '2026-04-22T03:55:00.000Z',
        input: { soil: { soilResistivity: 100 } },
        results: { gridResistance: 2.0, gpr: 3000, stepVoltage: 200, touchVoltage: 300 },
        methods: {
          analytical: { resistance: 2.0, gpr: 3000, step: 200, touch: 300 },
          discrete: { resistance: 3.0, gpr: 4500, step: 300, touch: 450 }
        },
        safety: { stepVoltageSafe: true, touchVoltageSafe: true }
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    render(<App />);
    
    // Submit calculation
    const calculateButton = screen.getByText('Calculate Grounding System');
    fireEvent.click(calculateButton);
    
    // Wait for comparison panel
    await waitFor(() => {
      expect(screen.getByText('Method Comparison: Analytical vs Discrete')).toBeInTheDocument();
    });
    
    // Verify calculations: (discrete - analytical) / analytical * 100
    // Resistance: (3.0 - 2.0) / 2.0 * 100 = 50%
    // GPR: (4500 - 3000) / 3000 * 100 = 50%
    // Step: (300 - 200) / 200 * 100 = 50%
    // Touch: (450 - 300) / 300 * 100 = 50%
    
    expect(screen.getByText(/\+50\.0%/)).toBeInTheDocument(); // Should appear 4 times
  });

  test('visual difference bars render correctly', async () => {
    const mockResponse = {
      success: true,
      data: {
        timestamp: '2026-04-22T03:55:00.000Z',
        input: { soil: { soilResistivity: 100 } },
        results: { gridResistance: 2.0, gpr: 3000, stepVoltage: 200, touchVoltage: 300 },
        methods: {
          analytical: { resistance: 2.0, gpr: 3000, step: 200, touch: 300 },
          discrete: { resistance: 2.1, gpr: 3150, step: 210, touch: 315 } // 5% differences
        },
        safety: { stepVoltageSafe: true, touchVoltageSafe: true }
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    render(<App />);
    
    // Submit calculation
    const calculateButton = screen.getByText('Calculate Grounding System');
    fireEvent.click(calculateButton);
    
    // Wait for comparison panel
    await waitFor(() => {
      expect(screen.getByText('Method Comparison: Analytical vs Discrete')).toBeInTheDocument();
    });
    
    // 5% differences should render green bars
    const greenBars = document.querySelectorAll('.bg-green-500');
    expect(greenBars.length).toBe(4); // One for each metric
    
    // Verify bar widths (should be 5% for 5% difference)
    greenBars.forEach(bar => {
      expect(bar.style.width).toBe('5%');
    });
  });

  test('automatic interpretation logic works correctly', async () => {
    const mockResponse = {
      success: true,
      data: {
        timestamp: '2026-04-22T03:55:00.000Z',
        input: { soil: { soilResistivity: 100 } },
        results: { gridResistance: 2.0, gpr: 3000, stepVoltage: 200, touchVoltage: 300 },
        methods: {
          analytical: { resistance: 2.0, gpr: 3000, step: 200, touch: 300 },
          discrete: { resistance: 2.05, gpr: 3075, step: 205, touch: 307 } // 2.5% differences
        },
        safety: { stepVoltageSafe: true, touchVoltageSafe: true }
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    render(<App />);
    
    // Submit calculation
    const calculateButton = screen.getByText('Calculate Grounding System');
    fireEvent.click(calculateButton);
    
    // Wait for comparison panel
    await waitFor(() => {
      expect(screen.getByText('Method Comparison: Analytical vs Discrete')).toBeInTheDocument();
    });
    
    // 2.5% differences should trigger "Excellent agreement" interpretation
    expect(screen.getByText(/Excellent agreement between analytical and discrete methods/)).toBeInTheDocument();
    expect(screen.getByText(/Results are highly reliable/)).toBeInTheDocument();
  });
});
