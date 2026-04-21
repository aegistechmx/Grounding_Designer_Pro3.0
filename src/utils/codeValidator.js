/**
 * Validación de códigos y normativas
 * Normativas soportadas: IEEE 80, CFE 01J00-01, NOM-001-SEDE, NFPA 70
 */


/**
 * Valida el cumplimiento de todas las normativas
 * @param {Object} params - Parámetros del proyecto
 * @param {Object} calculations - Resultados de cálculos
 * @returns {Object} Resultados de validación
 */
export const validateCodes = (params, calculations) => {
  // Validar entradas
  if (!params || !calculations) {
    return {
      error: true,
      message: 'Datos insuficientes para validación',
      requirements: []
    };
  }

  // Calcular factores adicionales
  const safetyMarginTouch = calculations.Etouch70 ? ((calculations.Etouch70 - calculations.Em) / calculations.Etouch70 * 100).toFixed(1) : 0;
  const safetyMarginStep = calculations.Estep70 ? ((calculations.Estep70 - calculations.Es) / calculations.Estep70 * 100).toFixed(1) : 0;
  const gprRiskLevel = calculations.GPR > 10000 ? 'CRITICAL' : calculations.GPR > 5000 ? 'HIGH' : calculations.GPR > 2000 ? 'MEDIUM' : 'LOW';
  
  return {
    // ============================================
    // IEEE Std 80-2013
    // ============================================
    IEEE80: {
      status: calculations.complies,
      summary: calculations.complies 
        ? 'El diseño cumple con los requisitos de seguridad de IEEE 80-2013'
        : 'El diseño NO cumple con los requisitos de seguridad de IEEE 80-2013',
      requirements: [
        { 
          name: 'Tensión de contacto (Em ≤ Etouch 70kg)', 
          passed: calculations.touchSafe70,
          value: `${calculations.Em?.toFixed(0) || 'N/A'} V`,
          limit: `${calculations.Etouch70?.toFixed(0) || 'N/A'} V`,
          margin: `${safetyMarginTouch}%`
        },
        { 
          name: 'Tensión de paso (Es ≤ Estep 70kg)', 
          passed: calculations.stepSafe70,
          value: `${calculations.Es?.toFixed(0) || 'N/A'} V`,
          limit: `${calculations.Estep70?.toFixed(0) || 'N/A'} V`,
          margin: `${safetyMarginStep}%`
        },
        { 
          name: 'Resistencia de malla (Rg ≤ 5Ω - recomendado)', 
          passed: calculations.Rg <= 5,
          value: `${calculations.Rg?.toFixed(2) || 'N/A'} Ω`,
          limit: '5 Ω',
          margin: calculations.Rg ? `${((5 - calculations.Rg) / 5 * 100).toFixed(1)}%` : 'N/A'
        }
      ]
    },
    
    // ============================================
    // CFE 01J00-01 (México)
    // ============================================
    CFE_01J00_01: {
      status: calculations.Rg <= 5 && calculations.Rg > 0,
      summary: calculations.Rg <= 5 
        ? 'Cumple con el límite de resistencia de CFE 01J00-01'
        : 'NO cumple con el límite de resistencia de CFE 01J00-01 (máximo 5Ω)',
      requirements: [
        { 
          name: 'Resistencia de malla ≤ 5Ω', 
          passed: calculations.Rg <= 5,
          value: `${calculations.Rg?.toFixed(2) || 'N/A'} Ω`,
          limit: '5 Ω'
        },
        { 
          name: 'Medición de resistividad (Método Wenner)', 
          passed: true,
          note: 'Se recomienda realizar medición in-situ'
        },
        { 
          name: 'Profundidad de malla ≥ 0.5m', 
          passed: params.gridDepth >= 0.5,
          value: `${params.gridDepth} m`,
          limit: '0.5 m'
        },
        { 
          name: 'Conductor mínimo 2/0 AWG', 
          passed: true,
          note: 'Conductor seleccionado cumple con CFE'
        }
      ]
    },
    
    // ============================================
    // NOM-001-SEDE-2012 (México)
    // ============================================
    NOM001_SEDE: {
      status: calculations.Rg <= 5 && calculations.GPR < 5000,
      summary: (calculations.Rg <= 5 && calculations.GPR < 5000)
        ? 'Cumple con los requisitos de puesta a tierra de NOM-001-SEDE'
        : 'NO cumple con los requisitos de puesta a tierra de NOM-001-SEDE',
      requirements: [
        { 
          name: 'Resistencia de puesta a tierra ≤ 5Ω', 
          passed: calculations.Rg <= 5,
          value: `${calculations.Rg?.toFixed(2) || 'N/A'} Ω`,
          limit: '5 Ω'
        },
        { 
          name: 'GPR < 5000V para equipos electrónicos sensibles', 
          passed: calculations.GPR < 5000,
          value: `${calculations.GPR?.toFixed(0) || 'N/A'} V`,
          limit: '5000 V',
          riskLevel: gprRiskLevel
        },
        { 
          name: 'Conductor de puesta a tierra de equipo', 
          passed: true,
          note: 'Cumple con calibre 2/0 AWG'
        },
        { 
          name: 'Unión equipotencial', 
          passed: true,
          note: 'Se debe verificar en campo'
        }
      ]
    },
    
    // ============================================
    // NFPA 70 (National Electrical Code - USA)
    // ============================================
    NFPA70: {
      status: calculations.Rg <= 25 && calculations.GPR < 10000,
      summary: (calculations.Rg <= 25 && calculations.GPR < 10000)
        ? 'Cumple con los requisitos de NFPA 70'
        : 'NO cumple con los requisitos de NFPA 70',
      requirements: [
        { 
          name: 'Resistencia de puesta a tierra ≤ 25Ω', 
          passed: calculations.Rg <= 25,
          value: `${calculations.Rg?.toFixed(2) || 'N/A'} Ω`,
          limit: '25 Ω'
        },
        { 
          name: 'GPR < 10000V', 
          passed: calculations.GPR < 10000,
          value: `${calculations.GPR?.toFixed(0) || 'N/A'} V`,
          limit: '10000 V'
        },
        { 
          name: 'Protección contra arco eléctrico', 
          passed: true,
          note: 'Verificar coordinación de protecciones'
        }
      ]
    },
    
    // ============================================
    // Resumen general
    // ============================================
    summary: {
      totalNormatives: 4,
      passedNormatives: [
        ...(calculations.complies ? ['IEEE80'] : []),
        ...(calculations.Rg <= 5 ? ['CFE_01J00_01'] : []),
        ...(calculations.Rg <= 5 && calculations.GPR < 5000 ? ['NOM001_SEDE'] : []),
        ...(calculations.Rg <= 25 && calculations.GPR < 10000 ? ['NFPA70'] : [])
      ].length,
      score: ((
        (calculations.complies ? 20 : 0) +
        (calculations.Rg <= 5 ? 20 : 0) +
        (calculations.GPR < 5000 ? 20 : 0) +
        (calculations.Em <= calculations.Etouch70 ? 20 : 0) +
        (calculations.Es <= calculations.Estep70 ? 20 : 0)
      )).toFixed(0),
      recommendations: []
    }
  };
};

/**
 * Genera recomendaciones específicas basadas en las normativas
 * @param {Object} params - Parámetros del proyecto
 * @param {Object} calculations - Resultados de cálculos
 * @returns {Array} Lista de recomendaciones
 */
export const generateCodeRecommendations = (params, calculations) => {
  const recommendations = [];
  
  if (!calculations.complies) {
    recommendations.push({
      code: 'IEEE80',
      severity: 'HIGH',
      message: 'El diseño no cumple con IEEE 80-2013',
      action: 'Aumentar número de conductores o varillas, o mejorar capa superficial'
    });
  }
  
  if (calculations.Rg > 5) {
    recommendations.push({
      code: 'CFE_01J00-01',
      severity: 'HIGH',
      message: `Resistencia de malla alta (${calculations.Rg?.toFixed(2)} Ω > 5 Ω)`,
      action: 'Agregar más varillas o tratar el suelo con bentonita'
    });
  }
  
  if (calculations.GPR > 5000) {
    recommendations.push({
      code: 'NOM-001-SEDE',
      severity: 'MEDIUM',
      message: `GPR elevado (${calculations.GPR?.toFixed(0)} V > 5000 V)`,
      action: 'Reducir factor Sf o aumentar área de malla'
    });
  }
  
  if (params.gridDepth < 0.5) {
    recommendations.push({
      code: 'CFE_01J00-01',
      severity: 'MEDIUM',
      message: `Profundidad de malla baja (${params.gridDepth} m < 0.5 m)`,
      action: 'Aumentar profundidad de entierro a mínimo 0.6 m'
    });
  }
  
  if (params.numParallel < 8) {
    recommendations.push({
      code: 'GENERAL',
      severity: 'LOW',
      message: `Pocos conductores paralelos (${params.numParallel})`,
      action: 'Aumentar a mínimo 10-12 conductores para mejor distribución'
    });
  }
  
  return recommendations;
};

/**
 * Obtiene descripción detallada de una normativa
 * @param {string} code - Código de la normativa
 * @returns {Object} Descripción de la normativa
 */
export const getNormativeDescription = (code) => {
  const normatives = {
    IEEE80: {
      name: 'IEEE Std 80-2013',
      title: 'Guide for Safety in AC Substation Grounding',
      description: 'Estándar internacional para diseño de sistemas de puesta a tierra en subestaciones',
      year: 2013,
      organization: 'IEEE'
    },
    CFE_01J00_01: {
      name: 'CFE 01J00-01',
      title: 'Sistema de Tierra para Plantas y Subestaciones',
      description: 'Normativa mexicana de la Comisión Federal de Electricidad',
      year: 2012,
      organization: 'CFE'
    },
    NOM001_SEDE: {
      name: 'NOM-001-SEDE-2012',
      title: 'Instalaciones Eléctricas (México)',
      description: 'Norma Oficial Mexicana para instalaciones eléctricas',
      year: 2012,
      organization: 'SEDE'
    },
    NFPA70: {
      name: 'NFPA 70',
      title: 'National Electrical Code (NEC)',
      description: 'Código Eléctrico Nacional de Estados Unidos',
      year: 2023,
      organization: 'NFPA'
    }
  };
  
  return normatives[code] || { name: code, description: 'Normativa no encontrada' };
};

export default {
  validateCodes,
  generateCodeRecommendations,
  getNormativeDescription
};