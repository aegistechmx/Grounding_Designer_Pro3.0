/**
 * Cálculo de corriente de falla basado en datos del transformador
 * Según IEEE 141 / ANSI C37
 */

export const calculateFaultCurrent = (transformerKVA, secondaryVoltage, impedance, connectionType = 'DYn11') => {
  // Validar parámetros para evitar división por cero
  const voltageSafe = Math.max(1, secondaryVoltage || 480);
  const impedanceSafe = Math.max(1, impedance || 5);
  
  // 1. Corriente nominal del transformador
  const In = (transformerKVA * 1000) / (Math.sqrt(3) * voltageSafe);
  
  // 2. Corriente de cortocircuito simétrica
  const Icc = (In * 100) / impedanceSafe;
  
  // 3. Factor de asimetría (según tiempo de despeje)
  const asymmetryFactor = 1.1;
  const IccAsym = Icc * asymmetryFactor;
  
  // 4. Factor de contribución de motores (típico 1.05-1.2)
  const motorContribution = 1.05;
  const totalFault = IccAsym * motorContribution;
  
  // 5. Valores típicos para redondear
  const roundTo = totalFault > 1000 ? 100 : 50;
  const recommendedValue = Math.ceil(totalFault / roundTo) * roundTo;
  
  return {
    nominalCurrent: In,
    symmetricalIcc: Icc,
    asymmetricalIcc: IccAsym,
    totalFaultCurrent: totalFault,
    recommendedValue: recommendedValue,
    formula: `If = (kVA × 1000) / (√3 × V × %Z)` 
  };
};

export const getTypicalFaultCurrent = (transformerKVA, secondaryVoltage = 480) => {
  const typicalValues = {
    75: { 220: 450, 440: 225, 480: 200 },
    112.5: { 220: 680, 440: 340, 480: 300 },
    150: { 220: 900, 440: 450, 480: 400 },
    225: { 220: 1350, 440: 680, 480: 600 },
    300: { 220: 1800, 440: 900, 480: 800 },
    500: { 220: 3000, 440: 1500, 480: 1350 },
    750: { 220: 4500, 440: 2250, 480: 2000 },
    1000: { 220: 6000, 440: 3000, 480: 2700 }
  };
  
  return typicalValues[transformerKVA]?.[secondaryVoltage] || 0;
};

export default { calculateFaultCurrent, getTypicalFaultCurrent };
