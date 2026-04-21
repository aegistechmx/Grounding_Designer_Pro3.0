/**
 * Solver de campo eléctrico para heatmap realista
 * Calcula la distribución de potencial en la malla
 */

export const solvePotentialField = (nodes, rods, faultCurrent = 1000, soilResistivity = 100) => {
  const results = [];
  const ñ = Math.max(1, soilResistivity);
  const I = Math.max(1, faultCurrent);
  
  // Constante de atenuación
  const attenuation = ñ / (2 * Math.PI);
  
  for (const node of nodes) {
    let V = 0;
    
    // Contribución de cada varilla (electrodo puntual)
    for (const rod of rods) {
      const dx = node.x - rod.x;
      const dy = node.y - rod.y;
      const distance = Math.sqrt(dx * dx + dy * dy) + 0.1; // evitar división por cero
      
      // Potencial de punto fuente (modelo de imagen)
      const contribution = (I * attenuation) / distance;
      V += contribution;
    }
    
    // Atenuación por distancia a la malla
    const isNearMesh = Math.abs(node.x) < 15 && Math.abs(node.y) < 15;
    const meshFactor = isNearMesh ? 1 : Math.exp(-Math.sqrt(node.x * node.x + node.y * node.y) / 20);
    
    V = V * meshFactor;
    
    results.push({
      ...node,
      potential: Math.max(0, Math.min(5000, V))
    });
  }
  
  return results;
};

export const solvePotentialAtPoint = (x, y, rods, faultCurrent = 1000, soilResistivity = 100) => {
  const ñ = Math.max(1, soilResistivity);
  const I = Math.max(1, faultCurrent);
  const attenuation = ñ / (2 * Math.PI);
  
  let V = 0;
  for (const rod of rods) {
    const dx = x - rod.x;
    const dy = y - rod.y;
    const distance = Math.sqrt(dx * dx + dy * dy) + 0.1;
    V += (I * attenuation) / distance;
  }
  
  return V;
};

export const calculateRodInfluence = (rods, gridSize = 20) => {
  const influenceMap = [];
  const step = gridSize / 20;
  
  for (let i = 0; i <= 20; i++) {
    const row = [];
    const x = i * step - gridSize / 2;
    for (let j = 0; j <= 20; j++) {
      const y = j * step - gridSize / 2;
      let totalInfluence = 0;
      
      for (const rod of rods) {
        const dx = x - rod.x;
        const dy = y - rod.y;
        const distance = Math.sqrt(dx * dx + dy * dy) + 0.5;
        totalInfluence += 1 / distance;
      }
      
      row.push(totalInfluence);
    }
    influenceMap.push(row);
  }
  
  return influenceMap;
};

export const solveResistanceMatrix = (nodes, conductors, soilResistivity) => {
  // Matriz de admitancias para cálculo de resistencia equivalente
  const n = nodes.length;
  const conductance = Array(n).fill().map(() => Array(n).fill(0));
  
  // Construir matriz de conductancia
  for (const cond of conductors) {
    const fromIdx = nodes.findIndex(n => n.id === cond.from);
    const toIdx = nodes.findIndex(n => n.id === cond.to);
    const length = cond.length;
    const area = 0.0001; // Área de sección transversal del conductor
    const resistivity = 1.724e-8; // Resistividad del cobre
    
    const G = area / (resistivity * length);
    conductance[fromIdx][toIdx] += G;
    conductance[toIdx][fromIdx] += G;
    conductance[fromIdx][fromIdx] += G;
    conductance[toIdx][toIdx] += G;
  }
  
  // Añadir conductancia a tierra (por varillas)
  const groundConductance = 1 / (soilResistivity * 10); // Simplificado
  
  for (let i = 0; i < n; i++) {
    conductance[i][i] += groundConductance;
  }
  
  return conductance;
};

export default {
  solvePotentialField,
  solvePotentialAtPoint,
  calculateRodInfluence,
  solveResistanceMatrix
};
