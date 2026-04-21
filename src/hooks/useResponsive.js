import { useState, useEffect, useCallback } from 'react';

// Breakpoints estándar (en píxeles)
const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1280,
  extraLarge: 1536
};

// Breakpoints para orientación
const ORIENTATION = {
  portrait: 'portrait',
  landscape: 'landscape'
};

export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });
  
  const [orientation, setOrientation] = useState(
    typeof window !== 'undefined' 
      ? window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      : 'landscape'
  );
  
  const [breakpoints, setBreakpoints] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false,
    isExtraLarge: false,
    isPortrait: false,
    isLandscape: true
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const currentOrientation = height > width ? 'portrait' : 'landscape';
      
      setWindowSize({ width, height });
      setOrientation(currentOrientation);
      setBreakpoints({
        isMobile: width < BREAKPOINTS.tablet,
        isTablet: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
        isDesktop: width >= BREAKPOINTS.desktop && width < BREAKPOINTS.largeDesktop,
        isLargeDesktop: width >= BREAKPOINTS.largeDesktop && width < BREAKPOINTS.extraLarge,
        isExtraLarge: width >= BREAKPOINTS.extraLarge,
        isPortrait: currentOrientation === 'portrait',
        isLandscape: currentOrientation === 'landscape'
      });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clases CSS responsivas
  const responsiveClasses = {
    container: breakpoints.isMobile ? 'px-3' : breakpoints.isTablet ? 'px-4' : 'px-6',
    grid: breakpoints.isMobile ? 'grid-cols-1' : breakpoints.isTablet ? 'grid-cols-2' : breakpoints.isDesktop ? 'grid-cols-3' : 'grid-cols-4',
    sidebar: breakpoints.isMobile || breakpoints.isTablet ? 'hidden' : 'block',
    fullWidth: 'w-full',
    hideOnMobile: breakpoints.isMobile ? 'hidden' : '',
    hideOnTablet: breakpoints.isTablet ? 'hidden' : '',
    hideOnDesktop: breakpoints.isDesktop ? 'hidden' : '',
    showOnMobile: breakpoints.isMobile ? '' : 'hidden',
    showOnTablet: breakpoints.isTablet ? '' : 'hidden',
    showOnDesktop: breakpoints.isDesktop ? '' : 'hidden',
    stackOnMobile: breakpoints.isMobile ? 'flex-col' : 'flex-row',
    stackOnTablet: breakpoints.isTablet ? 'flex-col' : 'flex-row',
    textSize: breakpoints.isMobile ? 'text-sm' : breakpoints.isTablet ? 'text-base' : 'text-lg',
    spacing: breakpoints.isMobile ? 'gap-2' : breakpoints.isTablet ? 'gap-3' : 'gap-4',
    padding: breakpoints.isMobile ? 'p-3' : breakpoints.isTablet ? 'p-4' : 'p-6'
  };

  // Verificar si es un dispositivo táctil
  const isTouchDevice = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  // Obtener el tamaño actual como string
  const getCurrentBreakpoint = useCallback(() => {
    if (breakpoints.isExtraLarge) return 'extraLarge';
    if (breakpoints.isLargeDesktop) return 'largeDesktop';
    if (breakpoints.isDesktop) return 'desktop';
    if (breakpoints.isTablet) return 'tablet';
    return 'mobile';
  }, [breakpoints]);

  // Verificar si la pantalla es pequeña (útil para menús móviles)
  const isSmallScreen = breakpoints.isMobile || breakpoints.isTablet;
  
  // Verificar si la pantalla es grande
  const isLargeScreen = breakpoints.isLargeDesktop || breakpoints.isExtraLarge;

  // Obtener el tamaño de fuente responsivo
  const getResponsiveFontSize = useCallback((mobile, tablet, desktop) => {
    if (breakpoints.isMobile) return mobile;
    if (breakpoints.isTablet) return tablet;
    return desktop;
  }, [breakpoints]);

  // Obtener el espaciado responsivo
  const getResponsiveSpacing = useCallback((mobile, tablet, desktop) => {
    if (breakpoints.isMobile) return mobile;
    if (breakpoints.isTablet) return tablet;
    return desktop;
  }, [breakpoints]);

  // Clases para contenedor responsivo
  const containerClasses = `
    w-full 
    mx-auto 
    ${responsiveClasses.container}
    ${breakpoints.isDesktop ? 'max-w-7xl' : ''}
    ${breakpoints.isLargeDesktop ? 'max-w-[1400px]' : ''}
  `;

  // Clases para grid responsivo
  const getGridClasses = (cols = { mobile: 1, tablet: 2, desktop: 3, large: 4 }) => {
    if (breakpoints.isExtraLarge) return `grid-cols-${cols.large || 4}`;
    if (breakpoints.isLargeDesktop) return `grid-cols-${cols.large || 4}`;
    if (breakpoints.isDesktop) return `grid-cols-${cols.desktop || 3}`;
    if (breakpoints.isTablet) return `grid-cols-${cols.tablet || 2}`;
    return `grid-cols-${cols.mobile || 1}`;
  };

  return { 
    windowSize, 
    breakpoints, 
    orientation,
    responsiveClasses,
    isTouchDevice: isTouchDevice(),
    getCurrentBreakpoint,
    isSmallScreen,
    isLargeScreen,
    getResponsiveFontSize,
    getResponsiveSpacing,
    containerClasses,
    getGridClasses,
    // Atajos comunes
    isMobile: breakpoints.isMobile,
    isTablet: breakpoints.isTablet,
    isDesktop: breakpoints.isDesktop,
    isPortrait: breakpoints.isPortrait,
    isLandscape: breakpoints.isLandscape,
    width: windowSize.width,
    height: windowSize.height
  };
};

// Hook específico para menús responsivos
export const useResponsiveMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  // Detectar tamaño de pantalla y cerrar menú en desktop
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const newIsMobile = width < 768;
      const newIsTablet = width >= 768 && width < 1024;
      
      setIsMobile(newIsMobile);
      setIsTablet(newIsTablet);
      
      // Cerrar menú automáticamente en desktop
      if (!newIsMobile && !newIsTablet && isOpen) {
        setIsOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);
  
  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  const openMenu = useCallback(() => {
    setIsOpen(true);
  }, []);
  
  return { isOpen, toggleMenu, closeMenu, openMenu, isMobile, isTablet };
};

// Hook para detectar hover en dispositivos táctiles
export const useHover = () => {
  const [isHoverable, setIsHoverable] = useState(true);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover)');
    setIsHoverable(mediaQuery.matches);
    
    const handler = (e) => setIsHoverable(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return isHoverable;
};

export default useResponsive;