/**
 * Power BI Style Charts
 * Professional charts using Chart.js with Power BI styling
 */

import { Chart } from "chart.js/auto";
import { theme } from "./theme";

/**
 * Generate Power BI style bar chart
 * @param {Object} report - Report object with calculations
 * @returns {Promise<string>} Base64 image
 */
export function generatePBIBarChart(report) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 400;

  const ctx = canvas.getContext("2d");
  const calculations = report.results || report.calculations;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Contacto", "Paso"],
      datasets: [
        {
          label: "Valor Calculado",
          data: [
            calculations.Em || calculations.touchVoltage || 0,
            calculations.Es || calculations.stepVoltage || 0
          ],
          backgroundColor: "#3b82f6",
          borderColor: "#2563eb",
          borderWidth: 2,
          borderRadius: 4
        },
        {
          label: "Límite IEEE 80",
          data: [
            calculations.Etouch70 || calculations.touchLimit70 || 0,
            calculations.Estep70 || calculations.stepLimit70 || 0
          ],
          backgroundColor: "#ef4444",
          borderColor: "#dc2626",
          borderWidth: 2,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            font: { family: "Inter", size: 12 },
            color: "#374151",
            padding: 15,
            usePointStyle: true
          }
        },
        title: {
          display: true,
          text: "Evaluación de Seguridad - IEEE 80",
          font: { size: 18, family: "Inter", weight: "600" },
          color: "#111827",
          padding: 20
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleFont: { family: "Inter", size: 13 },
          bodyFont: { family: "Inter", size: 12 },
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Tensión (V)",
            font: { family: "Inter", size: 12, weight: "500" },
            color: "#6b7280"
          },
          ticks: {
            font: { family: "Inter", size: 11 },
            color: "#6b7280"
          },
          grid: {
            color: "rgba(0, 0, 0, 0.05)"
          }
        },
        x: {
          ticks: {
            font: { family: "Inter", size: 12, weight: "500" },
            color: "#374151"
          },
          grid: {
            display: false
          }
        }
      }
    }
  });

  return new Promise(resolve => {
    setTimeout(() => {
      resolve(canvas.toDataURL("image/png", 1.0));
    }, 500);
  });
}

/**
 * Generate horizontal bar chart (Power BI style)
 * @param {Object} report - Report object
 * @returns {Promise<string>} Base64 image
 */
export function generateHorizontalChart(report) {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 350;

  const ctx = canvas.getContext("2d");
  const calculations = report.results || report.calculations;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Resistencia (Ω)", "GPR (V)", "Contacto (V)", "Paso (V)"],
      datasets: [
        {
          label: "Valor",
          data: [
            calculations.Rg || calculations.resistance || 0,
            (calculations.GPR || calculations.gpr || 0) / 100,
            calculations.Em || calculations.touchVoltage || 0,
            calculations.Es || calculations.stepVoltage || 0
          ],
          backgroundColor: [
            "#3b82f6",
            "#22c55e",
            "#eab308",
            "#ef4444"
          ],
          borderColor: [
            "#2563eb",
            "#16a34a",
            "#ca8a04",
            "#dc2626"
          ],
          borderWidth: 2,
          borderRadius: 4
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: "Parámetros del Sistema",
          font: { size: 16, family: "Inter", weight: "600" },
          color: "#111827",
          padding: 15
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleFont: { family: "Inter", size: 12 },
          bodyFont: { family: "Inter", size: 11 },
          padding: 10
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Valor Normalizado",
            font: { family: "Inter", size: 11 },
            color: "#6b7280"
          },
          ticks: {
            font: { family: "Inter", size: 10 },
            color: "#6b7280"
          },
          grid: {
            color: "rgba(0, 0, 0, 0.05)"
          }
        },
        y: {
          ticks: {
            font: { family: "Inter", size: 11, weight: "500" },
            color: "#374151"
          },
          grid: {
            display: false
          }
        }
      }
    }
  });

  return new Promise(resolve => {
    setTimeout(() => {
      resolve(canvas.toDataURL("image/png", 1.0));
    }, 500);
  });
}

/**
 * Generate doughnut chart for compliance score
 * @param {number} score - Compliance score (0-100)
 * @returns {Promise<string>} Base64 image
 */
export function generateDoughnutChart(score) {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;

  const ctx = canvas.getContext("2d");

  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";

  new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [score, 100 - score],
        backgroundColor: [color, "#e5e7eb"],
        borderWidth: 0,
        cutout: "75%"
      }]
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: `${score.toFixed(1)}%`,
          font: { size: 24, family: "Inter", weight: "700" },
          color: color,
          padding: 0
        },
        subtitle: {
          display: true,
          text: "Cumplimiento",
          font: { size: 14, family: "Inter", weight: "500" },
          color: "#6b7280"
        },
        tooltip: {
          enabled: false
        }
      }
    }
  });

  return new Promise(resolve => {
    setTimeout(() => {
      resolve(canvas.toDataURL("image/png", 1.0));
    }, 500);
  });
}

/**
 * Generate line chart for GPR distribution
 * @param {Object} report - Report object
 * @returns {Promise<string>} Base64 image
 */
export function generateLineChart(report) {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 350;

  const ctx = canvas.getContext("2d");
  const calculations = report.results || report.calculations;

  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Punto A", "Punto B", "Punto C", "Punto D", "Punto E"],
      datasets: [
        {
          label: "Potencial (V)",
          data: [
            calculations.GPR || calculations.gpr || 0,
            (calculations.GPR || calculations.gpr || 0) * 0.8,
            (calculations.GPR || calculations.gpr || 0) * 0.6,
            (calculations.GPR || calculations.gpr || 0) * 0.4,
            (calculations.GPR || calculations.gpr || 0) * 0.2
          ],
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#3b82f6",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 5
        }
      ]
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: "Distribución de Potencial",
          font: { size: 16, family: "Inter", weight: "600" },
          color: "#111827",
          padding: 15
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleFont: { family: "Inter", size: 12 },
          bodyFont: { family: "Inter", size: 11 },
          padding: 10
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Potencial (V)",
            font: { family: "Inter", size: 11 },
            color: "#6b7280"
          },
          ticks: {
            font: { family: "Inter", size: 10 },
            color: "#6b7280"
          },
          grid: {
            color: "rgba(0, 0, 0, 0.05)"
          }
        },
        x: {
          ticks: {
            font: { family: "Inter", size: 11 },
            color: "#374151"
          },
          grid: {
            display: false
          }
        }
      }
    }
  });

  return new Promise(resolve => {
    setTimeout(() => {
      resolve(canvas.toDataURL("image/png", 1.0));
    }, 500);
  });
}

export default {
  generatePBIBarChart,
  generateHorizontalChart,
  generateDoughnutChart,
  generateLineChart
};
