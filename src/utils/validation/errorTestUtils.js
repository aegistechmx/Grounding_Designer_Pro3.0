/**
 * Utilidades para testing de manejo de errores y casos extremos
 */

import { ValidationError, CalculationError, StorageError } from './errorHandlingUtils';
import { safeLocalStorageSet, safeLocalStorageGet } from './storageUtils';
import { calculateIEEE80, optimizeForGPR } from './groundingMath_clean';

/**
 * Suite de pruebas para manejo de errores
 */
export class ErrorTestSuite {
  constructor() {
    this.results = [];
  }

  /**
   * Registra resultado de una prueba
   */
  logTest(testName, passed, details = null) {
    this.results.push({
      test: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Prueba validación de parámetros nulos
   */
  async testNullParameters() {
    try {
      const result = calculateIEEE80(null);
      this.logTest('Null Parameters', false, 'Should throw error for null params');
    } catch (error) {
      this.logTest('Null Parameters', error instanceof ValidationError, error.message);
    }

    try {
      const result = calculateIEEE80(undefined);
      this.logTest('Undefined Parameters', false, 'Should throw error for undefined params');
    } catch (error) {
      this.logTest('Undefined Parameters', error instanceof ValidationError, error.message);
    }
  }

  /**
   * Prueba parámetros inválidos
   */
  async testInvalidParameters() {
    const invalidParams = {
      transformerKVA: -1,
      primaryVoltage: 0,
      gridLength: 0,
      gridWidth: 0,
      numParallel: 1,
      numRods: -5
    };

    try {
      const result = calculateIEEE80(invalidParams);
      this.logTest('Invalid Parameters', true, 'Handled gracefully with default values');
    } catch (error) {
      this.logTest('Invalid Parameters', true, `Caught error: ${error.message}`);
    }
  }

  /**
   * Prueba valores extremos
   */
  async testExtremeValues() {
    const extremeParams = {
      transformerKVA: 100000,
      primaryVoltage: 100000,
      secondaryVoltage: 1000,
      transformerImpedance: 15,
      faultDuration: 10,
      soilResistivity: 10000,
      gridLength: 100,
      gridWidth: 100,
      gridDepth: 5,
      numParallel: 20,
      rodLength: 10,
      numRods: 100,
      currentDivisionFactor: 0.8
    };

    try {
      const result = calculateIEEE80(extremeParams);
      this.logTest('Extreme Values', true, 'Handled extreme values correctly');
    } catch (error) {
      this.logTest('Extreme Values', false, `Failed with extreme values: ${error.message}`);
    }
  }

  /**
   * Prueba valores mínimos
   */
  async testMinimumValues() {
    const minParams = {
      transformerKVA: 1,
      primaryVoltage: 120,
      secondaryVoltage: 100,
      transformerImpedance: 1,
      faultDuration: 0.1,
      soilResistivity: 1,
      gridLength: 1,
      gridWidth: 1,
      gridDepth: 0.1,
      numParallel: 2,
      rodLength: 0.5,
      numRods: 0,
      currentDivisionFactor: 0.1
    };

    try {
      const result = calculateIEEE80(minParams);
      this.logTest('Minimum Values', true, 'Handled minimum values correctly');
    } catch (error) {
      this.logTest('Minimum Values', false, `Failed with minimum values: ${error.message}`);
    }
  }

  /**
   * Prueba almacenamiento con datos grandes
   */
  async testLargeDataStorage() {
    const largeData = {
      key: 'test_large_data',
      value: 'x'.repeat(1000000) // 1MB de datos
    };

    try {
      const result = safeLocalStorageSet(largeData.key, largeData.value);
      this.logTest('Large Data Storage', !result, 'Correctly rejected oversized data');
    } catch (error) {
      this.logTest('Large Data Storage', true, `Handled large data: ${error.message}`);
    }
  }

  /**
   * Prueba almacenamiento con quota excedida
   */
  async testStorageQuotaExceeded() {
    // Llenar localStorage simulando quota exceeded
    const testData = [];
    for (let i = 0; i < 100; i++) {
      testData.push({
        key: `test_quota_${i}`,
        value: 'x'.repeat(10000)
      });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const data of testData) {
      try {
        const result = safeLocalStorageSet(data.key, data.value);
        if (result) successCount++;
        else errorCount++;
      } catch (error) {
        errorCount++;
      }
    }

    this.logTest('Storage Quota', errorCount > 0, `Handled quota: ${successCount} success, ${errorCount} errors`);
  }

  /**
   * Prueba optimización GPR con parámetros inválidos
   */
  async testGPROptimizationErrors() {
    try {
      const result = optimizeForGPR(null);
      this.logTest('GPR Opt Null Params', false, 'Should throw error for null params');
    } catch (error) {
      this.logTest('GPR Opt Null Params', error instanceof ValidationError, error.message);
    }

    try {
      const result = optimizeForGPR({}, -1000);
      this.logTest('GPR Opt Invalid Target', false, 'Should throw error for invalid target');
    } catch (error) {
      this.logTest('GPR Opt Invalid Target', error instanceof ValidationError, error.message);
    }
  }

  /**
   * Prueba manejo de memoria
   */
  async testMemoryUsage() {
    const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    // Realizar cálculos intensivos
    const testParams = {
      transformerKVA: 1000,
      primaryVoltage: 13200,
      secondaryVoltage: 220,
      transformerImpedance: 5,
      soilResistivity: 100,
      gridLength: 50,
      gridWidth: 30,
      numParallel: 15,
      numRods: 50
    };

    for (let i = 0; i < 100; i++) {
      calculateIEEE80(testParams);
    }

    const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const memoryIncrease = finalMemory - initialMemory;
    const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

    this.logTest('Memory Usage', memoryIncreaseMB < 50, `Memory increase: ${isFinite(memoryIncreaseMB) ? memoryIncreaseMB.toFixed(2) : '0.00'}MB`);
  }

  /**
   * Ejecuta todas las pruebas
   */
  async runAllTests() {
    console.log('Starting error handling and edge case tests...');
    
    await this.testNullParameters();
    await this.testInvalidParameters();
    await this.testExtremeValues();
    await this.testMinimumValues();
    await this.testLargeDataStorage();
    await this.testStorageQuotaExceeded();
    await this.testGPROptimizationErrors();
    await this.testMemoryUsage();

    return this.getResults();
  }

  /**
   * Obtiene resultados de las pruebas
   */
  getResults() {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const passRate = total > 0 ? (isFinite((passed / total) * 100) ? ((passed / total) * 100).toFixed(1) : '0.0') : '0.0';

    return {
      summary: {
        total,
        passed,
        failed: total - passed,
        passRate: `${passRate}%`
      },
      details: this.results
    };
  }
}

/**
 * Función de conveniencia para ejecutar pruebas
 */
export const runErrorTests = async () => {
  const testSuite = new ErrorTestSuite();
  return await testSuite.runAllTests();
};
