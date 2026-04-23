const EPS = 1e-6;

// edges: 0 top, 1 right, 2 bottom, 3 left
const CASES = {
  0:[],1:[[3,0]],2:[[0,1]],3:[[3,1]],
  4:[[1,2]],5:[[3,2],[0,1]],6:[[0,2]],7:[[3,2]],
  8:[[2,3]],9:[[0,2]],10:[[1,3],[0,2]],11:[[1,3]],
  12:[[1,3]],13:[[0,1]],14:[[3,0]],15:[]
};

const lerp = (a,b,t)=>a+(b-a)*t;

function interp(p1,p2,v1,v2,level){
  if (Math.abs(v2-v1)<EPS) return p1;
  const t=(level-v1)/(v2-v1);
  return { x: lerp(p1.x,p2.x,t), y: lerp(p1.y,p2.y,t) };
}

function edgePoint(edge, c, L){
  const {tl,tr,br,bl}=c;
  switch(edge){
    case 0: return interp(tl,tr,tl.value,tr.value,L);
    case 1: return interp(tr,br,tr.value,br.value,L);
    case 2: return interp(bl,br,bl.value,br.value,L);
    case 3: return interp(tl,bl,tl.value,bl.value,L);
  }
}

export function marchingSquares(grid, gridSize, level){
  const segs=[];
  for(let i=0;i<gridSize;i++){
    for(let j=0;j<gridSize;j++){
      const tl=grid[i][j], tr=grid[i+1][j], br=grid[i+1][j+1], bl=grid[i][j+1];
      let idx=0;
      if(tl.value>level) idx|=8;
      if(tr.value>level) idx|=4;
      if(br.value>level) idx|=2;
      if(bl.value>level) idx|=1;
      const conf = CASES[idx];
      if(!conf) continue;
      const cell={tl,tr,br,bl};
      for(const [e1,e2] of conf){
        const p1=edgePoint(e1,cell,level);
        const p2=edgePoint(e2,cell,level);
        segs.push([p1,p2]);
      }
    }
  }
  return segs;
}
