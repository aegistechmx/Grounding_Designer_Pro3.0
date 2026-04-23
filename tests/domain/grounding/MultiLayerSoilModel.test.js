// tests/domain/grounding/MultiLayerSoilModel.test.js
import MultiLayerSoilModel from '../../../src/domain/grounding/MultiLayerSoilModel.js';

describe('MultiLayerSoilModel - Soil Model Analysis', () => {
  
  describe('Constructor and Input Validation', () => {
    test('debe crear modelo con suelo uniforme', () => {
      const input = {
        model: 'uniform',
        soilResistivity: 100
      };
      
      const model = new MultiLayerSoilModel(input);
      
      expect(model.input).toBeDefined();
      expect(model.input.model).toBe('uniform');
      expect(model.input.layers).toHaveLength(1);
      expect(model.input.layers[0].type).toBe('uniform');
      expect(model.input.layers[0].resistivity).toBe(100);
      expect(model.input.layers[0].thickness).toBe(Infinity);
    });

    test('debe crear modelo con dos capas', () => {
      const input = {
        model: 'two-layer',
        layer1: { resistivity: 100, thickness: 5 },
        layer2: { resistivity: 300 }
      };
      
      const model = new MultiLayerSoilModel(input);
      
      expect(model.input.model).toBe('two-layer');
      expect(model.input.layers).toHaveLength(2);
      expect(model.input.layers[0].type).toBe('layer1');
      expect(model.input.layers[0].resistivity).toBe(100);
      expect(model.input.layers[0].thickness).toBe(5);
      expect(model.input.layers[1].type).toBe('layer2');
      expect(model.input.layers[1].resistivity).toBe(300);
      expect(model.input.layers[1].thickness).toBe(Infinity);
    });

    test('debe usar modelo uniforme por defecto', () => {
      const input = { soilResistivity: 100 };
      
      const model = new MultiLayerSoilModel(input);
      
      expect(model.input.model).toBe('uniform');
    });

    test('debe lanzar error con input nulo', () => {
      expect(() => new MultiLayerSoilModel(null)).toThrow('Soil input must be a valid object');
    });

    test('debe lanzar error con input indefinido', () => {
      expect(() => new MultiLayerSoilModel(undefined)).toThrow('Soil input must be a valid object');
    });

    test('debe lanzar error con modelo no soportado', () => {
      const input = {
        model: 'three-layer',
        layer1: { resistivity: 100, thickness: 5 },
        layer2: { resistivity: 300 }
      };
      
      expect(() => new MultiLayerSoilModel(input)).toThrow('Unsupported soil model');
    });

    test('debe aceptar resistividad alternativa', () => {
      const input = {
        resistivity: 150
      };
      
      const model = new MultiLayerSoilModel(input);
      
      expect(model.input.layers[0].resistivity).toBe(150);
    });
  });

  describe('Uniform Layer Validation', () => {
    test('debe validar resistividad positiva', () => {
      const input = { soilResistivity: 100 };
      
      const model = new MultiLayerSoilModel(input);
      
      expect(model.input.layers[0].resistivity).toBe(100);
    });

    test('debe lanzar error con resistividad cero', () => {
      const input = { soilResistivity: 0 };
      
      expect(() => new MultiLayerSoilModel(input)).toThrow('Uniform soil requires valid resistivity > 0');
    });

    test('debe lanzar error con resistividad negativa', () => {
      const input = { soilResistivity: -50 };
      
      expect(() => new MultiLayerSoilModel(input)).toThrow('Uniform soil requires valid resistivity > 0');
    });

    test('debe lanzar error con resistividad muy baja', () => {
      const input = { soilResistivity: 0.05 };
      
      expect(() => new MultiLayerSoilModel(input)).toThrow('Soil resistivity out of realistic range');
    });

    test('debe lanzar error con resistividad muy alta', () => {
      const input = { soilResistivity: 15000 };
      
      expect(() => new MultiLayerSoilModel(input)).toThrow('Soil resistivity out of realistic range');
    });

    test('debe aceptar limite inferior', () => {
      const input = { soilResistivity: 0.1 };
      
      const model = new MultiLayerSoilModel(input);
      
      expect(model.input.layers[0].resistivity).toBe(0.1);
    });

    test('debe aceptar limite superior', () => {
      const input = { soilResistivity: 10000 };
      
      const model = new MultiLayerSoilModel(input);
      
      expect(model.input.layers[0].resistivity).toBe(10000);
    });
  });

  describe('Two-Layer Validation', () => {
    test('debe validar layer1 resistividad', () => {
      const input = {
        model: 'two-layer',
        layer1: { resistivity: 100, thickness: 5 },
        layer2: { resistivity: 300 }
      };
      
      const model = new MultiLayerSoilModel(input);
      
      expect(model.input.layers[0].resistivity).toBe(100);
    });

    test('debe lanzar error sin layer1 resistividad', () => {
      const input = {
        model: 'two-layer',
        layer1: { thickness: 5 },
        layer2: { resistivity: 300 }
      };
      
      expect(() => new MultiLayerSoilModel(input)).toThrow('Layer 1 requires valid resistivity > 0');
    });

    test('debe lanzar error con layer1 resistividad cero', () => {
      const input = {
        model: 'two-layer',
        layer1: { resistivity: 0, thickness: 5 },
        layer2: { resistivity: 300 }
      };
      
      expect(() => new MultiLayerSoilModel(input)).toThrow('Layer 1 requires valid resistivity > 0');
    });

    test('debe validar layer1 thickness', () => {
      const input = {
        model: 'two-layer',
        layer1: { resistivity: 100, thickness: 5 },
        layer2: { resistivity: 300 }
      };
      
      const model = new MultiLayerSoilModel(input);
      
      expect(model.input.layers[0].thickness).toBe(5);
    });

    test('debe lanzar error sin layer1 thickness', () => {
      const input = {
        model: 'two-layer',
        layer1: { resistivity: 100 },
        layer2: { resistivity: 300 }
      };
      
      expect(() => new MultiLayerSoilModel(input)).toThrow('Layer 1 requires valid thickness > 0');
    });

    test('debe lanzar error con layer1 thickness cero', () => {
      const input = {
        model: 'two-layer',
        layer1: { resistivity: 100, thickness: 0 },
        layer2: { resistivity: 300 }
      };
      
      expect(() => new MultiLayerSoilModel(input)).toThrow('Layer 1 requires valid thickness > 0');
    });

    test('debe lanzar error con layer1 thickness excesivo', () => {
      const input = {
        model: 'two-layer',
        layer1: { resistivity: 100, thickness: 150 },
        layer2: { resistivity: 300 }
      };
      
      expect(() => new MultiLayerSoilModel(input)).toThrow('Layer 1 thickness exceeds practical limit');
    });

    test('debe validar layer2 resistividad', () => {
      const input = {
        model: 'two-layer',
        layer1: { resistivity: 100, thickness: 5 },
        layer2: { resistivity: 300 }
      };
      
      const model = new MultiLayerSoilModel(input);
      
      expect(model.input.layers[1].resistivity).toBe(300);
    });

    test('debe lanzar error sin layer2 resistividad', () => {
      const input = {
        model: 'two-layer',
        layer1: { resistivity: 100, thickness: 5 }
      };
      
      expect(() => new MultiLayerSoilModel(input)).toThrow('Layer 2 requires valid resistivity > 0');
    });

    test('debe lanzar error con capas esencialmente iguales', () => {
      const input = {
        model: 'two-layer',
        layer1: { resistivity: 100, thickness: 5 },
        layer2: { resistivity: 100.005 }
      };
      
      expect(() => new MultiLayerSoilModel(input)).toThrow('Layers have essentially same resistivity');
    });

    test('debe aceptar capas con diferencia significativa', () => {
      const input = {
        model: 'two-layer',
        layer1: { resistivity: 100, thickness: 5 },
        layer2: { resistivity: 300 }
      };
      
      const model = new MultiLayerSoilModel(input);
      
      expect(model.input.layers).toHaveLength(2);
    });
  });

  describe('Calculate Effective Resistivity', () => {
    test('debe retornar resistividad para modelo uniforme', () => {
      const input = { soilResistivity: 100 };
      const model = new MultiLayerSoilModel(input);
      
      const resistivity = model.calculateEffectiveResistivity();
      
      expect(resistivity).toBe(100);
    });

    test('debe calcular resistividad efectiva para dos capas', () => {
      const input = {
        model: 'two-layer',
        layer1: { resistivity: 100, thickness: 5 },
        layer2: { resistivity: 300 }
      };
      const model = new MultiLayerSoilModel(input);
      
      const resistivity = model.calculateEffectiveResistivity();
      
      // 0.7 * 100 + 0.3 * 300 = 70 + 90 = 160
      expect(resistivity).toBeCloseTo(160, 1);
    });

    test('debe agregar traceability', () => {
      const input = { soilResistivity: 100 };
      const model = new MultiLayerSoilModel(input);
      
      model.calculateEffectiveResistivity();
      
      const trace = model.getTraceability();
      expect(trace.length).toBeGreaterThan(0);
      expect(trace.some(t => t.calculation === 'effective_resistivity_calculation')).toBe(true);
    });
  });

  describe('Calculate Reflection Coefficient', () => {
    test('debe retornar 0 para modelo uniforme', () => {
      const input = { soilResistivity: 100 };
      const model = new MultiLayerSoilModel(input);
      
      const K = model.calculateReflectionCoefficient();
      
      expect(K).toBe(0);
    });

    test('debe calcular K para dos capas con contraste positivo', () => {
      const input = {
        model: 'two-layer',
        layer1: { resistivity: 100, thickness: 5 },
        layer2: { resistivity: 300 }
      };
      const model = new MultiLayerSoilModel(input);
      
      const K = model.calculateReflectionCoefficient();
      
      // (300 - 100) / (300 + 100) = 200 / 400 = 0.5
      expect(K).toBeCloseTo(0.5, 2);
    });

    test('debe calcular K para dos capas con contraste negativo', () => {
      const input = {
        model: 'two-layer',
        layer1: { resistivity: 300, thickness: 5 },
        layer2: { resistivity: 100 }
      };
      const model = new MultiLayerSoilModel(input);
      
      const K = model.calculateReflectionCoefficient();
      
      // (100 - 300) / (100 + 300) = -200 / 400 = -0.5
      expect(K).toBeCloseTo(-0.5, 2);
    });

    test('debe agregar traceability', () => {
      const input = {
        model: 'two-layer',
        layer1: { resistivity: 100, thickness: 5 },
        layer2: { resistivity: 300 }
      };
      const model = new MultiLayerSoilModel(input);
      
      model.calculateReflectionCoefficient();
      
      const trace = model.getTraceability();
      expect(trace.length).toBeGreaterThan(0);
    });
  });

  describe('Calculate Surface Layer Factor', () => {
    test('debe retornar 1.0 sin capa superficial', () => {
      const input = { soilResistivity: 100 };
      const model = new MultiLayerSoilModel(input);
      
      const factor = model.calculateSurfaceLayerFactor();
      
      expect(factor).toBe(1.0);
    });

    test('debe calcular factor con capa superficial', () => {
      const input = {
        soilResistivity: 100,
        surfaceLayer: { resistivity: 10000, thickness: 0.2 }
      };
      const model = new MultiLayerSoilModel(input);
      
      const factor = model.calculateSurfaceLayerFactor();
      
      expect(factor).toBeGreaterThan(0);
      expect(factor).not.toBe(1.0);
    });

    test('debe agregar traceability', () => {
      const input = {
        soilResistivity: 100,
        surfaceLayer: { resistivity: 10000, thickness: 0.2 }
      };
      const model = new MultiLayerSoilModel(input);
      
      model.calculateSurfaceLayerFactor();
      
      const trace = model.getTraceability();
      expect(trace.length).toBeGreaterThan(0);
    });
  });

  describe('Assess Soil Quality', () => {
    test('debe evaluar calidad excelente', () => {
      const input = { soilResistivity: 30 };
      const model = new MultiLayerSoilModel(input);
      
      const quality = model.assessSoilQuality();
      
      expect(quality.quality).toBe('excellent');
      expect(quality.color).toBe('green');
      expect(quality.assessment).toBe('Very good grounding conditions');
    });

    test('debe evaluar calidad buena', () => {
      const input = { soilResistivity: 75 };
      const model = new MultiLayerSoilModel(input);
      
      const quality = model.assessSoilQuality();
      
      expect(quality.quality).toBe('good');
      expect(quality.color).toBe('light-green');
    });

    test('debe evaluar calidad regular', () => {
      const input = { soilResistivity: 200 };
      const model = new MultiLayerSoilModel(input);
      
      const quality = model.assessSoilQuality();
      
      expect(quality.quality).toBe('fair');
      expect(quality.color).toBe('yellow');
    });

    test('debe evaluar calidad pobre', () => {
      const input = { soilResistivity: 500 };
      const model = new MultiLayerSoilModel(input);
      
      const quality = model.assessSoilQuality();
      
      expect(quality.quality).toBe('poor');
      expect(quality.color).toBe('orange');
    });

    test('debe evaluar calidad muy pobre', () => {
      const input = { soilResistivity: 1500 };
      const model = new MultiLayerSoilModel(input);
      
      const quality = model.assessSoilQuality();
      
      expect(quality.quality).toBe('very_poor');
      expect(quality.color).toBe('red');
    });

    test('debe incluir layerAssessment para dos capas', () => {
      const input = {
        model: 'two-layer',
        layer1: { resistivity: 100, thickness: 5 },
        layer2: { resistivity: 300 }
      };
      const model = new MultiLayerSoilModel(input);
      
      const quality = model.assessSoilQuality();
      
      expect(quality.layerAssessment).toBeDefined();
      expect(quality.layerAssessment.reflectionCoefficient).toBeDefined();
    });

    test('debe agregar traceability', () => {
      const input = { soilResistivity: 100 };
      const model = new MultiLayerSoilModel(input);
      
      model.assessSoilQuality();
      
      const trace = model.getTraceability();
      expect(trace.length).toBeGreaterThan(0);
    });
  });

  describe('Complete Analysis', () => {
    test('debe realizar análisis completo', () => {
      const input = {
        soilResistivity: 100,
        temperature: 25,
        humidity: 60,
        season: 'summer'
      };
      const model = new MultiLayerSoilModel(input);
      
      const analysis = model.analyze();
      
      expect(analysis).toBeDefined();
      expect(analysis.effectiveResistivity).toBe(100);
      expect(analysis.surfaceLayerFactor).toBe(1.0);
      expect(analysis.soilQuality).toBeDefined();
      expect(analysis.reflectionCoefficient).toBe(0);
      expect(analysis.model).toBe('uniform');
      expect(analysis.layers).toHaveLength(1);
      expect(analysis.temperature).toBe(25);
      expect(analysis.humidity).toBe(60);
      expect(analysis.season).toBe('summer');
      expect(analysis.traceability).toBeDefined();
    });

    test('debe incluir traceability completa', () => {
      const input = { soilResistivity: 100 };
      const model = new MultiLayerSoilModel(input);
      
      const analysis = model.analyze();
      
      expect(analysis.traceability).toBeDefined();
      expect(Array.isArray(analysis.traceability)).toBe(true);
      expect(analysis.traceability.length).toBeGreaterThan(0);
    });

    test('debe analizar modelo de dos capas', () => {
      const input = {
        model: 'two-layer',
        layer1: { resistivity: 100, thickness: 5 },
        layer2: { resistivity: 300 }
      };
      const model = new MultiLayerSoilModel(input);
      
      const analysis = model.analyze();
      
      expect(analysis.model).toBe('two-layer');
      expect(analysis.layers).toHaveLength(2);
      expect(analysis.reflectionCoefficient).not.toBe(0);
    });
  });

  describe('Traceability', () => {
    test('debe inicializar traceability con entrada de validación', () => {
      const input = { soilResistivity: 100 };
      const model = new MultiLayerSoilModel(input);
      
      expect(model.traceability).toBeDefined();
      expect(model.traceability.length).toBeGreaterThan(0);
      expect(model.traceability[0].calculation).toBe('soil_input_validation');
    });

    test('debe agregar entrada de traceability', () => {
      const input = { soilResistivity: 100 };
      const model = new MultiLayerSoilModel(input);
      
      const initialLength = model.traceability.length;
      model.addTrace('test_calculation', { value: 42 });
      
      expect(model.traceability.length).toBe(initialLength + 1);
      const lastEntry = model.traceability[model.traceability.length - 1];
      expect(lastEntry.calculation).toBe('test_calculation');
      expect(lastEntry.value).toBe(42);
    });

    test('debe incluir timestamp en traceability', () => {
      const input = { soilResistivity: 100 };
      const model = new MultiLayerSoilModel(input);
      
      model.addTrace('test_calculation', { value: 42 });
      
      const lastEntry = model.traceability[model.traceability.length - 1];
      expect(lastEntry.timestamp).toBeDefined();
      expect(typeof lastEntry.timestamp).toBe('string');
    });

    test('debe incluir modelo y estandar en traceability', () => {
      const input = { soilResistivity: 100 };
      const model = new MultiLayerSoilModel(input);
      
      model.addTrace('test_calculation', { value: 42 });
      
      const lastEntry = model.traceability[model.traceability.length - 1];
      expect(lastEntry.model).toBe('MultiLayerSoilModel');
      expect(lastEntry.standard).toBe('IEEE 80-2013');
    });

    test('debe retornar traceability', () => {
      const input = { soilResistivity: 100 };
      const model = new MultiLayerSoilModel(input);
      
      model.addTrace('test_calculation', { value: 42 });
      
      const trace = model.getTraceability();
      
      expect(trace).toEqual(model.traceability);
    });
  });
});
