import React, { useRef, useEffect, useState } from 'react';
import { computeElectricField, generatePotentialGrid } from '../core/electricField';

const CurrentAnimation = ({ nodes = [], width = 600, height = 400, particleCount = 200, speed = 0.5 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [particles, setParticles] = useState([]);
  const [field, setField] = useState([]);

  // Inicializar partículas
  useEffect(() => {
    if (!nodes.length) return;
    
    const { grid } = generatePotentialGrid(nodes, 50, width, height);
    const electricField = computeElectricField(grid, 1, 1);
    setField(electricField);
    
    // Crear partículas aleatorias
    const newParticles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      life: Math.random() * 100 + 50
    }));
    setParticles(newParticles);
  }, [nodes, width, height, particleCount]);

  // Loop de animación
  useEffect(() => {
    if (!canvasRef.current || !field.length || !particles.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const widthSafe = Math.max(1, width);
    const heightSafe = Math.max(1, height);
    
    const animate = () => {
      // Limpiar con fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);
      
      // Actualizar y dibujar partículas
      const updatedParticles = particles.map(p => {
        // Encontrar campo más cercano
        let nearest = null;
        let minDist = Infinity;
        
        const gridX = Math.floor((p.x / widthSafe) * 50);
        const gridY = Math.floor((p.y / heightSafe) * 50);
        
        for (const v of field) {
          const d = Math.sqrt((gridX - v.x) ** 2 + (gridY - v.y) ** 2);
          if (d < minDist) {
            minDist = d;
            nearest = v;
          }
        }
        
        if (nearest) {
          // Actualizar velocidad basada en campo eléctrico
          const mag = Math.max(0.1, nearest.magnitude || 1);
          p.vx = (nearest.ex / mag) * speed;
          p.vy = (nearest.ey / mag) * speed;
        }
        
        // Mover partícula
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        
        // Respawn si sale de pantalla o muere
        if (p.x < 0 || p.x > widthSafe || p.y < 0 || p.y > heightSafe || p.life <= 0) {
          p.x = Math.random() * widthSafe;
          p.y = Math.random() * heightSafe;
          p.life = Math.random() * 100 + 50;
        }
        
        // Dibujar partícula
        const alpha = Math.min(p.life / 50, 1);
        ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
        
        return p;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [field, particles, width, height, speed]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg shadow border bg-black"
    />
  );
};

export default CurrentAnimation;
