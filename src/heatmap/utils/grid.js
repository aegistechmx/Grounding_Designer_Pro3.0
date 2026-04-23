export function createGrid(resolution, size = 30) {
  const grid = [];

  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      grid.push({
        x: (i / resolution) * size - size/2,
        y: (j / resolution) * size - size/2,
        i,
        j
      });
    }
  }

  return grid;
}