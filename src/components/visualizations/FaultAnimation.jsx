import React, { useState, useEffect, useRef } from 'react';
import { Zap, Shield, AlertTriangle, Activity, ArrowDown, TrendingUp, Battery, Gauge, Layers, Play, Square, Pause, RotateCw, Sliders, Thermometer } from 'lucide-react';

const FaultAnimation = ({ params, darkMode, onSimulate }) => {
  // ============================================
  // ESTADO PRINCIPAL
  // ============================================
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [faultCurrent, setFaultCurrent] = useState(0);
  const [gpr, setGpr] = useState(0);
  const [gridCurrent, setGridCurrent] = useState(0);
  const [stepVoltage, setStepVoltage] = useState(0);
  const [touchVoltage, setTouchVoltage] = useState(0);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [animationMode, setAnimationMode] = useState('mode1');
  const [isLooping, setIsLooping] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [heatMapData, setHeatMapData] = useState([]);
  const [frameId, setFrameId] = useState(0);
  
  // Estados para Modo 1
  const [particles, setParticles] = useState([]);
  const [ripples, setRipples] = useState([]);
  const canvasRef = useRef(null);

  // Estados para Modo 2
  const [currentWave, setCurrentWave] = useState([]);
  const chartRef = useRef(null);

  // Estados para Modo 3
  const [voltageGradient, setVoltageGradient] = useState([]);
  const gridRef = useRef(null);

  // Estados para Modo 4
  const heatmapRef = useRef(null);

  const animationRef = useRef(null);
  const loopRef = useRef(null);

  // ============================================
  // PARÁMETROS
  // ============================================
  const {
    transformerKVA = 75,
    voltage = 13200,
    faultDuration = 0.5,
    gridResistance = 3.0,
    soilResistivity = 100,
    gridLength = 30,
    gridWidth = 16,
    rodLength = 3,
    numRods = 45,
    surfaceLayer = 10000,
    surfaceDepth = 0.2
  } = params;

  // ============================================
  // CÁLCULOS
  // ============================================
  const calculateFaultCurrent = () => {
    const maxCurrent = (transformerKVA * 1000) / (voltage * Math.sqrt(3));
    const reduction = 1 / (1 + gridResistance / 10);
    return maxCurrent * reduction;
  };

  const maxFaultCurrent = calculateFaultCurrent();
  const percentOfMax = (faultCurrent / maxFaultCurrent) * 100;

  const calculateStepAndTouch = (current) => {
    const Cs = 1 - (0.09 * (1 - soilResistivity / surfaceLayer)) / (2 * surfaceDepth + 0.09);
    const stepFactor = 0.15;
    const touchFactor = 0.5;
    return {
      step: current * gridResistance * stepFactor * Cs,
      touch: current * gridResistance * touchFactor * Cs,
      Cs
    };
  };

  // ============================================
  // CÁLCULOS IEEE STD 80 - PROTECCIÓN
  // ============================================
  const calculateIEEE80Protection = () => {
    const Cs = 1 - (0.09 * (1 - soilResistivity / surfaceLayer)) / (2 * surfaceDepth + 0.09);
    
    // Tensión de contacto tolerable sin capa superficial (IEEE 80)
    const k = 0.157; // Factor para peso de 70kg
    const EtouchWithoutSurface = (1000 + 1.5 * Cs * soilResistivity) * (k / Math.sqrt(faultDuration));
    
    // Tensión de contacto tolerable con capa superficial
    const EtouchWithSurface = (1000 + 1.5 * Cs * surfaceLayer) * (k / Math.sqrt(faultDuration));
    
    // Incremento de seguridad
    const safetyIncrease = ((EtouchWithSurface - EtouchWithoutSurface) / EtouchWithoutSurface) * 100;
    
    // Profundidad efectiva de la capa superficial
    const effectiveDepth = surfaceDepth + 0.09;
    
    // Área de influencia (aproximada)
    const area = gridLength * gridWidth;
    const influenceArea = area * 1.5;
    
    // Resistividad equivalente
    const equivalentResistivity = (soilResistivity * surfaceLayer) / (soilResistivity + surfaceLayer) * 1000;
    
    return {
      Cs: Cs.toFixed(3),
      EtouchWithoutSurface: Math.round(EtouchWithoutSurface),
      EtouchWithSurface: Math.round(EtouchWithSurface),
      safetyIncrease: safetyIncrease.toFixed(0),
      effectiveDepth: effectiveDepth.toFixed(1),
      influenceArea: Math.round(influenceArea),
      equivalentResistivity: Math.round(equivalentResistivity)
    };
  };

  const ieee80Data = calculateIEEE80Protection();

  // ============================================
  // FUNCIÓN PRINCIPAL DE ANIMACIÓN
  // ============================================
  const startAnimation = (mode) => {
    // Detener animaciones existentes
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (loopRef.current) clearTimeout(loopRef.current);

    setIsSimulating(true);
    setAnimationProgress(0);

    // Preparar según modo
    if (mode === 'mode1') {
      const newParticles = [];
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 120 + Math.random() * 80;
        newParticles.push({
          id: i,
          x: 50 + Math.cos(angle) * radius,
          y: 50 + Math.sin(angle) * radius,
          targetX: 50,
          targetY: 50,
          progress: 0,
          speed: 0.01 + Math.random() * 0.02,
          size: 2 + Math.random() * 4,
          angle: angle
        });
      }
      setParticles(newParticles);

      const newRipples = [];
      for (let i = 0; i < 5; i++) {
        newRipples.push({ id: i, radius: 30, opacity: 0.8, active: true });
      }
      setRipples(newRipples);
    }

    if (mode === 'mode2') {
      setCurrentWave([]);
    }

    if (mode === 'mode3') {
      const gradient = [];
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          const x = (i - 5) * 20;
          const y = (j - 5) * 20;
          const dist = Math.sqrt(x * x + y * y);
          const voltage = maxFaultCurrent * gridResistance * Math.exp(-dist / 50);
          gradient.push({ x: i * 40, y: j * 40, voltage });
        }
      }
      setVoltageGradient(gradient);
    }

    if (mode === 'mode4') {
      const heatmap = [];
      const gridSize = 20;
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const x = (i / gridSize) * 400;
          const y = (j / gridSize) * 400;
          const centerX = 200;
          const centerY = 200;
          const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          const baseIntensity = Math.exp(-dist / 80);
          heatmap.push({
            x,
            y,
            intensity: baseIntensity,
            voltage: maxFaultCurrent * gridResistance * baseIntensity
          });
        }
      }
      setHeatMapData(heatmap);
    }

    runAnimationCycle(mode);
  };

  const runAnimationCycle = (mode) => {
    let startTime = null;
    const duration = 2500 / animationSpeed;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);

      let currentFactor;
      if (progress < 0.2) {
        currentFactor = progress / 0.2;
      } else if (progress < 0.5) {
        currentFactor = 1;
      } else {
        currentFactor = 1 - (progress - 0.5) / 0.5 * 0.95;
      }

      const currentValue = maxFaultCurrent * currentFactor;
      setFaultCurrent(currentValue);
      setGridCurrent(currentValue * 0.85);
      setGpr(currentValue * gridResistance);

      const { step, touch } = calculateStepAndTouch(currentValue);
      setStepVoltage(step);
      setTouchVoltage(touch);
      setAnimationProgress(progress);

      // Actualizar Modo 1
      if (mode === 'mode1') {
        setParticles(prev => prev.map(p => ({
          ...p,
          progress: Math.min(1, p.progress + p.speed),
          x: 50 + Math.cos(p.angle) * (120 + Math.random() * 80) * (1 - p.progress),
          y: 50 + Math.sin(p.angle) * (120 + Math.random() * 80) * (1 - p.progress),
        })).filter(p => p.progress < 1));

        setRipples(prev => prev.map(r => ({
          ...r,
          radius: r.radius + 3,
          opacity: r.opacity - 0.02
        })).filter(r => r.opacity > 0));

        if (progress < 0.8 && Math.random() < 0.1) {
          setRipples(prev => [...prev, { id: Date.now(), radius: 30, opacity: 0.7, active: true }]);
        }

        if (progress < 0.8 && particles.length < 40 && Math.random() < 0.15) {
          const angle = Math.random() * Math.PI * 2;
          setParticles(prev => [...prev, {
            id: Date.now(),
            x: 50 + Math.cos(angle) * 180,
            y: 50 + Math.sin(angle) * 180,
            targetX: 50,
            targetY: 50,
            progress: 0,
            speed: 0.015 + Math.random() * 0.02,
            size: 2 + Math.random() * 4,
            angle: angle
          }]);
        }
      }

      // Actualizar Modo 2
      if (mode === 'mode2') {
        setCurrentWave(prev => {
          const newPoint = { time: elapsed / 1000, current: currentValue };
          const newWave = [...prev, newPoint];
          if (newWave.length > 50) newWave.shift();
          return newWave;
        });
      }

      // Actualizar Modo 3
      if (mode === 'mode3') {
        setVoltageGradient(prev => prev.map(p => ({
          ...p,
          voltage: currentValue * gridResistance * Math.exp(-Math.sqrt(Math.pow(p.x - 200, 2) + Math.pow(p.y - 200, 2)) / 50)
        })));
      }

      // Actualizar Modo 4
      if (mode === 'mode4') {
        setHeatMapData(prev => prev.map(p => {
          const centerX = 200;
          const centerY = 200;
          const dist = Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
          const baseIntensity = Math.exp(-dist / 80);
          return {
            ...p,
            intensity: baseIntensity * currentFactor,
            voltage: currentValue * gridResistance * baseIntensity
          };
        }));
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsSimulating(false);
        
        // Si está en bucle, reiniciar después de una pausa
        if (isLooping) {
          loopRef.current = setTimeout(() => {
            startAnimation(mode);
          }, 500);
        } else {
          // Si no hay bucle, resetear valores
          setFaultCurrent(0);
          setGridCurrent(0);
          setGpr(0);
          setStepVoltage(0);
          setTouchVoltage(0);
          setParticles([]);
          setRipples([]);
          setCurrentWave([]);
          setHeatMapData([]);
        }
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    if (onSimulate) onSimulate({ 
      faultCurrent: maxFaultCurrent, 
      gpr: maxFaultCurrent * gridResistance,
      gridCurrent: maxFaultCurrent * 0.85
    });
  };

  // ============================================
  // DETENER ANIMACIÓN
  // ============================================
  const stopAnimation = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (loopRef.current) clearTimeout(loopRef.current);
    setIsSimulating(false);
    setIsPaused(false);
    setFaultCurrent(0);
    setGridCurrent(0);
    setGpr(0);
    setStepVoltage(0);
    setTouchVoltage(0);
    setParticles([]);
    setRipples([]);
    setCurrentWave([]);
    setVoltageGradient([]);
    setHeatMapData([]); // Limpiar voltageGradient
    setAnimationProgress(0);
  };

  // ============================================
  // PAUSAR/REANUDAR ANIMACIÓN
  // ============================================
  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      if (isSimulating) {
        runAnimationCycle(animationMode);
      }
    } else {
      setIsPaused(true);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  };

  // ============================================
  // CAMBIAR MODO CON REPRODUCCIÓN AUTOMÁTICA
  // ============================================
  const handleModeChange = (mode) => {
    setAnimationMode(mode);
    // Detener todo
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (loopRef.current) clearTimeout(loopRef.current);
    // Limpiar estados
    setParticles([]);
    setRipples([]);
    setCurrentWave([]);
    setVoltageGradient([]);
    setHeatMapData([]);
    setFaultCurrent(0);
    setGridCurrent(0);
    setGpr(0);
    setAnimationProgress(0);
    // Iniciar nuevo ciclo automáticamente
    setTimeout(() => startAnimation(mode), 100);
  };

  // ============================================
  // INICIAR AL MONTAR EL COMPONENTE
  // ============================================
  useEffect(() => {
    startAnimation(animationMode);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (loopRef.current) clearTimeout(loopRef.current);
    };
  }, []);

  // ============================================
  // DIBUJAR CANVAS (MODO 1)
  // ============================================
  useEffect(() => {
    if (animationMode !== 'mode1') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Fondo con gradiente radial más elaborado
    const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width);
    bgGradient.addColorStop(0, darkMode ? '#1f2937' : '#f3f4f6');
    bgGradient.addColorStop(1, darkMode ? '#111827' : '#e5e7eb');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Efecto de partículas de fondo más dinámico
    ctx.fillStyle = darkMode ? '#374151' : '#e5e7eb';
    for (let i = 0; i < 300; i++) {
      const size = Math.random() * 2 + 1;
      const x = Math.random() * width;
      const y = Math.random() * height;
      const opacity = Math.random() * 0.3 + 0.1;
      ctx.fillStyle = darkMode ? `rgba(75, 85, 99, ${opacity})` : `rgba(156, 163, 175, ${opacity})`;
      ctx.fillRect(x, y, size, size);
    }
    
    const intensity = Math.min(1, faultCurrent / maxFaultCurrent);
    
    // Ondas de choque con efecto de brillo y múltiples capas
    ripples.forEach((ripple, index) => {
      // Onda principal
      ctx.beginPath();
      ctx.arc(centerX, centerY, ripple.radius, 0, 2 * Math.PI);
      const rippleGradient = ctx.createRadialGradient(centerX, centerY, ripple.radius - 10, centerX, centerY, ripple.radius + 10);
      rippleGradient.addColorStop(0, `rgba(239, 68, 68, 0)`);
      rippleGradient.addColorStop(0.5, `rgba(239, 68, 68, ${ripple.opacity * 0.6})`);
      rippleGradient.addColorStop(1, `rgba(239, 68, 68, 0)`);
      ctx.strokeStyle = rippleGradient;
      ctx.lineWidth = 4 + intensity * 4;
      ctx.shadowBlur = 15 * ripple.opacity;
      ctx.shadowColor = '#ef4444';
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Onda secundaria (eco)
      if (ripple.radius > 30) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, ripple.radius - 15, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(251, 191, 36, ${ripple.opacity * 0.3})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    
    // Líneas de flujo de corriente con efectos mejorados
    for (let i = 0; i < 72; i++) {
      const angle = (i * 5) * Math.PI / 180;
      const startRadius = 60 + intensity * 40;
      const endRadius = 180 + intensity * 60;
      
      const startX = centerX + Math.cos(angle) * startRadius;
      const startY = centerY + Math.sin(angle) * startRadius;
      const endX = centerX + Math.cos(angle) * endRadius;
      const endY = centerY + Math.sin(angle) * endRadius;
      
      // Línea principal con gradiente
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, `rgba(239, 68, 68, ${0.9 + intensity * 0.1})`);
      gradient.addColorStop(0.5, `rgba(249, 115, 22, ${0.7 + intensity * 0.2})`);
      gradient.addColorStop(1, `rgba(245, 158, 11, ${0.4 + intensity * 0.3})`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3 + intensity * 6;
      ctx.shadowBlur = 10 * intensity;
      ctx.shadowColor = '#ef4444';
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Flecha mejorada con efecto de brillo
      const arrowX = startX;
      const arrowY = startY;
      const arrowAngle = angle + Math.PI;
      const arrowSize = 8 + intensity * 4;
      
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - arrowSize * Math.cos(arrowAngle - 0.4), arrowY - arrowSize * Math.sin(arrowAngle - 0.4));
      ctx.lineTo(arrowX - arrowSize * Math.cos(arrowAngle + 0.4), arrowY - arrowSize * Math.sin(arrowAngle + 0.4));
      ctx.closePath();
      
      const arrowGradient = ctx.createRadialGradient(arrowX, arrowY, 0, arrowX, arrowY, arrowSize);
      arrowGradient.addColorStop(0, `rgba(255, 255, 255, ${0.5 + intensity * 0.3})`);
      arrowGradient.addColorStop(0.3, `rgba(239, 68, 68, ${0.8 + intensity * 0.2})`);
      arrowGradient.addColorStop(0.7, `rgba(185, 28, 28, 0.6)`);
      arrowGradient.addColorStop(1, `rgba(185, 28, 28, 0)`);
      ctx.fillStyle = arrowGradient;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ef4444';
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Líneas secundarias (efecto de campo eléctrico)
      if (intensity > 0.5) {
        for (let j = 0; j < 3; j++) {
          const offsetAngle = angle + (j - 1) * 0.1;
          const offsetStartX = centerX + Math.cos(offsetAngle) * (startRadius + 5);
          const offsetStartY = centerY + Math.sin(offsetAngle) * (startRadius + 5);
          const offsetEndX = centerX + Math.cos(offsetAngle) * (endRadius - 10);
          const offsetEndY = centerY + Math.sin(offsetAngle) * (endRadius - 10);
          
          ctx.beginPath();
          ctx.moveTo(offsetStartX, offsetStartY);
          ctx.lineTo(offsetEndX, offsetEndY);
          ctx.strokeStyle = `rgba(249, 115, 22, ${(intensity - 0.5) * 0.4})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    
    // Malla de tierra mejorada con efectos de brillo
    const gridRadius = 50 + intensity * 15;
    
    // Círculo central con gradiente
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, gridRadius);
    centerGradient.addColorStop(0, `rgba(251, 191, 36, ${0.2 + intensity * 0.4})`);
    centerGradient.addColorStop(0.7, `rgba(245, 158, 11, ${0.1 + intensity * 0.2})`);
    centerGradient.addColorStop(1, `rgba(217, 119, 6, 0)`);
    ctx.beginPath();
    ctx.arc(centerX, centerY, gridRadius, 0, 2 * Math.PI);
    ctx.fillStyle = centerGradient;
    ctx.fill();
    
    // Borde exterior con efecto de brillo
    ctx.beginPath();
    ctx.arc(centerX, centerY, gridRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.8 + intensity * 0.2})`;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 20 * intensity;
    ctx.shadowColor = '#fbbf24';
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Líneas de la malla mejoradas
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.7 + intensity * 0.2})`;
    ctx.lineWidth = 2;
    for (let i = -4; i <= 4; i++) {
      const offset = i * 10;
      ctx.beginPath();
      ctx.moveTo(centerX + offset, centerY - 40);
      ctx.lineTo(centerX + offset, centerY + 40);
      ctx.moveTo(centerX - 40, centerY + offset);
      ctx.lineTo(centerX + 40, centerY + offset);
      ctx.stroke();
    }
    
    // Puntos de intersección con efecto de brillo
    for (let i = -4; i <= 4; i++) {
      for (let j = -4; j <= 4; j++) {
        const pointX = centerX + i * 10;
        const pointY = centerY + j * 10;
        ctx.beginPath();
        ctx.arc(pointX, pointY, 3 + intensity * 2, 0, 2 * Math.PI);
        const pointGradient = ctx.createRadialGradient(pointX, pointY, 0, pointX, pointY, 5);
        pointGradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 + intensity * 0.2})`);
        pointGradient.addColorStop(0.5, `rgba(251, 191, 36, 0.9)`);
        pointGradient.addColorStop(1, `rgba(217, 119, 6, 0.5)`);
        ctx.fillStyle = pointGradient;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#fbbf24';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    
    // Partículas mejoradas con efectos de rastro y brillo
    particles.forEach(particle => {
      const px = particle.x * width / 100;
      const py = particle.y * height / 100;
      const size = particle.size * (1 + intensity * 0.5);
      
      // Rastro de la partícula
      const trailLength = 15 * particle.progress;
      const trailGradient = ctx.createLinearGradient(
        px - Math.cos(particle.angle) * trailLength,
        py - Math.sin(particle.angle) * trailLength,
        px, py
      );
      trailGradient.addColorStop(0, `rgba(239, 68, 68, 0)`);
      trailGradient.addColorStop(1, `rgba(239, 68, 68, ${0.6 + intensity * 0.3})`);
      ctx.beginPath();
      ctx.moveTo(px - Math.cos(particle.angle) * trailLength, py - Math.sin(particle.angle) * trailLength);
      ctx.lineTo(px, py);
      ctx.strokeStyle = trailGradient;
      ctx.lineWidth = size * 0.8;
      ctx.stroke();
      
      // Partícula principal con efecto de brillo
      ctx.beginPath();
      ctx.arc(px, py, size, 0, 2 * Math.PI);
      const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, size * 2);
      particleGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 + intensity * 0.1})`);
      particleGradient.addColorStop(0.3, `rgba(239, 68, 68, 0.9)`);
      particleGradient.addColorStop(0.7, `rgba(185, 28, 28, 0.6)`);
      particleGradient.addColorStop(1, `rgba(185, 28, 28, 0)`);
      ctx.fillStyle = particleGradient;
      ctx.shadowBlur = 15 * intensity;
      ctx.shadowColor = '#ef4444';
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    
    // Etiqueta de punto de falla mejorada
    if (faultCurrent > 0) {
      // Círculo de alerta pulsante
      const pulseRadius = 25 + Math.sin(Date.now() / 200) * 5;
      ctx.beginPath();
      ctx.arc(centerX + 80, centerY - 70, pulseRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + Math.sin(Date.now() / 200) * 0.3})`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ef4444';
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Texto con efecto de brillo
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ef4444';
      ctx.fillText('⚡ PUNTO DE FALLA', centerX + 55, centerY - 65);
      ctx.shadowBlur = 0;
      
      // Indicador mejorado
      ctx.beginPath();
      ctx.moveTo(centerX + 70, centerY - 50);
      ctx.lineTo(centerX + 45, centerY - 35);
      ctx.lineTo(centerX + 45, centerY - 55);
      ctx.closePath();
      const indicatorGradient = ctx.createLinearGradient(centerX + 70, centerY - 50, centerX + 45, centerY - 45);
      indicatorGradient.addColorStop(0, '#ef4444');
      indicatorGradient.addColorStop(1, '#dc2626');
      ctx.fillStyle = indicatorGradient;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ef4444';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    
    // Etiqueta de malla mejorada
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = darkMode ? '#fbbf24' : '#d97706';
    ctx.shadowBlur = 8;
    ctx.shadowColor = darkMode ? '#fbbf24' : '#d97706';
    ctx.fillText('MALLA DE TIERRA', centerX - 55, centerY - 45);
    ctx.shadowBlur = 0;
  }, [faultCurrent, isSimulating, particles, ripples, maxFaultCurrent, darkMode, animationMode]);

  // ============================================
  // DIBUJAR GRÁFICO DE ONDA (MODO 2)
  // ============================================
  useEffect(() => {
    if (animationMode !== 'mode2') return;
    
    const canvas = chartRef.current;
    if (!canvas || currentWave.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Fondo con gradiente
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, darkMode ? '#1f2937' : '#f8fafc');
    bgGradient.addColorStop(1, darkMode ? '#111827' : '#e2e8f0');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Grid de fondo
    ctx.strokeStyle = darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    const maxCurrentVal = Math.max(...currentWave.map(p => p.current), maxFaultCurrent);
    const scaleY = height / maxCurrentVal;
    const scaleX = width / 0.5;
    
    // Área bajo la curva con gradiente
    ctx.beginPath();
    ctx.moveTo(0, height);
    currentWave.forEach((point, i) => {
      const x = point.time * scaleX;
      const y = height - point.current * scaleY;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(currentWave[currentWave.length - 1].time * scaleX, height);
    ctx.closePath();
    
    const areaGradient = ctx.createLinearGradient(0, 0, 0, height);
    areaGradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
    areaGradient.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
    ctx.fillStyle = areaGradient;
    ctx.fill();
    
    // Línea principal con efecto de brillo
    ctx.beginPath();
    ctx.moveTo(currentWave[0].time * scaleX, height - currentWave[0].current * scaleY);
    for (let i = 1; i < currentWave.length; i++) {
      const x = currentWave[i].time * scaleX;
      const y = height - currentWave[i].current * scaleY;
      ctx.lineTo(x, y);
    }
    
    const lineGradient = ctx.createLinearGradient(0, 0, width, 0);
    lineGradient.addColorStop(0, '#ef4444');
    lineGradient.addColorStop(0.5, '#f97316');
    lineGradient.addColorStop(1, '#ef4444');
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ef4444';
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Puntos destacados en la onda
    currentWave.forEach((point, i) => {
      if (i % 5 === 0) {
        const x = point.time * scaleX;
        const y = height - point.current * scaleY;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ef4444';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
    
    // Eje X con etiquetas
    ctx.fillStyle = darkMode ? '#9ca3af' : '#6b7280';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const x = (width / 5) * i;
      const time = (i * 0.1).toFixed(1);
      ctx.fillText(`${time}s`, x, height - 5);
    }
    
    // Eje Y con etiquetas
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = height - (height / 5) * i;
      const currentVal = (maxCurrentVal * i / 5).toFixed(0);
      ctx.fillText(`${currentVal}A`, 25, y + 3);
    }
    
    // Títulos mejorados
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ef4444';
    ctx.fillText('Corriente de Falla (A)', 30, 18);
    ctx.shadowBlur = 0;
    
    ctx.textAlign = 'right';
    ctx.fillStyle = darkMode ? '#9ca3af' : '#6b7280';
    ctx.fillText('Tiempo (s)', width - 10, height - 5);
  }, [currentWave, maxFaultCurrent, darkMode, animationMode]);

  // ============================================
  // DIBUJAR GRADIENTE DE VOLTAJE (MODO 3)
  // ============================================
  useEffect(() => {
    if (animationMode !== 'mode3') return;
    
    const canvas = gridRef.current;
    if (!canvas || voltageGradient.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Fondo con gradiente radial
    const bgGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
    bgGradient.addColorStop(0, darkMode ? '#1f2937' : '#f3f4f6');
    bgGradient.addColorStop(1, darkMode ? '#111827' : '#e5e7eb');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    const maxVoltage = Math.max(...voltageGradient.map(v => v.voltage), 1);
    
    // Dibujar puntos de gradiente con efectos mejorados
    voltageGradient.forEach(point => {
      const intensity = point.voltage / maxVoltage;
      const red = Math.floor(239 * intensity);
      const green = Math.floor(68 * (1 - intensity));
      const blue = Math.floor(68 * (1 - intensity));
      
      // Círculo con gradiente
      const pointGradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 20);
      pointGradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0.8)`);
      pointGradient.addColorStop(0.5, `rgba(${red}, ${green}, ${blue}, 0.4)`);
      pointGradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);
      
      ctx.beginPath();
      ctx.arc(point.x, point.y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = pointGradient;
      ctx.fill();
      
      // Punto central brillante
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + intensity * 0.3})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgb(${red}, ${green}, ${blue})`;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    
    // Líneas de contorno (isopletas)
    ctx.strokeStyle = darkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)';
    ctx.lineWidth = 1;
    for (let level = 0.2; level <= 1; level += 0.2) {
      ctx.beginPath();
      let firstPoint = true;
      voltageGradient.forEach(point => {
        if (point.voltage / maxVoltage >= level - 0.1 && point.voltage / maxVoltage <= level + 0.1) {
          if (firstPoint) {
            ctx.moveTo(point.x, point.y);
            firstPoint = false;
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }
      });
      ctx.stroke();
    }
    
    // Malla de tierra mejorada
    const gridX = 180;
    const gridY = 180;
    const gridSize = 40;
    
    // Rectángulo con efecto de brillo
    ctx.strokeStyle = darkMode ? '#fbbf24' : '#d97706';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = darkMode ? '#fbbf24' : '#d97706';
    ctx.strokeRect(gridX, gridY, gridSize, gridSize);
    ctx.shadowBlur = 0;
    
    // Líneas internas de la malla
    ctx.strokeStyle = darkMode ? 'rgba(251, 191, 36, 0.5)' : 'rgba(217, 119, 6, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const offset = (gridSize / 4) * i;
      ctx.beginPath();
      ctx.moveTo(gridX + offset, gridY);
      ctx.lineTo(gridX + offset, gridY + gridSize);
      ctx.moveTo(gridX, gridY + offset);
      ctx.lineTo(gridX + gridSize, gridY + offset);
      ctx.stroke();
    }
    
    // Puntos de intersección
    for (let i = 0; i <= 4; i++) {
      for (let j = 0; j <= 4; j++) {
        const px = gridX + (gridSize / 4) * i;
        const py = gridY + (gridSize / 4) * j;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, 2 * Math.PI);
        ctx.fillStyle = darkMode ? '#fbbf24' : '#d97706';
        ctx.fill();
      }
    }
    
    // Etiqueta
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = darkMode ? '#fbbf24' : '#d97706';
    ctx.shadowBlur = 8;
    ctx.shadowColor = darkMode ? '#fbbf24' : '#d97706';
    ctx.fillText('MALLA DE TIERRA', gridX - 10, gridY - 15);
    ctx.shadowBlur = 0;
    
    // Leyenda de colores
    const legendY = height - 30;
    for (let i = 0; i < 10; i++) {
      const x = 20 + i * 15;
      const intensity = i / 9;
      const red = Math.floor(255 * intensity);
      const green = Math.floor(255 * (1 - intensity) * 0.5);
      const blue = Math.floor(255 * (1 - intensity));
      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
      ctx.fillRect(x, legendY, 15, 10);
    }
    ctx.fillStyle = darkMode ? '#9ca3af' : '#6b7280';
    ctx.font = '9px sans-serif';
    ctx.fillText('Bajo', 20, legendY + 20);
    ctx.fillText('Alto', 155, legendY + 20);
  }, [heatMapData, darkMode, animationMode, maxFaultCurrent, gridResistance]);

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        togglePause();
      } else if (e.key === 'Escape') {
        stopAnimation();
      } else if (e.key === '1') {
        handleModeChange('mode1');
      } else if (e.key === '2') {
        handleModeChange('mode2');
      } else if (e.key === '3') {
        handleModeChange('mode3');
      } else if (e.key === '4') {
        handleModeChange('mode4');
      } else if (e.key === 'r' || e.key === 'R') {
        startAnimation(animationMode);
      } else if (e.key === 'l' || e.key === 'L') {
        setIsLooping(!isLooping);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSimulating, isPaused, animationMode, isLooping]);

  // ============================================
  // ESTILOS
  // ============================================
  const colors = darkMode ? {
    bg: 'bg-gray-800',
    card: 'bg-gray-700',
    text: 'text-white',
    textSecondary: 'text-gray-300',
    border: 'border-gray-600',
    fault: 'text-red-400',
    gpr: 'text-yellow-400',
    grid: 'text-blue-400',
    step: 'text-green-400',
    touch: 'text-orange-400'
  } : {
    bg: 'bg-white',
    card: 'bg-gray-50',
    text: 'text-gray-800',
    textSecondary: darkMode ? 'text-gray-100' : 'text-gray-600',
    border: 'border-gray-200',
    fault: 'text-red-600',
    gpr: 'text-yellow-600',
    grid: 'text-blue-600',
    step: 'text-green-600',
    touch: 'text-orange-600'
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={`p-4 rounded-lg ${colors.bg} shadow-md`}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className={`text-lg font-semibold ${colors.text} flex items-center gap-2`}>
          <Zap size={20} /> Simulación de Corriente de Falla
        </h3>
        
        {/* Controles de reproducción */}
        <div className="flex gap-2">
          <button
            onClick={() => isSimulating ? togglePause() : startAnimation(animationMode)}
            disabled={!isSimulating && !isPaused}
            className={`px-3 py-1 text-sm rounded-lg transition-all flex items-center gap-1 ${
              isSimulating && !isPaused
                ? 'bg-yellow-600 text-white'
                : isPaused
                ? 'bg-green-600 text-white'
                : darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={isPaused ? 'Reanudar' : 'Pausar'}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? 'Reanudar' : 'Pausar'}
          </button>
          <button
            onClick={stopAnimation}
            disabled={!isSimulating && !isPaused}
            className={`px-3 py-1 text-sm rounded-lg transition-all flex items-center gap-1 ${
              !isSimulating && !isPaused
                ? darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
            title="Detener"
          >
            <Square size={14} /> Detener
          </button>
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`px-3 py-1 text-sm rounded-lg transition-all flex items-center gap-1 ${
              isLooping
                ? 'bg-green-600 text-white'
                : darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={isLooping ? 'Reproducción en bucle activada' : 'Reproducción en bucle desactivada'}
          >
            {isLooping ? <Play size={14} /> : <Square size={14} />}
            {isLooping ? 'Bucle ON' : 'Bucle OFF'}
          </button>
          <button
            onClick={() => setShowAdvancedControls(!showAdvancedControls)}
            className={`px-3 py-1 text-sm rounded-lg transition-all flex items-center gap-1 ${
              showAdvancedControls
                ? 'bg-purple-600 text-white'
                : darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Controles avanzados"
          >
            <Sliders size={14} /> Avanzado
          </button>
        </div>

        {showAdvancedControls && (
          <div className={`mt-2 p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} border ${colors.border}`}>
            <div className="flex items-center gap-3">
              <span className={`text-sm ${darkMode ? 'text-white' : ''}`}>Velocidad:</span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                className="w-24"
              />
              <span className={`text-sm font-semibold ${darkMode ? 'text-white' : ''}`}>{animationSpeed}x</span>
              <button
                onClick={() => setAnimationSpeed(1)}
                className="text-xs px-2 py-1 rounded bg-gray-500 hover:bg-gray-600 text-white"
                title="Restaurar velocidad"
              >
                <RotateCw size={12} />
              </button>
            </div>
          </div>
        )}
        
        {/* Selector de modo */}
        <div className="flex gap-2">
          <button
            onClick={() => handleModeChange('mode1')}
            className={`px-3 py-1 text-sm rounded-lg transition-all flex items-center gap-1 ${
              animationMode === 'mode1'
                ? 'bg-blue-600 text-white'
                : darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Activity size={14} /> Modo 1: Flujo Visual
          </button>
          <button
            onClick={() => handleModeChange('mode2')}
            className={`px-3 py-1 text-sm rounded-lg transition-all flex items-center gap-1 ${
              animationMode === 'mode2'
                ? 'bg-blue-600 text-white'
                : darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <TrendingUp size={14} /> Modo 2: Onda Técnica
          </button>
          <button
            onClick={() => handleModeChange('mode3')}
            className={`px-3 py-1 text-sm rounded-lg transition-all flex items-center gap-1 ${
              animationMode === 'mode3'
                ? 'bg-blue-600 text-white'
                : darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Layers size={14} /> Modo 3: Gradiente
          </button>
        </div>
        
        {/* Botón manual */}
        <button
          onClick={() => startAnimation(animationMode)}
          disabled={isSimulating}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            isSimulating 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg'
          }`}
        >
          {isSimulating ? '⚡ SIMULANDO...' : '⚡ REINICIAR'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* MODO 1: Canvas con flujo visual */}
        {animationMode === 'mode1' && (
          <div className={`p-4 rounded-lg ${colors.card} border ${colors.border}`}>
            <h4 className={`font-semibold ${colors.text} mb-3 flex items-center gap-2`}>
              <Activity size={16} /> FLUJO DE CORRIENTE (Visual)
            </h4>
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="w-full h-auto border rounded-lg"
                style={{ maxWidth: '100%', height: 'auto', minHeight: '300px' }}
              />
              <div className={`absolute bottom-2 left-2 right-2 flex justify-between text-[10px] ${darkMode ? 'text-gray-100' : 'text-gray-600'} bg-black/50 px-2 py-1 rounded`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span>⚡ Corriente de falla</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowDown size={10} className="text-red-500" />
                  <span>Flujo → Hacia la malla</span>
                </div>
              </div>
            </div>
            <div className={`mt-3 text-center text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>
              💡 La corriente fluye DESDE el punto de falla HACIA la malla de tierra
            </div>
          </div>
        )}
        
        {/* MODO 2: Gráfico de onda técnica */}
        {animationMode === 'mode2' && (
          <div className={`p-4 rounded-lg ${colors.card} border ${colors.border}`}>
            <h4 className={`font-semibold ${colors.text} mb-3 flex items-center gap-2`}>
              <TrendingUp size={16} /> ONDA DE CORRIENTE (Técnico)
            </h4>
            <canvas
              ref={chartRef}
              width={400}
              height={200}
              className="w-full h-auto border rounded-lg"
              style={{ maxWidth: '100%', height: 'auto', minHeight: '200px' }}
            />
            <div className={`mt-2 text-center text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>
              💡 Corriente de falla vs tiempo (forma de onda típica)
            </div>
          </div>
        )}
        
        {/* MODO 3: Gradiente de voltaje */}
        {animationMode === 'mode3' && (
          <div className={`p-4 rounded-lg ${colors.card} border ${colors.border}`}>
            <h4 className={`font-semibold ${colors.text} mb-3 flex items-center gap-2`}>
              <Layers size={16} /> GRADIENTE DE VOLTAJE (3D)
            </h4>
            <canvas
              ref={gridRef}
              width={400}
              height={400}
              className="w-full h-auto border rounded-lg"
              style={{ maxWidth: '100%', height: 'auto', minHeight: '300px' }}
            />
            <div className={`mt-2 text-center text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>
              💡 Distribución del potencial de tierra alrededor de la malla
            </div>
          </div>
        )}
        
        {/* Panel de parámetros de falla (común) */}
        <div className={`p-4 rounded-lg ${colors.card} border ${colors.border}`} style={{ boxShadow: darkMode ? '0 0 20px rgba(239, 68, 68, 0.3), inset 0 0 10px rgba(239, 68, 68, 0.1)' : '0 0 20px rgba(220, 38, 38, 0.2), inset 0 0 10px rgba(220, 38, 38, 0.05)' }}>
          <h4 className={`font-semibold ${colors.text} mb-4 flex items-center gap-2 text-base`}>
            <AlertTriangle size={16} /> ⚡ PARÁMETROS DE FALLA
          </h4>
          
          <div className="space-y-4">
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-50'}`} style={{ boxShadow: darkMode ? '0 0 15px rgba(239, 68, 68, 0.4), inset 0 0 5px rgba(239, 68, 68, 0.2)' : '0 0 15px rgba(220, 38, 38, 0.3), inset 0 0 5px rgba(220, 38, 38, 0.1)' }}>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${colors.textSecondary}`}>Corriente de Falla (If)</span>
                <span className={`text-2xl font-bold ${colors.fault}`}>
                  {faultCurrent.toFixed(0)} A
                </span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${percentOfMax}%` }}
                />
              </div>
              <div className={`flex justify-between text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-1`}>
                <span>0 A</span>
                <span>{maxFaultCurrent.toFixed(0)} A (máx)</span>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'}`} style={{ boxShadow: darkMode ? '0 0 15px rgba(251, 191, 36, 0.4), inset 0 0 5px rgba(251, 191, 36, 0.2)' : '0 0 15px rgba(217, 119, 6, 0.3), inset 0 0 5px rgba(217, 119, 6, 0.1)' }}>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${colors.textSecondary}`}>Potencial de Tierra (GPR)</span>
                <span className={`text-2xl font-bold ${colors.gpr}`}>
                  {gpr.toFixed(0)} V
                </span>
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-1`}>
                Tensión que alcanza la malla durante la falla
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`} style={{ boxShadow: darkMode ? '0 0 15px rgba(59, 130, 246, 0.4), inset 0 0 5px rgba(59, 130, 246, 0.2)' : '0 0 15px rgba(37, 99, 235, 0.3), inset 0 0 5px rgba(37, 99, 235, 0.1)' }}>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${colors.textSecondary}`}>Corriente en Malla (Ig)</span>
                <span className={`text-2xl font-bold ${colors.grid}`}>
                  {gridCurrent.toFixed(0)} A
                </span>
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'} mt-1`}>
                85% de la corriente total se disipa por la malla
              </div>
            </div>
            
            {animationMode === 'mode2' && (
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`} style={{ boxShadow: darkMode ? '0 0 12px rgba(34, 197, 94, 0.4), inset 0 0 4px rgba(34, 197, 94, 0.2)' : '0 0 12px rgba(22, 163, 74, 0.3), inset 0 0 4px rgba(22, 163, 74, 0.1)' }}>
                  <div className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>Tensión de Paso</div>
                  <div className={`text-lg font-bold ${colors.step}`}>{stepVoltage.toFixed(0)} V</div>
                </div>
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-orange-900/30' : 'bg-orange-50'}`} style={{ boxShadow: darkMode ? '0 0 12px rgba(249, 115, 22, 0.4), inset 0 0 4px rgba(249, 115, 22, 0.2)' : '0 0 12px rgba(234, 88, 12, 0.3), inset 0 0 4px rgba(234, 88, 12, 0.1)' }}>
                  <div className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>Tensión de Contacto</div>
                  <div className={`text-lg font-bold ${colors.touch}`}>{touchVoltage.toFixed(0)} V</div>
                </div>
              </div>
            )}
            
            {isSimulating && (
              <div className="mt-2">
                <div className={`flex justify-between text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'} mb-1`}>
                  <span>Ciclo actual</span>
                  <span>{Math.floor(animationProgress * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full transition-all duration-50"
                    style={{ width: `${animationProgress * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-2 border-t border-gray-600">
              <span className={`text-sm ${colors.textSecondary}`}>Intensidad de falla</span>
              <span className={`text-lg font-bold ${percentOfMax > 50 ? 'text-red-600' : 'text-yellow-600'}`}>
                {percentOfMax.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Nota explicativa */}
      <div className={`mt-4 p-4 rounded-lg border ${darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}`}>
        <p className={`text-sm flex items-start gap-2 ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
          <Shield size={16} className="flex-shrink-0 mt-0.5" />
          <span>
            <strong>✅ Flujo correcto de corriente:</strong> Durante una falla, la corriente fluye 
            <strong className={darkMode ? 'text-red-400' : 'text-red-600'}> DESDE el punto de falla</strong> (equipo energizado) 
            <strong className={darkMode ? 'text-blue-400' : 'text-blue-600'}> HACIA la malla de tierra</strong>, donde se disipa de manera segura.
          </span>
        </p>
      </div>
      
      {/* Datos adicionales */}
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} text-center border ${colors.border}`}>
          <div className={`font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Transformador</div>
          <div className={`text-lg font-bold ${colors.text}`}>{transformerKVA} kVA</div>
        </div>
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} text-center border ${colors.border}`}>
          <div className={`font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tensión</div>
          <div className={`text-lg font-bold ${colors.text}`}>{voltage/1000} kV</div>
        </div>
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} text-center border ${colors.border}`}>
          <div className={`font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Resistencia Malla</div>
          <div className={`text-lg font-bold ${colors.text}`}>{gridResistance} Ω</div>
        </div>
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} text-center border ${colors.border}`}>
          <div className={`font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Corriente Máx</div>
          <div className={`text-lg font-bold ${colors.text}`}>{maxFaultCurrent.toFixed(0)} A</div>
        </div>
      </div>
      
      {/* Indicadores de estado */}
      <div className="mt-3 flex justify-center gap-4">
        <span className={`text-xs px-3 py-1.5 rounded-full ${darkMode ? 'bg-gray-700 text-white border border-gray-600' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
          <Layers size={12} className="inline mr-1" />
          Modo: {animationMode === 'mode1' ? 'Flujo Visual' : animationMode === 'mode2' ? 'Onda Técnica' : 'Gradiente 3D'}
        </span>
        <span className={`text-xs px-3 py-1.5 rounded-full ${isLooping ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700' : darkMode ? 'bg-gray-700 text-white border border-gray-600' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
          {isLooping ? '🔄 Reproducción continua (bucle)' : '⏹️ Un solo ciclo'}
        </span>
      </div>
    </div>
  );
};

export default FaultAnimation;