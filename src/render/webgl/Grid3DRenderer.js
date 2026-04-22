// src/render/webgl/Grid3DRenderer.js
// Renderizador 3D con WebGL - SOLO VISUALIZACIÓN

export class Grid3DRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl');
    
    if (!this.gl) {
      console.warn('WebGL no soportado, usando fallback 2D');
      return;
    }
    
    this.width = options.width || 800;
    this.height = options.height || 600;
    this.backgroundColor = options.backgroundColor || [0.1, 0.1, 0.2, 1.0];
    
    this.setupWebGL();
  }

  setupWebGL() {
    const gl = this.gl;
    
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(...this.backgroundColor);
    gl.enable(gl.DEPTH_TEST);
    
    // Shader de vértices básico
    const vertexShader = this.createShader(gl.VERTEX_SHADER, `
      attribute vec3 position;
      attribute vec3 color;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      varying vec3 vColor;
      
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vColor = color;
      }
    `);
    
    // Shader de fragmentos
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec3 vColor;
      
      void main() {
        gl_FragColor = vec4(vColor, 1.0);
      }
    `);
    
    if (!vertexShader || !fragmentShader) {
      console.error('Error al crear shaders');
      return;
    }
    
    this.program = this.createProgram(gl, vertexShader, fragmentShader);
    if (!this.program) {
      console.error('Error al crear programa');
      return;
    }
    
    gl.useProgram(this.program);
    
    // Obtener ubicaciones
    this.positionLocation = gl.getAttribLocation(this.program, 'position');
    this.colorLocation = gl.getAttribLocation(this.program, 'color');
    this.modelViewMatrixLocation = gl.getUniformLocation(this.program, 'modelViewMatrix');
    this.projectionMatrixLocation = gl.getUniformLocation(this.program, 'projectionMatrix');
  }

  createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }

  createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return null;
    }
    
    return program;
  }

  drawGrid(nx, ny, spacing, colors) {
    const gl = this.gl;
    const vertices = [];
    const vertexColors = [];
    
    // Generar líneas de la malla
    for (let i = 0; i <= nx; i++) {
      const x = (i - nx/2) * spacing;
      
      for (let j = 0; j <= ny; j++) {
        const z = (j - ny/2) * spacing;
        
        // Vértices
        vertices.push(x, 0, z);
        vertexColors.push(...colors.grid);
      }
    }
    
    // Crear buffers
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);
    
    // Configurar atributos
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(this.positionLocation);
    gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.enableVertexAttribArray(this.colorLocation);
    gl.vertexAttribPointer(this.colorLocation, 3, gl.FLOAT, false, 0, 0);
    
    // Dibujar
    gl.drawArrays(gl.LINES, 0, vertices.length / 3);
  }

  drawRods(positions, color) {
    const gl = this.gl;
    const vertices = [];
    const vertexColors = [];
    
    for (const pos of positions) {
      // Base y tope de cada varilla
      vertices.push(pos.x, 0, pos.z);
      vertices.push(pos.x, -pos.length, pos.z);
      vertexColors.push(...color, ...color);
    }
    
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(this.positionLocation);
    gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.enableVertexAttribArray(this.colorLocation);
    gl.vertexAttribPointer(this.colorLocation, 3, gl.FLOAT, false, 0, 0);
    
    gl.drawArrays(gl.LINES, 0, vertices.length / 3);
  }

  setCamera(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
    const gl = this.gl;
    
    // Matriz de vista (lookAt simplificada)
    const modelViewMatrix = this.lookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ);
    gl.uniformMatrix4fv(this.modelViewMatrixLocation, false, modelViewMatrix);
    
    // Matriz de proyección (perspectiva)
    const projectionMatrix = this.perspective(45, this.width / this.height, 0.1, 1000);
    gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix);
  }

  lookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
    // Implementación simplificada de lookAt
    const zAxis = this.normalize([
      eyeX - centerX,
      eyeY - centerY,
      eyeZ - centerZ
    ]);
    
    const xAxis = this.normalize(this.cross([upX, upY, upZ], zAxis));
    const yAxis = this.cross(zAxis, xAxis);
    
    return [
      xAxis[0], yAxis[0], zAxis[0], 0,
      xAxis[1], yAxis[1], zAxis[1], 0,
      xAxis[2], yAxis[2], zAxis[2], 0,
      -this.dot(xAxis, [eyeX, eyeY, eyeZ]),
      -this.dot(yAxis, [eyeX, eyeY, eyeZ]),
      -this.dot(zAxis, [eyeX, eyeY, eyeZ]), 1
    ];
  }

  perspective(fov, aspect, near, far) {
    const aspectSafe = Math.max(0.1, aspect || 1);
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fov * Math.PI / 180);
    const rangeInv = 1.0 / (near - far);
    
    return [
      f / aspectSafe, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  }

  normalize(v) {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (len < 1e-10) return [0, 0, 1]; // Valor por defecto si el vector es cero
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  clear() {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  render(scene) {
    this.clear();
    this.setCamera(5, 5, 5, 0, 0, 0, 0, 1, 0);
    
    if (scene.grid) {
      this.drawGrid(scene.grid.nx, scene.grid.ny, scene.grid.spacing, scene.colors);
    }
    
    if (scene.rods) {
      this.drawRods(scene.rods, scene.colors?.rods || [1, 0, 0]);
    }
  }
}

export default Grid3DRenderer;
