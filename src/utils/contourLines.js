/**
 * Contour Line (Isoline) Generation for Original Interface
 * Creates equipotential lines from interpolated field data
 */

/**
 * Marching Squares algorithm for contour line generation
 */
export function generateContourLines(fieldData, levels, resolution) {
  const contourLines = [];
  const size = resolution;
  
  for (const level of levels) {
    const lines = traceContourLevel(fieldData, level, size);
    contourLines.push({
      level,
      lines,
      color: getContourColor(level, levels)
    });
  }
  
  return contourLines;
}

/**
 * Trace a single contour level using Marching Squares
 */
function traceContourLevel(fieldData, level, size) {
  const lines = [];
  const cellSize = 400 / size;
  
  for (let i = 0; i < size - 1; i++) {
    for (let j = 0; j < size - 1; j++) {
      const cell = {
        x: i * cellSize,
        y: j * cellSize,
        values: [
          fieldData[i][j],
          fieldData[i + 1][j],
          fieldData[i + 1][j + 1],
          fieldData[i][j + 1]
        ]
      };
      
      const cellLines = marchSquare(cell, level, cellSize);
      if (cellLines.length > 0) {
        lines.push(...cellLines);
      }
    }
  }
  
  return lines;
}

/**
 * Marching Squares case analysis for a single cell
 */
function marchSquare(cell, level, cellSize) {
  const lines = [];
  const config = getCellConfiguration(cell.values, level);
  
  switch (config) {
    case 1:
      lines.push([[cell.x, cell.y + cellSize * 0.5], [cell.x + cellSize * 0.5, cell.y]]);
      break;
    case 2:
      lines.push([[cell.x + cellSize * 0.5, cell.y], [cell.x + cellSize, cell.y + cellSize * 0.5]]);
      break;
    case 3:
      lines.push(
        [[cell.x, cell.y + cellSize * 0.5], [cell.x + cellSize * 0.5, cell.y]],
        [[cell.x + cellSize * 0.5, cell.y + cellSize], [cell.x + cellSize, cell.y + cellSize * 0.5]]
      );
      break;
    case 4:
      lines.push([[cell.x + cellSize, cell.y + cellSize * 0.5], [cell.x + cellSize * 0.5, cell.y + cellSize]]);
      break;
    case 5:
      const center1 = (cell.values[0] + cell.values[2]) / 2;
      if (center1 > (cell.values[1] + cell.values[3]) / 2) {
        lines.push(
          [[cell.x, cell.y + cellSize * 0.5], [cell.x + cellSize * 0.5, cell.y]],
          [[cell.x + cellSize * 0.5, cell.y + cellSize], [cell.x + cellSize, cell.y + cellSize * 0.5]]
        );
      } else {
        lines.push(
          [[cell.x + cellSize * 0.5, cell.y], [cell.x + cellSize, cell.y + cellSize * 0.5]],
          [[cell.x, cell.y + cellSize * 0.5], [cell.x + cellSize * 0.5, cell.y + cellSize]]
        );
      }
      break;
    case 6:
      lines.push(
        [[cell.x + cellSize * 0.5, cell.y], [cell.x + cellSize, cell.y + cellSize * 0.5]],
        [[cell.x, cell.y + cellSize * 0.5], [cell.x + cellSize * 0.5, cell.y + cellSize]]
      );
      break;
    case 7:
      lines.push(
        [[cell.x, cell.y + cellSize * 0.5], [cell.x + cellSize * 0.5, cell.y]],
        [[cell.x + cellSize * 0.5, cell.y], [cell.x + cellSize, cell.y + cellSize * 0.5]],
        [[cell.x + cellSize * 0.5, cell.y + cellSize], [cell.x + cellSize, cell.y + cellSize * 0.5]]
      );
      break;
    case 8:
      lines.push([[cell.x + cellSize * 0.5, cell.y + cellSize], [cell.x, cell.y + cellSize * 0.5]]);
      break;
    case 9:
      lines.push(
        [[cell.x, cell.y + cellSize * 0.5], [cell.x + cellSize * 0.5, cell.y + cellSize]],
        [[cell.x + cellSize * 0.5, cell.y], [cell.x + cellSize, cell.y + cellSize * 0.5]]
      );
      break;
    case 10:
      const center2 = (cell.values[1] + cell.values[3]) / 2;
      if (center2 > (cell.values[0] + cell.values[2]) / 2) {
        lines.push(
          [[cell.x + cellSize * 0.5, cell.y], [cell.x + cellSize, cell.y + cellSize * 0.5]],
          [[cell.x, cell.y + cellSize * 0.5], [cell.x + cellSize * 0.5, cell.y + cellSize]]
        );
      } else {
        lines.push(
          [[cell.x, cell.y + cellSize * 0.5], [cell.x + cellSize * 0.5, cell.y]],
          [[cell.x + cellSize * 0.5, cell.y + cellSize], [cell.x + cellSize, cell.y + cellSize * 0.5]]
        );
      }
      break;
    case 11:
      lines.push(
        [[cell.x, cell.y + cellSize * 0.5], [cell.x + cellSize * 0.5, cell.y]],
        [[cell.x + cellSize * 0.5, cell.y], [cell.x + cellSize, cell.y + cellSize * 0.5]],
        [[cell.x + cellSize * 0.5, cell.y + cellSize], [cell.x, cell.y + cellSize * 0.5]]
      );
      break;
    case 12:
      lines.push(
        [[cell.x + cellSize * 0.5, cell.y + cellSize], [cell.x + cellSize, cell.y + cellSize * 0.5]],
        [[cell.x, cell.y + cellSize * 0.5], [cell.x + cellSize * 0.5, cell.y]]
      );
      break;
    case 13:
      lines.push(
        [[cell.x + cellSize * 0.5, cell.y + cellSize], [cell.x + cellSize, cell.y + cellSize * 0.5]],
        [[cell.x + cellSize * 0.5, cell.y], [cell.x, cell.y + cellSize * 0.5]],
        [[cell.x, cell.y + cellSize * 0.5], [cell.x + cellSize * 0.5, cell.y]]
      );
      break;
    case 14:
      lines.push(
        [[cell.x + cellSize * 0.5, cell.y], [cell.x + cellSize, cell.y + cellSize * 0.5]],
        [[cell.x + cellSize * 0.5, cell.y + cellSize], [cell.x + cellSize, cell.y + cellSize * 0.5]],
        [[cell.x, cell.y + cellSize * 0.5], [cell.x + cellSize * 0.5, cell.y]]
      );
      break;
  }
  
  return lines;
}

/**
 * Get cell configuration based on corner values relative to contour level
 */
function getCellConfiguration(values, level) {
  let config = 0;
  if (values[0] > level) config |= 1;
  if (values[1] > level) config |= 2;
  if (values[2] > level) config |= 4;
  if (values[3] > level) config |= 8;
  return config;
}

/**
 * Get contour color based on level with safety highlighting
 */
function getContourColor(level, levels, safetyLimit = 50) {
  const minLevel = Math.min(...levels);
  const maxLevel = Math.max(...levels);
  const t = (level - minLevel) / (maxLevel - minLevel);
  
  // 🔥 Highlight dangerous levels (engineering gold)
  if (level > safetyLimit) {
    return 'rgba(220, 38, 38, 0.8)'; // Red for dangerous zones
  }
  
  const r = Math.floor(255 * t);
  const g = Math.floor(100 * (1 - Math.abs(t - 0.5) * 2));
  const b = Math.floor(255 * (1 - t));
  
  return `rgba(${r}, ${g}, ${b}, 0.6)`;
}

/**
 * Generate contour levels automatically
 */
export function generateContourLevels(minValue, maxValue, numLevels = 10) {
  const levels = [];
  const step = (maxValue - minValue) / (numLevels + 1);
  
  for (let i = 1; i <= numLevels; i++) {
    levels.push(minValue + step * i);
  }
  
  return levels;
}

/**
 * Create interpolated field data from data points
 */
export function createInterpolatedField(data, resolution, interpolationPower, width, height) {
  const field = [];
  const size = resolution;
  
  // Extract nodes and values from data
  const nodes = data.map(d => ({ x: d.x, y: d.y }));
  const values = data.map(d => d.potential);
  
  for (let i = 0; i < size; i++) {
    field[i] = [];
    for (let j = 0; j < size; j++) {
      const worldX = (i / size) * 30 - 15; // -15 to 15 range
      const worldY = (j / size) * 30 - 15;
      
      let interpolatedValue = 0;
      let weightSum = 0;
      
      for (let k = 0; k < nodes.length; k++) {
        const dx = worldX - nodes[k].x;
        const dy = worldY - nodes[k].y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        
        if (distance < 0.5) {
          interpolatedValue = values[k];
          weightSum = 1;
          break;
        }
        
        const weight = 1 / Math.pow(distance, interpolationPower);
        interpolatedValue += weight * values[k];
        weightSum += weight;
      }
      
      field[i][j] = weightSum > 0 ? interpolatedValue / weightSum : 0;
    }
  }
  
  return field;
}
