import { idw } from './idw';

export function buildGrid(data, gridSize, power = 2) {
  const xs = data.map(d => d.x);
  const ys = data.map(d => d.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  const grid = new Array(gridSize + 1);
  for (let i = 0; i <= gridSize; i++) {
    grid[i] = new Array(gridSize + 1);
    const gx = minX + (i / gridSize) * (maxX - minX);
    for (let j = 0; j <= gridSize; j++) {
      const gy = minY + (j / gridSize) * (maxY - minY);
      grid[i][j] = {
        x: gx, y: gy,
        value: idw(gx, gy, data, power),
      };
    }
  }
  return { grid, bounds: { minX, maxX, minY, maxY } };
}
