/**
 * Grounding Calculator - Professional application service
 * Orchestrates all domain models with strong validation and functional approach
 * IEEE 80 compliant calculation engine with full traceability
 */

import SoilModel from '../domain/grounding/SoilModel.js';
import GridModel from '../domain/grounding/GridModel.js';
import FaultModel from '../domain/grounding/FaultModel.js';
import IEEE80PracticalFactors from '../domain/grounding/IEEE80PracticalFactors.js';
import GridSolver from '../domain/grounding/GridSolver.js';
import StrongValidation, { ValidationError } from '../utils/strongValidation.js';
import UnitSystem from '../utils/unitSystem.js';

class GroundingCalculator {
  constructor(input) {
    this.traceability = []; // Ensure traceability is always initialized
    this.results = null;
    this.input = this.validateAndNormalizeInput(input);
  }

  /**
   * Strong validation and normalization of input parameters
   */
  validateAndNormalizeInput(input) {
    try {
      // Sanitize input first
      const sanitized = StrongValidation.sanitizeInput(input);
      
      // Strong validation with engineering constraints
      const validated = StrongValidation.validateGroundingInput(sanitized);
      
      // Normalize to SI units
      const normalized = UnitSystem.normalizeInput(validated);
      
      this.addTrace('input_validation', {
        validation: 'strong',
        units: 'normalized_to_SI',
        sections: ['soil', 'grid', 'fault'],
        timestamp: new Date().toISOString()
      });
      
      return normalized;
      
    } catch (error) {
      this.addTrace('validation_error', { 
        error: error.message, 
        code: error.code,
        field: error.field 
      });
      throw new ValidationError(`Input validation failed: ${error.message}`, error.code, error.field);
    }
  }

  /**
   * Execute complete grounding system analysis (functional approach)
   */
  calculate(options = {}) {
    try {
      console.log('Starting calculation...');
      console.log('Traceability initialized:', !!this.traceability);
      console.log('Traceability type:', typeof this.traceability);
      console.log('Traceability length:', this.traceability?.length);
      
      const useDiscreteSolver = options.useDiscreteSolver || false;
      console.log('Analysis method:', useDiscreteSolver ? 'Discrete Solver' : 'Global Factors');
      
      // Step 1: Analyze soil properties (immutable model)
      console.log('Creating SoilModel...');
      const soilModel = new SoilModel(this.input.soil);
      console.log('SoilModel created, analyzing...');
      const soilAnalysis = soilModel.analyze();
      const effectiveResistivity = soilAnalysis.effectiveResistivity;
      console.log('Soil analysis complete');

      console.log('Adding soil trace...');
      this.addTrace('soil_analysis_complete', {
        effectiveResistivity,
        surfaceLayerFactor: soilAnalysis.surfaceLayerFactor,
        model: 'SoilModel',
        standard: 'IEEE 80'
      });
      console.log('Soil trace added');

      let gridAnalysis, faultAnalysis;
      
      if (useDiscreteSolver) {
        // Use discrete grid solver
        console.log('Using discrete grid solver...');
        const discreteResults = GridSolver.solveGrid(
          this.input.grid,
          effectiveResistivity,
          this.input.fault.faultCurrent
        );
        
        // Convert discrete results to standard format
        gridAnalysis = {
          gridResistance: discreteResults.gridResistance,
          totalConductorLength: this.calculateTotalConductorLength(),
          geometricFactor: 1.0, // Not used in discrete approach
          discreteResults: discreteResults
        };
        
        faultAnalysis = {
          gridCurrent: this.input.fault.faultCurrent * 0.15, // Typical split factor
          gpr: discreteResults.gpr,
          stepVoltage: discreteResults.stepVoltage,
          touchVoltage: discreteResults.touchVoltage,
          factorAnalysis: {
            method: 'discrete',
            nodeCount: discreteResults.nodes.length,
            voltageRange: discreteResults.analysis.voltageRange,
            edgeConcentration: discreteResults.analysis.edgeConcentration,
            rodEffectiveness: discreteResults.analysis.rodEffectiveness
          }
        };
        
        this.addTrace('discrete_solver_complete', {
          method: 'nodal_analysis',
          nodeCount: discreteResults.nodes.length,
          gridResistance: discreteResults.gridResistance,
          gpr: discreteResults.gpr,
          stepVoltage: discreteResults.stepVoltage,
          touchVoltage: discreteResults.touchVoltage,
          model: 'GridSolver',
          standard: 'IEEE 80'
        });
        
      } else {
        // Use traditional global factors approach
        console.log('Using global factors approach...');
        const gridModel = new GridModel(this.input.grid);
        gridAnalysis = gridModel.analyze(effectiveResistivity);

        this.addTrace('grid_analysis_complete', {
          gridResistance: gridAnalysis.gridResistance,
          totalConductorLength: gridAnalysis.totalConductorLength,
          geometricFactor: gridAnalysis.geometricFactor,
          model: 'GridModel',
          standard: 'IEEE 80'
        });

        // Step 3: Analyze fault conditions (immutable model with context)
        const faultModel = new FaultModel(this.input.fault);
        const faultContext = {
          gridResistance: gridAnalysis.gridResistance,
          geometricFactor: gridAnalysis.geometricFactor,
          effectiveResistivity,
          surfaceLayerResistivity: this.input.soil.surfaceLayerResistivity,
          soilAnalysis,
          gridAnalysis
        };
        
        // Pass grid geometry for IEEE 80 practical factors
        const gridGeometry = {
          ...this.input.grid,
          numRods: this.input.grid.numRods || 0,
          rodLength: this.input.grid.rodLength || 3
        };
        
        faultAnalysis = faultModel.analyze(
          gridAnalysis.gridResistance, 
          gridAnalysis.geometricFactor, 
          effectiveResistivity,
          this.input.soil.surfaceLayerResistivity,
          gridGeometry
        );
      }

      console.log('About to call addTrace for fault_analysis_complete');
      console.log('traceability before fault trace:', typeof this.traceability);
      console.log('traceability length before fault trace:', this.traceability?.length);
      
      this.addTrace('fault_analysis_complete', {
        gridCurrent: faultAnalysis.gridCurrent,
        stepVoltage: faultAnalysis.stepVoltage,
        touchVoltage: faultAnalysis.touchVoltage,
        model: 'FaultModel',
        standard: 'IEEE 80'
      });

      // Step 4: Compile comprehensive results
      this.results = this.compileResults(soilAnalysis, gridAnalysis, faultAnalysis);

      this.addTrace('calculation_complete', {
        totalCalculations: this.traceability.length,
        success: true,
        approach: 'functional',
        models: ['SoilModel', 'GridModel', 'FaultModel'],
        standard: 'IEEE 80-2013'
      });

      return this.results;

    } catch (error) {
      console.log('Caught error in calculate method');
      console.log('Error message:', error.message);
      console.log('traceability type in catch:', typeof this.traceability);
      console.log('traceability length in catch:', this.traceability?.length);
      
      this.addTrace('calculation_error', { 
        error: error.message,
        stack: error.stack,
        phase: 'calculation'
      });
      throw new Error(`Calculation failed: ${error.message}`);
    }
  }

  /**
   * Compile comprehensive results (orchestrated approach)
   */
  compileResults(soilAnalysis, gridAnalysis, faultAnalysis) {
    return {
      // Input Summary
      input: this.buildInputSummary(),
      
      // Domain Results
      soil: this.buildSoilResults(soilAnalysis),
      grid: this.buildGridResults(gridAnalysis),
      fault: this.buildFaultResults(faultAnalysis),
      
      // Analysis Results
      compliance: this.checkCompliance(faultAnalysis, soilAnalysis),
      recommendations: this.generateRecommendations(faultAnalysis, gridAnalysis, soilAnalysis),
      riskAssessment: this.assessRisk(faultAnalysis, gridAnalysis),
      
      // Traceability
      traceability: this.getFullTraceability()
    };
  }

  /**
   * Calculate total conductor length for discrete solver
   */
  calculateTotalConductorLength() {
    const { gridLength, gridWidth, numParallel, numParallelY } = this.input.grid;
    return gridLength * (numParallelY - 1) + gridWidth * (numParallel - 1);
  }

  /**
   * Build input summary
   */
  buildInputSummary() {
    return {
      ...this.input,
      validation: 'strong',
      units: 'SI_normalized',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Build soil analysis results
   */
  buildSoilResults(soilAnalysis) {
    return {
      effectiveResistivity: soilAnalysis.effectiveResistivity,
      surfaceLayerFactor: soilAnalysis.surfaceLayerFactor,
      soilQuality: soilAnalysis.soilQuality,
      temperatureCorrection: soilAnalysis.temperatureCorrection,
      seasonalCorrection: soilAnalysis.seasonalCorrection,
      model: soilAnalysis.model,
      reflectionCoefficient: soilAnalysis.reflectionCoefficient,
      layers: soilAnalysis.layers
    };
  }

  /**
   * Build grid analysis results
   */
  buildGridResults(gridAnalysis) {
    return {
      area: gridAnalysis.gridArea,
      totalConductorLength: gridAnalysis.totalConductorLength,
      perimeter: gridAnalysis.gridPerimeter,
      resistance: gridAnalysis.gridResistance,
      meshSpacing: gridAnalysis.meshSpacing,
      geometricFactor: gridAnalysis.geometricFactor,
      conductorProperties: gridAnalysis.conductorProperties
    };
  }

  /**
   * Build fault analysis results
   */
  buildFaultResults(faultAnalysis) {
    return {
      gridCurrent: faultAnalysis.gridCurrent,
      gpr: faultAnalysis.gpr,
      stepVoltage: faultAnalysis.stepVoltage,
      touchVoltage: faultAnalysis.touchVoltage,
      transferredVoltage: faultAnalysis.transferredVoltage,
      permissibleStep: faultAnalysis.permissibleStep,
      permissibleTouch: faultAnalysis.permissibleTouch,
      safetyMargins: faultAnalysis.safetyMargins,
      faultDistribution: faultAnalysis.faultDistribution
    };
  }

  /**
   * Check IEEE 80 compliance with proper engineering criteria
   */
  checkCompliance(faultAnalysis, soilAnalysis) {
    const { safetyMargins } = faultAnalysis;
    const { gridResistance } = faultAnalysis;

    // IEEE 80 compliance is primarily based on step and touch voltages
    // Grid resistance limits are application-specific, not universal
    const touchCompliant = safetyMargins.touchSafe;
    const stepCompliant = safetyMargins.stepSafe;
    
    // Overall compliance requires voltage safety
    const voltageCompliant = touchCompliant && stepCompliant;
    
    // Grid resistance assessment (not a compliance criterion, but performance indicator)
    const resistanceAssessment = this.assessGridResistance(gridResistance, soilAnalysis);
    
    // IEEE 80 actual compliance is based on voltage limits only
    const overallCompliant = voltageCompliant;

    this.addTrace('compliance_check', {
      touchCompliant,
      stepCompliant,
      voltageCompliant,
      resistanceAssessment,
      overallCompliant,
      standard: 'IEEE 80-2013',
      note: 'IEEE 80 compliance based on step/touch voltage limits only'
    });

    return {
      touch: touchCompliant,
      step: stepCompliant,
      voltage: voltageCompliant,
      resistance: resistanceAssessment,
      overall: overallCompliant,
      margins: safetyMargins,
      standard: 'IEEE 80-2013'
    };
  }

  /**
   * Assess grid resistance performance (not compliance)
   */
  assessGridResistance(gridResistance, soilAnalysis) {
    const { soilResistivity } = soilAnalysis;
    
    // Performance categories based on engineering practice
    let assessment;
    let category;
    
    if (gridResistance <= 1) {
      assessment = 'excellent';
      category = 'low';
    } else if (gridResistance <= 5) {
      assessment = 'good';
      category = 'typical';
    } else if (gridResistance <= 10) {
      assessment = 'acceptable';
      category = 'moderate';
    } else if (gridResistance <= 25) {
      assessment = 'high';
      category = 'concerning';
    } else {
      assessment = 'very_high';
      category = 'problematic';
    }
    
    // Context-based assessment
    const expectedResistance = soilResistivity * 0.05; // Rough engineering rule
    const performanceRatio = gridResistance / expectedResistance;
    
    return {
      value: gridResistance,
      assessment,
      category,
      performanceRatio,
      expectedResistance,
      note: 'Performance indicator, not IEEE 80 compliance requirement'
    };
  }

  /**
   * Generate engineering recommendations
   */
  generateRecommendations(faultAnalysis, gridAnalysis, soilAnalysis) {
    const recommendations = [];
    const { safetyMargins } = faultAnalysis;
    const { gridResistance } = gridAnalysis;
    const { soilQuality } = soilAnalysis;

    // Safety recommendations
    if (!safetyMargins.touchSafe) {
      recommendations.push({
        type: 'critical',
        category: 'safety',
        title: 'Touch Voltage Exceeds Limits',
        description: 'Touch voltage is above IEEE 80 permissible limits',
        actions: [
          'Add more conductors to reduce grid resistance',
          'Increase surface layer resistivity with gravel',
          'Add grounding rods to improve current distribution'
        ]
      });
    }

    if (!safetyMargins.stepSafe) {
      recommendations.push({
        type: 'critical',
        category: 'safety', 
        title: 'Step Voltage Exceeds Limits',
        description: 'Step voltage is above IEEE 80 permissible limits',
        actions: [
          'Reduce mesh spacing in high-traffic areas',
          'Add surface layer material',
          'Install warning signs and barriers'
        ]
      });
    }

    // Resistance recommendations
    if (gridResistance > 5) {
      recommendations.push({
        type: 'warning',
        category: 'resistance',
        title: 'High Grid Resistance',
        description: `Grid resistance (${gridResistance.toFixed(2)}×) is above optimal range`,
        actions: [
          'Add more grounding rods',
          'Increase conductor density',
          'Consider soil treatment if resistivity is high'
        ]
      });
    }

    // Soil quality recommendations
    if (soilQuality.quality === 'poor' || soilQuality.quality === 'very_poor') {
      recommendations.push({
        type: 'info',
        category: 'soil',
        title: 'High Soil Resistivity',
        description: `Soil resistivity (${soilQuality.resistivity.toFixed(0)}××m) is high`,
        actions: [
          'Consider soil treatment with chemical agents',
          'Increase grounding system size',
          'Use deep-driven rods to reach lower resistivity layers'
        ]
      });
    }

    // Optimization recommendations
    if (safetyMargins.touchMargin > 50 && safetyMargins.stepMargin > 50) {
      recommendations.push({
        type: 'optimization',
        category: 'cost',
        title: 'Over-designed System',
        description: 'Safety margins are very high - system may be over-designed',
        actions: [
          'Consider reducing conductor quantity',
          'Optimize grid spacing',
          'Review cost-benefit analysis'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Assess overall system risk
   */
  assessRisk(faultAnalysis, gridAnalysis) {
    const { safetyMargins } = faultAnalysis;
    const { gridResistance } = gridAnalysis;

    let riskLevel = 'low';
    let riskScore = 0;
    let factors = [];

    // Calculate risk score based on multiple factors
    if (gridResistance > 10) {
      riskScore += 30;
      factors.push('High grid resistance');
    }

    if (safetyMargins.touchMargin < 20) {
      riskScore += 40;
      factors.push('Low touch voltage margin');
    }

    if (safetyMargins.stepMargin < 20) {
      riskScore += 30;
      factors.push('Low step voltage margin');
    }

    // Determine risk level
    if (riskScore >= 70) {
      riskLevel = 'critical';
    } else if (riskScore >= 40) {
      riskLevel = 'high';
    } else if (riskScore >= 20) {
      riskLevel = 'medium';
    }

    return {
      level: riskLevel,
      score: riskScore,
      factors,
      assessment: this.getRiskAssessmentText(riskLevel)
    };
  }

  /**
   * Get risk assessment description
   */
  getRiskAssessmentText(level) {
    const assessments = {
      low: 'System meets all safety requirements with adequate margins',
      medium: 'System meets requirements but monitoring recommended',
      high: 'System has safety concerns that should be addressed',
      critical: 'System poses significant safety risks requiring immediate action'
    };

    return assessments[level] || 'Risk level unknown';
  }

  /**
   * Add traceability entry
   */
  addTrace(calculation, data) {
    console.log(`addTrace called: ${calculation}`);
    console.log('traceability type:', typeof this.traceability);
    console.log('traceability value:', this.traceability);
    console.log('traceability length:', this.traceability?.length);
    console.log('Is array:', Array.isArray(this.traceability));
    
    if (!this.traceability) {
      console.error('Traceability array not initialized!');
      this.traceability = [];
    }
    
    if (typeof this.traceability.push !== 'function') {
      console.error('traceability.push is not a function!');
      console.error('traceability type:', typeof this.traceability);
      this.traceability = [];
    }
    
    this.traceability.push({
      timestamp: new Date().toISOString(),
      calculation,
      ...data
    });
  }

  /**
   * Get full traceability from functional approach
   */
  getFullTraceability() {
    // In functional approach, we only have main calculator traceability
    // Individual model traceability is handled within each model
    const fullTrace = [...this.traceability];

    // Sort by timestamp
    return fullTrace.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Export results in different formats
   */
  export(format = 'json') {
    if (!this.results) {
      throw new Error('No results to export. Run calculate() first.');
    }

    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(this.results, null, 2);
      
      case 'summary':
        return this.exportSummary();
      
      case 'report':
        return this.exportReport();
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export summary format
   */
  exportSummary() {
    const { soil, grid, fault, compliance, riskAssessment } = this.results;
    
    return `
Grounding System Analysis Summary
==================================

System Performance:
- Grid Resistance: ${grid.resistance.toFixed(2)} ×
- Touch Voltage: ${fault.touchVoltage.toFixed(0)} V (Limit: ${fault.permissibleTouch.toFixed(0)} V)
- Step Voltage: ${fault.stepVoltage.toFixed(0)} V (Limit: ${fault.permissibleStep.toFixed(0)} V)
- GPR: ${fault.gpr.toFixed(0)} V

Safety Margins:
- Touch: ${fault.safetyMargins.touchMargin.toFixed(1)}%
- Step: ${fault.safetyMargins.stepMargin.toFixed(1)}%

Compliance: ${compliance.overall ? 'PASS' : 'FAIL'}
Risk Level: ${riskAssessment.level.toUpperCase()}

Soil Conditions:
- Resistivity: ${soil.effectiveResistivity.toFixed(0)} ××m
- Quality: ${soil.soilQuality.quality}

Grid Configuration:
- Area: ${grid.area.toFixed(0)} m²
- Conductors: ${grid.totalConductorLength.toFixed(0)} m
- Rods: ${this.input.grid.numRods}
    `.trim();
  }

  /**
   * Export detailed report format
   */
  exportReport() {
    // This would generate a comprehensive engineering report
    // For now, return the summary as placeholder
    return this.exportSummary();
  }

  /**
   * Get calculation statistics
   */
  getStatistics() {
    if (!this.results) {
      return null;
    }

    return {
      totalCalculations: this.traceability.length,
      executionTime: this.traceability[this.traceability.length - 1]?.timestamp,
      modelsUsed: ['SoilModel', 'GridModel', 'FaultModel'],
      complianceStatus: this.results.compliance.overall,
      riskScore: this.results.riskAssessment.score
    };
  }
}

export default GroundingCalculator;
