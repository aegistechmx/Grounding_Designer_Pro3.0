/**
 * Heatmap Service
 * Handles heatmap generation, interpolation, and normalization
 */

class HeatmapService {
  /**
   * Generate heatmap from discrete grid data
   */
  generateHeatmap(discreteGrid, options = {}) {
    const { width = 600, height = 400, darkMode = false } = options;
    
    if (!discreteGrid || discreteGrid.length === 0) {
      throw new Error('No grid data provided');
    }

    // Normalize grid data
    const normalizedGrid = this.normalizeGrid(discreteGrid);
    
    // Interpolate for smoother visualization
    const interpolatedGrid = this.interpolate(normalizedGrid, 2);
    
    // Generate color mapping
    const heatmapData = this.mapToColors(interpolatedGrid, darkMode);
    
    return {
      data: heatmapData,
      width,
      height,
      min: Math.min(...discreteGrid.flat()),
      max: Math.max(...discreteGrid.flat()),
      gridSize: discreteGrid.length
    };
  }

  /**
   * Normalize grid data to 0-1 range
   */
  normalizeGrid(grid) {
    const flat = grid.flat();
    const min = Math.min(...flat);
    const max = Math.max(...flat);
    const range = max - min;
    
    if (range === 0) return grid.map(row => row.map(() => 0.5));
    
    return grid.map(row => 
      row.map(value => (value - min) / range)
    );
  }

  /**
   * Interpolate grid for smoother visualization
   */
  interpolate(grid, factor = 2) {
    const rows = grid.length;
    const cols = grid[0].length;
    const newRows = rows * factor;
    const newCols = cols * factor;
    
    const interpolated = [];
    
    for (let i = 0; i < newRows; i++) {
      const row = [];
      for (let j = 0; j < newCols; j++) {
        const srcRow = i / factor;
        const srcCol = j / factor;
        
        const r0 = Math.floor(srcRow);
        const r1 = Math.min(r0 + 1, rows - 1);
        const c0 = Math.floor(srcCol);
        const c1 = Math.min(c0 + 1, cols - 1);
        
        const dr = srcRow - r0;
        const dc = srcCol - c0;
        
        const v00 = grid[r0][c0];
        const v01 = grid[r0][c1];
        const v10 = grid[r1][c0];
        const v11 = grid[r1][c1];
        
        const v0 = v00 * (1 - dc) + v01 * dc;
        const v1 = v10 * (1 - dc) + v11 * dc;
        
        row.push(v0 * (1 - dr) + v1 * dr);
      }
      interpolated.push(row);
    }
    
    return interpolated;
  }

  /**
   * Map normalized values to colors
   */
  mapToColors(grid, darkMode = false) {
    return grid.map(row => 
      row.map(value => this.valueToColor(value, darkMode))
    );
  }

  /**
   * Convert normalized value to color
   */
  valueToColor(value, darkMode = false) {
    // Color scale: blue (low) -> green (medium) -> red (high)
    if (darkMode) {
      // Dark mode color scale
      if (value < 0.33) {
        return `rgb(30, 64, 175, ${value})`; // Blue
      } else if (value < 0.66) {
        return `rgb(34, 197, 94, ${value})`; // Green
      } else {
        return `rgb(239, 68, 68, ${value})`; // Red
      }
    } else {
      // Light mode color scale
      if (value < 0.33) {
        return `rgb(59, 130, 246, ${value})`; // Blue
      } else if (value < 0.66) {
        return `rgb(34, 197, 94, ${value})`; // Green
      } else {
        return `rgb(239, 68, 68, ${value})`; // Red
      }
    }
  }

  /**
   * Generate heatmap image (PNG)
   */
  async generateImage(heatmapData, options = {}) {
    // This would use a library like sharp or canvas
    // For now, return the data structure
    return {
      ...heatmapData,
      format: 'png',
      generated: new Date().toISOString()
    };
  }

  /**
   * Calculate voltage statistics
   */
  calculateStatistics(grid) {
    const flat = grid.flat();
    const min = Math.min(...flat);
    const max = Math.max(...flat);
    const mean = flat.reduce((a, b) => a + b, 0) / flat.length;
    const std = Math.sqrt(
      flat.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / flat.length
    );
    
    return { min, max, mean, std };
  }
}

module.exports = new HeatmapService();
