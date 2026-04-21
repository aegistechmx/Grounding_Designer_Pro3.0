/**
 * Internacionalización - Soporte multi-idioma
 * Idiomas: Español, Inglés, Portugués, Francés, Alemán, Italiano
 */

import React from 'react';

export const translations = {
  es: {
    // General
    app_title: 'Grounding Designer Pro - Diseño de Mallas de Tierra',
    save: 'Guardar',
    export: 'Exportar',
    import: 'Importar',
    delete: 'Eliminar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    info: 'Información',
    back: 'Atrás',
    next: 'Siguiente',
    close: 'Cerrar',
    print: 'Imprimir',
    download: 'Descargar',
    search: 'Buscar',
    filter: 'Filtrar',
    clear: 'Limpiar',
    settings: 'Configuración',
    help: 'Ayuda',
    about: 'Acerca de',
    version: 'Versión',
    language: 'Idioma',
    
    // Parámetros
    transformer: 'Transformador',
    voltage: 'Voltaje',
    impedance: 'Impedancia',
    fault_current: 'Corriente de falla',
    fault_duration: 'Duración de falla',
    soil_resistivity: 'Resistividad del suelo',
    surface_layer: 'Capa superficial',
    grid_dimensions: 'Dimensiones de malla',
    conductors: 'Conductores',
    rods: 'Varillas',
    rod_length: 'Longitud de varilla',
    grid_depth: 'Profundidad de malla',
    grid_area: 'Área de malla',
    perimeter: 'Perímetro',
    
    // Resultados
    results: 'Resultados',
    grid_resistance: 'Resistencia de malla',
    gpr: 'Elevación de potencial (GPR)',
    touch_voltage: 'Tensión de contacto',
    step_voltage: 'Tensión de paso',
    complies: 'Cumple',
    does_not_comply: 'No cumple',
    safety_factor: 'Factor de seguridad',
    efficiency: 'Eficiencia',
    
    // Acciones
    calculate: 'Calcular',
    optimize: 'Optimizar',
    export_pdf: 'Exportar PDF',
    export_dxf: 'Exportar DXF',
    export_excel: 'Exportar Excel',
    export_json: 'Exportar JSON',
    compare: 'Comparar',
    reset: 'Restablecer',
    profile_save: 'Guardar Perfil',
    profile_load: 'Cargar Perfil',
    profile_delete: 'Eliminar Perfil',
    
    // Mensajes
    design_complies: '✓ El diseño CUMPLE con IEEE 80',
    design_not_complies: '⚠ El diseño NO CUMPLE con IEEE 80',
    safe_margin: 'Margen de seguridad',
    recommendations: 'Recomendaciones',
    gpr_high: 'GPR elevado - Riesgo para equipos electrónicos',
    resistance_high: 'Resistencia alta - Considere más varillas',
    
    // Método Wenner
    wenner_title: 'Método Wenner',
    wenner_description: 'Medición de resistividad del suelo con 4 electrodos',
    wenner_formula: 'ρ = 2 × π × a × R',
    wenner_step1: 'Clavar 4 varillas en línea recta',
    wenner_step2: 'Conectar telurómetro',
    wenner_step3: 'Medir resistencia para diferentes separaciones',
    wenner_step4: 'Calcular resistividad',
    
    // Errores
    error_invalid_data: 'Datos inválidos',
    error_calculation: 'Error en el cálculo',
    error_export: 'Error al exportar',
    error_import: 'Error al importar',
    
    // Unidades
    unit_ohm: 'Ω',
    unit_volt: 'V',
    unit_amp: 'A',
    unit_meter: 'm',
    unit_meter2: 'm²',
    unit_percent: '%',
    unit_second: 's'
  },
  
  en: {
    // General
    app_title: 'Grounding Designer Pro - Grounding Grid Design',
    save: 'Save',
    export: 'Export',
    import: 'Import',
    delete: 'Delete',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    back: 'Back',
    next: 'Next',
    close: 'Close',
    print: 'Print',
    download: 'Download',
    search: 'Search',
    filter: 'Filter',
    clear: 'Clear',
    settings: 'Settings',
    help: 'Help',
    about: 'About',
    version: 'Version',
    language: 'Language',
    
    // Parámetros
    transformer: 'Transformer',
    voltage: 'Voltage',
    impedance: 'Impedance',
    fault_current: 'Fault current',
    fault_duration: 'Fault duration',
    soil_resistivity: 'Soil resistivity',
    surface_layer: 'Surface layer',
    grid_dimensions: 'Grid dimensions',
    conductors: 'Conductors',
    rods: 'Rods',
    rod_length: 'Rod length',
    grid_depth: 'Grid depth',
    grid_area: 'Grid area',
    perimeter: 'Perimeter',
    
    // Resultados
    results: 'Results',
    grid_resistance: 'Grid resistance',
    gpr: 'Ground Potential Rise',
    touch_voltage: 'Touch voltage',
    step_voltage: 'Step voltage',
    complies: 'Complies',
    does_not_comply: 'Does not comply',
    safety_factor: 'Safety factor',
    efficiency: 'Efficiency',
    
    // Acciones
    calculate: 'Calculate',
    optimize: 'Optimize',
    export_pdf: 'Export PDF',
    export_dxf: 'Export DXF',
    export_excel: 'Export Excel',
    export_json: 'Export JSON',
    compare: 'Compare',
    reset: 'Reset',
    profile_save: 'Save Profile',
    profile_load: 'Load Profile',
    profile_delete: 'Delete Profile',
    
    // Mensajes
    design_complies: '✓ Design COMPLIES with IEEE 80',
    design_not_complies: '⚠ Design DOES NOT COMPLY with IEEE 80',
    safe_margin: 'Safety margin',
    recommendations: 'Recommendations',
    gpr_high: 'High GPR - Risk for electronic equipment',
    resistance_high: 'High resistance - Consider more rods',
    
    // Wenner Method
    wenner_title: 'Wenner Method',
    wenner_description: 'Soil resistivity measurement with 4 electrodes',
    wenner_formula: 'ρ = 2 × π × a × R',
    wenner_step1: 'Drive 4 rods in a straight line',
    wenner_step2: 'Connect ground tester',
    wenner_step3: 'Measure resistance for different spacings',
    wenner_step4: 'Calculate resistivity',
    
    // Errors
    error_invalid_data: 'Invalid data',
    error_calculation: 'Calculation error',
    error_export: 'Export error',
    error_import: 'Import error',
    
    // Units
    unit_ohm: 'Ω',
    unit_volt: 'V',
    unit_amp: 'A',
    unit_meter: 'm',
    unit_meter2: 'm²',
    unit_percent: '%',
    unit_second: 's'
  },
  
  pt: {
    // General
    app_title: 'Grounding Designer Pro - Projeto de Malha de Aterramento',
    save: 'Salvar',
    export: 'Exportar',
    import: 'Importar',
    delete: 'Excluir',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    warning: 'Aviso',
    info: 'Informação',
    back: 'Voltar',
    next: 'Próximo',
    close: 'Fechar',
    print: 'Imprimir',
    download: 'Baixar',
    search: 'Buscar',
    filter: 'Filtrar',
    clear: 'Limpar',
    settings: 'Configurações',
    help: 'Ajuda',
    about: 'Sobre',
    version: 'Versão',
    language: 'Idioma',
    
    // Parámetros
    transformer: 'Transformador',
    voltage: 'Tensão',
    impedance: 'Impedância',
    fault_current: 'Corrente de falta',
    fault_duration: 'Duração da falta',
    soil_resistivity: 'Resistividade do solo',
    surface_layer: 'Camada superficial',
    grid_dimensions: 'Dimensões da malha',
    conductors: 'Condutores',
    rods: 'Hastes',
    rod_length: 'Comprimento da haste',
    grid_depth: 'Profundidade da malha',
    grid_area: 'Área da malha',
    perimeter: 'Perímetro',
    
    // Resultados
    results: 'Resultados',
    grid_resistance: 'Resistência da malha',
    gpr: 'Elevação de potencial (GPR)',
    touch_voltage: 'Tensão de toque',
    step_voltage: 'Tensão de passo',
    complies: 'Atende',
    does_not_comply: 'Não atende',
    safety_factor: 'Fator de segurança',
    efficiency: 'Eficiência',
    
    // Acciones
    calculate: 'Calcular',
    optimize: 'Otimizar',
    export_pdf: 'Exportar PDF',
    export_dxf: 'Exportar DXF',
    export_excel: 'Exportar Excel',
    export_json: 'Exportar JSON',
    compare: 'Comparar',
    reset: 'Redefinir',
    profile_save: 'Salvar Perfil',
    profile_load: 'Carregar Perfil',
    profile_delete: 'Excluir Perfil',
    
    // Mensajes
    design_complies: '✓ O projeto ATENDE ao IEEE 80',
    design_not_complies: '⚠ O projeto NÃO ATENDE ao IEEE 80',
    safe_margin: 'Margem de segurança',
    recommendations: 'Recomendações',
    gpr_high: 'GPR elevado - Risco para equipamentos eletrônicos',
    resistance_high: 'Resistência alta - Considere mais hastes',
    
    // Método Wenner
    wenner_title: 'Método Wenner',
    wenner_description: 'Medição de resistividade do solo com 4 eletrodos',
    wenner_formula: 'ρ = 2 × π × a × R',
    wenner_step1: 'Cavar 4 hastes em linha reta',
    wenner_step2: 'Conectar terrômetro',
    wenner_step3: 'Medir resistência para diferentes separações',
    wenner_step4: 'Calcular resistividade',
    
    // Errors
    error_invalid_data: 'Dados inválidos',
    error_calculation: 'Erro no cálculo',
    error_export: 'Erro ao exportar',
    error_import: 'Erro ao importar',
    
    // Units
    unit_ohm: 'Ω',
    unit_volt: 'V',
    unit_amp: 'A',
    unit_meter: 'm',
    unit_meter2: 'm²',
    unit_percent: '%',
    unit_second: 's'
  },
  
  fr: {
    // General
    app_title: 'Grounding Designer Pro - Conception de Grille de Terre',
    save: 'Sauvegarder',
    export: 'Exporter',
    import: 'Importer',
    delete: 'Supprimer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    warning: 'Avertissement',
    info: 'Info',
    back: 'Retour',
    next: 'Suivant',
    close: 'Fermer',
    print: 'Imprimer',
    download: 'Télécharger',
    search: 'Rechercher',
    filter: 'Filtrer',
    clear: 'Effacer',
    settings: 'Paramètres',
    help: 'Aide',
    about: 'À propos',
    version: 'Version',
    language: 'Langue',
    
    // Parámetros
    transformer: 'Transformateur',
    voltage: 'Tension',
    impedance: 'Impédance',
    fault_current: 'Courant de défaut',
    fault_duration: 'Durée du défaut',
    soil_resistivity: 'Résistivité du sol',
    surface_layer: 'Couche superficielle',
    grid_dimensions: 'Dimensions de la grille',
    conductors: 'Conducteurs',
    rods: 'Tiges',
    rod_length: 'Longueur de la tige',
    grid_depth: 'Profondeur de la grille',
    grid_area: 'Surface de la grille',
    perimeter: 'Périmètre',
    
    // Resultados
    results: 'Résultats',
    grid_resistance: 'Résistance de la grille',
    gpr: 'Élévation du potentiel (GPR)',
    touch_voltage: 'Tension de contact',
    step_voltage: 'Tension de pas',
    complies: 'Conforme',
    does_not_comply: 'Non conforme',
    safety_factor: 'Facteur de sécurité',
    efficiency: 'Efficacité',
    
    // Acciones
    calculate: 'Calculer',
    optimize: 'Optimiser',
    export_pdf: 'Exporter PDF',
    export_dxf: 'Exporter DXF',
    export_excel: 'Exporter Excel',
    export_json: 'Exporter JSON',
    compare: 'Comparer',
    reset: 'Réinitialiser',
    profile_save: 'Sauvegarder le profil',
    profile_load: 'Charger le profil',
    profile_delete: 'Supprimer le profil',
    
    // Mensajes
    design_complies: '✓ La conception EST CONFORME à la norme IEEE 80',
    design_not_complies: '⚠ La conception N\'EST PAS CONFORME à la norme IEEE 80',
    safe_margin: 'Marge de sécurité',
    recommendations: 'Recommandations',
    gpr_high: 'GPR élevé - Risque pour les équipements électroniques',
    resistance_high: 'Résistance élevée - Envisagez plus de tiges',
    
    // Méthode Wenner
    wenner_title: 'Méthode Wenner',
    wenner_description: 'Mesure de résistivité du sol avec 4 électrodes',
    wenner_formula: 'ρ = 2 × π × a × R',
    wenner_step1: 'Enfoncer 4 tiges en ligne droite',
    wenner_step2: 'Connecter le telluromètre',
    wenner_step3: 'Mesurer la résistance pour différents écarts',
    wenner_step4: 'Calculer la résistivité',
    
    // Errors
    error_invalid_data: 'Données invalides',
    error_calculation: 'Erreur de calcul',
    error_export: 'Erreur d\'exportation',
    error_import: 'Erreur d\'importation',
    
    // Units
    unit_ohm: 'Ω',
    unit_volt: 'V',
    unit_amp: 'A',
    unit_meter: 'm',
    unit_meter2: 'm²',
    unit_percent: '%',
    unit_second: 's'
  },
  
  de: {
    // General
    app_title: 'Grounding Designer Pro - Erdungsgitter-Design',
    save: 'Speichern',
    export: 'Exportieren',
    import: 'Importieren',
    delete: 'Löschen',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    loading: 'Laden...',
    error: 'Fehler',
    success: 'Erfolg',
    warning: 'Warnung',
    info: 'Info',
    back: 'Zurück',
    next: 'Weiter',
    close: 'Schließen',
    print: 'Drucken',
    download: 'Herunterladen',
    search: 'Suchen',
    filter: 'Filtern',
    clear: 'Löschen',
    settings: 'Einstellungen',
    help: 'Hilfe',
    about: 'Über',
    version: 'Version',
    language: 'Sprache',
    
    // Parámetros
    transformer: 'Transformator',
    voltage: 'Spannung',
    impedance: 'Impedanz',
    fault_current: 'Fehlerstrom',
    fault_duration: 'Fehlerdauer',
    soil_resistivity: 'Bodenwiderstand',
    surface_layer: 'Oberflächenschicht',
    grid_dimensions: 'Gitterabmessungen',
    conductors: 'Leiter',
    rods: 'Stangen',
    rod_length: 'Stangenlänge',
    grid_depth: 'Gittertiefe',
    grid_area: 'Gitterfläche',
    perimeter: 'Umfang',
    
    // Resultados
    results: 'Ergebnisse',
    grid_resistance: 'Gitterwiderstand',
    gpr: 'Erdpotentialanstieg (GPR)',
    touch_voltage: 'Berührungsspannung',
    step_voltage: 'Schrittspannung',
    complies: 'Erfüllt',
    does_not_comply: 'Erfüllt nicht',
    safety_factor: 'Sicherheitsfaktor',
    efficiency: 'Effizienz',
    
    // Acciones
    calculate: 'Berechnen',
    optimize: 'Optimieren',
    export_pdf: 'PDF exportieren',
    export_dxf: 'DXF exportieren',
    export_excel: 'Excel exportieren',
    export_json: 'JSON exportieren',
    compare: 'Vergleichen',
    reset: 'Zurücksetzen',
    profile_save: 'Profil speichern',
    profile_load: 'Profil laden',
    profile_delete: 'Profil löschen',
    
    // Mensajes
    design_complies: '✓ Der Entwurf erfüllt IEEE 80',
    design_not_complies: '⚠ Der Entwurf erfüllt IEEE 80 NICHT',
    safe_margin: 'Sicherheitsmarge',
    recommendations: 'Empfehlungen',
    gpr_high: 'Hoher GPR - Risiko für elektronische Geräte',
    resistance_high: 'Hoher Widerstand - Erwägen Sie mehr Stangen',
    
    // Wenner Method
    wenner_title: 'Wenner-Methode',
    wenner_description: 'Bodenwiderstandsmessung mit 4 Elektroden',
    wenner_formula: 'ρ = 2 × π × a × R',
    wenner_step1: '4 Stangen in einer geraden Linie eintreiben',
    wenner_step2: 'Erdungsmesser anschließen',
    wenner_step3: 'Widerstand für verschiedene Abstände messen',
    wenner_step4: 'Widerstand berechnen',
    
    // Errors
    error_invalid_data: 'Ungültige Daten',
    error_calculation: 'Berechnungsfehler',
    error_export: 'Exportfehler',
    error_import: 'Importfehler',
    
    // Units
    unit_ohm: 'Ω',
    unit_volt: 'V',
    unit_amp: 'A',
    unit_meter: 'm',
    unit_meter2: 'm²',
    unit_percent: '%',
    unit_second: 's'
  },
  
  it: {
    // General
    app_title: 'Grounding Designer Pro - Progettazione Griglia di Terra',
    save: 'Salva',
    export: 'Esporta',
    import: 'Importa',
    delete: 'Elimina',
    cancel: 'Annulla',
    confirm: 'Conferma',
    loading: 'Caricamento...',
    error: 'Errore',
    success: 'Successo',
    warning: 'Avviso',
    info: 'Info',
    back: 'Indietro',
    next: 'Avanti',
    close: 'Chiudi',
    print: 'Stampa',
    download: 'Scarica',
    search: 'Cerca',
    filter: 'Filtra',
    clear: 'Cancella',
    settings: 'Impostazioni',
    help: 'Aiuto',
    about: 'Informazioni',
    version: 'Versione',
    language: 'Lingua',
    
    // Parámetros
    transformer: 'Trasformatore',
    voltage: 'Tensione',
    impedance: 'Impedenza',
    fault_current: 'Corrente di guasto',
    fault_duration: 'Durata del guasto',
    soil_resistivity: 'Resistività del suolo',
    surface_layer: 'Strato superficiale',
    grid_dimensions: 'Dimensioni della griglia',
    conductors: 'Conduttori',
    rods: 'Aste',
    rod_length: 'Lunghezza asta',
    grid_depth: 'Profondità griglia',
    grid_area: 'Area griglia',
    perimeter: 'Perimetro',
    
    // Resultados
    results: 'Risultati',
    grid_resistance: 'Resistenza griglia',
    gpr: 'Innalzamento del potenziale (GPR)',
    touch_voltage: 'Tensione di contatto',
    step_voltage: 'Tensione di passo',
    complies: 'Conforme',
    does_not_comply: 'Non conforme',
    safety_factor: 'Fattore di sicurezza',
    efficiency: 'Efficienza',
    
    // Acciones
    calculate: 'Calcola',
    optimize: 'Ottimizza',
    export_pdf: 'Esporta PDF',
    export_dxf: 'Esporta DXF',
    export_excel: 'Esporta Excel',
    export_json: 'Esporta JSON',
    compare: 'Confronta',
    reset: 'Reimposta',
    profile_save: 'Salva profilo',
    profile_load: 'Carica profilo',
    profile_delete: 'Elimina profilo',
    
    // Mensajes
    design_complies: '✓ Il progetto è CONFORME a IEEE 80',
    design_not_complies: '⚠ Il progetto NON È CONFORME a IEEE 80',
    safe_margin: 'Margine di sicurezza',
    recommendations: 'Raccomandazioni',
    gpr_high: 'GPR elevato - Rischio per apparecchiature elettroniche',
    resistance_high: 'Resistenza elevata - Considerare più aste',
    
    // Metodo Wenner
    wenner_title: 'Metodo Wenner',
    wenner_description: 'Misura della resistività del suolo con 4 elettrodi',
    wenner_formula: 'ρ = 2 × π × a × R',
    wenner_step1: 'Inserire 4 aste in linea retta',
    wenner_step2: 'Collegare il telurometro',
    wenner_step3: 'Misurare la resistenza per diverse distanze',
    wenner_step4: 'Calcolare la resistività',
    
    // Errors
    error_invalid_data: 'Dati non validi',
    error_calculation: 'Errore di calcolo',
    error_export: 'Errore di esportazione',
    error_import: 'Errore di importazione',
    
    // Units
    unit_ohm: 'Ω',
    unit_volt: 'V',
    unit_amp: 'A',
    unit_meter: 'm',
    unit_meter2: 'm²',
    unit_percent: '%',
    unit_second: 's'
  }
};

// Lista de idiomas disponibles
export const availableLanguages = [
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', nativeName: 'Português' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' }
];

let currentLanguage = 'es';

// Inicializar idioma desde localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('language');
  if (saved && translations[saved]) {
    currentLanguage = saved;
  }
}

export const setLanguage = (lang) => {
  if (translations[lang]) {
    currentLanguage = lang;
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
      // Disparar evento para actualizar componentes
      window.dispatchEvent(new CustomEvent('languageChange', { detail: { language: lang } }));
    }
    return true;
  }
  return false;
};

export const getLanguage = () => {
  return currentLanguage;
};

export const getAvailableLanguages = () => {
  return availableLanguages;
};

export const t = (key, params = {}) => {
  const translation = translations[currentLanguage]?.[key];
  let result = translation || key;
  
  // Reemplazar parámetros {0}, {1}, etc.
  Object.values(params).forEach((value, index) => {
    result = result.replace(new RegExp(`\\{${index}\\}`, 'g'), value);
  });
  
  return result;
};

// Hook para React
export const useTranslation = () => {
  const [lang, setLang] = React.useState(getLanguage());
  
  React.useEffect(() => {
    const handleLanguageChange = (e) => {
      setLang(e.detail.language);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('languageChange', handleLanguageChange);
      return () => window.removeEventListener('languageChange', handleLanguageChange);
    }
  }, []);
  
  return {
    t: (key, params) => t(key, params),
    setLanguage,
    getLanguage,
    currentLanguage: lang,
    availableLanguages
  };
};

// Selector de idioma como componente (para usar en UI)
export const LanguageSelector = ({ darkMode }) => {
  const { setLanguage, currentLanguage, availableLanguages } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  
  const currentLang = availableLanguages.find(l => l.code === currentLanguage);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
          darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        <span>{currentLang?.flag}</span>
        <span>{currentLang?.name}</span>
        <span>▼</span>
      </button>
      
      {isOpen && (
        <div className={`absolute right-0 mt-1 rounded-md shadow-lg z-50 ${
          darkMode ? 'bg-gray-700' : 'bg-white'
        } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`flex items-center gap-2 w-full px-4 py-2 text-sm ${
                currentLanguage === lang.code
                  ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                  : darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
              {currentLanguage === lang.code && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default { 
  t, 
  setLanguage, 
  getLanguage, 
  useTranslation, 
  translations,
  availableLanguages,
  LanguageSelector
};