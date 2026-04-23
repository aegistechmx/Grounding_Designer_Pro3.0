// Renderer simple: pinta heatmap vía fragment shader (IDW aproximado)
// Para producción, puedes subir a textura los puntos y hacer IDW exacto.

export function createWebGLHeatmap(canvas) {
  const gl = canvas.getContext('webgl');
  if (!gl) return null;

  const vs = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main(){
    vUv = (aPos + 1.0) * 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }`;

  const fs = `
  precision mediump float;
  varying vec2 vUv;
  uniform float uMin;
  uniform float uMax;
  
  vec3 color(float t){
    if (t < 0.33) {
      float k = t/0.33;
      return vec3(k,1.0,0.0);
    } else if (t < 0.66) {
      float k = (t-0.33)/0.33;
      return vec3(1.0,1.0-k,0.0);
    } else {
      float k = (t-0.66)/0.34;
      return vec3(1.0,1.0-k,0.0);
    }
  }
  
  void main(){
    // placeholder: gradiente radial
    float d = distance(vUv, vec2(0.5));
    float v = mix(uMin, uMax, 1.0 - d);
    float t = clamp((v - uMin)/(uMax-uMin), 0.0, 1.0);
    gl_FragColor = vec4(color(t),1.0);
  }`;

  function compile(type, src){
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1,-1, 1,-1, -1,1,
    -1,1, 1,-1, 1,1
  ]), gl.STATIC_DRAW);

  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uMin = gl.getUniformLocation(prog, 'uMin');
  const uMax = gl.getUniformLocation(prog, 'uMax');

  return {
    draw(min, max){
      gl.viewport(0,0,canvas.width, canvas.height);
      gl.uniform1f(uMin, min);
      gl.uniform1f(uMax, max);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  };
}
