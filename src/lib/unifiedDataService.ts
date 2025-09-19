/**
 * Unified Data Service
 * 
 * This is the main service that provides a unified interface for accessing data
 * from both local JSON and Sanity CMS sources. All data is normalized to the
 * same structure regardless of the source.
 */

import {
  UnifiedData,
  UnifiedBrand,
  UnifiedCategory,
  UnifiedProduct,
  UnifiedProductVariant,
  DataSource,
  TransformationContext,
} from './unifiedDataTypes';

import {
  transformLocalToUnified,
  transformSanityToUnified,
  transformUnifiedToLocal,
  validateUnifiedData,
  mergeUnifiedData,
} from './dataTransformers';

import { isLocalDataSource, isSanityDataSource, DATA_SOURCE_CONFIG } from './config';

// Import data sources
import jawariProducts from '@/data/jawari_products.json';
import { client, queries } from './sanity';

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

interface CacheEntry {
  data: UnifiedData;
  timestamp: number;
  source: DataSource;
}

class UnifiedDataCache {
  private cache = new Map<DataSource, CacheEntry>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  set(source: DataSource, data: UnifiedData): void {
    this.cache.set(source, {
      data,
      timestamp: Date.now(),
      source,
    });
  }

  get(source: DataSource): UnifiedData | null {
    const entry = this.cache.get(source);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(source);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  clearSource(source: DataSource): void {
    this.cache.delete(source);
  }

  getStats(): { size: number; sources: DataSource[]; timestamps: Record<DataSource, number> } {
    const sources: DataSource[] = [];
    const timestamps: Record<DataSource, number> = {} as any;

    for (const [source, entry] of this.cache.entries()) {
      sources.push(source);
      timestamps[source] = entry.timestamp;
    }

    return {
      size: this.cache.size,
      sources,
      timestamps,
    };
  }
}

// ============================================================================
// UNIFIED DATA SERVICE
// ============================================================================

export class UnifiedDataService {
  private cache = new UnifiedDataCache();
  private context: TransformationContext;

  constructor(context: Partial<TransformationContext> = {}) {
    this.context = {
      source: 'local',
      baseUrl: '/',
      imageBaseUrl: '/src/assets/products/',
      defaultImage: '/placeholder.svg',
      fallbackImage: '/placeholder.svg',
      ...context,
    };
  }

  /**
   * Get unified data from the configured source
   */
  async getUnifiedData(forceRefresh: boolean = false): Promise<UnifiedData> {
    const source = DATA_SOURCE_CONFIG.source;
    
    // Log the active data source prominently
    console.log(`🎯 ACTIVE DATA SOURCE: ${source.toUpperCase()}`);
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = this.cache.get(source);
      if (cachedData) {
        console.log(`📦 Using cached unified data from ${source}`);
        return cachedData;
      }
    }

    console.log(`🔄 Loading unified data from ${source} source...`);

    try {
      let unifiedData: UnifiedData;

      if (isLocalDataSource()) {
        unifiedData = await this.loadFromLocal();
      } else if (isSanityDataSource()) {
        unifiedData = await this.loadFromSanity();
      } else {
        throw new Error(`Unknown data source: ${source}`);
      }

      // Validate the data
      const validation = validateUnifiedData(unifiedData);
      if (!validation.isValid) {
        console.warn('⚠️ Data validation warnings:', validation.errors);
      }

      // Cache the data
      this.cache.set(source, unifiedData);

      console.log(`✅ Unified data loaded from ${source}:`, {
        brands: unifiedData.brands.length,
        categories: unifiedData.categories.length,
        products: unifiedData.products.length,
        metadata: unifiedData.metadata
      });
      
      // Log data source indicators for debugging
      console.log(`🔍 Data source indicators:`, {
        currentSource: source,
        fallbackEnabled: DATA_SOURCE_CONFIG.fallbackToLocal,
        cacheMinutes: DATA_SOURCE_CONFIG.cacheMinutes,
        timestamp: new Date().toISOString()
      });

      return unifiedData;
    } catch (error) {
      console.error(`❌ Failed to load unified data from ${source}:`, error);

      // Try fallback if enabled
      if (isSanityDataSource() && DATA_SOURCE_CONFIG.fallbackToLocal) {
        console.log('🔄 Falling back to local data...');
        return await this.loadFromLocal();
      }

      throw error;
    }
  }

  /**
   * Load data from local JSON source
   */
  private async loadFromLocal(): Promise<UnifiedData> {
    console.log(`📁 Loading data from LOCAL JSON source...`);
    const context = { ...this.context, source: 'local' as const };
    const result = transformLocalToUnified(jawariProducts as any, context);

    if (result.errors.length > 0) {
      console.warn('⚠️ Local data transformation warnings:', result.errors);
    }

    return result.data;
  }

  /**
   * Load data from Sanity CMS source
   */
  private async loadFromSanity(): Promise<UnifiedData> {
    console.log('☁️ Loading data from SANITY CMS source...');
    console.log('🔍 Sanity configuration:', {
      projectId: import.meta.env.VITE_SANITY_PROJECT_ID || 'eaaly2y1',
      dataset: import.meta.env.VITE_SANITY_DATASET || 'products',
      hasToken: !!import.meta.env.VITE_SANITY_TOKEN
    });
    
    const context = { ...this.context, source: 'sanity' as const };

    try {
      // Test connection first
      console.log('🔍 Testing Sanity connection...');
      await client.fetch('*[_type == "product"][0]');
      console.log('✅ Sanity connection successful');

      // Fetch all data from Sanity
      console.log('📥 Fetching data from Sanity...');
      const [products, brands, categories] = await Promise.all([
        client.fetch(queries.getAllProducts),
        client.fetch(queries.getAllBrands),
        client.fetch(queries.getAllCategories),
      ]);

      console.log('✅ Sanity data fetched successfully:', {
        products: products?.length || 0,
        brands: brands?.length || 0,
        categories: categories?.length || 0
      });

      const sanityData = {
        products,
        brands,
        categories,
      };

      const result = transformSanityToUnified(sanityData, context);

      if (result.errors.length > 0) {
        console.warn('⚠️ Sanity data transformation warnings:', result.errors);
      }

      return result.data;
    } catch (error) {
      console.error('❌ Failed to fetch data from Sanity:', error);
      console.error('🔍 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : typeof error
      });
      throw new Error(`Sanity fetch failed: ${error}`);
    }
  }

  /**
   * Get all brands
   */
  async getBrands(): Promise<UnifiedBrand[]> {
    const data = await this.getUnifiedData();
    return data.brands;
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<UnifiedCategory[]> {
    const data = await this.getUnifiedData();
    return data.categories;
  }

  /**
   * Get all products
   */
  async getProducts(): Promise<UnifiedProduct[]> {
    const data = await this.getUnifiedData();
    return data.products;
  }

  /**
   * Get products by brand
   */
  async getProductsByBrand(brandId: string): Promise<UnifiedProduct[]> {
    const products = await this.getProducts();
    return products.filter(product => product.brand.id === brandId);
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId: string): Promise<UnifiedProduct[]> {
    const products = await this.getProducts();
    return products.filter(product => product.category.id === categoryId);
  }

  /**
   * Get products by brand and category
   */
  async getProductsByBrandAndCategory(brandId: string, categoryId: string): Promise<UnifiedProduct[]> {
    const products = await this.getProducts();
    return products.filter(
      product => product.brand.id === brandId && product.category.id === categoryId
    );
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(): Promise<UnifiedProduct[]> {
    const products = await this.getProducts();
    return products.filter(product => product.featured);
  }

  /**
   * Get a single product by ID
   */
  async getProductById(productId: string): Promise<UnifiedProduct | null> {
    const products = await this.getProducts();
    return products.find(product => product.id === productId) || null;
  }

  /**
   * Search products by name or description
   */
  async searchProducts(query: string): Promise<UnifiedProduct[]> {
    const products = await this.getProducts();
    const searchTerm = query.toLowerCase();

    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get products with variants
   */
  async getProductsWithVariants(): Promise<UnifiedProduct[]> {
    const products = await this.getProducts();
    return products.filter(product => product.variants && product.variants.length > 0);
  }

  /**
   * Get products without variants (single variant products)
   */
  async getSingleVariantProducts(): Promise<UnifiedProduct[]> {
    const products = await this.getProducts();
    return products.filter(product => !product.variants || product.variants.length === 0);
  }

  /**
   * Get in-stock products only
   */
  async getInStockProducts(): Promise<UnifiedProduct[]> {
    const products = await this.getProducts();
    return products.filter(product => product.inStock);
  }

  /**
   * Get data organized by brands (for backward compatibility)
   */
  async getDataByBrands(): Promise<UnifiedBrand[]> {
    return await this.getBrands();
  }

  /**
   * Export data to local JSON format
   */
  async exportToLocalFormat(): Promise<any> {
    const unifiedData = await this.getUnifiedData();
    const result = transformUnifiedToLocal(unifiedData);
    
    if (result.errors.length > 0) {
      console.warn('⚠️ Export warnings:', result.errors);
    }

    return result.data;
  }

  /**
   * Get data source information
   */
  getDataSourceInfo() {
    return {
      current: DATA_SOURCE_CONFIG.source,
      isLocal: isLocalDataSource(),
      isSanity: isSanityDataSource(),
      fallbackEnabled: DATA_SOURCE_CONFIG.fallbackToLocal,
      cacheStats: this.cache.getStats(),
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ All caches cleared');
  }

  /**
   * Clear cache for specific source
   */
  clearSourceCache(source: DataSource): void {
    this.cache.clearSource(source);
    console.log(`🗑️ Cache cleared for ${source} source`);
  }

  /**
   * Force refresh data from source
   */
  async refreshData(): Promise<UnifiedData> {
    this.clearCache();
    return await this.getUnifiedData(true);
  }

  /**
   * Test connection to data source
   */
  async testConnection(): Promise<boolean> {
    try {
      if (isLocalDataSource()) {
        // Local data is always available
        return true;
      } else if (isSanityDataSource()) {
        // Test Sanity connection
        await client.fetch('*[_type == "product"][0]');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

/**
 * Default unified data service instance
 */
export const unifiedDataService = new UnifiedDataService();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get unified data (convenience function)
 */
export const getUnifiedData = (forceRefresh?: boolean) => 
  unifiedDataService.getUnifiedData(forceRefresh);

/**
 * Get all products (convenience function)
 */
export const getProducts = () => unifiedDataService.getProducts();

/**
 * Get all brands (convenience function)
 */
export const getBrands = () => unifiedDataService.getBrands();

/**
 * Get all categories (convenience function)
 */
export const getCategories = () => unifiedDataService.getCategories();

/**
 * Get featured products (convenience function)
 */
export const getFeaturedProducts = () => unifiedDataService.getFeaturedProducts();

/**
 * Search products (convenience function)
 */
export const searchProducts = (query: string) => unifiedDataService.searchProducts(query);

/**
 * Get data source info (convenience function)
 */
export const getDataSourceInfo = () => unifiedDataService.getDataSourceInfo();

/**
 * Clear all caches (convenience function)
 */
export const clearAllCaches = () => unifiedDataService.clearCache();

/**
 * Refresh data (convenience function)
 */
export const refreshData = () => unifiedDataService.refreshData();
