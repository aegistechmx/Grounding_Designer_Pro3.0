// src/engine/autodesign/generators/CandidateGenerator.js
// Generador inteligente de diseños candidatos

export class CandidateGenerator {
  constructor(domain, options = {}) {
    this.domain = domain;
    this.populationSize = options.populationSize || 50;
    this.useHeuristics = options.useHeuristics !== false;
  }

  /**
   * Genera población inicial de diseños
   */
  generateInitialPopulation() {
    const population = [];
    
    for (let i = 0; i < this.populationSize; i++) {
      const candidate = this.generateRandomCandidate();
      population.push(candidate);
    }
    
    // Agregar diseños heurísticos (basados en experiencia)
    if (this.useHeuristics) {
      const heuristicDesigns = this.generateHeuristicDesigns();
      population.push(...heuristicDesigns);
    }
    
    return population;
  }

  /**
   * Genera diseño aleatorio dentro de dominio
   */
  generateRandomCandidate() {
    const { grid, soil, fault } = this.domain;
    
    return {
      id: `cand_${Date.now()}_${Math.random()}`,
      
      // Geometría de malla
      gridLength: this.randomInRange(grid.length?.min || 8, grid.length?.max || 20),
      gridWidth: this.randomInRange(grid.width?.min || 6, grid.width?.max || 15),
      gridDepth: this.randomInRange(grid.depth?.min || 0.4, grid.depth?.max || 1.0),
      
      // Conductores
      numParallelX: Math.floor(this.randomInRange(4, 20)),
      numParallelY: Math.floor(this.randomInRange(4, 20)),
      
      // Varillas
      numRods: Math.floor(this.randomInRange(4, 40)),
      rodLength: this.randomInRange(2, 4.5),
      
      // Materiales
      conductorMaterial: this.randomChoice(['copper', 'aluminum']),
      conductorSize: this.randomChoice(['2/0', '3/0', '4/0', '250kcmil']),
      
      // Capa superficial
      surfaceDepth: this.randomInRange(0.1, 0.3),
      surfaceResistivity: this.randomChoice([3000, 5000, 10000]),
      
      metadata: {
        generatedAt: new Date().toISOString(),
        generationMethod: 'random'
      }
    };
  }

  /**
   * Genera diseños basados en heurísticas de ingeniería
   */
  generateHeuristicDesigns() {
    const designs = [];
    const { soil, fault } = this.domain;
    
    // Diseño 1: Conservador (máxima seguridad)
    designs.push({
      id: 'heuristic_conservative',
      gridLength: 15, gridWidth: 10, gridDepth: 0.8,
      numParallelX: 12, numParallelY: 12,
      numRods: 24, rodLength: 3.5,
      conductorMaterial: 'copper', conductorSize: '4/0',
      surfaceDepth: 0.2, surfaceResistivity: 10000,
      metadata: { generationMethod: 'heuristic', type: 'conservative' }
    });
    
    // Diseño 2: Económico (menor costo)
    designs.push({
      id: 'heuristic_economic',
      gridLength: 10, gridWidth: 8, gridDepth: 0.5,
      numParallelX: 6, numParallelY: 6,
      numRods: 12, rodLength: 2.5,
      conductorMaterial: 'aluminum', conductorSize: '2/0',
      surfaceDepth: 0.1, surfaceResistivity: 3000,
      metadata: { generationMethod: 'heuristic', type: 'economic' }
    });
    
    // Diseño 3: Balanceado
    designs.push({
      id: 'heuristic_balanced',
      gridLength: 12.5, gridWidth: 8, gridDepth: 0.6,
      numParallelX: 8, numParallelY: 8,
      numRods: 16, rodLength: 3,
      conductorMaterial: 'copper', conductorSize: '3/0',
      surfaceDepth: 0.15, surfaceResistivity: 5000,
      metadata: { generationMethod: 'heuristic', type: 'balanced' }
    });
    
    return designs;
  }

  /**
   * Genera variaciones de un diseño (mutación)
   */
  mutate(candidate, mutationRate = 0.3) {
    const mutated = { ...candidate, id: `${candidate.id}_mutated_${Date.now()}` };
    
    if (Math.random() < mutationRate) {
      mutated.numParallelX = this.mutateValue(
        candidate.numParallelX, 4, 20, Math.floor
      );
    }
    
    if (Math.random() < mutationRate) {
      mutated.numParallelY = this.mutateValue(
        candidate.numParallelY, 4, 20, Math.floor
      );
    }
    
    if (Math.random() < mutationRate) {
      mutated.numRods = this.mutateValue(candidate.numRods, 4, 40, Math.floor);
    }
    
    if (Math.random() < mutationRate) {
      mutated.rodLength = this.mutateValue(candidate.rodLength, 2, 4.5);
    }
    
    if (Math.random() < mutationRate) {
      mutated.gridDepth = this.mutateValue(candidate.gridDepth, 0.4, 1.0);
    }
    
    mutated.metadata = {
      ...candidate.metadata,
      mutatedFrom: candidate.id,
      mutatedAt: new Date().toISOString()
    };
    
    return mutated;
  }

  /**
   * Cruza dos diseños padres
   */
  crossover(parent1, parent2) {
    const child = {
      id: `crossover_${Date.now()}_${Math.random()}`,
      
      gridLength: this.crossoverValue(parent1.gridLength, parent2.gridLength),
      gridWidth: this.crossoverValue(parent1.gridWidth, parent2.gridWidth),
      gridDepth: this.crossoverValue(parent1.gridDepth, parent2.gridDepth),
      
      numParallelX: this.crossoverInt(parent1.numParallelX, parent2.numParallelX),
      numParallelY: this.crossoverInt(parent1.numParallelY, parent2.numParallelY),
      
      numRods: this.crossoverInt(parent1.numRods, parent2.numRods),
      rodLength: this.crossoverValue(parent1.rodLength, parent2.rodLength),
      
      conductorMaterial: Math.random() < 0.5 ? parent1.conductorMaterial : parent2.conductorMaterial,
      conductorSize: Math.random() < 0.5 ? parent1.conductorSize : parent2.conductorSize,
      
      surfaceDepth: this.crossoverValue(parent1.surfaceDepth, parent2.surfaceDepth),
      surfaceResistivity: this.crossoverValue(parent1.surfaceResistivity, parent2.surfaceResistivity),
      
      metadata: {
        generatedAt: new Date().toISOString(),
        generationMethod: 'crossover',
        parents: [parent1.id, parent2.id]
      }
    };
    
    return child;
  }

  /**
   * Valor aleatorio en rango
   */
  randomInRange(min, max) {
    return min + Math.random() * (max - min);
  }

  /**
   * Selección aleatoria de un elemento
   */
  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Mutación de valor
   */
  mutateValue(value, min, max, round = false) {
    const delta = (max - min) * 0.2 * (Math.random() - 0.5);
    let newValue = value + delta;
    newValue = Math.max(min, Math.min(max, newValue));
    return round ? Math.round(newValue) : newValue;
  }

  /**
   * Cruce de enteros
   */
  crossoverInt(a, b) {
    return Math.round(this.crossoverValue(a, b));
  }

  /**
   * Cruce de valores reales (BLX-alpha)
   */
  crossoverValue(a, b, alpha = 0.5) {
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    const range = (max - min) * alpha;
    return min - range + Math.random() * (max - min + 2 * range);
  }
}

export default CandidateGenerator;
