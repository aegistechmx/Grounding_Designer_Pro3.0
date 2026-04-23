/**
 * Renderer WebGL para heatmap tipo ETAP
 * Interpolación en GPU + gradiente continuo
 */

import { createShader, createProgram } from './Shaders';
import { etapVertexShader, etapFragmentShader, multiContourFragmentShader } from './ETAPShader.service';

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
    
    // Crear shaders ETAP
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, etapVertexShader);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, etapFragmentShader);
    
    if (!vertexShader || !fragmentShader) {
      console.error('Error al crear shaders ETAP');
      return;
    }
    
    this.program = createProgram(gl, vertexShader, fragmentShader);
    
    if (!this.program) {
      console.error('Error al crear programa ETAP');
      return;
    }
    
    gl.useProgram(this.program);
    
    // Obtener ubicaciones
    this.positionLoc = gl.getAttribLocation(this.program, 'a_position');
    this.resolutionLoc = gl.getUniformLocation(this.program, 'u_resolution');
    this.gridSizeLoc = gl.getUniformLocation(this.program, 'u_gridSize');
    this.interpolationPowerLoc = gl.getUniformLocation(this.program, 'u_interpolationPower');
    this.minValueLoc = gl.getUniformLocation(this.program, 'u_minValue');
    this.maxValueLoc = gl.getUniformLocation(this.program, 'u_maxValue');
    this.numDataPointsLoc = gl.getUniformLocation(this.program, 'u_numDataPoints');
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
    
    // Crear textura de datos (posiciones)
    this.positionTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.positionTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    // Crear textura de valores
    this.valueTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.valueTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  
  updateData(data, width, height) {
    if (!this.gl) {
      console.warn('WebGL no disponible, no se puede actualizar datos');
      return;
    }
    const gl = this.gl;
    
    // Prepare position and value textures for IDW interpolation
    const numPoints = Math.min(data.length, 100);
    const positionData = new Float32Array(numPoints * 2);
    const valueData = new Float32Array(numPoints);
    
    for (let i = 0; i < numPoints; i++) {
      positionData[i * 2] = data[i].x / width;
      positionData[i * 2 + 1] = data[i].y / height;
      valueData[i] = data[i].potential;
    }
    
    // Update position texture
    gl.bindTexture(gl.TEXTURE_2D, this.positionTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, numPoints, 1, 0, gl.RGBA, gl.FLOAT, positionData);
    
    // Update value texture
    gl.bindTexture(gl.TEXTURE_2D, this.valueTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, numPoints, 1, 0, gl.RGBA, gl.FLOAT, valueData);
    
    this.numDataPoints = numPoints;
  }
  
  render(minValue, maxValue, interpolationPower = 2.0) {
    if (!this.gl) {
      console.warn('WebGL no disponible, no se puede renderizar');
      return;
    }
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(this.program);
    
    // Set uniforms
    gl.uniform2f(this.resolutionLoc, this.width, this.height);
    gl.uniform2f(this.gridSizeLoc, this.width, this.height);
    gl.uniform1f(this.interpolationPowerLoc, interpolationPower);
    gl.uniform1f(this.minValueLoc, minValue);
    gl.uniform1f(this.maxValueLoc, maxValue);
    gl.uniform1i(this.numDataPointsLoc, this.numDataPoints || 0);
    
    // Bind textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.positionTexture);
    gl.uniform1i(gl.getUniformLocation(this.program, 'u_positionTexture'), 0);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.valueTexture);
    gl.uniform1i(gl.getUniformLocation(this.program, 'u_dataTexture'), 1);
    
    // Draw
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
      this.gl.deleteTexture(this.positionTexture);
      this.gl.deleteTexture(this.valueTexture);
      this.gl.deleteProgram(this.program);
    }
  }
}

export default HeatmapRenderer;
