/**
 * ETAP Renderer GPU - WebGL Renderer
 * GPU-accelerated rendering for iso-curves and iso-surfaces
 * Grounding Designer Pro - Professional Engineering Simulation
 */

import { createShader, createProgram } from './Shaders';

/**
 * ETAP Renderer class for GPU-accelerated rendering
 */
export class ETAPRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!this.gl) {
      console.warn('WebGL not supported, falling back to 2D canvas');
      return;
    }
    
    this.initGL();
    this.createBuffers();
  }

  /**
   * Initialize WebGL context
   */
  initGL() {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.1, 0.1, 0.15, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Create shaders for iso-curves
    this.initCurveShaders();
    
    // Create shaders for iso-surfaces
    this.initSurfaceShaders();
  }

  /**
   * Initialize curve rendering shaders
   */
  initCurveShaders() {
    const gl = this.gl;
    
    const vs = `
      attribute vec2 a_position;
      attribute float a_level;
      uniform vec2 u_resolution;
      uniform float u_lineWidth;
      varying float v_level;
      
      void main() {
        vec2 position = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(position, 0.0, 1.0);
        v_level = a_level;
        gl_PointSize = u_lineWidth;
      }
    `;
    
    const fs = `
      precision mediump float;
      varying float v_level;
      uniform float u_majorLevel;
      uniform vec3 u_color;
      
      void main() {
        float alpha = mod(v_level, 500.0) < 1.0 ? 1.0 : 0.6;
        gl_FragColor = vec4(u_color, alpha);
      }
    `;
    
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vs);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fs);
    
    this.curveProgram = createProgram(gl, vertexShader, fragmentShader);
    this.curvePositionLoc = gl.getAttribLocation(this.curveProgram, 'a_position');
    this.curveLevelLoc = gl.getAttribLocation(this.curveProgram, 'a_level');
    this.curveResolutionLoc = gl.getUniformLocation(this.curveProgram, 'u_resolution');
    this.curveLineWidthLoc = gl.getUniformLocation(this.curveProgram, 'u_lineWidth');
    this.curveMajorLevelLoc = gl.getUniformLocation(this.curveProgram, 'u_majorLevel');
    this.curveColorLoc = gl.getUniformLocation(this.curveProgram, 'u_color');
  }

  /**
   * Initialize surface rendering shaders
   */
  initSurfaceShaders() {
    const gl = this.gl;
    
    const vs = `
      attribute vec3 a_position;
      attribute vec3 a_normal;
      uniform mat4 u_modelView;
      uniform mat4 u_projection;
      varying vec3 v_normal;
      varying vec3 v_position;
      
      void main() {
        v_normal = (u_modelView * vec4(a_normal, 0.0)).xyz;
        v_position = (u_modelView * vec4(a_position, 1.0)).xyz;
        gl_Position = u_projection * u_modelView * vec4(a_position, 1.0);
      }
    `;
    
    const fs = `
      precision mediump float;
      varying vec3 v_normal;
      varying vec3 v_position;
      uniform vec3 u_lightDir;
      uniform vec3 u_color;
      uniform float u_opacity;
      
      void main() {
        vec3 normal = normalize(v_normal);
        vec3 lightDir = normalize(u_lightDir);
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 ambient = 0.3 * u_color;
        vec3 diffuse = diff * u_color;
        gl_FragColor = vec4(ambient + diffuse, u_opacity);
      }
    `;
    
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vs);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fs);
    
    this.surfaceProgram = createProgram(gl, vertexShader, fragmentShader);
    this.surfacePositionLoc = gl.getAttribLocation(this.surfaceProgram, 'a_position');
    this.surfaceNormalLoc = gl.getAttribLocation(this.surfaceProgram, 'a_normal');
    this.surfaceModelViewLoc = gl.getUniformLocation(this.surfaceProgram, 'u_modelView');
    this.surfaceProjectionLoc = gl.getUniformLocation(this.surfaceProgram, 'u_projection');
    this.surfaceLightDirLoc = gl.getUniformLocation(this.surfaceProgram, 'u_lightDir');
    this.surfaceColorLoc = gl.getUniformLocation(this.surfaceProgram, 'u_color');
    this.surfaceOpacityLoc = gl.getUniformLocation(this.surfaceProgram, 'u_opacity');
  }

  /**
   * Create GPU buffers
   */
  createBuffers() {
    const gl = this.gl;
    
    // Curve vertex buffer
    this.curveBuffer = gl.createBuffer();
    
    // Surface vertex buffer
    this.surfaceBuffer = gl.createBuffer();
    this.surfaceNormalBuffer = gl.createBuffer();
  }

  /**
   * Render iso-curves
   */
  renderIsoCurves(curves) {
    const gl = this.gl;
    
    gl.useProgram(this.curveProgram);
    gl.uniform2f(this.curveResolutionLoc, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.curveMajorLevelLoc, 500.0);
    gl.uniform3f(this.curveColorLoc, 0.0, 0.0, 0.0);
    
    curves.forEach(curve => {
      gl.uniform1f(this.curveLineWidthLoc, curve.thickness);
      
      // Flatten curve segments into vertex array
      const vertices = [];
      curve.segments.forEach(seg => {
        seg.forEach(point => {
          vertices.push(point.x, point.y, curve.level);
        });
      });
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.curveBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      
      gl.enableVertexAttribArray(this.curvePositionLoc);
      gl.vertexAttribPointer(this.curvePositionLoc, 2, gl.FLOAT, false, 12, 0);
      
      gl.enableVertexAttribArray(this.curveLevelLoc);
      gl.vertexAttribPointer(this.curveLevelLoc, 1, gl.FLOAT, false, 12, 8);
      
      gl.drawArrays(gl.LINE_STRIP, 0, vertices.length / 3);
    });
  }

  /**
   * Render iso-surfaces (3D)
   */
  renderIsoSurfaces(surfaces, modelView, projection) {
    const gl = this.gl;
    
    gl.useProgram(this.surfaceProgram);
    gl.uniformMatrix4fv(this.surfaceModelViewLoc, false, modelView);
    gl.uniformMatrix4fv(this.surfaceProjectionLoc, false, projection);
    gl.uniform3f(this.surfaceLightDirLoc, 0.5, 0.5, 1.0);
    
    surfaces.forEach(surface => {
      gl.uniform3f(this.surfaceColorLoc, 0.0, 0.8, 0.0);
      gl.uniform1f(this.surfaceOpacityLoc, surface.opacity);
      
      // Flatten triangles into vertex array
      const vertices = [];
      const normals = [];
      
      surface.triangles.forEach(tri => {
        tri.forEach(v => {
          vertices.push(v.x, v.y, v.z);
        });
      });
      
      if (surface.normals) {
        surface.normals.forEach(n => {
          normals.push(n.x, n.y, n.z);
        });
      }
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.surfaceBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      
      gl.enableVertexAttribArray(this.surfacePositionLoc);
      gl.vertexAttribPointer(this.surfacePositionLoc, 3, gl.FLOAT, false, 0, 0);
      
      if (normals.length > 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.surfaceNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        
        gl.enableVertexAttribArray(this.surfaceNormalLoc);
        gl.vertexAttribPointer(this.surfaceNormalLoc, 3, gl.FLOAT, false, 0, 0);
      }
      
      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
    });
  }

  /**
   * Clear canvas
   */
  clear() {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  /**
   * Resize canvas
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    if (this.gl) {
      this.gl.viewport(0, 0, width, height);
    }
  }

  /**
   * Destroy renderer
   */
  destroy() {
    const gl = this.gl;
    if (gl) {
      gl.deleteBuffer(this.curveBuffer);
      gl.deleteBuffer(this.surfaceBuffer);
      gl.deleteBuffer(this.surfaceNormalBuffer);
      gl.deleteProgram(this.curveProgram);
      gl.deleteProgram(this.surfaceProgram);
    }
  }
}

export default ETAPRenderer;
