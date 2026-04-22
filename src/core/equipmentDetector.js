/**
 * Equipment Detector for DXF Integration
 * Automatically detects and classifies electrical equipment from DXF entities
 */

/**
 * Equipment object
 * @typedef {Object} Equipment
 * @property {string} id - Unique identifier
 * @property {string} type - Equipment type ('transformer', 'switch', 'bus', 'fence', 'building', 'cable')
 * @property {string} layer - DXF layer name
 * @property {Object} bounds - Bounding box
 * @property {number} bounds.minX - Minimum X coordinate
 * @property {number} bounds.maxX - Maximum X coordinate
 * @property {number} bounds.minY - Minimum Y coordinate
 * @property {number} bounds.maxY - Maximum Y coordinate
 * @property {Object} center - Center point
 * @property {number} center.x - Center X coordinate
 * @property {number} center.y - Center Y coordinate
 * @property {Object} properties - Additional properties
 * @property {Array<Object>} entities - Original DXF entities
 */

/**
 * DXF entity (simplified representation)
 * @typedef {Object} DXFEntity
 * @property {string} type - Entity type ('LINE', 'CIRCLE', 'INSERT', 'TEXT', 'POLYLINE')
 * @property {string} layer - Layer name
 * @property {Object} geometry - Geometry data
 * @property {Object} properties - Additional properties
 */

/**
 * Detect equipment from DXF entities
 * @param {Array<DXFEntity>} entities - Array of DXF entities
 * @returns {Array<Equipment>} Array of detected equipment
 */
export function detectEquipment(entities) {
  const equipment = [];
  const processedEntities = new Set();
  
  // Group entities by layer
  const entitiesByLayer = groupEntitiesByLayer(entities);
  
  // Process each layer
  Object.entries(entitiesByLayer).forEach(([layerName, layerEntities]) => {
    const equipmentType = classifyLayer(layerName);
    
    if (equipmentType) {
      const detected = detectEquipmentInLayer(layerName, layerEntities, equipmentType);
      detected.forEach(eq => {
        if (!processedEntities.has(eq.id)) {
          equipment.push(eq);
          eq.entities.forEach(entity => processedEntities.add(entity.id || `${entity.type}_${layerName}`));
        }
      });
    }
  });
  
  // Detect equipment by geometry patterns
  const geometryDetected = detectByGeometry(entities);
  geometryDetected.forEach(eq => {
    if (!processedEntities.has(eq.id)) {
      equipment.push(eq);
    }
  });
  
  return equipment;
}

/**
 * Group entities by layer
 * @param {Array<DXFEntity>} entities - Array of DXF entities
 * @returns {Object} Entities grouped by layer
 */
function groupEntitiesByLayer(entities) {
  const grouped = {};
  
  entities.forEach(entity => {
    const layer = entity.layer || '0';
    if (!grouped[layer]) {
      grouped[layer] = [];
    }
    grouped[layer].push(entity);
  });
  
  return grouped;
}

/**
 * Classify layer name to equipment type
 * @param {string} layerName - Layer name
 * @returns {string|null} Equipment type or null
 */
function classifyLayer(layerName) {
  const upperLayer = layerName.toUpperCase();
  
  // Transformer patterns
  if (upperLayer.includes('TRANS') || upperLayer.includes('TRF') || upperLayer.includes('XFMR')) {
    return 'transformer';
  }
  
  // Switch patterns
  if (upperLayer.includes('SWITCH') || upperLayer.includes('SW') || upperLayer.includes('BREAKER')) {
    return 'switch';
  }
  
  // Bus patterns
  if (upperLayer.includes('BUS') || upperLayer.includes('BAR')) {
    return 'bus';
  }
  
  // Fence patterns
  if (upperLayer.includes('FENCE') || upperLayer.includes('CERC') || upperLayer.includes('PERIM')) {
    return 'fence';
  }
  
  // Building patterns
  if (upperLayer.includes('BUILD') || upperLayer.includes('STRUCT') || upperLayer.includes('WALL')) {
    return 'building';
  }
  
  // Cable patterns
  if (upperLayer.includes('CABLE') || upperLayer.includes('CONDUIT') || upperLayer.includes('DUCT')) {
    return 'cable';
  }
  
  return null;
}

/**
 * Detect equipment in a specific layer
 * @param {string} layerName - Layer name
 * @param {Array<DXFEntity>} entities - Entities in the layer
 * @param {string} equipmentType - Equipment type
 * @returns {Array<Equipment>} Detected equipment
 */
function detectEquipmentInLayer(layerName, entities, equipmentType) {
  const equipment = [];
  
  switch (equipmentType) {
    case 'transformer':
      equipment.push(...detectTransformers(layerName, entities));
      break;
    case 'switch':
      equipment.push(...detectSwitches(layerName, entities));
      break;
    case 'bus':
      equipment.push(...detectBuses(layerName, entities));
      break;
    case 'fence':
      equipment.push(...detectFences(layerName, entities));
      break;
    case 'building':
      equipment.push(...detectBuildings(layerName, entities));
      break;
    case 'cable':
      equipment.push(...detectCables(layerName, entities));
      break;
  }
  
  return equipment;
}

/**
 * Detect transformers from entities
 * @param {string} layerName - Layer name
 * @param {Array<DXFEntity>} entities - Entities
 * @returns {Array<Equipment>} Detected transformers
 */
function detectTransformers(layerName, entities) {
  const transformers = [];
  
  // Look for INSERT blocks (symbols) or circular patterns
  entities.forEach((entity, index) => {
    if (entity.type === 'INSERT') {
      transformers.push(createEquipment(
        `transformer_${layerName}_${index}`,
        'transformer',
        layerName,
        entity.geometry.position || { x: 0, y: 0 },
        { symbol: entity.geometry.name, type: 'symbol' },
        [entity]
      ));
    } else if (entity.type === 'CIRCLE') {
      transformers.push(createEquipment(
        `transformer_${layerName}_${index}`,
        'transformer',
        layerName,
        {
          x: entity.geometry.center.x,
          y: entity.geometry.center.y
        },
        { radius: entity.geometry.radius, type: 'circular' },
        [entity]
      ));
    }
  });
  
  return transformers;
}

/**
 * Detect switches from entities
 * @param {string} layerName - Layer name
 * @param {Array<DXFEntity>} entities - Entities
 * @returns {Array<Equipment>} Detected switches
 */
function detectSwitches(layerName, entities) {
  const switches = [];
  
  entities.forEach((entity, index) => {
    if (entity.type === 'INSERT') {
      switches.push(createEquipment(
        `switch_${layerName}_${index}`,
        'switch',
        layerName,
        entity.geometry.position || { x: 0, y: 0 },
        { symbol: entity.geometry.name },
        [entity]
      ));
    } else if (entity.type === 'RECTANGLE') {
      switches.push(createEquipment(
        `switch_${layerName}_${index}`,
        'switch',
        layerName,
        {
          x: (entity.geometry.min.x + entity.geometry.max.x) / 2,
          y: (entity.geometry.min.y + entity.geometry.max.y) / 2
        },
        { width: entity.geometry.max.x - entity.geometry.min.x, height: entity.geometry.max.y - entity.geometry.min.y },
        [entity]
      ));
    }
  });
  
  return switches;
}

/**
 * Detect buses from entities
 * @param {string} layerName - Layer name
 * @param {Array<DXFEntity>} entities - Entities
 * @returns {Array<Equipment>} Detected buses
 */
function detectBuses(layerName, entities) {
  const buses = [];
  
  // Group nearby lines to form bus segments
  const lineGroups = groupNearbyLines(entities, 0.5); // 0.5m tolerance
  
  lineGroups.forEach((group, index) => {
    const bounds = calculateGroupBounds(group);
    buses.push(createEquipment(
      `bus_${layerName}_${index}`,
      'bus',
      layerName,
      {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2
      },
      { length: calculateGroupLength(group), type: 'linear' },
      group
    ));
  });
  
  return buses;
}

/**
 * Detect fences from entities
 * @param {string} layerName - Layer name
 * @param {Array<DXFEntity>} entities - Entities
 * @returns {Array<Equipment>} Detected fences
 */
function detectFences(layerName, entities) {
  const fences = [];
  
  // Group lines to form fence segments
  const lineGroups = groupConnectedLines(entities);
  
  lineGroups.forEach((group, index) => {
    const bounds = calculateGroupBounds(group);
    fences.push(createEquipment(
      `fence_${layerName}_${index}`,
      'fence',
      layerName,
      {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2
      },
      { perimeter: calculateGroupLength(group), type: 'perimeter' },
      group
    ));
  });
  
  return fences;
}

/**
 * Detect buildings from entities
 * @param {string} layerName - Layer name
 * @param {Array<DXFEntity>} entities - Entities
 * @returns {Array<Equipment>} Detected buildings
 */
function detectBuildings(layerName, entities) {
  const buildings = [];
  
  // Look for closed polylines or rectangles
  entities.forEach((entity, index) => {
    if (entity.type === 'POLYLINE' && isClosedPolyline(entity)) {
      const bounds = calculatePolylineBounds(entity);
      buildings.push(createEquipment(
        `building_${layerName}_${index}`,
        'building',
        layerName,
        {
          x: (bounds.minX + bounds.maxX) / 2,
          y: (bounds.minY + bounds.maxY) / 2
        },
        { area: calculatePolygonArea(entity), type: 'polygon' },
        [entity]
      ));
    } else if (entity.type === 'RECTANGLE') {
      buildings.push(createEquipment(
        `building_${layerName}_${index}`,
        'building',
        layerName,
        {
          x: (entity.geometry.min.x + entity.geometry.max.x) / 2,
          y: (entity.geometry.min.y + entity.geometry.max.y) / 2
        },
        { 
          width: entity.geometry.max.x - entity.geometry.min.x,
          height: entity.geometry.max.y - entity.geometry.min.y,
          area: (entity.geometry.max.x - entity.geometry.min.x) * (entity.geometry.max.y - entity.geometry.min.y),
          type: 'rectangle'
        },
        [entity]
      ));
    }
  });
  
  return buildings;
}

/**
 * Detect cables from entities
 * @param {string} layerName - Layer name
 * @param {Array<DXFEntity>} entities - Entities
 * @returns {Array<Equipment>} Detected cables
 */
function detectCables(layerName, entities) {
  const cables = [];
  
  // Group lines to form cable routes
  const lineGroups = groupConnectedLines(entities);
  
  lineGroups.forEach((group, index) => {
    const bounds = calculateGroupBounds(group);
    cables.push(createEquipment(
      `cable_${layerName}_${index}`,
      'cable',
      layerName,
      {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2
      },
      { length: calculateGroupLength(group), type: 'route' },
      group
    ));
  });
  
  return cables;
}

/**
 * Detect equipment by geometry patterns
 * @param {Array<DXFEntity>} entities - All entities
 * @returns {Array<Equipment>} Detected equipment
 */
function detectByGeometry(entities) {
  const equipment = [];
  
  // Look for circular patterns that might be equipment
  const circles = entities.filter(e => e.type === 'CIRCLE');
  circles.forEach((circle, index) => {
    // Large circles might be equipment
    if (circle.geometry.radius > 0.5 && circle.geometry.radius < 5) {
      equipment.push(createEquipment(
        `equipment_circle_${index}`,
        'unknown',
        circle.layer || '0',
        circle.geometry.center,
        { radius: circle.geometry.radius, type: 'circular' },
        [circle]
      ));
    }
  });
  
  return equipment;
}

/**
 * Create equipment object
 * @param {string} id - Equipment ID
 * @param {string} type - Equipment type
 * @param {string} layer - Layer name
 * @param {Object} center - Center point
 * @param {Object} properties - Additional properties
 * @param {Array<Object>} entities - Original entities
 * @returns {Equipment} Equipment object
 */
function createEquipment(id, type, layer, center, properties, entities) {
  const bounds = calculateEntitiesBounds(entities);
  
  return {
    id,
    type,
    layer,
    bounds,
    center,
    properties,
    entities: entities.map((e, i) => ({ ...e, id: e.id || `${e.type}_${i}` }))
  };
}

/**
 * Calculate bounds from entities
 * @param {Array<Object>} entities - Entities
 * @returns {Object} Bounding box
 */
function calculateEntitiesBounds(entities) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  entities.forEach(entity => {
    const entityBounds = getEntityBounds(entity);
    minX = Math.min(minX, entityBounds.minX);
    maxX = Math.max(maxX, entityBounds.maxX);
    minY = Math.min(minY, entityBounds.minY);
    maxY = Math.max(maxY, entityBounds.maxY);
  });
  
  return { minX, maxX, minY, maxY };
}

/**
 * Get bounds of a single entity
 * @param {Object} entity - Entity
 * @returns {Object} Bounding box
 */
function getEntityBounds(entity) {
  switch (entity.type) {
    case 'LINE':
      return {
        minX: Math.min(entity.geometry.start.x, entity.geometry.end.x),
        maxX: Math.max(entity.geometry.start.x, entity.geometry.end.x),
        minY: Math.min(entity.geometry.start.y, entity.geometry.end.y),
        maxY: Math.max(entity.geometry.start.y, entity.geometry.end.y)
      };
    case 'CIRCLE':
      const r = entity.geometry.radius;
      return {
        minX: entity.geometry.center.x - r,
        maxX: entity.geometry.center.x + r,
        minY: entity.geometry.center.y - r,
        maxY: entity.geometry.center.y + r
      };
    case 'RECTANGLE':
      return entity.geometry;
    case 'POLYLINE':
      return calculatePolylineBounds(entity);
    default:
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
}

/**
 * Group nearby lines
 * @param {Array<Object>} lines - Line entities
 * @param {number} tolerance - Tolerance in meters
 * @returns {Array<Array<Object>>} Groups of nearby lines
 */
function groupNearbyLines(lines, tolerance) {
  const groups = [];
  const processed = new Set();
  
  lines.forEach(line => {
    if (processed.has(line)) return;
    
    const group = [line];
    processed.add(line);
    
    // Find nearby lines
    lines.forEach(otherLine => {
      if (processed.has(otherLine)) return;
      
      if (areLinesNearby(line, otherLine, tolerance)) {
        group.push(otherLine);
        processed.add(otherLine);
      }
    });
    
    groups.push(group);
  });
  
  return groups;
}

/**
 * Check if two lines are nearby
 * @param {Object} line1 - First line
 * @param {Object} line2 - Second line
 * @param {number} tolerance - Tolerance
 * @returns {boolean} True if lines are nearby
 */
function areLinesNearby(line1, line2, tolerance) {
  const dist = distanceBetweenLines(line1.geometry, line2.geometry);
  return dist <= tolerance;
}

/**
 * Calculate distance between two lines
 * @param {Object} line1 - First line geometry
 * @param {Object} line2 - Second line geometry
 * @returns {number} Distance
 */
function distanceBetweenLines(line1, line2) {
  if (!line1 || !line2 || !line1.start || !line1.end || !line2.start || !line2.end) {
    return Infinity;
  }
  
  // Simple implementation: distance between midpoints
  const mid1 = {
    x: (line1.start.x + line1.end.x) / 2,
    y: (line1.start.y + line1.end.y) / 2
  };
  const mid2 = {
    x: (line2.start.x + line2.end.x) / 2,
    y: (line2.start.y + line2.end.y) / 2
  };
  
  return Math.sqrt(Math.pow(mid2.x - mid1.x, 2) + Math.pow(mid2.y - mid1.y, 2));
}

/**
 * Group connected lines
 * @param {Array<Object>} lines - Line entities
 * @returns {Array<Array<Object>>} Groups of connected lines
 */
function groupConnectedLines(lines) {
  const groups = [];
  const processed = new Set();
  
  lines.forEach(line => {
    if (processed.has(line)) return;
    
    const group = [line];
    processed.add(line);
    
    // Find connected lines
    let added = true;
    while (added) {
      added = false;
      lines.forEach(otherLine => {
        if (processed.has(otherLine)) return;
        
        if (areLinesConnected(group, otherLine)) {
          group.push(otherLine);
          processed.add(otherLine);
          added = true;
        }
      });
    }
    
    groups.push(group);
  });
  
  return groups;
}

/**
 * Check if a line is connected to any line in a group
 * @param {Array<Object>} group - Group of lines
 * @param {Object} line - Line to check
 * @returns {boolean} True if connected
 */
function areLinesConnected(group, line) {
  return group.some(groupLine => {
    return areLinesConnected(groupLine.geometry, line.geometry);
  });
}

/**
 * Check if two lines are connected
 * @param {Object} line1 - First line geometry
 * @param {Object} line2 - Second line geometry
 * @returns {boolean} True if connected
 */
function areLinesConnected(line1, line2) {
  if (!line1 || !line2 || !line1.start || !line1.end || !line2.start || !line2.end) {
    return false;
  }
  
  const tolerance = 0.01; // 1cm tolerance
  
  // Check if any endpoint is close to any endpoint of the other line
  const endpoints1 = [
    { x: line1.start.x, y: line1.start.y },
    { x: line1.end.x, y: line1.end.y }
  ];
  
  const endpoints2 = [
    { x: line2.start.x, y: line2.start.y },
    { x: line2.end.x, y: line2.end.y }
  ];
  
  return endpoints1.some(p1 => 
    endpoints2.some(p2 => 
      Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) <= tolerance
    )
  );
}

/**
 * Calculate bounds of a group
 * @param {Array<Object>} entities - Entities in group
 * @returns {Object} Bounding box
 */
function calculateGroupBounds(entities) {
  return calculateEntitiesBounds(entities);
}

/**
 * Calculate total length of a group
 * @param {Array<Object>} entities - Entities in group
 * @returns {number} Total length
 */
function calculateGroupLength(entities) {
  return entities.reduce((total, entity) => {
    if (entity.type === 'LINE') {
      const dx = entity.geometry.end.x - entity.geometry.start.x;
      const dy = entity.geometry.end.y - entity.geometry.start.y;
      return total + Math.sqrt(dx * dx + dy * dy);
    }
    return total;
  }, 0);
}

/**
 * Check if polyline is closed
 * @param {Object} polyline - Polyline entity
 * @returns {boolean} True if closed
 */
function isClosedPolyline(polyline) {
  if (!polyline || !polyline.geometry || !polyline.geometry.vertices) return false;
  
  const vertices = polyline.geometry.vertices;
  if (vertices.length < 3) return false;
  
  const first = vertices[0];
  const last = vertices[vertices.length - 1];
  
  return Math.abs(first.x - last.x) < 0.01 && Math.abs(first.y - last.y) < 0.01;
}

/**
 * Calculate polyline bounds
 * @param {Object} polyline - Polyline entity
 * @returns {Object} Bounding box
 */
function calculatePolylineBounds(polyline) {
  if (!polyline || !polyline.geometry || !polyline.geometry.vertices) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
  
  const vertices = polyline.geometry.vertices;
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  vertices.forEach(vertex => {
    minX = Math.min(minX, vertex.x);
    maxX = Math.max(maxX, vertex.x);
    minY = Math.min(minY, vertex.y);
    maxY = Math.max(maxY, vertex.y);
  });
  
  return { minX, maxX, minY, maxY };
}

/**
 * Calculate polygon area
 * @param {Object} polyline - Polyline entity
 * @returns {number} Area
 */
function calculatePolygonArea(polyline) {
  if (!polyline || !polyline.geometry || !polyline.geometry.vertices) return 0;
  
  const vertices = polyline.geometry.vertices;
  if (vertices.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < vertices.length - 1; i++) {
    area += vertices[i].x * vertices[i + 1].y - vertices[i + 1].x * vertices[i].y;
  }
  
  return Math.abs(area / 2);
}

export default {
  detectEquipment,
  classifyLayer,
  createEquipment
};
