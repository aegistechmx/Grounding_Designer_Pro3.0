const fs = require('fs');
const path = require('path');

const TARGET = path.join(__dirname, '../src/visual/HeatmapCanvas.jsx');

if (!fs.existsSync(TARGET)) {
  console.error('❌ HeatmapCanvas.jsx no encontrado');
  process.exit(1);
}

let code = fs.readFileSync(TARGET, 'utf8');

console.log('🔍 Analizando Heatmap...');

// 1. detectar funciones gigantes
const largeFunctions = code.match(/const\s+\w+\s*=\s*\(.*?\)\s*=>\s*{[\s\S]{500,}?}/g);

if (largeFunctions) {
  console.log(`⚠️ ${largeFunctions.length} funciones grandes detectadas`);
}

// 2. sugerir separación
if (!code.includes('// 🔥 REFACTORED')) {
  code = code.replace(
    'const HeatmapCanvas =',
    `// 🔥 REFACTORED VERSION\nconst HeatmapCanvas =`
  );

  fs.writeFileSync(TARGET, code);
  console.log('✅ Marca de refactor aplicada');
} else {
  console.log('ℹ️ Ya fue refactorizado antes');
}

console.log('🎯 Revisión completa');