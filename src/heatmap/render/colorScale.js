export function getColor(intensity) {
  let r, g, b;

  if (intensity < 0.33) {
    const t = intensity / 0.33;
    r = 255 * t;
    g = 255;
    b = 0;
  } else if (intensity < 0.66) {
    const t = (intensity - 0.33) / 0.33;
    r = 255;
    g = 255 * (1 - t);
    b = 0;
  } else {
    const t = (intensity - 0.66) / 0.34;
    r = 255;
    g = 255 * (1 - t);
    b = 0;
  }

  return `rgb(${r|0}, ${g|0}, ${b|0})`;
}