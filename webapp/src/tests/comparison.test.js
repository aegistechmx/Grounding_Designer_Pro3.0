// Test comparison utilities directly
import { getError, formatDiff, getInterpretation, getDifferenceColor, getBarColor } from '../utils/comparison';

describe('Comparison Utilities', () => {
  describe('getError', () => {
    test('calculates percentage difference correctly', () => {
      expect(getError(100, 150)).toBe(50); // 50% increase
      expect(getError(200, 100)).toBe(-50); // 50% decrease
      expect(getError(50, 75)).toBe(50); // 50% increase
    });

    test('handles edge cases', () => {
      expect(getError(0, 100)).toBe(0); // Division by zero protection
      expect(getError(100, 0)).toBe(-100); // 100% decrease
      expect(getError(null, 100)).toBe(0); // Null protection
      expect(getError(100, null)).toBe(0); // Null protection
      expect(getError(undefined, 100)).toBe(0); // Undefined protection
    });

    test('handles zero values correctly', () => {
      expect(getError(0, 0)).toBe(0);
      expect(getError(100, 100)).toBe(0); // No difference
    });
  });

  describe('formatDiff', () => {
    test('formats positive differences with plus sign', () => {
      expect(formatDiff(25.5)).toBe('+25.5%');
      expect(formatDiff(50)).toBe('+50.0%');
      expect(formatDiff(100.123)).toBe('+100.1%'); // Rounded to 1 decimal
    });

    test('formats negative differences with minus sign', () => {
      expect(formatDiff(-25.5)).toBe('-25.5%');
      expect(formatDiff(-50)).toBe('-50.0%');
      expect(formatDiff(-100.123)).toBe('-100.1%');
    });

    test('formats zero difference', () => {
      expect(formatDiff(0)).toBe('+0.0%');
    });

    test('handles decimal precision', () => {
      expect(formatDiff(12.3456)).toBe('+12.3%'); // Rounded to 1 decimal
      expect(formatDiff(-12.3456)).toBe('-12.3%');
    });
  });

  describe('getDifferenceColor', () => {
    test('returns green for small differences', () => {
      expect(getDifferenceColor(10)).toBe('text-green-600');
      expect(getDifferenceColor(-10)).toBe('text-green-600');
      expect(getDifferenceColor(19.9)).toBe('text-green-600');
    });

    test('returns yellow for medium differences', () => {
      expect(getDifferenceColor(20)).toBe('text-yellow-600');
      expect(getDifferenceColor(-20)).toBe('text-yellow-600');
      expect(getDifferenceColor(35)).toBe('text-yellow-600');
      expect(getDifferenceColor(49.9)).toBe('text-yellow-600');
    });

    test('returns red for large differences', () => {
      expect(getDifferenceColor(50)).toBe('text-red-600');
      expect(getDifferenceColor(-50)).toBe('text-red-600');
      expect(getDifferenceColor(100)).toBe('text-red-600');
    });
  });

  describe('getBarColor', () => {
    test('returns green for small differences', () => {
      expect(getBarColor(10)).toBe('bg-green-500');
      expect(getBarColor(-10)).toBe('bg-green-500');
      expect(getBarColor(19.9)).toBe('bg-green-500');
    });

    test('returns yellow for medium differences', () => {
      expect(getBarColor(20)).toBe('bg-yellow-500');
      expect(getBarColor(-20)).toBe('bg-yellow-500');
      expect(getBarColor(35)).toBe('bg-yellow-500');
      expect(getBarColor(49.9)).toBe('bg-yellow-500');
    });

    test('returns red for large differences', () => {
      expect(getBarColor(50)).toBe('bg-red-500');
      expect(getBarColor(-50)).toBe('bg-red-500');
      expect(getBarColor(100)).toBe('bg-red-500');
    });
  });

  describe('getInterpretation', () => {
    const mockResults = {
      analytical: { resistance: 2.3, gpr: 3400, step: 180, touch: 320 },
      discrete: { resistance: 3.8, gpr: 5200, step: 260, touch: 600 }
    };

    test('returns excellent agreement for small differences', () => {
      const goodResults = {
        analytical: { resistance: 2.0, gpr: 3000, step: 200, touch: 300 },
        discrete: { resistance: 2.1, gpr: 3150, step: 210, touch: 315 }
      };
      
      const interpretation = getInterpretation(goodResults);
      expect(interpretation).toContain('Excellent agreement');
      expect(interpretation).toContain('highly reliable');
    });

    test('returns good agreement for medium differences', () => {
      const mediumResults = {
        analytical: { resistance: 2.0, gpr: 3000, step: 200, touch: 300 },
        discrete: { resistance: 2.8, gpr: 4200, step: 280, touch: 420 }
      };
      
      const interpretation = getInterpretation(mediumResults);
      expect(interpretation).toContain('Good agreement');
      expect(interpretation).toContain('valid insights');
    });

    test('returns significant differences for large differences', () => {
      const largeResults = {
        analytical: { resistance: 2.0, gpr: 3000, step: 200, touch: 300 },
        discrete: { resistance: 4.0, gpr: 6000, step: 400, touch: 600 }
      };
      
      const interpretation = getInterpretation(largeResults);
      expect(interpretation).toContain('Significant differences');
      expect(interpretation).toContain('non-uniform field effects');
    });

    test('handles insufficient data', () => {
      const emptyResults = { analytical: null, discrete: null };
      const interpretation = getInterpretation(emptyResults);
      expect(interpretation).toBe('Insufficient data for comparison.');
    });

    test('handles missing results', () => {
      const interpretation = getInterpretation(null);
      expect(interpretation).toBe('Insufficient data for comparison.');
    });
  });
});
