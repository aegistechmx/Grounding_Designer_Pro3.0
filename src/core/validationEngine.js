/**
 * Motor de Validación Avanzada
 * Verifica cumplimiento con múltiples normas y genera reportes
 */

// Definición de normas
export const NORMATIVES = {
  IEEE_80: {
    name: 'IEEE Std 80-2013',
    country: 'Internacional',
    description: 'Guide for Safety in AC Substation Grounding',
    requirements: [
      { id: 'touch_voltage', name: 'Tensión de contacto', condition: (r) => r.Em <= r.Etouch70 },
      { id: 'step_voltage', name: 'Tensión de paso', condition: (r) => r.Es <= r.Estep70 },
      { id: 'resistance', name: 'Resistencia de malla', condition: (r) => r.Rg <= 5, isRecommendation: true }
    ],
    weight: 1.0
  },
  CFE_01J00_01: {
    name: 'CFE 01J00-01',
    country: 'México',
    description: 'Sistema de Tierra para Plantas y Subestaciones Eléctricas',
    requirements: [
      { id: 'resistance_cfe', name: 'Resistencia ≤ 5Ω', condition: (r) => r.Rg <= 5 },
      { id: 'depth', name: 'Profundidad ≥ 0.5m', condition: (r) => (r.h || 0.6) >= 0.5 },
      { id: 'conductor', name: 'Conductor mínimo 2/0 AWG', condition: (r) => (r.selectedConductorInfo?.area || 0) >= 67.4 }
    ],
    weight: 0.9
  },
  NOM_001_SEDE: {
    name: 'NOM-001-SEDE-2012',
    country: 'México',
    description: 'Instalaciones Eléctricas',
    requirements: [
      { id: 'resistance_nom', name: 'Resistencia ≤ 5Ω', condition: (r) => r.Rg <= 5 },
      { id: 'gpr_nom', name: 'GPR < 5000V', condition: (r) => r.GPR < 5000 },
      { id: 'equipment_ground', name: 'Puesta a tierra de equipo', condition: () => true, isInfo: true }
    ],
    weight: 0.8
  },
  NFPA_70: {
    name: 'NFPA 70 (NEC)',
    country: 'USA',
    description: 'National Electrical Code',
    requirements: [
      { id: 'resistance_nfpa', name: 'Resistencia ≤ 25Ω', condition: (r) => r.Rg <= 25 },
      { id: 'gpr_nfpa', name: 'GPR < 10000V', condition: (r) => r.GPR < 10000 }
    ],
    weight: 0.7
  }
};

// Validar diseño contra todas las normas
export const validateDesign = (calculations, params) => {
  const results = {};
  let overallScore = 0;
  let totalWeight = 0;
  
  for (const [key, norm] of Object.entries(NORMATIVES)) {
    const normResults = {
      name: norm.name,
      country: norm.country,
      description: norm.description,
      complies: true,
      requirements: [],
      score: 0,
      weight: norm.weight
    };
    
    let passedCount = 0;
    
    for (const req of norm.requirements) {
      const passed = req.condition(calculations);
      normResults.requirements.push({
        id: req.id,
        name: req.name,
        passed,
        isRecommendation: req.isRecommendation || false,
        isInfo: req.isInfo || false
      });
      
      if (!req.isRecommendation && !req.isInfo) {
        if (!passed) normResults.complies = false;
        if (passed) passedCount++;
      }
    }
    
    const reqCount = normResults.requirements.filter(r => !r.isRecommendation && !r.isInfo).length;
    normResults.score = reqCount > 0 ? (passedCount / reqCount) * 100 : 100;
    
    results[key] = normResults;
    overallScore += normResults.score * norm.weight;
    totalWeight += norm.weight;
  }
  
  overallScore = totalWeight > 0 ? overallScore / totalWeight : 0;
  
  return {
    normatives: results,
    overallScore: overallScore.toFixed(1),
    complies: overallScore >= 70,
    summary: generateValidationSummary(results, overallScore)
  };
};

// Generar resumen de validación
export const generateValidationSummary = (results, overallScore) => {
  const passedNormatives = Object.values(results).filter(n => n.complies).length;
  const totalNormatives = Object.keys(results).length;
  const criticalIssues = [];
  const warnings = [];
  const recommendations = [];
  
  for (const [key, norm] of Object.entries(results)) {
    for (const req of norm.requirements) {
      if (!req.passed && !req.isRecommendation && !req.isInfo) {
        criticalIssues.push({
          normative: norm.name,
          requirement: req.name
        });
      } else if (!req.passed && req.isRecommendation) {
        recommendations.push({
          normative: norm.name,
          requirement: req.name
        });
      }
    }
  }
  
  let status = 'Aprobado';
  let statusColor = 'green';
  if (overallScore < 50) {
    status = 'Rechazado';
    statusColor = 'red';
  } else if (overallScore < 70) {
    status = 'Condicionado';
    statusColor = 'yellow';
  }
  
  return {
    status,
    statusColor,
    overallScore: overallScore.toFixed(1),
    passedNormatives,
    totalNormatives,
    criticalIssues,
    warnings,
    recommendations,
    message: criticalIssues.length > 0
      ? `El diseño tiene ${criticalIssues.length} incumplimientos críticos que deben corregirse.`
      : recommendations.length > 0
        ? `El diseño cumple con los requisitos básicos, pero se recomiendan mejoras.`
        : `El diseño cumple con todas las normativas aplicables.`
  };
};

// Validar parámetros de entrada
export const validateParams = (params) => {
  const errors = [];
  const warnings = [];
  
  // Validaciones básicas
  if (!params.transformerKVA || params.transformerKVA <= 0) {
    errors.push('La potencia del transformador debe ser mayor a 0 kVA');
  }
  
  if (!params.gridLength || params.gridLength <= 0) {
    errors.push('El largo de la malla debe ser mayor a 0 m');
  }
  
  if (!params.gridWidth || params.gridWidth <= 0) {
    errors.push('El ancho de la malla debe ser mayor a 0 m');
  }
  
  if (!params.soilResistivity || params.soilResistivity <= 0) {
    errors.push('La resistividad del suelo debe ser mayor a 0 Ω·m');
  }
  
  // Advertencias
  if (params.soilResistivity > 1000) {
    warnings.push('La resistividad del suelo es alta (>1000 Ω·m). Considere tratamiento químico.');
  }
  
  if (params.gridLength / params.gridWidth > 2 || params.gridWidth / params.gridLength > 2) {
    warnings.push('La relación largo/ancho de la malla es mayor a 2:1. Considere una forma más cuadrada.');
  }
  
  if (params.numParallel < 4) {
    warnings.push('Pocos conductores paralelos. Aumente el número para mejor distribución.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasWarnings: warnings.length > 0
  };
};

// Calcular score de cumplimiento por categoría
export const getComplianceScoreByCategory = (calculations) => {
  return {
    seguridad: {
      score: calculations.touchSafe70 && calculations.stepSafe70 ? 100 : 50,
      details: {
        contacto: calculations.touchSafe70 ? 'Cumple' : 'No cumple',
        paso: calculations.stepSafe70 ? 'Cumple' : 'No cumple'
      }
    },
    resistencia: {
      score: calculations.Rg <= 2 ? 100 : calculations.Rg <= 5 ? 70 : 30,
      details: {
        valor: `${calculations.Rg?.toFixed(2)} Ω`,
        objetivo: '< 5 Ω'
      }
    },
    gpr: {
      score: calculations.GPR <= 5000 ? 100 : calculations.GPR <= 10000 ? 60 : 20,
      details: {
        valor: `${calculations.GPR?.toFixed(0)} V`,
        riesgo: calculations.GPR > 5000 ? 'Alto' : 'Bajo'
      }
    },
    conductor: {
      score: calculations.thermalCheck?.complies ? 100 : 0,
      details: {
        calibre: calculations.selectedConductor || 'N/A',
        verificación: calculations.thermalCheck?.complies ? 'Aprobado' : 'Requiere cambio'
      }
    }
  };
};

export default {
  validateDesign,
  validateParams,
  getComplianceScoreByCategory,
  generateValidationSummary,
  NORMATIVES
};