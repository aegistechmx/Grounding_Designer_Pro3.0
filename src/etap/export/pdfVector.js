import { getContourStyle } from '../utils/style';

export function drawContoursPDF(doc, contours, offset={x:0,y:0}, scale=1) {
  contours.forEach(({ level, segments }) => {
    const st = getContourStyle(level);
    doc.lineWidth(st.width);
    segments.forEach(seg => {
      if (!seg.length) return;
      doc.moveTo(offset.x + seg[0].x*scale, offset.y + seg[0].y*scale);
      for (let i=1;i<seg.length;i++){
        doc.lineTo(offset.x + seg[i].x*scale, offset.y + seg[i].y*scale);
      }
    });
    doc.stroke();
  });
}

export function drawLabelsPDF(doc, contours, offset={x:0,y:0}, scale=1) {
  doc.fontSize(8);
  contours.forEach(({ level, segments }) => {
    if (level % 500 !== 0) return;
    segments.forEach(seg => {
      if (seg.length < 6) return;
      const m = Math.floor(seg.length/2);
      const p = seg[m], q = seg[m+1];
      if (!p || !q) return;
      const ang = Math.atan2(q.y - p.y, q.x - p.x);
      doc.save();
      doc.rotate(ang * 180/Math.PI, { origin: [offset.x + p.x*scale, offset.y + p.y*scale] });
      doc.text(`${Math.round(level)} V`, offset.x + p.x*scale, offset.y + p.y*scale);
      doc.restore();
    });
  });
}
