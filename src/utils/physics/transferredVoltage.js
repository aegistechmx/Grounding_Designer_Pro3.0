/**
 * Calcula la tensión transferida a estructuras cercanas
 * Basado en IEEE 80 sección 14.3
 * 
 * La tensión transferida es el potencial que aparece en estructuras
 * metálicas conectadas a la malla pero ubicadas a cierta distancia.
 */

/**
 * Calcula la constante de atenuación α
 * @param {number} soilResistivity - Resistividad del suelo (Ω·m)
 * @returns {number} Constante de atenuación (m⁻¹)
 */
export const calculateAttenuationConstant = (soilResistivity = 100) => {
  const safeSoilResistivity = Math.max(soilResistivity, 1);
  // Fórmula: α = √(ωμ₀/ρ)
  // ω = 2πf (f = 60 Hz)
  // μ₀ = 4π × 10⁻⁷ H/m
  const omega = 2 * Math.PI * 60;
  const mu0 = 4 * Math.PI * 1e-7;
  const alpha = Math.sqrt((omega * mu0) / safeSoilResistivity);
  return alpha;
};

/**
 * Calcula la tensión transferida a una distancia dada
 * @param {number} GPR - Ground Potential Rise (V)
 * @param {number} distance - Distancia a la estructura (m)
 * @param {number} soilResistivity - Resistividad del suelo (Ω·m)
 * @returns {object} Resultados del cálculo
 */
export const calculateTransferredVoltage = (GPR, distance, soilResistivity = 100) => {
  // Validar entradas
  if (!GPR || GPR <= 0) {
    return {
      GPR: 0,
      distance: distance || 0,
      theoreticalVoltage: '0',
      practicalVoltage: '0',
      risk: 'SIN DATOS',
      recommendation: '⚠️ No hay datos de GPR disponibles',
      attenuation: 0
    };
  }
  
  if (!distance || distance <= 0) {
    return {
      GPR: isFinite(GPR) ? GPR.toFixed(0) : 'N/A',
      distance: 0,
      theoreticalVoltage: isFinite(GPR) ? GPR.toFixed(0) : 'N/A',
      practicalVoltage: isFinite(GPR) ? GPR.toFixed(0) : 'N/A',
      risk: isFinite(GPR) && GPR > 500 ? 'ALTO' : isFinite(GPR) && GPR > 200 ? 'MODERADO' : 'BAJO',
      recommendation: '⚠️ Estructura dentro del área de la malla',
      attenuation: 1
    };
  }
  
  const safeSoilResistivity = Math.max(soilResistivity, 1);
  const alpha = calculateAttenuationConstant(safeSoilResistivity);
  
  // Atenuación exponencial teórica
  const attenuation = Math.exp(-alpha * distance);
  const theoreticalVoltage = GPR * attenuation;
  
  // Cálculo práctico simplificado (basado en experiencia de campo)
  let practicalVoltage = GPR;
  let attenuationFactor = 1;
  
  if (distance < 5) {
    attenuationFactor = 1 - distance / 20;
    practicalVoltage = GPR * attenuationFactor;
  } else if (distance < 20) {
    attenuationFactor = 0.75 - (distance - 5) / 60;
    practicalVoltage = GPR * attenuationFactor;
  } else if (distance < 50) {
    attenuationFactor = 0.1 - (distance - 20) / 300;
    practicalVoltage = GPR * Math.max(0.02, attenuationFactor);
  } else {
    attenuationFactor = 0.02;
    practicalVoltage = GPR * 0.02;
  }
  
  practicalVoltage = Math.max(0, practicalVoltage);
  
  // Determinar nivel de riesgo
  let risk = 'BAJO';
  let recommendation = '';
  
  if (theoreticalVoltage > 1000) {
    risk = 'CRÍTICO';
    recommendation = '🔴 RIESGO CRÍTICO. Instalar barrera de protección y conectar equipotencialmente';
  } else if (theoreticalVoltage > 500) {
    risk = 'ALTO';
    recommendation = '⚠️ Conectar equipotencialmente ambas estructuras con conductor 2/0 AWG';
  } else if (theoreticalVoltage > 200) {
    risk = 'MODERADO';
    recommendation = '⚠️ Verificar aislamiento de cables entrantes y considerar enlace equipotencial';
  } else if (theoreticalVoltage > 100) {
    risk = 'BAJO';
    recommendation = '⚠️ Tensión transferida moderada, monitorear condiciones';
  } else {
    recommendation = '✅ Tensión transferida aceptable, no requiere acción adicional';
  }
  
  return {
    GPR: isFinite(GPR) ? GPR.toFixed(0) : 'N/A',
    distance: isFinite(distance) ? distance.toFixed(1) : 'N/A',
    soilResistivity: safeSoilResistivity,
    attenuationConstant: isFinite(alpha) ? alpha.toFixed(4) : 'N/A',
    attenuation: isFinite(attenuation) ? attenuation.toFixed(4) : 'N/A',
    attenuationPercent: isFinite(attenuation * 100) ? (attenuation * 100).toFixed(2) : 'N/A',
    theoreticalVoltage: isFinite(Math.max(0, theoreticalVoltage)) ? Math.max(0, theoreticalVoltage).toFixed(0) : 'N/A',
    practicalVoltage: isFinite(Math.max(0, practicalVoltage)) ? Math.max(0, practicalVoltage).toFixed(0) : 'N/A',
    risk,
    recommendation,
    requiresBonding: isFinite(theoreticalVoltage) && theoreticalVoltage > 500
  };
};

/**
 * Verifica la necesidad de enlace equipotencial entre dos estructuras
 * @param {number} gpr1 - GPR de la primera estructura (V)
 * @param {number} gpr2 - GPR de la segunda estructura (V)
 * @param {number} distance - Distancia entre estructuras (m)
 * @returns {object} Resultados de la verificación
 */
export const checkEquipotentialBonding = (gpr1, gpr2, distance) => {
  const safeGpr1 = Math.max(gpr1 || 0, 0);
  const safeGpr2 = Math.max(gpr2 || 0, 0);
  const difference = Math.abs(safeGpr1 - safeGpr2);
  const isAcceptable = difference < 500;
  
  let severity = 'BAJA';
  if (difference > 1000) severity = 'CRÍTICA';
  else if (difference > 500) severity = 'ALTA';
  else if (difference > 200) severity = 'MEDIA';
  
  let cableSize = '2 AWG';
  if (difference > 1000) cableSize = '2/0 AWG (mínimo) o 4/0 AWG recomendado';
  else if (difference > 500) cableSize = '1/0 AWG o 2/0 AWG';
  else if (difference > 200) cableSize = '2 AWG o 1/0 AWG';
  
  return {
    voltageDifference: isFinite(difference) ? difference.toFixed(0) : 'N/A',
    isAcceptable,
    severity,
    recommendation: isAcceptable
      ? '✅ Diferencia aceptable, no requiere acción adicional'
      : `⚠️ Diferencia elevada (${isFinite(difference) ? difference.toFixed(0) : 'N/A'} V) - Severidad: ${severity}. Se requiere conductor de enlace equipotencial ${cableSize}`,
    cableSize,
    distance: isFinite(distance) ? distance.toFixed(1) : 'N/A'
  };
};

/**
 * Calcula la distancia segura para un GPR dado
 * @param {number} GPR - Ground Potential Rise (V)
 * @param {number} soilResistivity - Resistividad del suelo (Ω·m)
 * @param {number} maxVoltage - Tensión máxima permitida (V), default 500V
 * @returns {object} Distancia segura calculada
 */
export const calculateSafeDistance = (GPR, soilResistivity = 100, maxVoltage = 500) => {
  if (!GPR || GPR <= 0) {
    return { safeDistance: 0, message: 'No hay datos de GPR' };
  }
  
  const alpha = calculateAttenuationConstant(soilResistivity);
  // Despejar distancia de la fórmula: V = GPR × e^(-α·d)
  // d = -ln(V/GPR) / α
  const ratio = maxVoltage / GPR;
  
  if (ratio <= 0 || ratio >= 1) {
    return {
      safeDistance: 0,
      message: ratio >= 1 ? 'El GPR ya es seguro dentro de la malla' : 'No se puede calcular distancia segura'
    };
  }
  
  const safeDistance = -Math.log(ratio) / alpha;
  
  return {
    safeDistance: isFinite(safeDistance) ? safeDistance.toFixed(1) : 'N/A',
    GPR: isFinite(GPR) ? GPR.toFixed(0) : 'N/A',
    maxVoltage,
    soilResistivity,
    message: isFinite(safeDistance) && safeDistance > 0
      ? `Para limitar la tensión transferida a ${maxVoltage} V, mantener distancia mínima de ${isFinite(safeDistance) ? safeDistance.toFixed(1) : 'N/A'} m`
      : `El GPR de ${isFinite(GPR) ? GPR.toFixed(0) : 'N/A'} V ya es seguro dentro de la malla`
  };
};

/**
 * Genera tabla de tensiones transferidas para diferentes distancias
 * @param {number} GPR - Ground Potential Rise (V)
 * @param {number} soilResistivity - Resistividad del suelo (Ω·m)
 * @returns {Array} Tabla de tensiones por distancia
 */
export const getTransferTable = (GPR, soilResistivity = 100) => {
  const distances = [0, 1, 2, 5, 10, 15, 20, 30, 50, 100];
  const table = [];
  
  for (const distance of distances) {
    const result = calculateTransferredVoltage(GPR, distance, soilResistivity);
    table.push({
      distance,
      voltage: parseInt(result.theoreticalVoltage),
      practicalVoltage: parseInt(result.practicalVoltage),
      risk: result.risk,
      attenuation: parseFloat(result.attenuation)
    });
  }
  
  return table;
};

export default { 
  calculateTransferredVoltage, 
  checkEquipotentialBonding,
  calculateSafeDistance,
  calculateAttenuationConstant,
  getTransferTable
};