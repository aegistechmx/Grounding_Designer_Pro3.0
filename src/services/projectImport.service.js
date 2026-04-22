// src/services/projectImport.service.js
// Importador de proyectos desde formato tabla

export const projectImportService = {
  /**
   * Importa proyecto desde el formato de tabla
   */
  importFromTable(tableData, projectName) {
    const project = {
      name: projectName,
      mainPanel: null,
      subPanels: [],
      circuits: [],
      feeders: []
    };
    
    // Extraer datos del tablero principal
    const mainPanelMatch = tableData.match(/Tablero\s+['"]([^'"]+)['"]\s+([^\s]+)/);
    if (mainPanelMatch) {
      project.mainPanel = {
        name: mainPanelMatch[1],
        model: mainPanelMatch[2],
        location: this.extractLocation(tableData),
        voltage: this.extractVoltage(tableData),
        mainBreaker: this.extractMainBreaker(tableData)
      };
    } else {
      // Try alternative patterns
      const altMatch = tableData.match(/([A-Z]+\d+[A-Z]+)/);
      if (altMatch) {
        project.mainPanel = {
          name: projectName,
          model: altMatch[1],
          location: this.extractLocation(tableData),
          voltage: this.extractVoltage(tableData),
          mainBreaker: this.extractMainBreaker(tableData)
        };
      }
    }
    
    // Extraer circuitos
    const circuits = this.extractCircuits(tableData);
    project.circuits = circuits;
    
    // Calcular totales
    project.totals = this.calculateTotals(circuits);
    
    return project;
  },
  
  extractLocation(tableData) {
    const match = tableData.match(/Ubicación:\s*([^\n]+)/i);
    return match ? match[1].trim() : 'No especificada';
  },
  
  extractVoltage(tableData) {
    const match = tableData.match(/Voltaje\s+(?:entre\s+)?Fases?:\s*(\d+)/i);
    return match ? Math.max(1, parseInt(match[1]) || 220) : 220;
  },
  
  extractMainBreaker(tableData) {
    const match = tableData.match(/Interruptor\s+Principal\s*(\d+)A/i);
    if (match) return Math.max(1, parseInt(match[1]) || 800);
    
    // Try to find the highest breaker size in the circuits
    const breakerMatch = tableData.match(/(\d+)A/g);
    if (breakerMatch) {
      const breakers = breakerMatch.map(b => Math.max(1, parseInt(b.replace('A', '')) || 0));
      return breakers.length > 0 ? Math.max(...breakers) : 800;
    }
    
    return 800;
  },
  
  extractCircuits(tableData) {
    const circuits = [];
    const lines = tableData.split('\n');
    
    // Patrón para identificar líneas de circuitos
    // Formato esperado: Nombre del circuito | Fases | Watts | Distancia | Breaker | Conductor
    const circuitPattern = /([A-Za-z0-9\-_]+)[\s|]+(\d+)[\s|]+(\d+)[\s|]+(\d+)[\s|]+(\d+)A?/;
    
    for (const line of lines) {
      const match = line.match(circuitPattern);
      if (match) {
        circuits.push({
          name: match[1].trim(),
          phases: [parseInt(match[2]), parseInt(match[3]), parseInt(match[4])],
          watts: this.extractWatts(line),
          distance: this.extractDistance(line),
          breakerSize: this.extractBreakerSize(line),
          conductor: this.extractConductor(line),
          type: this.extractCircuitType(line)
        });
      }
    }
    
    // Si no se encontraron circuitos con el patrón principal, intentar método alternativo
    if (circuits.length === 0) {
      return this.extractCircuitsAlternative(tableData);
    }
    
    return circuits;
  },
  
  extractCircuitsAlternative(tableData) {
    const circuits = [];
    const lines = tableData.split('\n');
    
    // Buscar líneas que parezca circuitos
    for (const line of lines) {
      // Buscar patrones como: "02IC 70A 17780W" o "02IC1 90A 23991W"
      const match = line.match(/([A-Za-z0-9\-_]+)\s*(\d+)A\s*(\d+)W/i);
      if (match) {
        circuits.push({
          name: match[1].trim(),
          phases: [0, 0, 0], // No disponible
          watts: parseInt(match[3]),
          distance: 0, // No disponible
          breakerSize: parseInt(match[2]),
          conductor: null,
          type: this.extractCircuitType(line)
        });
      }
    }
    
    return circuits;
  },
  
  extractWatts(line) {
    const match = line.match(/(\d{4,})\s*W/i);
    return match ? Math.max(0, parseInt(match[1]) || 0) : 0;
  },
  
  extractDistance(line) {
    const match = line.match(/(\d+(?:\.\d+)?)\s*m/i);
    return match ? Math.max(0, parseFloat(match[1]) || 0) : 0;
  },
  
  extractBreakerSize(line) {
    const match = line.match(/(\d+)\s*A/i);
    return match ? Math.max(0, parseInt(match[1]) || 0) : 0;
  },
  
  extractConductor(line) {
    const match = line.match(/(\d+(?:\/\d+)?)\s*\(([^)]+)\)/);
    if (match) {
      return { awg: match[1], mm2: match[2] };
    }
    return null;
  },
  
  extractCircuitType(line) {
    if (line.match(/motor/i)) return 'motor';
    if (line.match(/bomba/i)) return 'motor';
    if (line.match(/alberca/i)) return 'motor';
    if (line.match(/normal/i)) return 'normal';
    return 'other';
  },
  
  calculateTotals(circuits) {
    const totalWatts = circuits.reduce((sum, c) => sum + (c.watts || 0), 0);
    const totalCurrent = totalWatts / (220 * Math.sqrt(3) * 0.9);
    
    return {
      watts: totalWatts,
      current: totalCurrent,
      circuits: circuits.length
    };
  }
};
