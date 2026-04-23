export function contoursToDXF(contours) {
  let dxf = `0\nSECTION\n2\nENTITIES\n`;
  contours.forEach(({ level, segments }) => {
    const layer = `CONTOUR_${Math.round(level)}`;
    segments.forEach(seg => {
      dxf += `0\nPOLYLINE\n8\n${layer}\n66\n1\n70\n0\n`;
      seg.forEach(p => {
        dxf += `0\nVERTEX\n8\n${layer}\n10\n${p.x}\n20\n${p.y}\n30\n0\n`;
      });
      dxf += `0\nSEQEND\n`;
    });
  });
  dxf += `0\nENDSEC\n0\nEOF\n`;
  return dxf;
}
