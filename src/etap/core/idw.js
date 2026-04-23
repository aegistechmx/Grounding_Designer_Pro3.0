const EPS = 1e-6;

export function idw(x, y, pts, power = 2) {
  let num = 0, den = 0;
  for (let i = 0; i < pts.length; i++) {
    const dx = pts[i].x - x;
    const dy = pts[i].y - y;
    const d = Math.sqrt(dx*dx + dy*dy) + EPS;
    const w = 1 / Math.pow(d, power);
    num += w * pts[i].potential;
    den += w;
  }
  return den ? num / den : 0;
}
