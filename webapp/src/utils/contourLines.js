/**
 * Contour Line (Isoline) Generation for Equipotential Visualization
 * Creates equipotential lines from interpolated field data
 */

/**
 * Marching Squares algorithm for contour line generation
 * Simplified implementation for voltage equipotentials
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
  const cellSize = 400 / size; // Canvas size / grid resolution
  
  for (let i = 0; i < size - 1; i++) {
    for (let j = 0; j < size - 1; j++) {
      const cell = {
        x: i * cellSize,
        y: j * cellSize,
        values: [
          fieldData[i][j],           // Top-left
          fieldData[i + 1][j],       // Top-right
          fieldData[i + 1][j + 1],   // Bottom-right
          fieldData[i][j + 1]        // Bottom-left
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
    case 0: // No contour
      break;
    case 1: // Single line
    case 2:
    case 4:
    case 8:
      lines.push(...generateSingleLine(cell, config, cellSize));
      break;
    case 3: // Two lines
    case 6:
    case 9:
    case 12:
      lines.push(...generateDoubleLine(cell, config, cellSize));
      break;
    case 5: // Ambiguous case
    case 10:
      lines.push(...generateAmbiguousLine(cell, config, cellSize));
      break;
    case 7: // Three lines
    case 11:
    case 13:
    case 14:
      lines.push(...generateTripleLine(cell, config, cellSize));
      break;
    case 15: // All corners above level (no contour)
      break;
  }
  
  return lines;
}

/**
 * Get cell configuration based on corner values relative to contour level
 */
function getCellConfiguration(values, level) {
  let config = 0;
  if (values[0] > level) config |= 1;    // Top-left
  if (values[1] > level) config |= 2;    // Top-right
  if (values[2] > level) config |= 4;    // Bottom-right
  if (values[3] > level) config |= 8;    // Bottom-left
  return config;
}

/**
 * Generate single line segment
 */
function generateSingleLine(cell, config, cellSize) {
  const lines = [];
  const { x, y } = cell;
  
  switch (config) {
    case 1: // Top-left above
      lines.push([
        [x, y + cellSize * 0.5],
        [x + cellSize * 0.5, y]
      ]);
      break;
    case 2: // Top-right above
      lines.push([
        [x + cellSize * 0.5, y],
        [x + cellSize, y + cellSize * 0.5]
      ]);
      break;
    case 4: // Bottom-right above
      lines.push([
        [x + cellSize, y + cellSize * 0.5],
        [x + cellSize * 0.5, y + cellSize]
      ]);
      break;
    case 8: // Bottom-left above
      lines.push([
        [x + cellSize * 0.5, y + cellSize],
        [x, y + cellSize * 0.5]
      ]);
      break;
  }
  
  return lines;
}

/**
 * Generate double line segments
 */
function generateDoubleLine(cell, config, cellSize) {
  const lines = [];
  const { x, y } = cell;
  
  switch (config) {
    case 3: // Top corners above
      lines.push(
        [[x, y + cellSize * 0.5], [x + cellSize * 0.5, y]],
        [[x + cellSize * 0.5, y + cellSize], [x + cellSize, y + cellSize * 0.5]]
      );
      break;
    case 6: // Top-right and bottom-right above
      lines.push(
        [[x + cellSize * 0.5, y], [x + cellSize, y + cellSize * 0.5]],
        [[x, y + cellSize * 0.5], [x + cellSize * 0.5, y + cellSize]]
      );
      break;
    case 9: // Top-left and bottom-left above
      lines.push(
        [[x, y + cellSize * 0.5], [x + cellSize * 0.5, y + cellSize]],
        [[x + cellSize * 0.5, y], [x + cellSize, y + cellSize * 0.5]]
      );
      break;
    case 12: // Bottom corners above
      lines.push(
        [[x + cellSize * 0.5, y + cellSize], [x + cellSize, y + cellSize * 0.5]],
        [[x, y + cellSize * 0.5], [x + cellSize * 0.5, y]]
      );
      break;
  }
  
  return lines;
}

/**
 * Generate ambiguous case lines (saddle points)
 */
function generateAmbiguousLine(cell, config, cellSize) {
  const lines = [];
  const { x, y } = cell;
  
  switch (config) {
    case 5: // Top-left and bottom-right above
      // Use center average to resolve ambiguity
      const center1 = (cell.values[0] + cell.values[2]) / 2;
      if (center1 > (cell.values[1] + cell.values[3]) / 2) {
        lines.push(
          [[x, y + cellSize * 0.5], [x + cellSize * 0.5, y]],
          [[x + cellSize * 0.5, y + cellSize], [x + cellSize, y + cellSize * 0.5]]
        );
      } else {
        lines.push(
          [[x + cellSize * 0.5, y], [x + cellSize, y + cellSize * 0.5]],
          [[x, y + cellSize * 0.5], [x + cellSize * 0.5, y + cellSize]]
        );
      }
      break;
    case 10: // Top-right and bottom-left above
      const center2 = (cell.values[1] + cell.values[3]) / 2;
      if (center2 > (cell.values[0] + cell.values[2]) / 2) {
        lines.push(
          [[x + cellSize * 0.5, y], [x + cellSize, y + cellSize * 0.5]],
          [[x, y + cellSize * 0.5], [x + cellSize * 0.5, y + cellSize]]
        );
      } else {
        lines.push(
          [[x, y + cellSize * 0.5], [x + cellSize * 0.5, y]],
          [[x + cellSize * 0.5, y + cellSize], [x + cellSize, y + cellSize * 0.5]]
        );
      }
      break;
  }
  
  return lines;
}

/**
 * Generate triple line segments
 */
function generateTripleLine(cell, config, cellSize) {
  const lines = [];
  const { x, y } = cell;
  
  switch (config) {
    case 7: // All except bottom-right above
      lines.push(
        [[x, y + cellSize * 0.5], [x + cellSize * 0.5, y]],
        [[x + cellSize * 0.5, y], [x + cellSize, y + cellSize * 0.5]],
        [[x + cellSize * 0.5, y + cellSize], [x + cellSize, y + cellSize * 0.5]]
      );
      break;
    case 11: // All except bottom-left above
      lines.push(
        [[x, y + cellSize * 0.5], [x + cellSize * 0.5, y]],
        [[x + cellSize * 0.5, y], [x + cellSize, y + cellSize * 0.5]],
        [[x + cellSize * 0.5, y + cellSize], [x, y + cellSize * 0.5]]
      );
      break;
    case 13: // All except top-right above
      lines.push(
        [[x, y + cellSize * 0.5], [x + cellSize * 0.5, y + cellSize]],
        [[x + cellSize * 0.5, y + cellSize], [x + cellSize, y + cellSize * 0.5]],
        [[x + cellSize * 0.5, y], [x, y + cellSize * 0.5]]
      );
      break;
    case 14: // All except top-left above
      lines.push(
        [[x + cellSize * 0.5, y], [x + cellSize, y + cellSize * 0.5]],
        [[x + cellSize * 0.5, y + cellSize], [x + cellSize, y + cellSize * 0.5]],
        [[x, y + cellSize * 0.5], [x + cellSize * 0.5, y]]
      );
      break;
  }
  
  return lines;
}

/**
 * Get contour color based on level
 */
function getContourColor(level, levels) {
  const minLevel = Math.min(...levels);
  const maxLevel = Math.max(...levels);
  const t = (level - minLevel) / (maxLevel - minLevel);
  
  // Color gradient from blue (low) to red (high)
  const r = Math.floor(255 * t);
  const g = Math.floor(100 * (1 - Math.abs(t - 0.5) * 2));
  const b = Math.floor(255 * (1 - t));
  
  return `rgb(${r}, ${g}, ${b})`;
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
 * Create interpolated field data from nodes and values
 */
export function createInterpolatedField(nodes, values, resolution, interpolationPower) {
  const field = [];
  const size = resolution;
  
  for (let i = 0; i < size; i++) {
    field[i] = [];
    for (let j = 0; j < size; j++) {
      const worldX = (i / size) * 50; // 50x50m grid
      const worldY = (j / size) * 50;
      
      // Simple interpolation (reuse existing IDW)
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
