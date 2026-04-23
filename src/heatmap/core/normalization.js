export function normalize(value, min, max) {
  const range = Math.max(0.1, max - min);
  let intensity = (value - min) / range;
  return Math.min(0.95, Math.max(0.05, intensity));
}