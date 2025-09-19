/**
 * Data Fetching Hooks Index
 * 
 * Exports all data fetching hooks that work with both local JSON and Sanity data sources.
 * These hooks provide a unified interface regardless of the configured data source.
 */

// Individual data hooks
export { useProducts } from './useProducts';
export { useBrands } from './useBrands';
export { useCategories } from './useCategories';
export { useFeaturedProducts } from './useFeaturedProducts';
export { useProduct } from './useProduct';
export { useSearch } from './useSearch';

// Comprehensive data hook
export { useUnifiedData } from './useUnifiedData';


// Re-export types for convenience
export type { UnifiedProduct, UnifiedBrand, UnifiedCategory, UnifiedData } from '@/lib/unifiedDataTypes';
