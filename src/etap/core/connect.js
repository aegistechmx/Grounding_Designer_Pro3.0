function key(p){ return `${p.x.toFixed(4)},${p.y.toFixed(4)}`; }

export function connectSegments(segments){
  const lines=[];
  const used=new Set();
  for(let i=0;i<segments.length;i++){
    if(used.has(i)) continue;
    const line=[segments[i][0], segments[i][1]];
    used.add(i);
    let extended=true;
    while(extended){
      extended=false;
      for(let j=0;j<segments.length;j++){
        if(used.has(j)) continue;
        const [a,b]=segments[j];
        const tail=line[line.length-1];
        if(key(tail)===key(a)){
          line.push(b); used.add(j); extended=true;
        } else if(key(tail)===key(b)){
          line.push(a); used.add(j); extended=true;
        }
      }
    }
    lines.push(line);
  }
  return lines;
}
