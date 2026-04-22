// src/workers/WorkerManager.js
// Gestiona workers y operaciones asíncronas pesadas

class WorkerManager {
  constructor() {
    this.workers = new Map();
    this.taskCallbacks = new Map();
    this.taskWorkerTypes = new Map(); // Rastrear worker type por task
    this.nextTaskId = 0;
  }

  /**
   * Obtiene o crea un worker por tipo
   */
  getWorker(type) {
    if (!this.workers.has(type)) {
      let worker;
      
      switch (type) {
        case 'fem':
          worker = new Worker(new URL('./simulation/femWorker.js', import.meta.url));
          break;
        case 'optimization':
          worker = new Worker(new URL('./optimization/nsga2Worker.js', import.meta.url));
          break;
        case 'heatmap':
          worker = new Worker(new URL('./heatmap/heatmapWorker.js', import.meta.url));
          break;
        default:
          throw new Error(`Unknown worker type: ${type}`);
      }
      
      worker.onmessage = (e) => this.handleWorkerMessage(type, e);
      worker.onerror = (e) => this.handleWorkerError(type, e);
      
      this.workers.set(type, worker);
    }
    
    return this.workers.get(type);
  }

  /**
   * Maneja mensajes del worker
   */
  handleWorkerMessage(type, event) {
    const { id, type: messageType, results, error, progress } = event.data;
    
    if (this.taskCallbacks.has(id)) {
      const { resolve, reject, onProgress } = this.taskCallbacks.get(id);
      
      if (messageType === 'ERROR') {
        reject(new Error(error));
        this.taskCallbacks.delete(id);
      } else if (messageType.includes('PROGRESS') && onProgress) {
        onProgress(progress);
      } else if (messageType.includes('COMPLETE')) {
        resolve(results);
        this.taskCallbacks.delete(id);
      }
    }
  }

  /**
   * Maneja errores del worker
   */
  handleWorkerError(type, event) {
    console.error(`Worker error (${type}):`, event);
    
    // Solo rechazar tareas del worker que falló
    for (const [id, workerType] of this.taskWorkerTypes.entries()) {
      if (workerType === type && this.taskCallbacks.has(id)) {
        const callback = this.taskCallbacks.get(id);
        callback.reject(new Error(`Worker error (${type}): ${event.message || 'Unknown error'}`));
        this.taskCallbacks.delete(id);
        this.taskWorkerTypes.delete(id);
      }
    }
  }

  /**
   * Ejecuta simulación FEM
   */
  async runFEMSimulation(data, onProgress = null) {
    const worker = this.getWorker('fem');
    const taskId = this.nextTaskId++;
    
    return new Promise((resolve, reject) => {
      this.taskCallbacks.set(taskId, { resolve, reject, onProgress });
      this.taskWorkerTypes.set(taskId, 'fem');
      worker.postMessage({ type: 'RUN_FEM_SIMULATION', data, id: taskId });
    });
  }

  /**
   * Ejecuta optimización
   */
  async runOptimization(data, onProgress = null) {
    const worker = this.getWorker('optimization');
    const taskId = this.nextTaskId++;
    
    return new Promise((resolve, reject) => {
      this.taskCallbacks.set(taskId, { resolve, reject, onProgress });
      this.taskWorkerTypes.set(taskId, 'optimization');
      worker.postMessage({ type: 'RUN_OPTIMIZATION', data, id: taskId });
    });
  }

  /**
   * Genera heatmap
   */
  async generateHeatmap(data, onProgress = null) {
    const worker = this.getWorker('heatmap');
    const taskId = this.nextTaskId++;
    
    return new Promise((resolve, reject) => {
      this.taskCallbacks.set(taskId, { resolve, reject, onProgress });
      this.taskWorkerTypes.set(taskId, 'heatmap');
      worker.postMessage({ type: 'GENERATE_HEATMAP', data, id: taskId });
    });
  }

  /**
   * Termina todos los workers
   */
  terminateAll() {
    for (const [type, worker] of this.workers) {
      worker.terminate();
      this.workers.delete(type);
    }
    this.taskCallbacks.clear();
    this.taskWorkerTypes.clear();
  }
}

// Singleton
export const workerManager = new WorkerManager();

export default workerManager;
