# Grounding Designer Pro 3.0 - API Reference

## 📦 Instalación

```bash
npm install
npm start
```

## 🏗️ Arquitectura

```
UI (React) → useGroundingSystem → SystemOrchestrator
                                    ↓
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
              Simulation        Workers         Render
              Engine            (parallel)      Engine
```

## 🔧 Core API

### SystemOrchestrator

El orquestador principal del sistema.

#### `initProject(projectData)`

Inicializa un nuevo proyecto.

**Parámetros:**

```typescript
projectData: {
  id?: string;
  name: string;
  gridLength: number;
  gridWidth: number;
  gridDepth: number;
  numParallel: number;
  numRods: number;
  rodLength: number;
  soilResistivity: number;
  faultCurrent: number;
  faultDuration: number;
}
```

**Ejemplo:**

```javascript
const project = orchestrator.initProject({
  name: 'Subestación Norte',
  gridLength: 12.5,
  gridWidth: 8,
  soilResistivity: 100,
  faultCurrent: 5000
});
```

#### `runSimulation(useWorker)`

Ejecuta simulación electromagnética.

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| useWorker | boolean | false | Usar Worker para simulación pesada |

**Ejemplo:**

```javascript
const results = await orchestrator.runSimulation(true);
console.log(results[0].Rg); // Resistencia de malla
```

#### `generateHeatmap(resolution)`

Genera mapa de calor de tensiones.

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| resolution | number | 50 | Resolución de la grilla |

**Ejemplo:**

```javascript
const heatmap = await orchestrator.generateHeatmap(100);
// heatmap.data contiene matriz de tensiones
```

### useGroundingSystem Hook

Hook React para conectar UI con el sistema.

**Ejemplo:**

```jsx
const { 
  project, 
  results, 
  isSimulating, 
  initProject, 
  runSimulation 
} = useGroundingSystem();

// Inicializar proyecto
initProject({ name: 'Mi Proyecto', ...params });

// Ejecutar simulación
await runSimulation();
```

## 🧮 Engine API (IEEE 80)

### Cálculos Fundamentales

#### `calculateRg(rho, LT, A, h)`

Calcula resistencia de malla.

```javascript
import { calculateRg } from './engine/standards/ieee80';

const Rg = calculateRg(100, 200, 100, 0.5);
// Rg ≈ 4.56 Ω
```

#### `calculateCs(rho, rho_s, hs)`

Calcula factor de capa superficial.

```javascript
const Cs = calculateCs(100, 3000, 0.1);
// Cs ≈ 0.9
```

#### `checkCompliance({ Em, EtouchTolerable, Es, EstepTolerable })`

Verifica cumplimiento IEEE 80.

```javascript
const compliance = checkCompliance({
  Em: 180,
  EtouchTolerable: 921,
  Es: 90,
  EstepTolerable: 3020
});
// { complies: true, touchSafe: true, stepSafe: true }
```

## 📊 Data Model

### GroundingProject

Modelo principal del proyecto.

```javascript
const project = new GroundingProject('id', 'Nombre');

// Agregar grid
project.grid = new GridModel(12.5, 8, 0.5, 8, 8, 3, 16);

// Agregar perfil de suelo
project.soil = new SoilProfile(100, 3000, 0.1);

// Agregar escenario de falla
project.scenarios.push(new FaultScenario(5000, 0.5, 0.15));
```

## 🖥️ Render API

### RenderEngine

Motor de renderizado 2D.

```javascript
const renderer = new RenderEngine(canvas, {
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e'
});

renderer.render({
  title: 'Malla de Tierra',
  grid: { rows: 8, cols: 8, cellWidth: 50, cellHeight: 50 },
  conductors: conductorPositions,
  annotations: [{ text: 'Rg: 4.56 Ω', x: 20, y: 40 }]
});
```

## ⚡ Workers

### WorkerManager

Gestión de workers en paralelo.

```javascript
import { workerManager } from './workers';

// Simulación FEM pesada
const result = await workerManager.runFEMSimulation({
  grid: project.grid,
  soil: project.soil,
  resolution: 100
}, (progress) => {
  console.log(`Progreso: ${progress * 100}%`);
});

// Optimización
const optimization = await workerManager.runOptimization({
  populationSize: 100,
  generations: 50
});
```

## 📤 Exportación

### PDF Generation

```javascript
import { generateFullPDF } from './io/pdf/pdfGenerator';

const doc = await generateFullPDF(params, calculations, recommendations);
doc.save('informe.pdf');
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar con cobertura
npm run test:ci

# Modo watch
npm run test:watch
```

## 📋 Tipos TypeScript (si usas TS)

```typescript
interface ProjectData {
  name: string;
  gridLength: number;
  gridWidth: number;
  soilResistivity: number;
  faultCurrent: number;
}

interface SimulationResult {
  Rg: number;
  GPR: number;
  Em: number;
  Es: number;
  complies: boolean;
}
```

## 🚀 Ejemplo Completo

```javascript
import { systemOrchestrator } from './core/SystemOrchestrator';

// 1. Inicializar proyecto
const project = systemOrchestrator.initProject({
  name: 'Subestación Industrial',
  gridLength: 12.5,
  gridWidth: 8,
  gridDepth: 0.5,
  numParallel: 8,
  numRods: 16,
  rodLength: 3,
  soilResistivity: 100,
  faultCurrent: 1771,
  faultDuration: 0.5
});

// 2. Ejecutar simulación
const results = await systemOrchestrator.runSimulation();

// 3. Generar heatmap
const heatmap = await systemOrchestrator.generateHeatmap(50);

// 4. Exportar PDF
await systemOrchestrator.exportToPDF();
```
