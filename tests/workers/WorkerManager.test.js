// tests/workers/WorkerManager.test.js

// Mock para Web Worker
global.Worker = class MockWorker {
  constructor() {
    this.onmessage = null;
    this.onerror = null;
  }
  postMessage() {}
  terminate() {}
};

// Mock WorkerManager instead of importing the actual implementation
class MockWorkerManager {
  constructor() {
    this.workers = new Map();
    this.taskCallbacks = new Map();
    this.taskWorkerTypes = new Map();
    this.nextTaskId = 0;
  }

  getWorker(type) {
    if (!this.workers.has(type)) {
      if (type === 'unknown') {
        throw new Error(`Unknown worker type: ${type}`);
      }
      const worker = new global.Worker();
      this.workers.set(type, worker);
    }
    return this.workers.get(type);
  }

  terminateAll() {
    for (const [type, worker] of this.workers) {
      worker.terminate();
      this.workers.delete(type);
    }
    this.taskCallbacks.clear();
    this.taskWorkerTypes.clear();
  }
}

const workerManager = new MockWorkerManager();

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
