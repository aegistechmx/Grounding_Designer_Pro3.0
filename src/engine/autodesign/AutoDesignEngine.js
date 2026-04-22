// src/engine/autodesign/AutoDesignEngine.js
// Engine principal de auto-diseño normativo

import NSGAIIOptimizer from './optimizers/NSGAIIOptimizer.js';
import { ComplianceEngine } from '../standards/ComplianceEngine.js';
import { FEMEngine } from '../fem/core/FEMEngine.js';

export class AutoDesignEngine {
  constructor(options = {}) {
    this.femEngine = new FEMEngine({
      verbose: options.verbose || false,
      solverType: options.solverType || 'cg',
      tolerance: options.tolerance || 1e-6
    });
    
    this.complianceEngine = new ComplianceEngine({
      standards: options.standards || ['NOM-001', 'CFE', 'IEEE80'],
      verbose: options.verbose || false
    });
    
    this.optimizerOptions = {
      populationSize: options.populationSize || 50,
      generations: options.generations || 30,
      crossoverProb: options.crossoverProb || 0.9,
      mutationProb: options.mutationProb || 0.1,
      weights: options.weights || { cost: 0.4, safety: 0.4, resistance: 0.2 },
      verbose: options.verbose || false
    };
  }

  /**
   * Ejecuta auto-diseño completo
   */
  async design(domain) {
    const startTime = performance.now();
    
    console.log('🏗️ INICIANDO AUTO-DISEÑO NORMATIVO');
    console.log('═'.repeat(50));
    
    // Validar dominio
    this.validateDomain(domain);
    
    // Crear optimizador
    const optimizer = new NSGAIIOptimizer(
      domain,
      this.femEngine,
      this.complianceEngine,
      this.optimizerOptions
    );
    
    // Ejecutar optimización
    const result = await optimizer.optimize();
    
    // Verificar resultado
    if (!result.bestSolution) {
      throw new Error('No se encontró una solución válida');
    }
    
    // Generar reporte final
    const report = this.generateReport(result, domain);
    
    const endTime = performance.now();
    
    console.log(`✅ Auto-diseño completado en ${(endTime - startTime).toFixed(2)} ms`);
    console.log(`   Mejor diseño encontrado:`);
    console.log(`   • Conductores: ${result.bestSolution.numParallelX} x ${result.bestSolution.numParallelY}`);
    console.log(`   • Varillas: ${result.bestSolution.numRods} x ${result.bestSolution.rodLength}m`);
    console.log(`   • Costo estimado: $${this.computeCost(result.bestSolution).toLocaleString()} MXN`);
    console.log(`   • Cumple normas: ${result.bestFitness > 0.7 ? '✓' : '⚠️ Parcial'}`);
    
    return {
      design: result.bestSolution,
      fitness: result.bestFitness,
      alternatives: result.allSolutions
        .filter(s => s.fitness.meetsStandards)
        .slice(0, 5)
        .map(s => s.design),
      report,
      executionTime: endTime - startTime
    };
  }

  /**
   * Valida dominio de diseño
   */
  validateDomain(domain) {
    if (!domain.grid) throw new Error('Dominio debe incluir grid');
    if (!domain.soil) throw new Error('Dominio debe incluir soil');
    if (!domain.fault) throw new Error('Dominio debe incluir fault');
    
    // Valores por defecto
    if (!domain.grid.length) domain.grid.length = { min: 8, max: 20 };
    if (!domain.grid.width) domain.grid.width = { min: 6, max: 15 };
    if (!domain.grid.depth) domain.grid.depth = { min: 0.4, max: 1.0 };
    
    if (!domain.soil.resistivity) domain.soil.resistivity = 100;
    if (!domain.soil.moisture) domain.soil.moisture = 0.25;
    
    if (!domain.fault.current) domain.fault.current = 5000;
    if (!domain.fault.duration) domain.fault.duration = 0.35;
    if (!domain.fault.divisionFactor) domain.fault.divisionFactor = 0.15;
    
    if (!domain.voltageLevel) domain.voltageLevel = 13200;
  }

  /**
   * Genera reporte del diseño
   */
  generateReport(result, domain) {
    const design = result.bestSolution;
    const cost = this.computeCost(design);
    
    return {
      title: 'Auto-Design Report - Grounding System',
      generatedAt: new Date().toISOString(),
      
      design: {
        grid: {
          length: design.gridLength,
          width: design.gridWidth,
          depth: design.gridDepth,
          area: design.gridLength * design.gridWidth
        },
        conductors: {
          x: design.numParallelX,
          y: design.numParallelY,
          material: design.conductorMaterial,
          size: design.conductorSize
        },
        rods: {
          count: design.numRods,
          length: design.rodLength,
          totalLength: design.numRods * design.rodLength
        },
        surface: {
          depth: design.surfaceDepth,
          resistivity: design.surfaceResistivity
        }
      },
      
      cost: {
        total: cost,
        breakdown: {
          conductors: this.computeConductorCost(design),
          rods: this.computeRodCost(design),
          excavation: this.computeExcavationCost(design),
          surface: this.computeSurfaceCost(design)
        }
      },
      
      domain: {
        soilResistivity: domain.soil.resistivity,
        faultCurrent: domain.fault.current,
        faultDuration: domain.fault.duration,
        voltageLevel: domain.voltageLevel
      },
      
      fitness: result.bestFitness
    };
  }

  /**
   * Calcula costo del diseño
   */
  computeCost(design) {
    return this.computeConductorCost(design) +
           this.computeRodCost(design) +
           this.computeExcavationCost(design) +
           this.computeSurfaceCost(design);
  }

  computeConductorCost(design) {
    if (!design) return 0;
    const gridLength = design.gridLength || 10;
    const gridWidth = design.gridWidth || 10;
    const numParallelX = design.numParallelX || 8;
    const numParallelY = design.numParallelY || 8;
    
    const length = 2 * (gridLength + gridWidth) * 
                   Math.max(numParallelX, numParallelY);
    const rate = design.conductorMaterial === 'copper' ? 12 : 8;
    return length * rate;
  }

  computeRodCost(design) {
    if (!design) return 0;
    const numRods = design.numRods || 0;
    const rodLength = design.rodLength || 0;
    return numRods * 25 + rodLength * numRods * 8;
  }

  computeExcavationCost(design) {
    if (!design) return 0;
    const gridLength = design.gridLength || 10;
    const gridWidth = design.gridWidth || 10;
    const gridDepth = design.gridDepth || 0.5;
    const area = gridLength * gridWidth;
    return area * gridDepth * 15;
  }

  computeSurfaceCost(design) {
    if (!design) return 0;
    const gridLength = design.gridLength || 10;
    const gridWidth = design.gridWidth || 10;
    const surfaceDepth = design.surfaceDepth || 0.1;
    const area = gridLength * gridWidth;
    return area * surfaceDepth * 45;
  }
}

export default AutoDesignEngine;
