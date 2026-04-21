/**
 * Scale Engine for Real Plan Integration
 * Handles conversion between real meters and pixels for DXF integration
 */

/**
 * Scale configuration object
 * @typedef {Object} ScaleConfig
 * @property {number} scale - meters per pixel ratio
 * @property {number} offsetX - offset in pixels for X coordinate
 * @property {number} offsetY - offset in pixels for Y coordinate
 * @property {Object} bounds - bounding box in real meters
 * @property {number} bounds.minX - minimum X coordinate
 * @property {number} bounds.maxX - maximum X coordinate
 * @property {number} bounds.minY - minimum Y coordinate
 * @property {number} bounds.maxY - maximum Y coordinate
 * @property {number} canvasWidth - canvas width in pixels
 * @property {number} canvasHeight - canvas height in pixels
 */

/**
 * Create scale configuration from DXF bounding box
 * @param {Object} dxfBounds - DXF bounding box {minX, maxX, minY, maxY}
 * @param {number} canvasWidth - canvas width in pixels
 * @param {number} canvasHeight - canvas height in pixels
 * @param {number} padding - padding in pixels (default: 20)
 * @returns {ScaleConfig} Scale configuration
 */
export function createScaleFromDXF(dxfBounds, canvasWidth, canvasHeight, padding = 20) {
  const realWidth = dxfBounds.maxX - dxfBounds.minX;
  const realHeight = dxfBounds.maxY - dxfBounds.minY;
  
  const availableWidth = canvasWidth - 2 * padding;
  const availableHeight = canvasHeight - 2 * padding;
  
  // Calculate scale to fit entire drawing
  const scaleX = availableWidth / realWidth;
  const scaleY = availableHeight / realHeight;
  
  // Use smaller scale to ensure everything fits
  const scale = Math.min(scaleX, scaleY);
  
  // Calculate offsets to center the drawing
  const scaledWidth = realWidth * scale;
  const scaledHeight = realHeight * scale;
  
  const offsetX = (canvasWidth - scaledWidth) / 2 - dxfBounds.minX * scale;
  const offsetY = (canvasHeight - scaledHeight) / 2 - dxfBounds.minY * scale;
  
  return {
    scale,
    offsetX,
    offsetY,
    bounds: dxfBounds,
    canvasWidth,
    canvasHeight
  };
}

/**
 * Convert real meters to pixels
 * @param {ScaleConfig} scaleConfig - Scale configuration
 * @param {number} realX - Real X coordinate in meters
 * @param {number} realY - Real Y coordinate in meters
 * @returns {Object} Pixel coordinates {x, y}
 */
export function realToPixels(scaleConfig, realX, realY) {
  return {
    x: realX * scaleConfig.scale + scaleConfig.offsetX,
    y: realY * scaleConfig.scale + scaleConfig.offsetY
  };
}

/**
 * Convert pixels to real meters
 * @param {ScaleConfig} scaleConfig - Scale configuration
 * @param {number} pixelX - Pixel X coordinate
 * @param {number} pixelY - Pixel Y coordinate
 * @returns {Object} Real coordinates {x, y}
 */
export function pixelsToReal(scaleConfig, pixelX, pixelY) {
  return {
    x: (pixelX - scaleConfig.offsetX) / scaleConfig.scale,
    y: (pixelY - scaleConfig.offsetY) / scaleConfig.scale
  };
}

/**
 * Convert real distance to pixels
 * @param {ScaleConfig} scaleConfig - Scale configuration
 * @param {number} realDistance - Real distance in meters
 * @returns {number} Distance in pixels
 */
export function realDistanceToPixels(scaleConfig, realDistance) {
  return realDistance * scaleConfig.scale;
}

/**
 * Convert pixel distance to real meters
 * @param {ScaleConfig} scaleConfig - Scale configuration
 * @param {number} pixelDistance - Distance in pixels
 * @returns {number} Distance in meters
 */
export function pixelDistanceToReal(scaleConfig, pixelDistance) {
  return pixelDistance / scaleConfig.scale;
}

/**
 * Get scale factor for display (e.g., "1:100")
 * @param {ScaleConfig} scaleConfig - Scale configuration
 * @returns {string} Scale factor as string
 */
export function getScaleFactor(scaleConfig) {
  const pixelsPerMeter = scaleConfig.scale;
  const metersPerPixel = 1 / pixelsPerMeter;
  
  // Find appropriate scale factor
  if (metersPerPixel >= 1) {
    return `1:${Math.round(metersPerPixel)}`;
  } else {
    const denominator = Math.round(1 / metersPerPixel);
    return `${denominator}:1`;
  }
}

/**
 * Validate if a point is within canvas bounds
 * @param {ScaleConfig} scaleConfig - Scale configuration
 * @param {number} pixelX - Pixel X coordinate
 * @param {number} pixelY - Pixel Y coordinate
 * @returns {boolean} True if point is within bounds
 */
export function isWithinCanvas(scaleConfig, pixelX, pixelY) {
  return pixelX >= 0 && pixelX <= scaleConfig.canvasWidth &&
         pixelY >= 0 && pixelY <= scaleConfig.canvasHeight;
}

/**
 * Clamp a point to canvas bounds
 * @param {ScaleConfig} scaleConfig - Scale configuration
 * @param {number} pixelX - Pixel X coordinate
 * @param {number} pixelY - Pixel Y coordinate
 * @returns {Object} Clamped pixel coordinates {x, y}
 */
export function clampToCanvas(scaleConfig, pixelX, pixelY) {
  return {
    x: Math.max(0, Math.min(scaleConfig.canvasWidth, pixelX)),
    y: Math.max(0, Math.min(scaleConfig.canvasHeight, pixelY))
  };
}

/**
 * Calculate grid spacing in pixels for display
 * @param {ScaleConfig} scaleConfig - Scale configuration
 * @param {number} realSpacing - Real grid spacing in meters
 * @returns {number} Grid spacing in pixels
 */
export function getGridSpacing(scaleConfig, realSpacing) {
  return realDistanceToPixels(scaleConfig, realSpacing);
}

/**
 * Create a default scale configuration for parametric design
 * @param {number} gridLength - Grid length in meters
 * @param {number} gridWidth - Grid width in meters
 * @param {number} canvasWidth - Canvas width in pixels
 * @param {number} canvasHeight - Canvas height in pixels
 * @returns {ScaleConfig} Default scale configuration
 */
export function createDefaultScale(gridLength, gridWidth, canvasWidth, canvasHeight) {
  const dxfBounds = {
    minX: -gridLength / 2,
    maxX: gridLength / 2,
    minY: -gridWidth / 2,
    maxY: gridWidth / 2
  };
  
  return createScaleFromDXF(dxfBounds, canvasWidth, canvasHeight);
}

/**
 * Transform coordinates from DXF (Y-up) to canvas (Y-down)
 * @param {number} dxfY - Y coordinate in DXF system
 * @param {number} canvasHeight - Canvas height
 * @returns {number} Y coordinate in canvas system
 */
export function dxfYToCanvas(dxfY, canvasHeight) {
  return canvasHeight - dxfY;
}

/**
 * Transform coordinates from canvas (Y-down) to DXF (Y-up)
 * @param {number} canvasY - Y coordinate in canvas system
 * @param {number} canvasHeight - Canvas height
 * @returns {number} Y coordinate in DXF system
 */
export function canvasYToDxf(canvasY, canvasHeight) {
  return canvasHeight - canvasY;
}

/**
 * Complete transformation from DXF coordinates to canvas pixels
 * @param {ScaleConfig} scaleConfig - Scale configuration
 * @param {number} dxfX - X coordinate in DXF
 * @param {number} dxfY - Y coordinate in DXF
 * @returns {Object} Canvas pixel coordinates {x, y}
 */
export function dxfToCanvas(scaleConfig, dxfX, dxfY) {
  const real = { x: dxfX, y: dxfY };
  const pixel = realToPixels(scaleConfig, real.x, real.y);
  
  // Transform Y coordinate for canvas coordinate system
  pixel.y = dxfYToCanvas(pixel.y, scaleConfig.canvasHeight);
  
  return pixel;
}

/**
 * Complete transformation from canvas pixels to DXF coordinates
 * @param {ScaleConfig} scaleConfig - Scale configuration
 * @param {number} canvasX - X coordinate in canvas
 * @param {number} canvasY - Y coordinate in canvas
 * @returns {Object} DXF coordinates {x, y}
 */
export function canvasToDxf(scaleConfig, canvasX, canvasY) {
  // Transform Y coordinate from canvas to real coordinate system
  const realY = canvasYToDxf(canvasY, scaleConfig.canvasHeight);
  
  const real = pixelsToReal(scaleConfig, canvasX, realY);
  
  return {
    x: real.x,
    y: real.y
  };
}

export default {
  createScaleFromDXF,
  realToPixels,
  pixelsToReal,
  realDistanceToPixels,
  pixelDistanceToReal,
  getScaleFactor,
  isWithinCanvas,
  clampToCanvas,
  getGridSpacing,
  createDefaultScale,
  dxfYToCanvas,
  canvasYToDxf,
  dxfToCanvas,
  canvasToDxf
};
