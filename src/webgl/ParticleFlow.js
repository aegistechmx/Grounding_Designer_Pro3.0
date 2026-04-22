/**
 * Sistema de partículas GPU para animación de corriente
 * Flujo siguiendo gradiente de campo eléctrico
 */

export class ParticleFlow {
  constructor(canvas, numParticles = 2000) {
    this.canvas = canvas;
    this.numParticles = numParticles;
    this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    this.particles = [];
    this.flowField = null;
    
    if (this.gl) {
      this.initGL();
      this.initParticles();
    } else {
      this.initParticles();
    }
  }
  
  initGL() {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }
  
  initParticles() {
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: Math.random(),
        speed: 0.5 + Math.random() * 2
      });
    }
  }
  
  setFlowField(field) {
    this.flowField = field;
  }
  
  update(deltaTime) {
    for (const p of this.particles) {
      if (this.flowField) {
        // Obtener dirección del campo en la posición de la partícula
        const fx = this.sampleField(this.flowField.ex, p.x, p.y);
        const fy = this.sampleField(this.flowField.ey, p.x, p.y);
        
        p.vx += fx * deltaTime * p.speed;
        p.vy += fy * deltaTime * p.speed;
        
        // Limitar velocidad máxima
        const maxSpeed = 5;
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed;
          p.vy = (p.vy / speed) * maxSpeed;
        }
      }
      
      // Actualizar posición
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      
      // Rebote en bordes
      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -0.9;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -0.9;
      
      // Regenerar partículas muertas
      p.life -= deltaTime * 0.2;
      if (p.life <= 0 || p.x < 0 || p.x > this.canvas.width || p.y < 0 || p.y > this.canvas.height) {
        p.x = Math.random() * this.canvas.width;
        p.y = Math.random() * this.canvas.height;
        p.vx = (Math.random() - 0.5) * 2;
        p.vy = (Math.random() - 0.5) * 2;
        p.life = 1;
      }
    }
  }
  
  sampleField(field, x, y) {
    if (!field || !field.data || !field.width || !field.height) return 0;
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    if (xi >= 0 && xi < field.width && yi >= 0 && yi < field.height) {
      const idx = yi * field.width + xi;
      return field.data[idx] !== undefined ? field.data[idx] : 0;
    }
    return 0;
  }
  
  render() {
    if (!this.gl) {
      this.renderCanvas2D();
      return;
    }
    this.renderWebGL();
  }
  
  renderCanvas2D() {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 100, 0, ${p.life * 0.8})`;
      ctx.fill();
    }
  }
  
  renderWebGL() {
    // Implementación WebGL para renderizado eficiente
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Renderizado de partículas con instancing
    this.renderCanvas2D(); // Fallback por ahora
  }
  
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    if (this.gl) {
      this.gl.viewport(0, 0, width, height);
    }
  }
  
  destroy() {
    if (this.gl) {
      // Limpiar recursos WebGL
      if (this.vertexBuffer) {
        this.gl.deleteBuffer(this.vertexBuffer);
      }
      if (this.program) {
        this.gl.deleteProgram(this.program);
      }
      if (this.vertexShader) {
        this.gl.deleteShader(this.vertexShader);
      }
      if (this.fragmentShader) {
        this.gl.deleteShader(this.fragmentShader);
      }
    }
    this.particles = [];
    this.flowField = null;
  }
}

export default ParticleFlow;
