// Verde → Amarillo → Rojo (tipo ingeniería)
export function getETAPColor(t) {
  // t: 0..1
  let r, g, b;
  if (t < 0.33) {
    const k = t / 0.33;
    r = 255 * k; g = 255; b = 0;
  } else if (t < 0.66) {
    const k = (t - 0.33) / 0.33;
    r = 255; g = 255 * (1 - k); b = 0;
  } else {
    const k = (t - 0.66) / 0.34;
    r = 255; g = 255 * (1 - k); b = 0;
  }
  return `rgb(${r|0},${g|0},${b|0})`;
}
