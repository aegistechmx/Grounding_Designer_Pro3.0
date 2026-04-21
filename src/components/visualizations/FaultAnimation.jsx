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
      touch: current * gridResistance * touchFactor * Cs
    };
  };

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
    
    runAnimationCycle(mode);
  };

  const runAnimationCycle = (mode) => {
    let startTime = null;
    const duration = 2500;
    
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
    
    ctx.fillStyle = darkMode ? '#1f2937' : '#f3f4f6';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = darkMode ? '#374151' : '#e5e7eb';
    for (let i = 0; i < 200; i++) {
      ctx.fillRect(Math.random() * width, Math.random() * height, 2, 1);
    }
    
    ripples.forEach(ripple => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, ripple.radius, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(239, 68, 68, ${ripple.opacity * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    
    const intensity = Math.min(1, faultCurrent / maxFaultCurrent);
    
    for (let i = 0; i < 48; i++) {
      const angle = (i * 7.5) * Math.PI / 180;
      const startRadius = 70 + intensity * 30;
      const endRadius = 150 + intensity * 50;
      
      const startX = centerX + Math.cos(angle) * startRadius;
      const startY = centerY + Math.sin(angle) * startRadius;
      const endX = centerX + Math.cos(angle) * endRadius;
      const endY = centerY + Math.sin(angle) * endRadius;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, `rgba(239, 68, 68, ${0.8 + intensity * 0.2})`);
      gradient.addColorStop(1, `rgba(245, 158, 11, ${0.3 + intensity * 0.3})`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2 + intensity * 5;
      ctx.stroke();
      
      const arrowX = startX;
      const arrowY = startY;
      const arrowAngle = angle + Math.PI;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - 6 * Math.cos(arrowAngle - 0.3), arrowY - 6 * Math.sin(arrowAngle - 0.3));
      ctx.lineTo(arrowX - 6 * Math.cos(arrowAngle + 0.3), arrowY - 6 * Math.sin(arrowAngle + 0.3));
      ctx.fillStyle = `rgba(239, 68, 68, ${0.7 + intensity * 0.3})`;
      ctx.fill();
    }
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 55, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(245, 158, 11, ${0.1 + intensity * 0.3})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(245, 158, 11, ${0.8 + intensity * 0.2})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.beginPath();
    for (let i = -3; i <= 3; i++) {
      const offset = i * 12;
      ctx.moveTo(centerX + offset, centerY - 45);
      ctx.lineTo(centerX + offset, centerY + 45);
      ctx.moveTo(centerX - 45, centerY + offset);
      ctx.lineTo(centerX + 45, centerY + offset);
    }
    ctx.strokeStyle = `rgba(245, 158, 11, ${0.6})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        ctx.beginPath();
        ctx.arc(centerX + i * 12, centerY + j * 12, 2, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(245, 158, 11, ${0.8})`;
        ctx.fill();
      }
    }
    
    particles.forEach(particle => {
      ctx.beginPath();
      ctx.arc(particle.x * width / 100, particle.y * height / 100, particle.size, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(239, 68, 68, ${0.8})`;
      ctx.fill();
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ef4444';
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    
    if (faultCurrent > 0) {
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('⚡ PUNTO DE FALLA', centerX + 70, centerY - 80);
      
      ctx.beginPath();
      ctx.moveTo(centerX + 60, centerY - 65);
      ctx.lineTo(centerX + 40, centerY - 55);
      ctx.lineTo(centerX + 40, centerY - 75);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }
    
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = darkMode ? '#fbbf24' : '#d97706';
    ctx.fillText('MALLA DE TIERRA', centerX - 45, centerY - 30);
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
    
    ctx.fillStyle = darkMode ? '#1f2937' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    
    const maxCurrentVal = Math.max(...currentWave.map(p => p.current), maxFaultCurrent);
    const scaleY = height / maxCurrentVal;
    const scaleX = width / 0.5;
    
    for (let i = 0; i < currentWave.length - 1; i++) {
      const x1 = currentWave[i].time * scaleX;
      const y1 = height - currentWave[i].current * scaleY;
      const x2 = currentWave[i + 1].time * scaleX;
      const y2 = height - currentWave[i + 1].current * scaleY;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    ctx.fillStyle = '#ef4444';
    ctx.font = '10px sans-serif';
    ctx.fillText('Corriente de falla (A)', width - 100, 15);
    ctx.fillText('Tiempo (s)', width - 50, height - 5);
  }, [currentWave, maxFaultCurrent, darkMode, animationMode]);

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
          <div className={`mt-2 p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
            <div className="flex items-center gap-3">
              <span className="text-sm">Velocidad:</span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                className="w-24"
              />
              <span className="text-sm font-semibold">{animationSpeed}x</span>
              <button
                onClick={() => setAnimationSpeed(1)}
                className="text-xs px-2 py-1 rounded bg-gray-500 hover:bg-gray-600 text-white"
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
        
        {/* Panel de parámetros de falla (común) */}
        <div className={`p-4 rounded-lg ${colors.card} border ${colors.border}`}>
          <h4 className={`font-semibold ${colors.text} mb-3 flex items-center gap-2`}>
            <AlertTriangle size={16} /> ⚡ PARÁMETROS DE FALLA
          </h4>
          
          <div className="space-y-4">
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
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
            
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
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
            
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
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
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                  <div className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>Tensión de Paso</div>
                  <div className={`text-lg font-bold ${colors.step}`}>{stepVoltage.toFixed(0)} V</div>
                </div>
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-orange-900/30' : 'bg-orange-50'}`}>
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
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
          <Shield size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            <strong>✅ Flujo correcto de corriente:</strong> Durante una falla, la corriente fluye 
            <strong className="text-red-600"> DESDE el punto de falla</strong> (equipo energizado) 
            <strong className="text-blue-600"> HACIA la malla de tierra</strong>, donde se disipa de manera segura.
          </span>
        </p>
      </div>
      
      {/* Datos adicionales */}
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} text-center`}>
          <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Transformador</span>
          <div className="font-bold">{transformerKVA} kVA</div>
        </div>
        <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} text-center`}>
          <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Tensión</span>
          <div className="font-bold">{voltage/1000} kV</div>
        </div>
        <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} text-center`}>
          <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Resistencia Malla</span>
          <div className="font-bold">{gridResistance} Ω</div>
        </div>
        <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} text-center`}>
          <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Corriente Máx</span>
          <div className="font-bold">{maxFaultCurrent.toFixed(0)} A</div>
        </div>
      </div>
      
      {/* Indicadores de estado */}
      <div className="mt-3 flex justify-center gap-4">
        <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <Layers size={12} className="inline mr-1" />
          Modo: {animationMode === 'mode1' ? 'Flujo Visual' : 'Onda Técnica'}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${isLooping ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-600'}`}>
          {isLooping ? '🔄 Reproducción continua (bucle)' : '⏹️ Un solo ciclo'}
        </span>
      </div>
    </div>
  );
};

export default FaultAnimation;