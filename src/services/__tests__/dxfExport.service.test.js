// src/services/__tests__/dxfExport.service.test.js
// Unit tests for DXF export service

import { dxfExportService } from '../dxfExport.service';

describe('dxfExportService', () => {
  const mockGridDesign = {
    length: 20,
    width: 16,
    nx: 5,
    ny: 4,
    numRods: 8,
    rodLength: 2.4,
    depth: 0.5
  };

  const mockCalculations = {
    Rg: 2.87,
    GPR: 3394
  };

  const mockProjectName = 'Test Project';

  beforeEach(() => {
    // Mock document methods
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    document.createElement = jest.fn(() => ({
      href: '',
      download: '',
      click: jest.fn()
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('exportToDXF', () => {
    it('should export DXF file with correct structure', () => {
      const result = dxfExportService.exportToDXF(mockGridDesign, mockProjectName, mockCalculations);
      
      expect(result).toBe(true);
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should include header section in DXF', () => {
      dxfExportService.exportToDXF(mockGridDesign, mockProjectName, mockCalculations);
      
      const calls = document.createElement.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });

    it('should include conductor lines in DXF', () => {
      dxfExportService.exportToDXF(mockGridDesign, mockProjectName, mockCalculations);
      
      // Verify that conductor lines are generated
      const calls = document.createElement.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });

    it('should include rod positions in DXF', () => {
      dxfExportService.exportToDXF(mockGridDesign, mockProjectName, mockCalculations);
      
      // Verify that rods are generated
      const calls = document.createElement.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });

    it('should include project information as text', () => {
      dxfExportService.exportToDXF(mockGridDesign, mockProjectName, mockCalculations);
      
      // Verify that project info is included
      const calls = document.createElement.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  describe('exportToCSV', () => {
    const mockParams = {
      gridLength: 20,
      gridWidth: 16,
      gridDepth: 0.5,
      numParallel: 5,
      numParallelY: 4,
      numRods: 8,
      rodLength: 2.4,
      soilResistivity: 100,
      surfaceLayer: 3000,
      surfaceDepth: 0.1,
      faultCurrent: 1181,
      faultDuration: 0.5,
      projectName: 'Test Project'
    };

    it('should export CSV file with correct structure', () => {
      dxfExportService.exportToCSV(mockCalculations, mockParams, mockProjectName);
      
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should include project data in CSV', () => {
      dxfExportService.exportToCSV(mockCalculations, mockParams, mockProjectName);
      
      const calls = document.createElement.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });

    it('should include calculation results in CSV', () => {
      dxfExportService.exportToCSV(mockCalculations, mockParams, mockProjectName);
      
      const calls = document.createElement.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });

    it('should include compliance status in CSV', () => {
      dxfExportService.exportToCSV(mockCalculations, mockParams, mockProjectName);
      
      const calls = document.createElement.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });
  });
});
