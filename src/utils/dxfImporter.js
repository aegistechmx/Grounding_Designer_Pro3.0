/**
 * Importador DXF profesional
 * Soporta: GRID, RODS, TEXT, DIMENSIONS
 * Parser básico DXF para AutoCAD
 */

// ============================================
// 1. PARSEAR ARCHIVO DXF
// ============================================

export const parseDXF = (dxfContent) => {
  const lines = dxfContent.split('\n');
  const result = {
    layers: [],
    entities: [],
    nodes: [],
    conductors: [],
    rods: [],
    contours: []
  };
  
  let currentSection = null;
  let currentEntity = null;
  let currentLayer = null;
  
  for (let i = 0; i < lines.length; i++) {
    const code = lines[i].trim();
    const value = (i + 1 < lines.length) ? lines[i + 1].trim() : '';
    
    if (code === '0') {
      if (value === 'SECTION') {
        currentSection = null;
      } else if (value === 'ENDSEC') {
        currentSection = null;
      } else if (value === 'LAYER') {
        currentLayer = { name: '', color: 7, linetype: 'CONTINUOUS' };
      } else if (['LINE', 'CIRCLE', 'POINT', 'POLYLINE', 'VERTEX', 'SEQEND'].includes(value)) {
        currentEntity = { type: value, layer: currentLayer?.name || '0', properties: {} };
      }
    } else if (code === '2') {
      if (currentSection === 'TABLES' || value === 'LAYER') {
        currentLayer.name = value;
      }
    } else if (code === '8') {
      if (currentEntity) {
        currentEntity.layer = value;
      }
    } else if (code === '62') {
      if (currentLayer) {
        currentLayer.color = parseInt(value);
      }
    } else if (code === '6') {
      if (currentLayer) {
        currentLayer.linetype = value;
      }
    } else if (currentEntity && ['10', '11', '20', '21', '30', '31', '40', '50'].includes(code)) {
      const propMap = {
        '10': 'x1', '11': 'x2',
        '20': 'y1', '21': 'y2',
        '30': 'z1', '31': 'z2',
        '40': 'radius', '50': 'angle'
      };
      currentEntity.properties[propMap[code]] = parseFloat(value) || 0;
    }
    
    // Finalizar entidad
    if (code === '0' && currentEntity && currentEntity.type) {
      result.entities.push({ ...currentEntity });
      
      // Clasificar por tipo
      if (currentEntity.type === 'LINE' && currentEntity.layer === 'GRID') {
        result.conductors.push({
          from: result.nodes.length,
          to: result.nodes.length + 1,
          x1: currentEntity.properties.x1,
          y1: currentEntity.properties.y1,
          z1: currentEntity.properties.z1 || 0,
          x2: currentEntity.properties.x2,
          y2: currentEntity.properties.y2,
          z2: currentEntity.properties.z2 || 0
        });
      } else if (currentEntity.type === 'CIRCLE' && currentEntity.layer === 'RODS') {
        result.rods.push({
          x: currentEntity.properties.x1,
          y: currentEntity.properties.y1,
          z: currentEntity.properties.z1 || 0,
          radius: currentEntity.properties.radius
        });
      } else if (currentEntity.type === 'POINT') {
        result.nodes.push({
          id: result.nodes.length,
          x: currentEntity.properties.x1,
          y: currentEntity.properties.y1,
          z: currentEntity.properties.z1 || 0
        });
      } else if (currentEntity.type === 'POLYLINE' && currentEntity.layer === 'CONTOURS') {
        result.contours.push({
          points: []
        });
      }
      
      currentEntity = null;
    }
    
    // Finalizar capa
    if (code === '0' && currentLayer && currentLayer.name) {
      result.layers.push({ ...currentLayer });
      currentLayer = null;
    }
  }
  
  return result;
};

// ============================================
// 2. IMPORTAR DESDE ARCHIVO
// ============================================

export const importDXFFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsed = parseDXF(content);
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

// ============================================
// 3. CONVERTIR A FORMATO DE GRID
// ============================================

export const dxfToGridFormat = (dxfData) => {
  const grid = {
    nodes: [],
    conductors: [],
    rods: [],
    bounds: {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity
    }
  };
  
  // Procesar nodos
  for (const node of dxfData.nodes) {
    grid.nodes.push({
      id: node.id,
      x: node.x,
      y: node.y,
      z: node.z || 0
    });
    
    // Actualizar bounds
    grid.bounds.minX = Math.min(grid.bounds.minX, node.x);
    grid.bounds.maxX = Math.max(grid.bounds.maxX, node.x);
    grid.bounds.minY = Math.min(grid.bounds.minY, node.y);
    grid.bounds.maxY = Math.max(grid.bounds.maxY, node.y);
  }
  
  // Procesar conductores
  const EPSILON = 1e-6;
  
  const findOrCreateNode = (x, y, z) => {
    const existing = grid.nodes.find(n => 
      Math.abs(n.x - x) < EPSILON && Math.abs(n.y - y) < EPSILON
    );
    if (existing) return existing.id;
    
    const id = grid.nodes.length;
    grid.nodes.push({ id, x, y: y, z: z || 0 });
    return id;
  };
  
  for (const conductor of dxfData.conductors) {
    const fromId = findOrCreateNode(conductor.x1, conductor.y1, conductor.z1);
    const toId = findOrCreateNode(conductor.x2, conductor.y2, conductor.z2);
    
    grid.conductors.push({
      from: fromId,
      to: toId
    });
  }
  
  // Procesar varillas
  for (const rod of dxfData.rods) {
    grid.rods.push({
      x: rod.x,
      y: rod.y,
      z: rod.z,
      length: rod.radius * 2 || 3
    });
  }
  
  return grid;
};

// ============================================
// 4. VALIDAR DXF
// ============================================

export const validateDXF = (dxfData) => {
  const errors = [];
  const warnings = [];
  
  if (!dxfData.nodes || dxfData.nodes.length === 0) {
    errors.push('No se encontraron nodos en el archivo DXF');
  }
  
  if (!dxfData.conductors || dxfData.conductors.length === 0) {
    warnings.push('No se encontraron conductores en el archivo DXF');
  }
  
  if (!dxfData.layers || dxfData.layers.length === 0) {
    warnings.push('No se encontraron capas en el archivo DXF');
  }
  
  // Validar capas requeridas
  const requiredLayers = ['GRID', 'RODS'];
  const foundLayers = dxfData.layers.map(l => l.name);
  
  for (const layer of requiredLayers) {
    if (!foundLayers.includes(layer)) {
      warnings.push(`Capa requerida "${layer}" no encontrada`);
    }
  }
  
  return { errors, warnings, valid: errors.length === 0 };
};

export default {
  parseDXF,
  importDXFFile,
  dxfToGridFormat,
  validateDXF
};
