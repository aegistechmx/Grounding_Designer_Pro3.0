/**
 * Importador de archivos DXF
 * Para cargar geometrías desde AutoCAD
 */

export const importDXF = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const lines = [];
        const entities = parseDXFContent(content);
        
        for (const entity of entities) {
          if (entity.type === 'LINE') {
            lines.push({
              x1: entity.x1,
              y1: entity.y1,
              x2: entity.x2,
              y2: entity.y2
            });
          } else if (entity.type === 'CIRCLE') {
            lines.push({
              x1: entity.x - entity.r,
              y1: entity.y,
              x2: entity.x + entity.r,
              y2: entity.y,
              isCircle: true,
              center: { x: entity.x, y: entity.y },
              radius: entity.r
            });
          }
        }
        
        resolve({
          lines,
          bounds: calculateBounds(lines),
          entityCount: entities.length
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

const parseDXFContent = (content) => {
  if (!content || typeof content !== 'string') return [];
  
  const lines = content.split('\n');
  const entities = [];
  let i = 0;
  
  while (i < lines.length) {
    const code = lines[i]?.trim();
    const value = lines[i + 1]?.trim();
    
    if (code === '0' && value === 'LINE') {
      // Buscar coordenadas de línea
      let x1 = null, y1 = null, x2 = null, y2 = null;
      i += 2;
      
      while (i < lines.length && lines[i]?.trim() !== '0') {
        const subCode = lines[i]?.trim();
        const subValue = lines[i + 1]?.trim();
        
        if (subCode === '10') x1 = parseFloat(subValue);
        if (subCode === '20') y1 = parseFloat(subValue);
        if (subCode === '11') x2 = parseFloat(subValue);
        if (subCode === '21') y2 = parseFloat(subValue);
        
        i += 2;
      }
      
      // Validar que no sean NaN
      if (x1 !== null && !isNaN(x1) && y1 !== null && !isNaN(y1) && 
          x2 !== null && !isNaN(x2) && y2 !== null && !isNaN(y2)) {
        entities.push({ type: 'LINE', x1, y1, x2, y2 });
      }
    } else if (code === '0' && value === 'CIRCLE') {
      let x = null, y = null, r = null;
      i += 2;
      
      while (i < lines.length && lines[i]?.trim() !== '0') {
        const subCode = lines[i]?.trim();
        const subValue = lines[i + 1]?.trim();
        
        if (subCode === '10') x = parseFloat(subValue);
        if (subCode === '20') y = parseFloat(subValue);
        if (subCode === '40') r = parseFloat(subValue);
        
        i += 2;
      }
      
      // Validar que no sean NaN
      if (x !== null && !isNaN(x) && y !== null && !isNaN(y) && r !== null && !isNaN(r)) {
        entities.push({ type: 'CIRCLE', x, y, r });
      }
    } else {
      i++;
    }
  }
  
  return entities;
};

const calculateBounds = (lines) => {
  if (!lines || !Array.isArray(lines) || lines.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  for (const line of lines) {
    if (line.x1 !== undefined && !isNaN(line.x1)) minX = Math.min(minX, line.x1);
    if (line.x2 !== undefined && !isNaN(line.x2)) minX = Math.min(minX, line.x2);
    if (line.y1 !== undefined && !isNaN(line.y1)) minY = Math.min(minY, line.y1);
    if (line.y2 !== undefined && !isNaN(line.y2)) minY = Math.min(minY, line.y2);
    if (line.x1 !== undefined && !isNaN(line.x1)) maxX = Math.max(maxX, line.x1);
    if (line.x2 !== undefined && !isNaN(line.x2)) maxX = Math.max(maxX, line.x2);
    if (line.y1 !== undefined && !isNaN(line.y1)) maxY = Math.max(maxY, line.y1);
    if (line.y2 !== undefined && !isNaN(line.y2)) maxY = Math.max(maxY, line.y2);
  }
  
  // Si no se encontraron coordenadas válidas
  if (minX === Infinity) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
};

export const extractGridFromDXF = (lines) => {
  if (!lines || !Array.isArray(lines)) {
    return { horizontal: [], vertical: [], count: 0 };
  }
  
  // Extraer la malla más grande del DXF
  const horizontalLines = lines.filter(l => 
    l && Math.abs((l.y1 || 0) - (l.y2 || 0)) < 0.1
  );
  const verticalLines = lines.filter(l => 
    l && Math.abs((l.x1 || 0) - (l.x2 || 0)) < 0.1
  );
  
  return {
    horizontal: horizontalLines,
    vertical: verticalLines,
    count: horizontalLines.length + verticalLines.length
  };
};

export default {
  importDXF,
  extractGridFromDXF
};
