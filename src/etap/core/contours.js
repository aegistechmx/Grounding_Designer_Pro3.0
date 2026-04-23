import { ETAP_CONFIG } from '../config';
import { buildGrid } from './grid';
import { marchingSquares } from './marchingSquares';
import { connectSegments } from './connect';
import { smoothCatmullRom } from './smoothing';

export function computeLevels(min, max, stepMinor, stepMajor){
  const levels=[];
  const start = Math.floor(min/stepMinor)*stepMinor;
  for(let v=start; v<=max; v+=stepMinor){
    levels.push(v);
  }
  return levels;
}

export function generateContours(data, opts = {}) {
  const cfg = { ...ETAP_CONFIG, ...opts };
  const { grid, bounds } = buildGrid(data, cfg.gridSize, cfg.idwPower);
  const values = data.map(d=>d.potential);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const levels = computeLevels(min, max, cfg.contourStepMinor, cfg.contourStepMajor);
  const contours = levels.map(level => {
    const segs = marchingSquares(grid, cfg.gridSize, level);
    const lines = connectSegments(segs);
    const smooth = lines.map(l => smoothCatmullRom(l, cfg.smoothSegments));
    return { level, segments: smooth };
  });
  return { contours, levels, bounds, min, max };
}
