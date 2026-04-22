/**
 * Chart.js Professional Generator
 * Generates high-quality charts using Chart.js for PDF reports
 */

import { Chart } from "chart.js/auto";

export function generateChartImage(report) {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 400;

  const ctx = canvas.getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Contacto", "Paso"],
      datasets: [
        {
          label: "Valor Calculado",
          data: [report.results.Em || report.results.touchVoltage || 0, report.results.Es || report.results.stepVoltage || 0],
          backgroundColor: "#22c55e",
          borderColor: "#16a34a",
          borderWidth: 1
        },
        {
          label: "Límite IEEE",
          data: [report.results.Etouch70 || report.results.touchLimit70 || 0, report.results.Estep70 || report.results.stepLimit70 || 0],
          backgroundColor: "#ef4444",
          borderColor: "#dc2626",
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          labels: {
            font: { family: "Inter", size: 12 },
            color: "#374151"
          }
        },
        title: {
          display: true,
          text: "Evaluación de Seguridad IEEE 80",
          font: { size: 16, family: "Inter", weight: "600" },
          color: "#111827",
          padding: 20
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleFont: { family: "Inter", size: 12 },
          bodyFont: { family: "Inter", size: 11 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Tensión (V)",
            font: { family: "Inter", size: 11 },
            color: "#6b7280"
          },
          ticks: {
            font: { family: "Inter", size: 10 },
            color: "#6b7280"
          },
          grid: {
            color: "rgba(0, 0, 0, 0.1)"
          }
        },
        x: {
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

export function generateGaugeChartImage(score) {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;

  const ctx = canvas.getContext("2d");

  new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [score, 100 - score],
        backgroundColor: [
          score >= 80 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444",
          "#e5e7eb"
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: false,
      cutout: "70%",
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: `Puntuación: ${score.toFixed(1)}%`,
          font: { size: 18, family: "Inter", weight: "600" },
          color: score >= 80 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444"
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

export function generateComparisonChart(report) {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 400;

  const ctx = canvas.getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Resistencia", "GPR", "Contacto", "Paso"],
      datasets: [
        {
          label: "Valor Calculado",
          data: [
            report.results.resistance || 0,
            (report.results.gpr || 0) / 100, // Scale GPR for visibility
            report.results.touchVoltage || report.results.Em || 0,
            report.results.stepVoltage || report.results.Es || 0
          ],
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 2,
          tension: 0.4,
          fill: true
        },
        {
          label: "Límite/Aceptable",
          data: [
            5, // Resistance limit
            50, // GPR scaled limit
            report.results.touchLimit70 || report.results.Etouch70 || 0,
            report.results.stepLimit70 || report.results.Estep70 || 0
          ],
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.4,
          fill: false
        }
      ]
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          labels: {
            font: { family: "Inter", size: 12 },
            color: "#374151"
          }
        },
        title: {
          display: true,
          text: "Análisis Comparativo de Parámetros",
          font: { size: 16, family: "Inter", weight: "600" },
          color: "#111827",
          padding: 20
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleFont: { family: "Inter", size: 12 },
          bodyFont: { family: "Inter", size: 11 }
        }
      },
      scales: {
        y: {
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
            color: "rgba(0, 0, 0, 0.1)"
          }
        },
        x: {
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

export default {
  generateChartImage,
  generateGaugeChartImage,
  generateComparisonChart
};
