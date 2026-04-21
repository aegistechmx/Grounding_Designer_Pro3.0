import React, { useEffect, useRef } from "react";

const HeatmapCanvasPro = ({
  nodes = [],
  width = 600,
  height = 400,
  power = 2,           // IDW exponent
  resolution = 2,      // menor = más calidad, mayor = más rápido
}) => {
  const canvasRef = useRef();

  useEffect(() => {
    if (!nodes.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const w = Math.floor(width / resolution);
    const h = Math.floor(height / resolution);

    const image = ctx.createImageData(w, h);

    // 🔹 Normalización
    const values = nodes.map(n => n.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    const normalize = (v) => (v - min) / (max - min + 1e-6);

    // 🔥 IDW interpolado
    const interpolate = (x, y) => {
      let num = 0;
      let den = 0;

      for (let i = 0; i < nodes.length; i++) {
        const dx = x - nodes[i].x;
        const dy = y - nodes[i].y;
        const d = Math.sqrt(dx * dx + dy * dy) + 0.0001;

        const w = 1 / Math.pow(d, power);

        num += w * nodes[i].value;
        den += w;
      }

      return num / den;
    };

    // 🎨 Gradiente tipo ETAP
    const getColor = (t) => {
      // t: 0 → 1
      let r, g, b;

      if (t < 0.25) {
        r = 0;
        g = 4 * t * 255;
        b = 255;
      } else if (t < 0.5) {
        r = 0;
        g = 255;
        b = (1 - 4 * (t - 0.25)) * 255;
      } else if (t < 0.75) {
        r = 4 * (t - 0.5) * 255;
        g = 255;
        b = 0;
      } else {
        r = 255;
        g = (1 - 4 * (t - 0.75)) * 255;
        b = 0;
      }

      return [r, g, b];
    };

    // 🔥 Render
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        const realX = (x / w) * width;
        const realY = (y / h) * height;

        const v = interpolate(realX, realY);
        const t = normalize(v);

        const [r, g, b] = getColor(t);

        const idx = (y * w + x) * 4;

        image.data[idx] = r;
        image.data[idx + 1] = g;
        image.data[idx + 2] = b;
        image.data[idx + 3] = 255;
      }
    }

    // 🔥 Escalar a tamaño real (rápido)
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = w;
    tempCanvas.height = h;
    tempCanvas.getContext("2d").putImageData(image, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tempCanvas, 0, 0, width, height);

  }, [nodes, width, height, power, resolution]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg shadow border"
    />
  );
};

export default HeatmapCanvasPro;
