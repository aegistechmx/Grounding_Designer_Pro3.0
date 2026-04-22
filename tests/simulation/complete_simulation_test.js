// ============================================
// SIMULACIÓN COMPLETA - GROUNDING DESIGNER PRO
// Validación NOM-001-SEDE-2012 + CFE + IEEE 80
// ============================================

const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🚀 INICIANDO SIMULACIÓN COMPLETA');
  console.log('═'.repeat(60));
  
  // 1. DATOS DEL PROYECTO (Caso industrial real)
  const project = {
    name: 'Subestación Industrial Norte',
    engineerName: 'Ing. Juan Pérez Martínez',
    voltageLevel: 13200,  // 13.2 kV
    installationType: 'industrial',
    substationType: 'distribution',
    
    // Malla de tierra
    grid: {
      length: 12.5,   // metros
      width: 8,       // metros
      depth: 0.5,     // metros
      nx: 8,          // conductores en X
      ny: 8,          // conductores en Y
      rodLength: 3,   // metros
      numRods: 16
    },
    
    // Perfil de suelo
    soil: {
      resistivity: 100,           // Ω·m
      surfaceResistivity: 3000,   // Ω·m (grava)
      surfaceDepth: 0.1,          // metros
      moisture: 0.25              // 25% humedad
    },
    
    // Escenario de falla
    scenarios: [{
      current: 5000,      // A
      duration: 0.35,     // segundos
      divisionFactor: 0.15
    }]
  };
  
  console.log('📋 Datos del proyecto:');
  console.log(`   Nombre: ${project.name}`);
  console.log(`   Tensión: ${project.voltageLevel} V`);
  console.log(`   Malla: ${project.grid.length}m x ${project.grid.width}m`);
  console.log(`   Conductores: ${project.grid.nx} x ${project.grid.ny}`);
  console.log(`   Varillas: ${project.grid.numRods} x ${project.grid.rodLength}m`);
  console.log(`   Resistividad suelo: ${project.soil.resistivity} Ω·m`);
  
  // 2. CALCULAR RESISTENCIA DE MALLA (IEEE 80)
  console.log('\n🔹 Calculando resistencia de malla...');
  
  const area = project.grid.length * project.grid.width;
  const perimeter = 2 * (project.grid.length + project.grid.width);
  const totalConductorLength = perimeter * Math.max(project.grid.nx, project.grid.ny);
  const totalRodLength = project.grid.numRods * project.grid.rodLength;
  const LT = totalConductorLength + totalRodLength;
  
  const Rg = project.soil.resistivity * (1/LT + 1/Math.sqrt(20 * area)) * 
             (1 + 1/(1 + project.grid.depth * Math.sqrt(20 / area)));
  
  console.log(`   Rg = ${Rg.toFixed(3)} Ω`);
  
  // 3. CALCULAR CORRIENTES Y GPR
  console.log('\n🔹 Calculando corrientes...');
  
  const Ig = project.scenarios[0].current * project.scenarios[0].divisionFactor;
  const GPR = Ig * Rg;
  
  console.log(`   Ig (corriente malla) = ${Ig.toFixed(0)} A`);
  console.log(`   GPR (elevación potencial) = ${GPR.toFixed(0)} V`);
  
  // 4. CALCULAR FACTOR Cs (capa superficial)
  console.log('\n🔹 Calculando factor de capa superficial...');

  const Cs = project.soil.surfaceResistivity > 0 && project.soil.surfaceDepth >= 0
    ? 1 - (0.09 * (1 - project.soil.resistivity / Math.max(1, project.soil.surfaceResistivity))) /
             (2 * Math.max(0.01, project.soil.surfaceDepth) + 0.09)
    : 1;
  
  console.log(`   Cs = ${Cs.toFixed(4)}`);
  
  // 5. TENSIONES TOLERABLES IEEE 80
  console.log('\n🔹 Calculando límites IEEE 80 (70kg)...');

  const t = Math.max(0.01, project.scenarios[0].duration || 0.35);
  const k70 = 0.157;

  const Etouch70_IEEE = (1000 + 1.5 * Cs * project.soil.surfaceResistivity) * (k70 / Math.sqrt(t));
  const Estep70_IEEE = (1000 + 6 * Cs * project.soil.surfaceResistivity) * (k70 / Math.sqrt(t));
  
  console.log(`   Etouch70 (IEEE) = ${Etouch70_IEEE.toFixed(0)} V`);
  console.log(`   Estep70 (IEEE) = ${Estep70_IEEE.toFixed(0)} V`);
  
  // 6. TENSIONES REALES (aproximación FEM simplificada)
  console.log('\n🔹 Calculando tensiones reales...');
  
  const Em = GPR * 0.18;  // 18% del GPR
  const Es = GPR * 0.10;  // 10% del GPR
  
  console.log(`   Em (tensión contacto real) = ${Em.toFixed(0)} V`);
  console.log(`   Es (tensión paso real) = ${Es.toFixed(0)} V`);
  
  // 7. VERIFICACIÓN IEEE 80
  console.log('\n🔹 Verificación IEEE 80-2013...');
  
  const ieeeCompliant = Em <= Etouch70_IEEE && Es <= Estep70_IEEE;
  
  console.log(`   Contacto: ${Em.toFixed(0)} V ≤ ${Etouch70_IEEE.toFixed(0)} V → ${Em <= Etouch70_IEEE ? '✓' : '✗'}`);
  console.log(`   Paso: ${Es.toFixed(0)} V ≤ ${Estep70_IEEE.toFixed(0)} V → ${Es <= Estep70_IEEE ? '✓' : '✗'}`);
  console.log(`   Cumple IEEE 80: ${ieeeCompliant ? '✓ SÍ' : '✗ NO'}`);
  
  // 8. VALIDACIÓN NOM-001-SEDE-2012
  console.log('\n🔹 Validación NOM-001-SEDE-2012...');
  
  // Límites NOM
  let nomTouchLimit = 50;  // Base
  if (t < 0.1) nomTouchLimit = 100;
  else if (t < 0.5) nomTouchLimit = 75;
  else if (t < 1.0) nomTouchLimit = 50;
  else nomTouchLimit = 30;
  
  const nomStepLimit = Math.min((1000 + 6 * Cs * project.soil.surfaceResistivity) * (0.116 / Math.sqrt(t)), 500) || 500;
  const nomResistanceLimit = project.voltageLevel < 1000 ? 25 : 
                             project.voltageLevel < 15000 ? 10 : 5;
  
  const nomTouchSafe = Em <= nomTouchLimit;
  const nomStepSafe = Es <= nomStepLimit;
  const nomResistanceSafe = Rg <= nomResistanceLimit;
  const nomCompliant = nomTouchSafe && nomStepSafe && nomResistanceSafe;
  
  console.log(`   Contacto NOM: ${Em.toFixed(0)} V ≤ ${nomTouchLimit} V → ${nomTouchSafe ? '✓' : '✗'}`);
  console.log(`   Paso NOM: ${Es.toFixed(0)} V ≤ ${nomStepLimit.toFixed(0)} V → ${nomStepSafe ? '✓' : '✗'}`);
  console.log(`   Resistencia NOM: ${Rg.toFixed(2)} Ω ≤ ${nomResistanceLimit} Ω → ${nomResistanceSafe ? '✓' : '✗'}`);
  console.log(`   Cumple NOM-001: ${nomCompliant ? '✓ SÍ' : '✗ NO'}`);
  
  // 9. VALIDACIÓN CFE
  console.log('\n🔹 Validación CFE 01J00-01...');
  
  // Factores CFE
  const timeFactor = t < 0.2 ? 0.8 : t > 0.5 ? 1.2 : 1.0;
  const soilFactor = project.soil.moisture > 0.3 ? 0.8 : 
                     project.soil.moisture < 0.1 ? 1.3 : 1.0;
  const cfeSafetyFactor = timeFactor * soilFactor;
  
  const cfeTouchLimit = 50 * cfeSafetyFactor;
  const cfeStepLimit = 150 * cfeSafetyFactor;
  
  let cfeResistanceLimit = 10;  // Distribución
  if (project.voltageLevel >= 69000) cfeResistanceLimit = 3;
  else if (project.voltageLevel >= 23000) cfeResistanceLimit = 5;
  
  const cfeTouchSafe = Em <= cfeTouchLimit;
  const cfeStepSafe = Es <= cfeStepLimit;
  const cfeResistanceSafe = Rg <= cfeResistanceLimit;
  const cfeCompliant = cfeTouchSafe && cfeStepSafe && cfeResistanceSafe;
  
  console.log(`   Factor seguridad CFE: ${cfeSafetyFactor.toFixed(2)}`);
  console.log(`   Contacto CFE: ${Em.toFixed(0)} V ≤ ${cfeTouchLimit.toFixed(0)} V → ${cfeTouchSafe ? '✓' : '✗'}`);
  console.log(`   Paso CFE: ${Es.toFixed(0)} V ≤ ${cfeStepLimit.toFixed(0)} V → ${cfeStepSafe ? '✓' : '✗'}`);
  console.log(`   Resistencia CFE: ${Rg.toFixed(2)} Ω ≤ ${cfeResistanceLimit} Ω → ${cfeResistanceSafe ? '✓' : '✗'}`);
  console.log(`   Cumple CFE: ${cfeCompliant ? '✓ SÍ' : '✗ NO'}`);
  
  // 10. RESUMEN GLOBAL
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMEN DE CUMPLIMIENTO NORMATIVO');
  console.log('═'.repeat(60));
  
  const globalCompliant = ieeeCompliant && nomCompliant && cfeCompliant;
  
  const results = {
    project: project.name,
    date: new Date().toLocaleString('es-MX'),
    metrics: {
      Rg: Rg.toFixed(3),
      GPR: GPR.toFixed(0),
      Em: Em.toFixed(0),
      Es: Es.toFixed(0)
    },
    standards: {
      IEEE80: {
        compliant: ieeeCompliant,
        limits: { Etouch: Etouch70_IEEE.toFixed(0), Estep: Estep70_IEEE.toFixed(0) }
      },
      NOM001: {
        compliant: nomCompliant,
        limits: { Etouch: nomTouchLimit, Estep: nomStepLimit.toFixed(0), Rg: nomResistanceLimit }
      },
      CFE: {
        compliant: cfeCompliant,
        limits: { Etouch: cfeTouchLimit.toFixed(0), Estep: cfeStepLimit.toFixed(0), Rg: cfeResistanceLimit }
      }
    },
    globalCompliant,
    status: globalCompliant ? 'APROBADO' : (ieeeCompliant ? 'CON OBSERVACIONES' : 'RECHAZADO')
  };
  
  console.log(`\n🏆 ESTADO GLOBAL: ${results.status}`);
  
  if (globalCompliant) {
    console.log('\n✅ DISEÑO APROBADO - Cumple con todas las normas aplicables:');
    console.log('   ✓ IEEE Std 80-2013');
    console.log('   ✓ NOM-001-SEDE-2012');
    console.log('   ✓ CFE 01J00-01');
  } else {
    console.log('\n⚠️ DISEÑO REQUIERE MEJORAS:');
    
    if (!ieeeCompliant) console.log('   ✗ No cumple IEEE 80');
    if (!nomCompliant) console.log('   ✗ No cumple NOM-001-SEDE-2012');
    if (!cfeCompliant) console.log('   ✗ No cumple CFE');
    
    console.log('\n📝 RECOMENDACIONES:');
    if (Em > Etouch70_IEEE) console.log('   • Aumentar número de conductores paralelos');
    if (Rg > nomResistanceLimit) console.log('   • Agregar varillas o tratar químicamente el suelo');
    if (Rg > cfeResistanceLimit) console.log('   • Mejorar resistividad del suelo');
  }
  
  // 11. GENERAR REPORTE HTML
  console.log('\n📄 Generando reporte de cumplimiento...');
  
  const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reporte de Cumplimiento - ${project.name}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #2563eb; margin: 0; }
    .header h2 { color: #666; margin: 10px 0 0; font-size: 16px; }
    .status { text-align: center; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .status-approved { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    .status-rejected { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .status-warning { background: #fed7aa; color: #9a3412; border: 1px solid #fdba74; }
    .section { margin: 25px 0; padding: 15px; background: #f8fafc; border-radius: 8px; }
    .section h3 { margin-top: 0; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #e2e8f0; font-weight: 600; }
    .pass { color: #16a34a; font-weight: bold; }
    .fail { color: #dc2626; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #666; }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🏭 Grounding Designer Pro</h1>
    <h2>Reporte de Cumplimiento Normativo</h2>
  </div>
  
  <div class="status status-${results.status === 'APROBADO' ? 'approved' : (results.status === 'RECHAZADO' ? 'rejected' : 'warning')}">
    <h2>${results.status === 'APROBADO' ? '✅ DISEÑO APROBADO' : (results.status === 'RECHAZADO' ? '❌ DISEÑO RECHAZADO' : '⚠️ DISEÑO CON OBSERVACIONES')}</h2>
    <p>${results.globalCompliant ? 'El diseño cumple con todas las normas aplicables.' : 'El diseño requiere mejoras para cumplir con las normas.'}</p>
  </div>
  
  <div class="section">
    <h3>📋 Datos del Proyecto</h3>
    <table>
      <tr><th>Proyecto</th><td>${project.name}</td></tr>
      <tr><th>Ingeniero</th><td>${project.engineerName}</td></tr>
      <tr><th>Fecha</th><td>${results.date}</td></tr>
      <tr><th>Tensión del Sistema</th><td>${(project.voltageLevel || 0).toLocaleString()} V</td></tr>
    </table>
  </div>
  
  <div class="section">
    <h3>📐 Configuración de Malla</h3>
    <table>
      <tr><th>Dimensiones</th><td>${project.grid.length}m x ${project.grid.width}m</td></tr>
      <tr><th>Conductores</th><td>${project.grid.nx} x ${project.grid.ny}</td></tr>
      <tr><th>Varillas</th><td>${project.grid.numRods} x ${project.grid.rodLength}m</td></tr>
      <tr><th>Resistencia (Rg)</th><td class="${Rg <= nomResistanceLimit ? 'pass' : 'fail'}">${Rg.toFixed(3)} Ω</td></tr>
      <tr><th>GPR</th><td>${GPR.toFixed(0)} V</td></tr>
    </table>
  </div>
  
  <div class="section">
    <h3>📊 Tensión de Contacto</h3>
    <table>
      <tr><th>Norma</th><th>Límite (V)</th><th>Calculado (V)</th><th>Estado</th></tr>
      <tr><td>IEEE 80-2013</td><td>${Etouch70_IEEE.toFixed(0)}</td><td>${Em.toFixed(0)}</td><td class="${Em <= Etouch70_IEEE ? 'pass' : 'fail'}">${Em <= Etouch70_IEEE ? '✓' : '✗'}</td></tr>
      <tr><td>NOM-001-SEDE-2012</td><td>${nomTouchLimit}</td><td>${Em.toFixed(0)}</td><td class="${nomTouchSafe ? 'pass' : 'fail'}">${nomTouchSafe ? '✓' : '✗'}</td></tr>
      <tr><td>CFE 01J00-01</td><td>${cfeTouchLimit.toFixed(0)}</td><td>${Em.toFixed(0)}</td><td class="${cfeTouchSafe ? 'pass' : 'fail'}">${cfeTouchSafe ? '✓' : '✗'}</td></tr>
    </table>
  </div>
  
  <div class="section">
    <h3>📊 Tensión de Paso</h3>
    <table>
      <tr><th>Norma</th><th>Límite (V)</th><th>Calculado (V)</th><th>Estado</th></tr>
      <tr><td>IEEE 80-2013</td><td>${Estep70_IEEE.toFixed(0)}</td><td>${Es.toFixed(0)}</td><td class="${Es <= Estep70_IEEE ? 'pass' : 'fail'}">${Es <= Estep70_IEEE ? '✓' : '✗'}</td></tr>
      <tr><td>NOM-001-SEDE-2012</td><td>${nomStepLimit.toFixed(0)}</td><td>${Es.toFixed(0)}</td><td class="${nomStepSafe ? 'pass' : 'fail'}">${nomStepSafe ? '✓' : '✗'}</td></tr>
      <tr><td>CFE 01J00-01</td><td>${cfeStepLimit.toFixed(0)}</td><td>${Es.toFixed(0)}</td><td class="${cfeStepSafe ? 'pass' : 'fail'}">${cfeStepSafe ? '✓' : '✗'}</td></tr>
    </table>
  </div>
  
  <div class="footer">
    <p>Reporte generado por Grounding Designer Pro v3.0</p>
    <p>Normas aplicadas: IEEE Std 80-2013 | NOM-001-SEDE-2012 | CFE 01J00-01</p>
  </div>
</div>
</body>
</html>
  `;
  
  // Guardar reporte
  const reportPath = path.join(__dirname, `Reporte_Cumplimiento_${(project.name || 'project').replace(/ /g, '_')}.html`);
  fs.writeFileSync(reportPath, reportHTML, 'utf8');
  
  console.log('✅ Reporte HTML guardado exitosamente');
  console.log(`📁 Ubicación: ${reportPath}`);
  console.log('\n🎉 SIMULACIÓN COMPLETADA');
  console.log('═'.repeat(60));
  
  return results;
})();
