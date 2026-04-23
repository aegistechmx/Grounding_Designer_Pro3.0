import { getContourStyle } from '../utils/style';
import { getETAPColor } from '../utils/colorScale';

export function drawHeatmap(ctx, gridInfo, width, height) {
  const { grid } = gridInfo;
  const n = grid.length - 1;
  
  // compute min/max
  let min=Infinity, max=-Infinity;
  for (let i=0;i<=n;i++){
    for (let j=0;j<=n;j++){
      const v = grid[i][j].value;
      if (v<min) min=v; if (v>max) max=v;
    }
  }
  const range = Math.max(1e-6, max-min);
  const cw = width / n, ch = height / n;
  
  for (let i=0;i<n;i++){
    for (let j=0;j<n;j++){
      const v = grid[i][j].value;
      const t = (v-min)/range;
      ctx.fillStyle = getETAPColor(t);
      ctx.fillRect(i*cw, j*ch, cw+1, ch+1);
    }
  }
}

export function drawContoursCanvas(ctx, contours) {
  contours.forEach(({ level, segments }) => {
    const st = getContourStyle(level);
    ctx.globalAlpha = st.alpha;
    ctx.lineWidth = st.width;
    ctx.strokeStyle = '#000';
    segments.forEach(seg => {
      if (!seg.length) return;
      ctx.beginPath();
      ctx.moveTo(seg[0].x, seg[0].y);
      for (let i=1;i<seg.length;i++){
        ctx.lineTo(seg[i].x, seg[i].y);
      }
      ctx.stroke();
    });
  });
  ctx.globalAlpha = 1;
}

export function drawLabelsCanvas(ctx, contours) {
  ctx.fillStyle = '#111';
  ctx.font = '10px Arial';
  contours.forEach(({ level, segments }) => {
    if (level % 500 !== 0) return;
    segments.forEach(seg => {
      if (seg.length < 6) return;
      const m = Math.floor(seg.length/2);
      const p = seg[m], q = seg[m+1];
      if (!p || !q) return;
      const ang = Math.atan2(q.y - p.y, q.x - p.x);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.fillText(`${Math.round(level)} V`, 4, -4);
      ctx.restore();
    });
  });
}

export function drawLegendCanvas(ctx, min, max, x=20, y=20, h=200, w=20) {
  for (let i=0;i<h;i++){
    const t = 1 - i/h;
    ctx.fillStyle = getETAPColor(t);
    ctx.fillRect(x, y+i, w, 1);
  }
  ctx.fillStyle = '#000';
  ctx.font = '10px Arial';
  const steps = 5;
  for (let i=0;i<=steps;i++){
    const t = i/steps;
    const val = min + (1-t)*(max-min);
    const py = y + t*h;
    ctx.fillText(`${Math.round(val)} V`, x+w+6, py+3);
  }
}
