// src/core/SystemOrchestrator.js
// ORQUESTADOR PRINCIPAL - Conecta UI → Simulation → Engine → Workers → Render

import { SimulationRunner } from '../simulation/SimulationRunner.js';
import { FEMSimulationRunner } from '../simulation/FEMSimulationRunner.js';
import { FEMEngine } from '../engine/fem/core/FEMEngine.js';
import { workerManager } from '../workers/WorkerManager.js';
import { RenderEngine } from '../render/RenderEngine.js';

class SystemOrchestrator {
  constructor() {
    this.currentProject = null;
    this.simulationRunner = null;
    this.renderEngine = null;
    this.isSimulating = false;
    this.simulationProgress = 0;
    this.listeners = new Map();
  }

  /**
   * Inicializa un nuevo proyecto
   */
  initProject(projectData) {
    if (!projectData) {
      throw new Error('projectData is required');
    }

    this.currentProject = {
      id: projectData.id || Date.now().toString(),
      name: projectData.name || 'Untitled Project',
      grid: {
        length: projectData.gridLength || 10,
        width: projectData.gridWidth || 10,
        depth: projectData.gridDepth || 0.5,
        nx: projectData.numParallel || 2,
        ny: projectData.numParallelY || 2,
        numRods: projectData.numRods || 0,
        rodLength: projectData.rodLength || 2.4,
        area: (projectData.gridLength || 10) * (projectData.gridWidth || 10)
      },
      soil: {
        resistivity: projectData.soilResistivity || 100,
        surfaceResistivity: projectData.surfaceLayer || 3000,
        surfaceDepth: projectData.surfaceDepth || 0.1
      },
      scenarios: [{
        current: projectData.faultCurrent || 1000,
        duration: projectData.faultDuration || 0.5,
        divisionFactor: projectData.currentDivisionFactor || 0.5
      }],
      results: []
    };
    
    this.simulationRunner = new SimulationRunner(this.currentProject);
    this.notifyListeners('projectChanged', this.currentProject);
    
    return this.currentProject;
  }

  /**
   * Ejecuta simulación (usa Worker si es pesada, o directa si es rápida)
   */
  async runSimulation(useWorker = false) {
    if (!this.currentProject) {
      throw new Error('No hay proyecto activo');
    }
    
    this.isSimulating = true;
    this.simulationProgress = 0;
    this.notifyListeners('simulationStart', null);
    
    try {
      let results;
      
      if (useWorker) {
        // Usar Worker para simulación pesada
        const scenario = this.currentProject.scenarios?.[0] || {};
        results = await workerManager.runFEMSimulation({
          grid: this.currentProject.grid,
          soil: this.currentProject.soil,
          fault: scenario,
          resolution: 50
        }, (progress) => {
          this.simulationProgress = progress;
          this.notifyListeners('simulationProgress', progress);
        });
      } else {
        // Simulación rápida directa
        results = this.simulationRunner.runAll();
        this.simulationProgress = 1;
      }
      
      this.currentProject.results = results;
      this.isSimulating = false;
      this.notifyListeners('simulationComplete', results);
      
      return results;
    } catch (error) {
      this.isSimulating = false;
      this.notifyListeners('simulationError', error);
      throw error;
    }
  }

  /**
   * Ejecuta simulación FEM avanzada
   */
  async runFEMSimulation(options = {}) {
    if (!this.currentProject) {
      throw new Error('No hay proyecto activo');
    }
    
    this.isSimulating = true;
    this.simulationProgress = 0;
    this.notifyListeners('simulationStart', null);
    
    try {
      const femRunner = new FEMSimulationRunner(this.currentProject, {
        resolution: options.resolution || 0.5,
        tolerance: options.tolerance || 1e-8,
        maxIterations: options.maxIterations || 1000
      });
      
      const results = await femRunner.run();
      
      this.currentProject.results = [results];
      this.isSimulating = false;
      this.notifyListeners('simulationComplete', results);
      
      return results;
    } catch (error) {
      this.isSimulating = false;
      this.notifyListeners('simulationError', error);
      throw error;
    }
  }

  /**
   * Ejecuta simulación FEM industrial (Delaunay + GMRES/CG)
   */
  async runIndustrialFEM(options = {}) {
    if (!this.currentProject) {
      throw new Error('No hay proyecto activo');
    }
    
    this.isSimulating = true;
    this.simulationProgress = 0;
    this.notifyListeners('simulationStart', null);
    
    try {
      const engine = new FEMEngine({
        solverType: options.solverType || 'cg',
        maxIterations: options.maxIterations || 1000,
        tolerance: options.tolerance || 1e-8,
        refinementLevel: options.refinementLevel || 2,
        verbose: options.verbose || false
      });
      
      const results = await engine.solve(this.currentProject);
      
      // Mapear resultados al formato existente
      const mappedResults = {
        Rg: results.metrics.groundResistance,
        GPR: results.metrics.GPR,
        Em: results.metrics.touchVoltage.value,
        Es: results.metrics.stepVoltage.value,
        Etouch70: results.metrics.touchVoltage.tolerable,
        Estep70: results.metrics.stepVoltage.tolerable,
        touchSafe: results.metrics.touchVoltage.safe,
        stepSafe: results.metrics.stepVoltage.safe,
        complies: results.metrics.compliance.complies,
        voltageField: results.voltageField,
        mesh: results.mesh,
        solverInfo: results.solverInfo,
        totalTime: results.totalTime
      };
      
      this.currentProject.results = [mappedResults];
      this.isSimulating = false;
      this.notifyListeners('simulationComplete', mappedResults);
      
      return mappedResults;
    } catch (error) {
      this.isSimulating = false;
      this.notifyListeners('simulationError', error);
      throw error;
    }
  }

  /**
   * Genera heatmap (usa Worker)
   */
  async generateHeatmap(resolution = 50) {
    if (!this.currentProject || !this.currentProject.results || !this.currentProject.results.length) {
      throw new Error('Ejecute simulación primero');
    }
    
    const result = this.currentProject.results[0];
    if (!result || !result.GPR) {
      throw new Error('Resultados de simulación inválidos');
    }
    
    const heatmapData = await workerManager.generateHeatmap({
      grid: this.currentProject.grid,
      GPR: result.GPR,
      resolution
    }, (progress) => {
      this.notifyListeners('heatmapProgress', progress);
    });
    
    return heatmapData;
  }

  /**
   * Ejecuta optimización (usa Worker)
   */
  async runOptimization(params, onProgress) {
    if (!this.currentProject) {
      throw new Error('No hay proyecto activo');
    }

    const optimizationParams = {
      ...params,
      area: this.currentProject?.grid?.area || 100,
      soilResistivity: this.currentProject?.soil?.resistivity || 100
    };
    
    const result = await workerManager.runOptimization(optimizationParams, onProgress);
    return result;
  }

  /**
   * Renderiza en canvas
   */
  renderToCanvas(canvas, renderType = 'heatmap', options = {}) {
    if (!this.renderEngine) {
      this.renderEngine = new RenderEngine(canvas, options);
    }
    
    if (!this.currentProject || !this.currentProject.results.length) {
      this.renderEngine.drawText('Ejecute simulación primero', 20, 50);
      return;
    }
    
    const result = this.currentProject.results[0];
    const grid = this.currentProject.grid;
    
    const renderConfig = {
      title: options.title || 'Malla de Tierra',
      grid: {
        rows: grid.ny || 2,
        cols: grid.nx || 2,
        cellWidth: canvas.width / Math.max(1, grid.nx || 2),
        cellHeight: canvas.height / Math.max(1, grid.ny || 2),
        offsetX: 0,
        offsetY: 0
      },
      conductors: this.generateConductorPositions(grid),
      rods: this.generateRodPositions(grid),
      annotations: [
        { text: `Rg: ${isFinite(result.Rg) ? result.Rg.toFixed(2) : 'N/A'} Ω`, x: 20, y: 40 },
        { text: `GPR: ${isFinite(result.GPR) ? result.GPR.toFixed(0) : 'N/A'} V`, x: 20, y: 60 },
        { text: result.complies ? '✓ CUMPLE IEEE 80' : '✗ NO CUMPLE', x: 20, y: 80 }
      ]
    };
    
    if (renderType === 'heatmap' && options.heatmapData) {
      renderConfig.heatmap = options.heatmapData;
    }
    
    this.renderEngine.render(renderConfig);
  }

  /**
   * Genera posiciones de conductores para render
   */
  generateConductorPositions(grid) {
    const conductors = [];
    const nx = grid.nx;
    const ny = grid.ny;
    
    for (let i = 0; i <= nx; i++) {
      conductors.push({
        x1: i, y1: 0,
        x2: i, y2: ny
      });
    }
    
    for (let j = 0; j <= ny; j++) {
      conductors.push({
        x1: 0, y1: j,
        x2: nx, y2: j
      });
    }
    
    return conductors;
  }

  /**
   * Genera posiciones de varillas para render
   */
  generateRodPositions(grid) {
    const rods = [];
    const numRods = grid.numRods || 0;
    const nx = Math.max(1, grid.nx || 2);
    const ny = Math.max(1, grid.ny || 2);
    
    // Distribuir varillas en la periferia
    const perimeterPoints = [
      { x: 0, y: 0 },
      { x: nx, y: 0 },
      { x: 0, y: ny },
      { x: nx, y: ny },
      { x: nx / 2, y: 0 },
      { x: nx / 2, y: ny },
      { x: 0, y: ny / 2 },
      { x: nx, y: ny / 2 }
    ];
    
    for (let i = 0; i < numRods; i++) {
      if (i < perimeterPoints.length) {
        rods.push(perimeterPoints[i]);
      } else {
        // Distribuir varillas adicionales en la grilla
        const gridX = (i % (nx + 1)) * (nx / Math.max(1, nx));
        const gridY = Math.floor(i / (nx + 1)) * (ny / Math.max(1, ny));
        rods.push({ x: gridX, y: gridY });
      }
    }
    
    return rods;
  }

  /**
   * Exporta resultados a PDF
   */
  async exportToPDF() {
    if (!this.currentProject || !this.currentProject.results.length) {
      throw new Error('No hay resultados para exportar');
    }
    
    // Delegar al sistema de IO
    const { generateFullPDF } = await import('../utils/export/pdfFullPro.js');
    
    const params = {
      projectName: this.currentProject.name,
      gridLength: this.currentProject.grid.length,
      gridWidth: this.currentProject.grid.width,
      numParallel: this.currentProject.grid.nx,
      numRods: this.currentProject.grid.numRods,
      rodLength: this.currentProject.grid.rodLength,
      soilResistivity: this.currentProject.soil.resistivity
    };
    
    const calculations = this.currentProject.results[0];
    
    const doc = await generateFullPDF(params, calculations, []);
    doc.save(`informe-${this.currentProject.name}.pdf`);
  }

  /**
   * Suscribe listeners para eventos
   */
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Notifica a listeners
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  /**
   * Obtiene estado actual
   */
  getState() {
    return {
      project: this.currentProject,
      isSimulating: this.isSimulating,
      progress: this.simulationProgress,
      hasResults: this.currentProject?.results?.length > 0
    };
  }
}

// Singleton
export const systemOrchestrator = new SystemOrchestrator();

export default systemOrchestrator;
