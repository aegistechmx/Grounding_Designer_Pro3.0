/**
 * Units Conversion Utilities - Professional unit conversion for grounding calculations
 * Ensures consistent units throughout the calculation engine
 */

class UnitsUtils {
  /**
   * Length conversion factors (to meters)
   */
  static LENGTH_CONVERSIONS = {
    meters: 1,
    feet: 0.3048,
    inches: 0.0254,
    centimeters: 0.01,
    millimeters: 0.001,
    kilometers: 1000,
    miles: 1609.344,
    yards: 0.9144
  };

  /**
   * Resistivity conversion factors (to ohm-meters)
   */
  static RESISTIVITY_CONVERSIONS = {
    'ohm-meter': 1,
    'ohm-centimeter': 0.01,
    'ohm-inch': 0.0254,
    'ohm-foot': 0.3048,
    'ohm-kilometer': 1000,
    'microhm-centimeter': 1e-8,
    'microhm-inch': 2.54e-8
  };

  /**
   * Area conversion factors (to square meters)
   */
  static AREA_CONVERSIONS = {
    'square-meter': 1,
    'square-foot': 0.092903,
    'square-inch': 0.00064516,
    'square-centimeter': 0.0001,
    'square-millimeter': 1e-6,
    'acre': 4046.86,
    'hectare': 10000
  };

  /**
   * Current conversion factors (to amperes)
   */
  static CURRENT_CONVERSIONS = {
    ampere: 1,
    milliampere: 0.001,
    microampere: 1e-6,
    kiloampere: 1000,
    megaampere: 1e6
  };

  /**
   * Voltage conversion factors (to volts)
   */
  static VOLTAGE_CONVERSIONS = {
    volt: 1,
    millivolt: 0.001,
    microvolt: 1e-6,
    kilovolt: 1000,
    megavolt: 1e6
  };

  /**
   * Temperature conversion factors
   */
  static TEMPERATURE_CONVERSIONS = {
    celsius: (value) => value,
    fahrenheit: (value) => (value - 32) * 5/9,
    kelvin: (value) => value - 273.15,
    rankine: (value) => (value - 491.67) * 5/9
  };

  /**
   * Convert length to meters
   */
  static convertLength(value, fromUnit) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`Invalid length value: ${value}`);
    }

    const conversion = this.LENGTH_CONVERSIONS[fromUnit.toLowerCase()];
    if (!conversion) {
      throw new Error(`Unsupported length unit: ${fromUnit}`);
    }

    return value * conversion;
  }

  /**
   * Convert resistivity to ohm-meters
   */
  static convertResistivity(value, fromUnit) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`Invalid resistivity value: ${value}`);
    }

    const conversion = this.RESISTIVITY_CONVERSIONS[fromUnit.toLowerCase()];
    if (!conversion) {
      throw new Error(`Unsupported resistivity unit: ${fromUnit}`);
    }

    return value * conversion;
  }

  /**
   * Convert area to square meters
   */
  static convertArea(value, fromUnit) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`Invalid area value: ${value}`);
    }

    const conversion = this.AREA_CONVERSIONS[fromUnit.toLowerCase()];
    if (!conversion) {
      throw new Error(`Unsupported area unit: ${fromUnit}`);
    }

    return value * conversion;
  }

  /**
   * Convert current to amperes
   */
  static convertCurrent(value, fromUnit) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`Invalid current value: ${value}`);
    }

    const conversion = this.CURRENT_CONVERSIONS[fromUnit.toLowerCase()];
    if (!conversion) {
      throw new Error(`Unsupported current unit: ${fromUnit}`);
    }

    return value * conversion;
  }

  /**
   * Convert voltage to volts
   */
  static convertVoltage(value, fromUnit) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`Invalid voltage value: ${value}`);
    }

    const conversion = this.VOLTAGE_CONVERSIONS[fromUnit.toLowerCase()];
    if (!conversion) {
      throw new Error(`Unsupported voltage unit: ${fromUnit}`);
    }

    return value * conversion;
  }

  /**
   * Convert temperature to Celsius
   */
  static convertTemperature(value, fromUnit) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`Invalid temperature value: ${value}`);
    }

    const conversion = this.TPERATURE_CONVERSIONS[fromUnit.toLowerCase()];
    if (!conversion) {
      throw new Error(`Unsupported temperature unit: ${fromUnit}`);
    }

    return conversion(value);
  }

  /**
   * Convert AWG to mm²
   */
  static convertAWGToMm2(awg) {
    const awgTable = {
      '4/0': 107.16,
      '3/0': 85.01,
      '2/0': 67.43,
      '1/0': 53.49,
      '1': 42.41,
      '2': 33.63,
      '3': 26.67,
      '4': 21.15,
      '6': 13.30,
      '8': 8.37,
      '10': 5.26,
      '12': 3.31,
      '14': 2.08
    };

    const result = awgTable[awg.toString().toUpperCase()];
    if (result === undefined) {
      throw new Error(`Unsupported AWG size: ${awg}`);
    }

    return result;
  }

  /**
   * Convert mm² to AWG
   */
  static convertMm2ToAWG(mm2) {
    const awgTable = {
      '4/0': 107.16,
      '3/0': 85.01,
      '2/0': 67.43,
      '1/0': 53.49,
      '1': 42.41,
      '2': 33.63,
      '3': 26.67,
      '4': 21.15,
      '6': 13.30,
      '8': 8.37,
      '10': 5.26,
      '12': 3.31,
      '14': 2.08
    };

    // Find closest AWG size
    let closestAWG = null;
    let minDiff = Infinity;

    for (const [awg, area] of Object.entries(awgTable)) {
      const diff = Math.abs(area - mm2);
      if (diff < minDiff) {
        minDiff = diff;
        closestAWG = awg;
      }
    }

    return closestAWG;
  }

  /**
   * Normalize grounding input to standard units
   */
  static normalizeGroundingInput(input) {
    const normalized = JSON.parse(JSON.stringify(input)); // Deep copy

    // Normalize soil parameters
    if (normalized.soil) {
      if (normalized.soil.soilResistivity && normalized.soil.soilResistivityUnit) {
        normalized.soil.soilResistivity = this.convertResistivity(
          normalized.soil.soilResistivity,
          normalized.soil.soilResistivityUnit
        );
        delete normalized.soil.soilResistivityUnit;
      }

      if (normalized.soil.surfaceLayerResistivity && normalized.soil.surfaceLayerResistivityUnit) {
        normalized.soil.surfaceLayerResistivity = this.convertResistivity(
          normalized.soil.surfaceLayerResistivity,
          normalized.soil.surfaceLayerResistivityUnit
        );
        delete normalized.soil.surfaceLayerResistivityUnit;
      }

      if (normalized.soil.surfaceLayerThickness && normalized.soil.surfaceLayerThicknessUnit) {
        normalized.soil.surfaceLayerThickness = this.convertLength(
          normalized.soil.surfaceLayerThickness,
          normalized.soil.surfaceLayerThicknessUnit
        );
        delete normalized.soil.surfaceLayerThicknessUnit;
      }

      if (normalized.soil.temperature && normalized.soil.temperatureUnit) {
        normalized.soil.temperature = this.convertTemperature(
          normalized.soil.temperature,
          normalized.soil.temperatureUnit
        );
        delete normalized.soil.temperatureUnit;
      }
    }

    // Normalize grid parameters
    if (normalized.grid) {
      if (normalized.grid.gridLength && normalized.grid.gridLengthUnit) {
        normalized.grid.gridLength = this.convertLength(
          normalized.grid.gridLength,
          normalized.grid.gridLengthUnit
        );
        delete normalized.grid.gridLengthUnit;
      }

      if (normalized.grid.gridWidth && normalized.grid.gridWidthUnit) {
        normalized.grid.gridWidth = this.convertLength(
          normalized.grid.gridWidth,
          normalized.grid.gridWidthUnit
        );
        delete normalized.grid.gridWidthUnit;
      }

      if (normalized.grid.rodLength && normalized.grid.rodLengthUnit) {
        normalized.grid.rodLength = this.convertLength(
          normalized.grid.rodLength,
          normalized.grid.rodLengthUnit
        );
        delete normalized.grid.rodLengthUnit;
      }

      if (normalized.grid.gridDepth && normalized.grid.gridDepthUnit) {
        normalized.grid.gridDepth = this.convertLength(
          normalized.grid.gridDepth,
          normalized.grid.gridDepthUnit
        );
        delete normalized.grid.gridDepthUnit;
      }

      if (normalized.grid.gridSpacing && normalized.grid.gridSpacingUnit) {
        if (typeof normalized.grid.gridSpacing === 'object') {
          if (normalized.grid.gridSpacing.x) {
            normalized.grid.gridSpacing.x = this.convertLength(
              normalized.grid.gridSpacing.x,
              normalized.grid.gridSpacingUnit
            );
          }
          if (normalized.grid.gridSpacing.y) {
            normalized.grid.gridSpacing.y = this.convertLength(
              normalized.grid.gridSpacing.y,
              normalized.grid.gridSpacingUnit
            );
          }
        } else {
          normalized.grid.gridSpacing = this.convertLength(
            normalized.grid.gridSpacing,
            normalized.grid.gridSpacingUnit
          );
        }
        delete normalized.grid.gridSpacingUnit;
      }
    }

    // Normalize fault parameters
    if (normalized.fault) {
      if (normalized.fault.faultCurrent && normalized.fault.faultCurrentUnit) {
        normalized.fault.faultCurrent = this.convertCurrent(
          normalized.fault.faultCurrent,
          normalized.fault.faultCurrentUnit
        );
        delete normalized.fault.faultCurrentUnit;
      }

      if (normalized.fault.systemVoltage && normalized.fault.systemVoltageUnit) {
        normalized.fault.systemVoltage = this.convertVoltage(
          normalized.fault.systemVoltage,
          normalized.fault.systemVoltageUnit
        );
        delete normalized.fault.systemVoltageUnit;
      }
    }

    return normalized;
  }

  /**
   * Format number with appropriate units
   */
  static formatWithUnits(value, unit, decimals = 2) {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return 'N/A';
    }

    const formatted = value.toFixed(decimals);
    return `${formatted} ${unit}`;
  }

  /**
   * Format length with appropriate unit
   */
  static formatLength(value, decimals = 2) {
    if (value < 1) {
      return this.formatWithUnits(value * 100, 'cm', decimals);
    } else if (value < 1000) {
      return this.formatWithUnits(value, 'm', decimals);
    } else {
      return this.formatWithUnits(value / 1000, 'km', decimals);
    }
  }

  /**
   * Format resistivity with appropriate unit
   */
  static formatResistivity(value, decimals = 0) {
    if (value < 1) {
      return this.formatWithUnits(value * 100, 'ohm-cm', decimals);
    } else {
      return this.formatWithUnits(value, 'ohm-m', decimals);
    }
  }

  /**
   * Format voltage with appropriate unit
   */
  static formatVoltage(value, decimals = 0) {
    if (value < 1000) {
      return this.formatWithUnits(value, 'V', decimals);
    } else if (value < 1000000) {
      return this.formatWithUnits(value / 1000, 'kV', decimals);
    } else {
      return this.formatWithUnits(value / 1000000, 'MV', decimals);
    }
  }

  /**
   * Format current with appropriate unit
   */
  static formatCurrent(value, decimals = 0) {
    if (value < 1000) {
      return this.formatWithUnits(value, 'A', decimals);
    } else if (value < 1000000) {
      return this.formatWithUnits(value / 1000, 'kA', decimals);
    } else {
      return this.formatWithUnits(value / 1000000, 'MA', decimals);
    }
  }

  /**
   * Get supported units for a type
   */
  static getSupportedUnits(type) {
    const units = {
      length: Object.keys(this.LENGTH_CONVERSIONS),
      resistivity: Object.keys(this.RESISTIVITY_CONVERSIONS),
      area: Object.keys(this.AREA_CONVERSIONS),
      current: Object.keys(this.CURRENT_CONVERSIONS),
      voltage: Object.keys(this.VOLTAGE_CONVERSIONS),
      temperature: Object.keys(this.TEMPERATURE_CONVERSIONS)
    };

    return units[type] || [];
  }

  /**
   * Validate unit
   */
  static validateUnit(unit, type) {
    const supportedUnits = this.getSupportedUnits(type);
    return supportedUnits.includes(unit.toLowerCase());
  }

  /**
   * Convert between any two units of the same type
   */
  static convert(value, fromUnit, toUnit, type) {
    // Convert to base unit first
    let baseValue;
    switch (type) {
      case 'length':
        baseValue = this.convertLength(value, fromUnit);
        return baseValue / this.LENGTH_CONVERSIONS[toUnit.toLowerCase()];
      case 'resistivity':
        baseValue = this.convertResistivity(value, fromUnit);
        return baseValue / this.RESISTIVITY_CONVERSIONS[toUnit.toLowerCase()];
      case 'area':
        baseValue = this.convertArea(value, fromUnit);
        return baseValue / this.AREA_CONVERSIONS[toUnit.toLowerCase()];
      case 'current':
        baseValue = this.convertCurrent(value, fromUnit);
        return baseValue / this.CURRENT_CONVERSIONS[toUnit.toLowerCase()];
      case 'voltage':
        baseValue = this.convertVoltage(value, fromUnit);
        return baseValue / this.VOLTAGE_CONVERSIONS[toUnit.toLowerCase()];
      default:
        throw new Error(`Unsupported unit type: ${type}`);
    }
  }
}

export default UnitsUtils;
