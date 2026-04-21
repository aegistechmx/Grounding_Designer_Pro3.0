/**
 * Shaders WebGL para heatmap y partículas
 */

export const createShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  
  return shader;
};

export const createProgram = (gl, vertexShader, fragmentShader) => {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  
  return program;
};

// ============================================
// VERTEX SHADER PARA HEATMAP
// ============================================

export const heatmapVertexShader = `
  attribute vec2 a_position;
  uniform vec2 u_resolution;
  varying vec2 v_texCoord;
  
  void main() {
    vec2 position = a_position * 2.0 - 1.0;
    gl_Position = vec4(position, 0.0, 1.0);
    v_texCoord = a_position;
  }
`;

// ============================================
// FRAGMENT SHADER PARA HEATMAP (ETAP-style)
// ============================================

export const heatmapFragmentShader = `
  precision highp float;
  uniform sampler2D u_data;
  varying vec2 v_texCoord;
  
  void main() {
    vec4 data = texture2D(u_data, v_texCoord);
    float value = data.r;
    
    // Colormap tipo ETAP (azul -> verde -> amarillo -> rojo)
    vec3 color;
    if (value < 0.25) {
      color = vec3(0.0, 0.5, 1.0);
    } else if (value < 0.5) {
      float t = (value - 0.25) / 0.25;
      color = mix(vec3(0.0, 0.5, 1.0), vec3(0.0, 1.0, 0.5), t);
    } else if (value < 0.75) {
      float t = (value - 0.5) / 0.25;
      color = mix(vec3(0.0, 1.0, 0.5), vec3(1.0, 1.0, 0.0), t);
    } else {
      float t = (value - 0.75) / 0.25;
      color = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), t);
    }
    
    gl_FragColor = vec4(color, 0.7);
  }
`;

// ============================================
// VERTEX SHADER PARA PARTÍCULAS
// ============================================

export const particleVertexShader = `
  attribute vec2 a_position;
  attribute float a_life;
  uniform vec2 u_resolution;
  varying float v_life;
  
  void main() {
    vec2 position = (a_position / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(position, 0.0, 1.0);
    gl_PointSize = 3.0 * a_life;
    v_life = a_life;
  }
`;

// ============================================
// FRAGMENT SHADER PARA PARTÍCULAS
// ============================================

export const particleFragmentShader = `
  precision mediump float;
  varying float v_life;
  
  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    
    float alpha = (1.0 - dist * 2.0) * v_life * 0.8;
    vec3 color = mix(vec3(1.0, 0.4, 0.0), vec3(1.0, 0.8, 0.0), v_life);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export default {
  createShader,
  createProgram,
  heatmapVertexShader,
  heatmapFragmentShader,
  particleVertexShader,
  particleFragmentShader
};
