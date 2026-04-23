/**
 * Backend Service Test Script
 * Tests backend services with verbose logging for better visibility
 */

console.log('=== Backend Service Tests ===\n');

// Test contourSmoothing service
console.log('[1/3] Testing contourSmoothing.service.js...');
try {
  const s = require('./services/contourSmoothing.service.js');
  console.log('  ✓ Service loaded:', Object.keys(s));
  
  const testPoints = [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0}];
  const smoothed = s.smoothContour(testPoints, 0.5, 12);
  console.log('  ✓ smoothContour test passed');
  console.log('    Original points:', testPoints.length);
  console.log('    Smoothed points:', smoothed.length);
} catch (e) {
  console.error('  ✗ Smoothing test failed:', e.message);
}

console.log('');

// Test contourLabels service
console.log('[2/3] Testing contourLabels.service.js...');
try {
  const l = require('./services/contourLabels.service.js');
  console.log('  ✓ Service loaded:', Object.keys(l));
  console.log('  ✓ Labels service loaded successfully');
} catch (e) {
  console.error('  ✗ Labels test failed:', e.message);
}

console.log('');

// Test exportDXF service
console.log('[3/3] Testing exportDXF.service.js...');
try {
  const d = require('./services/exportDXF.service.js');
  console.log('  ✓ Service loaded:', Object.keys(d));
  
  const testContours = [[{x:0,y:0},{x:1,y:0},{x:2,y:0}]];
  const levels = [500];
  const dxf = d.exportContoursToDXF(testContours, levels);
  console.log('  ✓ exportContoursToDXF test passed');
  console.log('    DXF length:', dxf.length);
  console.log('    DXF preview:', dxf.substring(0, 150));
} catch (e) {
  console.error('  ✗ DXF export test failed:', e.message);
}

console.log('\n=== All Tests Complete ===');
