/**
 * Design Tokens - Sistema de Diseño Consistente
 * Colores, espaciados, tipografía y bordes homologados
 */

// ============================================
// COLORES DE TEXTO (NEGRO PARA LEGIBILIDAD)
// ============================================
export const TEXT_COLORS = {
  // Primarios - Negro y grises para legibilidad
  primary: '#000000',
  secondary: '#1a1a1a',
  tertiary: '#2d2d2d',
  
  // Grises para texto secundario
  muted: '#6b7280',
  light: '#9ca3af',
  
  // Estados
  success: '#16a34a',
};

// ============================================
// COLORES DE FONDO
// ============================================
export const BG_COLORS = {
  primary: '#1f2937',      // Primary background - dark gray
  secondary: '#374151',    // Secondary background - medium dark gray
  tertiary: '#4b5563',     // Tertiary background - lighter dark gray
  dark: '#111827',         // Dark background
  darker: '#030712'        // Darker background
};

// ============================================
// COLORES DE ACENTO
// ============================================
export const ACCENT_COLORS = {
  blue: '#3b82f6',         // Primary accent - blue
  green: '#22c55e',        // Success accent - green
  yellow: '#eab308',       // Warning accent - yellow
  red: '#ef4444',          // Error accent - red
  orange: '#f97316',       // Orange accent
  purple: '#a855f7',       // Purple accent
  cyan: '#06b6d4'          // Cyan accent
};

// ============================================
// BORDES
// ============================================
export const BORDERS = {
  color: {
    light: '#4b5563',      // Light border - gray
    medium: '#6b7280',     // Medium border - lighter gray
    dark: '#9ca3af',       // Dark border - even lighter
    blue: '#3b82f6'        // Blue border for emphasis
  },
  radius: {
    sm: '0.375rem',        // 6px
    md: '0.5rem',          // 8px
    lg: '0.75rem',         // 12px
    xl: '1rem',            // 16px
    full: '9999px'         // Fully rounded
  },
  width: {
    thin: '1px',
    medium: '2px',
    thick: '3px'
  }
};

// ============================================
// ESPACIADOS
// ============================================
export const SPACING = {
  xs: '0.25rem',           // 4px
  sm: '0.5rem',            // 8px
  md: '0.75rem',           // 12px
  lg: '1rem',              // 16px
  xl: '1.5rem',            // 24px
  '2xl': '2rem',           // 32px
  '3xl': '3rem'            // 48px
};

// ============================================
// TIPOGRAFÍA
// ============================================
export const TYPOGRAPHY = {
  fontSize: {
    xs: '0.75rem',         // 12px
    sm: '0.875rem',        // 14px
    base: '1rem',          // 16px
    lg: '1.125rem',        // 18px
    xl: '1.25rem',         // 20px
    '2xl': '1.5rem',       // 24px
    '3xl': '1.875rem'      // 30px
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800'
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75'
  }
};

// ============================================
// SOMBRAS
// ============================================
export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
  glow: {
    blue: '0 0 20px rgba(59, 130, 246, 0.5)',
    green: '0 0 20px rgba(34, 197, 94, 0.6)',
    orange: '0 0 20px rgba(249, 115, 22, 0.5)',
    red: '0 0 20px rgba(239, 68, 68, 0.6)',
    purple: '0 0 20px rgba(168, 85, 247, 0.5)',
    yellow: '0 0 20px rgba(234, 179, 8, 0.6)'
  },
  success: '0 0 25px rgba(34, 197, 94, 0.7)',
  warning: '0 0 25px rgba(234, 179, 8, 0.7)',
  error: '0 0 25px rgba(239, 68, 68, 0.7)'
};

// ============================================
// TRANSICIONES
// ============================================
export const TRANSITIONS = {
  fast: '150ms ease-in-out',
  normal: '300ms ease-in-out',
  slow: '500ms ease-in-out'
};

// ============================================
// Z-INDEX
// ============================================
export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  popover: 50,
  tooltip: 60
};

// ============================================
// CONFIGURACIONES DE COMPONENTES
// ============================================
export const COMPONENT_CONFIG = {
  // MetricCard
  metricCard: {
    padding: SPACING.md,
    borderRadius: BORDERS.radius.lg,
    borderWidth: BORDERS.width.normal,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textColor: TEXT_COLORS.primary
  },
  
  // InputField
  inputField: {
    padding: SPACING.sm,
    borderRadius: BORDERS.radius.md,
    borderWidth: BORDERS.width.normal,
    fontSize: TYPOGRAPHY.fontSize.base,
    textColor: TEXT_COLORS.primary,
    labelColor: TEXT_COLORS.secondary
  },
  
  // ValidatedSection
  validatedSection: {
    padding: SPACING.lg,
    borderRadius: BORDERS.radius.xl,
    borderWidth: BORDERS.width.normal
  }
};
