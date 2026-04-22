/**
 * Professional Unit System - Engineering-grade unit management
 * Ensures consistent SI units throughout all calculations
 */

class UnitValue {
  constructor(value, unit, metadata = {}) {
    this.value = value;
    this.unit = unit;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
  }

  toString(precision = 2) {
    return `${this.value.toFixed(precision)} ${this.unit}`;
  }

  toSI() {
    return UnitSystem.toSI(this);
  }
}

class UnitSystem {
  
  // SI base units
  static SI_BASE_UNITS = {
    length: 'meter',
    mass: 'kilogram',
    time: 'second',
    electric_current: 'ampere',
    temperature: 'kelvin',
    amount_of_substance: 'mole',
    luminous_intensity: 'candela'
  };

  // Conversion factors to SI
  static CONVERSION_FACTORS = {
    // Length
    meter: 1,
    kilometre: 1000,
    kilometer: 1000,
    metre: 1,
    foot: 0.3048,
    feet: 0.3048,
    inch: 0.0254,
    inches: 0.0254,
    yard: 0.9144,
    mile: 1609.344,
    centimeter: 0.01,
    centimetre: 0.01,
    millimeter: 0.001,
    millimetre: 0.001,
    
    // Electrical resistance
    ohm: 1,
    ohms: 1,
    kilohm: 1000,
    megaohm: 1000000,
    microhm: 0.000001,
    
    // Electrical resistivity
    'ohm-meter': 1,
    'ohm-metre': 1,
    'ohm-centimeter': 0.01,
    'ohm-centimetre': 0.01,
    'ohm-inch': 0.0254,
    'ohm-foot': 0.3048,
    'microhm-centimeter': 1e-8,
    'microhm-centimetre': 1e-8,
    
    // Area
    'square-meter': 1,
    'square-metre': 1,
    'square-foot': 0.092903,
    'square-inch': 0.00064516,
    'square-centimeter': 0.0001,
    'square-centimetre': 0.0001,
    'square-millimeter': 1e-6,
    'square-millimetre': 1e-6,
    acre: 4046.86,
    hectare: 10000,
    
    // Electrical current
    ampere: 1,
    amp: 1,
    ampere: 1,
    kiloampere: 1000,
    kiloamp: 1000,
    megaampere: 1000000,
    milliampere: 0.001,
    microampere: 0.000001,
    
    // Electrical voltage
    volt: 1,
    volts: 1,
    kilovolt: 1000,
    megavolt: 1000000,
    millivolt: 0.001,
    microvolt: 0.000001,
    
    // Temperature
    kelvin: 1,
    celsius: (value) => value + 273.15,
    fahrenheit: (value) => (value - 32) * 5/9 + 273.15,
    rankine: (value) => value * 5/9,
    
    // Time
    second: 1,
    seconds: 1,
    millisecond: 0.001,
    microsecond: 0.000001,
    minute: 60,
    hour: 3600,
    day: 86400,
    
    // Mass
    kilogram: 1,
    gram: 0.001,
    milligram: 0.000001,
    pound: 0.453592,
    ounce: 0.0283495
  };

  // Dimension categories
  static DIMENSIONS = {
    length: ['meter', 'foot', 'inch', 'yard', 'mile', 'centimeter', 'millimeter', 'kilometre'],
    resistance: ['ohm', 'kilohm', 'megaohm', 'microhm'],
    resistivity: ['ohm-meter', 'ohm-centimeter', 'ohm-inch', 'ohm-foot', 'microhm-centimeter'],
    area: ['square-meter', 'square-foot', 'square-inch', 'acre', 'hectare'],
    current: ['ampere', 'kiloampere', 'milliampere', 'microampere'],
    voltage: ['volt', 'kilovolt', 'millivolt', 'microvolt'],
    temperature: ['kelvin', 'celsius', 'fahrenheit', 'rankine'],
    time: ['second', 'millisecond', 'minute', 'hour'],
    mass: ['kilogram', 'gram', 'pound', 'ounce']
  };

  /**
   * Convert any unit to SI
   */
  static toSI(unitValue) {
    if (!(unitValue instanceof UnitValue)) {
      throw new Error('Input must be a UnitValue instance');
    }

    const { value, unit } = unitValue;
    const siUnit = this.getSIUnit(unit);

    if (this.CONVERSION_FACTORS[unit] === undefined) {
      throw new Error(`Unsupported unit: ${unit}`);
    }

    let siValue;
    const factor = this.CONVERSION_FACTORS[unit];
    
    if (typeof factor === 'function') {
      siValue = factor(value);
    } else {
      siValue = value * factor;
    }

    return new UnitValue(siValue, siUnit, {
      ...unitValue.metadata,
      originalUnit: unit,
      originalValue: value
    });
  }

  /**
   * Get SI unit for any given unit
   */
  static getSIUnit(unit) {
    for (const [dimension, units] of Object.entries(this.DIMENSIONS)) {
      if (units.includes(unit)) {
        return this.SI_BASE_UNITS[dimension] || unit;
      }
    }
    
    // If unit is already SI or not found
    return unit;
  }

  /**
   * Create UnitValue with validation
   */
  static create(value, unit, metadata = {}) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`Value must be a number, got ${typeof value}: ${value}`);
    }

    if (!unit || typeof unit !== 'string') {
      throw new Error(`Unit must be a non-empty string, got ${typeof unit}: ${unit}`);
    }

    // Validate unit is supported
    const normalizedUnit = this.normalizeUnitName(unit);
    if (this.CONVERSION_FACTORS[normalizedUnit] === undefined) {
      throw new Error(`Unsupported unit: ${unit} (normalized: ${normalizedUnit})`);
    }

    return new UnitValue(value, normalizedUnit, metadata);
  }

  /**
   * Normalize unit names (handle plurals, variations)
   */
  static normalizeUnitName(unit) {
    const normalized = unit.toLowerCase().trim();
    
    // Handle common variations
    const variations = {
      'meters': 'meter',
      'metres': 'meter',
      'feet': 'foot',
      'inches': 'inch',
      'yards': 'yard',
      'miles': 'mile',
      'centimeters': 'centimeter',
      'centimetres': 'centimeter',
      'millimeters': 'millimeter',
      'millimetres': 'millimetre',
      'kilometres': 'kilometre',
      'kilometers': 'kilometre',
      'ohms': 'ohm',
      'volts': 'volt',
      'amps': 'ampere',
      'seconds': 'second',
      'minutes': 'minute',
      'hours': 'hour',
      'days': 'day',
      'kilograms': 'kilogram',
      'grams': 'gram',
      'pounds': 'pound',
      'ounces': 'ounce'
    };

    return variations[normalized] || normalized;
  }

  /**
   * Convert between units
   */
  static convert(unitValue, targetUnit) {
    const siValue = this.toSI(unitValue);
    const targetSIUnit = this.getSIUnit(targetUnit);
    const normalizedTarget = this.normalizeUnitName(targetUnit);

    if (siValue.unit !== targetSIUnit) {
      throw new Error(`Cannot convert between different dimensions: ${siValue.unit} -> ${targetSIUnit}`);
    }

    const factor = this.CONVERSION_FACTORS[normalizedTarget];
    if (factor === undefined) {
      throw new Error(`Unsupported target unit: ${targetUnit}`);
    }

    let targetValue;
    if (typeof factor === 'function') {
      // For temperature, we need inverse conversion
      if (normalizedTarget === 'celsius') {
        targetValue = siValue.value - 273.15;
      } else if (normalizedTarget === 'fahrenheit') {
        targetValue = (siValue.value - 273.15) * 9/5 + 32;
      } else if (normalizedTarget === 'rankine') {
        targetValue = siValue.value * 9/5;
      } else {
        targetValue = factor(siValue.value);
      }
    } else {
      targetValue = siValue.value / factor;
    }

    return new UnitValue(targetValue, normalizedTarget, {
      ...unitValue.metadata,
      conversion: {
        from: unitValue.unit,
        to: normalizedTarget,
        siValue: siValue.value
      }
    });
  }

  /**
   * Normalize entire input object to SI units
   */
  static normalizeInput(input) {
    const normalized = JSON.parse(JSON.stringify(input)); // Deep clone

    // Normalize soil parameters
    if (normalized.soil) {
      if (normalized.soil.soilResistivity !== undefined) {
        normalized.soil.soilResistivity = this.normalizeLengthResistivity(
          normalized.soil.soilResistivity,
          'soilResistivity'
        );
      }
      
      if (normalized.soil.surfaceLayerResistivity !== undefined) {
        normalized.soil.surfaceLayerResistivity = this.normalizeLengthResistivity(
          normalized.soil.surfaceLayerResistivity,
          'surfaceLayerResistivity'
        );
      }
      
      if (normalized.soil.surfaceLayerThickness !== undefined) {
        normalized.soil.surfaceLayerThickness = this.normalizeLength(
          normalized.soil.surfaceLayerThickness,
          'surfaceLayerThickness'
        );
      }
    }

    // Normalize grid parameters
    if (normalized.grid) {
      ['gridLength', 'gridWidth', 'rodLength', 'gridDepth'].forEach(param => {
        if (normalized.grid[param] !== undefined) {
          normalized.grid[param] = this.normalizeLength(normalized.grid[param], param);
        }
      });
    }

    // Normalize fault parameters
    if (normalized.fault) {
      if (normalized.fault.faultCurrent !== undefined) {
        normalized.fault.faultCurrent = this.normalizeCurrent(normalized.fault.faultCurrent);
      }
      
      if (normalized.fault.systemVoltage !== undefined) {
        normalized.fault.systemVoltage = this.normalizeVoltage(normalized.fault.systemVoltage);
      }
    }

    return normalized;
  }

  /**
   * Normalize length to meters
   */
  static normalizeLength(value, fieldName = 'length') {
    if (typeof value === 'number') {
      return value; // Assume already in meters
    }
    
    if (typeof value === 'object' && value.value !== undefined && value.unit !== undefined) {
      const unitValue = this.create(value.value, value.unit);
      const siValue = this.toSI(unitValue);
      return siValue.value;
    }
    
    throw new Error(`Invalid length value for ${fieldName}: ${JSON.stringify(value)}`);
  }

  /**
   * Normalize resistivity to ohm-meters
   */
  static normalizeLengthResistivity(value, fieldName = 'resistivity') {
    if (typeof value === 'number') {
      return value; // Assume already in ohm-meters
    }
    
    if (typeof value === 'object' && value.value !== undefined && value.unit !== undefined) {
      const unitValue = this.create(value.value, value.unit);
      const siValue = this.toSI(unitValue);
      return siValue.value;
    }
    
    throw new Error(`Invalid resistivity value for ${fieldName}: ${JSON.stringify(value)}`);
  }

  /**
   * Normalize current to amperes
   */
  static normalizeCurrent(value) {
    if (typeof value === 'number') {
      return value; // Assume already in amperes
    }
    
    if (typeof value === 'object' && value.value !== undefined && value.unit !== undefined) {
      const unitValue = this.create(value.value, value.unit);
      const siValue = this.toSI(unitValue);
      return siValue.value;
    }
    
    throw new Error(`Invalid current value: ${JSON.stringify(value)}`);
  }

  /**
   * Normalize voltage to volts
   */
  static normalizeVoltage(value) {
    if (typeof value === 'number') {
      return value; // Assume already in volts
    }
    
    if (typeof value === 'object' && value.value !== undefined && value.unit !== undefined) {
      const unitValue = this.create(value.value, value.unit);
      const siValue = this.toSI(unitValue);
      return siValue.value;
    }
    
    throw new Error(`Invalid voltage value: ${JSON.stringify(value)}`);
  }

  /**
   * Format value with appropriate unit
   */
  static format(value, unit, precision = 2) {
    const unitValue = this.create(value, unit);
    return unitValue.toString(precision);
  }

  /**
   * Validate unit consistency across calculation
   */
  static validateUnitConsistency(calculation, inputs, outputs) {
    const errors = [];

    // Check if all inputs have valid units
    for (const [name, value] of Object.entries(inputs)) {
      if (typeof value === 'object' && value.unit !== undefined) {
        try {
          this.create(value.value, value.unit);
        } catch (error) {
          errors.push(`Invalid unit in input ${name}: ${error.message}`);
        }
      }
    }

    // Check if outputs have expected units
    for (const [name, value] of Object.entries(outputs)) {
      if (typeof value === 'object' && value.unit !== undefined) {
        try {
          this.create(value.value, value.unit);
        } catch (error) {
          errors.push(`Invalid unit in output ${name}: ${error.message}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export { UnitValue, UnitSystem };
export default UnitSystem;
