import React, { useRef, useEffect, useState } from "react";

export default function HeatmapWebGL({ nodes = [], width = 800, height = 500, ieeeLimit = 1000 }) {
  const canvasRef = useRef();
  const overlayCanvasRef = useRef();
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");

    if (!gl || !nodes.length) return;

    // 🔥 Shader vertex
    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0, 1);
      }
    `;

    // 🔥 Shader fragment (IDW en GPU)
    const fsSource = `
      precision highp float;

      uniform vec2 u_resolution;
      uniform int u_count;
      uniform vec3 u_points[200]; // x, y, value
      uniform float u_ieeeLimit;

      float idw(vec2 p) {
        float num = 0.0;
        float den = 0.0;

        for (int i = 0; i < 200; i++) {
          if (i >= u_count) break;

          vec2 pt = u_points[i].xy;
          float val = u_points[i].z;

          float d = distance(p, pt) + 0.0001;
          float w = 1.0 / (d * d);

          num += w * val;
          den += w;
        }

        return num / den;
      }

      vec3 colorMap(float t) {
        if (t < 0.25) return vec3(0.0, t*4.0, 1.0);
        if (t < 0.5) return vec3(0.0, 1.0, 1.0 - (t-0.25)*4.0);
        if (t < 0.75) return vec3((t-0.5)*4.0, 1.0, 0.0);
        return vec3(1.0, 1.0 - (t-0.75)*4.0, 0.0);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;

        float v = idw(uv);

        // Normalizar
        float t = clamp(v / 1000.0, 0.0, 1.0);

        vec3 color = colorMap(t);

        // 🔥 Overlay IEEE (zonas críticas)
        if (v > u_ieeeLimit) {
          color = mix(color, vec3(1.0, 0.0, 0.0), 0.3);
        }

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // 🔧 Compile shaders
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };

    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    // 🔷 Fullscreen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,  1, -1,  -1, 1,
        -1, 1,   1, -1,   1, 1
      ]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // 🔥 Enviar nodos (limitar a 200 para WebGL)
    const flat = new Float32Array(600);
    const nodeCount = Math.min(nodes.length, 200);
    nodes.slice(0, nodeCount).forEach((n, i) => {
      flat[i * 3] = n.x / width;
      flat[i * 3 + 1] = n.y / height;
      flat[i * 3 + 2] = n.value;
    });

    gl.uniform3fv(gl.getUniformLocation(program, "u_points"), flat);
    gl.uniform1i(gl.getUniformLocation(program, "u_count"), nodeCount);
    gl.uniform1f(gl.getUniformLocation(program, "u_ieeeLimit"), ieeeLimit);
    gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), canvas.width, canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

  }, [nodes, width, height, ieeeLimit]);

  // 🔥 Dibujar isolíneas en overlay canvas
  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay || !nodes.length) return;
    
    const ctx = overlay.getContext("2d");
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Generar grid de valores interpolados
    const gridResolution = 50;
    const grid = [];
    const values = nodes.map(n => n.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    for (let i = 0; i < gridResolution; i++) {
      grid[i] = [];
      for (let j = 0; j < gridResolution; j++) {
        const x = (i / gridResolution) * width;
        const y = (j / gridResolution) * height;
        
        // IDW simple
        let num = 0, den = 0;
        for (const node of nodes) {
          const d = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2) + 0.0001;
          const w = 1 / (d * d);
          num += w * node.value;
          den += w;
        }
        grid[i][j] = num / den;
      }
    }

    // Generar isolíneas (marching squares simplificado)
    const levels = [min + (max - min) * 0.2, min + (max - min) * 0.4, min + (max - min) * 0.6, min + (max - min) * 0.8];
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1;

    levels.forEach(level => {
      ctx.beginPath();
      for (let i = 0; i < gridResolution - 1; i++) {
        for (let j = 0; j < gridResolution - 1; j++) {
          const v1 = grid[i][j];
          const v2 = grid[i+1][j];
          const v3 = grid[i+1][j+1];
          const v4 = grid[i][j+1];

          const crossings = [];
          if ((v1 > level) !== (v2 > level)) crossings.push([(i + 0.5) / gridResolution * width, j / gridResolution * height]);
          if ((v2 > level) !== (v3 > level)) crossings.push([(i + 1) / gridResolution * width, (j + 0.5) / gridResolution * height]);
          if ((v3 > level) !== (v4 > level)) crossings.push([(i + 0.5) / gridResolution * width, (j + 1) / gridResolution * height]);
          if ((v4 > level) !== (v1 > level)) crossings.push([i / gridResolution * width, (j + 0.5) / gridResolution * height]);

          if (crossings.length >= 2) {
            ctx.moveTo(crossings[0][0], crossings[0][1]);
            crossings.forEach(p => ctx.lineTo(p[0], p[1]));
          }
        }
      }
      ctx.stroke();
    });

  }, [nodes, width, height]);

  // 🔥 Zoom con rueda
  const onWheel = (e) => {
    e.preventDefault();
    setView(v => ({
      ...v,
      scale: Math.max(0.5, Math.min(5, v.scale * (e.deltaY > 0 ? 0.9 : 1.1)))
    }));
  };

  // 🔥 Pan con drag
  const onMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - view.x, y: e.clientY - view.y });
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    setView({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
      scale: view.scale
    });
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="relative rounded-lg shadow border overflow-hidden cursor-move"
      style={{ width, height }}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transformOrigin: 'top left'
        }}
      />
      <canvas
        ref={overlayCanvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transformOrigin: 'top left'
        }}
      />
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
        Zoom: {view.scale.toFixed(1)}x | IEEE Limit: {ieeeLimit}V
      </div>
    </div>
  );
}
