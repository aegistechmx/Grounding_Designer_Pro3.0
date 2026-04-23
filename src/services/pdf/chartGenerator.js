/**
 * Chart Generator Service
 * Generates professional engineering charts for PDF reports (ETAP-style)
 * Uses chartjs-node-canvas for server-side rendering
 */

import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

const width = 800;
const height = 400;

/**
 * Generate potential vs distance curve chart
 * @param {Array} curveData - Curve data with distance and potential
 * @param {Object} limits - IEEE 80 limits (touch, step)
 * @returns {Promise<Buffer>} Chart image buffer
 */
export async function generatePotentialCurveChart(curveData, limits) {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  const configuration = {
    type: 'line',
    data: {
      labels: curveData.map(p => p.distance.toFixed(1)),
      datasets: [
        {
          label: 'Potencial (V)',
          data: curveData.map(p => p.potential),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.2,
          borderWidth: 2,
          pointRadius: 1
        },
        {
          label: 'Límite Touch (IEEE 80)',
          data: curveData.map(() => limits.touch || 0),
          borderColor: 'rgb(59, 130, 246)',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        },
        {
          label: 'Límite Step (IEEE 80)',
          data: curveData.map(() => limits.step || 0),
          borderColor: 'rgb(34, 197, 94)',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: {
              size: 12
            }
          }
        },
        title: {
          display: true,
          text: 'Curva de Potencial vs Distancia',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Distancia (m)',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Voltaje (V)',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
          },
          beginAtZero: true
        }
      }
    }
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

/**
 * Generate touch voltage curve chart
 * @param {Array} curveData - Touch voltage curve data
 * @param {number} limit - Touch voltage limit
 * @returns {Promise<Buffer>} Chart image buffer
 */
export async function generateTouchVoltageChart(curveData, limit) {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  const configuration = {
    type: 'line',
    data: {
      labels: curveData.map(p => p.distance.toFixed(1)),
      datasets: [
        {
          label: 'Tensión de Contacto (V)',
          data: curveData.map(p => p.touchVoltage),
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          fill: true,
          tension: 0.2,
          borderWidth: 2,
          pointRadius: 1
        },
        {
          label: 'Límite Permisible (IEEE 80)',
          data: curveData.map(() => limit || 0),
          borderColor: 'rgb(239, 68, 68)',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: {
              size: 12
            }
          }
        },
        title: {
          display: true,
          text: 'Tensión de Contacto vs Distancia',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Distancia (m)',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Voltaje (V)',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          beginAtZero: true
        }
      }
    }
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

/**
 * Generate step voltage curve chart
 * @param {Array} curveData - Step voltage curve data
 * @param {number} limit - Step voltage limit
 * @returns {Promise<Buffer>} Chart image buffer
 */
export async function generateStepVoltageChart(curveData, limit) {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  const configuration = {
    type: 'line',
    data: {
      labels: curveData.map(p => p.distance.toFixed(1)),
      datasets: [
        {
          label: 'Tensión de Paso (V)',
          data: curveData.map(p => p.stepVoltage),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.2,
          borderWidth: 2,
          pointRadius: 1
        },
        {
          label: 'Límite Permisible (IEEE 80)',
          data: curveData.map(() => limit || 0),
          borderColor: 'rgb(239, 68, 68)',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: {
              size: 12
            }
          }
        },
        title: {
          display: true,
          text: 'Tensión de Paso vs Distancia',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Distancia (m)',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Voltaje (V)',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          beginAtZero: true
        }
      }
    }
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

/**
 * Generate GPR decay curve chart
 * @param {Array} curveData - GPR decay curve data
 * @returns {Promise<Buffer>} Chart image buffer
 */
export async function generateGPRDecayChart(curveData) {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  const configuration = {
    type: 'line',
    data: {
      labels: curveData.map(p => p.distance.toFixed(1)),
      datasets: [
        {
          label: 'GPR (V)',
          data: curveData.map(p => p.potential),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          fill: true,
          tension: 0.2,
          borderWidth: 2,
          pointRadius: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: {
              size: 12
            }
          }
        },
        title: {
          display: true,
          text: 'Decaimiento del GPR vs Distancia',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Distancia (m)',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Voltaje (V)',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          beginAtZero: true
        }
      }
    }
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

/**
 * Generate combined voltage chart (touch + step)
 * @param {Object} combinedData - Combined curve data with touch, step, and limits
 * @returns {Promise<Buffer>} Chart image buffer
 */
export async function generateCombinedVoltageChart(combinedData) {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  const configuration = {
    type: 'line',
    data: {
      labels: combinedData.touch.map(p => p.distance.toFixed(1)),
      datasets: [
        {
          label: 'Tensión de Contacto (V)',
          data: combinedData.touch.map(p => p.touchVoltage),
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          fill: true,
          tension: 0.2,
          borderWidth: 2,
          pointRadius: 1
        },
        {
          label: 'Tensión de Paso (V)',
          data: combinedData.step.map(p => p.stepVoltage),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.2,
          borderWidth: 2,
          pointRadius: 1
        },
        {
          label: 'Límite Touch',
          data: combinedData.touch.map(() => combinedData.touchLimit || 0),
          borderColor: 'rgb(59, 130, 246)',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        },
        {
          label: 'Límite Step',
          data: combinedData.step.map(() => combinedData.stepLimit || 0),
          borderColor: 'rgb(239, 68, 68)',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: {
              size: 12
            }
          }
        },
        title: {
          display: true,
          text: 'Tensiones de Contacto y Paso vs Distancia',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Distancia (m)',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Voltaje (V)',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          beginAtZero: true
        }
      }
    }
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}
