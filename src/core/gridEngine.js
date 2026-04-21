/**
 * Motor de generación de malla real
 * Calcula nodos, conductores y geometría
 */

export const generateGrid = (params) => {
  const {
    gridWidth = 30,
    gridLength = 30,
    nx = 10,
    ny = 10,
    gridDepth = 0.6
  } = params;

  const dx = gridWidth / (nx - 1);
  const dy = gridLength / (ny - 1);

  const nodes = [];
  const conductors = [];

  // Generar nodos
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      nodes.push({
        id: `${i}-${j}`,
        x: i * dx,
        y: j * dy,
        z: -gridDepth,
        i,
        j,
        isBorder: i === 0 || i === nx - 1 || j === 0 || j === ny - 1
      });
    }
  }

  // Generar conductores horizontales (conexiones en X)
  for (let i = 0; i < nx - 1; i++) {
    for (let j = 0; j < ny; j++) {
      conductors.push({
        id: `h-${i}-${j}`,
        from: `${i}-${j}`,
        to: `${i + 1}-${j}`,
        type: 'horizontal',
        length: dx
      });
    }
  }

  // Generar conductores verticales (conexiones en Y)
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny - 1; j++) {
      conductors.push({
        id: `v-${i}-${j}`,
        from: `${i}-${j}`,
        to: `${i}-${j + 1}`,
        type: 'vertical',
        length: dy
      });
    }
  }

  // Calcular perímetro y área
  const perimeter = 2 * (gridWidth + gridLength);
  const area = gridWidth * gridLength;
  const totalConductorLength = conductors.reduce((sum, c) => sum + c.length, 0);

  return {
    nodes,
    conductors,
    params: {
      nx,
      ny,
      dx,
      dy,
      gridWidth,
      gridLength,
      gridDepth,
      perimeter,
      area,
      totalConductorLength
    }
  };
};

export const getNodeNeighbors = (grid, nodeId) => {
  const [i, j] = nodeId.split('-').map(Number);
  const neighbors = [];
  
  const directions = [
    { di: -1, dj: 0, name: 'left' },
    { di: 1, dj: 0, name: 'right' },
    { di: 0, dj: -1, name: 'down' },
    { di: 0, dj: 1, name: 'up' }
  ];
  
  directions.forEach(dir => {
    const ni = i + dir.di;
    const nj = j + dir.dj;
    if (ni >= 0 && ni < grid.params.nx && nj >= 0 && nj < grid.params.ny) {
      neighbors.push({
        id: `${ni}-${nj}`,
        direction: dir.name
      });
    }
  });
  
  return neighbors;
};

export const getPerimeterNodes = (grid) => {
  return grid.nodes.filter(node => node.isBorder);
};

export const getCornerNodes = (grid) => {
  const { nx, ny } = grid.params;
  return grid.nodes.filter(node => 
    (node.i === 0 && node.j === 0) ||
    (node.i === 0 && node.j === ny - 1) ||
    (node.i === nx - 1 && node.j === 0) ||
    (node.i === nx - 1 && node.j === ny - 1)
  );
};

export default {
  generateGrid,
  getNodeNeighbors,
  getPerimeterNodes,
  getCornerNodes
};
