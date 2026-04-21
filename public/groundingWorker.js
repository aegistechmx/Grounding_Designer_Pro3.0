// Web Worker para cálculos pesados
importScripts('/static/js/groundingEngine.js');

self.onmessage = function(e) {
  const { params } = e.data;
  
  try {
    const result = runGroundingCalculation(params);
    self.postMessage({ success: true, data: result });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};