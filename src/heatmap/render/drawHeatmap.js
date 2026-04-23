import { getETAPColor } from '../utils/colorScale';

export function drawHeatmap(ctx, field, width, height) {
  const resolution = field.length;
  const cellW = width / resolution;
  const cellH = height / resolution;

  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      ctx.fillStyle = getETAPColor(field[i][j]);
      ctx.fillRect(i * cellW, j * cellH, cellW, cellH);
    }
  }
}