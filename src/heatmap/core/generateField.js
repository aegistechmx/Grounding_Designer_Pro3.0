export function generateField({
  resolution,
  size,
  nodes,
  values,
  interpolationPower,
  min,
  max
}) {
  const field = [];
  const range = Math.max(0.1, max - min);

  for (let i = 0; i < resolution; i++) {
    field[i] = [];

    for (let j = 0; j < resolution; j++) {
      const x = (i / resolution) * size - size / 2;
      const y = (j / resolution) * size - size / 2;

      let value = 0;
      let weightSum = 0;

      for (let k = 0; k < nodes.length; k++) {
        const dx = x - nodes[k].x;
        const dy = y - nodes[k].y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;

        const w = 1 / Math.pow(dist, interpolationPower);
        value += values[k] * w;
        weightSum += w;
      }

      value = weightSum > 0 ? value / weightSum : 0;

      const intensity = Math.min(
        0.95,
        Math.max(0.05, (value - min) / range)
      );

      field[i][j] = intensity;
    }
  }

  return field;
}
