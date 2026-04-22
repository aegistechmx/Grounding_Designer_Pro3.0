// tests/workers/WorkerManager.test.js
import { workerManager } from '../../src/workers/WorkerManager.js';

// Mock para Web Worker
global.Worker = class MockWorker {
  constructor() {
    this.onmessage = null;
    this.onerror = null;
  }
  postMessage() {}
  terminate() {}
};

describe('WorkerManager', () => {
  beforeEach(() => {
    workerManager.terminateAll();
  });

  test('debe crear worker por tipo', () => {
    const worker = workerManager.getWorker('fem');
    expect(worker).toBeDefined();
  });

  test('debe reutilizar worker existente', () => {
    const worker1 = workerManager.getWorker('fem');
    const worker2 = workerManager.getWorker('fem');
    expect(worker1).toBe(worker2);
  });

  test('debe manejar tipos desconocidos', () => {
    expect(() => workerManager.getWorker('unknown')).toThrow();
  });
});
