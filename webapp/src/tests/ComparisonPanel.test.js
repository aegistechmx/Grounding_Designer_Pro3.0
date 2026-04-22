import React from 'react';
import { render, screen } from '@testing-library/react';
import ComparisonPanel from '../components/ComparisonPanel';

// Mock comparison utilities
jest.mock('../utils/comparison', () => ({
  getError: jest.fn((analytical, discrete) => {
    if (!analytical || !discrete) return 0;
    return ((discrete - analytical) / analytical) * 100;
  }),
  formatDiff: jest.fn((diff) => {
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}%`;
  }),
  getInterpretation: jest.fn(() => "Test interpretation"),
  getDifferenceColor: jest.fn((diff) => {
    const absDiff = Math.abs(diff);
    if (absDiff < 20) return 'text-green-600';
    if (absDiff < 50) return 'text-yellow-600';
    return 'text-red-600';
  }),
  getBarColor: jest.fn((diff) => {
    const absDiff = Math.abs(diff);
    if (absDiff < 20) return 'bg-green-500';
    if (absDiff < 50) return 'bg-yellow-500';
    return 'bg-red-500';
  })
}));

describe('ComparisonPanel Component', () => {
  const mockResults = {
    analytical: {
      resistance: 2.3,
      gpr: 3400,
      step: 180,
      touch: 320
    },
    discrete: {
      resistance: 3.8,
      gpr: 5200,
      step: 260,
      touch: 600
    }
  };

  test('renders comparison panel with valid results', () => {
    render(<ComparisonPanel results={mockResults} />);
    
    expect(screen.getByText('Method Comparison: Analytical vs Discrete')).toBeInTheDocument();
    expect(screen.getByText('Grid Resistance')).toBeInTheDocument();
    expect(screen.getByText('Ground Potential Rise')).toBeInTheDocument();
    expect(screen.getByText('Step Voltage')).toBeInTheDocument();
    expect(screen.getByText('Touch Voltage')).toBeInTheDocument();
  });

  test('displays analytical and discrete values correctly', () => {
    render(<ComparisonPanel results={mockResults} />);
    
    // Check analytical values (blue)
    expect(screen.getByText('2.30 ×')).toBeInTheDocument();
    expect(screen.getByText('3400.00 V')).toBeInTheDocument();
    expect(screen.getByText('180.00 V')).toBeInTheDocument();
    expect(screen.getByText('320.00 V')).toBeInTheDocument();
    
    // Check discrete values (green)
    expect(screen.getByText('3.80 ×')).toBeInTheDocument();
    expect(screen.getByText('5200.00 V')).toBeInTheDocument();
    expect(screen.getByText('260.00 V')).toBeInTheDocument();
    expect(screen.getByText('600.00 V')).toBeInTheDocument();
  });

  test('shows difference calculations', () => {
    render(<ComparisonPanel results={mockResults} />);
    
    // Check that differences are calculated and displayed
    expect(screen.getByText(/\+65\.2%/)).toBeInTheDocument(); // resistance diff
    expect(screen.getByText(/\+52\.9%/)).toBeInTheDocument(); // gpr diff
    expect(screen.getByText(/\+44\.4%/)).toBeInTheDocument(); // step diff
    expect(screen.getByText(/\+87\.5%/)).toBeInTheDocument(); // touch diff
  });

  test('renders visual difference bars', () => {
    render(<ComparisonPanel results={mockResults} />);
    
    // Check for visual bars (they should be present as div elements)
    const bars = document.querySelectorAll('.bg-red-500');
    expect(bars.length).toBeGreaterThan(0);
  });

  test('displays engineering interpretation', () => {
    render(<ComparisonPanel results={mockResults} />);
    
    expect(screen.getByText('Engineering Interpretation')).toBeInTheDocument();
    expect(screen.getByText('Test interpretation')).toBeInTheDocument();
  });

  test('shows method characteristics', () => {
    render(<ComparisonPanel results={mockResults} />);
    
    expect(screen.getByText('Analytical Method')).toBeInTheDocument();
    expect(screen.getByText('Discrete Method')).toBeInTheDocument();
    expect(screen.getByText('IEEE 80 standard formulas')).toBeInTheDocument();
    expect(screen.getByText('Nodal analysis')).toBeInTheDocument();
  });

  test('displays engineering recommendation', () => {
    render(<ComparisonPanel results={mockResults} />);
    
    expect(screen.getByText('Recommendation:')).toBeInTheDocument();
    expect(screen.getByText(/For preliminary design, use analytical method/)).toBeInTheDocument();
  });

  test('handles missing results gracefully', () => {
    render(<ComparisonPanel results={null} />);
    
    expect(screen.getByText('Method Comparison')).toBeInTheDocument();
    expect(screen.getByText('Comparison data not available. Run a calculation to see method comparison.')).toBeInTheDocument();
  });

  test('handles incomplete results gracefully', () => {
    const incompleteResults = {
      analytical: null,
      discrete: null
    };
    
    render(<ComparisonPanel results={incompleteResults} />);
    
    expect(screen.getByText('Method Comparison')).toBeInTheDocument();
    expect(screen.getByText('Comparison data not available. Run a calculation to see method comparison.')).toBeInTheDocument();
  });

  test('applies correct color classes based on differences', () => {
    const { getDifferenceColor, getBarColor } = require('../utils/comparison');
    
    render(<ComparisonPanel results={mockResults} />);
    
    // Verify color functions were called
    expect(getDifferenceColor).toHaveBeenCalled();
    expect(getBarColor).toHaveBeenCalled();
  });

  test('formats differences with correct signs', () => {
    const { formatDiff } = require('../utils/comparison');
    
    render(<ComparisonPanel results={mockResults} />);
    
    // Verify formatDiff was called for each metric
    expect(formatDiff).toHaveBeenCalledTimes(4);
  });

  test('generates interpretation based on results', () => {
    const { getInterpretation } = require('../utils/comparison');
    
    render(<ComparisonPanel results={mockResults} />);
    
    // Verify getInterpretation was called with the results
    expect(getInterpretation).toHaveBeenCalledWith(mockResults);
  });
});
