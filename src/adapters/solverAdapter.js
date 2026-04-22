/**
 * Solver Adapter
 * 
 * DEPRECATED: This adapter is deprecated as of architectural refactoring
 * Grid solver is now integrated directly into UnifiedEngine
 * 
 * Migration guide:
 * - Use UnifiedEngine.analyze({includeDiscrete: true}) for discrete solver results
 * - Access discrete results via results.primary (when sourceOfTruth='discrete')
 * 
 * Kept for backward compatibility with existing code
 */

export function solverAdapter() {}
