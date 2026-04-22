/**
 * AI Suggestion Service for Grounding System Improvements
 * Analyzes calculation results and provides intelligent recommendations
 */

/**
 * Classify heatmap zone type based on location and characteristics
 * @param {object} zone - Zone data with coordinates and properties
 * @returns {string} - Zone type: edge_effect, high_resistivity, corner_effect, center_effect
 */
export const classifyZone = (zone) => {
  const { x, y, gridLength, gridWidth } = zone;
  
  // Edge effect: near perimeter
  const isEdge = x < gridLength * 0.1 || x > gridLength * 0.9 || 
                 y < gridWidth * 0.1 || y > gridWidth * 0.9;
  
  // Corner effect: near corners
  const isCorner = (x < gridLength * 0.1 || x > gridLength * 0.9) && 
                  (y < gridWidth * 0.1 || y > gridWidth * 0.9);
  
  if (isCorner) return 'corner_effect';
  if (isEdge) return 'edge_effect';
  
  // Center effect: middle of grid
  const centerX = gridLength / 2;
  const centerY = gridWidth / 2;
  const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
  const maxDist = Math.sqrt((gridLength / 2) ** 2 + (gridWidth / 2) ** 2);
  
  if (distFromCenter < maxDist * 0.3) return 'center_effect';
  
  return 'high_resistivity';
};

/**
 * Generate AI decisions based on heatmap zones
 * @param {Array} zones - Array of dangerous zones from heatmap
 * @param {object} params - Input parameters
 * @returns {Array} - Array of zone-based decisions
 */
export const generateZoneBasedDecisions = (zones, params) => {
  const decisions = [];
  
  if (!zones || zones.length === 0) {
    return decisions;
  }

  // Group zones by type
  const zoneTypes = {};
  zones.forEach(zone => {
    const type = classifyZone(zone);
    if (!zoneTypes[type]) zoneTypes[type] = [];
    zoneTypes[type].push(zone);
  });

  // Generate decisions for each zone type
  if (zoneTypes.edge_effect && zoneTypes.edge_effect.length > 0) {
    decisions.push({
      type: 'zone_based',
      priority: 'high',
      title: 'Edge Effect Detected',
      description: `${zoneTypes.edge_effect.length} dangerous zones detected at grid perimeter.`,
      decision: {
        action: 'add_perimeter_conductor',
        location: 'perimeter',
        quantity: Math.ceil(zoneTypes.edge_effect.length / 2),
        expectedImprovement: {
          Em: '-25%',
          Es: '-20%',
          percentage: 'high'
        },
        reasoning: 'Reducir efecto de borde en perímetro'
      }
    });
  }

  if (zoneTypes.corner_effect && zoneTypes.corner_effect.length > 0) {
    decisions.push({
      type: 'zone_based',
      priority: 'critical',
      title: 'Corner Effect Critical',
      description: `${zoneTypes.corner_effect.length} critical zones at grid corners.`,
      decision: {
        action: 'add_corner_rods',
        location: 'corners',
        quantity: 4,
        length: 3,
        expectedImprovement: {
          Em: '-35%',
          Rg: '-30%',
          percentage: 'critical'
        },
        reasoning: 'Mitigar efecto de esquina crítico'
      }
    });
  }

  if (zoneTypes.center_effect && zoneTypes.center_effect.length > 0) {
    decisions.push({
      type: 'zone_based',
      priority: 'medium',
      title: 'Center Zone High Potential',
      description: `${zoneTypes.center_effect.length} zones with high potential in grid center.`,
      decision: {
        action: 'add_center_conductors',
        location: 'center',
        quantity: Math.ceil(zoneTypes.center_effect.length / 3),
        expectedImprovement: {
          GPR: '-15%',
          percentage: 'medium'
        },
        reasoning: 'Reducir potencial en centro de malla'
      }
    });
  }

  if (zoneTypes.high_resistivity && zoneTypes.high_resistivity.length > 0) {
    decisions.push({
      type: 'zone_based',
      priority: 'medium',
      title: 'High Resistivity Zones',
      description: `${zoneTypes.high_resistivity.length} zones indicating local high resistivity.`,
      decision: {
        action: 'soil_treatment',
        method: 'bentonite',
        depth: '0.6m',
        locations: zoneTypes.high_resistivity.slice(0, 3),
        expectedImprovement: {
          Rg: '-15%',
          percentage: 'medium'
        },
        reasoning: 'Tratamiento de suelo en zonas de alta resistividad'
      }
    });
  }

  return decisions;
};

/**
 * Analyze grounding system and generate AI-powered calculated decisions
 * @param {object} params - Input parameters
 * @param {object} results - Calculation results
 * @param {Array} zones - Optional dangerous zones from heatmap
 * @returns {Array} - Array of calculated decision objects
 */
export const generateAISuggestions = (params, results, zones = []) => {
  const suggestions = [];
  
  if (!results) {
    return [{
      type: 'error',
      priority: 'high',
      title: 'No Results Available',
      description: 'Calculation results are required for AI analysis.',
      action: 'Run calculations first',
      decision: null
    }];
  }

  // ===== ZONE-BASED DECISIONS (from heatmap) =====
  const zoneDecisions = generateZoneBasedDecisions(zones, params);
  suggestions.push(...zoneDecisions);

  // ===== RESISTANCE ANALYSIS =====
  if (results.Rg > 5) {
    const additionalRods = Math.ceil((results.Rg - 5) * 2);
    suggestions.push({
      type: 'resistance',
      priority: 'high',
      title: 'High Grid Resistance Detected',
      description: `Current grid resistance (${results.Rg.toFixed(2)} Ω) exceeds recommended limit of 5 Ω.`,
      action: 'Add more conductors or increase conductor diameter',
      decision: {
        action: 'add_rods',
        quantity: additionalRods,
        location: 'perimeter',
        expectedImprovement: {
          Rg: -(results.Rg * 0.2).toFixed(2),
          percentage: '20-30%'
        },
        reasoning: 'Reducir resistencia de puesta a tierra'
      },
      expectedImprovement: 'Reduce Rg by 20-30%',
      impact: 'high'
    });
  }

  // ===== TOUCH VOLTAGE ANALYSIS =====
  if (!results.touchSafe && results.Em > results.Etouch70) {
    const touchMargin = ((results.Em - results.Etouch70) / results.Etouch70 * 100).toFixed(1);
    const newSpacing = (params.gridLength / (params.numParallel || 1)) * 0.7;
    suggestions.push({
      type: 'touch_voltage',
      priority: 'critical',
      title: 'Touch Voltage Exceeds Safe Limit',
      description: `Mesh voltage (${results.Em.toFixed(2)} V) is ${touchMargin}% above safe limit (${results.Etouch70.toFixed(2)} V).`,
      action: 'Improve surface layer resistivity to 10,000+ Ω·m or add more grid conductors',
      decision: {
        action: 'reduce_spacing',
        newSpacing: newSpacing.toFixed(2),
        expectedImprovement: {
          Em: '-25%',
          percentage: 'critical'
        },
        reasoning: 'Reducir gradiente de potencial'
      },
      expectedImprovement: 'Reduce Em to safe levels',
      impact: 'critical'
    });
  }

  // ===== STEP VOLTAGE ANALYSIS =====
  if (!results.stepSafe && results.Es > results.Estep70) {
    const stepMargin = ((results.Es - results.Estep70) / results.Estep70 * 100).toFixed(1);
    suggestions.push({
      type: 'step_voltage',
      priority: 'high',
      title: 'Step Voltage Exceeds Safe Limit',
      description: `Step voltage (${results.Es.toFixed(2)} V) is ${stepMargin}% above safe limit (${results.Estep70.toFixed(2)} V).`,
      action: 'Increase grid depth or add perimeter conductors',
      decision: {
        action: 'increase_depth',
        newDepth: (params.gridDepth + 0.2).toFixed(2),
        expectedImprovement: {
          Es: '-15%',
          percentage: 'high'
        },
        reasoning: 'Reducir tensión de paso'
      },
      expectedImprovement: 'Reduce Es to safe levels',
      impact: 'high'
    });
  }

  // ===== SURFACE LAYER ANALYSIS =====
  if (params.surfaceLayer < 5000) {
    suggestions.push({
      type: 'surface_layer',
      priority: 'medium',
      title: 'Surface Layer Resistivity Too Low',
      description: `Current surface layer (${params.surfaceLayer} Ω·m) is below recommended 10,000 Ω·m.`,
      action: 'Add gravel or crushed stone layer (10,000+ Ω·m, 0.15m minimum)',
      decision: {
        action: 'upgrade_surface',
        newResistivity: 10000,
        newDepth: 0.15,
        expectedImprovement: {
          Etouch70: '+500%',
          percentage: 'high'
        },
        reasoning: 'Aumentar límite de tensión de contacto'
      },
      expectedImprovement: 'Increase touch voltage limit by 500-1000%',
      impact: 'high'
    });
  }

  if (params.surfaceDepth < 0.1) {
    suggestions.push({
      type: 'surface_depth',
      priority: 'medium',
      title: 'Surface Layer Depth Insufficient',
      description: `Surface layer depth (${params.surfaceDepth} m) is below IEEE 80 minimum of 0.1 m.`,
      action: 'Increase surface layer depth to 0.15-0.2 m',
      decision: {
        action: 'increase_surface_depth',
        newDepth: 0.15,
        expectedImprovement: {
          safetyFactor: '+20%',
          percentage: 'medium'
        },
        reasoning: 'Mejorar factor de seguridad'
      },
      expectedImprovement: 'Improve safety factor by 20-30%',
      impact: 'medium'
    });
  }

  // ===== GRID GEOMETRY ANALYSIS =====
  const gridArea = (params.gridLength || 0) * (params.gridWidth || 0);
  const conductorDensity = (params.numParallel || 0) / gridArea;
  
  if (conductorDensity < 0.05) {
    const targetConductors = Math.ceil(gridArea * 0.1);
    suggestions.push({
      type: 'grid_density',
      priority: 'medium',
      title: 'Low Conductor Density',
      description: `Current conductor density (${conductorDensity.toFixed(3)} conductors/m²) is below optimal range.`,
      action: 'Add more parallel conductors (target: 0.1-0.15 conductors/m²)',
      decision: {
        action: 'add_conductors',
        quantity: targetConductors - (params.numParallel || 0),
        targetDensity: 0.1,
        expectedImprovement: {
          Em: '-20%',
          Es: '-20%',
          percentage: 'medium'
        },
        reasoning: 'Aumentar densidad de conductores'
      },
      expectedImprovement: 'Reduce touch and step voltages by 15-25%',
      impact: 'medium'
    });
  }

  // ===== ROD ANALYSIS =====
  if (params.numRods === 0) {
    suggestions.push({
      type: 'rods',
      priority: 'medium',
      title: 'No Ground Rods Installed',
      description: 'Ground rods can significantly reduce grid resistance and improve safety.',
      action: 'Add ground rods at perimeter corners and along edges (2.4-3m length)',
      decision: {
        action: 'add_rods',
        quantity: 4,
        location: 'perimeter_corners',
        length: 2.4,
        expectedImprovement: {
          Rg: '-40%',
          percentage: 'high'
        },
        reasoning: 'Reducir resistencia de malla'
      },
      expectedImprovement: 'Reduce Rg by 30-50%',
      impact: 'high'
    });
  } else if (params.rodLength < 2.4) {
    suggestions.push({
      type: 'rod_length',
      priority: 'low',
      title: 'Rod Length Below Optimal',
      description: `Current rod length (${params.rodLength} m) is below IEEE 80 recommendation of 2.4 m.`,
      action: 'Increase rod length to 2.4-3 m for better grounding',
      decision: {
        action: 'increase_rod_length',
        newLength: 2.4,
        expectedImprovement: {
          Rg: '-15%',
          percentage: 'medium'
        },
        reasoning: 'Mejorar efectividad de varillas'
      },
      expectedImprovement: 'Reduce Rg by 10-20%',
      impact: 'medium'
    });
  }

  // ===== GRID DEPTH ANALYSIS =====
  if (params.gridDepth < 0.5) {
    suggestions.push({
      type: 'grid_depth',
      priority: 'low',
      title: 'Grid Depth Shallow',
      description: `Grid depth (${params.gridDepth} m) is below recommended 0.5-0.8 m.`,
      action: 'Increase grid depth to 0.5-0.8 m',
      decision: {
        action: 'increase_grid_depth',
        newDepth: 0.5,
        expectedImprovement: {
          Es: '-12%',
          percentage: 'low'
        },
        reasoning: 'Reducir tensión de paso'
      },
      expectedImprovement: 'Reduce step voltage by 10-15%',
      impact: 'low'
    });
  }

  // ===== CURRENT DIVISION FACTOR ANALYSIS =====
  if (params.currentDivisionFactor > 0.5) {
    suggestions.push({
      type: 'current_division',
      priority: 'medium',
      title: 'High Current Division Factor',
      description: `Current division factor (${params.currentDivisionFactor}) is conservative. Lower values may be justified with proper analysis.`,
      action: 'Perform detailed current division analysis (Schwarz equations)',
      decision: {
        action: 'analyze_current_division',
        method: 'schwarz_equations',
        targetFactor: 0.35,
        expectedImprovement: {
          gridSize: '-18%',
          percentage: 'medium'
        },
        reasoning: 'Optimizar factor de división de corriente'
      },
      expectedImprovement: 'Reduce required grid size by 15-20%',
      impact: 'medium'
    });
  }

  // ===== POSITIVE REINFORCEMENT =====
  if (results.complies && results.Rg < 2) {
    suggestions.push({
      type: 'success',
      priority: 'info',
      title: 'Excellent Design',
      description: 'Your grounding system design meets all IEEE 80 requirements with excellent safety margins.',
      action: 'Design is ready for implementation',
      decision: {
        action: 'approve_design',
        status: 'ready',
        expectedImprovement: null,
        reasoning: 'Diseño cumple con requisitos'
      },
      expectedImprovement: 'N/A',
      impact: 'none'
    });
  }

  // ===== COST OPTIMIZATION =====
  if (results.complies && results.Rg < 1) {
    suggestions.push({
      type: 'optimization',
      priority: 'low',
      title: 'Potential Cost Optimization',
      description: 'Grid resistance is very low. Consider reducing conductor count to optimize cost while maintaining safety.',
      action: 'Run optimization algorithm to find cost-effective design',
      decision: {
        action: 'optimize_cost',
        targetRg: 2,
        expectedImprovement: {
          cost: '-15%',
          percentage: 'low'
        },
        reasoning: 'Optimizar costo manteniendo seguridad'
      },
      expectedImprovement: 'Reduce material cost by 10-20%',
      impact: 'low'
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4, error: 5 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return suggestions;
};

/**
 * Get overall safety score (0-100)
 * @param {object} results - Calculation results
 * @returns {number} - Safety score
 */
export const calculateSafetyScore = (results) => {
  if (!results) return 0;

  let score = 100;

  // Deduct for non-compliance
  if (!results.complies) score -= 40;
  if (!results.touchSafe) score -= 30;
  if (!results.stepSafe) score -= 30;

  // Deduct for high resistance
  if (results.Rg > 5) score -= 10;
  if (results.Rg > 10) score -= 10;

  // Bonus for excellent design
  if (results.complies && results.Rg < 1) score += 10;

  return Math.max(0, Math.min(100, score));
};

/**
 * Get risk level classification (professional engineering standard)
 * @param {object} results - Calculation results
 * @returns {string} - Risk level: CRITICAL, HIGH, MARGINAL, SAFE
 */
export const getRiskLevel = (results) => {
  if (!results) return "UNKNOWN";

  if (!results.complies) {
    if (results.Em > results.Etouch70 * 1.5) return "CRITICAL";
    return "HIGH";
  }

  if (results.Em > results.Etouch70 * 0.8) return "MARGINAL";

  return "SAFE";
};

/**
 * Get risk level from safety score (legacy function)
 * @param {number} score - Safety score (0-100)
 * @returns {string} - Risk level
 */
export const getRiskLevelFromScore = (score) => {
  if (score >= 90) return 'Very Low';
  if (score >= 70) return 'Low';
  if (score >= 50) return 'Medium';
  if (score >= 30) return 'High';
  return 'Very High';
};

/**
 * Generate comprehensive AI report
 * @param {object} params - Input parameters
 * @param {object} results - Calculation results
 * @returns {object} - Complete AI analysis report
 */
export const generateAIReport = (params, results) => {
  const suggestions = generateAISuggestions(params, results);
  const safetyScore = calculateSafetyScore(results);
  const riskLevel = getRiskLevel(safetyScore);

  return {
    safetyScore,
    riskLevel,
    suggestions,
    summary: {
      totalSuggestions: suggestions.length,
      criticalIssues: suggestions.filter(s => s.priority === 'critical').length,
      highPriority: suggestions.filter(s => s.priority === 'high').length,
      mediumPriority: suggestions.filter(s => s.priority === 'medium').length,
      lowPriority: suggestions.filter(s => s.priority === 'low').length,
      overallStatus: results?.complies ? 'COMPLIANT' : 'NON-COMPLIANT'
    },
    recommendations: suggestions
      .filter(s => s.priority !== 'info' && s.priority !== 'error')
      .map(s => s.action)
  };
};
