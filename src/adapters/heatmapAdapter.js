/**
 * Heatmap Adapter
 * 
 * DEPRECATED: This adapter is deprecated as of architectural refactoring
 * Heatmap visualization now uses discrete solver nodes directly via UnifiedEngine
 * 
 * Migration guide:
 * - Use UnifiedEngine.analyze({includeSpatialData: true}) for spatial data
 * - Access spatial data via results.primary.spatialData.nodes
 * 
 * Kept for backward compatibility with existing code
 */

export function heatmapAdapter() {}
