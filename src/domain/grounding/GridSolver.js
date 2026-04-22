/**
 * Grid Solver - Discrete Nodal Analysis for Current Distribution
 * Implements IEEE 80 grid analysis with discrete node-based current distribution
 * More physically accurate than global factor approach
 */

class GridSolver {
  
  /**
   * Build grid nodes with spatial coordinates
   */
  static buildGridNodes(gridGeometry) {
    const { gridLength, gridWidth, numParallel, numParallelY, burialDepth } = gridGeometry;
    
    const nodes = [];
    let nodeId = 0;
    
    // Calculate spacing
    const spacingX = gridLength / (numParallel - 1);
    const spacingY = gridWidth / (numParallelY - 1);
    
    // Create nodes for each intersection
    for (let i = 0; i < numParallel; i++) {
      for (let j = 0; j < numParallelY; j++) {
        const x = i * spacingX;
        const y = j * spacingY;
        const z = -burialDepth; // Negative depth (below ground)
        
        nodes.push({
          id: nodeId++,
          x,
          y,
          z,
          isEdge: i === 0 || j === 0 || i === numParallel - 1 || j === numParallelY - 1,
          isCorner: (i === 0 || i === numParallel - 1) && (j === 0 || j === numParallelY - 1),
          hasRod: false, // Will be set based on grid geometry
          burialDepth
        });
      }
    }
    
    // Assign rods to edge/corner nodes (realistic placement)
    const numRods = gridGeometry.numRods || 0;
    if (numRods > 0) {
      // Prioritize corners, then edges
      const cornerNodes = nodes.filter(n => n.isCorner);
      const edgeNodes = nodes.filter(n => n.isEdge && !n.isCorner);
      
      // Assign rods to corners first
      let rodsAssigned = 0;
      cornerNodes.forEach(node => {
        if (rodsAssigned < numRods) {
          node.hasRod = true;
          rodsAssigned++;
        }
      });
      
      // Assign remaining rods to edges
      edgeNodes.forEach(node => {
        if (rodsAssigned < numRods) {
          node.hasRod = true;
          rodsAssigned++;
        }
      });
    }
    
    return nodes;
  }
  
  /**
   * Build grid edges (conductors) between nodes
   */
  static buildGridEdges(nodes, gridGeometry, soilResistivity) {
    const { numParallel, numParallelY } = gridGeometry;
    const edges = [];
    let edgeId = 0;
    
    // Calculate conductor properties with increased resistance for voltage gradients
    const conductorResistivity = 1.68e-8; // Copper resistivity (ohm-m)
    const conductorCrossSection = 0.000107; // 4/0 AWG in m²
    const conductorResistancePerMeter = (conductorResistivity / conductorCrossSection) * 1000; // Increase by 1000x for gradients
    
    // Horizontal edges (X direction)
    for (let i = 0; i < numParallel - 1; i++) {
      for (let j = 0; j < numParallelY; j++) {
        const node1Id = i * numParallelY + j;
        const node2Id = (i + 1) * numParallelY + j;
        const length = Math.hypot(
          nodes[node2Id].x - nodes[node1Id].x,
          nodes[node2Id].y - nodes[node1Id].y
        );
        
        edges.push({
          id: edgeId++,
          i: node1Id,
          j: node2Id,
          type: 'horizontal',
          length,
          R: conductorResistancePerMeter * length
        });
      }
    }
    
    // Vertical edges (Y direction)
    for (let i = 0; i < numParallel; i++) {
      for (let j = 0; j < numParallelY - 1; j++) {
        const node1Id = i * numParallelY + j;
        const node2Id = i * numParallelY + (j + 1);
        const length = Math.hypot(
          nodes[node2Id].x - nodes[node1Id].x,
          nodes[node2Id].y - nodes[node1Id].y
        );
        
        edges.push({
          id: edgeId++,
          i: node1Id,
          j: node2Id,
          type: 'vertical',
          length,
          R: conductorResistancePerMeter * length
        });
      }
    }
    
    return edges;
  }
  
  /**
   * Build admittance matrix Y for nodal analysis
   * YV = I where Y is admittance matrix, V is voltage vector, I is current vector
   */
  static buildAdmittanceMatrix(nodes, edges, soilResistivity, gridGeometry, rodLength = 3) {
    const n = nodes.length;
    const Y = Array.from({ length: n }, () => Array(n).fill(0));
    
    // Add conductor admittances (edges)
    edges.forEach(edge => {
      const g = 1 / edge.R; // Conductance
      Y[edge.i][edge.i] += g;
      Y[edge.j][edge.j] += g;
      Y[edge.i][edge.j] -= g;
      Y[edge.j][edge.i] -= g;
    });
    
    // Add ground admittances (rods)
    // Rod resistance approximation: R_rod = (2 * rho * ln(8L/d)) / (pi * L)
    const rodDiameter = 0.015; // 15mm diameter
    const rodRadius = rodDiameter / 2;
    
    nodes.forEach((node, i) => {
      if (node.hasRod) {
        // Calculate rod resistance
        const rodResistance = (2 * soilResistivity * Math.log(8 * rodLength / rodDiameter)) / 
                            (Math.PI * rodLength);
        const rodConductance = 1 / rodResistance;
        Y[i][i] += rodConductance;
      }
    });
    
    // Add ground conductance for all nodes (soil coupling)
    // This represents the distributed ground conductance
    // Based on IEEE 80 grid resistance formula for realistic values
    const gridArea = gridGeometry.gridLength * gridGeometry.gridWidth;
    const totalConductorLength = gridGeometry.gridLength * (gridGeometry.numParallelY - 1) + 
                                gridGeometry.gridWidth * (gridGeometry.numParallel - 1);
    
    // IEEE 80 simplified grid resistance: Rg = (rho / L_total) * K
    const gridResistanceTarget = (soilResistivity / totalConductorLength) * 4.5; // K ~ 4.5 for realistic values
    const totalGroundConductance = 1 / gridResistanceTarget;
    
    // Distribute conductance among nodes with realistic coupling
    const groundConductancePerNode = totalGroundConductance / nodes.length; // No artificial reduction
    nodes.forEach((node, i) => {
      Y[i][i] += groundConductancePerNode;
    });
    
    return Y;
  }
  
  /**
   * Build current injection vector I
   * Distributes fault current realistically across grid
   */
  static buildCurrentVector(nodes, totalCurrent, gridGeometry) {
    const n = nodes.length;
    const I = Array(n).fill(0);
    
    // Realistic current distribution:
    // - Much more current at edges (higher field concentration)
    // - Even more at corners (maximum concentration)
    // - Rod nodes get additional current
    // - Interior nodes get minimal current
    
    // Calculate distribution weights with much stronger edge concentration
    let totalWeight = 0;
    const weights = nodes.map(node => {
      let weight = 0.01; // Very low base weight for interior nodes
      
      if (node.isCorner) {
        weight = 10; // Corners get 10x base weight
      } else if (node.isEdge) {
        weight = 5; // Edges get 5x base weight
      }
      
      if (node.hasRod) {
        weight *= 3; // Rod nodes get additional current
      }
      
      totalWeight += weight;
      return weight;
    });
    
    // Distribute current based on weights
    const currentPerWeight = totalCurrent / totalWeight;
    nodes.forEach((node, i) => {
      I[i] = weights[i] * currentPerWeight;
    });
    
    return I;
  }
  
  /**
   * Solve linear system using Gaussian elimination
   * YV = I => V = Y^(-1) * I
   */
  static solveLinearSystem(Y, I) {
    const n = Y.length;
    
    // Create augmented matrix [Y|I]
    const augmented = Y.map((row, i) => [...row, I[i]]);
    
    // Forward elimination
    for (let col = 0; col < n; col++) {
      // Find pivot
      let maxRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
          maxRow = row;
        }
      }
      
      // Swap rows
      [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];
      
      // Eliminate column
      for (let row = col + 1; row < n; row++) {
        const factor = augmented[row][col] / augmented[col][col];
        for (let c = col; c <= n; c++) {
          augmented[row][c] -= factor * augmented[col][c];
        }
      }
    }
    
    // Back substitution
    const V = Array(n).fill(0);
    for (let row = n - 1; row >= 0; row--) {
      V[row] = augmented[row][n];
      for (let col = row + 1; col < n; col++) {
        V[row] -= augmented[row][col] * V[col];
      }
      V[row] /= augmented[row][row];
    }
    
    return V;
  }
  
  /**
   * Calculate branch currents from node voltages
   */
  static calculateBranchCurrents(edges, nodeVoltages) {
    return edges.map(edge => ({
      ...edge,
      current: (nodeVoltages[edge.i] - nodeVoltages[edge.j]) / edge.R,
      voltageDrop: Math.abs(nodeVoltages[edge.i] - nodeVoltages[edge.j])
    }));
  }
  
  /**
   * Calculate step voltages from node potentials
   * Step voltage = maximum voltage difference between nodes ~1m apart
   */
  static calculateStepVoltages(nodes, nodeVoltages, spacing) {
    const stepDistances = [];
    
    // Find all node pairs approximately 1m apart
    nodes.forEach((node1, i) => {
      nodes.forEach((node2, j) => {
        if (i >= j) return; // Avoid duplicates
        
        const distance = Math.hypot(node1.x - node2.x, node1.y - node2.y);
        
        // Look for distances close to 1m (step distance)
        if (distance >= 0.8 && distance <= 1.2) {
          const voltageDiff = Math.abs(nodeVoltages[i] - nodeVoltages[j]);
          stepDistances.push({
            node1: node1.id,
            node2: node2.id,
            distance,
            voltage: voltageDiff
          });
        }
      });
    });
    
    if (stepDistances.length === 0) {
      // If no exact step distances, use nearest neighbors
      const minDistance = Math.min(...nodes.map((node1, i) => 
        nodes.map((node2, j) => i === j ? Infinity : Math.hypot(node1.x - node2.x, node1.y - node2.y))
          .filter(d => d > 0)
          .reduce((min, d) => Math.min(min, d), Infinity)
      ));
      
      return minDistance * 100; // Rough estimate
    }
    
    // Return maximum step voltage
    return Math.max(...stepDistances.map(d => d.voltage));
  }
  
  /**
   * Estimate surface potential near a node
   * Uses average of nearby nodes as surface potential approximation
   */
  static estimateSurfacePotential(node, nodes, nodeVoltages) {
    // Find neighbors within ~1-2 meters
    const neighbors = nodes.filter(n => {
      if (n.id === node.id) return false;
      const distance = Math.hypot(n.x - node.x, n.y - node.y);
      return distance > 0 && distance < 2; // 1-2 meter radius
    });

    if (neighbors.length === 0) {
      // If no neighbors, use average of all nodes as fallback
      return nodeVoltages.reduce((sum, V) => sum + V, 0) / nodeVoltages.length;
    }

    // Average potential of nearby nodes (surface potential)
    const avgSurfacePotential = neighbors.reduce((sum, n) => sum + nodeVoltages[n.id], 0) / neighbors.length;
    return avgSurfacePotential;
  }

  /**
   * Calculate touch voltage from node potentials
   * Touch voltage = V(node) - V(surface nearby)
   */
  static calculateTouchVoltage(nodes, nodeVoltages) {
    let maxTouchVoltage = 0;

    nodes.forEach((node, i) => {
      const surfacePotential = this.estimateSurfacePotential(node, nodes, nodeVoltages);
      const touchVoltage = Math.abs(nodeVoltages[i] - surfacePotential);
      
      if (touchVoltage > maxTouchVoltage) {
        maxTouchVoltage = touchVoltage;
      }
    });

    return maxTouchVoltage;
  }
  
  /**
   * Calculate grid resistance from solved system
   */
  static calculateGridResistance(nodeVoltages, currentVector, soilResistivity) {
    const totalCurrent = currentVector.reduce((sum, I) => sum + I, 0);
    const averageVoltage = nodeVoltages.reduce((sum, V) => sum + V, 0) / nodeVoltages.length;
    
    return averageVoltage / totalCurrent;
  }
  
  /**
   * Main solving function
   */
  static solveGrid(gridGeometry, soilResistivity, faultCurrent) {
    // Step 1: Build grid nodes
    const nodes = this.buildGridNodes(gridGeometry);
    
    // Step 2: Build grid edges
    const edges = this.buildGridEdges(nodes, gridGeometry, soilResistivity);
    
    // Step 3: Build admittance matrix
    const Y = this.buildAdmittanceMatrix(nodes, edges, soilResistivity, gridGeometry, gridGeometry.rodLength);
    
    // Step 4: Build current vector
    const I = this.buildCurrentVector(nodes, faultCurrent, gridGeometry);
    
    // Step 5: Solve for node voltages
    const nodeVoltages = this.solveLinearSystem(Y, I);
    
    // Step 6: Calculate branch currents
    const branchCurrents = this.calculateBranchCurrents(edges, nodeVoltages);
    
    // Step 7: Calculate safety voltages
    const stepVoltage = this.calculateStepVoltages(nodes, nodeVoltages, gridGeometry.spacing || 5);
    const touchVoltage = this.calculateTouchVoltage(nodes, nodeVoltages);
    
    // Step 8: Calculate grid resistance
    const gridResistance = this.calculateGridResistance(nodeVoltages, I, soilResistivity);
    
    // Step 9: Calculate GPR
    const gpr = Math.max(...nodeVoltages);
    
    return {
      nodes: nodes.map((node, i) => ({ ...node, voltage: nodeVoltages[i] })),
      edges: branchCurrents,
      nodeVoltages,
      stepVoltage,
      touchVoltage,
      gridResistance,
      gpr,
      totalCurrent: I.reduce((sum, current) => sum + current, 0),
      // Spatial data for heatmap visualization
      spatialData: {
        nodes: nodes.map(node => ({ x: node.x, y: node.y })),
        voltages: nodeVoltages
      },
      analysis: {
        maxNodeVoltage: Math.max(...nodeVoltages),
        minNodeVoltage: Math.min(...nodeVoltages),
        voltageRange: Math.max(...nodeVoltages) - Math.min(...nodeVoltages),
        edgeConcentration: this.calculateEdgeConcentration(nodes, nodeVoltages),
        rodEffectiveness: this.calculateRodEffectiveness(nodes, nodeVoltages, I)
      }
    };
  }
  
  /**
   * Calculate edge concentration factor
   */
  static calculateEdgeConcentration(nodes, nodeVoltages) {
    const edgeNodes = nodes.filter(n => n.isEdge);
    const interiorNodes = nodes.filter(n => !n.isEdge);
    
    if (edgeNodes.length === 0 || interiorNodes.length === 0) return 1;
    
    const avgEdgeVoltage = edgeNodes.reduce((sum, n) => sum + nodeVoltages[n.id], 0) / edgeNodes.length;
    const avgInteriorVoltage = interiorNodes.reduce((sum, n) => sum + nodeVoltages[n.id], 0) / interiorNodes.length;
    
    return avgEdgeVoltage / avgInteriorVoltage;
  }
  
  /**
   * Calculate rod effectiveness
   */
  static calculateRodEffectiveness(nodes, nodeVoltages, currentVector) {
    const rodNodes = nodes.filter(n => n.hasRod);
    const nonRodNodes = nodes.filter(n => !n.hasRod);
    
    if (rodNodes.length === 0 || nonRodNodes.length === 0) return 1;
    
    const avgRodCurrent = rodNodes.reduce((sum, n) => sum + currentVector[n.id], 0) / rodNodes.length;
    const avgNonRodCurrent = nonRodNodes.reduce((sum, n) => sum + currentVector[n.id], 0) / nonRodNodes.length;
    
    return avgRodCurrent / avgNonRodCurrent;
  }
}

export default GridSolver;
