import UnifiedEngine from './UnifiedEngine.js';

class GroundingCalculator {
  constructor(input) {
    this.engine = new UnifiedEngine(input);
  }

  calculate() {
    return this.engine.calculate();
  }

  export(format) {
    return this.engine.export(format);
  }

  getStatistics() {
    return this.engine.getStatistics();
  }
}

export default GroundingCalculator;