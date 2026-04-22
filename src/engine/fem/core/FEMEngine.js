// src/engine/fem/core/FEMEngine.js
// Engine FEM industrial principal

import Delaunay2D from '../mesh/Delaunay2D.js';
import AdaptiveRefinement from '../mesh/AdaptiveRefinement.js';
import SparseMatrix from './SparseMatrix.js';
import ConjugateGradientSolver from '../solver/ConjugateGradientSolver.js';
import GMRESSolver from '../solver/GMRESSolver.js';
import MultiLayerSoil from '../physics/MultiLayerSoil.js';
import IEEE80Metrics from '../postprocess/IEEE80Metrics.js';
import ComplianceEngine from '../../standards/ComplianceEngine.js';

export class FEMEngine {
  constructor(options = {}) {
    this.solverType = options.solverType || 'cg'; // 'cg' o 'gmres'
    this.maxIterations = options.maxIterations || 1000;
    this.tolerance = options.tolerance || 1e-8;
    this.refinementLevel = options.refinementLevel || 2;
    this.verbose = options.verbose || false;
  }

  /**
   * Ejecuta simulación FEM completa
   */
  async solve(project) {
    const startTime = performance.now();
    
    if (this.verbose) console.log('🔹 Iniciando simulación FEM industrial...');
    
    // 1. Generar puntos semilla
    const seedPoints = this.generateSeedPoints(project);
    if (this.verbose) console.log(`   ${seedPoints.length} puntos semilla generados`);
    
    // 2. Triangulación de Delaunay
    const delaunay = new Delaunay2D(seedPoints);
    let triangles = delaunay.triangulate();
    if (this.verbose) console.log(`   Malla inicial: ${triangles.length} triángulos`);
    
    // 3. Refinamiento adaptativo
    const adaptiveRefinement = new AdaptiveRefinement({ triangles, nodes: seedPoints }, {
      refineNearConductors: true,
      refineNearFaults: true,
      minEdgeLength: 0.1,
      maxEdgeLength: 2.0
    });
    
    const refinedMesh = adaptiveRefinement.refine();
    if (this.verbose) console.log(`   Malla refinada: ${refinedMesh.triangles.length} triángulos`);
    
    // 4. Configurar modelo de suelo multicapa
    const soilModel = new MultiLayerSoil();
    soilModel.setupFromIEEE80(
      project.soil.resistivity,
      project.soil.surfaceResistivity,
      project.soil.surfaceDepth
    );
    
    // 5. Ensamblar matriz de rigidez
    const K = new SparseMatrix(refinedMesh.nodes.length);
    const F = new Array(refinedMesh.nodes.length).fill(0);
    
    this.assembleSystem(K, F, refinedMesh, soilModel, project);
    if (this.verbose) console.log(`   Sistema ensamblado: ${K.nnz} elementos no cero`);
    
    // 6. Aplicar condiciones de borde
    this.applyBoundaryConditions(K, F, refinedMesh, project);
    
    // 7. Resolver sistema lineal
    const solver = this.solverType === 'cg' 
      ? new ConjugateGradientSolver({ maxIterations: this.maxIterations, tolerance: this.tolerance, verbose: this.verbose })
      : new GMRESSolver({ maxIterations: this.maxIterations, tolerance: this.tolerance, verbose: this.verbose });
    
    const result = solver.solve(K, F);
    
    if (!result.converged && this.verbose) {
      console.warn(`⚠️ Solver no convergió después de ${result.iterations} iteraciones`);
    }
    
    // 8. Calcular métricas IEEE 80
    const metrics = new IEEE80Metrics(result.solution, refinedMesh, project);
    const ieeeMetrics = metrics.compute();
    
    // 9. Validación normativa (NOM-001-SEDE-2012 y CFE)
    const complianceEngine = new ComplianceEngine({
      standards: ['NOM-001', 'CFE'],
      verbose: this.verbose
    });
    
    const projectContext = {
      faultDuration: project.scenarios[0]?.duration || 0.5,
      faultCurrent: project.scenarios[0]?.current || 5000,
      soil: project.soil,
      voltageLevel: project.voltageLevel || 13200,
      installationType: project.installationType || 'industrial',
      engineerName: project.engineerName
    };
    
    const compliance = complianceEngine.validate(ieeeMetrics, projectContext);
    
    const endTime = performance.now();
    
    if (this.verbose) {
      console.log(`✅ Simulación completada en ${(endTime - startTime).toFixed(2)} ms`);
      console.log(`   Rg = ${ieeeMetrics.groundResistance.toFixed(3)} Ω`);
      console.log(`   Cumple IEEE 80: ${ieeeMetrics.compliance.complies ? '✓' : '✗'}`);
      console.log(`   Cumple NOM-001: ${compliance.standards.NOM001?.compliant ? '✓' : '✗'}`);
      console.log(`   Cumple CFE: ${compliance.standards.CFE?.compliant ? '✓' : '✗'}`);
    }
    
    return {
      voltageField: result.solution,
      mesh: refinedMesh,
      metrics: ieeeMetrics,
      compliance,
      solverInfo: {
        iterations: result.iterations,
        executionTime: result.executionTime,
        converged: result.converged
      },
      totalTime: endTime - startTime
    };
  }

  /**
   * Genera puntos semilla para la malla
   */
  generateSeedPoints(project) {
    const points = [];
    const { length = 10, width = 10, nx = 8, ny = 8 } = project.grid || {};
    
    const dx = length / Math.max(1, nx);
    const dy = width / Math.max(1, ny);
    
    // Puntos de la malla conductora
    for (let i = 0; i <= nx; i++) {
      for (let j = 0; j <= ny; j++) {
        points.push({ x: i * dx, y: j * dy });
      }
    }
    
    // Puntos adicionales para mejor resolución
    const extraPoints = 50;
    for (let k = 0; k < extraPoints; k++) {
      points.push({
        x: Math.random() * length,
        y: Math.random() * width
      });
    }
    
    // Puntos cerca del punto de falla
    const faultX = length / 2;
    const faultY = width / 2;
    for (let k = 0; k < 20; k++) {
      points.push({
        x: faultX + (Math.random() - 0.5) * 2,
        y: faultY + (Math.random() - 0.5) * 2
      });
    }
    
    return points;
  }

  /**
   * Ensambla el sistema matricial
   */
  assembleSystem(K, F, mesh, soilModel, project) {
    for (const triangle of mesh.triangles) {
      const [v1, v2, v3] = triangle.vertices;
      const idx1 = this.findNodeIndex(mesh.nodes, v1);
      const idx2 = this.findNodeIndex(mesh.nodes, v2);
      const idx3 = this.findNodeIndex(mesh.nodes, v3);
      
      if (idx1 < 0 || idx2 < 0 || idx3 < 0) continue;
      
      // Conductividad promedio del elemento
      const sigma = (
        soilModel.getConductivity(v1.x, v1.y) +
        soilModel.getConductivity(v2.x, v2.y) +
        soilModel.getConductivity(v3.x, v3.y)
      ) / 3;
      
      // Calcular matriz elemental Ke
      const Ke = this.computeElementMatrix(v1, v2, v3, sigma);
      
      // Agregar a matriz global
      const indices = [idx1, idx2, idx3];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          K.add(indices[i], indices[j], Ke[i][j]);
        }
      }
    }
  }

  /**
   * Calcula matriz elemental para triángulo
   */
  computeElementMatrix(p1, p2, p3, sigma) {
    const area = this.triangleArea(p1, p2, p3);
    const B = this.computeGradientMatrix(p1, p2, p3, area);
    
    // Ke = sigma * area * (B^T * B)
    const BtB = this.multiplyMatricesTransposed(B);
    return this.multiplyScalar(BtB, sigma * area);
  }

  /**
   * Calcula matriz de gradientes B
   */
  computeGradientMatrix(p1, p2, p3, area) {
    const b1 = p2.y - p3.y;
    const b2 = p3.y - p1.y;
    const b3 = p1.y - p2.y;
    
    const c1 = p3.x - p2.x;
    const c2 = p1.x - p3.x;
    const c3 = p2.x - p1.x;
    
    const twoA = Math.max(1e-10, 2 * area);
    
    return [
      [b1 / twoA, b2 / twoA, b3 / twoA],
      [c1 / twoA, c2 / twoA, c3 / twoA]
    ];
  }

  /**
   * Calcula B^T * B
   */
  multiplyMatricesTransposed(B) {
    const result = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        result[i][j] = B[0][i] * B[0][j] + B[1][i] * B[1][j];
      }
    }
    
    return result;
  }

  /**
   * Multiplica matriz por escalar
   */
  multiplyScalar(matrix, scalar) {
    const result = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        result[i][j] = matrix[i][j] * scalar;
      }
    }
    return result;
  }

  /**
   * Aplica condiciones de borde
   */
  applyBoundaryConditions(K, F, mesh, project) {
    const { length = 10, width = 10 } = project.grid || {};
    const tolerance = 0.01;
    
    for (let i = 0; i < mesh.nodes.length; i++) {
      const node = mesh.nodes[i];
      
      // Borde del dominio (tierra infinita)
      const isBoundary = 
        node.x < tolerance || 
        node.x > length - tolerance ||
        node.y < tolerance || 
        node.y > width - tolerance;
      
      if (isBoundary) {
        const value = K.applyDirichlet(i, 0);
        F[i] = value;
      }
    }
    
    // Punto de inyección de corriente (falla)
    const faultX = (length || 10) / 2;
    const faultY = (width || 10) / 2;
    let minDist = Infinity;
    let faultNode = -1;
    
    for (let i = 0; i < mesh.nodes.length; i++) {
      const node = mesh.nodes[i];
      const dist = Math.hypot(node.x - faultX, node.y - faultY);
      if (dist < minDist) {
        minDist = dist;
        faultNode = i;
      }
    }
    
    if (faultNode >= 0) {
      const Ig = project.scenarios?.[0]?.Ig || 1000;
      F[faultNode] += Ig;
    }
  }

  /**
   * Calcula área de triángulo
   */
  triangleArea(p1, p2, p3) {
    const area = Math.abs((p2.x - p1.x) * (p3.y - p1.y) - 
                          (p3.x - p1.x) * (p2.y - p1.y)) / 2;
    return Math.max(1e-10, area);
  }

  /**
   * Encuentra índice de nodo
   */
  findNodeIndex(nodes, target) {
    const tolerance = 1e-6;
    return nodes.findIndex(node => 
      Math.abs(node.x - target.x) < tolerance && 
      Math.abs(node.y - target.y) < tolerance
    );
  }
}

export default FEMEngine;
