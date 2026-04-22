/**
 * Sistema de partículas para animación de corriente
 * Flujo siguiendo gradiente de campo eléctrico
 * Adaptado para trabajar con gradient field simple (2D array)
 */

export class ParticleFlow {
  constructor(canvas, numParticles = 500, engineeringMode = false, riskThresholds = null) {
    this.canvas = canvas;
    this.numParticles = numParticles;
    this.particles = [];
    this.flowField = null;
    this.fieldWidth = 0;
    this.fieldHeight = 0;
    this.engineeringMode = engineeringMode;
    this.riskThresholds = riskThresholds || {
      high: 500,    // V/m or V for high risk
      medium: 250   // V/m or V for medium risk
    };
    
    this.initParticles();
  }
  
  initParticles() {
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: 0,
        vy: 0,
        life: Math.random() * 100,
        speed: 0.5 + Math.random() * 1.5
      });
    }
  }
  
  setFlowField(field) {
    this.flowField = field;
    this.fieldHeight = field.length;
    this.fieldWidth = field[0]?.length || 0;
  }
  
  update(deltaTime = 0.016) {
    const scaleX = this.fieldWidth / this.canvas.width;
    const scaleY = this.fieldHeight / this.canvas.height;
    const maxMag = this.flowField?.maxMagnitude || 1;

    for (const p of this.particles) {
      if (this.flowField) {
        // Convert canvas coordinates to field coordinates
        const fieldX = Math.floor(p.x * scaleX);
        const fieldY = Math.floor(p.y * scaleY);
        
        // Get velocity from gradient field
        const v = this.flowField?.[fieldY]?.[fieldX];
        
        if (v) {
          if (this.engineeringMode) {
            // Engineering mode: constant speed, direction only
            const constantSpeed = 2;
            p.vx = v.dirX * constantSpeed;
            p.vy = v.dirY * constantSpeed;
          } else {
            // Visual mode: speed proportional to gradient magnitude
            const speedFactor = Math.min(1, v.mag / maxMag) * 3;
            p.vx = v.dirX * speedFactor;
            p.vy = v.dirY * speedFactor;
          }
        }
      }
      
      // Update position
      p.x += p.vx * deltaTime * 50;
      p.y += p.vy * deltaTime * 50;
      
      // Decrease life
      p.life -= deltaTime * 0.5;
      
      // Respawn dead particles or out of bounds
      if (p.life <= 0 || p.x < 0 || p.x > this.canvas.width || p.y < 0 || p.y > this.canvas.height) {
        p.x = Math.random() * this.canvas.width;
        p.y = Math.random() * this.canvas.height;
        p.vx = 0;
        p.vy = 0;
        p.life = 50 + Math.random() * 50;
      }
    }
  }
  
  render(ctx) {
    const maxMag = this.flowField?.maxMagnitude || 1;
    const scaleX = this.fieldWidth / this.canvas.width;
    const scaleY = this.fieldHeight / this.canvas.height;

    for (const p of this.particles) {
      const speed = Math.hypot(p.vx, p.vy);
      const alpha = (p.life / 100) * 0.8;
      
      let r, g, b, intensity;

      if (this.engineeringMode) {
        // Engineering mode: color based on risk thresholds
        const fieldX = Math.floor(p.x * scaleX);
        const fieldY = Math.floor(p.y * scaleY);
        const v = this.flowField?.[fieldY]?.[fieldX];
        
        const mag = v?.mag || 0;
        
        // Risk-based coloring
        if (mag >= this.riskThresholds.high) {
          // High risk - red
          r = 255;
          g = 0;
          b = 0;
          intensity = 1;
        } else if (mag >= this.riskThresholds.medium) {
          // Medium risk - orange
          r = 255;
          g = 165;
          b = 0;
          intensity = 0.7;
        } else {
          // Safe - green
          r = 0;
          g = 255;
          b = 0;
          intensity = 0.4;
        }
      } else {
        // Visual mode: cyan for fast, blue for slow
        intensity = Math.min(1, speed / 3);
        r = Math.floor(0);
        g = Math.floor(255 * intensity);
        b = Math.floor(255);
      }
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5 + intensity, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
    }
  }
  
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }
  
  destroy() {
    this.particles = [];
    this.flowField = null;
  }
}

export default ParticleFlow;
