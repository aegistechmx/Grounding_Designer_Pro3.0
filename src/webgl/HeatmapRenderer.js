/**
 * Renderer WebGL para heatmap tipo ETAP
 * Interpolación en GPU + gradiente continuo
 */

import { createShader, createProgram, heatmapVertexShader, heatmapFragmentShader } from './Shaders';

export class HeatmapRenderer {
  constructor(canvas, width, height) {
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!this.gl) {
      console.warn('WebGL no soportado, usando canvas 2D');
      return;
    }
    
    this.initGL();
    this.createBuffers();
  }
  
  initGL() {
    const gl = this.gl;
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0.1, 0.1, 0.15, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Crear shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, heatmapVertexShader);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, heatmapFragmentShader);
    this.program = createProgram(gl, vertexShader, fragmentShader);
    
    gl.useProgram(this.program);
    
    // Obtener ubicaciones
    this.positionLoc = gl.getAttribLocation(this.program, 'a_position');
    this.resolutionLoc = gl.getUniformLocation(this.program, 'u_resolution');
    this.dataTextureLoc = gl.getUniformLocation(this.program, 'u_data');
  }
  
  createBuffers() {
    const gl = this.gl;
    
    // Crear buffer de geometría (cuadrícula)
    const vertices = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 1
    ]);
    
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    // Crear textura de datos
    this.dataTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.dataTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  
  updateData(data, width, height) {
    const gl = this.gl;
    
    // Actualizar textura con nuevos datos
    gl.bindTexture(gl.TEXTURE_2D, this.dataTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }
  
  render() {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(this.program);
    gl.uniform2f(this.resolutionLoc, this.width, this.height);
    gl.uniform1i(this.dataTextureLoc, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray(this.positionLoc);
    gl.vertexAttribPointer(this.positionLoc, 2, gl.FLOAT, false, 0, 0);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  
  resize(width, height) {
    this.width = width;
    this.height = height;
    if (this.gl) {
      this.gl.viewport(0, 0, width, height);
    }
  }
  
  destroy() {
    if (this.gl) {
      this.gl.deleteBuffer(this.vertexBuffer);
      this.gl.deleteTexture(this.dataTexture);
      this.gl.deleteProgram(this.program);
    }
  }
}

export default HeatmapRenderer;
