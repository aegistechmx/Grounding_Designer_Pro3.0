// src/engine/autodesign/optimizers/NSGAIIOptimizer.js
// Optimizador NSGA-II con restricciones normativas

import CandidateGenerator from '../generators/CandidateGenerator.js';
import ObjectiveFunction from '../objective/ObjectiveFunction.js';

export class NSGAIIOptimizer {
  constructor(domain, femEngine, complianceEngine, options = {}) {
    this.domain = domain;
    this.femEngine = femEngine;
    this.complianceEngine = complianceEngine;
    this.generator = new CandidateGenerator(domain, options);
    this.objective = new ObjectiveFunction(options.weights);
    
    this.populationSize = options.populationSize || 50;
    this.generations = options.generations || 30;
    this.crossoverProb = options.crossoverProb || 0.9;
    this.mutationProb = options.mutationProb || 0.1;
    this.verbose = options.verbose || false;
  }

  /**
   * Ejecuta optimización completa
   */
  async optimize() {
    const startTime = performance.now();
    
    if (this.verbose) {
      console.log('🚀 Iniciando optimización NSGA-II normativa');
      console.log(`   Población: ${this.populationSize}`);
      console.log(`   Generaciones: ${this.generations}`);
    }
    
    // 1. Generar población inicial
    let population = this.generator.generateInitialPopulation();
    
    // 2. Evaluar población inicial
    let evaluated = await this.evaluatePopulation(population);
    
    let bestSolution = null;
    let bestFitness = -Infinity;
    
    // 3. Loop de optimización
    for (let gen = 0; gen < this.generations; gen++) {
      // Ordenamiento no dominado
      const { fronts, ranks } = this.nonDominatedSort(evaluated);
      
      // Calcular crowding distance
      for (const front of fronts) {
        this.crowdingDistance(front);
      }
      
      // Selección
      const selected = this.tournamentSelection(evaluated, this.populationSize);
      
      // Generar descendencia
      const offspring = await this.generateOffspring(selected);
      
      // Evaluar descendencia
      const evaluatedOffspring = await this.evaluatePopulation(offspring);
      
      // Combinar y truncar
      const combined = [...evaluated, ...evaluatedOffspring];
      const { fronts: newFronts } = this.nonDominatedSort(combined);
      
      const newPopulation = [];
      for (const front of newFronts) {
        front.sort((a, b) => b.crowdingDistance - a.crowdingDistance);
        for (const individual of front) {
          if (newPopulation.length < this.populationSize) {
            newPopulation.push(individual);
          } else break;
        }
        if (newPopulation.length >= this.populationSize) break;
      }
      
      evaluated = newPopulation;
      
      // Actualizar mejor solución
      const currentBest = evaluated.reduce((best, curr) => 
        curr.fitness.fitness > best.fitness.fitness ? curr : best, evaluated[0]);
      
      if (currentBest.fitness.fitness > bestFitness) {
        bestFitness = currentBest.fitness.fitness;
        bestSolution = currentBest;
      }
      
      if (this.verbose && gen % 5 === 0) {
        const validCount = evaluated.filter(e => e.fitness.meetsStandards).length;
        console.log(`   Gen ${gen}: mejor fitness = ${bestFitness.toFixed(4)}, válidos = ${validCount}/${evaluated.length}`);
      }
    }
    
    const endTime = performance.now();
    
    if (this.verbose) {
      console.log(`✅ Optimización completada en ${(endTime - startTime).toFixed(2)} ms`);
      console.log(`   Mejor fitness: ${bestFitness.toFixed(4)}`);
      console.log(`   Cumple normas: ${bestSolution?.fitness.meetsStandards ? '✓' : '✗'}`);
    }
    
    return {
      bestSolution: bestSolution?.design,
      bestFitness,
      allSolutions: evaluated,
      generations: this.generations,
      executionTime: endTime - startTime
    };
  }

  /**
   * Evalúa población completa
   */
  async evaluatePopulation(population) {
    const evaluated = [];
    
    for (const design of population) {
      const evaluation = await this.evaluateDesign(design);
      evaluated.push(evaluation);
    }
    
    return evaluated;
  }

  /**
   * Evalúa un diseño individual
   */
  async evaluateDesign(design) {
    try {
      // 1. Ejecutar simulación FEM
      const project = this.buildProjectFromDesign(design);
      const simulation = await this.femEngine.solve(project);
      
      // 2. Validación normativa
      const compliance = this.complianceEngine.validate(simulation, {
        voltageLevel: this.domain.voltageLevel || 13200,
        faultDuration: this.domain.fault?.duration || 0.5,
        soil: project.soil
      });
      
      // 3. Calcular fitness
      const fitness = this.objective.evaluate(design, simulation, compliance);
      
      return {
        design,
        simulation,
        compliance,
        fitness,
        cost: this.computeCost(design)
      };
    } catch (error) {
      console.warn(`Error evaluando diseño: ${error.message}`);
      return {
        design,
        fitness: { fitness: 0, meetsStandards: false, penalty: 1 },
        error: error.message
      };
    }
  }

  /**
   * Construye proyecto a partir de diseño
   */
  buildProjectFromDesign(design) {
    return {
      name: `AutoDesign_${design.id}`,
      grid: {
        length: design.gridLength,
        width: design.gridWidth,
        depth: design.gridDepth,
        nx: design.numParallelX,
        ny: design.numParallelY,
        rodLength: design.rodLength,
        numRods: design.numRods
      },
      soil: {
        resistivity: this.domain.soil.resistivity,
        surfaceResistivity: design.surfaceResistivity,
        surfaceDepth: design.surfaceDepth,
        moisture: this.domain.soil.moisture || 0.25
      },
      scenarios: [{
        current: this.domain.fault?.current || 5000,
        duration: this.domain.fault?.duration || 0.35,
        divisionFactor: this.domain.fault?.divisionFactor || 0.15
      }],
      voltageLevel: this.domain.voltageLevel || 13200
    };
  }

  /**
   * Genera descendencia
   */
  async generateOffspring(population) {
    const offspring = [];
    
    while (offspring.length < this.populationSize) {
      const parent1 = population[Math.floor(Math.random() * population.length)];
      const parent2 = population[Math.floor(Math.random() * population.length)];
      
      let child;
      if (Math.random() < this.crossoverProb) {
        child = this.generator.crossover(parent1.design, parent2.design);
      } else {
        child = { ...parent1.design };
      }
      
      if (Math.random() < this.mutationProb) {
        child = this.generator.mutate(child);
      }
      
      offspring.push(child);
    }
    
    return offspring;
  }

  /**
   * Ordenamiento no dominado
   */
  nonDominatedSort(population) {
    const n = population.length;
    const dominationCount = new Array(n).fill(0);
    const dominatedIndices = Array.from({ length: n }, () => []);
    const fronts = [];
    const ranks = new Array(n).fill(0);
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        
        const f1 = population[i].fitness;
        const f2 = population[j].fitness;
        
        const dominates = f1.cost <= f2.cost && 
                         f1.safety >= f2.safety && 
                         f1.resistance <= f2.resistance &&
                         (f1.cost < f2.cost || f1.safety > f2.safety || f1.resistance < f2.resistance);
        
        if (dominates) {
          dominatedIndices[i].push(j);
        } else {
          const dominatedBy = f2.cost <= f1.cost && 
                              f2.safety >= f1.safety && 
                              f2.resistance <= f1.resistance &&
                              (f2.cost < f1.cost || f2.safety > f1.safety || f2.resistance < f1.resistance);
          if (dominatedBy) dominationCount[i]++;
        }
      }
    }
    
    let currentFront = [];
    for (let i = 0; i < n; i++) {
      if (dominationCount[i] === 0) {
        currentFront.push(population[i]);
        ranks[i] = 0;
      }
    }
    fronts.push(currentFront);
    
    let frontIndex = 0;
    let currentIndices = currentFront.map(ind => population.indexOf(ind));
    
    while (currentIndices.length > 0) {
      const nextIndices = [];
      for (const i of currentIndices) {
        for (const j of dominatedIndices[i]) {
          dominationCount[j]--;
          if (dominationCount[j] === 0) {
            ranks[j] = frontIndex + 1;
            nextIndices.push(j);
          }
        }
      }
      frontIndex++;
      currentIndices = nextIndices;
      if (currentIndices.length > 0) {
        fronts.push(currentIndices.map(i => population[i]));
      }
    }
    
    return { fronts, ranks };
  }

  /**
   * Calcula crowding distance
   */
  crowdingDistance(front) {
    if (front.length < 3) return;
    
    for (const ind of front) {
      ind.crowdingDistance = 0;
    }
    
    const objectives = ['cost', 'safety', 'resistance'];
    
    for (const obj of objectives) {
      front.sort((a, b) => a.fitness[obj] - b.fitness[obj]);
      
      front[0].crowdingDistance = Infinity;
      front[front.length - 1].crowdingDistance = Infinity;
      
      const range = front[front.length - 1].fitness[obj] - front[0].fitness[obj];
      if (range === 0) continue;
      
      for (let i = 1; i < front.length - 1; i++) {
        front[i].crowdingDistance += (front[i + 1].fitness[obj] - front[i - 1].fitness[obj]) / range;
      }
    }
  }

  /**
   * Selección por torneo
   */
  tournamentSelection(population, size) {
    const selected = [];
    
    while (selected.length < size) {
      const a = population[Math.floor(Math.random() * population.length)];
      const b = population[Math.floor(Math.random() * population.length)];
      
      const better = this.isBetter(a, b) ? a : b;
      selected.push(better);
    }
    
    return selected;
  }

  /**
   * Compara dos individuos
   */
  isBetter(a, b) {
    if (a.fitness.fitness !== b.fitness.fitness) {
      return a.fitness.fitness > b.fitness.fitness;
    }
    return (a.crowdingDistance || 0) > (b.crowdingDistance || 0);
  }

  /**
   * Calcula costo del diseño
   */
  computeCost(design) {
    const conductorLength = 2 * (design.gridLength + design.gridWidth) * 
                           Math.max(design.numParallelX, design.numParallelY);
    const conductorCost = conductorLength * (design.conductorMaterial === 'copper' ? 12 : 8);
    const rodCost = design.numRods * 25 + design.rodLength * design.numRods * 8;
    const area = design.gridLength * design.gridWidth;
    const excavationCost = area * design.gridDepth * 15;
    const surfaceCost = area * design.surfaceDepth * 45;
    
    return conductorCost + rodCost + excavationCost + surfaceCost;
  }
}

export default NSGAIIOptimizer;
