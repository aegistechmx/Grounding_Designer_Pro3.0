export const runHeatmapWorker = (worker, payload) => {
  return new Promise((resolve) => {
    worker.onmessage = (e) => resolve(e.data);
    worker.postMessage(payload);
  });
};