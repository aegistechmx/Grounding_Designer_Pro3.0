// scripts/cleanup.js
// Script para limpieza final de archivos legacy

const fs = require('fs');
const path = require('path');

const LEGACY_PATHS = [
  'src/core/ieee80.js',
  'src/core/safetyAdvanced.js',
  'src/core/soilModel.js',
  'src/engine_old',
  'src/utils/groundingMath_clean.js',
  'src/utils/groundingMath_simple.js',
  'src/utils/heatmapEnginePro.js',
  'src/utils/realHeatmapEngine.js'
];

console.log('🧹 Limpiando archivos legacy...\n');

LEGACY_PATHS.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    if (fs.statSync(fullPath).isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Eliminado directorio: ${filePath}`);
    } else {
      fs.unlinkSync(fullPath);
      console.log(`✅ Eliminado archivo: ${filePath}`);
    }
  } else {
    console.log(`⚠️ No encontrado: ${filePath}`);
  }
});

console.log('\n🎉 Limpieza completada!');
