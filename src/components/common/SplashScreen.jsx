import React, { useEffect, useState } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Inicializando...');

  useEffect(() => {
    const steps = [
      { progress: 10, message: 'Cargando módulos...', time: 200 },
      { progress: 25, message: 'Inicializando cálculos IEEE 80...', time: 300 },
      { progress: 40, message: 'Cargando visualizaciones 3D...', time: 250 },
      { progress: 55, message: 'Preparando base de datos...', time: 200 },
      { progress: 70, message: 'Configurando interfaz...', time: 250 },
      { progress: 85, message: 'Optimizando rendimiento...', time: 200 },
      { progress: 100, message: '¡Listo!', time: 300 }
    ];

    let currentStep = 0;
    
    const runStep = () => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setProgress(step.progress);
        setMessage(step.message);
        currentStep++;
        setTimeout(runStep, step.time);
      } else {
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 500);
      }
    };

    const timeoutId = setTimeout(runStep, steps[0].time);

    return () => clearTimeout(timeoutId);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8 animate-bounce">
          <div className="text-7xl mb-2">⚡</div>
          <h1 className="text-3xl font-bold text-white">Grounding Designer Pro</h1>
          <p className="text-blue-200 mt-2">Diseño de Mallas de Tierra IEEE 80</p>
        </div>
        
        {/* Barra de progreso */}
        <div className="w-80 bg-white/20 rounded-full h-2 mb-4 overflow-hidden">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Mensaje */}
        <p className="text-white/80 text-sm">{message}</p>
        
        {/* Versión */}
        <p className="text-white/40 text-xs mt-4">Versión 2.0 | IEEE 80-2013</p>
      </div>
    </div>
  );
};

export default SplashScreen;